# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.3.x   | ✅ Active |
| 0.2.x   | ❌ Deprecated |
| 0.1.x   | ❌ Deprecated |

## Reporting a Vulnerability

**Do NOT open a public issue.** Report to contact@xpequi.xyz.

Response time: within 48 hours. We follow coordinated disclosure.

## Security Model

### API Keys
- Keys are SHA-256 hashed at rest (never stored in plaintext)
- Only the key prefix (first 12 chars) is shown after creation
- Keys are scoped to specific tiers (FREE/AGENTE/CONJUNTO/ENTERPRISE)
- Revocation takes effect immediately

### c402 Protocol
- SHA-256 webhook verification (not HMAC — intentional design choice for Wompi)
- UUID v4 single-use nonces via Redis `SET NX EX`
- Idempotency: Redis `paid:{paymentId}` EX 86400
- No PII in credit transactions — only public/anonymized data sold

### Transport
- HTTPS only (TLS 1.2+ enforced at CDN)
- Bearer tokens in `Authorization` header
- CORS restricted to known origins
- HSTS: max-age=63072000 includeSubDomains preload

### Rate Limiting
- Redis-backed atomic INCR + EXPIRE
- Tiered limits: FREE 30/min, AGENTE 100/min, CONJUNTO 300/min
- In-memory fallback during Redis outage

## Known Limitations

- No federated auth (OAuth/OIDC) — Bearer tokens only
- No API key rotation via SDK (manual via Developer Portal)
- Webhook signatures use HMAC-SHA256 (consider upgrading to Ed25519)
- Message chat is not E2E encrypted (server-side decryption required for AI processing)

## Dependency Scanning

```bash
npm audit
```
We review critical/high findings within 7 days of disclosure.
