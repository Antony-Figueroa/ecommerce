# AGENTS.md - Ana's Supplements Development Guide

Sistema de comercio electrónico para suplementos nutricionales con soporte multi-moneda (USD/VES).

---

## 🚀 Quick Start

### Install
```bash
npm install
```

### Development
```bash
npm run dev          # Frontend (5173) + Backend (3001)
```

### Production Build
```bash
npm run build        # Vite + TypeScript build
npm run preview      # Preview production build
```

---

## 📁 Project Structure

```
├── src/                    # Frontend (React + Vite)
│   ├── components/
│   │   ├── ui/            # shadcn/ui components
│   │   ├── admin/         # Admin dashboard components
│   │   └── layout/        # Layout wrappers
│   ├── pages/
│   │   ├── admin/         # Admin pages
│   │   └── shop/          # Customer pages
│   ├── contexts/          # React contexts (Auth, Cart, Settings)
│   ├── hooks/             # Custom hooks
│   ├── lib/               # API client, utilities
│   └── types/             # TypeScript definitions
│
├── server/                 # Backend (Express + Prisma)
│   ├── src/
│   │   ├── application/   # Services & business logic
│   │   │   └── services/ # Domain services
│   │   ├── domain/       # Repositories & entities
│   │   ├── infrastructure/
│   │   │   ├── persistence/  # Prisma repositories
│   │   │   ├── web/          # Routes & middleware
│   │   │   └── socket.service.ts
│   │   └── shared/       # Config, errors, container
│   ├── prisma/
│   │   └── schema.prisma # Database schema
│   └── scripts/          # CLI scripts (seeds, migrations)
│
├── vercel.json           # Vercel routing config
└── render.yaml          # Render deployment config
```

---

## 🗄️ Database

### Local Development (PostgreSQL)
```bash
# Create local database
PGPASSWORD=1234 psql -U postgres -h localhost -c "CREATE DATABASE farmacia_ecommerce;"

# Database URL format
DATABASE_URL="postgresql://postgres:1234@localhost:5432/farmacia_ecommerce"

# Push schema
npm run db:push        # Sync Prisma schema to database

# Generate Prisma client
npm run db:generate    # Generate Prisma client types

# Open Prisma Studio
npm run db:studio      # GUI database viewer
```

### Production
- **Render PostgreSQL**: Configured via `render.yaml`
- **Connection**: Automatic via `DATABASE_URL` environment variable

---

## 🔐 Environment Variables

### Frontend (Vercel) - Prefix: `VITE_`
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID |

### Backend (Render/Local)
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | Server port (default: 3001) |
| `JWT_SECRET` | JWT signing secret |
| `FRONTEND_URL` | Frontend URL for CORS |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `SMTP_HOST` | Email SMTP host |
| `SMTP_PORT` | Email SMTP port |
| `SMTP_USER` | Email username |
| `SMTP_PASS` | Email password |

---

## 🎨 Code Style

### TypeScript/React Patterns
- Use **interfaces** for object shapes, **types** for unions
- Use `cn()` from `tailwind-merge` for conditional classes
- Use `forwardRef` for components accepting refs
- Always handle loading and error states

### Import Order
```typescript
// 1. React & Hooks
import { useState, useEffect } from 'react'

// 2. External libraries
import { useNavigate } from 'react-router-dom'

// 3. UI components
import { Button } from '@/components/ui/button'

// 4. Admin components
import { AdminTable } from '@/components/admin/table'

// 5. Contexts & hooks
import { useAuth } from '@/contexts/auth-context'

// 6. Utils
import { formatPrice } from '@/lib/utils'

// 7. Types
import type { Product } from '@/types'

// 8. API
import { api } from '@/lib/api'
```

### Naming Conventions
| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ProductCard.tsx` |
| Hooks | camelCase + use | `useCart.ts` |
| Utilities | camelCase | `formatPrice.ts` |
| Constants | SCREAMING_SNAKE | `API_BASE` |
| Types | PascalCase, no `I` prefix | `UserResponse` |
| Files (pages) | kebab-case | `product-detail.tsx` |

---

## 🌙 Dark Mode

**Never hardcode colors without `dark:` variant.**

```tsx
// ❌ Wrong
<div className="bg-white text-slate-800">

