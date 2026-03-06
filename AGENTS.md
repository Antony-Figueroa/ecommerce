# 🛠️ Guía de Desarrollo y Estándares - Ana's Supplements

Esta guía proporciona la información técnica necesaria para el desarrollo, mantenimiento y despliegue del ecosistema Ana's Supplements.

---

## 🚀 Comandos de Desarrollo

### Instalación

```bash
npm install
```

### Frontend (Vite)

- `npm run dev`:  Inicia el servidor de desarrollo (puerto 5173).
- `npm run build`: Compilación TypeScript + Build de producción.
- `npm run preview`: Previsualiza el build de producción.

### Backend (Express + Prisma)

- `npm run server`:  Inicia el servidor con `tsx` (puerto 3001).
- `npm run server:build`: Compila el TypeScript del servidor.
- `cd server && node dist/index.js`: Inicia el servidor de producción.

### Base de Datos (Prisma)

- `npm run db:generate`:  Genera el cliente Prisma.
- `npm run db:push`: Sincroniza el esquema con la base de datos.
- `npm run db:seed`: Puebla la base de datos con datos de prueba.
- `npm run db:studio`: Abre la interfaz GUI de Prisma Studio.

### Calidad de Código

- `npm run lint`:  Ejecuta ESLint.
- `npm run lint -- --fix`: Corrige errores de linting automáticamente.
- `tsc --noEmit`: Verificación de tipos sin emisión de archivos.

---

## ⚙️ Configuración del Entorno

Cree archivos `.env` en la raíz y en `server/`:

### Frontend (`.env`)

```bash
VITE_API_URL=http://localhost:3001/api
```

### Backend (`server/.env`)

```bash
DATABASE_URL="file:./dev.db"
JWT_SECRET=tu-clave-secreta
PORT=3001
```

---

## 🎨 Estándares de Código

### Orden de Importación

Siga este orden para mantener la consistencia:

1. React y Hooks
2. Librerías externas (Router, etc.)
3. Componentes de UI (`@/components/ui`)
4. Componentes Admin (`@/components/admin`)
5. Utilidades (`@/lib/utils`)
6. Contextos y Hooks propios
7. Tipos e Interfaces
8. API y Servicios

### Convenciones de Nomenclatura

- **Componentes**:  `PascalCase` (`ProductCard.tsx`)
- **Hooks**: `useCamelCase` (`useCart.ts`)
- **Utilidades**: `camelCase` (`formatPrice.ts`)
- **Constantes**: `SCREAMING_SNAKE_CASE` (`API_BASE`)
- **Interfaces/Types**: `PascalCase` (sin prefijo `I`)
- **Archivos**: `kebab-case.tsx` para componentes generales.

---

## 🏗️ Arquitectura y Estructura

### Estructura de Carpetas

```text
├── src/                # Frontend
│   ├── components/     # UI, Layout, Shop, Cart, Product
│   │   └── admin/     # Componentes admin unificados
│   ├── pages/         # Páginas y rutas
│   ├── contexts/      # Gestión de estado global
│   ├── hooks/         # Lógica reutilizable
│   ├── lib/           # Clientes API y utilidades
│   └── types/         # Definiciones de TypeScript
├── server/            # Backend
│   ├── src/           # Controladores, Rutas, Servicios
│   └── prisma/       # Esquema y migraciones
```

### Patrones React

- Preferir **Interfaces** para objetos y **Types** para uniones.
- Usar `forwardRef` para componentes que aceptan refs (estándar shadcn/ui).
- Implementar el patrón **Context Provider** para estados compartidos.
- Utilizar `cn()` para la gestión condicional de clases Tailwind.

---

## 🎯 Componentes Admin Unificados

**IMPORTANTE**: Para mantener consistencia en toda la interfaz admin, USE los siguientes componentes creados en `@/components/admin/`:

