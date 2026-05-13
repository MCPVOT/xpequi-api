# Changelog

All notable changes to the Pequi API platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

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
- TypeScript SDK (`@MCPVOT/api-client` on npm) with 10 initial methods
- MCP server (`@MCPVOT/mcp-server` on npm) for Claude Desktop, Cursor, VS Code Copilot
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
