---
kind: domain
domain: database
status: active
goal: Monitor query performance, index needs, migration status, backup health
cadence: 12h
tags: [database, infra, performance]
---

# Database — Performance & Health Loop

This domain monitors PostgreSQL performance and maintenance needs.

## Outputs
- Slow query signals → `/artifacts/signals` (type: slow-query)
- Index/migration tasks → `/artifacts/tasks` (type: db-optimization)
- Backup/health tickets → `/artifacts/tickets` (type: db-health)
- Run history → this file's `## Timeline`

## Trigger
Runs every 12 hours (04:00 and 16:00 UTC).

**Prompt:**
> Connect to droplet PostgreSQL. Run pg_stat_statements for top 20 slow queries. Check index usage (idx_scan = 0). Check table bloat. Verify last backup timestamp. Create signals for queries > 100ms avg. Create tasks for unused indexes / missing indexes.

## Workflow
1. SSH to droplet: `ssh pequi "psql -U pequi -d pequi -c \"SELECT query, mean_exec_time, calls FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 20;\""`
2. Check unused indexes: `SELECT * FROM pg_stat_user_indexes WHERE idx_scan = 0 AND schemaname = 'public';`
3. Check table bloat: `SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size FROM pg_tables WHERE schemaname='public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC LIMIT 10;`
4. Verify backup: check `/var/backups/postgresql/` timestamp
5. For queries > 100ms avg: create slow-query signal with query, avg_time, calls
6. For unused indexes > 100MB: create db-optimization task (DROP INDEX)
7. For missing indexes (seq_scan > 1000 on large table): create db-optimization task (CREATE INDEX)
8. Add timeline entry

## Pequi Critical Queries to Watch
- Property search (text search across 5 columns)
- User session lookup by token
- Contract queries by user + status
- AI chat message history

## Timeline
- 2026-06-20: Loop contract created. Ready for first run.