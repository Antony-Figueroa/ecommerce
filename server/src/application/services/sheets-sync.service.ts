import { google } from 'googleapis'
import { prisma } from '../../infrastructure/persistence/prisma.client.js'
import { ValidationError } from '../../shared/errors/app.errors.js'

interface SyncConfig {
  spreadsheetId: string
  serviceAccountEmail: string
  privateKey: string
  intervalMinutes: number
}

interface SyncStatus {
  lastSync: Date | null
  products: number
  inventory: number
  sales: number
  pending: number
  errors: string[]
}

class SheetsSyncService {
  private auth: any = null
  private sheets: any = null
  private config: SyncConfig | null = null
  private syncInterval: NodeJS.Timeout | null = null
  private status: SyncStatus = {
    lastSync: null,
    products: 0,
    inventory: 0,
    sales: 0,
    pending: 0,
    errors: []
  }

  async initialize() {
    const sheetId = process.env.GOOGLE_SHEET_ID
    const serviceEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
    let privateKey = process.env.GOOGLE_PRIVATE_KEY || ''
    
    // Reemplazar los escaped newlines con saltos de línea reales
    privateKey = privateKey.replace(/\\n/g, '\n')
    
    const intervalMinutes = parseInt(process.env.SYNC_INTERVAL_MINUTES || '10')

    if (!sheetId || sheetId === 'YOUR_SHEET_ID_HERE') {
      console.log('[SheetsSync] ⚠️ GOOGLE_SHEET_ID no configurado')
      return
    }

    if (!serviceEmail || !privateKey) {
      console.log('[SheetsSync] ⚠️ Credenciales de Google no configuradas')
      console.log('[SheetsSync] Email:', serviceEmail ? '✓' : '✗')
      console.log('[SheetsSync] Key:', privateKey ? '✓' : '✗')
      return
    }

    this.config = {
      spreadsheetId: sheetId,
      serviceAccountEmail: serviceEmail,
      privateKey,
      intervalMinutes
    }

    console.log('[SheetsSync] 📧 Email:', serviceEmail)
    console.log('[SheetsSync] 🔑 Key length:', privateKey.length)

    try {
      // Usar fromJSON que es el método moderno
      const credentials = {
        type: 'service_account',
        client_email: serviceEmail,
        private_key: privateKey
      }
      
      this.auth = google.auth.fromJSON(credentials) as any
      this.auth.scopes = ['https://www.googleapis.com/auth/spreadsheets']

      this.sheets = google.sheets({ version: 'v4', auth: this.auth })

      await this.auth.authorize()
      console.log('[SheetsSync] ✅ Servicio autenticado correctamente')

      this.startIntervalSync()
      console.log(`[SheetsSync] 🔄 Sincronización cada ${intervalMinutes} minutos`)
    } catch (error) {
      console.error('[SheetsSync] ❌ Error al inicializar:', error)
      this.status.errors.push(`Error de autenticación: ${error}`)
    }
  }

