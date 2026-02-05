# 📋 Plan de Implementación - E-commerce Ana's Supplements

## 📊 Análisis del Proyecto Actual

### Lo Implementado (Fase 1 - UI/Frontend)

| Categoría | Archivos | Estado |
|-----------|----------|--------|
| **Configuración Base** | 12 archivos | ✅ Completado |
| **Componentes UI (shadcn)** | 18 componentes | ✅ Completado |
| **Layout** | Navbar, Footer | ✅ Completado |
| **Pages** | Home, Catálogo, Producto, Carrito, Auth | ✅ Completado |
| **Contextos** | CartContext | ✅ Completado |
| **Dummy Data** | 12 productos, 6 categorías | ✅ Completado |
| **Types** | Interfaces base | ✅ Completado |

**Total: ~55 archivos implementados**

---

## 🎯 Tareas Pendientes por Fase

### FASE 2: BACKEND Y PERSISTENCIA (Semana 1-2)

#### 2.1 Infraestructura Backend

| # | Tarea | Descripción | Estimación | Prioridad |
|---|-------|-------------|------------|-----------|
| 2.1.1 | **Servidor Express** | Configurar servidor con TypeScript | 2h | Alta |
| 2.1.2 | **Prisma + SQLite** | Configurar ORM y conexión a BD | 2h | Alta |
| 2.1.3 | **Middleware Auth** | JWT, cors, rate limiting | 3h | Alta |
| 2.1.4 | **Manejo de Errores** | Centralized error handling | 2h | Media |

#### 2.2 Modelos de Base de Datos

| # | Modelo | Campos Clave | Complejidad |
|---|--------|--------------|-------------|
| 2.2.1 | **User** | email, passwordHash, role (CUSTOMER/ADMIN/PHARMACIST), profile | Media |
| 2.2.2 | **Profile** | firstName, lastName, phone, dni, dateOfBirth | Media |
| 2.2.3 | **Address** | userId, type (shipping/billing), isDefault | Baja |
| 2.2.4 | **Category** | name, slug, description, image, parentId (jerarquía) | Baja |
| 2.2.5 | **Product** | sku, name, description, price, stock, requiresPrescription, laboratory, dosage, contraindications, etc. | Alta |
| 2.2.6 | **ProductImage** | productId, url, isPrimary | Baja |
| 2.2.7 | **Cart/CartItem** | userId, productId, quantity | Media |
| 2.2.8 | **Order/OrderItem** | userId, status (PENDING, CONFIRMED, SHIPPED, DELIVERED), total | Alta |
| 2.2.9 | **Prescription** | orderId, fileUrl, status (PENDING_APPROVED, REJECTED), pharmacistNotes | Alta |
| 2.2.10 | **Review** | productId, userId, rating, comment, images | Media |
| 2.2.11 | **Coupon** | code, discountType (PERCENT/FIXED), value, minPurchase, expiryDate | Media |
| 2.2.12 | **InventoryLog** | productId, changeType, previousStock, newStock (auditoría) | Media |

---

### FASE 3: API REST COMPLETA (Semana 2-3)

#### 3.1 Endpoints de Autenticación

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Registro de usuario | ❌ |
| POST | `/api/auth/login` | Inicio de sesión | ❌ |
| POST | `/api/auth/logout` | Cerrar sesión | ✅ JWT |
| POST | `/api/auth/refresh` | Refresh token | ❌ |
| POST | `/api/auth/forgot-password` | Recuperar contraseña | ❌ |
| POST | `/api/auth/reset-password` | Reset con token | ❌ |
| GET | `/api/auth/me` | Perfil actual | ✅ JWT |

#### 3.2 Endpoints de Productos

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/products` | Lista con filtros y paginación | ❌ |
| GET | `/api/products/:id` | Detalle completo | ❌ |
| GET | `/api/products/slug/:slug` | Por slug SEO | ❌ |
| GET | `/api/products/search?q=` | Búsqueda | ❌ |
| GET | `/api/products/featured` | Destacados | ❌ |
| GET | `/api/products/:id/related` | Relacionados | ❌ |
| POST | `/api/products` | Crear producto | ✅ ADMIN |
| PUT | `/api/products/:id` | Actualizar | ✅ ADMIN |
| DELETE | `/api/products/:id` | Eliminar | ✅ ADMIN |

#### 3.3 Endpoints de Carrito

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/cart` | Obtener carrito | ✅ JWT |
| POST | `/api/cart/items` | Agregar item | ✅ JWT |
| PUT | `/api/cart/items/:id` | Actualizar cantidad | ✅ JWT |
| DELETE | `/api/cart/items/:id` | Eliminar item | ✅ JWT |
| DELETE | `/api/cart` | Vaciar carrito | ✅ JWT |
| POST | `/api/cart/apply-coupon` | Aplicar cupón | ✅ JWT |

