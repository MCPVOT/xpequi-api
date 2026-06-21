---
kind: domain
domain: seo
status: active
goal: Discover keyword gaps, create high-quality pages, monitor traffic/conversion
cadence: Daily
tags: [seo, content, growth]
---

# SEO — Content & Keyword Loop

This domain owns SEO content generation and keyword monitoring.

## Outputs
- New content opportunities → `/artifacts/signals` (type: content-gap)
- Pages to create/update → `/artifacts/tasks` (type: content-page)
- Traffic/conversion anomalies → `/artifacts/signals` (type: traffic-drop)
- Run history → this file's `## Timeline`

## Trigger
Runs daily at 02:00 UTC.

**Prompt:**
> Check Search Console for: new keyword impressions, pages with high impressions + low CTR, 404s from search. Check Ahrefs/SEMrush for competitor keyword gaps. Create signals for opportunities, tasks for pages to build.

## Workflow
1. Query Search Console (last 7d): top queries, CTR, position changes
2. Find: queries with impressions > 100, CTR < 1% → content-gap signal
3. Find: pages with traffic drop > 30% WoW → traffic-drop signal
4. Query keyword tools for: "comprar apartamento ibague", "arriendo casa bogota", etc.
5. For each gap: create signal with keyword, volume, difficulty, suggested title
6. For top 3 gaps: create task with page spec (target keyword, structure, internal links)
7. Check existing pages: update if content stale > 90 days
8. Add timeline entry

## Pequi-Specific Keywords
| Category | Keywords |
|----------|----------|
| Buy | comprar apartamento ibague, casas en venta ibague, fincas en venta tolima |
| Rent | arriendo apartamento ibague, casas en arriendo ibague, locales comerciales arriendo |
| Legal | ley 820 aumento canon, contrato arrendamiento colombia, avalúo catastral |
| Areas | barrios ibague estrato 4, picaleña, la isilita, centro ibague |

## Timeline
- 2026-06-20: Loop contract created. Ready for first run.