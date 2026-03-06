import { Router, Request, Response } from 'express'
import { productRepo, auditService } from '../../../../shared/container.js'
import { authenticate } from '../../middleware/auth.middleware.js'

const router = Router()

const SYNC_CONFIG = {
  maxProductsPerSync: 500,
  rateLimitPerMinute: 30,
  allowedColumns: ['SKU', 'Nombre', 'Stock', 'StockMinimo', 'Precio', 'PrecioCompra', 'Marca', 'EnStock'],
  editableColumns: ['Stock'],
  skuPattern: /^[A-Za-z0-9\-_]+$/,
  requireAuth: process.env.NODE_ENV === 'production'
}

const syncHistory: Array<{
  timestamp: string
  type: 'import' | 'export' | 'update'
  productsAffected: number
  errors: number
  user?: string
}> = []

function addToHistory(type: 'import' | 'export' | 'update', productsAffected: number, errors: number, user?: string) {
  syncHistory.unshift({
    timestamp: new Date().toISOString(),
    type,
    productsAffected,
    errors,
    user
  })
  if (syncHistory.length > 100) syncHistory.pop()
}

router.get('/export-products', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 1000, SYNC_CONFIG.maxProductsPerSync)
    const offset = parseInt(req.query.offset as string) || 0

    const products = await productRepo.findMany({
      where: {}
    })

    const paginatedProducts = products.slice(offset, offset + limit)

    const exportData = paginatedProducts.map(p => ({
      SKU: p.sku,
      Nombre: p.name,
      Stock: p.stock,
      StockMinimo: p.minStock,
      Precio: Number(p.price),
      PrecioCompra: Number(p.purchasePrice),
      Marca: p.brand || '',
      EnStock: p.inStock ? 'Sí' : 'No',
      _lastUpdated: p.updatedAt?.toISOString() || null,
      _id: p.id
    }))

    addToHistory('export', exportData.length, 0)

    res.json({
      success: true,
      data: exportData,
      pagination: {
        total: products.length,
        limit,
        offset,
        hasMore: offset + limit < products.length
      },
      exportedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error exportando productos:', error)
    addToHistory('export', 0, 1)
    res.status(500).json({
      success: false,
      error: 'Error al exportar productos'
    })
  }
})

router.get('/inventory-list', async (req: Request, res: Response) => {
  try {
    const products = await productRepo.findMany({
      where: {}
    })

    const inventoryList = products.map(p => ({
      sku: p.sku,
      name: p.name,
      stock: p.stock,
      minStock: p.minStock,
      price: Number(p.price),
      purchasePrice: Number(p.purchasePrice),
      brand: p.brand || '',
      inStock: p.inStock,
      updatedAt: p.updatedAt?.toISOString()
    }))

    res.json({
      success: true,
      inventory: inventoryList,
      total: inventoryList.length
    })
  } catch (error) {
    console.error('Error obteniendo inventario:', error)
    res.status(500).json({
      success: false,
      error: 'Error al obtener inventario'
    })
  }
})

router.post('/sheet-update', async (req: Request, res: Response) => {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    const { sku, stock, editedBy, forceUpdate } = req.body

    if (!sku) {
      res.status(400).json({
        success: false,
        error: 'SKU es requerido'
      })
      return
    }

    if (!SYNC_CONFIG.skuPattern.test(sku)) {
      res.status(400).json({
        success: false,
        error: 'Formato de SKU inválido. Solo letras, números, guiones y guiones bajos'
      })
      return
    }

    if (stock === undefined || stock === null || stock === '') {
      res.status(400).json({
        success: false,
        error: 'Stock es requerido'
      })
      return
    }

    const stockValue = parseInt(String(stock))
    if (isNaN(stockValue)) {
      res.status(400).json({
        success: false,
        error: 'Stock debe ser un número'
      })
      return
    }

    if (stockValue < 0) {
      res.status(400).json({
        success: false,
        error: 'Stock no puede ser negativo'
      })
      return
    }

    const product = await productRepo.findBySku(sku)
    if (!product) {
      res.status(404).json({
        success: false,
        error: `Producto con SKU "${sku}" no encontrado en el sistema`
      })
      return
    }

    const previousStock = product.stock
    const previousUpdated = product.updatedAt?.toISOString()

    if (!forceUpdate && req.body._lastUpdated && previousUpdated) {
      const sheetUpdated = new Date(req.body._lastUpdated).getTime()
      const systemUpdated = new Date(previousUpdated).getTime()

      if (sheetUpdated < systemUpdated && previousStock !== stockValue) {
        warnings.push(`El sistema fue actualizado después de la última sincronización (${new Date(previousUpdated).toLocaleString()})`)
      }
    }

    await productRepo.update(product.id, {
      stock: stockValue,
      inStock: stockValue > 0
    })

    await auditService.logAction({
      entityType: 'PRODUCT',
      entityId: product.id,
      action: 'STOCK_SYNC_SHEET',
      userId: editedBy || 'google-sheets-sync',
      details: {
        sku,
        previousStock,
        newStock: stockValue,
        source: 'google-sheets',
        warnings
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent') || 'Google Apps Script'
    })

    addToHistory('update', 1, 0, editedBy)

    res.json({
      success: true,
      message: `Stock actualizado: ${sku} → ${stockValue}`,
      warnings: warnings.length > 0 ? warnings : undefined,
      product: {
        id: product.id,
        sku: product.sku,
        name: product.name,
        previousStock,
        newStock: stockValue,
        previousUpdated: previousUpdated
      }
    })
  } catch (error) {
    console.error('Error en sincronización de Sheets:', error)
    addToHistory('update', 0, 1)
    res.status(500).json({
      success: false,
      error: 'Error al sincronizar stock desde Sheets'
    })
  }
})

