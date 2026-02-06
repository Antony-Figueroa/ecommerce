import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { config } from './shared/config/index.js'
import { ErrorHandler, notFoundHandler, rateLimitHandler } from './infrastructure/web/middleware/error.middleware.js'
import authRoutes from './infrastructure/web/routes/auth.routes.js'
import productRoutes from './infrastructure/web/routes/product.routes.js'
import saleRoutes from './infrastructure/web/routes/sale.routes.js'
import bcvRoutes from './infrastructure/web/routes/bcv.routes.js'
import bcvAdminRoutes from './infrastructure/web/routes/admin/bcv.routes.js'
import categoryRoutes from './infrastructure/web/routes/category.routes.js'
import favoriteRoutes from './infrastructure/web/routes/favorite.routes.js'
import adminProductRoutes from './infrastructure/web/routes/admin/product.routes.js'
import adminCategoryRoutes from './infrastructure/web/routes/admin/category.routes.js'
import adminStatsRoutes from './infrastructure/web/routes/admin/stats.routes.js'
import adminRequirementRoutes from './infrastructure/web/routes/admin/requirement.routes.js'
import adminSaleRoutes from './infrastructure/web/routes/admin/sale.routes.js'
import adminReportRoutes from './infrastructure/web/routes/admin/report.routes.js'
import adminCustomerRoutes from './infrastructure/web/routes/admin/customer.routes.js'
import adminUploadRoutes from './infrastructure/web/routes/admin/upload.routes.js'
import adminSettingsRoutes from './infrastructure/web/routes/admin/settings.routes.js'
import adminNotificationRoutes from './infrastructure/web/routes/admin/notification.routes.js'
import settingsRoutes from './infrastructure/web/routes/settings.routes.js'
import notificationRoutes from './infrastructure/web/routes/notification.routes.js'
import adminManagementRoutes from './infrastructure/web/routes/admin/admin-management.routes.js'
import { authenticate } from './infrastructure/web/middleware/auth.middleware.js'
import { notificationService, bcvUpdaterService, cartService } from './shared/container.js'
import path from 'path'
import cartRoutes from './infrastructure/web/routes/cart.routes.js'

import { createServer } from 'http'
import { socketService } from './infrastructure/socket.service.js'

const app = express()
const httpServer = createServer(app)

// Initialize Socket.io
socketService.init(httpServer)

app.use(helmet({
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}))
app.use(cors({
  origin: [config.frontendUrl, 'http://127.0.0.1:5173', 'http://localhost:5173', 'http://localhost:3001', 'http://127.0.0.1:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}))
app.use((_req, res, next) => {
  // Permitir comunicación con popups para Google Auth
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  next();
});
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  handler: rateLimitHandler,
  skip: (req) => {
    // No aplicar rate limit en desarrollo si es localhost
    if (process.env.NODE_ENV !== 'production') return true;
    return false;
  }
})
app.use('/api/', limiter)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/sales', saleRoutes)
app.use('/api/bcv', bcvRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/favorites', favoriteRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/admin/bcv', bcvAdminRoutes)
app.use('/api/admin/products', adminProductRoutes)
app.use('/api/admin/categories', adminCategoryRoutes)
app.use('/api/admin/stats', adminStatsRoutes)
app.use('/api/admin/requirements', adminRequirementRoutes)
app.use('/api/admin/sales', adminSaleRoutes)
app.use('/api/admin/reports', adminReportRoutes)
app.use('/api/admin/customers', adminCustomerRoutes)
app.use('/api/admin/notifications', adminNotificationRoutes)
app.use('/api/admin/upload', adminUploadRoutes)
app.use('/api/admin/settings', authenticate, adminSettingsRoutes)
app.use('/api/admin/management', adminManagementRoutes)

app.use(notFoundHandler)
app.use(ErrorHandler.handle)

// Background Tasks
const RUN_TASKS = process.env.NODE_ENV !== 'test'

if (RUN_TASKS) {
  // Check stock and expirations every 12 hours
  setInterval(() => {
    notificationService.checkLowStock()
    notificationService.checkExpirations()
  }, 12 * 60 * 60 * 1000)

  // Actualizar tasa BCV cada hora
  setInterval(() => {
    bcvUpdaterService.updateRate()
  }, 60 * 60 * 1000)

  // Verificar carritos abandonados cada 6 horas
  setInterval(() => {
    cartService.checkAbandonedCarts().catch(err => console.error('Error en checkAbandonedCarts:', err))
  }, 6 * 60 * 60 * 1000)

  // Ejecución inicial después de un retraso
  setTimeout(() => {
    console.log('Ejecutando tareas iniciales de segundo plano...')
    notificationService.checkLowStock().catch(err => console.error('Error en checkLowStock:', err))
    notificationService.checkExpirations().catch(err => console.error('Error en checkExpirations:', err))
    bcvUpdaterService.updateRate().catch(err => console.error('Error en updateRate:', err))
    cartService.checkAbandonedCarts().catch(err => console.error('Error en checkAbandonedCarts:', err))
  }, 30000)
}

httpServer.listen(config.port, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   🏥 Ana's Supplements API Server                    ║
║                                                   ║
║   Server running on port ${config.port}                  ║
║   Environment: ${config.nodeEnv.padEnd(25)}║
║   API URL: http://localhost:${config.port}/api             ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
  `)
})

export default app
