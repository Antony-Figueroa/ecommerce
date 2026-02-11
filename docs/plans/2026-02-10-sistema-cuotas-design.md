## Resumen
Se implementará un sistema de ventas internas con plan de cuotas sin interés. El plan divide el saldo pendiente en cuotas quincenales, permite pagos parciales y marca estados de cuota y del plan. La salida de inventario ocurre al confirmar la venta, no por cuotas.

## Objetivos
- Crear planes de cuotas sin interés con fechas quincenales.
- Registrar pagos y aplicarlos a la cuota más próxima pendiente o a una cuota específica.
- Mantener saldo pendiente, monto pagado y porcentaje pagado en tiempo real.
- Mostrar todo el flujo en el panel administrativo con términos en español.

## Alcance
- Backend: modelo de datos, servicios de negocio y rutas admin.
- Frontend admin: resumen financiero, plan de cuotas y registro de pagos.
- Validaciones: montos, fechas, y ajustes de decimales en la última cuota.

## Fuera de alcance
- Intereses, recargos o comisiones.
- Integración con pasarelas externas.
- Notificaciones automáticas por vencimiento.

## Modelo de datos
- Plan de cuotas: ventaId, cantidadCuotas, montoTotal, montoPagado, saldoPendiente, fechaInicio, estado.
- Cuota: planId, numero, fechaVencimiento, monto, montoPagado, estado.
- Pago: ventaId, cuotaId opcional, montoUSD, montoBs, metodo, referencia, observaciones, fecha.
- Comprobante: pagoId, url, estadoValidacion.

## Reglas de negocio
- El plan se crea con saldo pendiente actual y se divide en N cuotas iguales.
- Ajuste de decimales en la última cuota.
- Pagos no pueden exceder el saldo pendiente.
- Un pago se aplica automáticamente a la cuota pendiente más próxima si no se elige una.
- Si saldo pendiente llega a 0, el plan pasa a COMPLETADO y la venta a COMPLETADA.
- Cuotas vencidas siguen siendo pagables.

## API propuesta
- GET /api/admin/ventas/:id/estado-cuotas
- GET /api/admin/ventas/:id/pagos
- POST /api/admin/ventas/:id/plan-cuotas
- POST /api/admin/ventas/:id/pagos
- PATCH /api/admin/cuotas/:id

## Interfaz administrativa
- Resumen financiero con total, pagado, pendiente y porcentaje.
- Tabla de cuotas con estado, fechas y montos.
- Formulario de registro de pago con método y referencia.
- Indicadores de cuotas vencidas.

## Estrategia de implementación
1) Crear modelos y migración de base de datos.
2) Agregar repositorios y servicios de cuotas/pagos.
3) Implementar rutas admin y validaciones.
4) Integrar vista de órdenes con plan de cuotas y pagos.
5) Pruebas de creación de plan y pagos parciales/totales.

## Pruebas clave
- Crear plan con pago inicial y verificar saldo.
- Registrar pago parcial y verificar actualización de cuota.
- Completar saldo y verificar estado COMPLETADO.