#### 3.4 Endpoints de Órdenes

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/orders` | Crear orden | ✅ JWT |
| GET | `/api/orders` | Historial del usuario | ✅ JWT |
| GET | `/api/orders/:id` | Detalle de orden | ✅ JWT |
| POST | `/api/orders/:id/prescription` | Subir receta | ✅ JWT |
| PUT | `/api/orders/:id/status` | Actualizar estado | ✅ ADMIN |
| POST | `/api/orders/:id/cancel` | Cancelar orden | ✅ JWT |

#### 3.5 Endpoints de Usuario

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/users/profile` | Perfil completo | ✅ JWT |
| PUT | `/api/users/profile` | Actualizar perfil | ✅ JWT |
| GET | `/api/users/addresses` | Direcciones | ✅ JWT |
| POST | `/api/users/addresses` | Nueva dirección | ✅ JWT |
| PUT | `/api/users/addresses/:id` | Editar dirección | ✅ JWT |
| DELETE | `/api/users/addresses/:id` | Eliminar dirección | ✅ JWT |
| GET | `/api/users/wishlist` | Favoritos | ✅ JWT |
| POST | `/api/users/wishlist` | Agregar favorito | ✅ JWT |
| DELETE | `/api/users/wishlist/:id` | Quitar favorito | ✅ JWT |

#### 3.6 Endpoints de Reviews

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/reviews/product/:productId` | Reviews de producto | ❌ |
| POST | `/api/reviews` | Crear review | ✅ JWT |
| PUT | `/api/reviews/:id` | Editar review | ✅ JWT |
| DELETE | `/api/reviews/:id` | Eliminar review | ✅ JWT |

---

### FASE 4: INTEGRACIÓN FRONTEND-BACKEND (Semana 3-4)

#### 4.1 Servicios API

```typescript
// src/services/api.ts
class ApiClient {
  private baseUrl = import.meta.env.VITE_API_URL
  private accessToken: string | null = null
  
  // Interceptors para JWT
  // Manejo de errores global
  // Retry logic
}
```

| # | Servicio | Métodos | Complejidad |
|---|----------|---------|-------------|
| 4.1.1 | **AuthService** | login, register, logout, profile | 4h |
| 4.1.2 | **ProductService** | getAll, getById, search, featured | 4h |
| 4.1.3 | **CartService** | getCart, addItem, updateItem, removeItem | 3h |
| 4.1.4 | **OrderService** | create, getHistory, getDetail, cancel | 4h |
| 4.1.5 | **UserService** | profile, addresses, wishlist | 3h |
| 4.1.6 | **ReviewService** | getByProduct, create, update, delete | 2h |

#### 4.2 Actualización de Contextos

| # | Contexto | Funcionalidad | Complejidad |
|---|----------|---------------|-------------|
| 4.2.1 | **AuthContext** | Login/logout real, tokens, persistencia | 4h |
| 4.2.2 | **CartContext** | Sincronización con backend | 3h |
| 4.2.3 | **OrderContext** | Estado de órdenes | 2h |
| 4.2.4 | **NotificationContext** | Toasts globales | 2h |

#### 4.3 Actualización de Pages

| # | Page | Cambios Requeridos | Complejidad |
|---|------|-------------------|-------------|
| 4.3.1 | **HomePage** | Fetch dinámico de API | 2h |
| 4.3.2 | **CatalogPage** | API + filtros URL params | 3h |
| 4.3.3 | **ProductPage** | Reviews dinámicos, wishlist | 3h |
| 4.3.4 | **CartPage** | Carrito persistente real | 2h |
| 4.3.5 | **CheckoutPage** | Nueva página con formulario | 6h |
| 4.3.6 | **Auth Pages** | Integración completa | 3h |
| 4.3.7 | **AccountPage** | Perfil, direcciones, historial | 6h |

---

### FASE 5: CHECKOUT Y PAGO (Semana 4-5)

#### 5.1 Flujo de Checkout

```
1. Revisión del Carrito
   ├── Confirmar productos
   ├── Aplicar cupón
   └── Seleccionar dirección
       │
       ▼
