# Arquitectura del Sistema - Ana's Supplements

## Visión General

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Vite + React + TypeScript)    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Catálogo   │  │   Carrito   │  │     Admin Dashboard      │ │
│  │   Público    │  │  WhatsApp   │  │  (Productos, Ventas)    │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└──────────────────────────┬────────────────────────────────────┘
                           │ API REST
┌──────────────────────────┴────────────────────────────────────┐
│                    BACKEND (Express + TypeScript)              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │   Auth JWT   │  │   Rutas API  │  │    Servicios de       │ │
│  │              │  │   /admin/    │  │    Negocio           │ │
│  └──────────────┘  └──────────────┘  └──────────────────────┘ │
└──────────────────────────┬────────────────────────────────────┘
                           │ Prisma ORM
┌──────────────────────────┴────────────────────────────────────┐
│                    BASE DE DATOS (SQLite)                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────────┐  │
│  │  Users   │ │ Products │ │ Sales    │ │ Requirements    │  │
│  │ Categories│ │ Inventory│ │ BCV Rate │ │ Inventory Logs  │  │
│  └──────────┘ └──────────┘ └──────────┘ └─────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

## Stack Tecnológico

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI)
- **Icons**: Lucide React
- **State Management**: React Context / Zustand (pendiente)

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma 5
- **Database**: SQLite (desarrollo) / PostgreSQL (producción)
- **Authentication**: JWT (jsonwebtoken)
- **Security**: Helmet, CORS, Rate Limiting

## Estructura de Proyecto

```
ecommerce/
├── src/                    # Frontend
│   ├── components/         # Componentes React
│   │   ├── ui/           # Componentes base (shadcn)
│   │   ├── layout/       # Navbar, Footer, Layout
│   │   ├── shop/         # Catálogo, filtros, búsqueda
│   │   ├── product/      # Detalles de producto
│   │   └── cart/         # Carrito, WhatsApp
│   ├── pages/             # Páginas de rutas
│   ├── hooks/            # Custom hooks
│   ├── contexts/         # React Contexts
│   ├── lib/              # Utilidades, API client
│   └── types/            # Tipos TypeScript
│
├── server/               # Backend
│   ├── src/
│   │   ├── routes/       # Rutas Express
│   │   │   ├── *.routes.ts
│   │   │   └── admin/    # Rutas protegidas
│   │   ├── services/     # Lógica de negocio
│   │   ├── middleware/   # Auth, validation
│   │   ├── lib/         # Prisma client, config
│   │   ├── utils/       # Helpers, errors
│   │   └── index.ts     # Entry point
│   │
│   └── prisma/
│       ├── schema.prisma # Schema de BD
│       └── seed.ts       # Datos iniciales
│
└── docs/                 # Documentación
```

## Modelo de Datos

### User (Administradores)
```
id: String (UUID)
email: String (único)
passwordHash: String
role: String ('ADMIN')
isActive: Boolean
createdAt/updatedAt: DateTime
```

### Category (Categorías)
```
id: String (UUID)
name: String
slug: String (único)
description: String?
icon: String?
sortOrder: Int
isActive: Boolean
```

### Product (Productos)
```
id: UUID │ sku: String(único) │ name: String
slug: String(único) │ description: String
price: Decimal │ purchasePrice: Decimal │ shippingCost: Decimal
profitMargin: Decimal (default: 1.5)
categoryId: String │ brand: String │ format: String │ weight: String?
stock: Int │ minStock: Int (default: 5)
inStock: Boolean │ isActive: Boolean │ isFeatured: Boolean
image: String?
createdAt/updatedAt: DateTime
```

### Sale (Ventas)
```
id: UUID │ saleNumber: String(único)
customerName?: String │ customerPhone?: String
status: String ('PENDING'|'COMPLETED'|'CANCELLED')
subtotalUSD: Decimal │ shippingCostUSD: Decimal │ totalUSD: Decimal
bcvRate: Decimal │ totalBS: Decimal
profitUSD: Decimal │ profitBS: Decimal
notes: String?
items: SaleItem[]
createdAt/updatedAt: DateTime
```

### SaleItem (Items de Venta)
```
id: UUID │ saleId: String │ productId: String
name: String │ quantity: Int
unitCost: Decimal │ unitPrice: Decimal │ total: Decimal
profitPerUnit: Decimal │ totalProfit: Decimal
```

### Requirement (Requerimientos a Proveedores)
```
id: UUID │ code: String(único) │ supplier: String
status: String ('PENDING'|'APPROVED'|'ORDERED'|'RECEIVED'|'CANCELLED')
subtotalUSD: Decimal │ totalUSD: Decimal
notes: String?
items: RequirementItem[]
createdAt/updatedAt: DateTime
```

### BCVRate (Tasa BCV)
```
id: UUID │ rate: Decimal │ source: String
isActive: Boolean │ validFrom: DateTime
```

### InventoryLog (Historial de Inventario)
```
id: UUID │ productId: String
changeType: String ('INITIAL_STOCK'|'RESTOCK'|'SALE'|'CANCELLED_SALE')
previousStock: Int │ newStock: Int │ changeAmount: Int
reason: String?
createdAt: DateTime
```

## Flujo de Datos

### Catálogo Público
```
1. Frontend → GET /api/products/public
2. Backend → InventoryService.getPublicProducts()
3. Prisma → SELECT * FROM Product WHERE isActive = true
4. Response → JSON con productos activos
5. Frontend → Renderiza catálogo
```

### Crear Venta → WhatsApp
```
1. Cliente selecciona productos
2. Carrito → POST /api/sales
3. SaleService.createSale():
   - Calcula totales USD y BS
   - Decrementa stock de productos
   - Crea InventoryLog
4. Response → Sale con items
5. Frontend → Genera mensaje WhatsApp
```

### Reporte de Rentabilidad
```
1. Admin → GET /api/admin/reports/profitability
2. BCVService.getCurrentRate()
3. Para cada producto:
   - CostoTotal = purchasePrice + shippingCost
   - Ganancia = price - CostoTotal
   - GananciaBS = Ganancia * BCVRate
4. Response → Array con todos los cálculos
```
