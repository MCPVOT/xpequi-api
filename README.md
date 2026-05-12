# Pequi API — Colombia's First Real Estate Data API

> **API pública de datos inmobiliarios para Ibagué y Colombia.**
> Basado en Open Finance (Decreto 0368).

[![npm](https://img.shields.io/badge/npm-@MCPVOT%2Fapi--client-blue)](https://github.com/MCPVOT/xpequi-api/packages)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Website](https://img.shields.io/badge/web-xpequi.xyz-00e5ff)](https://xpequi.xyz)

---

## 📦 Paquetes

| Paquete | Descripción | Instalar |
|---------|-------------|----------|
| **`@MCPVOT/api-client`** | TypeScript SDK con tipado completo | `npm install @MCPVOT/api-client` |
| **`@MCPVOT/mcp-server`** | MCP server para Claude Desktop / Cursor | `npx @MCPVOT/mcp-server` |

## 🚀 Uso rápido

### SDK (TypeScript)

```typescript
import { PequiClient } from '@MCPVOT/api-client'

const client = new PequiClient()

// Buscar propiedades
const propiedades = await client.searchProperties({
  city: 'ibague',
  tipo: 'apartamento',
  limit: 5,
})

// Obtener barrios
const barrios = await client.getBarrios('ibague')

// Precios de referencia
const benchmarks = await client.getBenchmarks({
  barrio: 'centro',
  tipo: 'apartamento',
})

// Geocodificar dirección
const coords = await client.geocode('Calle 10 #3-15, Ibagué')
```

### MCP Server (Claude Desktop)

Agregar a `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "pequi": {
      "command": "npx",
      "args": ["-y", "@MCPVOT/mcp-server"]
    }
  }
}
```

### curl (sin SDK)

```bash
# Propiedades
curl https://xpequi.xyz/api/v1/properties?city=ibague&limit=5

# Barrios
curl https://xpequi.xyz/api/v1/barrios?city=ibague

# Benchmarks
curl https://xpequi.xyz/api/v1/benchmarks?barrio=centro

# Geocodificación
curl 'https://xpequi.xyz/api/v1/geocode?address=Calle+10+%233-15+Ibagu%C3%A9'
```

## 📋 Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/v1/properties` | Buscar propiedades (filtros: tipo, precio, barrio, estrato, cuartos) |
| `GET` | `/api/v1/barrios` | Listar barrios de Ibagué con estrato y coordenadas |
| `GET` | `/api/v1/benchmarks` | Precios de referencia por m² |
| `GET` | `/api/v1/geocode` | Dirección → coordenadas |

## 💰 Precios

| Tier | Precio | Límite | Para |
|------|--------|--------|------|
| **GRATIS** | $0/mes | 150 req/día | Developers probando |
| **AGENTE** | $30K COP/mes | 1,000 req/día | Inmobiliarias |
| **CONJUNTO** | $150K COP/mes | 5,000 req/día | Administradores |
| **EMPRESARIAL** | Cotizar | 50K+ req/día | Bancos, fintechs |

## 🔗 Links

- [Dashboard Developers](https://xpequi.xyz/developers) — Documentación interactiva
- [Blog: Decreto 0368](https://xpequi.xyz/blog/open-finance-decreto-0368) — Open Finance en Colombia
- [Pequi App](https://xpequi.xyz) — Plataforma inmobiliaria con IA

## 📄 Licencia

MIT © Pequi
