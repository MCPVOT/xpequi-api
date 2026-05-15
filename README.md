<p align="center">
  <a href="https://xpequi.xyz">
    <img src="https://xpequi.xyz/pequi-logo.svg" alt="Pequi" width="120" />
  </a>
</p>

<h1 align="center">Pequi API</h1>

<p align="center">
  <strong>Colombia's First Real Estate Data API</strong><br />
  <em>API pública de datos inmobiliarios — Ibagué (64 barrios) + Bogotá (212 barrios) 🅱️ BETA</em><br />
  Basado en Open Finance · <a href="https://xpequi.xyz/blog/open-finance-decreto-0368">Decreto 0368</a>
</p>

<p align="center">
  <a href="https://xpequi.xyz"><img src="https://img.shields.io/badge/xpequi.xyz-00e5ff?style=flat-square&logo=vercel&logoColor=white" alt="Website" /></a>
  <a href="https://github.com/MCPVOT/xpequi-api/packages"><img src="https://img.shields.io/badge/npm-@MCPVOT%2Fapi--client-blue?style=flat-square&logo=npm&logoColor=white" alt="npm" /></a>
  <a href="https://github.com/MCPVOT/xpequi-api/packages"><img src="https://img.shields.io/badge/npm-@MCPVOT%2Fmcp--server-purple?style=flat-square&logo=npm&logoColor=white" alt="npm MCP" /></a>
  <a href="https://www.npmjs.com/package/@MCPVOT/api-client"><img src="https://img.shields.io/npm/dw/@MCPVOT/api-client?style=flat-square&color=orange" alt="npm downloads" /></a>
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/MCP-directory-blue?style=flat-square&logo=modelcontextprotocol" alt="MCP Directory" />
  <a href="https://smithery.ai"><img src="https://img.shields.io/badge/Smithery-Pequi%20API-orange?style=flat-square" alt="Smithery" /></a>
  <img src="https://img.shields.io/badge/Open%20Finance-Decreto%200368-ff8c00?style=flat-square" alt="Open Finance" />
  <img src="https://img.shields.io/badge/c402-HTTP%20402%20Payment-00ff88?style=flat-square&logo=wompi&logoColor=white" alt="c402 Protocol" />
</p>
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
| `GET` | `/api/v1/barrios?city=ibague` | 64 barrios Ibagué |
| `GET` | `/api/v1/barrios?city=bogota` | 212 barrios Bogotá 🅱️ |
| `GET` | `/api/v1/benchmarks` | Precios de referencia por m² |
| `GET` | `/api/v1/geocode` | Dirección → coordenadas |
| `POST` | `/api/v1/contracts` | Generar contrato Ley 820 |
| `POST` | `/api/v1/payments` | Crear pago Wompi |
| `GET` | `/api/v1/payments/{id}` | Estado de pago |
| `GET` | `/api/v1/complexes` | Listar conjuntos |
| `GET` | `/api/v1/complexes/{slug}` | Detalle de conjunto |
| `GET` | `/api/v1/complexes/{slug}/units` | Unidades de conjunto |
| `POST` | `/api/v1/visits` | Agendar visita |
| `POST` | `/api/v1/chat` | Chat con IA (DeepSeek + fallbacks) |
| `POST` | `/api/v1/upload` | Subir archivo (max 5MB) |
| `GET` | `/api/v1/monitoring/latency` | Latencia P50/P95/P99 |
| `GET` | `/api/v1/monitoring/errors` | Errores 4xx/5xx por endpoint |
| `GET` | `/api/v1/monitoring/uptime` | Estadísticas de disponibilidad |

## 💰 Precios

| Tier | Precio | Límite API | Para |
|------|--------|-----------|------|
| **GRATIS** | $0/mes | 30 req/min, 150/día | Developers probando |
| **PREPAGO** (c402) | Desde $2,500 COP | 50/200/1000 calls vía Wompi | Usuarios ocasionales |
| **AGENTE API** | $30K COP/mes | 100 req/min, 1,000/día | Integradores y agentes |
| **CONJUNTO API** | $150K COP/mes | 300 req/min, 5,000/día | Conjuntos y fintechs |
| **EMPRESARIAL** | Cotizar | Personalizado | Bancos y govtech |

## 💳 c402 Protocol — HTTP 402 Payment Required

Pequi implements the **c402 Protocol** for HTTP 402 Payment Required — a Colombian-first approach to API monetization:

- **Agents:** When a FREE-tier request exceeds the rate limit and has no prepaid credits, the API returns `HTTP 402 Payment Required` with an `X-402-Challenge` header containing a Wompi checkout URL
- **Prepaid Credits:** Purchase credit packs (50/200/1000 calls) via Wompi Web Checkout (PSE, Nequi, DaviPlata, credit/debit card)
- **Security:** SHA-256 webhook verification, UUID v4 nonces (single-use via Redis), atomic credit deduction (no race conditions), 24h idempotency guard
- **Zero crypto:** No blockchain, no wallets, no RSA — only SHA-256 + Redis atomic operations
- **Data Privacy:** Only public/anonymized data is ever sold. No PII exposure.

