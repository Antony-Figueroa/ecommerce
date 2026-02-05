# API Reference - Ana's Supplements

## Base URL
```
Development: http://localhost:3001/api
```

## Autenticación

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@farmasiaplus.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "admin@farmasiaplus.com",
    "role": "ADMIN"
  }
}
```

### Todas las rutas admin requieren header:
```
Authorization: Bearer <token>
```

### Login con Google
```http
POST /auth/google
Content-Type: application/json

{
  "credential": "google-id-token"
}
```

**Response:**
```json
{
  "success": true,
  "token": "...",
  "user": { ... },
  "isNewUser": false
}
```
*Si `isNewUser` es `true`, el frontend debe redirigir a `/google-confirm`.*

### Registro con Google (Completar)
```http
POST /auth/google/register
Content-Type: application/json

{
  "googleId": "...",
  "email": "...",
  "name": "...",
  "avatarUrl": "...",
  "username": "chosen_username"
}
```

### Verificar disponibilidad de Username
```http
GET /auth/check-username?username=chosen_username
```

**Response:**
```json
{
  "available": true
}
```

---

## Productos

### Listar productos (público)
```http
GET /products/public
GET /products/public?categoryId=uuid&search=omega
```

**Response:**
```json
{
  "products": [
    {
      "id": "uuid",
      "sku": "VIT-001",
      "name": "Vitcomplex Multivitamínico",
      "slug": "vitcomplex-multivitaminico",
      "description": "...",
      "price": 15.75,
      "image": "url",
      "brand": "Vitcomplex",
      "format": "Cápsulas",
      "stock": 150,
      "inStock": true,
      "category": {
        "id": "uuid",
        "name": "Vitaminas y Suplementos",
        "slug": "vitaminas-suplementos"
      }
    }
  ]
}
```

### Detalle producto
```http
GET /products/:id
```

### Listar productos (admin)
```http
GET /admin/products?page=1&limit=20&categoryId=uuid&search=omega
```

**Response:**
```json
{
  "products": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

### Crear producto
```http
POST /admin/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "sku": "VIT-002",
  "name": "Nuevo Producto",
  "description": "Descripción",
  "purchasePrice": 10.00,
  "shippingCost": 2.00,
  "profitMargin": 1.5,
  "categoryId": "uuid",
  "brand": "Marca",
  "format": "Cápsulas",
  "weight": "60 unidades",
  "stock": 100,
  "minStock": 10
}
```

### Actualizar producto
```http
PUT /admin/products/:id
Authorization: Bearer <token>

{
  "price": 18.00,
  "stock": 80
}
```

### Eliminar producto
```http
DELETE /admin/products/:id
Authorization: Bearer <token>
```

---

## Categorías

### Listar categorías
```http
GET /categories
```

**Response:**
```json
{
  "categories": [
    {
      "id": "uuid",
      "name": "Vitaminas y Suplementos",
      "slug": "vitaminas-suplementos",
      "description": "...",
      "icon": "pill",
      "sortOrder": 1
    }
  ]
}
```

---

## Ventas

### Crear venta
```http
POST /admin/sales
Authorization: Bearer <token>
Content-Type: application/json

{
  "customerName": "Juan Pérez",
  "customerPhone": "+584123456789",
  "items": [
    {
      "productId": "uuid",
      "name": "Vitcomplex",
      "quantity": 2,
      "unitPrice": 15.75
    }
  ],
  "shippingCost": 5.00,
  "notes": "Entregar en Residencias"
}
```

**Response:**
```json
{
  "id": "uuid",
  "saleNumber": "VTA-240101-0001",
  "subtotalUSD": 31.50,
  "shippingCostUSD": 5.00,
  "totalUSD": 36.50,
  "bcvRate": 42.50,
  "totalBS": 1551.25,
  "profitUSD": 10.50,
  "items": [...]
}
```

### Listar ventas
```http
GET /admin/sales?page=1&limit=20&status=PENDING&startDate=2026-01-01
```

### Obtener venta
```http
GET /admin/sales/:id
```

### Actualizar estado
```http
PATCH /admin/sales/:id/status
Authorization: Bearer <token>

{
  "status": "COMPLETED"
}
```

### Cancelar venta
```http
POST /admin/sales/:id/cancel
Authorization: Bearer <token>
```
*Nota: Cancela y restaura el stock*

---

## Requerimientos (Proveedores)

### Crear requerimiento
```http
POST /admin/requirements
Authorization: Bearer <token>
Content-Type: application/json

{
  "supplier": "Distribuidora Pharma",
  "notes": "Pedido mensual",
  "items": [
    {
      "productId": "uuid",
      "name": "Vitcomplex",
      "quantity": 50,
      "unitCost": 8.50
    }
  ]
}
```

### Listar requerimientos
```http
GET /admin/requirements?status=PENDING&page=1
```

### Resumen
```http
GET /admin/requirements/summary
```

**Response:**
```json
{
  "counts": {
    "pending": 3,
    "approved": 2,
    "ordered": 1,
    "received": 10,
    "cancelled": 1
  },
  "totalInvestedUSD": 5000.00
}
```

### Recibir mercancia
```http
POST /admin/requirements/:id/receive
Authorization: Bearer <token>
```
*Nota: Incrementa stock de productos*

---

## Reportes

### Dashboard
```http
GET /admin/reports/dashboard
Authorization: Bearer <token>
```

**Response:**
```json
{
  "updatedAt": "2026-01-15T10:30:00Z",
  "bcvRate": 42.50,
  "sales": {
    "today": 5,
    "revenueUSD": 500.00,
    "revenueBS": 21250.00,
    "profitUSD": 150.00
  },
  "inventory": {
    "totalProducts": 50,
    "totalValueUSD": 10000,
    "potentialProfit": 5000,
    "lowStock": 3,
    "outOfStock": 1
  },
  "requirements": {
    "pending": 2,
    "totalInvested": 2500
  },
  "recentSales": [...]
}
```

### Rentabilidad
```http
GET /admin/reports/profitability
Authorization: Bearer <token>
```

**Response:**
```json
{
  "reportDate": "2026-01-15T10:30:00Z",
  "bcvRate": 42.50,
  "items": [
    {
      "sku": "VIT-001",
      "name": "Vitcomplex",
      "purchasePriceUSD": 8.50,
      "shippingCostUSD": 2.00,
      "totalCostUSD": 10.50,
      "salePriceUSD": 15.75,
      "profitUSD": 5.25,
      "profitMarginPercent": 50.0,
      "profitBS": 223.13,
      "quantity": 150,
      "potentialProfitTotal": 787.50
    }
  ],
  "summary": {
    "totalProducts": 50,
    "totalQuantity": 3000,
    "inventoryCostUSD": 50000,
    "potentialProfitUSD": 25000,
    "potentialProfitBS": 1062500
  }
}
```

### Ventas
```http
GET /admin/reports/sales?startDate=2026-01-01&endDate=2026-01-31
Authorization: Bearer <token>
```

### Inventario
```http
GET /admin/reports/inventory
Authorization: Bearer <token>
```

### Requerimientos
```http
GET /admin/reports/requirements?status=RECEIVED
Authorization: Bearer <token>
```

---

## BCV

### Tasa actual
```http
GET /admin/sales/bcv/current
```

**Response:**
```json
{ "rate": 42.50 }
```

### Actualizar tasa
```http
POST /admin/sales/bcv
Authorization: Bearer <token>
Content-Type: application/json

{
  "rate": 45.00,
  "source": "manual"
}
```

### Historial
```http
GET /admin/sales/bcv/history
```

---

## Inventario

### Reporte de inventario
```http
GET /admin/products/inventory-report
Authorization: Bearer <token>
```

### Logs de inventario
```http
GET /admin/products/inventory-logs?productId=uuid&limit=50
Authorization: Bearer <token>
```

---

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| 400 | Bad Request - Datos inválidos |
| 401 | Unauthorized - Token requerido |
| 403 | Forbidden - No tiene permisos |
| 404 | Not Found - Recurso no existe |
| 409 | Conflict - Conflicto (ej. SKU duplicado) |
| 500 | Internal Server Error |
