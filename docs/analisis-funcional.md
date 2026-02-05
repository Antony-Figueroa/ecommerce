# 🏥 Análisis Funcional - Ana's Supplements

Este documento detalla las funcionalidades, reglas de negocio y especificaciones técnicas del sistema.

---

## 1. Propósito del Sistema
Ana's Supplements es un e-commerce para farmacias basado en un modelo de **venta asistida por WhatsApp**. Permite a los clientes explorar un catálogo dinámico y enviar pedidos directamente a un vendedor, mientras proporciona herramientas de gestión administrativa robustas.

---

## 2. Actores y Roles

### 👤 Cliente Final (Público)
- **Catálogo**: Explora productos con precios actualizados (USD/BS).
- **Carrito**: Gestiona productos y cantidades localmente.
- **WhatsApp**: Genera un mensaje estructurado con el pedido para el vendedor.

### 🔑 Administrador
- **Dashboard**: Monitoreo de ventas, inventario y métricas en tiempo real.
- **Inventario**: Gestión de productos, costos, márgenes y stock.
- **Ventas**: Registro manual de ventas concretadas para auditoría y reportes.
- **Requerimientos**: Gestión de pedidos a proveedores para reposición de stock.

---

## 3. Reglas de Negocio Críticas

### 💰 Gestión de Precios
- Los precios base se manejan en **USD**.
- La conversión a **BS** se realiza en tiempo real usando la tasa configurada (BCV).
- El sistema sugiere PVPs basados en: `(Costo de Compra + Envío) * Margen`.

### 📦 Control de Inventario
- El stock nunca debe ser negativo.
- Cada movimiento (venta, reposición, ajuste) genera un rastro en `InventoryLog`.
- Las categorías no pueden eliminarse si tienen productos asociados.

### 🛡️ Seguridad y Validación
- Autenticación vía JWT y Google OAuth.
- Validación estricta de datos (teléfonos, emails, nombres) mediante esquemas Zod.

---

## 4. Flujos de Trabajo

### Ciclo de Venta
1. Cliente arma pedido en la web.
2. Cliente envía pedido estructurado por WhatsApp.
3. Vendedor confirma pago y disponibilidad.
4. Admin registra la venta en el sistema para descontar stock.

### Ciclo de Reposición
1. Admin identifica stock bajo.
2. Crea un **Requerimiento** (Orden de Compra).
3. Al recibir la mercancía, marca como `RECEIVED`.
4. El sistema incrementa el stock automáticamente.

---

## 🔗 Enlaces Rápidos
- [Arquitectura Técnica](file:///c:/Users/Server%20Admin/Desktop/ecommerce/docs/arquitectura.md)
- [Referencia API](file:///c:/Users/Server%20Admin/Desktop/ecommerce/docs/api-reference.md)
- [Flujos de Negocio](file:///c:/Users/Server%20Admin/Desktop/ecommerce/docs/flujos-negocio.md)
- [Guía de Desarrollo](file:///c:/Users/Server%20Admin/Desktop/ecommerce/AGENTS.md)

*Última actualización: 2026-02-05*