```
GET /api/v1/properties
Authorization: Bearer pequi_key_abc123

→ HTTP 402 Payment Required
X-402-Challenge: {"nonce":"...", "amount":2500, "currency":"COP", "paymentUrl":"https://checkout.wompi.co/p/?..."}
```

**For AI Agents:** The `recoverable: true` error envelope tells agents to present the payment URL to the user. Prepaid credits avoid 402 entirely — just keep a positive balance.

See full spec: [`docs/strategy/c402-MONETIZATION.md`](https://github.com/MCPVOT/pequi/blob/master/docs/strategy/c402-MONETIZATION.md) (private repo)

## 🔗 Links

- [Dashboard Developers](https://xpequi.xyz/developers) — Documentación interactiva
- [Blog: Decreto 0368](https://xpequi.xyz/blog/open-finance-decreto-0368) — Open Finance en Colombia
- [Pequi App](https://xpequi.xyz) — Plataforma inmobiliaria con IA

## 🤖 Supported AI Agents

Pequi's API is available natively inside every major AI assistant and coding agent.

| Agent | How to Connect | Install |
|-------|---------------|---------|
| **Claude Desktop** | MCP Server | `npx -y @MCPVOT/mcp-server` |
| **Claude Code** | MCP config | Add `claude_desktop_config.json` ([docs](docs/claude-code-integration.md)) |
| **Cursor** | MCP Server | `npx -y @MCPVOT/mcp-server` |
| **VS Code Copilot** | MCP Server | `npx -y @MCPVOT/mcp-server` |
| **OpenAI ChatGPT** | Custom GPT Action | Import `docs/api/custom-gpt/gpt-action.json` into GPT config |
| **Perplexity** | MCP Server | `npx -y @MCPVOT/mcp-server` |
| **Z.AI (GLM-5.1)** | MCP Server | `npx -y robertcprice/glm-mcp-server` |
| **Qwen (3.6 Plus)** | MCP Server | `npx -y @iflow-mcp/gy920-qwen-mcp-tool` |
| **OpenRouter** | MCP Server | `npx -y @stabgan/openrouter-mcp-multimodal` |
| **OpenCode** | Plugin | `opencode plugin install @MCPVOT/opencode-pequi-plugin` |
| **Ollama** | Custom Tool | Python function in `packages/ollama-tool/pequi_tool.py` |
| **OpenClaw** | Gateway Plugin | JavaScript plugin in `packages/openclaw-plugin/pequi-gateway.js` |
| **Hermes** | Skill | Skill file on droplet — overnight autonomous planning |

All agents use the same `/api/v1/` endpoints. No API key needed for FREE tier (30 req/min general, 5 req/min chat). Chat has lower limits to protect AI costs.

## 🧠 Model Providers

Pequi's API platform works across **5 model ecosystems**, each with unique strengths:

| Provider | Models | MCP | Best For |
|----------|--------|-----|----------|
| **DeepSeek** | V4 Flash | Built-in | Default AI agent, Colombian law expertise |
| **Z.AI** | GLM-5.1 | `npx -y robertcprice/glm-mcp-server` | #1 on SWE-Bench Pro, reduces Claude Code costs up to 87% |
| **Qwen** | 3.6 Plus | `npx -y @iflow-mcp/gy920-qwen-mcp-tool` | 1M context window, 128K output tokens — largest free context |
| **Groq** | Llama 4 Scout | Built-in | High-speed inference fallback |
| **OpenRouter** | 300+ models | `npx -y @stabgan/openrouter-mcp-multimodal` | Access any model through single MCP server |

Pequi is also registered on **MCP directories**: [mcp.so](https://mcp.so), [smithery.ai](https://smithery.ai), and [mintlify](https://mintlify.com).

## 🐍 Python SDK

```bash
pip install pequi-api-client
```

```python
from pequi_api_client import PequiClient

client = PequiClient(api_key="pk_live_abc...")
properties = client.properties.search(city="ibague", limit=5)
print(properties)
```

## 🤖 Agent-Friendly Features

All API errors now return a standardized envelope that AI agents can parse deterministically:

```json
{
  "error": "Demasiadas solicitudes.",
  "code": "RATE_LIMIT_EXCEEDED",
  "recoverable": true,
  "suggestedAction": "El limite se restablecera automaticamente. Reintenta despues del tiempo indicado en Retry-After.",
  "retryAfter": 30,
  "requestId": "req_a1b_2c3"
}
```

Error codes: `INVALID_API_KEY`, `RATE_LIMIT_EXCEEDED`, `QUOTA_EXCEEDED`, `BAD_REQUEST`,
`VALIDATION_ERROR`, `INTERNAL_ERROR`, `SERVICE_UNAVAILABLE`, `NOT_FOUND`, `INSUFFICIENT_SCOPE`.

**Agent tip:** Use `recoverable` to decide whether to retry. Use `retryAfter` for backoff.

See [AI Agents Guide](https://xpequi.xyz/developers/agents) for tool selection, MCP setup, and best practices.

---

## 📄 Licencia

MIT © Pequi
