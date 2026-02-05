# 📋 Plan de Acción: E-commerce Ana's Supplements - Catálogo + Pedidos por WhatsApp

## 📊 Análisis del Estado Actual

### Lo Implementado ✅
- Frontend React + Vite + shadcn/ui
- Backend Express + SQLite + Prisma
- API REST completa (auth, productos, categorías, carrito)
- Base de datos con 12 productos y 6 categorías
- Sistema de autenticación JWT

### Lo que se Eliminará ❌
- Sistema de pagos (Stripe/OXXO)
- Checkout con formularios de pago
- Sistema de recetas médicas
- Procesamiento de tarjetas
- Cupones de descuento complejos
- Panel de farmacéutico (por ahora)

---

## 🎯 Nueva Arquitectura del Sistema

### Frontend - Cliente (Público)

```
/                           → Home con catálogo
/productos                 → Catálogo con filtros
/productos/:slug          → Categoría específica
/producto/:id              → Detalle de producto
/carrito                  → Lista de requerimientos
/pedidos                  → Mis pedidos (historial)
/login                    → Inicio de sesión
/registro                 → Registro
/admin                    → Panel de administración (solo admins)
```

### Backend - API REST

```
Autenticación:
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
PUT    /api/auth/profile

Productos (Público):
GET    /api/products
GET    /api/products/:id
GET    /api/products/slug/:slug
GET    /api/products/search?q=
GET    /api/categories
GET    /api/categories/:slug

Carrito (Usuario):
GET    /api/cart
POST   /api/cart/items
PUT    /api/cart/items/:id
DELETE /api/cart/items/:id
DELETE /api/cart
POST   /api/cart/whatsapp    → Generar mensaje para WhatsApp

Pedidos (Usuario):
POST   /api/orders          → Crear pedido desde carrito
GET    /api/orders         → Historial de pedidos
GET    /api/orders/:id     → Detalle de pedido

Administración (Admin):
GET    /api/admin/products
POST   /api/admin/products
PUT    /api/admin/products/:id
DELETE /api/admin/products/:id
GET    /api/admin/orders
PUT    /api/admin/orders/:id/status
GET    /api/admin/dashboard
GET    /api/admin/categories
POST   /api/admin/categories
PUT    /api/admin/categories/:id
DELETE /api/admin/categories/:id
GET    /api/admin/inventory
PUT    /api/admin/inventory/:productId
```

---

## 📦 Funcionalidades por Fase

### FASE 1: Carrito Simplificado + WhatsApp

#### 1.1 Modelo de Datos Simplificado

```prisma
// Simplified models

model Order {
  id              String   @id @default(uuid())
  orderNumber     String   @unique
  userId          String?
  guestEmail     String?   // Para usuarios no registrados
  status          String   @default("PENDING")  // PENDING, CONFIRMED, PREPARING, READY, COMPLETED, CANCELLED
  
  // Lista de productos (como JSON para simplificar)
  items           String   // JSON array con {productId, name, quantity, unitPrice}
  notes          String?   // Notas adicionales del cliente
  
  // Contacto
  customerName   String?
  customerPhone  String?
  customerEmail  String?
  
  // WhatsApp
  whatsappSent   Boolean  @default(false)
  whatsappMessage String?  // Mensaje enviado por WhatsApp
  
  total           Decimal
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

#### 1.2 Frontend - Componente Carrito

```tsx
// Carrito simplificado
- Lista de productos seleccionados
- Cantidad editable
- Notas/opciones adicionales
- Botón "Enviar pedido por WhatsApp"
- Genera mensaje格式:
```
Hola Ana's Supplements, quiero ordenar los siguientes productos:

1. Vitcomplex Multivitamínico x2 - $49.98
2. Omega 3 Premium x1 - $19.99

Total: $69.97

Datos de entrega:
Nombre: Juan Pérez
Teléfono: 55-1234-5678
Dirección: Av. Principal 123, Col. Centro
Notas: Por favor entregar después de las 10am
```

---

### FASE 2: Panel de Administración Completo

#### 2.1 Dashboard Admin

```tsx
// Dashboard con métricas
- Ventas del día/semana/mes
- Pedidos pendientes
- Productos con stock bajo
- Top productos más vendidos
- Gráfico de pedidos
- Ingresos del período
```

#### 2.2 Gestión de Productos

```tsx
// Admin Products Page
- Lista de todos los productos
- Buscar por nombre, SKU, categoría
- Filtrar por categoría, stock
- Ordenar por nombre, precio, stock, fecha
- Paginación

// Editar/Crear Producto
- Nombre *
- SKU *
- Descripción *
- Precio *
- Precio original (para mostrar descuento)
- Stock *
- Categoría *
- Marca
- Laboratorio
- Formato (cápsulas, crema, etc.)
- Peso/Cantidad
- Descripción larga
- Indicaciones
- Ingredientes
- Instrucciones de uso
- Requiere receta (sí/no)
- Activo/Inactivo
- Destacado (sí/no)
- Imágenes múltiples
- Tags/Beneficios
```

#### 2.3 Gestión de Categorías

```tsx
// Admin Categories Page
- Lista de categorías
- Crear/Editar categoría
  - Nombre *
  - Slug (auto-generado)
  - Descripción
  - Imagen
  - Icono
  - Activo/Inactivo
  - Orden
```

#### 2.4 Gestión de Pedidos

