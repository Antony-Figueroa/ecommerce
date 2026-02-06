import { PrismaProductRepository } from '../infrastructure/persistence/prisma.product.repository.js'
import { PrismaCategoryRepository, PrismaBrandRepository, PrismaInventoryLogRepository } from '../infrastructure/persistence/prisma.inventory.repository.js'
import { PrismaSaleRepository, PrismaRequirementRepository, PrismaNotificationRepository, PrismaBatchRepository } from '../infrastructure/persistence/prisma.business.repository.js'
import { PrismaBCVRepository, PrismaSettingsRepository } from '../infrastructure/persistence/prisma.settings.repository.js'
import { PrismaUserRepository } from '../infrastructure/persistence/prisma.user.repository.js'
import { PrismaFavoriteRepository } from '../infrastructure/persistence/prisma.favorite.repository.js'
import { PrismaCartRepository } from '../infrastructure/persistence/prisma.cart.repository.js'
import { PrismaNotificationSettingRepository } from '../infrastructure/persistence/prisma.notification-setting.repository.js'

import { InventoryService } from '../application/services/inventory.service.js'
import { SaleService } from '../application/services/sale.service.js'
import { RequirementService } from '../application/services/requirement.service.js'
import { DashboardService } from '../application/services/dashboard.service.js'
import { BCVService } from '../application/services/bcv.service.js'
import { BCVUpdaterService } from '../application/services/bcv-updater.service.js'
import { NotificationService } from '../application/services/notification.service.js'
import { NotificationSettingService } from '../application/services/notification-setting.service.js'
import { SettingsService } from '../application/services/settings.service.js'
import { AuthService } from '../application/services/auth.service.js'
import { FavoriteService } from '../application/services/favorite.service.js'
import { EmailService } from '../application/services/email.service.js'
import { UploadService } from '../application/services/upload.service.js'
import { CartService } from '../application/services/cart.service.js'
import { prisma } from '../infrastructure/persistence/prisma.client.js'

// Repositories
export const productRepo = new PrismaProductRepository()
export const categoryRepo = new PrismaCategoryRepository()
export const brandRepo = new PrismaBrandRepository()
export const logRepo = new PrismaInventoryLogRepository()
export const saleRepo = new PrismaSaleRepository()
export const requirementRepo = new PrismaRequirementRepository()
export const notificationRepo = new PrismaNotificationRepository()
export const bcvRepo = new PrismaBCVRepository()
export const settingsRepo = new PrismaSettingsRepository()
export const batchRepo = new PrismaBatchRepository()
export const userRepo = new PrismaUserRepository()
export const favoriteRepo = new PrismaFavoriteRepository()
export const cartRepo = new PrismaCartRepository()
export const notificationSettingRepo = new PrismaNotificationSettingRepository()

// Services
export const emailService = new EmailService()
export const uploadService = new UploadService()

export const notificationService = new NotificationService(
  notificationRepo,
  productRepo,
  batchRepo,
  notificationSettingRepo
)

export const inventoryService = new InventoryService(
  productRepo,
  categoryRepo,
  brandRepo,
  logRepo,
  notificationService,
  favoriteRepo
)

export const bcvService = new BCVService(bcvRepo)

export const bcvUpdaterService = new BCVUpdaterService(
  bcvRepo,
  settingsRepo,
  notificationService,
  inventoryService
)

export const saleService = new SaleService(
  saleRepo,
  productRepo,
  logRepo,
  bcvRepo,
  batchRepo,
  notificationRepo,
  settingsRepo,
  notificationService
)

export const requirementService = new RequirementService(
  requirementRepo,
  productRepo,
  batchRepo,
  logRepo
)

export const dashboardService = new DashboardService(
  saleRepo,
  productRepo,
  userRepo,
  bcvRepo,
  requirementRepo
)

export const settingsService = new SettingsService(settingsRepo)

export const authService = new AuthService(userRepo, emailService)

export const notificationSettingService = new NotificationSettingService(notificationSettingRepo)

export const favoriteService = new FavoriteService(favoriteRepo, notificationService)

export const cartService = new CartService(cartRepo, notificationService, emailService)
