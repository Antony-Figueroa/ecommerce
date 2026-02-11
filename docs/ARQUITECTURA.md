# 🏗️ Arquitectura del Sistema - Ana's Supplements

Este documento describe la estructura técnica, el stack tecnológico y el modelo de datos del proyecto, actualizado tras las últimas mejoras en estabilidad y comunicación en tiempo real.

---

## 💻 Stack Tecnológico

El sistema utiliza una arquitectura moderna de tipo **SPA (Single Page Application)** para el frontend y una **API RESTful** para el backend, con soporte para comunicación bidireccional en tiempo real.

### Frontend
- **Framework**: React 18 + TypeScript + Vite.
- **Estilos**: Tailwind CSS + shadcn/ui (Radix UI).
- **Estado**: React Context (Auth, Cart, Favorites).
- **Enrutado**: React Router DOM v6 con **Layouts Anidados** para persistencia de navegación.
- **Iconografía**: Lucide React.
- **UI Components**: Radix UI (Tooltips, Dialogs, Tabs).

### Backend
- **Servidor**: Node.js + Express + TypeScript.
- **Tiempo Real**: Socket.io para notificaciones y actualizaciones de dashboard.
- **ORM**: Prisma 5.
- **Base de Datos**: SQLite (almacenada localmente en `dev.db`).
- **Seguridad**: JWT (jsonwebtoken) + bcryptjs + Helmet.
- **Validación**: Zod para esquemas de datos tanto en entrada como en salida.

---

## 📂 Estructura del Proyecto

```text
├── src/                # Frontend (React)
│   ├── components/     # Componentes UI (shadcn) y de negocio
│   ├── contexts/       # Gestión de estado global (Auth, Cart)
│   ├── hooks/          # Hooks personalizados (useSocket, useAdmin)
│   ├── lib/            # Clientes API (axios) y utilidades (formatters)
│   ├── pages/          # Vistas principales y administrativas
│   └── types/          # Definiciones TypeScript compartidas
├── server/             # Backend (Express)
│   ├── src/
│   │   ├── application/ # Lógica de servicios (dashboard, sales)
│   │   ├── domain/      # Entidades y tipos de negocio
│   │   ├── infrastructure/# Persistencia (Prisma), Socket.io, Middleware
│   │   ├── interfaces/  # Controladores y rutas de la API
│   │   └── index.ts     # Punto de entrada del servidor
│   └── prisma/         # Esquema (schema.prisma) y migraciones
```

---

## 📊 Modelo de Datos (Prisma)

El esquema de la base de datos está diseñado para garantizar la integridad referencial y facilitar la auditoría.

### Entidades Principales
- **User**: Administradores y clientes. Soporta login tradicional y Google OAuth.
- **Product**: Ficha técnica, costos, márgenes y niveles de stock.
- **Category**: Clasificación de productos con borrado protegido.
- **Sale**: Transacciones cerradas, vinculadas a productos y tasas de cambio.
- **Installment**: Cuotas programadas asociadas a una venta interna.
- **Payment**: Registros de pagos confirmados (totales o parciales).
- **PaymentProof**: Comprobantes cargados por usuarios pendientes de validación administrativa.
- **InventoryBatch**: Agrupación de productos por lotes de entrada con costos específicos.
- **Provider**: Proveedores de suplementos vinculados a los lotes de inventario.
- **Requirement**: Órdenes de compra a proveedores.
- **BCVRate**: Historial de tasas de cambio USD/VES.
- **InventoryLog**: Auditoría detallada de cada movimiento de mercancía.
- **Notification**: Sistema de alertas internas para el administrador.

---

## 🔐 Estrategia de Seguridad y Estabilidad

1. **Autenticación**: JWT almacenado en `localStorage` con validación en cada petición.
2. **Protección de Rutas**: Middlewares centralizados en backend y componentes `ProtectedRoute` en frontend.
3. **CORS/WebSockets**: Configuración específica para permitir comunicación segura entre el servidor API y el cliente Vite.
4. **Manejo de Errores**: Patrón de servicios resilientes que evitan caídas totales del sistema ante fallos parciales de base de datos (especialmente en el Dashboard).
5. **Sanitización**: Validación estricta de entrada mediante Zod.

---

## 🔗 Enlaces Rápidos
- [Análisis Funcional](file:///c:/Users/Server%20Admin/Desktop/ecommerce/docs/analisis-funcional.md)
- [Referencia API](file:///c:/Users/Server%20Admin/Desktop/ecommerce/docs/api-reference.md)
- [Flujos de Negocio](file:///c:/Users/Server%20Admin/Desktop/ecommerce/docs/flujos-negocio.md)
- [Manual de Mantenimiento](file:///c:/Users/Server%20Admin/Desktop/ecommerce/docs/mantenimiento.md)

*Última actualización: 2026-02-11 (v1.3)*
