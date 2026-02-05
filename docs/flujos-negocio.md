# 🔄 Flujos de Negocio - Ana's Supplements

Este documento describe los procesos operativos clave desde la perspectiva del cliente y del administrador.

---

## 1. Experiencia del Cliente (Venta Asistida)

El flujo está diseñado para ser rápido y sin fricciones, utilizando WhatsApp como canal de cierre.

1. **Descubrimiento**: El cliente navega por el catálogo dinámico, filtra por categorías o busca productos específicos.
2. **Selección**: Añade productos al carrito. El carrito muestra totales en **USD** y **BS** (calculado automáticamente).
3. **Checkout (WhatsApp)**: Al finalizar, el sistema genera un mensaje estructurado:
   ```text
   Hola Ana's Supplements, quiero ordenar:
   - 2x Vitcomplex Multivitamínico ($49.98)
   - 1x Omega 3 Premium ($19.99)
   Total: $69.97 / Bs. 2,973.72
   ```
4. **Cierre**: El vendedor recibe el mensaje y coordina el pago y la entrega.

---

## 2. Operación Administrativa

### Registro de Venta Manual
Cuando una venta se concreta por WhatsApp, el administrador debe registrarla:
1. Accede a **Admin > Ventas**.
2. Selecciona los productos y cantidades.
3. El sistema captura la tasa BCV actual y calcula la ganancia neta.
4. Al guardar, el stock se descuenta automáticamente y se genera un log.

### Ciclo de Abastecimiento
1. **Detección**: El sistema alerta sobre productos con stock bajo (`minStock`).
2. **Requerimiento**: El admin crea un requerimiento para un proveedor.
3. **Recepción**: Al llegar el pedido, el admin marca el requerimiento como recibido. El sistema actualiza el stock y registra los nuevos costos si hubieran cambiado.

---

## 3. Gestión de Tasas (BCV)

Dada la volatilidad cambiaria, la gestión de la tasa es central:
- La tasa puede actualizarse manualmente desde el panel de configuración.
- Al cambiar la tasa, todos los precios en BS en el catálogo público se recalculan instantáneamente.
- Las ventas históricas conservan la tasa que estaba vigente al momento de la transacción.

---

## 🔗 Enlaces Rápidos
- [Análisis Funcional](file:///c:/Users/Server%20Admin/Desktop/ecommerce/docs/analisis-funcional.md)
- [Referencia API](file:///c:/Users/Server%20Admin/Desktop/ecommerce/docs/api-reference.md)
- [Arquitectura Técnica](file:///c:/Users/Server%20Admin/Desktop/ecommerce/docs/arquitectura.md)
- [Guía de Desarrollo](file:///c:/Users/Server%20Admin/Desktop/ecommerce/AGENTS.md)

*Última actualización: 2026-02-05*
