import { PrismaProductRepository } from '../infrastructure/persistence/prisma.product.repository.js'
import { PrismaCategoryRepository, PrismaBrandRepository, PrismaFormatRepository, PrismaInventoryLogRepository, PrismaProviderRepository, PrismaInventoryBatchRepository, PrismaInventoryLocationRepository, PrismaInventoryStockRepository, PrismaInventoryTransferRepository } from '../infrastructure/persistence/prisma.inventory.repository.js'
import { PrismaSaleRepository, PrismaRequirementRepository, PrismaNotificationRepository, PrismaBatchRepository, PrismaPaymentRepository, PrismaInstallmentRepository, PrismaPaymentProofRepository, PrismaBusinessEventRepository } from '../infrastructure/persistence/prisma.business.repository.js'
import { PrismaBCVRepository, PrismaSettingsRepository } from '../infrastructure/persistence/prisma.settings.repository.js'
import { PrismaUserRepository } from '../infrastructure/persistence/prisma.user.repository.js'
import { PrismaFavoriteRepository } from '../infrastructure/persistence/prisma.favorite.repository.js'
import { PrismaCartRepository } from '../infrastructure/persistence/prisma.cart.repository.js'
import { PrismaNotificationSettingRepository } from '../infrastructure/persistence/prisma.notification-setting.repository.js'
import { PrismaAuditRepository } from '../infrastructure/persistence/prisma.audit.repository.js'

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
import { PaymentService } from '../application/services/payment.service.js'
import { AuditService } from '../application/services/audit.service.js'
import { StockManager } from '../application/services/stock-manager.service.js'
import { SaleCalculator } from '../application/services/sale-calculator.service.js'
import { BatchManager } from '../application/services/batch-manager.service.js'
import { ProductManager } from '../application/services/product-manager.service.js'
import { PaymentManager } from '../application/services/payment-manager.service.js'
import { NotificationManager } from '../application/services/notification-manager.service.js'
import { UserService } from '../application/services/user.service.js'
import { BusinessEventService } from '../application/services/business-event.service.js'
import { BackupService } from '../application/services/backup.service.js'
import { prisma } from '../infrastructure/persistence/prisma.client.js'
import { PrismaClient } from '../generated/client/index.js'

// Repositories
export const productRepo = new PrismaProductRepository()
export const categoryRepo = new PrismaCategoryRepository()
export const brandRepo = new PrismaBrandRepository()
export const formatRepo = new PrismaFormatRepository()
export const logRepo = new PrismaInventoryLogRepository()
export const providerRepo = new PrismaProviderRepository()
export const inventoryBatchRepo = new PrismaInventoryBatchRepository()
export const saleRepo = new PrismaSaleRepository()
export const requirementRepo = new PrismaRequirementRepository()
export const notificationRepo = new PrismaNotificationRepository()
export const bcvRepo = new PrismaBCVRepository()
export const settingsRepo = new PrismaSettingsRepository()
export const batchRepo = new PrismaBatchRepository()
export const paymentRepo = new PrismaPaymentRepository()
export const installmentRepo = new PrismaInstallmentRepository()
export const paymentProofRepo = new PrismaPaymentProofRepository()
export const businessEventRepo = new PrismaBusinessEventRepository()
export const userRepo = new PrismaUserRepository()
export const favoriteRepo = new PrismaFavoriteRepository()
export const cartRepo = new PrismaCartRepository()
export const notificationSettingRepo = new PrismaNotificationSettingRepository()
export const auditRepo = new PrismaAuditRepository()
export const inventoryLocationRepo = new PrismaInventoryLocationRepository()
export const inventoryStockRepo = new PrismaInventoryStockRepository()
export const inventoryTransferRepo = new PrismaInventoryTransferRepository()

// Services
export const emailService = new EmailService()
export const uploadService = new UploadService()
export const auditService = new AuditService(auditRepo)
export const stockManager = new StockManager(productRepo, logRepo, inventoryBatchRepo)
export const saleCalculator = new SaleCalculator()

export const paymentManager = new PaymentManager(
  paymentRepo,
  installmentRepo,
  saleRepo,
  paymentProofRepo,
  auditService
)

export const notificationManager = new NotificationManager(
  notificationRepo,
  productRepo,
  batchRepo,
  auditService,
  notificationSettingRepo
)

export const notificationService = new NotificationService(
  notificationRepo,
  productRepo,
  batchRepo,
  notificationManager,
  notificationSettingRepo
)

export const businessEventService = new BusinessEventService(
  businessEventRepo,
  notificationManager
)

export const batchManager = new BatchManager(
  productRepo,
  logRepo,
  inventoryBatchRepo,
  auditService
)

export const productManager = new ProductManager(
  prisma,
  productRepo,
  categoryRepo,
  brandRepo,
  logRepo,
  favoriteRepo,
  notificationService,
  auditService
)

export const inventoryService = new InventoryService(
  productRepo,
  categoryRepo,
  brandRepo,
  formatRepo,
  logRepo,
  providerRepo,
  inventoryBatchRepo,
  notificationService,
  favoriteRepo,
  batchManager,
  productManager,
  auditService
)

export const bcvService = new BCVService(bcvRepo, auditService)

export const bcvUpdaterService = new BCVUpdaterService(
  bcvRepo,
  settingsRepo,
  notificationService,
  inventoryService
)

export const backupService = new BackupService()

export const settingsService = new SettingsService(settingsRepo, auditService, backupService, userRepo)

export const paymentService = new PaymentService(
  paymentRepo,
  installmentRepo,
  saleRepo,
  paymentProofRepo,
  paymentManager,
  auditService
)

export const saleService = new SaleService(
  saleRepo,
  productRepo,
  bcvRepo,
  notificationRepo,
  settingsRepo,
  notificationService,
  paymentService,
  auditService,
  stockManager,
  saleCalculator,
  logRepo,
  prisma
)

export const requirementService = new RequirementService(
  requirementRepo,
  productRepo,
  batchRepo,
  logRepo,
  auditService
)

export const dashboardService = new DashboardService(
  saleRepo,
  productRepo,
  userRepo,
  bcvRepo,
  requirementRepo,
  auditService
)

export const authService = new AuthService(userRepo, emailService, auditService)

export const notificationSettingService = new NotificationSettingService(notificationSettingRepo)

export const favoriteService = new FavoriteService(favoriteRepo, notificationService)

export const cartService = new CartService(cartRepo, notificationService, emailService)
export const userService = new UserService(userRepo, auditService)
