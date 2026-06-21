---
kind: domain
domain: security
status: active
goal: Detect vulnerabilities, dependency issues, auth anomalies; create patch tasks
cadence: Daily
tags: [security, infra]
---

# Security — Vulnerability & Auth Loop

This domain monitors for security issues and creates remediation tasks.

## Outputs
- CVE/vuln findings → `/artifacts/tickets` (type: security)
- Patch tasks → `/artifacts/tasks` (type: security-patch)
- Auth anomaly signals → `/artifacts/signals` (type: auth-anomaly)
- Run history → this file's `## Timeline`

## Trigger
Runs daily at 03:00 UTC.

**Prompt:**
> Run npm audit, check GitHub Dependabot alerts, scan Vercel logs for 401/403 spikes, check auth logs for brute force. Create tickets for CVEs > medium. Create tasks for dependency updates. Create auth-anomaly signals for suspicious patterns.

## Workflow
1. `npm audit --json` → parse for high/critical
2. Check GitHub: `gh api repos/MCPVOT/pequi/dependabot/alerts`
3. Vercel logs: grep for 401, 403, rate-limit-exceeded (last 24h)
4. Droplet: `journalctl -u postgresql -u redis --since "24 hours ago" | grep -i fail`
5. For each CVE > medium: create ticket + task
6. For auth spikes (>50 401s/hour from same IP): create auth-anomaly signal
7. For dependency updates needed: create task with `npm update <pkg>` command
8. Add timeline entry

## Pequi-Specific Checks
- SendGrid sender verification status
- Wompi webhook signature validation
- Clerk/Auth session token rotation
- API key rotation (check `ApiKey.lastUsedAt` > 90d)

## Timeline
- 2026-06-20: Loop contract created. Ready for first run.