2. Información de Envío
   ├── Seleccionar dirección guardada O nueva
   ├── Método de envío (estándar, exprés)
   └── Costos dinámicos
       │
       ▼
3. Método de Pago
   ├── Tarjeta de crédito/débito (Stripe)
   ├── Pago en efectivo (OXXO)
   └── Pago contraentrega
       │
       ▼
4. Recetas Médicas (si aplica)
   ├── Identificar productos con receta
   ├── Subir imagen/PDF de receta
   └── Esperar aprobación (farmacéutico)
       │
       ▼
5. Confirmación
   ├── Resumen final
   ├── Términos y condiciones
   └── Confirmar pago
```

#### 5.2 Componentes de Checkout

| # | Componente | Descripción | Complejidad |
|---|------------|-------------|-------------|
| 5.2.1 | **CheckoutLayout** | Layout con pasos | 2h |
| 5.2.2 | **AddressSelector** | Seleccionar/crear dirección | 3h |
| 5.2.3 | **ShippingMethodSelector** | Opciones de envío | 2h |
| 5.2.4 | **PaymentMethodSelector** | Stripe, OXXO, efectivo | 4h |
| 5.2.5 | **PrescriptionUploader** | Upload de recetas | 3h |
| 5.2.6 | **OrderSummary** | Resumen con totales | 2h |
| 5.2.7 | **OrderConfirmation** | Página de éxito | 2h |

#### 5.3 Integración de Pagos

| # | Integración | Descripción | Complejidad |
|---|--------------|-------------|-------------|
| 5.3.1 | **Stripe Elements** | Tarjetas de crédito | 8h |
| 5.3.2 | **Stripe Webhooks** | Confirmación de pago | 4h |
| 5.3.3 | **OXXO Payment** | Generación de referência | 4h |
| 5.3.4 | **Cash on Delivery** | Contraentrega | 2h |

---

### FASE 6: SISTEMA DE RECETAS MÉDICAS (Semana 5)

#### 6.1 Flujo Regulatorio

```yaml
Regulatory Requirements (COFEPRIS/Mexico):
- Solo ciertos productos requieren receta
- Recetas deben incluir:
  * Datos del paciente
  * Datos del médico (cédula profesional)
  * Diagnóstico
  * Fecha de emisión
  * Firma del médico
- Tiempo de validez: typically 30-90 días
- Para controlados: 30 días máximo
```

| # | Funcionalidad | Descripción | Complejidad |
|---|----------------|-------------|-------------|
| 6.1.1 | **Identificación de Productos** | Marcar productos con requiresPrescription | 1h |
| 6.1.2 | **Formulario de Receta** | Campos requeridos para upload | 3h |
| 6.1.3 | **Validación Frontend** | Alertar si falta receta | 2h |
| 6.1.4 | **Panel de Farmacéutico** | Aprobar/rechazar recetas | 8h |
| 6.1.5 | **Notificaciones** | Email al cliente sobre estado | 3h |
| 6.1.6 | **Vencimiento** | Recordatorio de renovación | 2h |
| 6.1.7 | **Límite de Dispensación** | Controlar cantidad según receta | 3h |

---

### FASE 7: CUENTA DE USUARIO (Semana 5-6)

#### 7.1 Dashboard de Usuario

```
/account
├── 📊 Resumen
│   ├── Últimos pedidos
│   ├── Productos recomendados
│   └── Estado de cuenta
│
├── 📦 Pedidos
│   ├── Lista de pedidos
│   ├── Detalle de pedido
│   ├── Tracking de envío
│   ├── Descargar factura
│   └── Solicitar devolución
│
├── 📍 Direcciones
│   ├── Lista de direcciones
│   ├── Editar dirección
│   ├── Establecer como predeterminada
│   └── Eliminar dirección
│
├── 💊 Recetas Guardadas
│   ├── Recetas activas
│   ├── Próximas a vencer
│   └── Renovar receta
│
├── ❤️ Lista de Deseos
│   └── Productos guardados
│
├── 🔔 Notificaciones
│   ├── Preferencias
│   └── Historial
│
└── ⚙️ Configuración
    ├── Editar perfil
    ├── Cambiar contraseña
    └── Eliminar cuenta
