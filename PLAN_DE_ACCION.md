# Plan de Acción: Sistema E-commerce Ana's Supplements

## 1. Resumen del Proyecto

Simplificar el sistema e-commerce para un modelo de venta asistida por WhatsApp donde el cliente genera su pedido desde el catálogo y este se envía directamente al vendedor para gestión manual.

---

## 2. Flujo del Sistema

### 2.1 Flujo del Cliente (Público)
```
Catálogo de Productos
        ↓
Ver Detalles / Agregar al Carrito
        ↓
Carrito de Compras
        ↓
Generar Pedido WhatsApp
        ↓
Vendedor recibe lista → Gestiona venta manualmente
```

### 2.2 Flujo del Admin
```
Dashboard
    ├── Gestión de Productos (CRUD)
    ├── Requerimientos (Pedidos a proveedores)
    ├── Ventas Realizadas
    └── Reportes Financieros
```

---

## 3. Entidades del Sistema

### 3.1 Productos
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| sku | String | Código SKU único |
| name | String | Nombre del producto |
| slug | String | URL amigable |
| description | String | Descripción |
| price | Decimal | Precio de venta USD |
| image | String | URL de imagen |
| categoryId | UUID | Categoría |
| brand | String | Marca |
| format | String | Formato (tabletas, capsulas, etc.) |
| weight | String | Peso/presentación |
| **purchasePrice** | Decimal | Costo de compra USD |
| **shippingCost** | Decimal | Costo de envío prorrateado USD |
| **profitMargin** | Decimal | Margen de ganancia (ej: 1.5) |
| stock | Int | Stock actual |
| **minStock** | Int | Stock mínimo para alerta |
| inStock | Boolean | Disponible |
| isActive | Boolean | Visible en catálogo |
| isFeatured | Boolean | Producto destacado |
| createdAt | DateTime | Fecha de creación |
| updatedAt | DateTime | Última actualización |

### 3.2 Categorías
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| name | String | Nombre |
| slug | String | URL amigable |
| description | String | Descripción |
| image | String | URL de imagen |
| icon | String | Icono/emoji |
| isActive | Boolean | Activa |
| sortOrder | Int | Orden de aparición |
| createdAt | DateTime | Fecha de creación |

### 3.3 Requerimientos (Pedidos a Proveedores)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| code | String | Código (REQ-YYYYMMDD-XXXX) |
| supplier | String | Nombre del proveedor |
| status | String | PENDIENTE/RECIBIDO/CANCELADO |
| items | JSON | [{productId, name, quantity, unitCost, total}] |
| subtotalUSD | Decimal | Subtotal USD |
| totalUSD | Decimal | Total USD |
| notes | String | Notas adicionales |
| createdAt | DateTime | Fecha de creación |
| updatedAt | DateTime | Última actualización |

### 3.4 Ventas (Registro Interno)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| saleNumber | String | Número de venta |
| customerName | String | Nombre del cliente |
| customerPhone | String | Teléfono WhatsApp |
| status | String | PENDIENTE/CONFIRMADO/ENTREGADO/CANCELADO |
| items | JSON | [{productId, name, quantity, unitPrice, total}] |
| subtotalUSD | Decimal | Subtotal USD |
| shippingCostUSD | Decimal | Costo de envío |
| totalUSD | Decimal | Total USD |
| bcvRate | Decimal | Tasa BCV usada |
| totalBS | Decimal | Total en Bs |
| profitUSD | Decimal | Ganancia USD |
| profitBS | Decimal | Ganancia en Bs |
| notes | String | Notas |
| createdAt | DateTime | Fecha de creación |

### 3.5 Tasa BCV
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| rate | Decimal | Tasa del día |
| source | String | Fuente (manual/api) |
| isActive | Boolean | Activa |
| validFrom | DateTime | Vigencia |
| createdAt | DateTime | Fecha de creación |

---

## 4. Funcionalidades por Rol

### 4.1 Cliente (Público)
- ✅ Ver catálogo de productos
- ✅ Filtrar por categoría
- ✅ Buscar productos
- ✅ Ver detalles de producto
- ✅ Agregar al carrito
- ✅ Gestionar carrito
- ✅ **Generar pedido WhatsApp** (lista de productos + cantidades)
- ✅ Contactar vendedor por WhatsApp

