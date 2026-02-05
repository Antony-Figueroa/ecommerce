# 📋 Referencia API - Ana's Supplements

Documentación de los endpoints principales del sistema. Todas las rutas administrativas requieren autenticación `Bearer <token>`.

---

## 🔐 Autenticación

### Login Tradicional
- **POST** `/api/auth/login`
- **Body**: `{ email, password }`

### Google OAuth
- **POST** `/api/auth/google`
- **Body**: `{ credential }` (Google ID Token)

### Perfil de Usuario
- **GET** `/api/auth/me`
- **PUT** `/api/auth/profile`

---

## 🛒 Catálogo (Público)

### Productos
- **GET** `/api/products` (Listado general)
- **GET** `/api/products/:id` (Detalle)
- **GET** `/api/products/search?q=...` (Búsqueda)

### Categorías
- **GET** `/api/categories` (Listado activo)

---

## ⚙️ Administración (Privado)

### Gestión de Productos
- **POST** `/api/admin/products` (Crear)
- **PUT** `/api/admin/products/:id` (Actualizar)
- **DELETE** `/api/admin/products/:id` (Eliminar/Desactivar)

### Gestión de Ventas
- **GET** `/api/admin/sales` (Historial)
- **POST** `/api/admin/sales` (Registrar venta manual)
- **PATCH** `/api/admin/sales/:id/status` (Cambiar estado)

### Inventario y Requerimientos
- **GET** `/api/admin/inventory` (Estado actual)
- **POST** `/api/admin/requirements` (Nuevo pedido a proveedor)
- **POST** `/api/admin/requirements/:id/receive` (Recibir mercancía)

### Tasa BCV
- **GET** `/api/admin/sales/bcv/current` (Tasa activa)
- **POST** `/api/admin/sales/bcv` (Actualizar tasa)

---

## 📊 Reportes y Analíticas
- **GET** `/api/admin/reports/dashboard` (Métricas generales)
- **GET** `/api/admin/reports/profitability` (Margen y ganancias)
- **GET** `/api/admin/reports/sales` (Ventas por período)

---

## 🔗 Enlaces Rápidos
- [Análisis Funcional](file:///c:/Users/Server%20Admin/Desktop/ecommerce/docs/analisis-funcional.md)
- [Flujos de Negocio](file:///c:/Users/Server%20Admin/Desktop/ecommerce/docs/flujos-negocio.md)
- [Arquitectura Técnica](file:///c:/Users/Server%20Admin/Desktop/ecommerce/docs/arquitectura.md)
- [Guía de Desarrollo](file:///c:/Users/Server%20Admin/Desktop/ecommerce/AGENTS.md)

*Última actualización: 2026-02-05*
