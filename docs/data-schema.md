# Anteroom Data Schema (post-merge, 2026-09-04)

> What the tables mean. The Drizzle schema is truth for columns
> (`frontend/src/drizzle/schema.ts`); this doc explains **intent** and lifecycle.
> Supersedes the pre-merge data-schema doc. Migrations: `frontend/drizzle/`
> (0000 scaffold → 0003 notification; later tables via drizzle-kit).

## Core

### `article` — the central table (~11k live)
| Column | Meaning |
|---|---|
| `id` (uuid) | stable id, used in URLs |
| `ingress` | which pipeline path found it (rss / reddit / link-drop / collect / digest…) |
| `source_url` | **canonical article link**; dedupe key. Aggregator/redirect URLs are gate-blocked |
| `source_name` | display source (from feed); blank on some reddit imports |
| `title`, `headline` | title; headline is the editorial/short variant shown on cards |
| `summary` | feed summary or AI-written; **empty = likely no substance** (gate blocks live) |
| `commentary` | AI magazine voice; what makes an article "written" |
| `ai_thoughts` | raw LLM JSON (stripped from display) |
| `status` | `draft` → `approved` → `live`; `rejected`; `featured` (flagship, 1 max in practice — featured is also a flag) |
| `magazine_id` → `magazine.id` | slug (`tech-pulse`) |
| `subcategory` | per-magazine vocab (drives chips/browse) |
| `published_at` | set when → live; used for ordering |
| `image_url` | feed image → og:image; card thumbnails |
| `warnings`, `flagged`, `suitability_ok` | engine quality signals |
| `efx` | cinematic effect (VHS/rain/lightning) for the reader |
| `social_repeat`, `social_posted_at` | social re-push tracking |
| `search_vector` | tsvector + GIN (title/summary) — `/search` |
| `featured` | boolean star (leader card) |

**Statuses live count (2026-09-04):** live 10,775 · draft 1,109 · rejected 927 · featured 1.
Rejected rows are kept indefinitely (audit trail for source strikes) — retention
policy TBD if DB becomes an issue.

### `magazine`
`id` (slug), `name`, `tagline`, `description`, `realm`, `theme`, `accent`,
`accent2`, render `tags[]` — **identity-in-data**: page themes/cards/taxonomy
render from these rows, not hardcoded maps. 14 magazines (AI Frontier → Weekly
Weird News).

### `source` — feed registry + strike system
`id, magazine_id, type (rss|reddit|…), url, name, sort, limit, status
(active|paused|retired|deleted), tune, delete_count, move_count,
last_delete_at, auto_publish`.
- `tune`: manual quality nudge; auto-publish thresholds compare against it
- `delete_count`: engine strikes (gate fails) + human deletes; **≥15 → auto-pause**
- See [[Source-Quality-Policy]] for the demotion ladder

## Users & social

| Table | Purpose |
|---|---|
| `user` | accounts (better-auth); `role` = admin/superadmin gates admin UI+API |
| `user_follow` | magazine follows → /my-feed + new-article notifications |
| `bookmark` | saved articles |
| `reading_history` | auto-tracked reads (readAt, readCount) |
| `page_view` | traffic attribution (referrer/UTM/daily) → Admin Traffic tab |
| `notification` | in-app bell items (new_article, etc.) |
| `digest_subscription` | email digest (daily/weekly), unsubscribe tokens |
| `dm_*` / key tables | E2EE direct messages (key registry + conversations) |

## Content plumbing

| Table | Purpose |
|---|---|
| `pin` | FLASH/IMPORTANT hero pins; `active`, `unpinned_at`, run_for expiry (cron cleanup) |
| `magazine_card` | editorial cards as data (identity-in-data stage3) → /api/cards → Explore drawer |
| `magazine_taxonomy` | per-magazine subcategory vocab (Python fallback exists) |
| `product` | SWAG shop items (Stripe placeholder) |
| `social_account` | stored publishing credentials (X/Bluesky/LinkedIn) |
| `pipeline_setting` | kill-switch + thresholds (auto_publish_enabled, max_delete_count, min_tune_*) |
| `comment` | article discussion |

## Conventions
- Slugs: lowercase-hyphen for magazines; article ids are uuids
- Timestamps: `timestamp with time zone`, UTC
- Migrations: drizzle-kit; **preview DB is the migration canary** (ADR-005) — never
  run a fresh migration against `nexus` first
- Engine writes raw SQL (psycopg2) for ingest; frontend uses Drizzle. Schema
  changes must update both sides' expectations.

## Known schema debt
- `source_name` nullable in practice (old reddit imports) — display falls back to domain
- `article.search_vector` maintained by trigger — migrations that rewrite `title`/`summary` in bulk should also refresh it
- No retention job for `rejected`/`draft` rows (tiny today; revisit at 10× volume)
