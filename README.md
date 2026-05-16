<p align="center">
  <a href="https://xpequi.xyz">
    <img src="https://xpequi.xyz/pequi-logo.svg" alt="Pequi" width="120" />
  </a>
</p>

<h1 align="center">Pequi API</h1>

<p align="center">
  <strong>Colombia's First Real Estate Data API</strong><br />
  <em>API pública de datos inmobiliarios — Ibagué (64 barrios) + Bogotá (212 barrios)</em><br />
  <a href="https://xpequi.xyz/blog/open-finance-decreto-0368">Open Finance · Decreto 0368</a>
</p>

<p align="center">
  <a href="https://xpequi.xyz"><img src="https://img.shields.io/badge/xpequi.xyz-00e5ff?style=flat-square&logo=vercel&logoColor=white" alt="Website" /></a>
  <a href="https://www.npmjs.com/package/@MCPVOT/api-client"><img src="https://img.shields.io/badge/npm-@MCPVOT%2Fapi--client-3178c6?style=flat-square&logo=npm&logoColor=white" alt="npm" /></a>
  <a href="https://www.npmjs.com/package/@MCPVOT/mcp-server"><img src="https://img.shields.io/badge/npm-@MCPVOT%2Fmcp--server-7b2d8e?style=flat-square&logo=npm&logoColor=white" alt="npm MCP" /></a>
  <a href="https://www.npmjs.com/package/@MCPVOT/api-client"><img src="https://img.shields.io/npm/dw/@MCPVOT/api-client?style=flat-square&color=orange" alt="npm downloads" /></a>
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/MCP-directory-blue?style=flat-square&logo=modelcontextprotocol" alt="MCP Directory" />
  <a href="https://smithery.ai"><img src="https://img.shields.io/badge/Smithery-Pequi%20API-orange?style=flat-square" alt="Smithery" /></a>
  <img src="https://img.shields.io/badge/Open%20Finance-Decreto%200368-ff8c00?style=flat-square" alt="Open Finance" />
  <img src="https://img.shields.io/badge/c402-HTTP%20402%20Payment-00ff88?style=flat-square" alt="c402 Protocol" />
  <a href="https://xpequi.xyz/api/health"><img src="https://img.shields.io/badge/status-online-brightgreen?style=flat-square" alt="Status" /></a>
</p>

---

## Quick Start

Try the API right now — no API key required:

```bash
# Search properties in Bogotá
curl https://xpequi.xyz/api/v1/properties?city=bogota&limit=3

# Get neighborhoods with estratos
curl https://xpequi.xyz/api/v1/barrios?city=ibague

# Current UVR (Unidad de Valor Real) from Banco de la República
curl https://xpequi.xyz/api/v1/uvr

# Annual IPC inflation — for Ley 820 rent adjustments
curl https://xpequi.xyz/api/v1/ipc
```

Or use the TypeScript SDK:

```typescript
import { PequiClient } from '@MCPVOT/api-client'

const client = new PequiClient()
const properties = await client.searchProperties({ city: 'bogota', limit: 5 })
```

