# Changelog

All notable changes to the Pequi API platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- Complete OpenAPI 3.0.3 spec (`docs/api/openapi.yaml`) — 31 v1 endpoints with
  full request/response schemas, 12 component schemas, auth & rate limit docs
- Endpoint count corrected: 18 → 31 in README and badges

## [0.3.2] — 2026-05-15

### Added
- TypeScript SDK: 12 new methods — AVM, AVM bulk, UVR, IPC, rent-increase,
  credits balance, credit purchase, subscription checkout, usage monitoring,
  bank verification, webhook delete, webhook test
- TypeScript SDK: `PequiApiError` class with structured error fields (code,
  recoverable, retryAfter, requestId) — parses standardized API error envelope
- TypeScript SDK: `_del()` helper for DELETE requests (was using raw fetch)
- Python SDK: 6 new sub-APIs — `client.avm`, `client.finance` (UVR/IPC/rent),
  `client.credits` (balance/purchase/subscription), `client.bank_verification`,
  `client.monitoring` (usage/latency/errors/uptime), `client.webhooks`
- Python SDK: `PequiApiError` exception class with structured fields
- Python SDK: `_delete()` method and `session_id` on chat.send()

### Changed
- TypeScript SDK: API client `0.1.0` → `0.3.1` (synced with root)
- TypeScript SDK: Unified `_request()` base method replacing get/post/postForm/del
- Python SDK: Unified `_request()` base method with proper HTTP method support
- README endpoint table now covers all 28 API endpoints

## [0.3.1] — 2026-05-15

### Fixed
- README: Added note that npm packages are pending publication (GitHub billing block)
- README: Expanded endpoint table from 16 to 24 entries (added AVM, UVR, IPC, rent-increase, credits, subscriptions, monitoring/usage, webhooks, bank-verification)
- README: Added `PAYMENT_REQUIRED` error code to docs
- README: Added full 402 response JSON example for AI agents
- README: Added MCP tools table listing all 7 available tools
- README: Added Clerk-authed purchase flow info (no API key needed to buy)
- README: Added "Sin API key para GET públicos" note to pricing section
- README: Fixed c402 spec link — now links to public blog post instead of private repo
- README: Pricing table now includes "Compra" column with direct links
- `package.json`: version synced to 0.3.1 (was 0.1.0)

### Added
- Subscription tiers (AGENTE API $30K/mo, CONJUNTO API $150K/mo) documented in c402 section

## [0.3.0] — 2026-05-15

## [0.2.0] — 2026-05-12

### Added
- AVM endpoint (`POST /api/v1/avm`) with heuristic estimation, comparable properties, and bulk valuation
- AVM bulk endpoint (`POST /api/v1/avm/bulk`) with idempotency support
- Bogotá data integration (212 barrios across all 20 localities)
- 13 AI agent connectors (Claude Desktop, Claude Code, Cursor, GitHub Copilot, ChatGPT, Perplexity, Z.AI, Qwen, OpenRouter, OpenCode, Ollama, OpenClaw, Hermes)
- Outbound webhooks with HMAC-SHA256 signing, 6 event types, 5 retries (exponential backoff)
- Custom GPT action for OpenAI ChatGPT
- Z.AI (GLM-5.1), Qwen (3.6 Plus), and OpenRouter MCP server documentation
- MCP directory registration (`mcp.json` for mcp.so, smithery.ai, mintlify)
- Response schemas (Property, Barrio, Error) in OpenAPI spec
- Leasing inmobiliario contract template (Ley 1229 de 2008) and generic OTRO skeleton
- Ring-2.6-1T provider in AI orchestrator chain with 50 req/day rate-limit guard
- AVM admin metrics dashboard (`GET /api/admin/avm/metrics`)
- GitHub Actions CI workflow (typecheck, build SDK, build Python)
- Developer portal: webhook management UI, model providers table, contact email

### Changed
- Expanded TypeScript SDK from 10 to 21 methods (visits, chat, upload, monitoring, webhooks)
- Lowered FREE tier chat rate limit to 5/min to protect AI budget
- Developer portal guides expanded with authentication, error handling, SDK examples
- Swagger UI added at `/developers/api-ref` with full cyberpunk theme

### Fixed
- Husky pre-commit hook now runs tsc on staged files
- Replaced hardcoded `#ef4444` with `var(--error)` across all files
- Wompi webhook amount cross-check and Redis idempotency guard

## [0.1.0] — 2026-05-08

### Added
- Initial v1 API endpoints: properties, barrios, benchmarks, geocode, contracts, payments, complexes
- API key authentication (Bearer → SHA-256 → scope check → tier-based limits)
- Per-key Redis rate limiting (FREE: 30/min, AGENTE: 100/min, CONJUNTO: 300/min)
- Usage metering with Redis counters and hourly cron flush to DB
- TypeScript SDK (`pequi-api-client` on npm) with 10 initial methods
- MCP server (`pequi-mcp-server` on npm) for Claude Desktop, Cursor, VS Code Copilot
- Developer portal at `xpequi.xyz/developers` with key management, usage charts, code examples
- OpenAPI 3.0 spec with `operationId` on all endpoints
- Swagger UI interactive playground
- Python SDK (`pequi-api-client` on PyPI) with fluent `PequiClient` wrapper
- Ollama custom tool (`packages/ollama-tool/pequi_tool.py`)
- OpenClaw gateway plugin (`packages/openclaw-plugin/pequi-gateway.js`)
- OpenCode plugin package (`packages/opencode-pequi-plugin/`)
- Claude Code MCP integration documentation
- Hermes Agent skill for autonomous overnight planning
- API documentation at `xpequi.xyz/developers/guides` with 8 sections
- Contact email (`contact@xpequi.xyz`) in footer, developer portal, and docs
- Version badge `V1.14.0` in footer across all pages
