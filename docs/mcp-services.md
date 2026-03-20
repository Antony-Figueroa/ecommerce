# MCP Services para Ana's Supplements

## Overview

MCP (Model Context Protocol) services extienden las capacidades del agente AI con herramientas especializadas. Esta guía documenta los servicios recomendados para este proyecto.

---

## Servicios Disponibles en opencode

### 1. Sequential Thinking
**Propósito:** Razonamiento paso a paso para debugging complejo

**Instalación:** Ya integrado en opencode

**Uso:**
```
Útil para:
- Debugging de bugs complejos
- Planificación de features
- Decisiones arquitectónicas
```

### 2. Agent Browser
**Propósito:** Automatización web, scraping, testing

**Ubicación:** `.agents/skills/agent-browser/SKILL.md`

**Casos de uso:**
- Testing E2E
- Verificación de UI en producción
- Extracción de datos de competitors

---

## MCP Services Recomendados

### Desarrollo

| Service | Descripción | npm package |
|---------|-------------|-------------|
| `filesystem` | Acceso a archivos | Built-in |
| `bash` | Comandos shell | Built-in |
| `git` | Operaciones git | Built-in |

### Base de Datos

| Service | Descripción | Config |
|---------|-------------|--------|
| `sqlite-data` | Acceso a SQLite | `.agents/skills/sqlite-data/SKILL.md` |

### Deployment

| Service | Descripción | Webhook |
|---------|-------------|---------|
| `vercel` | Deploys, logs, env vars | Vercel Dashboard |
| `render` | Backend deployments | Render Dashboard |

### Monitoreo

| Service | Descripción | Setup |
|---------|-------------|-------|
| `sentry` | Error tracking | Sentry Dashboard |
| `datadog` | APM, logs | Datadog Dashboard |

---

## Configuración de MCP en Cursor/Claude Desktop

Para agregar MCP services en tu editor, crea `.mcp.json`:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/directory"]
    },
    "git": {
      "command": "uvx",
      "args": ["mcp-server-git", "--repository", "/path/to/repo"]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    }
  }
}
```

---

## MCP Services para E-commerce

### 1. Product Data Generator
Genera datos de prueba realistas para productos.

```typescript
// MCP para generar productos de suplementos
interface GeneratedProduct {
  name: string;        // "Colágeno hidrolizado premium"
  brand: string;       // "Nature's Best"
  category: string;    // "Colágeno"
  price: number;       // 45.99
  description: string;  // "Beneficios: piel, cabello, uñas..."
  ingredients: string[];
  weight: string;      // "500g"
  format: "polvo" | "capsulas" | "tabletas";
}
```

### 2. Analytics Insights
Extrae insights de ventas y productos.

```typescript
// MCP para analizar datos de ventas
interface SalesInsight {
  topProducts: string[];
  revenue: { daily: number; weekly: number; monthly: number };
  conversionRate: number;
  avgOrderValue: number;
  popularCategories: string[];
}
```

### 3. SEO Optimizer
Optimiza descripciones de productos para SEO.

```typescript
// MCP para SEO
interface SEORecommendation {
  title: string;
  metaDescription: string;
  keywords: string[];
  structuredData: object;
}
```

---

## Skills Disponibles en opencode

Este proyecto ya tiene skills configuradas en `.agents/skills/`:

| Skill | Uso |
|-------|-----|
| `interface-design` | UI/UX del admin panel |
| `vercel-react-best-practices` | Performance React |
| `brainstorming` | Planificación de features |
| `error-handling-patterns` | Robustez en APIs |
| `systematic-debugging` | Diagnóstico de bugs |
| `api-design-principles` | Diseño de APIs REST |
| `sqlite-data` | Persistencia SQLite |
| `agent-browser` | Automatización web |
| `find-skills` | Descubrir nuevas skills |

---

## Próximos Pasos

1. **Configurar MCP servers** en tu editor (Cursor/Claude Desktop)
2. **Agregar skills** usando `find-skills`
3. **Integrar analytics** con Google Analytics 4
4. **Setup monitoring** con Sentry

---

## Recursos

- [MCP Documentation](https://modelcontextprotocol.io)
- [MCP Servers](https://github.com/modelcontextprotocol/servers)
- [opencode.ai](https://opencode.ai)
