# AGENTS.md - Ana's Supplements E-commerce

## Build Commands

```bash
# Install dependencies
npm install

# Frontend (Vite)
npm run dev                     # Start Vite dev server (port 5173)
npm run build                   # TypeScript compile + Vite production build
npm run preview                 # Preview production build

# Linting
npm run lint                    # ESLint all .ts/.tsx files
npm run lint -- --fix           # ESLint with auto-fix

# TypeScript
tsc --noEmit                    # Type check without emitting

# Backend (Express + Prisma)
npm run server                  # Start dev server with tsx (port 3001)
npm run server:build            # Compile server TypeScript
cd server && node dist/index.js # Start production server

# Database (Prisma)
npm run db:generate             # Generate Prisma client
npm run db:push                 # Push schema to database
npm run db:seed                 # Seed database with sample data
npm run db:studio               # Open Prisma Studio GUI

# Utilities
rm -rf node_modules/.vite       # Clear Vite cache (Linux/Mac)
rmdir /s /q node_modules\.vite  # Clear Vite cache (Windows)
```

## Environment Setup

Create `.env` in root and `server/.env`:

```bash
# Frontend (.env)
VITE_API_URL=http://localhost:3001/api

# Backend (server/.env)
DATABASE_URL="file:./dev.db"
JWT_SECRET=your-secret-key
PORT=3001
```

## Code Style

### Import Order
```typescript
import * as React from "react"                    // React
import { useState } from "react"                   // React hooks
import { Link } from "react-router-dom"            // Router
import { Button } from "@/components/ui/button"    // shadcn/ui
import { cn } from "@/lib/utils"                   // Utilities
import { useCart } from "@/contexts/cart-context"  // Contexts
import type { Product } from "@/types"             // Types
import { api } from "@/lib/api"                    // API/Data
```

### Naming Conventions
- Components: `PascalCase` (e.g., `ProductCard`)
- Hooks: `useCamelCase` (e.g., `useCart`)
- Utilities: `camelCase` (e.g., `formatPrice`)
- Constants: `SCREAMING_SNAKE_CASE` (e.g., `API_BASE`)
- Interfaces/Types: `PascalCase` (no `I` prefix)
- File names: `kebab-case.tsx` for components

### TypeScript Patterns
```typescript
// Prefer interfaces for objects, types for unions
interface ProductProps { id: string; name: string }
type Status = "active" | "inactive" | "pending"

// Avoid any - use unknown or specific types
function handleError(error: unknown) {
  if (error instanceof Error) console.error(error.message)
}

// Use optional properties with ?
interface Product { image?: string | null; weight?: string | null }

// Nullish coalescing for defaults
const price = product?.originalPrice ?? product.price
```

### React Components
```typescript
// Use forwardRef for components accepting refs
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, ...props }, ref) => (
    <button ref={ref} className={cn(className)} {...props} />
  )
)
Button.displayName = "Button"

// Explicit props interface
interface ProductCardProps {
  product: Product
  variant?: "default" | "compact"
  onAddToCart?: (product: Product) => void
}

// Context provider pattern
export function CartProvider({ children }: { children: ReactNode }) {
  // Implementation
}
export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
```

### Tailwind CSS
```typescript
import { cn } from "@/lib/utils"

// Use cn() for conditional classes
function Card({ className }: { className?: string }) {
  return <div className={cn("rounded-lg border bg-card", className)} />
}

// Class order: layout → sizing → appearance → states
// Use cva for component variants (shadcn pattern)
```

### Error Handling
```typescript
// API calls with proper error handling
async function fetchProducts(): Promise<Product[]> {
  try {
    const response = await fetch("/api/products")
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return response.json()
  } catch (error) {
    console.error("Failed to fetch products:", error)
    throw error
  }
}

// Empty catch blocks for localStorage (allowed)
try {
  localStorage.setItem(key, JSON.stringify(data))
} catch {
  // Silent fail for storage errors
}
```

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── ui/           # shadcn/ui components (button, card, dialog, etc.)
│   │   ├── layout/       # Navbar, Footer, AdminLayout
│   │   ├── shop/         # ProductCard, ProductGrid, CategoryCard
│   │   ├── cart/         # CartItem, CartDrawer
│   │   ├── product/      # ProductDetail
│   │   └── shared/       # Hero, Newsletter, WhatsAppButton
│   ├── pages/
│   │   ├── home.tsx      # Landing page
│   │   ├── catalog.tsx   # Product catalog
│   │   ├── product.tsx   # Product detail page
│   │   ├── cart.tsx      # Shopping cart
│   │   ├── login.tsx     # Auth login
│   │   ├── register.tsx  # Auth register
│   │   └── admin/        # Dashboard, Products, Orders, etc.
│   ├── contexts/         # React Contexts (CartContext)
│   ├── hooks/            # Custom React hooks
│   ├── lib/
│   │   ├── utils.ts      # cn() and helpers
│   │   └── api.ts        # ApiClient class
│   ├── types/            # TypeScript interfaces
│   └── App.tsx           # Main app with routes
├── server/
│   ├── src/
│   │   ├── config/       # Database, email config
│   │   ├── controllers/  # Route controllers
│   │   ├── middleware/   # Auth, validation
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   └── types/        # Server types
│   └── prisma/
│       └── schema.prisma # Database schema
```

## Routes

```typescript
// Public routes
/                 # Home
/productos        # Catalog
/producto/:id     # Product detail
/carrito          # Cart
/login            # Login
/register         # Register

// Admin routes (protected)
/admin            # Dashboard
/admin/productos  # Products management
/admin/categorias # Categories
/admin/pedidos    # Orders/Sales
/admin/inventario # Inventory
/admin/clientes   # Customers
/admin/requerimientos # Requirements
/admin/analiticas # Analytics
/admin/financiero # Financial reports
/admin/configuracion # Settings
```

## API Client Pattern

```typescript
import { api } from "@/lib/api"

// Usage
const { products } = await api.getPublicProducts({ categoryId: "123" })
await api.login(email, password)
```

## shadcn/ui Usage

```typescript
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// Always export both component and variants
export { Button, buttonVariants }
```

## Notes
- Full-stack e-commerce with React frontend + Express backend
- Uses SQLite database via Prisma ORM
- Authentication via JWT tokens stored in localStorage
- BCV rate integration for USD/VES currency conversion
- No test framework configured yet
- shadcn/ui v1.0 with Radix UI primitives
