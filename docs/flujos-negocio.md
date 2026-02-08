# 🔄 Flujos de Negocio - Ana's Supplements

Este documento describe los procesos operativos clave, incluyendo la integración con WhatsApp y el sistema de gestión interna.

---

## 1. Experiencia del Cliente (Venta Asistida)

El flujo está diseñado para ser rápido y sin fricciones, utilizando WhatsApp como canal de cierre.

1. **Descubrimiento**: El cliente navega por el catálogo, filtra por categorías o busca productos.
2. **Selección**: Añade productos al carrito. El sistema muestra precios en **USD** y **BS** basados en la tasa BCV activa.
3. **Checkout (WhatsApp)**: Al finalizar, el sistema genera un mensaje estructurado para el vendedor.
4. **Seguimiento**: Una vez que el vendedor registra la venta, el cliente puede recibir notificaciones sobre el estado de su pedido.

---

## 2. Operación Administrativa (Dashboard)

### Gestión de Pedidos en Tiempo Real
1. **Recepción**: Cuando entra un pedido, el Dashboard se actualiza instantáneamente vía WebSockets.
2. **Procesamiento**: El administrador cambia el estado del pedido (Pendiente -> Procesando -> Enviado/Entregado).
3. **Notificaciones**: El sistema genera alertas internas para pedidos críticos o pagos pendientes.

### Registro de Venta Manual
Cuando una venta se concreta por canales externos, el administrador debe registrarla:
1. Accede a **Admin > Pedidos > Nuevo Registro**.
2. Selecciona productos, cantidades y método de pago.
3. El sistema descuenta el stock y actualiza las métricas de ingresos del día.

### Ciclo de Inventario y Alertas
1. **Monitoreo**: El Dashboard muestra productos con "Bajo Stock".
2. **Reposición**: El admin crea un requerimiento de compra.
3. **Auditoría**: Cada cambio en el inventario genera un registro en el historial de movimientos (`InventoryLog`).

---

## 3. Flujo de Datos Financieros

### Gestión de Tasa BCV
- La tasa es el eje central para el cálculo de precios en Bolívares.
- **Actualización**: Se realiza desde la configuración global.
- **Impacto**: Afecta inmediatamente al frontend público, pero no altera los registros de ventas pasadas (integridad histórica).

### Análisis de Rentabilidad
- El sistema calcula el margen de ganancia restando el costo de adquisición (registrado en el requerimiento) del precio de venta final.
- Los reportes de rentabilidad permiten filtrar por rango de fechas para evaluar el rendimiento del negocio.

---

## 🔗 Enlaces Rápidos
- [Análisis Funcional](file:///c:/Users/Server%20Admin/Desktop/ecommerce/docs/analisis-funcional.md)
- [Referencia API](file:///c:/Users/Server%20Admin/Desktop/ecommerce/docs/api-reference.md)
- [Arquitectura Técnica](file:///c:/Users/Server%20Admin/Desktop/ecommerce/docs/ARQUITECTURA.md)

*Última actualización: 2026-02-08 (v1.1)*
