import { SaleCalculator } from '../sale-calculator.service.js'

describe('SaleCalculator', () => {
  let saleCalculator: SaleCalculator

  beforeEach(() => {
    saleCalculator = new SaleCalculator()
  })

  describe('calculateItemTotals', () => {
    it('should calculate item totals correctly', () => {
      const item = { productId: 'p1', quantity: 2, unitPrice: 20 }
      const product = { name: 'Test Product', purchasePrice: 15, price: 20 }

      const result = saleCalculator.calculateItemTotals(item, product)

      expect(result.total).toBe(40)
      expect(result.profitPerUnit).toBe(5)
      expect(result.totalProfit).toBe(10)
      expect(result.name).toBe('Test Product')
    })

    it('should use product price if item unitPrice is not provided', () => {
      const item = { productId: 'p1', quantity: 2 }
      const product = { name: 'Test Product', purchasePrice: 15, price: 25 }

      const result = saleCalculator.calculateItemTotals(item, product)

      expect(result.unitPrice).toBe(25)
      expect(result.total).toBe(50)
    })
  })

  describe('calculateSaleTotals', () => {
    it('should calculate sale totals correctly', () => {
      const items = [
        { total: 40, totalProfit: 10 },
        { total: 60, totalProfit: 20 }
      ]
      const shippingCost = 5
      const bcvRate = 36

      const result = saleCalculator.calculateSaleTotals(items, shippingCost, bcvRate)

      expect(result.subtotalUSD).toBe(100)
      expect(result.totalUSD).toBe(105)
      expect(result.totalBS).toBe(105 * 36)
      expect(result.profitUSD).toBe(30)
      expect(result.profitBS).toBe(30 * 36)
    })
  })
})
