# Flujos de Negocio - Ana's Supplements

Este documento describe los procesos operativos clave del sistema, desde la perspectiva del cliente y del administrador.

---

## 1. Experiencia del Cliente (Tienda Online)

### 1.1 Flujo de Compra Estándar

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  1. Descubrimiento │ → │  2. Selección   │ → │ 3. Carrito      │
│  - Navegar catálogo │    │  - Ver detalles │    │ - Agregar items │
│  - Buscar producto │    │  - Añadir al    │    │ - Actualizar    │
│  - Filtrar por     │    │    carrito       │    │   cantidades    │
│    categoría       │    │  - Guardar       │    │ - Eliminar items│
└─────────────────┘    │    favoritos     │    └─────────────────┘
                      └─────────────────┘            │
                                                     ↓
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  7. Seguimiento  │ ← │  6. Confirmación │ ← │ 5. Checkout      │
│  - Ver estado   │    │  - Vendedor       │    │ - Revisar total │
│  - Notificaciones│    │    confirma       │    │ - Generar msg   │
│                 │    │  - WhatsApp       │    │   WhatsApp      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Detalles:**
1. **Descubrimiento**: El cliente navega por categorías, usa el buscador o filtra por marca/formato
2. **Selección**: Ve detalles del producto, imágenes, precio en USD y BS
3. **Carrito**: Gestionaitems, puede guardar favoritos
4. **Checkout**: Revisa su carrito y al hacer checkout se genera un mensaje estructurado para WhatsApp
5. **Confirmación**: El vendedor recibe el mensaje, confirma disponibilidad y cierra la venta
6. **Seguimiento**: El cliente puede ver el estado de su pedido en "Mi Cuenta"

### 1.2 Sistema de Precios

- Los precios se almacenan en **USD**
- El sistema convierte a **BS** usando la tasa BCV configurada
- La tasa se actualiza desde el panel admin
- Los precios en BS se recalculan automáticamente al cambiar la tasa

---

## 2. Operación Administrativa (Panel Admin)

### 2.1 Gestión de Pedidos

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  1. Nuevo        │ → │  2. Revisión     │ → │  3. Procesamiento│
│  - Cliente       │    │  - Ver detalles  │    │  - Cambiar estado│
│    genera orden │    │  - Aceptar/       │    │  - Confirmar pago│
│  - Aparece en   │    │    Rechazar       │    │  - Preparar envío│
│    dashboard    │    │                  │    │                  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ↓
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  6. Completado   │ ← │  5. Entrega      │ ← │  4. Envío        │
│  - Pedido        │    │  - Actualizar    │    │  - Registrar     │
│    entregado     │    │    estado         │    │    seguimiento   │
│  - Registrar en  │    │  - Notificar     │    │                  │
│    historial     │    │    cliente       │    │                  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Estados de Pedido:**
- **PENDIENTE**: Esperando revisión del vendedor
- **PROCESANDO**: Aceptado, en preparación
- **ACEPTADO**: Confirmado, esperando pago
- **COMPLETED**: Entregado y pagado
- **CANCELLED**: Cancelado por el cliente
- **RECHAZADO**: Rechazado por el vendedor

### 2.2 Flujo de Verificación de Pagos

1. El cliente realiza el pago por transferencia
2. El cliente o administrador carga el comprobante
3. El comprobante queda en estado **PENDIENTE**
4. El administrador revisa y aprueba o rechaza
5. Al aprobar:
   - Se registra un pago oficial
   - Se descuenta del saldo pendiente
   - Se actualiza el estado de la cuota

### 2.3 Sistema de Cuotas (Ventas Internas)

Para ventas a crédito con plan de pago:

1. **Creación del Plan**: El admin define número de cuotas (quincenales)
2. **Registro de Cuota**: Cada cuota tiene fecha de vencimiento y monto
3. **Pago**: El cliente paga y carga comprobante
4. **Verificación**: Admin aprueba el comprobante
5. **Actualización**: Se registra el pago, se descuenta del saldo
6. **Cierre**: Cuando saldo = 0, la venta se marca COMPLETED

