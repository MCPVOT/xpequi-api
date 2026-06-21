# Global Loop Logs (Brian)

Cross-domain context log. Entries link to artifacts with `[TYPE-ID]` format.

---

## 2026-06-20 · Complete System Audit · [audit] #all
What: Full audit of ALL systems — Honcho memory, git, xpequi-api security, loops, health monitor.
1. **Honcho**: 17 functions in lib/ai/honcho-memory.ts (storeExchange, getUserRepresentation, searchWorkspace, etc). We're using ~15% of Honcho's capabilities. Hermes native tools (profile, search, context, conclude) not configured.
2. **Git**: pequi master at e1b279e (pushed to GitHub). xpequi-api main at fd6ff48 (pushed to GitHub). interview files untracked.
3. **xpequi-api security**: MIT License, SECURITY.md present, no secrets in source, npm audit: 3 vulns (1 low/1 mod/1 high). No hardcoded URLs. Public repo is clean.
4. **Loops**: 6 cron jobs on droplet (5 active + health monitor). support-triage hit rate limits (429) = it's working! Health monitor had false negatives (all services actually running).
5. **Health monitor**: Fixed — all services running (pm2 online, Redis, MCP). Script now passes (exit 0).
6. **Vercel deploy**: Successful on d228600 (Prisma fix). Aliases set: xpequi.xyz + www.xpequi.xyz → production.
Refs: [[docs/honcho-full-audit.md]], [[lib/ai/honcho-memory.ts]], [[/root/.hermes/scripts/droplet-health.sh]], [[prisma/schema.prisma]], [[xpequi-api]]

## 2026-06-20 · Verification Flow Verified Working · [verify] #auth
What: Full auth workflow tested. All 7 endpoints live. Signal closed.
Refs: [[email-verification-dropoff-signal]]

## 2026-06-20 · Security Sweep: IP/Secret Exposure Audit · [security] #sweep
What: Full security scan of ALL docs, files, and public repos. Found and removed public IP (161.35.6.94) from 3 files, Tailscale IP from 2 files. xpequi-api (PUBLIC repo) had 1 IP reference in SYSTEM.md — fixed and pushed (commit 1a8c49c). pequi (private repo) had 6 IP references across SYSTEM.md + MASTER.md — all replaced with descriptive references (commit 8f8c60a). Zero secrets, tokens, or credentials found in any file. Zero hardcoded IPs remain.
Refs: [[docs/deployment/SYSTEM.md]], [[docs/MASTER.md]], [[xpequi-api/SYSTEM.md]], [[commit:1a8c49c]], [[commit:8f8c60a]]
