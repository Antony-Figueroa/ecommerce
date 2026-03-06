# AGENTS.md - Ana's Supplements Development Guide

## 🚀 Commands

### Install & Run
```bash
npm install
npm run dev          # Frontend (5173) + Backend (3001)
npm run build        # TypeScript + Vite build
npm run preview      # Preview production build
npm run server       # Backend only with tsx
```

### Database (Prisma)
```bash
npm run db:generate  # Generate Prisma client
npm run db:push      # Sync schema to DB
npm run db:seed      # Seed test data
npm run db:studio    # Open Prisma Studio GUI
```

### Quality & Testing
```bash
npm run lint         # ESLint
npm run lint -- --fix # Fix lint errors
tsc --noEmit         # TypeScript check

npm test                           # Run all tests
npm test -- --testPathPattern=<p>  # Run specific test
npm test -- --watch                # Watch mode
npm test -- --coverage             # With coverage
```

---

## 🎨 Code Style

### Import Order
1. React & Hooks
2. External libs (Router, etc.)
3. UI components (`@/components/ui`)
4. Admin components (`@/components/admin`)
5. Utilities (`@/lib/utils`)
6. Contexts & custom hooks
7. Types & Interfaces
8. API & Services

### Naming Conventions
- **Components**: `PascalCase` (`ProductCard.tsx`)
- **Hooks**: `useCamelCase` (`useCart.ts`)
- **Utilities**: `camelCase` (`formatPrice.ts`)
- **Constants**: `SCREAMING_SNAKE_CASE` (`API_BASE`)
- **Types**: `PascalCase`, no `I` prefix (`UserResponse`)

### File Naming
- Components: `kebab-case.tsx` for general components
- Tests: `*.test.ts` or `*.spec.ts`

### TypeScript/React Patterns
- Use **Interfaces** for objects, **Types** for unions
- Use `forwardRef` for components accepting refs (shadcn/ui standard)
- Use `cn()` from `tailwind-merge` for conditional classes

---

## 🏗️ Architecture

```
src/                    # Frontend (Vite + React)
├── components/ui/      # shadcn/ui components
├── components/admin/  # Admin components
├── pages/              # Route pages
├── contexts/           # Global state
├── hooks/              # Reusable hooks
├── lib/                # API clients & utils
server/                 # Backend (Express + Prisma)
├── src/
│   ├── application/    # Services, controllers
│   ├── domain/         # Entities, repositories
│   ├── infrastructure/ # DB, external services
```

---

## 🛡️ Security & Error Handling

- **Validation**: Use **Zod** for both frontend and backend
- **API Errors**: Centralized error handling with descriptive HTTP status codes
- **Auth**: JWT in `localStorage`, validated on protected routes

---

## 🎯 Admin Components (Required)

Use unified components from `@/components/admin/`:
- `AdminCard`, `AdminTable`, `AdminBadge`, `AdminButton`
- `FilterSelect` for state filters ()
- `Pagination`NOT buttons for tables
- `useConfirmDialog()` hook for confirmations

---

## 🌙 Dark Mode Rules

**NEVER hardcode colors without `dark:` variant.**

```tsx
// ❌ Wrong
<div className="bg-white text-slate-800">

// ✅ Correct  
<div className="bg-white dark:bg-card text-slate-800 dark:text-slate-200">
```

### Color Substitutions
| Light | Dark |
|-------|------|
| `bg-white` | `dark:bg-card` |
| `bg-slate-50` | `dark:bg-background` |
| `border-slate-200` | `dark:border-white/10` |
| `text-slate-900` | `dark:text-white` |
| `text-slate-600` | `dark:text-slate-400` |

---

## ♿ Accessibility

**Radix Dialog/Sheet MUST have titles:**

```tsx
<DialogContent>
  <DialogTitle className="sr-only">Descriptive title</DialogTitle>
  <DialogDescription className="sr-only">Description</DialogDescription>
</DialogContent>

<SheetContent>
  <SheetTitle className="sr-only">Menu title</SheetTitle>
</SheetContent>
```

---

## 🧠 Required Skills (AI Agents)

Before any task, invoke the appropriate skill:

1. **interface-design** - UI changes, components, user flows
2. **vercel-react-best-practices** - Refactoring, data fetching, performance
3. **brainstorming** - Creative work, features, behavior changes
4. **error-handling-patterns** - APIs, robustness
5. **systematic-debugging** - Bugs, errors, unexpected behavior
6. **api-design-principles** - REST APIs

---

## 📦 Dependencies

- **Frontend**: React 18, Vite, TailwindCSS, shadcn/ui, Radix UI, Recharts
- **Backend**: Express, Prisma, Zod, JWT, bcrypt
- **Testing**: Jest, ts-jest

---

Last updated: 2026-03-06
