# Pequi API — System Architecture

> **Version:** 0.3.2 | **Updated:** 2026-05-17
> **Purpose:** Full system context for contributors, AI agents, and advanced integrators.

---

## 1. Repository Structure

```
xpequi-api/
├── README.md                 # Public-facing API documentation (primary entry point)
├── SYSTEM.md                 # THIS FILE — full system architecture
├── CHANGELOG.md              # Release history (Keep a Changelog format)
├── mcp.json                  # MCP directory registration (mcp.so, smithery.ai, mintlify)
├── package.json              # Root workspace config (version 0.3.1)
├── opencode.json             # OpenCode AI agent config
├── .github/workflows/        # CI pipelines (typecheck, build, test)
├── .well-known/              # Well-known URLs for federation
│
├── packages/
│   ├── api-client/           # TypeScript SDK (pequi-api-client)
│   │   ├── src/index.ts      # 31 methods, PequiApiError, full types
│   │   ├── package.json      # v0.3.1
│   │   └── tsconfig.json
│   │
│   ├── mcp-server/           # MCP server (pequi-mcp-server)
│   │   ├── src/index.ts      # 10 MCP tools
│   │   ├── package.json
│   │   └── examples/         # Usage examples for Claude/Cursor/Copilot
│   │
│   ├── python-sdk/           # Python SDK (pequi-api-client on PyPI)
│   │   ├── pequi_api_client/
│   │   │   ├── __init__.py   # Exports: PequiClient, PequiApiError, types
│   │   │   ├── client.py     # 16 sub-APIs, fluent design
│   │   │   └── models.py     # Typed model classes
│   │   ├── pyproject.toml
│   │   └── README.md
│   │
│   ├── ollama-tool/          # Ollama custom tool
│   ├── openclaw-plugin/      # OpenClaw gateway plugin
│   └── opencode-pequi-plugin/ # OpenCode AI plugin
│
└── docs/
    ├── claude-code-integration.md  # Claude Code MCP setup guide
    └── api/
        └── custom-gpt/
            └── gpt-action.json     # OpenAI Custom GPT action schema
```

---

## 2. Backend Architecture

The Pequi API is served by the **pequi** monorepo (`github.com/MCPVOT/pequi`), a Next.js 16.2.6 application on Vercel Edge. This SDK repo provides the public-facing interface.

### 2.1 Stack

| Layer | Technology |
|-------|-----------|
| API Framework | Next.js 16.2.6 (App Router) |
| Runtime | Vercel Edge (serverless) |
| Language | TypeScript 5.x |
| Database | Neon PostgreSQL + Prisma 6.x (29 models) |
| Cache | Upstash Redis (rate limits, AI cache, sessions, idempotency) |
| Auth | Clerk 6.x (user auth) + Bearer tokens (API key auth) |
| Payments | Wompi Production (Web Checkout, SHA-256 signed) |
| AI | DeepSeek V4 Flash → Ring-2.6-1T → Groq Llama 4 Scout → OpenRouter |
| Fintech | Prometeo (bank verification) + BanRep MCP (UVR/IPC) |
| Storage | Vercel Blob (images) + IPFS/Pinata (contract hashes) |

### 2.2 API Design Principles

```
✅ RESTful — resources map to URL paths (/api/v1/properties)
✅ Stateless — auth via Bearer token, no session cookies
✅ Versioned — all endpoints under /api/v1/
✅ Consistent errors — standardized envelope with code/recoverable/retryAfter
✅ Idempotent — POST /api/v1/avm/bulk supports x-idempotency-key header
✅ Atomic — Redis DECR for credit deduction (no race conditions)
✅ Auditable — every request has X-Request-ID for tracing
```

### 2.3 Request Lifecycle

