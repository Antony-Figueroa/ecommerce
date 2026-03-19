# AGENTS.md - Ana's Supplements

E-commerce de suplementos nutricionales con soporte multi-moneda (USD/VES).

---

## 🛠 Stack

| Capa | Tech |
|------|------|
| Frontend | React + Vite + TypeScript + shadcn/ui |
| Backend | Express + Prisma + PostgreSQL |
| Auth | JWT + Google OAuth |
| Deploy | Vercel (frontend) + Render (backend) |

---

## 📁 Estructura

```
src/                    # Frontend
├── components/ui/     # shadcn components
├── pages/admin/       # Admin pages
├── pages/shop/        # Customer pages
├── contexts/          # Auth, Cart, Settings
├── hooks/             # Custom hooks
└── lib/               # API client, utils

server/                 # Backend
├── src/application/services/  # Business logic
├── src/infrastructure/web/    # Routes & middleware
├── src/infrastructure/persistence/  # Prisma repos
└── prisma/schema.prisma
```

---

## ⚙️ Convenciones

### Código
- **Interfaces** para objetos, **types** para uniones
- `cn()` de tailwind-merge para clases condicionales
- `forwardRef` para componentes que aceptan refs
- Siempre manejar estados de loading y error

### Imports (orden obligatorio)
1. React/hooks → 2. Libraries → 3. UI → 4. Components → 5. Contexts → 6. Utils → 7. Types → 8. API

### Naming
| Tipo | Convention |
|------|------------|
| Components | PascalCase (`ProductCard.tsx`) |
| Hooks | camelCase + `use` (`useCart.ts`) |
| Utils | camelCase (`formatPrice.ts`) |
| Types | PascalCase, sin `I-` (`UserResponse`) |
| Pages | kebab-case (`product-detail.tsx`) |

---

## 🌙 Dark Mode (obligatorio)

Nunca hardcodear colores sin variant `dark:`.

```tsx
// ✅ Correct
<div className="bg-white dark:bg-card text-slate-800 dark:text-slate-200">

// ❌ Wrong
<div className="bg-white text-slate-800">
```

| Light | Dark |
|-------|------|
| `bg-white` | `dark:bg-card` |
| `bg-slate-50` | `dark:bg-background` |
| `text-slate-900` | `dark:text-white` |

---

## ♿ Accessibility

Todos los dialogs deben tener títulos accesibles:

```tsx
<DialogTitle className="sr-only">Product details</DialogTitle>
<DialogDescription className="sr-only">View and edit product info</DialogDescription>
```

---

## 🚫 Prohibiciones

- **NO** hardcodear colores sin dark mode
- **NO** commits con `.env` o secretos
- **NO** lógica de negocio en componentes (usar servicios)
- **NO** fetch directo en componentes (usar API client)
- **NO** console.log en producción

---

## 🏗 API Design

### Response
```typescript
// Success: { data: T, message?: string }
// Error: { error: string, code?: string }
```

### HTTP Codes
200/201 OK | 400 Validation | 401 Unauthorized | 403 Forbidden | 404 Not Found | 500 Server Error

### Validation
- Zod en frontend y backend
- Validar en cliente para UX, en servidor para seguridad

---

## 🚀 Quick Start

```bash
npm install
npm run dev          # Frontend (5173) + Backend (3001)
npm run build        # Vite + TypeScript
npm test             # Run tests
```

---

## 🗄️ Database

```bash
# Local
DATABASE_URL="postgresql://postgres:1234@localhost:5432/farmacia_ecommerce"
npm run db:push      # Sync schema
npm run db:generate # Generate types
npm run db:studio   # GUI viewer
```

---

## 🔐 Environment Variables

**Frontend (VITE_):** `VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`

**Backend:** `DATABASE_URL`, `PORT`, `JWT_SECRET`, `FRONTEND_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SMTP_*`

---

## 🚢 Deployment

| Platform | URL |
|----------|-----|
| Frontend (Vercel) | https://ecommerce-phi-five-35.vercel.app |
| Backend (Render) | https://ecommerce-backend-r75w.onrender.com |

Auto-deploy en push a main.

---

## 🧪 Testing

```bash
npm test -- --watch         # Watch mode
npm test -- --coverage      # Coverage
npm test -- --testPathPattern=<pattern>
```

---

## 🔧 Common Tasks

**Nueva API:**
1. Crear ruta en `server/src/infrastructure/web/routes/`
2. Agregar ruta en `server/src/index.ts`
3. Crear servicio en `server/src/application/services/`

**Nueva página:**
1. Crear componente en `src/pages/admin/` o `src/pages/shop/`
2. Agregar ruta en `src/App.tsx`
3. Proteger si es admin-only

---

## 📝 Required Skills

| Task | Skill |
|------|-------|
| UI/Componentes | `interface-design` |
| Performance | `vercel-react-best-practices` |
| Nuevas features | `brainstorming` |
| APIs | `api-design-principles` |
| Error handling | `error-handling-patterns` |
| Bugs | `systematic-debugging` |

---

## 🔀 Git Workflow

1. Branch: `git checkout -b feature/nombre`
2. Commit mensajes claros
3. PR → Merge a main (auto-deploy)

---

## 📋 Env template

```
DATABASE_URL=
PORT=3001
JWT_SECRET=
FRONTEND_URL=http://localhost:5173
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

**Last updated**: 2026-03-19