### 2.4 Gestión de Inventario

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  1. Recepción   │ → │  2. Registro     │ → │  3. Monitoreo    │
│  - Llega        │    │  - Crear lote    │    │  - Dashboard     │
│    mercancía   │    │  - Vincular      │    │    muestra stock │
│                 │    │    proveedor     │    │    bajo          │
│                 │    │  - Definir costo │    │  - Alertas de    │
│                 │    │    y precio      │    │    vencimiento   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                          │
                          ↓
                   ┌─────────────────┐
                   │  4. Trazabilidad│
                   │  - Cada venta   │
                   │    descuenta del │
                   │    lote más     │
                   │    antiguo      │
                   │  - Historial    │
                   │    completo     │
                   └─────────────────┘
```

**Datos del Lote:**
- Número de lote
- Costo de adquisición (USD)
- Precio de venta
- Fecha de entrada
- Fecha de vencimiento (opcional)
- Proveedor vinculado
- Cantidad de unidades

### 2.5 Punto de Venta (POS)

Para ventas directas en tienda física:

1. El admin accede a Financial → Punto de Venta
2. Busca y selecciona productos
3. Define cantidades
4. Elige método de pago
5. Registra la venta
6. El sistema descuenta stock automáticamente

---

## 3. Flujo de Datos Financieros

### 3.1 Gestión de Tasa BCV

1. **Actualización**: Se realiza desde Configuración → Moneda
2. **Impacto**: Afecta inmediatamente al frontend público
3. **Historial**: Se mantiene registro de cada cambio (auditoría)
4. **Integridad**: Las ventas pasadas mantienen sus valores originales en USD

### 3.2 Análisis de Rentabilidad

El sistema calcula:
- **Margen por producto**: Precio de venta - Costo de adquisición
- **Costo del lote**: Total de unidades × Costo unitario
- **Ingresos**: Sumatoria de ventas completadas
- **Ganancias**: Ingresos - Costos

---

## 4. Notificaciones y Alertas

### 4.1 Tipos de Notificaciones

| Tipo | Descripción |
|------|-------------|
| **Nuevo Pedido** | Cuando un cliente genera una orden |
| **Pago Pendiente** | Cuando hay un comprobante por verificar |
| **Stock Bajo** | Cuando un producto tiene menos de 10 unidades |
| **Cuota Vencida** | Cuando una cuota vence sin pago |

### 4.2 Centro de Notificaciones

- Acceso desde el panel admin
- Marcar como leídas
- Filtrar por tipo
- Eliminar notificaciones antiguas

---

## 5. Auditoría del Sistema

Cada acción significativa se registra:
- Creación/modificación/eliminación de productos
- Cambios de estado de pedidos
- Actualizaciones de configuración
- Login de administradores
- Cambios de tasa BCV

---

## 6. Flujo de Usuarios y Roles

### 6.1 Cliente
1. Se registra o inicia sesión
2. Navega el catálogo
3. Agrega productos al carrito
4. Finaliza compra (genera mensaje WhatsApp)
5. Espera confirmación del vendedor
6. Recibe notificaciones sobre su pedido

### 6.2 Administrador
1. Inicia sesión en panel admin
2. Monitorea dashboard
3. Gestiona pedidos entrantes
4. Verifica pagos
5. Controla inventario
6. Genera reportes

---

## 7. Integraciones

### 7.1 WhatsApp
- El checkout genera un mensaje estructurado con:
  - Lista de productos
  - Cantidades
  - Totales en USD y BS
  - Datos del cliente

### 7.2 Google OAuth
- Autenticación con cuenta Google
- Datos del perfil sincronizados automáticamente

---

## 8. Casos Especiales

### 8.1 Pedido con Productos Agotados
- El vendedor identifica productos sin stock
- Puede negociar sustitución o eliminar del pedido
- El cliente confirma cambios

### 8.2 Cancelación de Cuotas
- Solo el administrador puede cancelar
- Se registra motivo de cancelación
- El historial se mantiene

### 8.3 Devoluciones
- No hay módulo de devoluciones automático
- Se maneja caso por caso manualmente
- Se registra en auditoría

---

## 9. Enlaces Relacionados

- [Análisis Funcional](analisis-funcional.md)
- [Arquitectura Técnica](ARQUITECTURA.md)
- [Referencia API](api-reference.md)
- [Manual de Mantenimiento](mantenimiento.md)

---

*Última actualización: 2026-03-02*