// ✅ Correct  
<div className="bg-white dark:bg-card text-slate-800 dark:text-slate-200">
```

| Light Mode | Dark Mode |
|------------|-----------|
| `bg-white` | `dark:bg-card` |
| `bg-slate-50` | `dark:bg-background` |
| `border-slate-200` | `dark:border-white/10` |
| `text-slate-900` | `dark:text-white` |
| `text-slate-600` | `dark:text-slate-400` |

---

## ♿ Accessibility

**All dialogs MUST have accessible titles:**

```tsx
<DialogContent>
  <DialogTitle className="sr-only">Product details</DialogTitle>
  <DialogDescription className="sr-only">View and edit product information</DialogDescription>
</DialogContent>

<SheetContent>
  <SheetTitle className="sr-only">Shopping cart</SheetTitle>
</SheetContent>
```

---

## 🏗️ API Design

### Response Format
```typescript
// Success
{ data: T, message?: string }

// Error
{ error: string, code?: string }
```

### HTTP Status Codes
| Code | Usage |
|------|-------|
| 200 | Success |
| 201 | Created |
| 400 | Validation error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not found |
| 500 | Server error |

### Validation
- Use **Zod** for both frontend and backend validation
- Validate on client for UX, validate on server for security

---

## 🧪 Testing

```bash
npm test                    # Run all tests
npm test -- --watch         # Watch mode
npm test -- --coverage      # With coverage
npm test -- --testPathPattern=<p>  # Specific test
```

### Test Patterns
```typescript
// Unit test
describe('formatPrice', () => {
  it('should format USD correctly', () => {
    expect(formatPrice(10.99, 'USD')).toBe('$10.99')
  })
})
```

---

## 🚢 Deployment

### Frontend (Vercel)
- **URL**: https://ecommerce-phi-five-35.vercel.app
- **Auto-deploy**: Enabled on push to main
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### Backend (Render)
- **URL**: https://ecommerce-backend-r75w.onrender.com
- **Database**: Render PostgreSQL (anas-supplements-db)
- **Build**: `npm install && npx prisma generate && npm run build`
- **Start**: Runs seed script + starts server

### Vercel Rewrites (vercel.json)
```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://ecommerce-backend-r75w.onrender.com/api/$1" }
  ]
}
```

---

## 🔒 Security

- **CORS**: Configure `FRONTEND_URL` for production
- **JWT**: Tokens stored in localStorage, validated server-side
- **Secrets**: Never commit `.env` files, use environment variables
- **Input Validation**: Zod schemas on all API endpoints
- **Rate Limiting**: Configured via `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX`

---

## 🛠️ Common Tasks

### Add a new API endpoint
1. Create route file in `server/src/infrastructure/web/routes/`
2. Add route to `server/src/index.ts`
3. Create/update service in `server/src/application/services/`
4. Add tests in `server/src/application/services/__tests__/`

### Add a new page
1. Create page component in `src/pages/admin/` or `src/pages/shop/`
2. Add route in `src/App.tsx`
3. Protect route if admin-only

### Database migration
```bash
# Local
cd server && npx prisma db push

# Production (Render)
# Automatically runs on deployment
```

---

## 📝 Required Skills

Before complex tasks, invoke appropriate skill:

| Task | Skill |
|------|-------|
| UI changes, components | `interface-design` |
| Performance, data fetching | `vercel-react-best-practices` |
| New features, creative work | `brainstorming` |
| API robustness | `error-handling-patterns` |
| Bug fixes | `systematic-debugging` |
| API design | `api-design-principles` |

---

## 🏷️ Git Workflow

1. Create feature branch: `git checkout -b feature/name`
2. Commit changes with clear messages
3. Push and create PR
4. Merge to main triggers auto-deploy

---

## ⚠️ Important Notes

- **Database**: PostgreSQL in production, local PostgreSQL for dev
- **Prisma Client**: Custom output to `server/src/generated/client`
- **ES Modules**: Server uses ES modules (`"type": "module"`)
- **Build**: `__dirname` uses `import.meta.url` workaround in production

---

**Last updated**: 2026-03-17