```

| # | Componente | Descripción | Complejidad |
|---|------------|-------------|-------------|
| 7.1.1 | **AccountLayout** | Layout con sidebar | 2h |
| 7.1.2 | **OrderHistory** | Lista de pedidos | 4h |
| 7.1.3 | **OrderDetail** | Detalle con tracking | 4h |
| 7.1.4 | **AddressBook** | CRUD de direcciones | 4h |
| 7.1.5 | **PrescriptionManager** | Gestionar recetas | 4h |
| 7.1.6 | **WishlistManager** | Favoritos | 3h |
| 7.1.7 | **ProfileSettings** | Editar perfil y password | 3h |

---

### FASE 8: OPCIONES ADICIONALES (Semana 6-7)

#### 8.1 Reviews y Social Proof

| # | Funcionalidad | Descripción | Complejidad |
|---|----------------|-------------|-------------|
| 8.1.1 | **Sistema de Reviews** | CRUD completo con fotos | 6h |
| 8.1.2 | **Ratings con Fotos** | Imágenes en reviews | 3h |
| 8.1.3 | **Q&A Section** | Preguntas y respuestas | 4h |
| 8.1.4 | **Verified Badge** | "Compró este producto" | 2h |
| 8.1.5 | **Helpful Votes** | Votar útil reviews | 2h |

#### 8.2 Búsqueda Inteligente

| # | Funcionalidad | Descripción | Complejidad |
|---|----------------|-------------|-------------|
| 8.2.1 | **Search Autocomplete** | Sugerencias en tiempo real | 4h |
| 8.2.2 | **Filtros Avanzados** | Por laboratorio, principio activo | 3h |
| 8.2.3 | **Búsqueda por Síntomas** | "Dolor de cabeza" → Analgésicos | 6h |
| 8.2.4 | **Search History** | Búsquedas recientes | 2h |

#### 8.3 Email Marketing

| # | Funcionalidad | Descripción | Complejidad |
|---|----------------|-------------|-------------|
| 8.3.1 | **Newsletter Subscribe** | Integración con Mailchimp/SendGrid | 3h |
| 8.3.2 | **Transactional Emails** | Orden confirmada, envío, etc. | 4h |
| 8.3.3 | **Abandoned Cart Emails** | Recuperar carritos abandonados | 4h |
| 8.3.4 | **Birthday Emails** | Descuentos especiales | 2h |

---

### FASE 9: SEO Y PERFORMANCE (Semana 7)

#### 9.1 SEO

| # | Funcionalidad | Descripción | Complejidad |
|---|----------------|-------------|-------------|
| 9.1.1 | **Meta Tags Dinámicos** | Title, description por página | 3h |
| 9.1.2 | **Open Graph** | Compartir en redes | 2h |
| 9.1.3 | **Structured Data** | ProductSchema, Breadcrumb | 4h |
| 9.1.4 | **Sitemap** | Para Google | 2h |
| 9.1.5 | **Canonical URLs** | Evitar duplicados | 1h |
| 9.1.6 | **Robots.txt** | Control de indexación | 1h |

#### 9.2 Performance

| # | Optimización | Descripción | Complejidad |
|---|--------------|-------------|-------------|
| 9.2.1 | **Lazy Loading** | Images y componentes | 4h |
| 9.2.2 | **Code Splitting** | Por rutas | 2h |
| 9.2.3 | **React Query** | Cacheo de datos | 6h |
| 9.2.4 | **Image Optimization** | WebP, responsive | 3h |
| 9.2.5 | **Bundle Analysis** | Analizar tamaño | 2h |

---

### FASE 10: SEGURIDAD Y CUMPLIMIENTO (Continuo)

| # | Funcionalidad | Descripción | Complejidad |
|---|----------------|-------------|-------------|
| 10.1 | **JWT con Refresh Tokens** | Sesiones seguras | 4h |
| 10.2 | **Rate Limiting** | Prevenir abuse | 2h |
| 10.3 | **CSRF Protection** | Tokens de seguridad | 2h |
| 10.4 | **Input Validation** | Zod en backend | 4h |
| 10.5 | **File Upload Security** | Solo PDFs/imágenes | 3h |
| 10.6 | **Audit Logs** | Registro de acciones | 3h |
| 10.7 | **GDPR/Privacy Compliance** | Cookies, datos | 4h |
| 10.8 | **HTTPS** | Certificados SSL | 1h |

---

## 📊 Resumen de Estimación Total

| Fase | Descripción | Horas | Semanas |
|------|-------------|-------|---------|
| 2 | Backend + DB | 40-50h | 1.5 |
| 3 | API REST | 50-60h | 2 |
| 4 | Integración Frontend | 35-45h | 1.5 |
| 5 | Checkout + Pago | 45-55h | 2 |
| 6 | Recetas Médicas | 25-30h | 1 |
| 7 | Cuenta Usuario | 30-35h | 1.5 |
| 8 | Features Adicionales | 30-40h | 1.5 |
| 9 | SEO + Performance | 20-25h | 1 |
| 10 | Seguridad | 25-30h | 1 |

**Total Estimado: 300-370 horas (~12-15 semanas)**

---

## 🎯 Orden de Prioridad Recomendado

### 🔴 MVP (Mínimo Producto Viable) - 4 semanas

1. Backend Express + Prisma + SQLite
2. Autenticación JWT completa
3. CRUD Productos desde backend
4. Carrito persistente
5. Checkout básico (sin Stripe)
6. Órdenes con estado

### 🟡 Versión 1.0 - 4 semanas adicionales

1. Integración Stripe/OXXO
2. Sistema de recetas médicas
3. Panel de farmacéutico (básico)
4. Cuenta de usuario completa
5. Reviews y ratings

### 🟢 Versión 1.5 - 4 semanas finales

1. Búsqueda inteligente
2. Email marketing
3. SEO completo
4. Performance optimization
5. Pruebas unitarias

---

## 🛠️ Stack Tecnológico Pendiente

```json
{
  "backend": {
    "server": "Express.js 5.x",
    "typescript": "5.x",
    "database": "SQLite",
    "orm": "Prisma",
    "auth": "jsonwebtoken + bcryptjs",
    "validation": "Zod",
    "upload": "Multer",
    "email": "Nodemailer"
  },
  "pagos": {
    "stripe": "Stripe SDK",
    "oxxo": "Conekta (México)"
  },
  "deployment": {
    "frontend": "Vercel / Netlify",
    "backend": "Railway / Render / VPS"
  }
}
```

---

## ✅ Checklist de Completitud

### Backend
- [ ] Servidor Express con TypeScript
- [ ] Prisma schema con todos los modelos
- [ ] Migraciones y seed data
- [ ] Auth con JWT y refresh tokens
- [ ] CRUD completo de productos
- [ ] Carrito persistente
- [ ] Órdenes con estados
- [ ] Sistema de recetas médicas
- [ ] Reviews y ratings
- [ ] Cupones de descuento
- [ ] Rate limiting
- [ ] Error handling centralizado
- [ ] Logging y auditoría

### Frontend
- [ ] Integración con API
- [ ] AuthContext real
- [ ] Carrito sincronizado
- [ ] Checkout completo
- [ ] Pasarela de pagos
- [ ] Upload de recetas
- [ ] Cuenta de usuario
- [ ] Historial de pedidos
- [ ] Dirección management
- [ ] Wishlist
- [ ] Reviews escritura/lectura
- [ ] Loading states
- [ ] Error boundaries
- [ ] 404 pages
- [ ] Loading spinners

### SEO
- [ ] Meta tags dinámicos
- [ ] Open Graph
- [ ] Structured data
- [ ] Sitemap
- [ ] robots.txt
- [ ] Canonical URLs
- [ ] Lazy loading images
- [ ] Optimized images

### Testing
- [ ] Unit tests (Vitest)
- [ ] Integration tests
- [ ] E2E tests (Playwright)
- [ ] Coverage > 70%

### DevOps
- [ ] CI/CD pipeline
- [ ] Environment variables
- [ ] Database backups
- [ ] Monitoring
- [ ] Error tracking (Sentry)
- [ ] Analytics
