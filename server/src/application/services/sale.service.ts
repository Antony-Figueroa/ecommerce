import { NotFoundError, ValidationError } from '../../shared/errors/app.errors.js'
import { SaleRepository, NotificationRepository } from '../../domain/repositories/business.repository.js'
import { ProductRepository } from '../../domain/repositories/product.repository.js'
import { BCVRepository, SettingsRepository } from '../../domain/repositories/settings.repository.js'
import { InventoryLogRepository } from '../../domain/repositories/inventory.repository.js'
import { NotificationService } from './notification.service.js'
import { PaymentService } from './payment.service.js'
import { AuditService } from './audit.service.js'
import { StockManager } from './stock-manager.service.js'
import { SaleCalculator } from './sale-calculator.service.js'
import PDFDocument from 'pdfkit'

function generateSaleNumber(): string {
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `VTA-${year}${month}${day}-${random}`
}

export class SaleService {
  constructor(
    private saleRepo: SaleRepository,
    private productRepo: ProductRepository,
    private bcvRepo: BCVRepository,
    private notificationRepo: NotificationRepository,
    private settingsRepo: SettingsRepository,
    private notificationService: NotificationService,
    private paymentService: PaymentService,
    private auditService: AuditService,
    private stockManager: StockManager,
    private saleCalculator: SaleCalculator,
    private logRepo: InventoryLogRepository
  ) {}