> **No API key needed** for GET endpoints (properties, barrios, benchmarks, geocode, UVR, IPC, complexes). Only write operations require authentication. [Get your free API key →](https://xpequi.xyz/developers)

---

## Table of Contents

- [SDK Installation](#sdk-installation)
- [TypeScript SDK](#typescript-sdk)
- [Python SDK](#python-sdk)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Pagination](#pagination)
- [Response Format](#response-format)
- [Rate Limits & c402 Protocol](#rate-limits--c402-protocol)
- [MCP Server](#mcp-server)
- [AI Agent Integration](#ai-agent-integration)
- [Support](#support)

---

## SDK Installation

| Package | Install | Description |
|---------|---------|-------------|
| **`@MCPVOT/api-client`** | `npm install @MCPVOT/api-client` | TypeScript SDK — full type safety, 31 methods |
| **`pequi-api-client`** | `pip install pequi-api-client` | Python SDK — fluent interface, 16 sub-APIs |
| **`@MCPVOT/mcp-server`** | `npx -y @MCPVOT/mcp-server` | MCP server for Claude Desktop, Cursor, Copilot |

> **Note:** npm packages are on GitHub Packages with pending publication due to billing limits. Until resolved, use the REST endpoints directly or install from [GitHub Packages](https://github.com/MCPVOT/xpequi-api/packages). The API is fully functional without an SDK.

---

## TypeScript SDK

```typescript
import { PequiClient, PequiApiError } from '@MCPVOT/api-client'

const client = new PequiClient({ apiKey: 'pk_live_...' })

// ── Search properties ──────────────────────────────────────
const properties = await client.searchProperties({
  city: 'ibague',
  tipo: 'apartamento',
  barrio: 'centro',
  minPrice: 100_000_000,
  maxPrice: 500_000_000,
  limit: 10,
})

// ── Neighborhood data ──────────────────────────────────────
const barrios = await client.getBarrios('bogota')

// ── Price benchmarks ───────────────────────────────────────
const benchmarks = await client.getBenchmarks({
  barrio: 'centro',
  tipo: 'apartamento',
})

// ── Geocoding ──────────────────────────────────────────────
const coords = await client.geocode('Calle 10 #3-15, Ibagué')

// ── AVM (Automated Valuation) ──────────────────────────────
const avm = await client.getAVM({
  area: 80,
  bedrooms: 3,
  bathrooms: 2,
  propertyType: 'APARTMENT',
  barrio: 'centro',
  city: 'ibague',
})

// ── Financial indicators ───────────────────────────────────
const uvr = await client.getUVR()
const ipc = await client.getIPC()
const rentIncrease = await client.calculateRentIncrease({
  currentRent: 1_200_000,
  startDate: '2025-05-01',
  months: 12,
})

// ── Contracts (Ley 820) ────────────────────────────────────
const contract = await client.generateContract({
  landlordName: 'María García',
  landlordCedula: '123456789',
  tenantName: 'Juan Pérez',
  tenantCedula: '987654321',
  propertyAddress: 'Calle 10 #3-15, Ibagué',
  rentAmount: 1_200_000,
  startDate: '2026-06-01',
  endDate: '2028-05-31',
})

// ── c402 Credits & Subscriptions ───────────────────────────
const balance = await client.getCredits()
const checkout = await client.purchaseCredits(200)     // 200 calls
const sub = await client.getSubscriptionCheckout('AGENTE') // $30K/mo

// ── Payments ───────────────────────────────────────────────
const payment = await client.createPayment({
  userId: 'user_xxx',
  amount: 1200000,
  paymentType: 'RENT',
})

// ── Monitoring ─────────────────────────────────────────────
const usage = await client.getUsage()
const latency = await client.getLatency('p95')
const errors = await client.getErrors()
const uptime = await client.getUptime('24h')

// ── Error handling ─────────────────────────────────────────
try {
  await client.searchProperties({ city: 'invalid' })
} catch (err) {
  if (err instanceof PequiApiError) {
    console.log(err.status)      // 400
    console.log(err.code)        // 'BAD_REQUEST'
    console.log(err.recoverable) // false
    console.log(err.message)     // Human-readable error
  }
}
```

---

## Python SDK

```python
from pequi_api_client import PequiClient, PequiApiError

client = PequiClient(api_key="pk_live_...")

# Fluent sub-API design — each domain is a property
properties = client.properties.search(city="ibague", limit=5)
barrios = client.barrios.list(city="bogota")
benchmarks = client.benchmarks.list(barrio="centro")
coords = client.geocode.geocode("Calle 10 #3-15, Ibagué")

# Financial indicators
uvr = client.finance.get_uvr()
ipc = client.finance.get_ipc()
increase = client.finance.calculate_rent_increase(
    current_rent=1200000, start_date="2025-05-01"
)

# AVM valuation
avm = client.avm.estimate(
    area=80, bedrooms=3, bathrooms=2,
    property_type="APARTMENT", barrio="centro", city="ibague"
)

# c402 credits
balance = client.credits.balance()
checkout = client.credits.purchase(calls=200)

# Monitoring
usage = client.monitoring.usage()
uptime = client.monitoring.uptime(window="24h")

# Error handling
try:
    client.properties.search(city="invalid")
except PequiApiError as e:
    print(e.status, e.code, e.message)
```

---

## API Endpoints

### Properties & Neighborhoods

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/properties` | Search properties with filters (city, type, price, bedrooms, estrato) | — |
| `GET` | `/api/v1/barrios` | 64 barrios Ibagué · 212 barrios Bogotá with estrato and GIS | — |
| `GET` | `/api/v1/benchmarks` | Reference prices per m² by neighborhood and type | — |
| `GET` | `/api/v1/geocode` | Address → coordinates (OpenStreetMap Nominatim) | — |
| `POST` | `/api/v1/avm` | Automated valuation with comparable properties | — |
| `POST` | `/api/v1/avm/bulk` | Batch AVM (up to 100 properties, idempotency-supported) | — |

### Financial Indicators

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/uvr` | Current UVR — Banco de la República (live via MCP) | — |
| `GET` | `/api/v1/ipc` | Annual IPC inflation — for Ley 820 rent adjustments | — |
| `POST` | `/api/v1/rent-increase` | Calculate legal rent increase per Ley 820 | — |

### Contracts & Payments

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/v1/contracts` | Generate Ley 820 rental contract | API Key |
| `POST` | `/api/v1/payments` | Create Wompi payment (PSE, Nequi, Daviplata, card) | API Key |
| `GET` | `/api/v1/payments/{id}` | Check payment status | API Key |

### Complexes (Conjuntos Residenciales)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/complexes` | List residential complexes | — |
| `GET` | `/api/v1/complexes/{slug}` | Complex details (amenities, units, images) | — |
| `GET` | `/api/v1/complexes/{slug}/units` | Individual units within a complex | — |

### AI & Communication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/v1/chat` | AI real estate assistant (streaming SSE) | API Key |
| `POST` | `/api/v1/visits` | Schedule property visit | API Key |
| `POST` | `/api/v1/upload` | Upload files (max 5MB, images/docs) | API Key |
| `POST` | `/api/v1/bank-verification` | Verify Colombian bank accounts (Prometeo Open Finance) | API Key |

### c402 Monetization

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/credits` | Prepaid credit balance and pack pricing | — |
| `POST` | `/api/v1/credits/purchase` | Buy credit pack via Wompi | API Key |
| `POST` | `/api/v1/subscriptions/api-checkout` | Monthly subscription (AGENTE/CONJUNTO) | API Key |

### Monitoring

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/monitoring/usage` | Hourly call count, credits remaining, current tier | API Key |
| `GET` | `/api/v1/monitoring/latency` | P50/P95/P99 latency per endpoint | API Key |
| `GET` | `/api/v1/monitoring/errors` | 4xx/5xx breakdown per endpoint | API Key |
| `GET` | `/api/v1/monitoring/uptime` | API availability over window | API Key |

### Webhooks

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/v1/webhooks/endpoints` | Create webhook (HMAC-SHA256 signed) | API Key |
| `GET` | `/api/v1/webhooks/endpoints` | List registered webhooks | API Key |
| `DELETE` | `/api/v1/webhooks/endpoints/{id}` | Unregister webhook | API Key |
| `POST` | `/api/v1/webhooks/endpoints/{id}/test` | Test webhook delivery | API Key |

---

## Authentication

Most public GET endpoints work without authentication. Write endpoints require a Bearer token:

```
Authorization: Bearer pk_live_abc123def456
```

Get your API key from the [Developer Portal](https://xpequi.xyz/developers). API keys are SHA-256 hashed at rest and scoped to specific tiers.

### Tier Limits by Key

| Scope | Without Key | With FREE Key | With AGENTE Key | With CONJUNTO Key |
|-------|-------------|---------------|-----------------|-------------------|
| Properties | ✅ Read | ✅ Read | ✅ Read | ✅ Read |
| Barrios | ✅ Read | ✅ Read | ✅ Read | ✅ Read |
| Contracts | ❌ | ❌ | ✅ Write | ✅ Write |
| Payments | ❌ | ❌ | ❌ | ✅ Write |
| Webhooks | ❌ | ❌ | ✅ CRUD | ✅ CRUD |

---

## Error Handling

All errors return a standardized envelope that both human developers and AI agents can parse deterministically:

```json
{
  "error": "API key inválida.",
  "code": "INVALID_API_KEY",
  "recoverable": false,
  "suggestedAction": "Verifica tu API key en https://xpequi.xyz/developers",
  "retryAfter": null,
  "requestId": "req_a1b2c3d4"
}
```

### Error Codes

| Code | HTTP | Meaning | Recoverable |
|------|------|---------|-------------|
| `INVALID_API_KEY` | 401 | Missing or malformed Bearer token | ❌ |
| `INSUFFICIENT_SCOPE` | 403 | Key doesn't have access to this endpoint | ❌ |
| `NOT_FOUND` | 404 | Resource not found | ❌ |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests — check `retryAfter` | ✅ |
| `PAYMENT_REQUIRED` | 402 | FREE tier exceeded — buy credits (see c402) | ✅ |
| `QUOTA_EXCEEDED` | 429 | Daily subscription limit reached | ✅ |
| `BAD_REQUEST` | 400 | Invalid input — check the error message | ❌ |
| `VALIDATION_ERROR` | 400 | Zod schema validation failed | ❌ |
| `INTERNAL_ERROR` | 500 | Server error — contact support | ❌ |
| `SERVICE_UNAVAILABLE` | 503 | Upstream provider down — retry later | ✅ |

**Agent tip:** Use `recoverable` to decide whether to retry. Use `retryAfter` (seconds) for backoff.

---

## Pagination

Endpoints that return lists support cursor-based pagination:

```bash
curl "https://xpequi.xyz/api/v1/properties?city=ibague&limit=20&page=1"
```

Parameters: `limit` (max 100, default 20), `page` (1-indexed, default 1).

The response includes a `meta` object with pagination info where available.

---

## Response Format

All API responses follow a consistent structure:

```
✅ Success:
{
  "data": { ... },        // The requested resource or list
  "meta": {                // Optional pagination metadata
    "total": 150,
    "page": 1,
    "limit": 20,
    "pages": 8
  }
}

❌ Error:
{
  "error": "Human-readable message",
  "code": "ERROR_CODE",
  "recoverable": true|false,
  "suggestedAction": "What the user should do",
  "retryAfter": 30,        // seconds (only for 429)
  "requestId": "req_abc"   // for support
}
```

---

## Rate Limits & c402 Protocol

| Tier | Price | Limits | Buy |
|------|-------|--------|-----|
| **FREE** | $0/mes | 30 req/min · 150 req/day | — |
| **PREPAGO (c402)** | Desde $2,500 COP | 50/200/1000 prepaid calls | [`/precios`](https://xpequi.xyz/precios) |
| **AGENTE API** | $30K COP/mes | 100 req/min · 1,000 req/day | [`/precios`](https://xpequi.xyz/precios) |
| **CONJUNTO API** | $150K COP/mes | 300 req/min · 5,000 req/day | [`/precios`](https://xpequi.xyz/precios) |
| **ENTERPRISE** | Custom | Custom | [Contacto](mailto:contact@xpequi.xyz) |

Pequi implements the **c402 Protocol** — a Colombian-first HTTP 402 Payment Required pattern:

1. **FREE tier** gets 30 req/min, 150 req/day — no API key needed for GET endpoints
2. When exceeded → `HTTP 402 Payment Required` with `X-402-Challenge` header
3. The challenge contains a Wompi checkout URL (PSE, Nequi, Daviplata, credit card)
4. After payment, credits auto-activate — retry with your API key

**Security model:** SHA-256 webhook verification · UUID v4 single-use nonces · Atomic Redis credit deduction · 24h idempotency guard · **Zero crypto** (no blockchain, no wallets, no RSA)

**Buy without an API key:**
1. Go to [`/precios`](https://xpequi.xyz/precios)
2. Click "COMPRAR →" on your tier
3. Sign in with Clerk (Google, email, magic link)
4. Pay via Wompi — credits/tier activate automatically

```json
// HTTP 402 Response Example
{
  "error": "payment_required",
  "message": "Has excedido tu límite gratuito. Paga por más llamadas API.",
  "code": "PAYMENT_REQUIRED",
  "recoverable": true,
  "suggestedAction": "Compra créditos prepago o suscríbete en https://xpequi.xyz/precios",
  "c402": {
    "nonce": "550e8400-...",
    "amount": 2500,
    "currency": "COP",
    "calls": 50,
    "paymentUrl": "https://checkout.wompi.co/p/?",
    "expiresAt": "2026-05-15T22:00:00Z"
  }
}
```

Full protocol details: [c402 — pagos agénticos sin crypto](https://xpequi.xyz/blog/c402-pagos-ia-colombia)

---

## MCP Server

[Join the MCP Directory](https://mcp.so) | [Smithery](https://smithery.ai) | [Mintlify](https://mintlify.com)

Add to `claude_desktop_config.json`:

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

### Available MCP Tools (7)

| Tool | Description |
|------|-------------|
| `search_properties` | Search properties with filters (city, type, price, estrato, bedrooms) |
| `get_barrios` | Get neighborhoods with estrato and GIS coordinates |
| `get_benchmarks` | Reference prices per m² by neighborhood |
| `geocode` | Geocode Colombian addresses |
| `get_uvr` | Current UVR from Banco de la República |
| `get_ipc` | Annual IPC inflation for Ley 820 adjustments |
| `calculate_rent_increase` | Calculate legal rent increase |

---

## AI Agent Integration

Available inside every major AI assistant and coding agent:

| Agent | How to Connect | Install |
|-------|---------------|---------|
| **Claude Desktop** | MCP Server | `npx -y @MCPVOT/mcp-server` |
| **Claude Code** | MCP config | [`docs/claude-code-integration.md`](docs/claude-code-integration.md) |
| **Cursor** | MCP Server | `npx -y @MCPVOT/mcp-server` |
| **VS Code Copilot** | MCP Server | `npx -y @MCPVOT/mcp-server` |
| **ChatGPT** | Custom GPT Action | [`docs/api/custom-gpt/gpt-action.json`](docs/api/custom-gpt/gpt-action.json) |
| **Perplexity** | MCP Server | `npx -y @MCPVOT/mcp-server` |
| **Z.AI (GLM-5.1)** | MCP Server | `npx -y robertcprice/glm-mcp-server` |
| **Qwen 3.6 Plus** | MCP Server | `npx -y @iflow-mcp/gy920-qwen-mcp-tool` |
| **OpenRouter** | MCP Server | `npx -y @stabgan/openrouter-mcp-multimodal` |
| **OpenCode** | Plugin | `opencode plugin install @MCPVOT/opencode-pequi-plugin` |
| **Ollama** | Custom Tool | [`packages/ollama-tool/pequi_tool.py`](packages/ollama-tool/pequi_tool.py) |
| **OpenClaw** | Gateway Plugin | [`packages/openclaw-plugin/pequi-gateway.js`](packages/openclaw-plugin/pequi-gateway.js) |

All agents use the same `/api/v1/` endpoints. No API key needed for FREE tier (30 req/min).

---

## Support

- **Interactive Docs:** [xpequi.xyz/developers](https://xpequi.xyz/developers) — Swagger UI playground
- **AI Agents Guide:** [xpequi.xyz/developers/agents](https://xpequi.xyz/developers/agents) — MCP setup & best practices
- **Developer Portal:** [xpequi.xyz/developers](https://xpequi.xyz/developers) — API keys, usage, monitoring
- **Email:** [contact@xpequi.xyz](mailto:contact@xpequi.xyz)
- **Blog:** [xpequi.xyz/blog](https://xpequi.xyz/blog) — Ley 820 guides, Open Finance, c402 protocol
- **Status:** [xpequi.xyz/api/health](https://xpequi.xyz/api/health) — Live API status

---

## License

MIT © Pequi — Built for Colombia's real estate ecosystem 🇨🇴