```
Client Request
  → proxy.ts (Next.js 16.2 middleware)
    → Clerk auth check (user routes)
    → Security headers (CORS, CSP, HSTS)
    → X-Request-ID generation
  → API Route Handler
    → authenticateApiKey() — Bearer token → SHA-256 lookup
    → checkV1Api() — auth + rate limit + c402 (if applicable)
      → getApiTier() — Redis subscription override
      → checkDailyLimit() — Redis INCR+EXPIRE per API key
      → rateLimit() — Redis INCR+EXPIRE per-minute
      → checkC402() — prepaid credit deduction or HTTP 402
    → Business logic (Prisma queries, external APIs)
    → Standardized response envelope
```

### 2.4 Rate Limiting (Redis-Backed)

| Tier | Per-Minute | Per-Day | Mechanism |
|------|-----------|---------|-----------|
| FREE (no key) | 30 | 150 | Global bucket (rl:minute:public / rl:day:public) |
| FREE (with key) | 30 | 150 | Per-key bucket (rl:minute:{keyId} / rl:day:{keyId}) |
| PREPAGO | Unlimited | Unlimited | Credit deduction per call |
| AGENTE | 100 | 1,000 | Per-key bucket + subscription override |
| CONJUNTO | 300 | 5,000 | Per-key bucket + subscription override |
| ENTERPRISE | 1,000 | Custom | Custom configuration |

Keys use `INCR` + `EXPIRE` pattern (60s TTL for minute, 86400s for day). In-memory fallback during Redis downtime.

---

## 3. SDK Architecture

### 3.1 TypeScript SDK (`pequi-api-client`)

**File:** `packages/api-client/src/index.ts`
**Version:** 0.3.1
**Methods:** 31

```typescript
class PequiClient {
  // Construction
  constructor(options?: { baseUrl?: string; apiKey?: string })

  // Internal — unified request pipeline
  private request<T>(method, path, body?, opts?): Promise<T>
  private get<T>(path, params?): Promise<T>
  private post<T>(path, body?, headers?): Promise<T>
  private del<T>(path): Promise<T>
  private upload<T>(path, formData): Promise<T>

  // Public API — 31 methods across 11 domains
  searchProperties(params?)      // GET /properties
  getBarrios(city?)              // GET /barrios
  getBenchmarks(params?)         // GET /benchmarks
  geocode(address)               // GET /geocode
  getAVM(params)                 // POST /avm
  getAVMBulk(properties, key?)   // POST /avm/bulk
  getUVR()                       // GET /uvr
  getIPC()                       // GET /ipc
  calculateRentIncrease(params)  // POST /rent-increase
  generateContract(params)       // POST /contracts
  createPayment(params)          // POST /payments
  getPaymentStatus(id)           // GET /payments/{id}
  getCredits()                   // GET /credits
  purchaseCredits(calls)         // POST /credits/purchase
  getSubscriptionCheckout(tier)  // POST /subscriptions/api-checkout
  getComplex(slug)               // GET /complexes/{slug}
  listComplexes()                // GET /complexes
  getComplexUnits(slug)          // GET /complexes/{slug}/units
  scheduleVisit(id, date, time)  // POST /visits
  listMyVisits()                 // GET /visits/mine
  sendMessage(msg, sessId?)      // POST /chat
  uploadFile(file, name?)        // POST /upload (multipart)
  verifyBankAccount(params)      // POST /bank-verification
  getUsage()                     // GET /monitoring/usage
  getLatency(quantile?)          // GET /monitoring/latency
  getErrors()                    // GET /monitoring/errors
  getUptime(window?)             // GET /monitoring/uptime
  listWebhooks()                 // GET /webhooks/endpoints
  createWebhook(url, events)     // POST /webhooks/endpoints
  deleteWebhook(id)              // DELETE /webhooks/endpoints/{id}
  testWebhook(id)                // POST /webhooks/endpoints/{id}/test
}
```

**Error handling:**

