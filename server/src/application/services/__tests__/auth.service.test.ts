import { jest } from '@jest/globals'

// Mock dependencies before imports with both default and named exports for ESM compatibility
jest.mock('bcryptjs', () => ({
  __esModule: true,
  default: {
    compare: jest.fn<any>().mockResolvedValue(true),
    hash: jest.fn<any>().mockResolvedValue('hashed_password'),
  },
  compare: jest.fn<any>().mockResolvedValue(true),
  hash: jest.fn<any>().mockResolvedValue('hashed_password'),
}))

jest.mock('jsonwebtoken', () => ({
  __esModule: true,
  default: {
    sign: jest.fn<any>().mockReturnValue('mock_token'),
    verify: jest.fn<any>().mockReturnValue({}),
  },
  sign: jest.fn<any>().mockReturnValue('mock_token'),
  verify: jest.fn<any>().mockReturnValue({}),
}))

jest.mock('crypto', () => ({
  __esModule: true,
  default: {
    randomBytes: jest.fn<any>(() => ({
      toString: jest.fn<any>(() => 'mocked_hex_token')
    })),
  },
  randomBytes: jest.fn<any>(() => ({
    toString: jest.fn<any>(() => 'mocked_hex_token')
  })),
}))

import { AuthService } from '../auth.service.js'
import { AuthenticationError, ValidationError } from '../../../shared/errors/app.errors.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const mockUserRepo = {
  findByEmail: jest.fn<any>(),
  findByUsername: jest.fn<any>(),
  findById: jest.fn<any>(),
  findFirst: jest.fn<any>(),
  create: jest.fn<any>(),
  update: jest.fn<any>(),
}

const mockEmailService = {
  sendVerificationEmail: jest.fn<any>(),
  sendPasswordResetEmail: jest.fn<any>(),
}

const mockAuditService = {
  logAction: jest.fn<any>(),
}

describe('AuthService', () => {
  let authService: AuthService

  beforeEach(() => {
    jest.clearAllMocks()
    authService = new AuthService(mockUserRepo as any, mockEmailService as any, mockAuditService as any)
  })

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        role: 'CUSTOMER',
      }
      mockUserRepo.findByEmail.mockResolvedValue(mockUser)
      
      // Accessing the mocked functions
      const compareMock = (bcrypt.compare || (bcrypt as any).default.compare) as any
      const signMock = (jwt.sign || (jwt as any).default.sign) as any
      
      compareMock.mockResolvedValue(true)
      signMock.mockReturnValue('mock_token')

      const result = await authService.login('test@example.com', 'password', '127.0.0.1', 'test-agent')

      expect(result.user.email).toBe('test@example.com')
      expect(result.token).toBe('mock_token')
      expect(mockAuditService.logAction).toHaveBeenCalledWith(expect.objectContaining({
        action: 'LOGIN_SUCCESS',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent'
      }))
    })

    it('should throw AuthenticationError and log failure if user not found', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null)
      await expect(authService.login('test@example.com', 'password', '127.0.0.1'))
        .rejects.toThrow(AuthenticationError)
      
      expect(mockAuditService.logAction).toHaveBeenCalledWith(expect.objectContaining({
        action: 'LOGIN_FAILED',
        details: expect.objectContaining({ reason: 'User not found or no password hash' })
      }))
    })
  })

  describe('register', () => {
    it('should register a new user and log action', async () => {
      const userData = { email: 'new@example.com', password: 'password', name: 'New' }
      mockUserRepo.findByEmail.mockResolvedValue(null)
      const hashMock = (bcrypt.hash || (bcrypt as any).default.hash) as any
      hashMock.mockResolvedValue('hashed_password')
      mockUserRepo.create.mockResolvedValue({ ...userData, id: '2', role: 'CUSTOMER', emailVerified: true })

      const result = await authService.register(userData, '127.0.0.1', 'test-agent')

      expect(result.email).toBe('new@example.com')
      expect(mockUserRepo.create).toHaveBeenCalled()
      expect(mockAuditService.logAction).toHaveBeenCalledWith(expect.objectContaining({
        action: 'REGISTER',
        entityType: 'USER',
        ipAddress: '127.0.0.1'
      }))
    })
  })

  describe('resendVerificationEmail', () => {
    it('should resend verification email', async () => {
      mockUserRepo.findByEmail.mockResolvedValue({ id: '1', email: 'test@example.com', emailVerified: false, name: 'Test' })
      
      await authService.resendVerificationEmail('test@example.com')

      expect(mockUserRepo.update).toHaveBeenCalledWith('1', expect.objectContaining({
        verificationToken: 'mocked_hex_token'
      }))
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalled()
    })
  })

  describe('requestPasswordReset', () => {
    it('should request password reset', async () => {
      mockUserRepo.findByEmail.mockResolvedValue({ id: '1', email: 'test@example.com' })
      await authService.requestPasswordReset('test@example.com')
      expect(mockUserRepo.update).toHaveBeenCalledWith('1', expect.objectContaining({
        resetPasswordToken: 'mocked_hex_token'
      }))
      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalled()
    })
  })
})
