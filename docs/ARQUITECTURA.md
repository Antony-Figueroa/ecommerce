# Arquitectura del Sistema - Ana's Supplements

Este documento describe la estructura técnica, el stack tecnológico, el modelo de datos y las decisiones de diseño del proyecto.

---

## 1. Stack Tecnológico

El sistema utiliza una arquitectura moderna de tipo **SPA (Single Page Application)** para el frontend y una **API RESTful** para el backend, con soporte para comunicación en tiempo real.

### 1.1 Frontend

| Tecnología | Propósito |
|------------|-----------|
| **React 18** | Framework de UI con componentes |
| **TypeScript** | Tipado estático |
| **Vite** | Build tool y servidor de desarrollo |
| **Tailwind CSS** | Estilos utilitarios |
| **shadcn/ui** | Componentes UI basados en Radix |
| **React Context** | Gestión de estado global |
| **React Router DOM v6** | Enrutamiento con layouts anidados |
| **Lucide React** | Iconografía |
| **Recharts** | Gráficos y visualizaciones |

### 1.2 Backend

| Tecnología | Propósito |
|------------|-----------|
| **Node.js** | Runtime de JavaScript |
| **Express** | Framework web |
| **TypeScript** | Tipado estático |
| **Prisma ORM** | Acceso a base de datos |
| **SQLite** | Base de datos |
| **Socket.io** | Comunicación en tiempo real |
| **JWT** | Autenticación |
| **Zod** | Validación de datos |
| **bcryptjs** | Hashing de contraseñas |

---

## 2. Estructura del Proyecto

```
ecommerce/
├── src/                        # Frontend (React)
│   ├── components/
│   │   ├── admin/             # Componentes del panel admin
│   │   │   ├── admin-badge.tsx
│   │   │   ├── admin-button.tsx
│   │   │   ├── admin-card.tsx
│   │   │   ├── admin-table.tsx
│   │   │   ├── confirm-dialog.tsx
│   │   │   ├── pagination.tsx
│   │   │   └── ...
│   │   ├── layout/            # Layouts (Admin, Shop)
│   │   └── ui/               # Componentes shadcn/ui
│   ├── contexts/             # Estado global
│   │   ├── auth-context.tsx
│   │   ├── cart-context.tsx
│   │   └── favorites-context.tsx
│   ├── hooks/                 # Hooks personalizados
│   ├── lib/                  # Utilidades y API client
│   ├── pages/                # Vistas
│   │   ├── admin/            # Panel administrativo
│   │   │   ├── dashboard.tsx
│   │   │   ├── orders.tsx
│   │   │   ├── products.tsx
│   │   │   ├── customers.tsx
│   │   │   ├── inventory.tsx
│   │   │   ├── providers.tsx
│   │   │   ├── analytics.tsx
│   │   │   ├── financial.tsx
│   │   │   ├── settings.tsx
│   │   │   └── ...
│   │   ├── home.tsx          # Página principal
│   │   ├── catalog.tsx       # Catálogo
│   │   ├── cart.tsx         # Carrito
│   │   ├── favorites.tsx    # Favoritos
│   │   └── ...
│   └── types/                # Definiciones TypeScript
├── server/                    # Backend (Express)
│   └── src/
│       ├── application/       # Lógica de negocio
│       │   ├── sales-service.ts
│       │   ├── product-service.ts
│       │   └── ...
│       ├── domain/           # Entidades
│       ├── infrastructure/   # Prisma, Socket.io
│       └── interfaces/       # Controladores, rutas
├── prisma/
│   ├── schema.prisma         # Esquema de base de datos
│   └── dev.db                # Archivo SQLite
└── docs/                     # Documentación
```

---

## 3. Modelo de Datos (Prisma)

### 3.1 Entidades Principales

| Entidad | Descripción |
|---------|-------------|
| **User** | Administradores y clientes. Soporta login tradicional y Google OAuth |
| **Product** | Ficha técnica, costos, márgenes, stock |
| **Category** | Clasificación de productos |
| **Sale** | Transacciones cerradas, vinculadas a productos y tasas |
| **SaleItem** | Items individuales de una venta |
| **Installment** | Cuotas programadas (ventas a crédito) |
| **Payment** | Registros de pagos confirmados |
| **PaymentProof** | Comprobantes pendientes de validación |
| **InventoryBatch** | Lotes de inventario con costos específicos |
| **Provider** | Proveedores vinculados a lotes |
| **Requirement** | Órdenes de compra a proveedores |
| **BCVRate** | Historial de tasas USD/VES |
| **InventoryLog** | Auditoría de movimientos |
| **Notification** | Alertas internas |
| **BusinessEvent** | Eventos del calendario |
| **AuditLog** | Registro de acciones del sistema |

