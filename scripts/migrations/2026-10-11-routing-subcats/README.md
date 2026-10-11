# 2026-10-11 — NASA / AI Frontier routing + AI Frontier subcategories

One-off data migration that goes with the "shared routing rules + AI Frontier
subcategories" PR. **Not run yet.**

## Order
1. Merge the PR and deploy **both** engine and frontend
   (`docker compose up -d --build engine frontend`) so new articles follow the rules.
2. Dry run (read-only, prints the before/after counts):
   `scripts/migrations/2026-10-11-routing-subcats/run.sh`
3. Apply (runs `pg-backup.sh` first, then one transaction):
   `scripts/migrations/2026-10-11-routing-subcats/run.sh --apply`
   A per-article change log is written to `backups/routing-migration-*.csv`.

Until step 3 runs, the old AI Frontier subcategory keywords stay in
`magazine_taxonomy` (the DB copy overrides the code), so new articles keep the
old slugs; step 3 replaces them.

## What it changes
| Step | Change |
|---|---|
| taxonomy | `magazine_taxonomy` rows for `neural-hardware` → 9 new subcategories |
| source | `nh-bleepingcomputer` → Tech Pulse (AI stories routed back by rule) |
| NASA | `data/nasa-moves.csv` (Science Frontiers / Dark Matter / Just the News — JTN only money, contracts, building) |
| off-topic | AI Frontier articles the audit marked off-topic → Tech Pulse |
| BleepingComputer | AI Frontier articles with no AI angle (shared rule) → Tech Pulse |
| AI rule | `data/ai-frontier-moves.csv` (articles naming an AI company/product) → AI Frontier |
| subcategories | every AI Frontier article gets its audited sub (`data/ai-frontier-subcats.csv`), others by keywords → LLM |

NASA wins over the AI rule. An article is skipped if it is rejected or an
admin moved it after the audit. Every move is written to `magazine_move_log`
(source `move_count` is not bumped, so no source gets demoted). Only
`magazine_id` and `subcategory` are written.

## Rollback
Backups are created inside the same transaction:
```sql
BEGIN;
UPDATE article a SET magazine_id = b.magazine_id, subcategory = b.subcategory
  FROM bk_20261011_article_routing b WHERE a.id = b.id;
DELETE FROM magazine_taxonomy WHERE magazine_id = 'neural-hardware';
INSERT INTO magazine_taxonomy SELECT * FROM bk_20261011_magazine_taxonomy WHERE magazine_id = 'neural-hardware';
UPDATE source s SET magazine_id = b.magazine_id FROM bk_20261011_source b WHERE s.id = b.id;
DELETE FROM magazine_move_log WHERE created_at >= '<apply time>' AND article_id IN (SELECT id FROM bk_20261011_article_routing);
COMMIT;
```
Or restore the `pg-backup.sh` dump taken right before. Drop the `bk_20261011_*`
tables once the result looks right.
