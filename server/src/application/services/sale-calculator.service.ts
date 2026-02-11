export interface SaleItemData {
  productId: string
  name?: string
  quantity: number
  unitPrice?: number
  purchasePrice?: number
}

export class SaleCalculator {
  calculateItemTotals(item: SaleItemData, product: any) {
    const unitCost = Number(product?.purchasePrice || 0)
    const unitPrice = Number(item.unitPrice || product?.price || 0)
    const profitPerUnit = unitPrice - unitCost
    
    return {
      productId: item.productId,
      name: product?.name || item.name || 'Producto desconocido',
      quantity: item.quantity,
      unitCost,
      unitPrice,
      total: item.quantity * unitPrice,
      profitPerUnit,
      totalProfit: profitPerUnit * item.quantity,
    }
  }

  calculateSaleTotals(items: any[], shippingCost: number, bcvRate: number) {
    const subtotalUSD = items.reduce((sum, item) => sum + item.total, 0)
    const totalUSD = subtotalUSD + shippingCost
    const totalBS = totalUSD * bcvRate
    const profitUSD = items.reduce((sum, item) => sum + item.totalProfit, 0)
    const profitBS = profitUSD * bcvRate

    return {
      subtotalUSD,
      totalUSD,
      totalBS,
      profitUSD,
      profitBS
    }
  }
}