### 4.2 Admin
#### Dashboard
- Resumen de métricas
- Productos con stock bajo
- Ventas recientes
- Acciones rápidas

#### Gestión de Productos
- Crear producto (con costos)
- Editar producto
- Eliminar producto
- Activar/Desactivar producto
- Ver historial de stock

#### Requerimientos (Pedidos a Proveedores)
- Crear requerimiento
- Editar requerimiento
- Cambiar estado (Pendiente → Recibido → Cancelado)
- Eliminar requerimiento
- Ver detalles

#### Ventas
- Ver ventas realizadas
- Filtrar por fecha/estado
- Ver detalles de venta
- Editar estado de venta

#### Reportes
- **Reporte de Ventas**: Lista con columnas:
  - Cantidad | Descripción | Costo Total | Precio Venta | Ganancia/Unidad | Ganancia Total
- **Reporte Financiero**:
  - Total ventas USD/BS
  - Total ganancias USD/BS
  - Productos más vendidos
- **Reporte de Inventario**:
  - Stock actual
  - Valor total del inventario
  - Alertas de stock bajo
- **Reporte de Requerimientos**:
  - Pedidos a proveedores
  - Gastos en compras

---

## 5. Arquitectura Técnica

### 5.1 Stack Tecnológico
```
Frontend: React + Vite + TailwindCSS + shadcn/ui
Backend: Express + TypeScript + Prisma + SQLite
WhatsApp: API de WhatsApp (enlace wa.me)
```

### 5.2 Estructura de Archivos
```
src/
├── pages/
│   ├── home/
│   ├── catalog/
│   ├── product/
│   ├── cart/
│   └── admin/
│       ├── dashboard/
│       ├── products/
│       ├── requirements/
│       ├── sales/
│       └── reports/
├── components/
│   ├── layout/
│   ├── shared/
│   └── ui/
├── contexts/
├── hooks/
├── lib/
└── types/

server/src/
├── routes/
├── services/
├── models/
└── middleware/
```

### 5.3 API Endpoints

#### Productos
```
GET    /api/products              - Listar productos (público)
GET    /api/products/:id           - Ver producto
GET    /api/products/category/:id  - Productos por categoría
POST   /api/admin/products         - Crear producto
PATCH  /api/admin/products/:id     - Editar producto
DELETE /api/admin/products/:id     - Eliminar producto
POST   /api/admin/products/:id/stock - Ajustar stock
```

#### Categorías
```
GET    /api/categories            - Listar categorías
POST   /api/admin/categories      - Crear categoría
PATCH  /api/admin/categories/:id  - Editar categoría
DELETE /api/admin/categories/:id  - Eliminar categoría
```

#### Requerimientos
```
GET    /api/admin/requirements    - Listar requerimientos
POST   /api/admin/requirements    - Crear requerimiento
GET    /api/admin/requirements/:id - Ver requerimiento
PATCH  /api/admin/requirements/:id - Editar/Actualizar estado
DELETE /api/admin/requirements/:id - Eliminar requerimiento
```

#### Ventas
```
GET    /api/admin/sales           - Listar ventas
GET    /api/admin/sales/:id      - Ver venta
POST   /api/admin/sales          - Registrar venta
PATCH  /api/admin/sales/:id      - Actualizar estado
```

#### Reportes
```
GET    /api/admin/reports/sales?start=&end= - Reporte de ventas
GET    /api/admin/reports/inventory         - Reporte de inventario
GET    /api/admin/reports/financial?start=&end= - Resumen financiero
GET    /api/admin/reports/requirements?start=&end= - Reporte de requerimientos
```

#### BCV
```
GET    /api/financial/bcv-rate    - Obtener tasa actual
POST   /api/financial/bcv-rate    - Actualizar tasa
```

---

## 6. Funcionalidades a Eliminar

### 6.1 Eliminar Completamente
- [ ] Sistema de usuarios/clientes (login/register)
- [ ] Sistema de cupones
- [ ] Sistema de wishlist
- [ ] Sistema de reseñas
- [ ] Direcciones de envío
- [ ] Perfiles de usuario
- [ ] Carrito persistente (solo local)

### 6.2 Simplificar
- [ ] Checkout → Solo genera WhatsApp
- [ ] Órdenes → Solo registro interno
- [ ] Autenticación → Opcional (solo para admin)

---

