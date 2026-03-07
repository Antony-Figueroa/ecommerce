# AGENTS.md - Ana's Supplements Development Guide

## 🚀 Commands

### Installation
```bash
npm install
```

### Development
- `npm run dev` - Start both frontend (5173) and backend (3001)
- `npm run dev:frontend` - Frontend only (Vite)
- `npm run dev:backend` - Backend only (Express + tsx)

### Build
- `npm run build` - Build frontend (TypeScript + Vite)
- `npm run server:build` - Build backend (TypeScript)
- `npm run preview` - Preview production build

### Database (Prisma)
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Sync schema to database
- `npm run db:seed` - Seed with test data
- `npm run db:studio` - Open Prisma Studio GUI

### Quality
- `npm run lint` - Run ESLint
- `npm run lint -- --fix` - Auto-fix lint errors
- `tsc --noEmit` - TypeScript check

### Testing (Jest)
- `npm test` - Run all tests
- `npm test -- --testPathPattern=<pattern>` - Run tests matching pattern
- `npm test -- --testNamePattern=<name>` - Run tests with specific name
- `npm test -- <file>` - Run single test file

---

## ⚙️ Environment Setup

Create `.env` files:

**Frontend (`.env`)**
```
VITE_API_URL=http://localhost:3001/api
```

**Backend (`server/.env`)**
```
DATABASE_URL="file:./dev.db"
JWT_SECRET=your-secret-key
PORT=3001
```

---

## 🎨 Code Style

### Import Order
1. React and Hooks
2. External libraries (Router, etc.)
3. UI components (`@/components/ui`)
4. Admin components (`@/components/admin`)
5. Utilities (`@/lib/utils`)
6. Contexts and custom hooks
7. Types and Interfaces
8. API and Services

### Naming Conventions
- **Components**: `PascalCase` (e.g., `ProductCard.tsx`)
- **Hooks**: `useCamelCase` (e.g., `useCart.ts`)
- **Utilities**: `camelCase` (e.g., `formatPrice.ts`)
- **Constants**: `SCREAMING_SNAKE_CASE` (e.g., `API_BASE`)
- **Types/Interfaces**: `PascalCase` (no `I` prefix)
- **Files**: `kebab-case.tsx` for general components

### TypeScript
- Prefer **Interfaces** for objects, **Types** for unions
- Use `Zod` for validation (required in both frontend and backend)
- Avoid `any`, use `unknown` when type is uncertain

### React Patterns
- Use `forwardRef` for components accepting refs (shadcn/ui standard)
- Use **Context Provider** pattern for shared state
- Use `cn()` from `@/lib/utils` for conditional Tailwind classes

---

## 🏗️ Project Structure

```
src/                    # Frontend (Vite + React)
├── components/         # UI, Layout, Shop, Cart, Product
│   └── admin/         # Admin components (use these!)
├── pages/             # Routes and pages
├── contexts/          # Global state
├── hooks/             # Reusable hooks
├── lib/               # API clients, utilities
└── types/             # TypeScript definitions

server/                 # Backend (Express + Prisma)
├── src/               # Controllers, Routes, Services
└── prisma/            # Schema and migrations
```

---

## 🎯 Required Admin Components

Use these unified components from `@/components/admin/`:

| Component | File | Purpose |
|-----------|------|---------|
| AdminCard | `admin-card.tsx` | Content containers |
| AdminTable | `admin-table.tsx` | Data tables |
| AdminBadge | `admin-badge.tsx` | Status labels |
| AdminButton | `admin-button.tsx` | Buttons with variants |
| FilterSelect | `admin-filter-select.tsx` | State filters (NOT buttons) |
| Pagination | `pagination.tsx` | Table pagination |
| ConfirmDialog | `confirm-dialog.tsx` | Confirmation modals |

---

## 🛡️ Error Handling

- Use **Zod** for validation on both frontend and backend
- Handle API errors with descriptive HTTP status codes
- JWT stored in `localStorage`, validated on protected routes

---

## 📊 Recharts

Always validate data exists before rendering:

```tsx
{isReady && data.length > 0 ? (
  <ResponsiveContainer>...</ResponsiveContainer>
) : (
  <div>Cargando...</div>
)}
```

---

## 🧠 Skills (Use Before Working)

| Skill | When to Use |
|-------|-------------|
| `interface-design` | UI modifications, components, user flows |
| `vercel-react-best-practices` | Refactoring, data fetching, performance |
| `brainstorming` | Creative work, new features |
| `error-handling-patterns` | API design, robustness |
| `systematic-debugging` | Bugs, test failures, unexpected behavior |

---

## 📖 Documentation

- [API Reference](docs/api-reference.md)
- [Architecture](docs/ARQUITECTURA.md)
- [Functional Analysis](docs/analisis-funcional.md)
