import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { config } from './config/index.js'
import { ErrorHandler, notFoundHandler, rateLimitHandler } from './middleware/errorHandler.js'
import authRoutes from './routes/auth.routes.js'
import productRoutes from './routes/product.routes.js'
import saleRoutes from './routes/sale.routes.js'
import bcvRoutes from './routes/bcv.routes.js'
import bcvAdminRoutes from './routes/admin/bcv.routes.js'
import categoryRoutes from './routes/category.routes.js'
import favoriteRoutes from './routes/favorite.routes.js'
import adminProductRoutes from './routes/admin/product.routes.js'
import adminCategoryRoutes from './routes/admin/category.routes.js'
import adminStatsRoutes from './routes/admin/stats.routes.js'
import adminRequirementRoutes from './routes/admin/requirement.routes.js'
import adminSaleRoutes from './routes/admin/sale.routes.js'
import adminReportRoutes from './routes/admin/report.routes.js'
import adminCustomerRoutes from './routes/admin/customer.routes.js'
import adminUploadRoutes from './routes/admin/upload.routes.js'
import adminSettingsRoutes from './routes/admin/settings.routes.js'
import adminManagementRoutes from './routes/admin/admin-management.routes.js'
import { authenticate } from './middleware/auth.js'
import { NotificationService } from './services/notification.service.js'
import { BCVUpdaterService } from './services/bcv-updater.service.js'
import path from 'path'

const app = express()

// app.use(helmet())
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}))
app.use((_req, res, next) => {
  // Permitir comunicación con popups para Google Auth
  res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
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
app.use('/api/admin/bcv', bcvAdminRoutes)
app.use('/api/admin/products', adminProductRoutes)
app.use('/api/admin/categories', adminCategoryRoutes)
app.use('/api/admin/stats', adminStatsRoutes)
app.use('/api/admin/requirements', adminRequirementRoutes)
app.use('/api/admin/sales', adminSaleRoutes)
app.use('/api/admin/reports', adminReportRoutes)
app.use('/api/admin/customers', adminCustomerRoutes)
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
    NotificationService.checkLowStock()
    NotificationService.checkExpirations()
  }, 12 * 60 * 60 * 1000)

  // Actualizar tasa BCV cada hora
  setInterval(() => {
    BCVUpdaterService.updateRate()
  }, 60 * 60 * 1000)

  // Ejecución inicial después de un retraso
  setTimeout(() => {
    console.log('Ejecutando tareas iniciales de segundo plano...')
    NotificationService.checkLowStock().catch(err => console.error('Error en checkLowStock:', err))
    NotificationService.checkExpirations().catch(err => console.error('Error en checkExpirations:', err))
    BCVUpdaterService.updateRate().catch(err => console.error('Error en updateRate:', err))
  }, 10000)
}

app.listen(config.port, '0.0.0.0', () => {
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