### AdminCard
- Uso: Contenedores de contenido con estilos consistentes
- Props: `hover`, `padding` ("none" | "sm" | "md" | "lg")
- Archivo: `src/components/admin/admin-card.tsx`

### AdminTable
- Uso: Tablas de datos con estilos consistentes
- Incluye: `AdminTable`, `AdminTableHeader`, `AdminTableBody`, `AdminTableRow`, `AdminTableHead`, `AdminTableCell`, `AdminTableEmpty`
- Archivo: `src/components/admin/admin-table.tsx`

### AdminBadge
- Uso: Etiquetas de estado y categorización
- Variantes: `default`, `success`, `warning`, `danger`, `info`, `neutral`, `outline`
- Tamaños: `sm`, `md`, `lg`
- Incluye helper `StatusBadge` para estados de pedido
- Archivo: `src/components/admin/admin-badge.tsx`

### AdminButton
- Uso: Botones con estilos consistentes
- Variantes: `primary`, `secondary`, `outline`, `ghost`, `danger`, `success`, `link`
- Tamaños: `sm`, `md`, `lg`, `icon`
- Soporte: `loading`
- Archivo: `src/components/admin/admin-button.tsx`

### FilterSelect (Select)
- Uso: Filtros y selects de búsqueda
- **OBLIGATORIO**: Usar Select para filtros de estado, NO botones
- Componente: `src/components/admin/admin-filter-select.tsx`
- Archivo UI: `@/components/ui/select`

### Pagination
- Uso: Paginación en tablas de resultados
- Props: `currentPage`, `totalPages`, `totalItems`, `itemsPerPage`, `onPageChange`, `showItemsPerPage`
- Opciones de items por página: 10, 25, 50, 100
- Archivo: `src/components/admin/pagination.tsx`

### ConfirmDialog
- Uso: Diálogos de confirmación reutilizables
- Hook: `useConfirmDialog()` que retorna `confirmAction`, `confirmConfig`, `ConfirmDialogComponent`
- Variantes: default, destructive, success
- Iconos: warning, success, info, error
- Archivo: `src/components/admin/confirm-dialog.tsx`

---

## 🛡️ Seguridad y Errores

- **Validación**: Uso obligatorio de `Zod` tanto en frontend como backend.
- **Errores API**: Captura centralizada con estados HTTP descriptivos.
- **Autenticación**: JWT almacenado en `localStorage` con validación en cada ruta protegida.

---

## 🧠 Uso Obligatorio de Skills (Agentes AI)

> **NOTA**: Antes de cualquier tarea, el agente DEBE invocar la skill apropiada y seguir sus principios.

### 🎨 Interface Design (PRIORIDAD MÁXIMA)

**Ubicación**: `.agents/skills/interface-design/SKILL.md`

- **Uso**: Cualquier modificación de UI, componentes o flujos de usuario.
- **MANDATO OBLIGATORIO**:
  - Aplicar 'Intent First' - responder: ¿Quién es el usuario? ¿Qué debe lograr? ¿Cómo debe sentirse?
  - Aplicar 'Subtle Layering' - superficies barely different pero distinguibles
  - Realizar 'Squint Test' - con ojos borrosos debe percibirse jerarquía
  - Realizar 'Signature Test' - 5 elementos específicos que hacen único este producto
  - **NO generar interfaces genéricas** - cada componente debe emerger del propósito específico

### ⚡ Vercel React Best Practices (PRIORIDAD ALTA)

- **Uso**: Refactorización, creación de componentes o lógica de fetching.
- **Mandato**: Eliminar waterfalls con `Promise.all()`, optimizar re-renders y reducir bundle size.

### 💡 Brainstorming (PRIORIDAD ALTA)

- **Uso**: Antes de cualquier trabajo creativo, creación de features o cambios de comportamiento.
- **Mandato**: Explorar la intención del usuario y requerimientos antes de implementar.

### 🛡️ Error Handling Patterns (PRIORIDAD ALTA)

