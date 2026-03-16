import { Request, Response, NextFunction } from 'express'
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
import adminPaymentRoutes from './infrastructure/web/routes/admin/payment.routes.js'
import adminVentasRoutes from './infrastructure/web/routes/admin/ventas.routes.js'
import adminCuotaRoutes from './infrastructure/web/routes/admin/cuota.routes.js'
import adminProviderRoutes from './infrastructure/web/routes/admin/provider.routes.js'
import adminBatchRoutes from './infrastructure/web/routes/admin/batch.routes.js'
import adminBusinessEventRoutes from './infrastructure/web/routes/admin/business-event.routes.js'
import adminInventoryRoutes from './infrastructure/web/routes/admin/inventory.routes.js'
import adminCatalogRoutes from './infrastructure/web/routes/admin/catalog.routes.js'
import adminSyncRoutes from './infrastructure/web/routes/admin/sync.routes.js'
import settingsRoutes from './infrastructure/web/routes/settings.routes.js'
import notificationRoutes from './infrastructure/web/routes/notification.routes.js'
import adminManagementRoutes from './infrastructure/web/routes/admin/admin-management.routes.js'
import adminBrandRoutes from './infrastructure/web/routes/admin/brand.routes.js'
import adminFormatRoutes from './infrastructure/web/routes/admin/format.routes.js'
import { authenticate } from './infrastructure/web/middleware/auth.middleware.js'
import { notificationService, bcvUpdaterService, cartService, backupService } from './shared/container.js'
import path from 'path'
import cartRoutes from './infrastructure/web/routes/cart.routes.js'
import catalogRoutes from './infrastructure/web/routes/catalog.routes.js'
import { prisma } from './infrastructure/persistence/prisma.client.js'

import { createServer } from 'http'
import { socketService } from './infrastructure/socket.service.js'

const app = express()
const httpServer = createServer(app)

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://ecommerce-eosin.vercel.app',
  config.frontendUrl,
  // Dominios de Vercel (comodín)
  /\.vercel\.app$/,
];

app.use((req, res, next) => {
  console.log(`[VERY_TOP_DEBUG] ${new Date().toISOString()} ${req.method} ${req.path} - Origin: ${req.headers.origin}`);
  if (req.method === 'OPTIONS' || req.headers['access-control-request-private-network']) {
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
  }
  next();
});

app.use(cors({
  origin: (origin, callback) => {
    // Loguear el origen para depuración
    console.log(`[CORS_DEBUG] ${new Date().toISOString()} Origin: ${origin}`);
    
    // Si el origen es undefined (como en herramientas de testing o llamadas directas) 
    // o está en la lista de permitidos, permitimos la petición.
    if (!origin) {
      callback(null, true);
      return;
    }
    
    // Verificar si es un origen permitido o si coincide con el patrón de Vercel
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return allowed === origin || allowed === 'config.frontendUrl' && origin.includes('vercel.app');
      }
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });
    
    if (isAllowed || origin.includes('vercel.app') || origin.includes('localhost')) {
      callback(null, true);
    } else {
      console.warn(`[CORS_DENIED] ${new Date().toISOString()} Origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}))

// Initialize Socket.io
socketService.init(httpServer)

app.use((_req, res, next) => {
  // Permitir comunicación con popups para Google Auth
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  // Eliminado Cross-Origin-Embedder-Policy que puede causar bloqueos de red local
  next();
});
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - Headers: ${JSON.stringify({
    origin: req.headers.origin,
    auth: !!req.headers.authorization
  })}`);
  next();
});
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/ping', (_req: Request, res: Response) => {
  res.send('pong');
});

app.post('/api/auth/callback/g', async (req: Request, res: Response) => {
  console.log('[DEBUG_DIRECT] Petición recibida en /api/auth/callback/g DIRECTO');
  console.log('[DEBUG_DIRECT] Body:', JSON.stringify(req.body));
  const { authService } = await import('./shared/container.js');
  try {
    const { credential } = req.body
    if (!credential) {
      console.warn('[DEBUG_DIRECT] No se recibió credencial');
      return res.status(400).json({ error: 'No se recibió la credencial de Google' });
    }
    const result = await authService.googleAuth(credential)
    console.log('[DEBUG_DIRECT] Autenticación exitosa');
    res.json({ success: true, ...result })
  } catch (error: any) {
    console.error('[DEBUG_DIRECT] Error:', error);
    res.status(400).json({ error: error.message })
  }
});
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/sales', saleRoutes)
app.use('/api/bcv', bcvRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/favorites', favoriteRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/catalog', catalogRoutes)
app.use('/api/admin/bcv', bcvAdminRoutes)
app.use('/api/admin/products', adminProductRoutes)
app.use('/api/admin/categories', adminCategoryRoutes)
app.use('/api/admin/stats', adminStatsRoutes)
app.use('/api/admin/requirements', adminRequirementRoutes)
app.use('/api/admin/sales', adminSaleRoutes)
app.use('/api/admin/reports', adminReportRoutes)
app.use('/api/admin/customers', adminCustomerRoutes)
app.use('/api/admin/notifications', adminNotificationRoutes)
app.use('/api/admin/payments', adminPaymentRoutes)
app.use('/api/admin/ventas', adminVentasRoutes)
app.use('/api/admin/cuotas', adminCuotaRoutes)
app.use('/api/admin/upload', adminUploadRoutes)
app.use('/api/admin/providers', adminProviderRoutes)
app.use('/api/admin/batches', adminBatchRoutes)
app.use('/api/admin/business-events', adminBusinessEventRoutes)
app.use('/api/admin/inventory', adminInventoryRoutes)
app.use('/api/admin/catalog', adminCatalogRoutes)
app.use('/api/sync', adminSyncRoutes)
app.use('/api/admin/settings', authenticate, adminSettingsRoutes)
app.use('/api/admin/management', adminManagementRoutes)
app.use('/api/admin/brands', adminBrandRoutes)
app.use('/api/admin/formats', adminFormatRoutes)

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

