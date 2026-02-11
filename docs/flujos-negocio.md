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
3. Si el pago es fraccionado, se activa la opción de **Plan de Cuotas**.
4. El sistema descuenta el stock y actualiza las métricas de ingresos del día.

### Gestión de Cuotas y Verificación
Para ventas con planes de pago:
1. **Creación del Plan**: El admin define el número de cuotas y fechas de vencimiento.
2. **Carga de Comprobantes**: El cliente envía o el admin carga el comprobante de pago (`PaymentProof`).
3. **Validación**: El administrador revisa los comprobantes pendientes, aprobándolos o rechazándolos.
4. **Actualización de Saldo**: Al aprobar un comprobante, se registra un `Payment` oficial, se actualiza el `paidAmount` de la cuota y el saldo pendiente de la `Sale`.
5. **Cierre Automático**: Cuando el saldo llega a cero, el plan y la venta se marcan como **COMPLETADO**.

### Ciclo de Inventario y Alertas
1. **Recepción de Mercancía**: El administrador registra la entrada de nuevos productos mediante **Lotes (Batches)**, especificando proveedor, costo y fecha de vencimiento.
2. **Monitoreo**: El Dashboard muestra productos con "Bajo Stock" y alertas de vencimiento próximo.
3. **Reposición**: El admin crea un requerimiento de compra basado en las necesidades de stock.
4. **Auditoría**: Cada cambio en el inventario genera un registro en el historial de movimientos (`InventoryLog`).

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

*Última actualización: 2026-02-11 (v1.2)*
