# Ana's Supplements E-commerce

Este es un sistema completo de comercio electrónico para la venta de suplementos, diseñado para ofrecer una experiencia de usuario fluida y una gestión administrativa robusta.

## Características Principales

### 🛒 Tienda Online (Frontend)

- **Catálogo Dinámico**: Navegación por categorías, búsqueda de productos y filtros avanzados.
- **Carrito de Compras**: Gestión de productos, cálculo de totales y persistencia local.
- **Autenticación Segura**: Inicio de sesión, registro y recuperación de contraseña (incluye Google Auth).
- **Favoritos**: Los usuarios pueden guardar sus productos preferidos.
- **Diseño Responsivo**: Optimizado para dispositivos móviles y escritorio utilizando Tailwind CSS y shadcn/ui.

### ⚙️ Panel de Administración (Backend)

- **Gestión de Productos**: Control total sobre el inventario, marcas, formatos y estados.
- **Categorías**: Organización jerárquica con protección de integridad de datos.
- **Dashboard de Analíticas**: Métricas en tiempo real de ventas, clientes y stock bajo desde la base de datos.
- **Gestión de Pedidos**: Seguimiento detallado de las ventas y estados de entrega.
- **Conversión de Moneda**: Integración con la tasa del BCV para manejo de USD/VES.

## Tecnologías Utilizadas

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Radix UI.
- **Backend**: Node.js, Express, Prisma ORM.
- **Base de Datos**: SQLite (vía Prisma).
- **Autenticación**: JWT (JSON Web Tokens) y Google OAuth.

## Instalación y Configuración

1. **Clonar el repositorio**
2. **Instalar dependencias**: `npm install`
3. **Configurar variables de entorno**: Crear archivos `.env` según las guías en `AGENTS.md`.
4. **Inicializar base de datos**: `npm run db:push` y `npm run db:seed`.
5. **Iniciar servidores**: `npm run dev` (frontend) y `npm run server` (backend).

---
Desarrollado con enfoque en escalabilidad y facilidad de uso.
