# 🏗️ Arquitectura del Sistema - Ana's Supplements

Este documento describe la estructura técnica, el stack tecnológico y el modelo de datos del proyecto.

---

## 💻 Stack Tecnológico

El sistema utiliza una arquitectura moderna de tipo **SPA (Single Page Application)** para el frontend y una **API RESTful** para el backend.

### Frontend
- **Framework**: React 18 + TypeScript + Vite.
- **Estilos**: Tailwind CSS + shadcn/ui (Radix UI).
- **Estado**: React Context (Auth, Cart, Favorites).
- **Enrutado**: React Router DOM v6.
- **Iconografía**: Lucide React.

### Backend
- **Servidor**: Node.js + Express + TypeScript.
- **ORM**: Prisma 5.
- **Base de Datos**: SQLite (almacenada localmente).
- **Seguridad**: JWT (jsonwebtoken) + bcryptjs + Helmet.
- **Validación**: Zod.

---

## 📂 Estructura del Proyecto

```text
├── src/                # Frontend (React)
│   ├── components/     # Componentes UI y de negocio
│   ├── contexts/       # Gestión de estado global
│   ├── hooks/          # Hooks personalizados
│   ├── lib/            # Clientes API y utilidades
│   ├── pages/          # Vistas principales y administrativas
│   └── types/          # Definiciones TypeScript
├── server/             # Backend (Express)
│   ├── src/
│   │   ├── controllers/# Lógica de rutas
│   │   ├── middleware/ # Auth, validación, errores
│   │   ├── routes/     # Definición de endpoints
│   │   └── services/   # Lógica de negocio pesada
│   └── prisma/         # Esquema y migraciones de DB
```

---

## 📊 Modelo de Datos (Prisma)

El esquema de la base de datos está diseñado para garantizar la integridad referencial y facilitar la auditoría.

### Entidades Principales
- **User**: Almacena administradores y clientes. Soporta login tradicional y Google OAuth.
- **Product**: Ficha técnica de productos, incluyendo costos, márgenes y niveles de stock.
- **Category**: Clasificación de productos con reglas de borrado protegido.
- **Sale**: Registro de transacciones cerradas, vinculadas a productos y tasas de cambio.
- **Requirement**: Órdenes de compra a proveedores para reposición.
- **BCVRate**: Historial de tasas de cambio USD/VES.
- **InventoryLog**: Auditoría de cada entrada y salida de mercancía.

---

## 🔐 Estrategia de Seguridad

1. **Autenticación**: JWT almacenado en `localStorage`.
2. **Protección de Rutas**: Middlewares en backend y componentes `ProtectedRoute` en frontend.
3. **CORS/COOP**: Configuración estricta para permitir la integración con Google Auth.
4. **Sanitización**: Validación de entrada en todas las rutas administrativas mediante Zod.

---

## 🔗 Enlaces Rápidos
- [Análisis Funcional](file:///c:/Users/Server%20Admin/Desktop/ecommerce/docs/analisis-funcional.md)
- [Referencia API](file:///c:/Users/Server%20Admin/Desktop/ecommerce/docs/api-reference.md)
- [Flujos de Negocio](file:///c:/Users/Server%20Admin/Desktop/ecommerce/docs/flujos-negocio.md)
- [Guía de Desarrollo](file:///c:/Users/Server%20Admin/Desktop/ecommerce/AGENTS.md)

*Última actualización: 2026-02-05*
