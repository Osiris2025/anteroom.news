# Anteroom API Reference

> Hand-maintained (auto-generation when there's bandwidth). Base:
> `https://anteroom.news`. All list endpoints: JSON, `{articles:[…], total}` shape.
> Pagination via `?offset=` + `?limit=` (default limit 150, max 200). `total`
> reflects the filter, needed for page math.

## Public endpoints (no auth)

### `GET /api/articles`
The main content list. Live articles only.
| Param | Values | Notes |
|---|---|---|
| `magazine` | magazine id or `all` | |
| `limit` | 1–200 | |
| `offset` | int | page math: `page*size` |
| `q` | string | tsvector full-text (title/summary), ranked by relevance when present |
| `subcat` | subcategory slug | |
| `releases` | `1` | only software-release items |

Article fields: `id, title, headline, sourceUrl, sourceName, imageUrl, summary,
commentary, status, aiThoughts, subcategory, featured, pinned, pinKind,
publishedAt, createdAt, magazine{id,name}`.
⚠ `pinned/pinKind/imageUrl` are load-bearing for the magazine grid — don't drop them (see ADR-008).

### `GET /api/magazines`
All magazines with `id, name, tagline, description, realm, theme, accent,
accent2, tags[]` (identity-in-data: themes render from these fields, not code).

### `GET /api/cards`
Per-magazine editorial cards (identity-in-data stage3). Fallback to static
SHOW_FRONTIER data when a magazine has no rows.

### `GET /api/articles?q=…` (search)
Same endpoint as the list; `q` triggers ranked full-text search. The `/search`
page uses it with `magazine=` filter.

### `GET /api/pins`, `GET /api/weekly-highlights`, `GET /api/subscribe…`
Pins: active FLASH/IMPORTANT. Weekly highlights: grouped per-magazine digest.
Subscribe: email digest signup (POST variants documented in code).

### `POST /api/collect`, `POST /api/link-collect`
C7 extension / link-drop intake. Takes a URL, AI-classifies magazine + suitability.
Admin-auth'd variants exist for the admin link-dropper.

### `GET /api/track/page-view` (POST)
Reading/tracking beacon.fire-and-forget; powers the traffic dashboard.

## Auth'd user endpoints (session cookie)
- `GET/POST /api/reading-history` — list / record reads
- `GET/POST/DELETE /api/bookmarks` — save/unsave articles
- `GET/POST /api/follows`, `/api/follows/[id]` — magazine follows (drives /my-feed + notifications)
- `POST /api/digest/…`, `/api/unsubscribe` — email digest (SMTP configured)
- DM endpoints under `/api/dm/*` (E2EE key registry + conversations)

## Admin endpoints (role admin/superadmin; 403 otherwise)

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/admin/session` | GET | `{isAdmin}` — reveals card tools; no user data |
| `/api/admin/queue?magazine=&status=&q=` | GET | review queue (newest 200) |
| `/api/admin/queue/bulk` | GET | **counts** that approve/publish WOULD change for a scope |
| `/api/admin/queue/bulk` | POST | `{action:"approve"|"publish", magazine, status, q}` → `{updated}` — one SQL, honors scope |
| `/api/admin/article/[id]` | PATCH | status moves, featured, magazineId, subcategory, `publishedAt` set on →live |
| `/api/admin/article/[id]` | DELETE | delete with `{reason}` — feeds source strikes |
| `/api/admin/pins` | POST/… | FLASH/IMPORTANT pins with duration |
| `/api/admin/generate-commentary` | POST | AI commentary for one article |
| `/api/admin/batch-commentary` | POST | batch generation |
| `/api/admin/publishing-gate` | GET/POST | kill-switch + thresholds (pipeline_setting table) |
| `/api/admin/publishing-digest` | GET | 24h auto-published + queue digest |
| `/api/admin/traffic` | GET | page-view analytics |
| `/api/admin/link-drop` | POST | manual URL intake |
| `/api/admin/taxonomy` | GET/… | subcategory vocab |

### Publishing gate semantics
`pipeline_setting.auto_publish_enabled` (0/1) is the **kill-switch**. OFF = every
ingest lands `draft` regardless of anything. ON = engine `decide_tier` consults
per-source `auto_publish` override, then `tune` vs thresholds. **Quality gate
outranks all of it** — no-substance articles are always draft. Source with
`delete_count ≥ 15` is paused by the engine.

## Engine internals (not HTTP, but contract-relevant)
- Ingest dedupes by `source_url`; near-dupes by ≥75% title overlap
- Quality gate: `has_substance()` + `is_aggregator_link()` — see [[Source-Quality-Policy]]
- Summarizer batch: drafts w/o commentary, max 100/cycle, **skips gate-failures**
- Strike rule: gate-fail → source `delete_count+1`; ≥15 → `paused` + tune −5

## Conventions
- IDs are UUIDs (text cols); magazine ids are slugs (`tech-pulse`)
- Timestamps UTC; rendered client-local
- Errors: `{"error": "message"}` with proper 4xx/5xx
- CORS: API server allows configured origins (`API_SERVER_CORS_ORIGINS`)
