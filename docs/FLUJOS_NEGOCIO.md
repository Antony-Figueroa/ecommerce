# Flujos de Negocio - Ana's Supplements

## 1. Flujo de Compra (Cliente)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│   Catálogo  │ ──► │   Producto  │ ──► │   Carrito   │ ──► │  WhatsApp Vendedor│
│   Público   │     │   Detalle   │     │             │     │   (Pedido)       │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────────┘
      │                   │                   │                    │
      │ Ver productos     │ Ver detalles       │ Revisar items      │ Enviar pedido
      │                   │                   │                    │
      ▼                   ▼                   ▼                    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│ API: GET    │     │ API: GET    │     │ Context     │     │ Formato:        │
│ /products   │     │ /products/  │     │ CartContext │     │ "Hola, quiero:  │
│ /public     │     │ :id         │     │             │     │  2x Producto A   │
│             │     │             │     │             │     │  1x Producto B"  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────────┘
```

### Pasos Detallados

1. **Explorar Catálogo**
   - El cliente ve productos activos con precio en USD
   - El precio se muestra con conversión a BS: `price * BCVRate`

2. **Ver Detalle**
   - Información completa del producto
   - Stock disponible
   - Botón "Agregar al Carrito"

3. **Gestionar Carrito**
   - Cantidad editable
   - Eliminar items
   - Ver total USD y BS

4. **Finalizar Pedido**
   - Click en WhatsApp
   - Genera mensaje prellenado con productos y cantidades
   - El vendedor recibe y procesa la orden

---

## 2. Flujo de Venta (Administrador)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Pedido    │ ──► │  Registrar  │ ──► │   Descontar │ ──► │   Inventario │
│  WhatsApp   │     │   Venta     │     │   Stock     │     │   Actualizado│
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │                    │
      │ Cliente confirma │ POST /sales      │ InventoryLog       │ Reporte real
      │ compra           │                   │                    │
      ▼                   ▼                   ▼                    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Datos:       │     │ SaleService │     │ Producto     │     │ Stock bajo: │
│ - Items      │     │ createSale()│     │ stock -=     │     │ - Alerta    │
│ - Cantidades │     │             │     │ quantity     │     │ - Requerir  │
│ - Total USD/BS│    │             │     │              │     │   a proveedor│
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

### Cálculo de Precios y Ganancias

```typescript
// Para cada producto
const costoBaseUSD = purchasePrice + shippingCost
const precioVentaUSD = price
const gananciaUSD = precioVentaUSD - costoBaseUSD

// Conversión a BS
const precioVentaBS = precioVentaUSD * bcvRate
const gananciaBS = gananciaUSD * bcvRate

// Margen de ganancia
const margenPorcentaje = (gananciaUSD / costoBaseUSD) * 100
```

---

## 3. Flujo de Reabastecimiento (Inventario)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Stock     │ ──► │   Crear    │ ──► │   Ordenar   │ ──► │   Recibir   │
│   Bajo      │     │ Requerimiento│   │   a Proveedor│   │   Mercancía │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │                    │
      │ minStock reached  │ POST /requirements│ Proveedor envía   │ POST /requirements/
      │                   │                   │                    │ :id/receive
      ▼                   ▼                   ▼                    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Alertas:    │     │ Requerimiento│   │ Status:     │     │ Stock       │
│ - Reporte    │     │ - Supplier  │     │ PENDING →   │     │ incremento  │
│ - Dashboard  │     │ - Items     │     │   ORDERED   │     │ InventoryLog│
│             │     │ - Costos    │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

---

## 4. Flujo de Reportes

### Reporte de Rentabilidad

```
GET /api/admin/reports/profitability

Respuesta:
{
  "items": [
    {
      "sku": "VIT-001",
      "name": "Vitcomplex",
      "purchasePriceUSD": 8.50,
      "shippingCostUSD": 2.00,
      "totalCostUSD": 10.50,
      "salePriceUSD": 15.75,
      "profitUSD": 5.25,
      "bcvRate": 42.50,
      "totalCostBS": 446.25,
      "salePriceBS": 669.38,
      "profitBS": 223.13
    }
  ],
  "summary": {
    "totalProducts": 15,
    "totalQuantity": 3000,
    "inventoryCostUSD": 50000,
    "potentialProfitUSD": 25000
  }
}
```

### Reporte de Ventas

```
GET /api/admin/reports/sales?startDate=2026-01-01&endDate=2026-01-31

Respuesta:
{
  "items": [
    {
      "saleNumber": "VTA-240101-0001",
      "customerName": "Juan Pérez",
      "totalUSD": 150.00,
      "totalBS": 6375.00,
      "profitUSD": 45.00
    }
  ],
  "summary": {
    "totalSales": 25,
    "totalRevenueUSD": 3500,
    "totalProfitUSD": 1050
  }
}
```

---

## 5. Gestión de Tasa BCV

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Actualizar│ ──► │   Guardar   │ ──► │   Aplicar   │
│   Tasa      │     │   Nuevo     │     │   a Precios │
└─────────────┘     └─────────────┘     └─────────────┘
      │                   │                    │
      │ POST /bcv         │ BCVRate.create()  │ Precio USD × BCV
      ▼                   ▼                    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Body:        │     │ Rate anterior│    │ frontend    │
│ { rate: 45 } │     │ becomes     │    │ recalcula    │
│              │     │ inactive    │     │ BS prices   │
└─────────────┘     └─────────────┘     └─────────────┘
```

---

## 6. Estados de Órdenes

### Ventas
- **PENDING**: Esperando confirmación del vendedor
- **COMPLETED**: Entregada al cliente
- **CANCELLED**: Cancelada (stock restaurado)

### Requerimientos
- **PENDING**: Creado, esperando aprobación
- **APPROVED**: Aprobado para ordenar
- **ORDERED**: Pedido enviado al proveedor
- **RECEIVED**: Mercancía recibida (incrementa stock)
- **CANCELLED**: Cancelado