### 3.2 Relaciones

```
User (1) ──< Sale (1) ──< SaleItem >── (1) Product
Sale (1) ──< Installment (1) ──< Payment
Product (1) ──< InventoryBatch >── (1) Provider
Product (1) ──< InventoryLog
User (1) ──< Notification
```

---

## 4. Componentes Administrativos Unificados

El sistema implementa un conjunto de componentes estandarizados para el panel admin:

| Componente | Propósito |
|------------|-----------|
| **AdminCard** | Contenedores con estilos consistentes |
| **AdminTable** | Tablas con estilos unificados |
| **AdminButton** | Botones con variantes (primary, secondary, danger, etc.) |
| **AdminBadge** | Etiquetas de estado y categorización |
| **AdminPageHeader** | Encabezados de página |
| **Pagination** | Paginación reutilizable |
| **ConfirmDialog** | Diálogos de confirmación |

---

## 5. Estrategias de Rendimiento

### 5.1 Frontend
- **Promise.all()**: Carga paralela de datos para evitar waterfalls
- **Paginación**: En tablas grandes (pedidos, productos) en lugar de scroll infinito
- **Memoización**: useMemo/useCallback donde es necesario
- **Lazy Loading**: Componentes cargados bajo demanda

### 5.2 Backend
- **Prisma**: Consultas optimizadas con select/include
- **Índices**: Definidos en schema.prisma para campos frecuentes
- **Paginación en API**: Límite de resultados por defecto

---

## 6. Seguridad

### 6.1 Autenticación
- JWT almacenado en localStorage
- Validación en cada petición al backend
- Middleware de protección de rutas

### 6.2 Autorización
- Roles: ADMIN y USER
- Rutas protegidas tanto en frontend como backend

### 6.3 Validación
- Zod para validación de entrada
- Sanitización de datos
- Tipos TypeScript compartidos

---

## 7. Diseño UI/UX

### 7.1 Sistema de Diseño
- **shadcn/ui**: Componentes base
- **Tailwind CSS**: Estilos con tokens CSS Variables
- **Dark Mode**: Soporte completo

### 7.2 Scrollbars
- Estilos personalizados que se adaptan al modo oscuro
- Colores basados en tokens HSL del tema

### 7.3 Navegación
- Sidebar colapsable
- Breadcrumbs
- Tabs con scroll horizontal

---

## 8. Decisiones de Diseño Clave

### 8.1 Venta Asistida por WhatsApp
- No hay procesamiento de pagos online
- El checkout genera un mensaje estructurado
- El vendedor cierra la venta por WhatsApp

### 8.2 Inventario por Lotes
- Cada entrada es un lote con costo específico
- Las ventas descuenta del lote más antiguo (FIFO)
- Trazabilidad completa de movimientos

### 8.3 Sistema de Cuotas
- Solo para ventas internas/admin
- Cuotas quincenales sin interés
- Verificación de comprobantes por admin

### 8.4 Tasa BCV
- Configurable desde el panel
- Afecta precios en tiempo real
- No modifica ventas históricas

---

## 9. APIs y Comunicación

### 9.1 REST API
- Endpoints RESTful standard
- Validación con Zod
- Respuestas estandarizadas

### 9.2 WebSockets (Socket.io)
- Notificaciones en tiempo real
- Actualizaciones del dashboard
- Estado de pedidos

### 9.3 Cliente API
- Axios configurado en lib/api.ts
- Interceptores para auth token
- Tipos compartidos

---

## 10. Estándares de Código

### 10.1 Convenciones
- **Componentes**: PascalCase
- **Hooks**: camelCase con prefijo use
- **Utilidades**: camelCase
- **Constantes**: SCREAMING_SNAKE_CASE
- **Interfaces/Types**: PascalCase

### 10.2 Orden de Imports
1. React y Hooks
2. Librerías externas
3. Componentes UI (shadcn)
4. Componentes Admin
5. Utilidades
6. Contextos y Hooks propios
7. Tipos
8. API y Servicios

---

## 11. Documentación Relacionada

- [README Principal](../README.md)
- [Análisis Funcional](analisis-funcional.md)
- [Flujos de Negocio](flujos-negocio.md)
- [Referencia API](api-reference.md)
- [Manual de Mantenimiento](mantenimiento.md)

---

*Última actualización: 2026-03-02*