```typescript
class PequiApiError extends Error {
  status: number        // HTTP status code (400, 401, 402, 429, 500, etc.)
  code: string          // Machine-readable error code (INVALID_API_KEY, etc.)
  message: string       // Human-readable error message in Spanish
  recoverable: boolean  // Whether retrying may succeed
  retryAfter?: number   // Seconds to wait (only for rate limit errors)
  requestId?: string    // Trace ID for support
  details?: Record      // Full response body for debugging
}
```

### 3.2 Python SDK (`pequi-api-client`)

**File:** `packages/python-sdk/pequi_api_client/client.py`
**Version:** 0.3.1
**Sub-APIs:** 16

```python
class PequiClient:
    # Sub-APIs (fluent design)
    client.properties      # _PropertiesAPI
    client.barrios         # _BarriosAPI
    client.benchmarks      # _BenchmarksAPI
    client.geocode         # _GeocodeAPI
    client.avm             # _AVMAPI
    client.finance         # _FinanceAPI (UVR, IPC, rent-increase)
    client.credits         # _CreditsAPI (balance, purchase, subscription)
    client.contracts       # _ContractsAPI
    client.payments        # _PaymentsAPI
    client.complexes       # _ComplexesAPI
    client.visits          # _VisitsAPI
    client.chat            # _ChatAPI
    client.upload          # _UploadAPI
    client.bank_verification # _BankVerificationAPI
    client.monitoring      # _MonitoringAPI (usage, latency, errors, uptime)
    client.webhooks        # _WebhooksAPI
```

**Dependencies:** Zero external dependencies. Uses only `urllib.request` from stdlib.
**Transport:** `urllib.request.Request` with custom multipart form encoding for file uploads.

---

## 4. Data Flow Diagrams

### 4.1 Property Search Flow

```
Client                          API Gateway                        Database
  │                                │                                  │
  │  GET /api/v1/properties        │                                  │
  │  ?city=ibague&limit=5         │                                  │
  │──────────────────────────────>│                                  │
  │                                │                                  │
  │                                │  authenticateApiKey()            │
  │                                │  (no key → public FREE tier)     │
  │                                │─────────────────────────────────>│
  │                                │                                  │
  │                                │  checkV1Api()                    │
  │                                │  ├── getApiTier() → Redis        │
  │                                │  ├── checkDailyLimit() → Redis   │
  │                                │  └── rateLimit() → Redis         │
  │                                │                                  │
  │                                │  Prisma: property.findMany()     │
  │                                │─────────────────────────────────>│
  │                                │         results                  │
  │                                │<─────────────────────────────────│
  │                                │                                  │
  │  { data: [...], meta: {...} }  │                                  │
  │<──────────────────────────────│                                  │
```

### 4.2 c402 Payment Flow

```
Client                        API Gateway                   Redis           Wompi
  │                              │                           │               │
  │  POST /api/v1/avm            │                           │               │
  │  (FREE tier, rate limited)   │                           │               │
  │─────────────────────────────>│                           │               │
  │                              │  checkV1Api()             │               │
  │                              │  → rate limit exceeded    │               │
  │                              │  → checkC402()            │               │
  │                              │  → getCreditBalance()     │               │
  │                              │──────────────────────────>│               │
  │                              │  balance: 0               │               │
  │                              │<──────────────────────────│               │
  │                              │                           │               │
  │                              │  createChallenge()         │               │
  │                              │  (UUID nonce, amount)     │               │
  │                              │──────────────────────────>│               │
  │                              │  challenge stored          │               │
  │                              │<──────────────────────────│               │
  │                              │                           │               │
  │  HTTP 402 Payment Required   │                           │               │
  │  X-402-Challenge: {...}      │                           │               │
  │<─────────────────────────────│                           │               │
  │                              │                           │               │
  │  User opens checkout URL     │                           │               │
  │──────────────────────────────────────────────────────────────────────>│
  │                              │                           │               │
  │                              │  POST /api/webhooks/wompi │               │
  │                              │  (SHA-256 + nonce)        │               │
  │                              │<──────────────────────────│──────────────│
  │                              │                           │               │
  │                              │  verifyChecksum()          │               │
  │                              │  markAsPaid()              │               │
  │                              │──────────────────────────>│               │
  │                              │  addCredits()              │               │
  │                              │──────────────────────────>│               │
  │                              │                           │               │
  │  POST /api/v1/avm (retry)   │                           │               │
  │  Authorization: Bearer ...  │                           │               │
  │─────────────────────────────>│                           │               │
  │                              │  deductCredit() → balance>│               │
  │                              │  → AVM result             │               │
  │  200 OK + AVM data           │                           │               │
  │<─────────────────────────────│                           │               │
```

