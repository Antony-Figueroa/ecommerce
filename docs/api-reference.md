# 📋 Referencia API - Ana's Supplements

Documentación técnica de los endpoints del sistema. Todas las rutas administrativas requieren autenticación mediante el encabezado `Authorization: Bearer <token>`.

---

## 🔐 Autenticación

### Login Tradicional
- **Endpoint**: `POST /api/auth/login`
- **Body**: 
  ```json
  {
    "email": "admin@example.com",
    "password": "password123"
  }
  ```
- **Respuesta**: `200 OK` con token JWT y datos del usuario.

### Google OAuth
- **Endpoint**: `POST /api/auth/google`
- **Body**: `{ "credential": "JWT_FROM_GOOGLE" }`

---

## ⚙️ Administración (Rutas Protegidas)

### Dashboard y Estadísticas
- **Endpoint**: `GET /api/admin/stats`
- **Descripción**: Obtiene métricas clave para el panel principal.
- **Respuesta (Ejemplo)**:
  ```json
  {
    "totalOrders": 150,
    "pendingOrders": 5,
    "confirmedOrders": 140,
    "totalRevenue": 4500.50,
    "totalCustomers": 85,
    "totalProducts": 42,
    "lowStockProducts": 3,
    "chartData": [
      { "name": "01 Feb", "sales": 10, "revenue": 300 },
      { "name": "02 Feb", "sales": 12, "revenue": 350 }
    ],
    "recentOrders": [...]
  }
  ```

### Gestión de Pedidos (Sales)
- **Listar**: `GET /api/admin/sales?status=PENDING&startDate=2024-02-01`
- **Cambiar Estado**: `PATCH /api/admin/sales/:id/status`
- **Body**: `{ "status": "PROCESSING", "reason": "Pago verificado" }`

### Gestión de Pagos y Cuotas
- **Registrar Pago**: `POST /api/admin/payments/sales/:saleId/payments`
- **Crear Plan de Cuotas**: `POST /api/admin/payments/sales/:saleId/installments`
- **Estado de Pagos**: `GET /api/admin/payments/sales/:saleId/status`
- **Comprobantes Pendientes**: `GET /api/admin/payments/proofs/pending`
- **Verificar Comprobante**: `POST /api/admin/payments/proofs/:proofId/verify`
- **Body (Verificación)**: `{ "status": "APPROVED", "notes": "Referencia válida" }`

### Gestión de Productos e Inventario
- **Crear Producto**: `POST /api/admin/products`
- **Body**:
  ```json
  {
    "name": "Proteína Whey 2kg",
    "description": "Proteína de alta calidad",
    "priceUSD": 55.00,
    "stock": 20,
    "categoryId": "uuid-categoria",
    "isActive": true
  }
  ```
- **Auditoría de Inventario**: `GET /api/admin/inventory/logs`

---

## 🔔 Notificaciones y Tiempo Real

### Notificaciones del Sistema
- **Endpoint**: `GET /api/admin/notifications/unread`
- **Descripción**: Obtiene alertas no leídas (bajo stock, nuevos pedidos).

### WebSockets (Socket.io)
- **URL**: `ws://localhost:3001`
- **Eventos Emitidos**:
  - `new_order`: Notifica al admin sobre un nuevo pedido.
  - `stock_alert`: Notifica cuando un producto llega al nivel mínimo.
- **Configuración CORS**: Obligatorio permitir el origen del frontend para establecer la conexión.

---

## 🛠️ Códigos de Error Comunes

| Código | Mensaje | Descripción |
| :--- | :--- | :--- |
| `401` | Unauthorized | Token faltante o expirado. |
| `403` | Forbidden | El usuario no tiene rol de ADMINISTRADOR. |
| `404` | Not Found | El recurso solicitado no existe. |
| `500` | Internal Server Error | Error inesperado en el servidor o base de datos. |

---

## 🔗 Enlaces Rápidos
- [Arquitectura Técnica](file:///c:/Users/Server%20Admin/Desktop/ecommerce/docs/ARQUITECTURA.md)
- [Flujos de Negocio](file:///c:/Users/Server%20Admin/Desktop/ecommerce/docs/flujos-negocio.md)
- [Análisis Funcional](file:///c:/Users/Server%20Admin/Desktop/ecommerce/docs/analisis-funcional.md)

*Última actualización: 2026-02-11 (v1.2)*