// Servir uploads también desde la raíz del proyecto en producción
if (process.env.NODE_ENV === 'production') {
  app.use('/uploads', express.static(path.resolve(__dirname, '../../uploads')))
}

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

// HEALTH CHECK EN LA RAÍZ PARA EVITAR CONFLICTOS CON /api
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV })
})

app.get('/', (_req, res) => {
  res.json({ message: "Ana's Supplements API is running" })
})

app.use(notFoundHandler)
app.use(ErrorHandler.handle)

// Background Tasks
const RUN_TASKS = process.env.NODE_ENV !== 'test'

const runBgTask = (name: string, task: () => Promise<unknown>) => {
  task().catch((err) => {
    // IMPORTANT: never allow background task promise rejections to crash the server
    console.error(`[BG_TASK_ERROR] ${name}:`, err)
  })
}

if (RUN_TASKS) {
  // Check stock and expirations every 12 hours
  setInterval(() => {
    runBgTask('notificationService.checkLowStock', () => notificationService.checkLowStock())
    runBgTask('notificationService.checkExpirations', () => notificationService.checkExpirations())
  }, 12 * 60 * 60 * 1000)

  // Actualizar tasa BCV cada hora
  setInterval(() => {
    runBgTask('bcvUpdaterService.updateRate', () => bcvUpdaterService.updateRate())
  }, 60 * 60 * 1000)

  // Verificar carritos abandonados cada 6 horas
  setInterval(() => {
    runBgTask('cartService.checkAbandonedCarts', () => cartService.checkAbandonedCarts())
  }, 6 * 60 * 60 * 1000)

  // Respaldo diario de la base de datos (cada 24 horas)
  setInterval(() => {
    runBgTask('backupService.createBackup (daily)', () => backupService.createBackup())
  }, 24 * 60 * 60 * 1000)

  // Ejecutar un respaldo inicial al arrancar
  runBgTask('backupService.createBackup (initial)', () => backupService.createBackup())

  // Ejecución inicial después de un retraso
  setTimeout(() => {
    console.log('Ejecutando tareas iniciales de segundo plano...')
    runBgTask('notificationService.checkLowStock (startup)', () => notificationService.checkLowStock())
    runBgTask('notificationService.checkExpirations (startup)', () => notificationService.checkExpirations())
    runBgTask('bcvUpdaterService.updateRate (startup)', () => bcvUpdaterService.updateRate())
    runBgTask('cartService.checkAbandonedCarts (startup)', () => cartService.checkAbandonedCarts())
    // Inicializar configuraciones críticas si no existen
    runBgTask('init_settings', async () => {
      try {
        const showStockBadge = await prisma.setting.findUnique({ where: { key: 'show_stock_badge' } })
        if (!showStockBadge) {
          await prisma.setting.create({
            data: {
              key: 'show_stock_badge',
              value: 'false',
              type: 'boolean',
              group: 'catalogo',
              label: 'Mostrar etiqueta de Agotado',
              description: 'Define si se muestra el indicador "Agotado" en productos sin stock.',
              isPublic: true
            }
          })
          console.log('✅ Setting "show_stock_badge" initialized as default (false)')
        }
      } catch (err) {
        console.error('Error initializing settings:', err)
      }
    })
  }, 30000)
}

httpServer.on('error', (err) => {
  if ((err as any).code === 'EADDRINUSE') {
    console.error(
      `Port ${config.port} is already in use. ` +
      'Please stop the process that is listening on that port or set a different PORT in your environment.'
    )
    process.exit(1)
  }
  // rethrow other errors so they crash the process and can be logged by PM2 / systemd etc.
  throw err
})

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