---

## 5. Security Model

### 5.1 API Key Security

```
Creation:  pk_live_{random} generated server-side
Storage:   SHA-256(api_key) stored in PostgreSQL (never plaintext)
Transport: Bearer token in Authorization header (HTTPS only)
Lookup:    SHA-256(provided_key) → match against DB hash
Scope:     Per-key tier (FREE/AGENTE/CONJUNTO/ENTERPRISE) + scopes array
```

### 5.2 Webhook Security

Webhook payloads are signed with HMAC-SHA256 using the endpoint's secret key. Verify signatures server-side with `timingSafeEqual`.

### 5.3 c402 Protocol Security

| Property | Mechanism |
|----------|-----------|
| Nonce uniqueness | `crypto.randomUUID()` + Redis `SET NX EX 1800` |
| Payment verification | Wompi webhook SHA-256 + `timingSafeEqual` |
| Double-spend prevention | Redis `paid:{paymentId}` EX 86400 |
| Credit atomicity | Redis `DECR` is atomic + check result >= 0 |
| API key binding | Payment tied to SHA-256 hashed API key ID |
| No PII exposure | Only public/anonymized data sold — no names, CCs, emails |

---

## 6. Rate Limiter Implementation

Located in `lib/middleware/rate-limit.ts` (pequi monorepo).

```
Per-minute key:   rl:minute:{identifier}   TTL: 60s
Per-day key:      rl:day:{identifier}       TTL: 86400s

Algorithm:
  1. INCR key
  2. If result == 1 → EXPIRE key, ttl
  3. If result > limit → reject (429 or 402)
  4. Else → allow

Fallback: In-memory Map if Redis unavailable (same-instance only)
```

---

## 7. Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `UPSTASH_REDIS_REST_URL` | Redis endpoint (rate limits, cache, c402) | Yes |
| `UPSTASH_REDIS_REST_TOKEN` | Redis auth token | Yes |
| `WOMPI_PUBLIC_KEY` | Wompi checkout integration | Yes (for c402) |
| `WOMPI_EVENTS_SECRET` | Webhook signature verification | Yes (for payments) |
| `NEXT_PUBLIC_APP_URL` | App URL for redirects | Yes |
## 8. Loop Engineer — Autonomous Agent System

Published Loop Library: https://signals.forwardfuture.ai/loop-library/ (44 published loops)

### Concept
Loop Engineering = designing nested agent systems with two layers:
1. **Inner loop (agent loop)** — helps an agent complete a given task well
2. **Outer loop (decision loop)** — decides what should happen next, preserves state across sessions, shares information between loops, monitors outcomes, improves over time

Loops **compound** by reading/writing shared artifacts across domains.
### Deployed Cron Jobs (Hermes Agent on Droplet)
| Job | Schedule | Skills | Workdir |
| support-triage | every 1h | support-triage, seo-research, analytics-analysis | /opt/xpequi-api |
| seo-research | every 1d | seo-research | /opt/xpequi-api |
| analytics-analysis | every 6h | analytics-analysis | /opt/xpequi-api |
| security-audit | every 1d | security-audit | /opt/xpequi-api |
| postgres-analysis | every 12h | postgres-analysis | /opt/xpequi-api |
| pequi-health-monitor | every 6h | no-agent script | /opt/pequi |
| pequi-user-cleanup | 0 3 * * * | none | /opt/pequi |
| pequi-health-monitor | every 6h | no-agent script |
| pequi-user-cleanup | 0 3 * * * | none |
### Loop Contracts
- loops/support/README.md - Support inbox triage
- loops/seo/README.md - SEO keyword gaps, content tasks
- loops/product-growth/README.md - Cross-loop signal correlation
- loops/security/README.md - CVE scan, auth anomaly detection
- loops/database/README.md - Slow query analysis, index health
 
