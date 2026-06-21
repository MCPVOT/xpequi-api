---
kind: domain
domain: support
status: active
goal: Triage support inbox, reply or escalate, surface product/growth signals
cadence: Hourly
tags: [support, domain]
---

# Support — Inbox Triage

This domain owns the support-triage workflow.

## Outputs (Global Artifact Stores)
- One record per conversation → `/artifacts/tickets`
- Deduplicated feedback/friction themes → `/artifacts/signals`
- Engineering bugs → `/artifacts/tasks`
- Run history → this file's `## Timeline`

## Trigger
Runs hourly.

**Prompt:**
> Pull tickets from the past hour. Triage and handle them according to the support-triage skill.

## Workflow
1. Fetch new and newly active conversations (Intercom, email, GitHub issues)
2. Review tickets that need follow-up
3. Investigate issues with available tools (DB queries, logs, Vercel)
4. Reply directly when confidence + permissions sufficient
5. Draft response when human approval required
6. Create or update ticket artifact
7. Roll recurring friction into existing signal (dedupe!)
8. Create task for clear engineering bugs
9. Add one concise line to this file's `## Timeline`

## Dedupe Rules
- Returning conversation: match external conversation ID
- Returning customer: match email
- Recurring feedback: increment frequency of existing signal
- **Never create a new signal when theme already exists**

## Tools Available
- `mcp_pequi_search_properties` — property lookups
- `mcp_pequi_geocode` — address resolution
- `terminal` — DB queries, log checks
- `web_search` — docs, external APIs

## Timeline
- 2026-06-20: Loop contract created. Ready for first run.