---
kind: domain
domain: product-growth
status: active
goal: Correlate signals across loops, identify conversion friction, prioritize feature work
cadence: 6h
tags: [product, growth, analytics]
---

# Product-Growth — Signal Correlation Loop

This domain reads ALL signals from support, SEO, security, and correlates them with product analytics.

## Inputs (Reads)
- `/artifacts/signals` from ALL loops
- Vercel Analytics / PostHog events
- Stripe/Wompi revenue events
- User session replays (if available)

## Outputs
- Prioritized friction signals → `/artifacts/signals` (type: conversion-friction)
- Feature/fix tasks → `/artifacts/tasks` (type: feature, bugfix)
- Run history → this file's `## Timeline`

## Trigger
Runs every 6 hours.

**Prompt:**
> Read all signals from the past 24h. Cross-reference with analytics: which friction themes correlate with drop-off? Which SEO pages have high traffic but low signup? Create conversion-friction signals. Create tasks for top 3 actionable items.

## Workflow
1. Read all signals from `/artifacts/signals` (last 24h)
2. Group by theme: search, auth, property-details, contact-agent, contracts, payment
3. For each theme, check analytics:
   - Funnel drop-off at that step
   - Session duration on related pages
   - Revenue impact (lost signups × LTV estimate)
4. Create `conversion-friction` signal per theme with:
   - Frequency across loops
   - Estimated revenue impact
   - Suggested fix (UI, backend, content)
5. Create tasks for top 3 by impact
6. Add timeline entry

## Pequi Friction Themes to Watch
| Theme | Signals | Analytics Check |
|-------|---------|-----------------|
| Property contact | support: "can't reach agent" | Click-to-call / WhatsApp CTR |
| Search results | support: "no results for X" | Search → listing CTR |
| Auth/Signup | support: "verification email not received" | Signup → verified conversion |
| Contract creation | support: "contract tool broken" | AI chat → contract generated |
| Payment | support: "Wompi failed" | Checkout → success rate |
| Mobile UX | SEO: high mobile bounce | Mobile vs desktop conversion |

## Timeline
- 2026-06-20: Loop contract created. Ready for first run.