  async createSale(data: any, userId?: string, ipAddress?: string, userAgent?: string) {
    const bcvRate = data.bcvRate || await this.getCurrentBCV()

    // Ensure audit info is merged if passed separately
    if (userId) data.userId = userId;
    if (ipAddress) data.ipAddress = ipAddress;
    if (userAgent) data.userAgent = userAgent;

    // 1. Check for stock availability
    for (const item of data.items) {
      const product = await this.productRepo.findById(item.productId)
      if (!product) {
        throw new NotFoundError(`Producto ${item.productId}`)
      }
      if (product.stock < item.quantity) {
        throw new ValidationError(`Stock insuficiente para el producto ${product.name}. Disponible: ${product.stock}`)
      }
      
      // Point 2: Ensure prices are consistent with catalog
      if (Math.abs(product.price - item.unitPrice) > 0.01) {
        throw new ValidationError(`El precio del producto ${product.name} ha cambiado. Por favor actualiza tu carrito.`)
      }
    }

    // 2. Check for duplicates
    if (data.customerPhone) {
      const duplicate = await this.saleRepo.findDuplicate({
        customerPhone: data.customerPhone,
        totalUSD: data.items.reduce((sum: number, item: any) => sum + (item.quantity * (item.unitPrice || 0)), 0) + (data.shippingCost || 0),
        minutesAgo: 5
      })

      if (duplicate) {
        throw new ValidationError('Ya existe un pedido similar reciente. Por favor espera unos minutos.')
      }
    }

    // 2. Calculate items and totals using SaleCalculator
    const itemsWithTotals = await Promise.all(data.items.map(async (item: any) => {
      const product = await this.productRepo.findById(item.productId)
      return this.saleCalculator.calculateItemTotals(item, product)
    }))

    const totals = this.saleCalculator.calculateSaleTotals(
      itemsWithTotals, 
      data.shippingCost || 0, 
      bcvRate
    )

    // 3. Generate unique sale number
    let saleNumber = generateSaleNumber()
    let attempts = 0
    while (attempts < 10) {
      const existing = await this.saleRepo.findBySaleNumber(saleNumber)
      if (!existing) break
      saleNumber = generateSaleNumber()
      attempts++
    }

    // 4. Create Sale
    const sale = await this.saleRepo.create({
      saleNumber,
      userId: data.userId,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail,
      deliveryAddress: data.deliveryAddress,
      paymentMethod: data.paymentMethod || 'WHATSAPP',
      notes: data.notes,
      subtotalUSD: totals.subtotalUSD,
      shippingCostUSD: data.shippingCost || 0,
      totalUSD: totals.totalUSD,
      bcvRate,
      totalBS: totals.totalBS,
      profitUSD: totals.profitUSD,
      profitBS: totals.profitBS,
      items: {
        create: itemsWithTotals.map(item => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          unitCost: item.unitCost,
          unitPrice: item.unitPrice,
          total: item.total,
          profitPerUnit: item.profitPerUnit,
          totalProfit: item.totalProfit,
        })),
      },
    })

    // 5. System Audit Log (Point 4 - GDPR compliant)
    await this.auditService.logAction({
      entityType: 'SALE',
      entityId: sale.id,
      action: 'CREATE',
      userId: data.userId,
      userName: data.customerName,
      details: { saleNumber, totalUSD: totals.totalUSD },
      ipAddress: data.ipAddress,
      userAgent: data.userAgent
    })

    // 6. Create initial legacy audit log (for compatibility)
    await this.saleRepo.createAuditLog({
      saleId: sale.id,
      action: 'CREATED',
      newStatus: 'PENDING',
      userId: data.userId,
      reason: 'Pedido creado desde el carrito'
    })

    // 7. Notifications
    await this.notificationRepo.create({
      type: 'SALE',
      title: 'Nuevo Pedido Recibido',
      message: `El cliente ${data.customerName} ha realizado un pedido por un total de $${totals.totalUSD.toFixed(2)}.`
    })

    // 8. Stock management using StockManager
    for (const item of itemsWithTotals) {
      await this.stockManager.deductStock(
        item.productId, 
        item.quantity, 
        'Venta', 
        saleNumber
      )
    }

    // 9. Handle initial payment
    if (data.initialPaymentUSD && data.initialPaymentUSD > 0) {
      await this.paymentService.registerPayment({
        saleId: sale.id,
        amountUSD: data.initialPaymentUSD,
        amountBS: data.initialPaymentUSD * bcvRate,
        bcvRate,
        paymentMethod: data.paymentMethod || 'CASH',
        notes: 'Pago inicial al crear la venta'
      })
    }

    if (data.installmentPlan && data.installmentPlan.length > 0) {
      await this.paymentService.createInstallmentPlan(sale.id, data.installmentPlan)
    }

    return sale
  }

  async getSaleById(id: string, userId?: string, ipAddress?: string, userAgent?: string) {
    const sale = await this.saleRepo.findById(id)
    if (!sale) {
      throw new NotFoundError('Venta')
    }

    // Audit log for accessing specific sale details
    await this.auditService.logAction({
      entityType: 'SALE',
      entityId: id,
      action: 'VIEW_DETAILS',
      userId,
      details: { saleNumber: sale.saleNumber },
      ipAddress,
      userAgent
    })

    return sale
  }

  async getAllSales(options?: any, userId?: string, ipAddress?: string, userAgent?: string) {
    // Audit log for accessing all sales (sensitive data)
    await this.auditService.logAction({
      entityType: 'REPORT',
      action: 'VIEW_ALL_SALES',
      userId,
      details: { options },
      ipAddress,
      userAgent
    })

    const { status = null, startDate = null, endDate = null, page = 1, limit = 20 } = options || {}

    const where: any = {}
    if (status) where.status = status
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    const [sales, total] = await Promise.all([
      this.saleRepo.findAll({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.saleRepo.count(where),
    ])

    return {
      sales,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        limit,
      },
    }
  }

  async getSalesByUserId(userId: string, params: any = {}) {
    const { page = 1, limit = 20 } = params
    const skip = (page - 1) * limit

    const [sales, total] = await Promise.all([
      this.saleRepo.findAll({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.saleRepo.count({ userId }),
    ])

    return {
      sales,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        limit,
      },
    }
  }

  async updateSaleStatus(id: string, status: string, userId?: string, reason?: string, financing?: { initialPaymentUSD?: number, installmentPlan?: { amountUSD: number, dueDate: Date }[] }, ipAddress?: string, userAgent?: string) {
    console.log(`Updating sale status for ${id} to ${status}...`)
    const sale = await this.saleRepo.findById(id)
    if (!sale) {
      console.error(`Sale ${id} not found`)
      throw new NotFoundError('Venta')
    }

    const validStatuses = ['PENDING', 'PROCESSING', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED', 'PROPOSED']
    if (!validStatuses.includes(status)) {
      console.error(`Invalid status: ${status}`)
      throw new ValidationError('Estado inválido')
    }

    const oldStatus = sale.status
    
    // Point 3: Logical status transitions
    const statusOrder: Record<string, string[]> = {
      'PENDING': ['PROCESSING', 'ACCEPTED', 'REJECTED', 'CANCELLED'],
      'PROCESSING': ['ACCEPTED', 'REJECTED', 'CANCELLED'],
      'ACCEPTED': ['PROCESSING', 'COMPLETED', 'CANCELLED'],
      'PROPOSED': ['ACCEPTED', 'REJECTED', 'CANCELLED'],
      'REJECTED': ['PENDING'],
      'CANCELLED': [],
      'COMPLETED': []
    }

    if (oldStatus !== status && !statusOrder[oldStatus]?.includes(status)) {
      throw new ValidationError(`Transición de estado inválida de ${oldStatus} a ${status}`)
    }
    
    // Validación: No permitir completar si no está pagado
    if (status === 'COMPLETED' && !sale.isPaid) {
      console.warn(`Attempted to complete unpaid sale ${id}`)
      throw new ValidationError('No se puede marcar como completada una orden que no ha sido pagada. Por favor, confirma el pago primero.')
    }

    // Lógica de Financiamiento al Aceptar
    if (status === 'ACCEPTED' && financing) {
      const bcvRate = sale.bcvRate || await this.getCurrentBCV()
      
      // 1. Registrar Pago Inicial si existe
      if (financing.initialPaymentUSD && financing.initialPaymentUSD > 0) {
        await this.paymentService.registerPayment({
          saleId: id,
          amountUSD: financing.initialPaymentUSD,
          amountBS: financing.initialPaymentUSD * bcvRate,
          bcvRate,
          paymentMethod: 'CASH', // O el método que se defina
          notes: 'Pago inicial al aceptar el pedido'
        }, userId, ipAddress, userAgent)
      }

      // 2. Crear Plan de Cuotas si existe
      if (financing.installmentPlan && financing.installmentPlan.length > 0) {
        await this.paymentService.createInstallmentPlan(id, financing.installmentPlan, userId, ipAddress, userAgent)
      }
    }

    console.log(`Updating database record for sale ${id}...`)
    const updatedSale = await this.saleRepo.update(id, { status })

    // GDPR Compliant Audit
    await this.auditService.logAction({
      entityType: 'SALE',
      entityId: id,
      action: 'STATUS_CHANGE',
      userId,
      details: { oldStatus, newStatus: status, reason },
      ipAddress,
      userAgent
    })

    // Create legacy audit log for status change
    console.log(`Creating audit log for sale ${id}...`)
    await this.saleRepo.createAuditLog({
      saleId: id,
      action: 'STATUS_CHANGE',
      oldStatus,
      newStatus: status,
      userId,
      reason
    })

    // Create in-app notification for Client
    if (updatedSale.userId) {
      try {
        console.log(`Creating in-app notification for user ${updatedSale.userId}...`)
        const statusLabel = status === 'ACCEPTED' ? 'aceptado ✅' : 
                            status === 'REJECTED' ? 'rechazado ❌' : 
                            status === 'PROCESSING' ? 'en proceso ⏳' : 
                            status === 'COMPLETED' ? 'completado ✨' : 
                            status === 'CANCELLED' ? 'cancelado 🚫' : 
                            status === 'PROPOSED' ? 'modificado (propuesta del proveedor) 📝' : status.toLowerCase()

        await this.notificationService.createNotification({
          type: 'ORDER_STATUS',
          category: 'ORDERS',
          priority: status === 'REJECTED' || status === 'CANCELLED' ? 'URGENT' : 'NORMAL',
          title: 'Actualización de Pedido',
          message: `Tu pedido #${updatedSale.saleNumber} ha sido ${statusLabel}.`,
          userId: updatedSale.userId,
          link: `/pedidos?id=${updatedSale.id}`,
          metadata: JSON.stringify({ saleId: updatedSale.id, status })
        })
      } catch (error) {
        console.error('Error creating in-app notification for client:', error)
      }
    }

    // Notify Client via WhatsApp about status change
    try {
      if (updatedSale.customerPhone) {
        const statusLabel = status === 'ACCEPTED' ? 'ACEPTADO ✅' : 
                            status === 'REJECTED' ? 'RECHAZADO ❌' : 
                            status === 'PROCESSING' ? 'EN PROCESO ⏳' : 
                            status === 'COMPLETED' ? 'COMPLETADO ✨' : 
                            status === 'PROPOSED' ? 'MODIFICADO (PROPUESTA) 📝' : status
        
        let whatsappMessage = `*Actualización de tu pedido en Ana's Supplements* 🛍️\n\n` +
          `Hola *${updatedSale.customerName}*,\n\n` +
          `Tu pedido *#${updatedSale.saleNumber}* ha cambiado de estado a: *${statusLabel}*.\n`
        
        if (reason) {
          whatsappMessage += `\n*Nota:* ${reason}\n`
        }

        if (status === 'ACCEPTED') {
          whatsappMessage += `\nEstamos preparando tus productos. Te avisaremos cuando estén listos para entrega/envío.`
        } else if (status === 'PROPOSED') {
          whatsappMessage += `\nEl proveedor ha modificado algunos productos de tu pedido. Por favor, revisa la propuesta en nuestra web y confírmanos si deseas continuar.`
          whatsappMessage += `\nVer propuesta: ${process.env.FRONTEND_URL}/pedidos?id=${updatedSale.id}`
        }

        whatsappMessage += `\n\n¡Gracias por preferirnos!`

        console.log(`[WhatsApp Client Notification] To: ${updatedSale.customerPhone}, Message: ${whatsappMessage}`)
      }
    } catch (error) {
      console.error('Error sending WhatsApp notification to client:', error)
    }

    return updatedSale
  }

  async updateSaleItemQuantity(saleId: string, itemId: string, quantity: number, userId?: string, ipAddress?: string, userAgent?: string) {
    const sale = await this.saleRepo.findById(saleId)
    if (!sale) {
      throw new NotFoundError('Venta')
    }

    const item = sale.items.find((i: any) => i.id === itemId)
    if (!item) {
      throw new NotFoundError('Item de venta')
    }

    if (quantity <= 0) {
      throw new ValidationError('La cantidad debe ser mayor a 0')
    }

    if (quantity > (item.originalQuantity || item.quantity)) {
      throw new ValidationError('No puedes aumentar la cantidad original solicitada')
    }

    const oldQuantity = item.quantity
    if (oldQuantity === quantity) return item

    // Si no tiene originalQuantity, la guardamos ahora
    const updateData: any = { 
      quantity,
      total: quantity * Number(item.unitPrice),
      totalProfit: quantity * Number(item.profitPerUnit)
    }
    
    if (!item.originalQuantity) {
      updateData.originalQuantity = oldQuantity
    }

    const updatedItem = await this.saleRepo.updateItem(itemId, updateData)

    // Audit the item quantity change
    await this.auditService.logAction({
      entityType: 'SALE_ITEM',
      entityId: itemId,
      action: 'UPDATE_QUANTITY',
      userId,
      details: { 
        saleId, 
        saleNumber: sale.saleNumber, 
        oldQuantity, 
        newQuantity: quantity,
        productName: item.name
      },
      ipAddress,
      userAgent
    })

    // Ajustar stock: devolvemos la diferencia al inventario
    const diff = oldQuantity - quantity
    if (diff !== 0) {
      const product = await this.productRepo.findById(item.productId)
      if (product) {
        const previousStock = product.stock
        const newStock = previousStock + diff

        await this.productRepo.update(item.productId, {
          stock: newStock,
          inStock: newStock > 0,
        })

        await this.logRepo.create({
          productId: item.productId,
          changeType: 'SALE_ITEM_QTY_ADJUSTED',
          previousStock,
          newStock,
          changeAmount: diff,
          reason: `Cantidad de item en venta ${sale.saleNumber} ajustada de ${oldQuantity} a ${quantity}`,
        })
      }
    }

    // Recalcular totales de la venta
    const allItems = await this.saleRepo.findById(saleId).then(s => s.items)
    const activeItems = allItems.filter((i: any) => i.status === 'ACCEPTED')
    
    const subtotalUSD = activeItems.reduce((sum: number, i: any) => sum + Number(i.total), 0)
    const totalUSD = subtotalUSD + Number(sale.shippingCostUSD)
    const bcvRate = Number(sale.bcvRate)
    const totalBS = totalUSD * bcvRate
    const profitUSD = activeItems.reduce((sum: number, i: any) => sum + Number(i.totalProfit), 0)
    const profitBS = profitUSD * bcvRate

    await this.saleRepo.update(saleId, {
      subtotalUSD,
      totalUSD,
      totalBS,
      profitUSD,
      profitBS
    })

    // Crear log de auditoría
    await this.saleRepo.createAuditLog({
      saleId,
      action: 'ITEM_QTY_CHANGE',
      userId,
      reason: `Cantidad de "${item.name}" cambiada de ${oldQuantity} a ${quantity}`
    })

    return updatedItem
  }

  async updateSaleItemStatus(saleId: string, itemId: string, status: string, userId?: string, ipAddress?: string, userAgent?: string) {
    const sale = await this.saleRepo.findById(saleId)
    if (!sale) {
      throw new NotFoundError('Venta')
    }

    const item = sale.items.find((i: any) => i.id === itemId)
    if (!item) {
      throw new NotFoundError('Item de venta')
    }

    const validItemStatuses = ['ACCEPTED', 'REJECTED']
    if (!validItemStatuses.includes(status)) {
      throw new ValidationError('Estado de item inválido')
    }

    const oldStatus = item.status
    if (oldStatus === status) return item

    const updatedItem = await this.saleRepo.updateItem(itemId, { status })

    // Audit the item status change
    await this.auditService.logAction({
      entityType: 'SALE_ITEM',
      entityId: itemId,
      action: 'UPDATE_STATUS',
      userId,
      details: { 
        saleId, 
        saleNumber: sale.saleNumber, 
        oldStatus, 
        newStatus: status,
        productName: item.name
      },
      ipAddress,
      userAgent
    })

    // Si el item se rechaza, devolvemos el stock
    if (status === 'REJECTED') {
      await this.stockManager.addStock(
        item.productId, 
        item.quantity, 
        'Item de venta rechazado', 
        sale.saleNumber
      )
    } else if (status === 'ACCEPTED' && oldStatus === 'REJECTED') {
      // Si antes estaba rechazado y ahora se acepta, descontamos stock de nuevo
      await this.stockManager.deductStock(
        item.productId, 
        item.quantity, 
        'Item de venta aceptado (reversión de rechazo)', 
        sale.saleNumber
      )
    }

    // Recalcular totales de la venta
    const allItems = await this.saleRepo.findById(saleId).then(s => s.items)
    const activeItems = allItems.filter((i: any) => i.status === 'ACCEPTED')
    
    const subtotalUSD = activeItems.reduce((sum: number, i: any) => sum + Number(i.total), 0)
    const totalUSD = subtotalUSD + Number(sale.shippingCostUSD)
    const bcvRate = Number(sale.bcvRate)
    const totalBS = totalUSD * bcvRate
    const profitUSD = activeItems.reduce((sum: number, i: any) => sum + Number(i.totalProfit), 0)
    const profitBS = profitUSD * bcvRate

    await this.saleRepo.update(saleId, {
      subtotalUSD,
      totalUSD,
      totalBS,
      profitUSD,
      profitBS
    })

    // Crear log de auditoría
    await this.saleRepo.createAuditLog({
      saleId,
      action: 'ITEM_STATUS_CHANGE',
      userId,
      reason: `Producto "${item.name}" cambiado a ${status === 'ACCEPTED' ? 'ACEPTADO' : 'RECHAZADO'}`
    })

    return updatedItem
  }

  async acceptAllItems(saleId: string, userId?: string, ipAddress?: string, userAgent?: string) {
    const sale = await this.saleRepo.findById(saleId)
    if (!sale) {
      throw new NotFoundError('Venta')
    }

    const itemsToUpdate = sale.items.filter((i: any) => i.status !== 'ACCEPTED')
    
    for (const item of itemsToUpdate) {
      await this.updateSaleItemStatus(saleId, item.id, 'ACCEPTED', userId, ipAddress, userAgent)
    }

    return this.saleRepo.findById(saleId)
  }

  async updateDeliveryStatus(id: string, deliveryStatus: string, userId?: string, reason?: string, ipAddress?: string, userAgent?: string) {
    console.log(`Updating delivery status for ${id} to ${deliveryStatus}...`)
    const sale = await this.saleRepo.findById(id)
    if (!sale) {
      console.error(`Sale ${id} not found`)
      throw new NotFoundError('Venta')
    }

    const validStatuses = ['NOT_DELIVERED', 'IN_TRANSIT', 'DELIVERED']
    if (!validStatuses.includes(deliveryStatus)) {
      console.error(`Invalid delivery status: ${deliveryStatus}`)
      throw new ValidationError('Estado de entrega inválido')
    }

    const oldDeliveryStatus = sale.deliveryStatus
    console.log(`Updating database record for sale ${id} delivery status...`)
    const updatedSale = await this.saleRepo.update(id, { deliveryStatus })

    // Create audit log for delivery status change
    console.log(`Creating audit log for sale ${id} delivery status...`)
    await this.auditService.logAction({
      entityType: 'SALE',
      entityId: id,
      action: 'UPDATE_DELIVERY_STATUS',
      userId,
      details: { oldDeliveryStatus, newDeliveryStatus: deliveryStatus, reason },
      ipAddress,
      userAgent
    })

    await this.saleRepo.createAuditLog({
      saleId: id,
      action: 'DELIVERY_STATUS_CHANGE',
      oldDeliveryStatus,
      newDeliveryStatus: deliveryStatus,
      userId,
      reason
    })

    // Notify Client via WhatsApp about delivery status change
    try {
      if (updatedSale.customerPhone) {
        const statusLabel = deliveryStatus === 'DELIVERED' ? 'ENTREGADO ✅' : 
                            deliveryStatus === 'NOT_DELIVERED' ? 'PENDIENTE DE ENTREGA 📦' : deliveryStatus
        
        let whatsappMessage = `*Actualización de entrega - Ana's Supplements* 🚚\n\n` +
          `Hola *${updatedSale.customerName}*,\n\n` +
          `Tu pedido *#${updatedSale.saleNumber}* ha cambiado su estado de entrega a: *${statusLabel}*.\n`
        
        if (reason) {
          whatsappMessage += `\n*Nota:* ${reason}\n`
        }

        if (deliveryStatus === 'DELIVERED') {
          whatsappMessage += `\nEsperamos que disfrutes tus productos. ¡Gracias por confiar en nosotros!`
        }

        whatsappMessage += `\n\n¡Feliz día!`

        console.log(`[WhatsApp Client Notification] To: ${updatedSale.customerPhone}, Message: ${whatsappMessage}`)
      }
    } catch (error) {
      console.error('Error sending WhatsApp notification to client:', error)
    }

    return updatedSale
  }

  async confirmPayment(id: string, amount: number, userId?: string, reason?: string, ipAddress?: string, userAgent?: string) {
    const sale = await this.saleRepo.findById(id)
    if (!sale) {
      throw new NotFoundError('Venta')
    }

    const oldStatus = sale.status
    const updatedSale = await this.saleRepo.update(id, {
      status: 'COMPLETED',
      isPaid: true,
      paidAmountUSD: amount
    })

    // Create audit log for payment confirmation
    await this.auditService.logAction({
      entityType: 'SALE',
      entityId: id,
      action: 'CONFIRM_PAYMENT',
      userId,
      details: { amount, reason, oldStatus, newStatus: 'COMPLETED' },
      ipAddress,
      userAgent
    })

    await this.saleRepo.createAuditLog({
      saleId: id,
      action: 'PAYMENT_CONFIRMED',
      oldStatus,
      newStatus: 'COMPLETED',
      userId,
      reason: reason || `Pago confirmado por un monto de $${amount.toFixed(2)}`
    })

    // Create in-app notification for Client
    if (updatedSale.userId) {
      try {
        await this.notificationRepo.create({
          type: 'SALE_STATUS',
          title: 'Pago Confirmado',
          message: `Tu pedido #${updatedSale.saleNumber} ha sido pagado y completado. ✨`,
          userId: updatedSale.userId
        })
      } catch (error) {
        console.error('Error creating in-app notification for client:', error)
      }
    }

    // Notify Client via WhatsApp
    try {
      if (updatedSale.customerPhone) {
        const whatsappMessage = `*¡Pago Confirmado!* ✨ Ana's Supplements\n\n` +
          `Hola *${updatedSale.customerName}*,\n\n` +
          `Hemos recibido tu pago por un monto de *$${amount.toFixed(2)}* para el pedido *#${updatedSale.saleNumber}*.\n` +
          `Tu pedido ha sido marcado como *COMPLETADO*.\n\n` +
          `¡Gracias por tu compra! Te esperamos pronto.`

        console.log(`[WhatsApp Client Notification] To: ${updatedSale.customerPhone}, Message: ${whatsappMessage}`)
      }
    } catch (error) {
      console.error('Error sending WhatsApp notification to client:', error)
    }

    return updatedSale
  }

  async respondToProposal(id: string, status: 'ACCEPTED' | 'REJECTED', userId: string) {
    const sale = await this.saleRepo.findById(id)
    if (!sale) {
      throw new NotFoundError('Venta')
    }

    if (sale.userId !== userId) {
      throw new ValidationError('No tienes permiso para responder a esta propuesta')
    }

    if (sale.status !== 'PROPOSED') {
      throw new ValidationError('Este pedido no tiene una propuesta pendiente')
    }

    if (status === 'ACCEPTED') {
      // Si el cliente acepta, el pedido pasa a ser procesado
      // Primero nos aseguramos de que el estado de los items sea definitivo
      // Los items REJECTED ya devolvieron stock en updateSaleItemStatus
      
      await this.updateSaleStatus(id, 'PROCESSING', userId, 'Cliente aceptó la propuesta del proveedor')
      
      // Registrar en la auditoría que se aceptó la versión final de los productos
      const acceptedItems = sale.items
        .filter((item: any) => item.status === 'ACCEPTED')
        .map((item: any) => `${item.name} (x${item.quantity})`)
        .join(', ')

      await this.saleRepo.createAuditLog({
        saleId: id,
        action: 'PROPOSAL_ACCEPTED',
        userId,
        reason: `Productos finales aceptados: ${acceptedItems}. Registro original preservado en originalQuantity.`
      })
    } else {
      // Si el cliente rechaza, cancelamos todo el pedido
      await this.updateSaleStatus(id, 'CANCELLED', userId, 'Cliente rechazó la propuesta del proveedor')
      
      // Devolver stock de los items que estaban aceptados (los rechazados ya se devolvieron)
      for (const item of sale.items) {
        if (item.status === 'ACCEPTED') {
          const product = await this.productRepo.findById(item.productId)
          if (product) {
            const previousStock = product.stock
            const newStock = previousStock + item.quantity

            await this.productRepo.update(item.productId, {
              stock: newStock,
              inStock: true,
            })

            await this.logRepo.create({
              productId: item.productId,
              changeType: 'CANCELLED_SALE_ITEM',
              previousStock,
              newStock,
              changeAmount: item.quantity,
              reason: `Venta ${sale.saleNumber} cancelada por el cliente (rechazo de propuesta)`,
            })
          }
        }
      }
    }

    // Notificar al admin sobre la decisión del cliente
    try {
      // Notificación in-app para el administrador
      await this.notificationService.createNotification({
        type: 'ORDER_PROPOSAL_RESPONSE',
        category: 'ORDERS',
        priority: 'URGENT',
        title: `Propuesta ${status === 'ACCEPTED' ? 'Aceptada' : 'Rechazada'}`,
        message: `El cliente ${sale.customerName} ha ${status === 'ACCEPTED' ? 'aceptado' : 'rechazado'} la propuesta para el pedido #${sale.saleNumber}.`,
        link: `/admin/orders?id=${sale.id}`,
        metadata: JSON.stringify({ saleId: sale.id, status, saleNumber: sale.saleNumber })
      })

      const adminPhoneSetting = await this.settingsRepo.findByKey('whatsapp_number')
      const adminPhone = adminPhoneSetting?.value

      if (adminPhone) {
        const whatsappMessage = `*Respuesta a Propuesta de Pedido* 📩\n\n` +
          `El cliente *${sale.customerName}* ha *${status === 'ACCEPTED' ? 'ACEPTADO' : 'RECHAZADO'}* la propuesta del pedido *#${sale.saleNumber}*.\n\n` +
          `Ver detalles: ${process.env.FRONTEND_URL}/admin/orders?id=${sale.id}`

        console.log(`[WhatsApp Admin Notification] To: ${adminPhone}, Message: ${whatsappMessage}`)
      }
    } catch (error) {
      console.error('Error sending notifications to admin about proposal response:', error)
    }

    return this.saleRepo.findById(id)
  }

  async cancelSale(id: string, userId?: string, reason?: string, ipAddress?: string, userAgent?: string) {
    const sale = await this.getSaleById(id)

    if (sale.status === 'CANCELLED') {
      throw new ValidationError('La venta ya está cancelada')
    }

    for (const item of sale.items) {
      if (item.status === 'REJECTED') continue

      await this.stockManager.addStock(
        item.productId, 
        item.quantity, 
        'Venta cancelada', 
        sale.saleNumber
      )
    }

    const oldStatus = sale.status

    // Audit log
    await this.auditService.logAction({
      entityType: 'SALE',
      entityId: id,
      action: 'CANCEL',
      userId,
      details: { reason, oldStatus, newStatus: 'CANCELLED' },
      ipAddress,
      userAgent
    })

    // Create audit log for cancellation
    await this.saleRepo.createAuditLog({
      saleId: id,
      action: 'CANCELLED',
      oldStatus: sale.status,
      newStatus: 'CANCELLED',
      userId,
      reason: reason || 'Venta cancelada por el usuario o sistema'
    })

    const updatedSale = await this.saleRepo.update(id, { status: 'CANCELLED' })

    // Notificar al admin sobre la cancelación si fue hecha por un cliente
    if (userId && userId === sale.userId) {
      try {
        await this.notificationService.createNotification({
          type: 'ORDER_CANCELLED',
          category: 'ORDERS',
          priority: 'URGENT',
          title: 'Pedido Cancelado por el Cliente',
          message: `El cliente ${sale.customerName} ha cancelado el pedido #${sale.saleNumber}.`,
          link: `/admin/orders?id=${sale.id}`,
          metadata: JSON.stringify({ saleId: sale.id, saleNumber: sale.saleNumber })
        })

        const adminPhoneSetting = await this.settingsRepo.findByKey('whatsapp_number')
        const adminPhone = adminPhoneSetting?.value

        if (adminPhone) {
          const whatsappMessage = `*Pedido Cancelado* 🚫\n\n` +
            `El cliente *${sale.customerName}* ha cancelado el pedido *#${sale.saleNumber}*.\n\n` +
            `Ver detalles: ${process.env.FRONTEND_URL}/admin/orders?id=${sale.id}`

          console.log(`[WhatsApp Admin Notification] To: ${adminPhone}, Message: ${whatsappMessage}`)
        }
      } catch (error) {
        console.error('Error sending notifications to admin about order cancellation:', error)
      }
    }

    return updatedSale
  }

  async getCurrentBCV(): Promise<number> {
    return this.bcvRepo.getCurrentRate()
  }

  async getSalesSummary(options?: any, userId?: string, ipAddress?: string, userAgent?: string) {
    // Audit log for accessing sales summary (sensitive data)
    await this.auditService.logAction({
      entityType: 'REPORT',
      action: 'VIEW_SALES_SUMMARY',
      userId,
      details: { options },
      ipAddress,
      userAgent
    })

    const sales = await this.saleRepo.getSummary(options || {})

    const completedSalesData = (sales || []).filter((s: any) => s.status === 'COMPLETED')

    const totals = {
      subtotalUSD: completedSalesData.reduce((sum: number, s: any) => sum + Number(s.subtotalUSD || 0), 0),
      shippingCostUSD: completedSalesData.reduce((sum: number, s: any) => sum + Number(s.shippingCostUSD || 0), 0),
      totalUSD: completedSalesData.reduce((sum: number, s: any) => sum + Number(s.totalUSD || 0), 0),
      totalBS: completedSalesData.reduce((sum: number, s: any) => sum + Number(s.totalBS || 0), 0),
      profitUSD: completedSalesData.reduce((sum: number, s: any) => sum + Number(s.profitUSD || 0), 0),
      profitBS: completedSalesData.reduce((sum: number, s: any) => sum + Number(s.profitBS || 0), 0),
    }

    const totalItems = (sales || []).reduce((sum: number, sale: any) => {
      return sum + (sale.items || []).reduce((itemSum: number, item: any) => itemSum + (item.quantity || 0), 0)
    }, 0)

    const completedSalesCount = (sales || []).filter((s: any) => s.status === 'COMPLETED').length
    const pendingSalesCount = (sales || []).filter((s: any) => s.status === 'PENDING').length

    return {
      totalSales: (sales || []).length,
      completedSales: completedSalesCount,
      pendingSales: pendingSalesCount,
      totalItems,
      summaryUSD: {
        subtotal: totals.subtotalUSD,
        shipping: totals.shippingCostUSD,
        total: totals.totalUSD,
      },
      summaryBS: {
        total: totals.totalBS,
      },
      profitUSD: totals.profitUSD,
      profitBS: totals.profitBS,
    }
  }

  async getRecentSales(limit = 10, userId?: string, ipAddress?: string, userAgent?: string) {
    // Audit log for accessing recent sales (dashboard)
    await this.auditService.logAction({
      entityType: 'DASHBOARD',
      action: 'VIEW_RECENT_SALES',
      userId,
      details: { limit },
      ipAddress,
      userAgent
    })

    return this.saleRepo.findAll({
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  async generateInvoicePDF(id: string, userId?: string, ipAddress?: string, userAgent?: string): Promise<Buffer> {
    const sale = await this.saleRepo.findById(id)
    if (!sale) {
      throw new NotFoundError('Venta')
    }

    // Audit log for generating invoice PDF (sensitive document)
    await this.auditService.logAction({
      entityType: 'SALE',
      entityId: id,
      action: 'GENERATE_INVOICE',
      userId,
      details: { saleNumber: sale.saleNumber },
      ipAddress,
      userAgent
    })

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 })
      const buffers: Buffer[] = []

      doc.on('data', buffers.push.bind(buffers))
      doc.on('end', () => resolve(Buffer.concat(buffers)))
      doc.on('error', reject)

      // Header
      doc.fontSize(20).text('Ana\'s Supplements', { align: 'center' })
      doc.fontSize(10).text('RIF: J-12345678-9', { align: 'center' })
      doc.text('Dirección: Valencia, Carabobo', { align: 'center' })
      doc.moveDown()

      doc.fontSize(16).text(`FACTURA #${sale.saleNumber}`, { align: 'right' })
      doc.fontSize(10).text(`Fecha: ${new Date(sale.createdAt).toLocaleDateString()}`, { align: 'right' })
      doc.moveDown()

      // Customer Info
      doc.fontSize(12).text('DATOS DEL CLIENTE', { underline: true })
      doc.fontSize(10).text(`Nombre: ${sale.customerName}`)
      doc.text(`Teléfono: ${sale.customerPhone || 'N/A'}`)
      doc.text(`Email: ${sale.customerEmail || 'N/A'}`)
      doc.text(`Dirección: ${sale.deliveryAddress || 'N/A'}`)
      doc.moveDown()

      // Table Header
      const tableTop = doc.y
      doc.fontSize(10)
      doc.text('Producto', 50, tableTop)
      doc.text('Cant.', 250, tableTop, { width: 50, align: 'right' })
      doc.text('Precio ($)', 300, tableTop, { width: 100, align: 'right' })
      doc.text('Total ($)', 400, tableTop, { width: 100, align: 'right' })
      doc.moveDown()
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke()
      doc.moveDown(0.5)

      // Table Items
      sale.items.forEach((item: any) => {
        const y = doc.y
        doc.text(item.name, 50, y, { width: 200 })
        doc.text(item.quantity.toString(), 250, y, { width: 50, align: 'right' })
        doc.text(item.unitPrice.toFixed(2), 300, y, { width: 100, align: 'right' })
        doc.text(item.total.toFixed(2), 400, y, { width: 100, align: 'right' })
        doc.moveDown()
      })

      doc.moveDown()
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke()
      doc.moveDown()

      // Totals
      const totalsY = doc.y
      doc.text('Subtotal:', 350, totalsY, { width: 100, align: 'right' })
      doc.text(`$${sale.subtotalUSD.toFixed(2)}`, 450, totalsY, { width: 100, align: 'right' })
      
      doc.text('Envío:', 350, doc.y, { width: 100, align: 'right' })
      doc.text(`$${(sale.shippingCostUSD || 0).toFixed(2)}`, 450, doc.y, { width: 100, align: 'right' })
      
      doc.fontSize(12).font('Helvetica-Bold').text('TOTAL USD:', 350, doc.y, { width: 100, align: 'right' })
      doc.text(`$${sale.totalUSD.toFixed(2)}`, 450, doc.y, { width: 100, align: 'right' })
      
      doc.fontSize(10).font('Helvetica').moveDown()
      doc.text(`Tasa BCV: ${sale.bcvRate.toFixed(2)} Bs/$`, 350, doc.y, { width: 100, align: 'right' })
      doc.font('Helvetica-Bold').text('TOTAL BS:', 350, doc.y, { width: 100, align: 'right' })
      doc.text(`${sale.totalBS.toFixed(2)} Bs`, 450, doc.y, { width: 100, align: 'right' })
      doc.font('Helvetica')

      // Footer
      doc.moveDown(2)
      doc.fontSize(8).fillColor('gray').text('Gracias por su compra. Esta es una factura generada digitalmente.', { align: 'center' })

      doc.end()
    })
  }
}
