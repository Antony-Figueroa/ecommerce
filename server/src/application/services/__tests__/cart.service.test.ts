import { jest } from '@jest/globals'
import { CartService } from '../cart.service.js'

describe('CartService', () => {
  let cartService: CartService
  let mockCartRepo: any
  let mockNotificationService: any
  let mockEmailService: any

  beforeEach(() => {
    mockCartRepo = {
      findByUserId: jest.fn(),
      create: jest.fn(),
      addItem: jest.fn(),
      removeItem: jest.fn(),
      updateItemQuantity: jest.fn(),
      clear: jest.fn(),
      findAbandonedCarts: jest.fn(),
      markReminderSent: jest.fn(),
    }
    mockNotificationService = {
      createNotification: jest.fn(),
    }
    mockEmailService = {
      sendAbandonedCartEmail: jest.fn(),
    }

    cartService = new CartService(
      mockCartRepo,
      mockNotificationService,
      mockEmailService
    )
  })

  describe('getCart', () => {
    it('should return existing cart', async () => {
      const mockCart = { id: 'c1', userId: 'u1', items: [] }
      mockCartRepo.findByUserId.mockResolvedValue(mockCart)

      const result = await cartService.getCart('u1')

      expect(result).toEqual(mockCart)
      expect(mockCartRepo.create).not.toHaveBeenCalled()
    })

    it('should create cart if none exists', async () => {
      mockCartRepo.findByUserId.mockResolvedValue(null)
      mockCartRepo.create.mockResolvedValue({ id: 'c1', userId: 'u1', items: [] })

      const result = await cartService.getCart('u1')

      expect(mockCartRepo.create).toHaveBeenCalledWith('u1')
      expect(result.id).toBe('c1')
    })
  })

  describe('addItem', () => {
    it('should add item and return updated cart', async () => {
      const mockCart = { id: 'c1', userId: 'u1', items: [] }
      mockCartRepo.findByUserId.mockResolvedValue(mockCart)

      await cartService.addItem('u1', 'p1', 2)

      expect(mockCartRepo.addItem).toHaveBeenCalledWith('c1', 'p1', 2)
    })
  })

  describe('updateQuantity', () => {
    it('should remove item if quantity is 0', async () => {
      const mockCart = { id: 'c1', userId: 'u1', items: [{ productId: 'p1', quantity: 1 }] }
      mockCartRepo.findByUserId.mockResolvedValue(mockCart)

      await cartService.updateQuantity('u1', 'p1', 0)

      expect(mockCartRepo.removeItem).toHaveBeenCalledWith('c1', 'p1')
    })

    it('should update quantity if > 0', async () => {
      const mockCart = { id: 'c1', userId: 'u1', items: [{ productId: 'p1', quantity: 1 }] }
      mockCartRepo.findByUserId.mockResolvedValue(mockCart)

      await cartService.updateQuantity('u1', 'p1', 5)

      expect(mockCartRepo.updateItemQuantity).toHaveBeenCalledWith('c1', 'p1', 5)
    })
  })

  describe('checkAbandonedCarts', () => {
    it('should notify users with abandoned carts', async () => {
      const mockCarts = [
        { 
          id: 'c1', 
          userId: 'u1', 
          user: { email: 'test@test.com', name: 'John' },
          items: [{ product: { name: 'Prod 1' }, quantity: 1 }]
        }
      ]
      mockCartRepo.findAbandonedCarts.mockResolvedValue(mockCarts)

      await cartService.checkAbandonedCarts()

      expect(mockNotificationService.createNotification).toHaveBeenCalled()
      expect(mockEmailService.sendAbandonedCartEmail).toHaveBeenCalled()
      expect(mockCartRepo.markReminderSent).toHaveBeenCalledWith('c1')
    })
  })
})