  private startIntervalSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }

    const intervalMs = (this.config?.intervalMinutes || 10) * 60 * 1000
    this.syncInterval = setInterval(() => {
      this.runFullSync().catch(console.error)
    }, intervalMs)

    this.runFullSync().catch(console.error)
  }

  async runFullSync() {
    if (!this.sheets || !this.config) {
      console.log('[SheetsSync] ⚠️ Servicio no inicializado')
      return
    }

    console.log('[SheetsSync] 🔄 Iniciando sincronización completa...')
    this.status.errors = []

    try {
      await Promise.all([
        this.syncProducts(),
        this.syncInventory(),
        this.syncSales(),
        this.syncPending()
      ])

      this.status.lastSync = new Date()
      console.log('[SheetsSync] ✅ Sincronización completada')
    } catch (error) {
      console.error('[SheetsSync] ❌ Error en sincronización:', error)
      this.status.errors.push(`${error}`)
    }
  }

  async syncProducts() {
    if (!this.sheets || !this.config) return

    try {
      const products = await prisma.product.findMany({
        include: {
          categories: true,
          brandRelation: true
        },
        where: { isActive: true },
        orderBy: { name: 'asc' }
      })

      const rows = products.map((p: any) => [
        p.sku,
        p.name,
        Number(p.price),
        p.isActive ? 'Sí' : 'No',
        p.isFeatured ? 'Sí' : 'No',
        p.isOffer ? 'Sí' : 'No',
        p.brandRelation?.name || p.brand || '',
        p.categories.map((c: any) => c.name).join(', ')
      ])

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.config.spreadsheetId,
        range: 'Productos!A2:Z',
        valueInputOption: 'RAW',
        requestBody: { values: rows }
      })

      this.status.products = products.length
      console.log(`[SheetsSync] 📦 ${products.length} productos sincronizados`)
    } catch (error) {
      console.error('[SheetsSync] ❌ Error sincronizando productos:', error)
      this.status.errors.push(`Productos: ${error}`)
    }
  }

  async syncInventory() {
    if (!this.sheets || !this.config) return

    try {
      const products = await prisma.product.findMany({
        include: {
          categories: true,
          brandRelation: true,
          inventoryBatchItems: {
            include: {
              batch: {
                include: { provider: true }
              }
            }
          }
        },
        where: { isActive: true },
        orderBy: { name: 'asc' }
      })

      const rows: any[][] = []

      for (const p of products) {
        const totalStock = p.stock
        const avgCost = p.purchasePrice ? Number(p.purchasePrice) : 0

        if (p.inventoryBatchItems && p.inventoryBatchItems.length > 0) {
          for (const item of p.inventoryBatchItems) {
            rows.push([
              p.sku,
              p.name,
              item.quantity - item.soldQuantity,
              p.minStock,
              Number(item.unitCostUSD),
              Number(p.price),
              p.categories.map((c: any) => c.name).join(', ') || '',
              p.brandRelation?.name || p.brand || '',
              item.batch?.provider?.name || 'Sin proveedor',
              item.batch?.code || '',
              item.entryDate ? new Date(item.entryDate).toLocaleDateString() : ''
            ])
          }
        } else {
          rows.push([
            p.sku,
            p.name,
            totalStock,
            p.minStock,
            avgCost,
            Number(p.price),
            p.categories.map((c: any) => c.name).join(', ') || '',
            p.brandRelation?.name || p.brand || '',
            'Sin proveedor',
            '',
            ''
          ])
        }
      }

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.config.spreadsheetId,
        range: 'Inventario!A2:Z',
        valueInputOption: 'RAW',
        requestBody: { values: rows }
      })

      this.status.inventory = products.length
      console.log(`[SheetsSync] 📦 ${products.length} registros de inventario sincronizados`)
    } catch (error) {
      console.error('[SheetsSync] ❌ Error sincronizando inventario:', error)
      this.status.errors.push(`Inventario: ${error}`)
    }
  }

  async syncSales() {
    if (!this.sheets || !this.config) return

    try {
      const sales = await prisma.sale.findMany({
        select: {
          id: true,
          saleNumber: true,
          createdAt: true,
          customerName: true,
          customerPhone: true,
          totalUSD: true,
          status: true,
          paymentMethod: true,
          profitUSD: true,
          items: {
            select: {
              name: true,
              quantity: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 500
      })

      const rows = sales.map((s: any) => [
        s.saleNumber,
        new Date(s.createdAt).toLocaleDateString(),
        s.customerName || 'Cliente',
        s.customerPhone || '',
        Number(s.totalUSD),
        s.status,
        s.paymentMethod,
        Number(s.profitUSD),
        s.items?.map((i: any) => `${i.name} (${i.quantity})`).join(', ') || ''
      ])

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.config.spreadsheetId,
        range: 'Ventas!A2:Z',
        valueInputOption: 'RAW',
        requestBody: { values: rows }
      })

      this.status.sales = sales.length
      console.log(`[SheetsSync] 💰 ${sales.length} ventas sincronizadas`)
    } catch (error) {
      console.error('[SheetsSync] ❌ Error sincronizando ventas:', error)
      this.status.errors.push(`Ventas: ${error}`)
    }
  }

  async syncPending() {
    if (!this.sheets || !this.config) return

    try {
      const sales = await prisma.sale.findMany({
        select: {
          id: true,
          saleNumber: true,
          customerName: true,
          totalUSD: true,
          status: true
        },
        where: {
          status: { in: ['PROCESSING', 'PENDING'] }
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      })

      const rows: any[][] = []

      for (const s of sales) {
        const installments = await prisma.installment.findMany({
          where: { saleId: s.id }
        })
        const payments = await prisma.payment.findMany({
          where: { saleId: s.id }
        })
        
        const totalPaid = payments.reduce((sum: number, p: any) => sum + Number(p.amountUSD), 0)
        const pendingAmount = Number(s.totalUSD) - totalPaid
        const nextInstallment = installments
          .filter((i: any) => i.status === 'PENDING' || i.status === 'PARTIAL')
          .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0]

        rows.push([
          s.saleNumber,
          s.customerName || 'Cliente',
          Number(s.totalUSD),
          totalPaid,
          pendingAmount,
          nextInstallment ? new Date(nextInstallment.dueDate).toLocaleDateString() : '',
          pendingAmount > 0 ? 'Pendiente' : 'Pagado'
        ])
      }

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.config.spreadsheetId,
        range: 'Pendientes!A2:Z',
        valueInputOption: 'RAW',
        requestBody: { values: rows }
      })

      this.status.pending = sales.length
      console.log(`[SheetsSync] ⏳ ${sales.length} pendientes sincronizados`)
    } catch (error) {
      console.error('[SheetsSync] ❌ Error sincronizando pendientes:', error)
      this.status.errors.push(`Pendientes: ${error}`)
    }
  }

  async processSheetStockUpdate(sku: string, newStock: number, editedBy: string) {
    if (!this.sheets || !this.config) {
      throw new Error('Servicio no inicializado')
    }

    if (newStock < 0) {
      throw new ValidationError('El stock no puede ser negativo')
    }

    const product = await prisma.product.findUnique({
      where: { sku }
    })

    if (!product) {
      throw new ValidationError(`Producto con SKU ${sku} no encontrado`)
    }

    const oldStock = product.stock
    const difference = newStock - oldStock

    await prisma.product.update({
      where: { sku },
      data: { stock: newStock }
    })

    await prisma.inventoryLog.create({
      data: {
        productId: product.id,
        changeType: 'ADJUSTMENT',
        previousStock: oldStock,
        newStock: newStock,
        changeAmount: difference,
        reason: `Ajuste desde Google Sheets por ${editedBy}`
      }
    })

    console.log(`[SheetsSync] 📝 Stock actualizado: ${sku} ${oldStock} → ${newStock} por ${editedBy}`)

    return { oldStock, newStock, difference }
  }

  getStatus(): SyncStatus {
    return { ...this.status }
  }

  async forceSync() {
    await this.runFullSync()
    return this.getStatus()
  }

  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
      console.log('[SheetsSync] 🛑 Sincronización detenida')
    }
  }
}

export const sheetsSyncService = new SheetsSyncService()
