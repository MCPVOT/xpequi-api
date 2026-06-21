# Loop Engineer Setup for Pequi

Based on: https://github.com/JayZeeDesign/loop-engineer-template
Adapted for: Pequi AI Real Estate Platform (xpequi.xyz)

## What is Loop Engineering?

**Loop Engineer** = designing systems where agents:
1. **Notice** something worth working on
2. **Investigate** it
3. **Take action**
4. **Record** what happened
5. **Verify** whether it worked
6. **Use that result** to decide what to do next

**Not** just prompting agents manually. It's building a self-improving system.

## Two-Layer Architecture

```
┌─────────────────────────────────────────────┐
│           OUTER LOOP (Loop Engineer)        │
│  - What triggers the agent                  │
│  - State preserved across sessions          │
│  - How loops share information              │
│  - How outcomes are monitored              │
 - How the system gets better over time        │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│            INNER LOOP (Agent Runtime)       │
│  - Given task → complete it reliably        │
│  - Context, skills, tools, decomposition    │
│  - Claude Code, Codex, Hermes agents        │
└─────────────────────────────────────────────┘
```

## Pequi's Loop Domains

| Loop | Trigger | Cadence | Output Artifacts |
|------|---------|---------|------------------|
| **Support** | New Intercom/email tickets | Hourly | `/tickets`, `/signals` (friction themes) |
| **SEO** | Keyword gaps, traffic drops | Daily | `/signals` (content gaps), `/tasks` (pages to create) |
| **Product-Growth** | Analytics events, signal correlations | 6h | `/signals` (conversion gaps), `/tasks` (feature work) |
| **Security** | Vuln scans, dependency alerts | Daily | `/tickets` (CVEs), `/tasks` (patches) |
| **Database** | Slow queries, migration needs | 12h | `/signals` (perf issues), `/tasks` (indexes) |
| **Deploy** | Git pushes, health checks | Per-push | `/tasks` (deploy status), `LOGS.md` |

## Artifact Structure

```
/loop-engineer/
├── artifacts/
│   ├── signals/      # Structured friction/opportunity observations
│   ├── tickets/      # One per conversation/issue
│   ├── tasks/        # Engineering work items
│   └── docs/         # Synthesized knowledge
├── loops/
│   ├── support/
│   │   ├── README.md      # Loop contract
│   │   └── LOG.md         # Run history
│   ├── seo/
│   ├── product-growth/
│   ├── security/
│   └── database/
├── templates/
│   ├── signal.md
│   ├── ticket.md
│   └── task.md
└── LOGS.md              # Global cross-domain log
```

## Quick Start

```bash
# 1. Read the contract for a loop
cat loop-engineer/loops/support/README.md

# 2. Run a loop manually (Hermes cron or CLI)
hermes cron create --name "support-triage" \
  --schedule "hourly" \
  --prompt "Pull tickets from past hour. Triage per support-loop contract." \
  --skill "support-triage"

# 3. Check artifacts after run
ls loop-engineer/artifacts/signals/
ls loop-engineer/artifacts/tickets/
```