- **Uso**: Al diseñar APIs o implementar robustez en el código.
- **Mandato**: Usar patrones de Result, Graceful degradation y validación estricta con Zod.

---

### 🔍 Systematic Debugging

- **Uso**: Ante cualquier error, bug o comportamiento inesperado.
- **MANDATO**: 
  - Seguir el proceso de diagnóstico raíz antes de proponer soluciones
  - **IMPORTANTE**: El agente debe monitorear proactivamente la terminal y la consola durante cada implementación para detectar y corregir errores "al trote" sin intervención del usuario

### 📝 Changelog Generator

- **Uso**: Al finalizar tareas significativas para documentar cambios.
- **Mandato**: Transformar commits técnicos en notas de lanzamiento amigables.

### 🛠️ API Design Principles

- **Uso**: Al diseñar APIs o recursos del servidor.
- **Mandato**: Usar principios REST/GraphQL y consistencia en endpoints.

### 🌐 Agent Browser

- **Uso**: Automatización web, scraping, testing y navegación.
- **Mandato**: Usar el sistema de refs `@e` y seguir el flujo Open-Interact-Snapshot-Close.

---

## 🧪 Recharts - Gráficos

Para evitar warnings de dimensiones negativas:
- **SIEMPRE** validar que los datos existan antes de renderizar
- Usar estado `isReady` con timeout de 100ms
- Mostrar estado de carga cuando no hay datos

```tsx
{isReady && data.length > 0 ? (
  <ResponsiveContainer>...</ResponsiveContainer>
) : (
  <div>Cargando...</div>
)}
```

---

## 🔗 Documentación Relacionada

- [Análisis Funcional](docs/analisis-funcional.md)
- [Referencia API](docs/api-reference.md)
- [Arquitectura de Sistemas](docs/ARQUITECTURA.md)
- [Flujos de Negocio](docs/flujos-negocio.md)
- [Documentación Chat IA](docs/ai-chat.md)

---

## 🌙 Modo Oscuro — Reglas y Patrones

### Regla fundamental: NUNCA colores hardcodeados sin variante `dark:`

Todo color de fondo, texto o borde que no sea un token de tema (`bg-background`, `text-foreground`, etc.) **DEBE** tener su variante oscura explícita.

**❌ Incorrecto:**
```tsx
<div className="bg-white text-slate-800 border-slate-200">
```

**✅ Correcto:**
```tsx
<div className="bg-white dark:bg-card text-slate-800 dark:text-slate-200 border-slate-200 dark:border-white/10">
```

---

### Paleta de sustituciones aprobadas

| Uso | Modo Claro | Modo Oscuro |
|---|---|---|
| Fondos de card/panel | `bg-white` | `dark:bg-card` |
| Fondo de página | `bg-slate-50` | `dark:bg-background` |
| Sidebar/Navbar admin | `bg-white` | `dark:bg-background` |
| Bordes | `border-slate-200` | `dark:border-white/10` |
| Texto principal | `text-slate-900` | `dark:text-white` |
| Texto secundario | `text-slate-600` | `dark:text-slate-400` |
| Texto terciario | `text-slate-400` | `dark:text-slate-500` |
| Hover fondo | `hover:bg-neutral-50` | `dark:hover:bg-neutral-800/60` |
| Hover texto | `hover:text-neutral-900` | `dark:hover:text-neutral-100` |
| Verde de acento | `text-green-600` | `dark:text-green-400` |
| Ámbar de alerta | `bg-amber-50 text-amber-600 border-amber-200` | `dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/50` |
| Esmeralda/ganancia | `bg-emerald-50 text-emerald-600 border-emerald-100` | `dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/40` |
| Barra de progreso | `bg-slate-100` | `dark:bg-white/10` |
| Campo readonly | `bg-slate-100/80 text-slate-600 border-slate-200` | `dark:bg-white/5 dark:text-slate-400 dark:border-white/10` |
| Input de formulario | `bg-white border-slate-200` | `dark:bg-card dark:border-white/10` |

