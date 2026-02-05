# Ana's Supplements - E-commerce de Productos Farmacéuticos

E-commerce especializado en productos farmacéuticos: vitaminas, suplementos, medicamentos de libre venta y productos de cuidado personal.

## 🛠️ Stack Tecnológico

- **Frontend:** React + Vite
- **Estilos:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Icons:** Lucide React
- **Routing:** React Router DOM
- **Types:** TypeScript

## 🚀 Características Principales

- **Autenticación Completa:** Sistema de login y registro tradicional con JWT y Google OAuth 2.0 integrado.
- **Flujo de Registro de Google:** Incluye personalización de nombre de usuario y verificación de datos de perfil.
- **Validaciones Robustas:** Validación de formularios en tiempo real (frontend) y en servidor (backend) usando Zod, con restricciones específicas para teléfonos, correos y nombres.
- **Base de Datos:** Persistencia con SQLite y Prisma ORM.
- **Conversión de Moneda:** Integración con tasas BCV (USD/VES) para precios dinámicos.
- **Panel de Administración:** Gestión completa de productos, categorías, ventas e inventario.

## 📦 Instalación

1. Clonar el repositorio.
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Configurar variables de entorno:
   - Crear `.env` en la raíz (ver `.env.example` para referencia).
   - Asegurarse de incluir `VITE_GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` para el flujo de Google.

4. Inicializar base de datos:
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

## 🚀 Ejecución

Para iniciar el entorno de desarrollo (frontend + backend):

1. **Backend:** `npm run server` (Puerto 3001)
2. **Frontend:** `npm run dev` (Puerto 5173)

## 📁 Estructura del Proyecto

```
├── src/                # Frontend (React + Vite)
│   ├── components/     # Componentes UI (shadcn/ui), Layout, Shop
│   ├── pages/          # Páginas y vistas (Login, Register, Admin)
│   ├── contexts/       # AuthContext, CartContext
│   ├── lib/            # API Client, Validaciones (Zod), Utils
│   └── types/          # Definiciones TypeScript
├── server/             # Backend (Express + Prisma)
│   ├── prisma/         # Schema y base de datos SQLite
│   └── src/            # Controladores, Rutas, Servicios, Middlewares
```

## 📱 Rutas Principales

- **/** - Home (con indicador de usuario logueado)
- **/productos** - Catálogo con filtros y búsqueda
- **/producto/:id** - Detalle de producto
- **/carrito** - Gestión de compras
- **/login** / **/registro** - Autenticación
- **/google-confirm** - Confirmación de datos para registro con Google
- **/admin** - Dashboard administrativo completo

## ⚠️ Estado del Proyecto

**FASE ACTUAL:** Backend Funcional + Integración Frontend (MVP Completado)

Funcionalidades implementadas:
- ✅ Autenticación JWT y Google OAuth.
- ✅ Base de datos SQLite + Prisma sincronizada.
- ✅ Validaciones de formularios consistentes (frontend/backend).
- ✅ CRUD de productos y categorías.
- ✅ Gestión de inventario y tasas BCV.

Próximos pasos:
- 🔄 Procesamiento de pagos (Stripe/PayPal).
- 🔄 Sistema de recetas médicas (Upload y Verificación).
- 🔄 Optimización SEO y Performance.

## 🔒 Licencia

MIT
