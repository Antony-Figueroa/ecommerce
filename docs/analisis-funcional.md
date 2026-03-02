# Análisis Funcional - Ana's Supplements

Este documento detalla las funcionalidades del sistema y proporciona una guía para su despliegue.

---

## 1. Propósito del Sistema

Ana's Supplements es un e-commerce especializado en la venta de suplementos nutricionales que opera con un modelo híbrido:
- **Catálogo digital**: Los clientes navegan y seleccionan productos online
- **Venta asistida por WhatsApp**: El cierre de venta se realiza mediante un mensaje estructurado que el cliente envía al vendedor
- **Gestión administrativa integral**: Panel completo para administración de inventario, pedidos, clientes y reportes

---

## 2. Guía de Instalación y Configuración

### Requisitos Previos
- **Node.js**: v18 o superior
- **npm**: v9 o superior

### Pasos de Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repositorio>
   cd ecommerce
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**

   En la raíz del proyecto (`.env`):
   ```bash
   VITE_API_URL=http://localhost:3001/api
   ```

   En `server/.env`:
   ```bash
   DATABASE_URL="file:./dev.db"
   JWT_SECRET=tu-clave-secreta-segura
   PORT=3001
   ```

4. **Preparar la base de datos**
   ```bash
   npm run db:push
   npm run db:generate
   npm run db:seed  # Opcional: datos de prueba
   ```

5. **Iniciar en desarrollo**
   - Frontend: `npm run dev` (Puerto 5173)
   - Backend: `npm run server` (Puerto 3001)

---

## 3. Funcionalidades Principales

### 3.1 Módulos para el Cliente (Frontend)

| Funcionalidad | Descripción |
|---------------|-------------|
| **Catálogo Inteligente** | Navegación por categorías, búsqueda por texto, filtros por marca/formato/disponibilidad |
| **Precios Multimoneda** | Visualización automática en USD y BS según tasa BCV |
| **Detalle de Producto** | Imágenes múltiples, descripción completa, stock actual |
| **Carrito Persistente** | Los productos se mantienen en localStorage al recargar |
| **Favoritos** | Guardar productos para compra posterior |
| **Autenticación** | Registro, login, recuperación de contraseña |
| **Mi Cuenta** | Ver historial de pedidos y editar perfil |
| **Checkout WhatsApp** | Genera mensaje estructurado para iniciar conversación con vendedor |

### 3.2 Módulos para el Administrador (Backend)

| Funcionalidad | Descripción |
|---------------|-------------|
| **Dashboard** | Métricas en tiempo real: ingresos, pedidos, clientes, stock bajo |
| **Gestión de Pedidos** | Control del ciclo completo: Pendiente → Procesando → Enviado → Entregado |
| **Gestión de Productos** | CRUD completo, bulk actions, grid/list view, filtros avanzados |
| **Gestión de Categorías** | Organización jerárquica con ordenamiento |
| **Gestión de Inventario** | Control por lotes (batches), costos, fechas de vencimiento |
| **Gestión de Proveedores** | Registro de proveedores vinculados a lotes |
| **Punto de Venta (POS)** | Registro manual de ventas directas |
| **Sistema de Cuotas** | Planes de pago fraccionados para ventas internas |
| **Verificación de Pagos** | Revisión de comprobantes de transferencia |
| **Reportes y Analíticas** | Gráficos de evolución, productos top, ventas por categoría |
| **Gestión de Usuarios** | Creación de administradores, activación/desactivación |
| **Configuración Global** | Tasa BCV, información del negocio, métodos de pago |
| **Calendario de Eventos** | Programación de eventos empresariales |
| **Auditoría** | Registro de movimientos y cambios del sistema |
| **Notificaciones** | Centro de alertas para pedidos, pagos y stock |

---

## 4. Reglas de Negocio Críticas

### 4.1 Integridad de Datos
- **Precios**: El sistema valida que el precio de venta no sea menor al costo de adquisición
- **Stock**: El stock se descuenta automáticamente al registrar una venta
- **Historial**: Los pedidos no se eliminan, solo se cancelan o rechazan (trazabilidad)

### 4.2 Sistema de Cuotas
- El saldo pendiente se divide en cuotas quincenales sin interés
- El estado de la venta cambia a COMPLETADO solo cuando el saldo llega a cero
- Cada cuota puede tener estado: PENDIENTE, PAGADA, PARCIAL

### 4.3 Verificación de Pagos
- Los comprobantes cargados quedan en estado PENDIENTE
- El administrador debe aprobar o rechazar cada comprobante
- Al aprobar, se registra el pago y se actualiza el saldo de la cuota

### 4.4 Seguridad
- Acceso administrativo mediante JWT
- Roles: ADMIN (acceso total) y USER (cliente)
- Validación de entrada con Zod en backend

---

## 5. Decisiones de Diseño

### 5.1 Venta Asistida por WhatsApp
El sistema no procesa pagos directamente. En su lugar, genera un mensaje estructurado que el cliente envía por WhatsApp. Esto permite:
- Mantener la conversación en un canal conocido
- Flexibilidad para negociar detalles
- Reducir complejidad de integración de pagos

### 5.2 Tasa BCV en Tiempo Real
Los precios en Bolívares se calculan automáticamente con la tasa del Banco Central de Venezuela, configurable desde el panel administrativo. Esto permite:
- Actualización rápida de precios
- Preservación de historial de ventas en USD

### 5.3 Inventario por Lotes
Cada entrada de mercancía se registra como un lote con:
- Costo de adquisición
- Fecha de entrada
- Fecha de vencimiento (opcional)
- Proveedor vinculado

Esto permite análisis de rentabilidad por producto y trazabilidad completa.

### 5.4 Paginación en Tablas
En lugar de scroll infinito, las tablas de pedidos y productos utilizan paginación para:
- Mejor rendimiento con grandes volúmenes de datos
- Navegación más cómoda
- Control claro del número de resultados

---

## 6. Tipos de Usuario

| Tipo | Funcionalidades |
|------|-----------------|
| **Cliente** | Navegar catálogo, agregar al carrito, favoritar productos, realizar pedidos, ver historial |
| **Administrador** | Todas las funcionalidades del panel admin: gestión completa de productos, pedidos, inventario, reportes, configuración |

---

## 7. Comandos de Desarrollo

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia servidor de desarrollo (Puerto 5173) |
| `npm run build` | Compila TypeScript y genera build de producción |
| `npm run server` | Inicia servidor backend (Puerto 3001) |
| `npm run db:push` | Sincroniza esquema con base de datos |
| `npm run db:generate` | Genera cliente Prisma |
| `npm run db:seed` | Puebla base de datos con datos de prueba |
| `npm run lint` | Ejecuta ESLint |

---

## 8. Enlaces Rápidos

- [README Principal](../README.md)
- [Flujos de Negocio](flujos-negocio.md)
- [Arquitectura Técnica](ARQUITECTURA.md)
- [Referencia API](api-reference.md)
- [Manual de Mantenimiento](mantenimiento.md)

---

*Última actualización: 2026-03-02*
