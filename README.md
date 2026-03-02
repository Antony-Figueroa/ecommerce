# Ana's Supplements E-commerce

Sistema completo de comercio electrónico para la venta de suplementos nutricionales, diseñado para el mercado venezolano con soporte multi-moneda (USD/VES) y gestión administrativa integral.

---

## 📋 Funcionalidades del Sistema

### 🛒 Tienda Online (Cliente)

| Módulo | Descripción |
|--------|-------------|
| **Catálogo de Productos** | Navegación por categorías, búsqueda avanzada, filtros por marca, formato y disponibilidad |
| **Detalle de Producto** | Imágenes múltiples, descripción, precios en USD y BS, stock en tiempo real |
| **Carrito de Compras** | Agregar/eliminar productos, actualizar cantidades, persistencia local |
| **Lista de Favoritos** | Guardar productos para compra futura |
| **Sistema de Precios** | Visualización dual (USD + BS con tasa BCV actualizada automáticamente) |
| **Autenticación** | Registro, inicio de sesión, recuperación de contraseña |
| **Mi Cuenta** | Historial de pedidos, información de perfil |
| **Checkout por WhatsApp** | Generación de mensaje estructurado para cerrar venta con vendedor |

---

### ⚙️ Panel de Administración

| Módulo | Descripción |
|--------|-------------|
| **Dashboard** | Métricas en tiempo real: ingresos, pedidos, clientes, productos críticos |
| **Gestión de Pedidos** | Estados (Pendiente/Procesando/Aceptado/Completado/Cancelado), seguimiento de entrega, verificación de pagos |
| **Gestión de Productos** | CRUD completo, bulk actions, stock por lotes, imágenes múltiples |
| **Gestión de Categorías** | Creación, edición, ordenamiento jerárquico |
| **Gestión de Inventario** | Control por lotes (batches), costos de adquisición, fechas de vencimiento, trazabilidad |
| **Gestión de Proveedores** | Registro de proveedores, vinculación con lotes de inventario |
| **Sistema de Cuotas** | Planes de pago fraccionados, seguimiento de cuotas pendientes |
| **Verificación de Pagos** | Revisión y aprobación de comprobantes de transferencia |
| **Reportes y Analíticas** | Gráficos de evolución de ventas, productos más vendidos, ventas por categoría |
| **Punto de Venta (POS)** | Registro manual de ventas directas |
| **Gestión de Usuarios** | Roles (Admin/Cliente), activación/desactivación, creación de administradores |
| **Configuración Global** | Tasa BCV, información del negocio, métodos de pago, notificaciones |
| **Calendario de Eventos** | Programación de eventos empresariales con alertas |
| **Auditoría** | Registro de movimientos del sistema y cambios de configuración |
| **Notificaciones** | Centro de alertas para pedidos, pagos y stock |

---

## 🔄 Flujo de Negocio

### Flujo de Venta (Cliente)

```
1. Navegar catálogo → 2. Seleccionar productos → 3. Agregar al carrito 
→ 4. Finalizar compra → 5. Generar mensaje WhatsApp → 6. Vendedor confirma
```

### Flujo de Pedido (Administrador)

```
1. Nuevo pedido → 2. Revisar detalles → 3. Aceptar/Rechazar 
→ 4. Confirmar pago → 5. Procesar → 6. Enviar/Entregar → 7. Completado
```

### Flujo de Cuotas

```
1. Venta con plan de pago → 2. Definir cuotas → 3. Cliente paga 
→ 4. Admin verifica comprobante → 5. Registrar pago → 6. Actualizar saldo 
→ 7. Cuota pagada → 8. Saldo = 0 → 9. Venta completada
```

---

## 🏗️ Arquitectura Técnica

### Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Estilos** | Tailwind CSS + shadcn/ui |
| **Estado** | React Context (Auth, Cart, Favorites) |
| **Rutas** | React Router DOM v6 |
| **Backend** | Node.js + Express + TypeScript |
| **Base de Datos** | SQLite (Prisma ORM) |
| **Tiempo Real** | Socket.io |
| **Autenticación** | JWT + Google OAuth |

### Estructura del Proyecto

```
├── src/                    # Frontend (React)
│   ├── components/         # Componentes UI y de negocio
│   │   ├── admin/          # Componentes del panel admin
│   │   ├── layout/        # Layouts (Admin, Shop)
│   │   └── ui/            # Componentes shadcn/ui
│   ├── contexts/          # Estado global (Auth, Cart)
│   ├── hooks/             # Hooks personalizados
│   ├── lib/               # API client, utilidades
│   ├── pages/             # Vistas (admin/, shop/)
│   └── types/             # Tipos TypeScript
├── server/                 # Backend (Express)
│   └── src/
│       ├── application/    # Lógica de negocio
│       ├── domain/        # Entidades
│       ├── infrastructure/ # Prisma, Socket.io
│       └── interfaces/     # Controladores, rutas
└── prisma/                # Schema y migraciones
```

---

## 🚀 Instalación y Configuración

### Requisitos Previos
- Node.js v18+
- npm v9+

### Pasos

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
# Crear .env en raíz:
VITE_API_URL=http://localhost:3001/api

# Crear server/.env:
DATABASE_URL="file:./dev.db"
JWT_SECRET=tu-clave-secreta
PORT=3001

# 3. Inicializar base de datos
npm run db:push
npm run db:generate

# 4. (Opcional) Poblar con datos de prueba
npm run db:seed

# 5. Iniciar servidores
npm run dev      # Frontend (Puerto 5173)
npm run server   # Backend (Puerto 3001)
```

---

## 📊 Comandos de Desarrollo

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo frontend |
| `npm run build` | Compilación de producción |
| `npm run server` | Servidor backend con tsx |
| `npm run db:push` | Sincronizar esquema Prisma |
| `npm run db:seed` | Poblar base de datos |
| `npm run lint` | Verificar código |

---

## 🔐 Roles y Permisos

| Rol | Descripción |
|-----|-------------|
| **ADMIN** | Acceso total al panel administrativo |
| **USER** | Cliente de la tienda |

---

## 💡 Decisiones de Diseño

1. **Venta Asistida por WhatsApp**: El sistema genera un mensaje estructurado para que el cliente envíe por WhatsApp, manteniendo la conversación en un canal conocido y confiable.

2. **Tasa BCV en Tiempo Real**: Los precios en Bolívares se calculan automáticamente con la tasa del BCV, configurable desde el panel admin.

3. **Sistema de Cuotas**: Para ventas internas, el administrador puede crear planes de pago fraccionados con verificación de comprobantes.

4. **Inventario por Lotes**: Cada entrada de mercancía se registra como un lote con costo de adquisición, permitiendo análisis de rentabilidad por producto.

5. **Paginación en Tablas**: Para mejorar la experiencia del usuario, las tablas de pedidos y productos utilizan paginación en lugar de scroll infinito.

---

## 📁 Documentación Relacionada

- [Análisis Funcional](docs/analisis-funcional.md)
- [Flujos de Negocio](docs/flujos-negocio.md)
- [Arquitectura Técnica](docs/ARQUITECTURA.md)
- [Referencia API](docs/api-reference.md)
- [Manual de Mantenimiento](docs/mantenimiento.md)

---

*Desarrollado con React, Node.js y SQLite*