### Artifact System
- artifacts/signals/ - Structured observations
- artifacts/tickets/ - Bug reports / support conversations
- artifacts/tasks/ - Engineering work items
- artifacts/docs/ - Durable knowledge
 
### Self-Verifying Loop Architecture
PLAN (Opus 4.8) EXECUTE (Kimi K2.6 swarm) VERIFY (Opus 4.8) LOOP until clean
 
Test run: 100 EV-market companies, 5 live feeds, 3 verify passes, 0 errors final
Source: https://github.com/JayZeeDesign/loop-engineer-template
 
### Adopted Published Loops from Library
| Loop | Number | Schedule |
|------|--------|----------|
| Recent-feedback sweep | 031 | every 1h |
| SEO/GEO visibility loop | 006 | every 1d |
| Production error sweep | 004 | every 6h |
| Ticket-to-PR-ready loop | 016 | on-demand |
| Post-release baseline loop | 015 | after deploy |
 
### Research Docs
- self-verifying-loop.md - Full architecture doc
- self-verifying-loop.json - Structured JSON
- loop-engineer-overview.md - Concept + Pequi application
- research-report.md - Live research from OpenRouter, GitHub
- LOGS.md - Cross-domain work log
 
### Key Finding
Audit discovered 10 unverified users (45 percent of 22 total). June 12 had 6 signups with 0 verified (100 percent drop). SMTP on Vercel, all 7 auth endpoints work. Signal created and resolved.


---


## 9. Distribution & IPFS Security

### Multi-Channel Publishing

Pequi API publishes to 5 channels for zero single-point-of-failure:

| Channel | Command | Security |
|---------|---------|----------|
| npmjs.com | npm publish | Public registry, no org needed |
| JSR (jsr.io) | npx jsr publish | Open-source backup registry |
| Docker (GHCR) | docker push | Containerized distribution |
| IPFS | ipfs add + pin | Decentralized, no registry dependency |
| GitHub Releases | git tag + push | Last-resort fallback |

### IPFS Security Audit

The droplet runs an IPFS daemon (kubo 0.32.0) for contract CID pinning.
Security posture:

| Port | Bind | UFW | Risk |
|------|------|-----|------|
| 4001 (swarm) | 0.0.0.0 | Blocked | Low - libp2p relay hides real IP |
| 5001 (API) | 127.0.0.1 | Blocked | None - localhost only |
| 8080 (gateway) | 127.0.0.1 | Blocked | None - localhost only |

**Verdict:** Using IPFS from the droplet for MCP distribution is SAFE.
- The droplet never serves HTTP traffic for IPFS directly
- Users access pinned content via public IPFS gateways (ipfs.io, cloudflare-ipfs.com)
- The droplet real IP does not appear in IPFS peer addresses
- All admin ports are localhost-only + UFW-blocked externally

## 10. Version History

| Version | Date | Key Changes |
|---------|------|-------------|
| 0.3.2 | 2026-05-15 | SDK complete rewrite (31 methods, PequiApiError, version sync) |
| 0.3.1 | 2026-05-15 | README audit (10 fixes), c402 docs, pricing table |
| 0.3.0 | 2026-05-15 | AVM endpoints, Bogotá data, 13 AI agent connectors |
| 0.2.0 | 2026-05-12 | Monitoring, webhooks, SDK expansion, Swagger UI |
| 0.1.0 | 2026-05-08 | Initial release: 10 endpoints, TS + Python SDK, MCP server |