router.post('/bulk-stock', authenticate, async (req: Request, res: Response) => {
  try {
    const { items, mode = 'update' } = req.body

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Se requiere un array de items'
      })
      return
    }

    if (items.length > SYNC_CONFIG.maxProductsPerSync) {
      res.status(400).json({
        success: false,
        error: `Máximo ${SYNC_CONFIG.maxProductsPerSync} productos por operación`
      })
      return
    }

    const userId = (req as any).user?.id
    const results: Array<{
      sku: string
      success: boolean
      error?: string
      previousStock?: number
      newStock?: number
      warning?: string
    }> = []
    let errors = 0

    for (const item of items) {
      const { sku, stock, nombre, precio, precioCompra, marca } = item

      if (!sku) {
        results.push({ sku: sku || 'unknown', success: false, error: 'SKU faltante' })
        errors++
        continue
      }

      if (!SYNC_CONFIG.skuPattern.test(sku)) {
        results.push({ sku, success: false, error: 'Formato de SKU inválido' })
        errors++
        continue
      }

      const product = await productRepo.findBySku(sku)
      if (!product) {
        results.push({ sku, success: false, error: 'Producto no encontrado' })
        errors++
        continue
      }

      const updateData: Record<string, unknown> = {}
      const warnings: string[] = []

      if (stock !== undefined) {
        const stockValue = parseInt(String(stock))
        if (isNaN(stockValue) || stockValue < 0) {
          results.push({ sku, success: false, error: 'Stock inválido' })
          errors++
          continue
        }
        updateData.stock = stockValue
        updateData.inStock = stockValue > 0
      }

      if (mode === 'full' || mode === 'full-overwrite') {
        if (precio !== undefined) {
          const precioValue = parseFloat(String(precio))
          if (!isNaN(precioValue) && precioValue > 0) {
            updateData.price = precioValue
          }
        }

        if (precioCompra !== undefined) {
          const precioCompraValue = parseFloat(String(precioCompra))
          if (!isNaN(precioCompraValue) && precioCompraValue >= 0) {
            updateData.purchasePrice = precioCompraValue
          }
        }
      }

      await productRepo.update(product.id, updateData)

      await auditService.logAction({
        entityType: 'PRODUCT',
        entityId: product.id,
        action: 'STOCK_BULK_UPDATE',
        userId,
        details: { sku, previousStock: product.stock, newStock: updateData.stock, mode },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      })

      results.push({
        sku,
        success: true,
        previousStock: product.stock,
        newStock: updateData.stock as number,
        warning: warnings.length > 0 ? warnings.join(', ') : undefined
      })
    }

    const successCount = results.filter(r => r.success).length
    addToHistory('import', successCount, errors, userId)

    res.json({
      success: true,
      message: `${successCount} de ${items.length} productos actualizados`,
      summary: {
        total: items.length,
        success: successCount,
        errors,
        warnings: results.filter(r => r.warning).length
      },
      results
    })
  } catch (error) {
    console.error('Error en bulk stock update:', error)
    addToHistory('import', 0, 1)
    res.status(500).json({
      success: false,
      error: 'Error al actualizar stock en masa'
    })
  }
})