```tsx
// Admin Orders Page
- Lista de todos los pedidos
- Filtros: estado, fecha, cliente
- Ver detalle del pedido
- Cambiar estado:
  * PENDING → CONFIRMED (Confirmar)
  * CONFIRMED → PREPARING (Preparando)
  * PREPARING → READY (Listo)
  * READY → COMPLETED (Entregado)
  * Cualquier estado → CANCELLED (Cancelado)

// Detalle del pedido
- Info del cliente
- Lista de productos
- Notas adicionales
- Historial de estados
- Botón "Contactar por WhatsApp"
- Botón "Enviar actualización por WhatsApp"
```

#### 2.5 Gestión de Inventario

```tsx
// Inventory Page
- Vista de stock actual
- Alertas de stock bajo (configurable)
- Ajustes de inventario
- Historial de movimientos
- Registro de cambios:
  * Venta
  * Reposición
  * Ajuste manual
  * Producto dañado
```

#### 2.6 Configuración

```tsx
// Settings Page
- Información de la tienda
  * Nombre
  * Teléfono WhatsApp
  * Horario de atención
  * Dirección
  * Redes sociales
- Configuración de pedidos
  * Pedido mínimo
  * Costo de envío
  * Estados disponibles
- Notificaciones
  * Email nuevo pedido
  * WhatsApp nuevo pedido
```

---

## 📱 Funcionalidades Especiales

### Botón Flotante de WhatsApp

```tsx
// Floating WhatsApp Button
- Aparece en todas las páginas
- Animación de notificación
- Link directo a WhatsApp de la tienda
```

### Compartir Carrito por WhatsApp

```tsx
// Share Cart
- Botón en el carrito
- Genera mensaje格式ado
- Abre WhatsApp Web o app
```

### Notificaciones al Admin

```tsx
// Admin Notifications
- Nuevo pedido → Email/WhatsApp al admin
- Stock bajo → Alerta en dashboard
- Pedido cancelado → Notificación
```

---

## 📊 Estimación de Trabajo

| Fase | Funcionalidad | Complejidad | Días |
|------|---------------|--------------|------|
| **1.1** | Simplificar schema Prisma | Media | 1 |
| **1.2** | API carrito simplificada | Baja | 1 |
| **1.3** | Frontend WhatsApp share | Baja | 1 |
| **1.4** | Frontend pedidos histórico | Media | 1 |
| **2.1** | Dashboard Admin | Media | 2 |
| **2.2** | CRUD Productos Admin | Media | 2 |
| **2.3** | CRUD Categorías Admin | Baja | 1 |
| **2.4** | Gestión Pedidos Admin | Media | 2 |
| **2.5** | Inventario Admin | Media | 1 |
| **2.6** | Configuración Admin | Baja | 1 |
| **3.1** | Botón flotante WhatsApp | Baja | 0.5 |
| **3.2** | Mejoras UI/UX | Continuo | - |
| **3.3** | Tests y polish | Continuo | - |

**Total Estimado: 12-15 días laborables**

---

## 🔄 Cambios en el Frontend Actual

### Archivos a Modificar:

1. **carrito.tsx** - Simplificar, agregar WhatsApp
2. **cart-context.tsx** - Simplificar lógica
3. **cart-drawer.tsx** - Ajustar UI
4. **cart-item.tsx** - Simplificar

### Archivos a Crear:

1. **pages/admin/** - Dashboard, products, categories, orders, inventory, settings
2. **components/admin/** - Charts, stats cards, data tables
3. **hooks/useAdmin.ts** - Hook para admin API

### Archivos a Eliminar:

1. ~~checkout.tsx~~ (ya no existe)
2. ~~payment-forms~~ (no necesario)

---

## 📋 Checklist de Entregables

### Frontend - Cliente
- [ ] Home con catálogo
- [ ] Catálogo con filtros
- [ ] Búsqueda de productos
- [ ] Detalle de producto
- [ ] Carrito simplificado
- [ ] Enviar pedido por WhatsApp
- [ ] Historial de mis pedidos
- [ ] Login/Registro
- [ ] Botón flotante WhatsApp

### Backend - API
- [ ] Productos CRUD
- [ ] Categorías CRUD
- [ ] Órdenes CRUD
- [ ] Auth simplificado
- [ ] Endpoint WhatsApp share
- [ ] Dashboard stats

### Panel Admin
- [ ] Dashboard con métricas
- [ ] Gestión de productos
- [ ] Gestión de categorías
- [ ] Gestión de pedidos
- [ ] Gestión de inventario
- [ ] Configuración de tienda

---

## 🚀 Flujo de Usuario

### Cliente:
```
1. Explora productos en el catálogo
2. Añade productos al carrito
3. Ajusta cantidades
4. Añade notas (opcional)
5. Clic en "Pedir por WhatsApp"
6. Se abre WhatsApp con lista
7. Envía mensaje al vendedor
8. Vendedor confirma y procesa pedido
9. Cliente puede ver estado del pedido
```

### Admin:
```
1. Recibe notificación de nuevo pedido
2. Revisa detalle del pedido
3. Cambia estado según progreso
4. Contacta cliente si necesita
5. Completa el pedido
6. Cliente recibe actualización
```

---

## 📝 Notas Importantes

1. **Sin pagos en línea** - Todo se coordina por WhatsApp
2. **Pedidos como lista** - El cliente envía lista al vendedor
3. **Vendedor procesa** - Confirma disponibilidad, costo final, entrega
4. **Estados del pedido** - Para seguimiento simple
5. **Inventario** - Para control interno, no limita pedido (vendedor decide)

---

## ¿Procedemos con este plan?

Opciones:
1. ✅ **Aprobar y empezar**
2. 🔧 **Hacer ajustes menores**
3. 💬 **Discutir cambios importantes**