## 7. Pantallas del Frontend

### 7.1 Públicas
| Pantalla | Ruta | Descripción |
|----------|------|-------------|
| Home | `/` | Landing page |
| Catálogo | `/productos` | Grid de productos con filtros |
| Detalle Producto | `/producto/:id` | Info completa + agregar al carrito |
| Carrito | `/carrito` | Revisar + generar WhatsApp |

### 7.2 Admin
| Pantalla | Ruta | Descripción |
|----------|------|-------------|
| Dashboard | `/admin` | Resumen + métricas |
| Productos | `/admin/products` | CRUD productos |
| Requerimientos | `/admin/requirements` | Gestión de pedidos a proveedores |
| Ventas | `/admin/sales` | Registro de ventas |
| Reportes | `/admin/reports` | Reportes financieros |
| Configuración | `/admin/settings` | Tasa BCV, datos básicos |

---

## 8. Modelos de Datos Simplificados

### 8.1 Producto (simplificado)
```typescript
interface Product {
  id: string
  sku: string
  name: string
  slug: string
  description: string
  price: Decimal           // Precio de venta USD
  image: string
  categoryId: string
  brand: string
  format: string
  weight: string
  purchasePrice: Decimal   // Costo de compra USD
  shippingCost: Decimal   // Envío prorrateado USD
  profitMargin: Decimal  // Margen (ej: 1.5)
  stock: int
  minStock: int
  inStock: boolean
  isActive: boolean
  isFeatured: boolean
  createdAt: DateTime
}
```

### 8.2 Requerimiento (nuevo)
```typescript
interface Requirement {
  id: string
  code: string              // REQ-20240203-0001
  supplier: string
  status: 'PENDING' | 'RECEIVED' | 'CANCELLED'
  items: RequirementItem[]
  subtotalUSD: Decimal
  totalUSD: Decimal
  notes: string
  createdAt: DateTime
}

interface RequirementItem {
  productId: string
  name: string
  quantity: int
  unitCost: Decimal
  total: Decimal
}
```

### 8.3 Venta (registro interno)
```typescript
interface Sale {
  id: string
  saleNumber: string        // VTA-20240203-0001
  customerName: string
  customerPhone: string
  status: 'PENDING' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED'
  items: SaleItem[]
  subtotalUSD: Decimal
  shippingCostUSD: Decimal
  totalUSD: Decimal
  bcvRate: Decimal
  totalBS: Decimal
  profitUSD: Decimal
  profitBS: Decimal
  notes: string
  createdAt: DateTime
}
```

---

## 9. Implementación por Fases

### Fase 1: Limpieza y Base
- [ ] Eliminar modelos innecesarios
- [ ] Simplificar esquema Prisma
- [ ] Actualizar rutas API
- [ ] Limpiar componentes frontend

### Fase 2: Catálogo Público
- [ ] Página de catálogo
- [ ] Filtros por categoría
- [ ] Búsqueda
- [ ] Detalle de producto
- [ ] Carrito (localStorage)
- [ ] Generación WhatsApp

### Fase 3: Admin Productos
- [ ] CRUD productos
- [ ] Formulario con campos de costos
- [ ] Gestión de categorías
- [ ] Ajuste de stock

### Fase 4: Admin Requerimientos
- [ ] CRUD requerimientos
- [ ] Items con costos
- [ ] Estados
- [ ] Cálculo de totales

### Fase 5: Admin Ventas
- [ ] Registro manual de ventas
- [ ] Cálculo automático de ganancias
- [ ] Estados de venta

### Fase 6: Reportes
- [ ] Reporte de ventas
- [ ] Reporte financiero
- [ ] Reporte de inventario
- [ ] Reporte de requerimientos

---

## 10. Pendientes de Decisión

1. [ ] ¿El admin tendrá autenticación o será abierto?
2. [ ] ¿Cómo se calcula el precio de venta? (manual o automático con margen)
3. [ ] ¿El WhatsApp va directo al vendedor o hay paso intermedio?
4. [ ] ¿Se guarda registro de cada requerimiento completado?

---

## 11. Métricas del Dashboard

- Total productos
- Productos con stock bajo
- Total ventas del mes
- Ganancias del mes
- Total requerimientos pendientes
- Valor del inventario

---

*Documento creado: 2026-02-03*
*Versión: 1.0*