router.get('/validate', async (req: Request, res: Response) => {
  try {
    const products = await productRepo.findMany({ where: {} })

    const skuMap = new Map<string, number>()
    const validationErrors: Array<{ row: number; sku: string; error: string }> = []

    products.forEach((p, index) => {
      if (!p.sku || p.sku.trim() === '') {
        validationErrors.push({ row: index + 2, sku: p.sku || 'N/A', error: 'SKU vacío' })
        return
      }

      if (!SYNC_CONFIG.skuPattern.test(p.sku)) {
        validationErrors.push({ row: index + 2, sku: p.sku, error: 'SKU con caracteres inválidos' })
      }

      if (skuMap.has(p.sku)) {
        validationErrors.push({
          row: index + 2,
          sku: p.sku,
          error: `SKU duplicado (primera aparición en fila ${skuMap.get(p.sku)})`
        })
      }
      skuMap.set(p.sku, index + 2)

      if (p.stock < 0) {
        validationErrors.push({ row: index + 2, sku: p.sku, error: 'Stock negativo' })
      }

      if (p.price && Number(p.price) < 0) {
        validationErrors.push({ row: index + 2, sku: p.sku, error: 'Precio negativo' })
      }

      if (p.purchasePrice && Number(p.purchasePrice) < 0) {
        validationErrors.push({ row: index + 2, sku: p.sku, error: 'Precio de compra negativo' })
      }
    })

    res.json({
      success: true,
      validation: {
        totalProducts: products.length,
        validProducts: products.length - validationErrors.length,
        errors: validationErrors.length,
        errorList: validationErrors
      }
    })
  } catch (error) {
    console.error('Error validando productos:', error)
    res.status(500).json({
      success: false,
      error: 'Error al validar productos'
    })
  }
})

router.get('/history', async (_req: Request, res: Response) => {
  res.json({
    success: true,
    history: syncHistory,
    config: {
      maxProductsPerSync: SYNC_CONFIG.maxProductsPerSync,
      rateLimitPerMinute: SYNC_CONFIG.rateLimitPerMinute,
      allowedColumns: SYNC_CONFIG.allowedColumns,
      editableColumns: SYNC_CONFIG.editableColumns
    }
  })
})

router.get('/config', async (_req: Request, res: Response) => {
  res.json({
    success: true,
    config: {
      maxProductsPerSync: SYNC_CONFIG.maxProductsPerSync,
      rateLimitPerMinute: SYNC_CONFIG.rateLimitPerMinute,
      allowedColumns: SYNC_CONFIG.allowedColumns,
      editableColumns: SYNC_CONFIG.editableColumns,
      skuPattern: SYNC_CONFIG.skuPattern.source,
      requireAuth: SYNC_CONFIG.requireAuth
    }
  })
})

router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const products = await productRepo.findMany({ where: {} })

    const totalProducts = products.length
    const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0)
    const outOfStock = products.filter(p => p.stock === 0).length
    const lowStock = products.filter(p => p.stock > 0 && p.stock <= (p.minStock || 0)).length

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const recentSyncs = syncHistory.filter(h => {
      const syncDate = new Date(h.timestamp)
      return syncDate >= today
    })

    res.json({
      success: true,
      stats: {
        products: {
          total: totalProducts,
          outOfStock,
          lowStock,
          inStock: totalProducts - outOfStock - lowStock
        },
        inventory: {
          totalStock,
          averageStock: totalProducts > 0 ? Math.round(totalStock / totalProducts) : 0
        },
        sync: {
          today: recentSyncs.length,
          lastSync: syncHistory[0]?.timestamp || null,
          totalHistory: syncHistory.length
        }
      }
    })
  } catch (error) {
    console.error('Error obteniendo stats:', error)
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas'
    })
  }
})

router.post('/check-conflicts', async (req: Request, res: Response) => {
  try {
    const { products } = req.body

    if (!Array.isArray(products)) {
      res.status(400).json({
        success: false,
        error: 'Se requiere un array de productos'
      })
      return
    }

    const conflicts: Array<{
      sku: string
      sheetStock: number
      systemStock: number
      systemUpdated: string
      severity: 'high' | 'medium' | 'low'
    }> = []

    for (const item of products) {
      if (!item.sku || item.stock === undefined) continue

      const product = await productRepo.findBySku(item.sku)
      if (!product) continue

      const sheetStock = parseInt(String(item.stock))
      const systemStock = product.stock

      if (sheetStock !== systemStock) {
        const severity = Math.abs(sheetStock - systemStock) > 5 ? 'high' : 'low'

        conflicts.push({
          sku: item.sku,
          sheetStock,
          systemStock,
          systemUpdated: product.updatedAt?.toISOString() || '',
          severity
        })
      }
    }

    res.json({
      success: true,
      conflicts: conflicts.length,
      conflictList: conflicts,
      summary: {
        high: conflicts.filter(c => c.severity === 'high').length,
        medium: conflicts.filter(c => c.severity === 'medium').length,
        low: conflicts.filter(c => c.severity === 'low').length
      }
    })
  } catch (error) {
    console.error('Error checkeando conflictos:', error)
    res.status(500).json({
      success: false,
      error: 'Error al verificar conflictos'
    })
  }
})

export default router