---

### Variables CSS en `index.css`

El color primario (`--primary`) está definido en HSL y debe ser **idéntico** en modo claro y oscuro para mantener la coherencia de marca:

```css
/* Correcto: mismo verde en ambos modos */
:root        { --primary: 85 75% 45%; }
.dark        { --primary: 85 75% 45%; }  /* NO cambiar este valor */
```

---

### Sidebar y Navbar admin — color unificado

El sidebar y el top-nav deben usar **el mismo color de fondo** para sentirse como una sola unidad:

```tsx
/* Sidebar */
<div className="bg-white dark:bg-background ...">

/* Top Nav */
<header className="bg-white dark:bg-background ...">
```

---

### Sidebar colapsado — ancho mínimo

El sidebar colapsado usa `w-20` (80px) para que los íconos tengan aire suficiente. No bajar de este valor.

```tsx
sidebarOpen ? "w-56" : "w-20"
// Margen del contenido principal:
sidebarOpen ? "md:ml-56" : "md:ml-20"
```

---

## ♿ Accesibilidad — Radix UI / Dialog / Sheet

### Regla: `DialogContent` y `SheetContent` SIEMPRE requieren título

Radix UI lanza warnings en consola si `DialogContent` o `SheetContent` no tienen un `DialogTitle`/`SheetTitle`. Si el título no es visible en el diseño, usar la clase `sr-only`.

**Patrón obligatorio para diálogos sin título visible:**
```tsx
<DialogContent className="...">
  <DialogTitle className="sr-only">Nombre descriptivo del diálogo</DialogTitle>
  <DialogDescription className="sr-only">Descripción para lectores de pantalla</DialogDescription>
  {/* contenido visual */}
</DialogContent>
```

**Patrón obligatorio para Sheets (menús móviles):**
```tsx
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet"

<SheetContent side="left" className="...">
  <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
  <SheetDescription className="sr-only">Panel de navegación</SheetDescription>
  {/* contenido */}
</SheetContent>
```

### Archivos que ya aplican este patrón
- `src/components/admin/command-palette.tsx` — Paleta de comandos
- `src/components/layout/admin-layout.tsx` — Sidebar móvil admin
- `src/components/layout/navbar.tsx` — Menú móvil público
- `src/components/shop/product-quick-view.tsx` — Modal de producto (usa `DialogTitle` visible)

---

## 🗂️ Layout Admin — Estructura visual

### Jerarquía de capas (z-index)

| Capa | z-index | Componente |
|---|---|---|
| Sidebar fijo | `z-40` | `<aside>` en `admin-layout.tsx` |
| Top Nav | `z-30` | `<header>` en `admin-top-nav.tsx` |
| Modales/Dialogs | `z-50` | Radix UI por defecto |
| Toasts | `z-60+` | Radix UI por defecto |

### Fórmula de márgenes dinámicos
```tsx
// Margen del contenido principal se sincroniza con ancho del sidebar
const mainMargin = sidebarOpen ? "md:ml-56" : "md:ml-20"
const sidebarWidth = sidebarOpen ? "w-56" : "w-20"
```

---

## ♻️ Restauración de archivos con Git

Para recuperar la versión de un archivo en un commit específico:

```powershell
# Ver historial de un archivo
git log --oneline -- src/components/shared/hero.tsx

# Restaurar a un commit específico (modifica el working tree)
git checkout <HASH> src/components/shared/hero.tsx src/components/layout/navbar.tsx

# Leer contenido de un commit sin modificar el árbol
git show <HASH>:src/components/shared/hero.tsx > destino.tsx
```

> ⚠️ En PowerShell, `&&` no funciona como separador. Usar dos comandos separados o `;`.

---

Última actualización: 2026-03-05
