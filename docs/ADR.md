# Architecture Decision Records — Anteroom

> One short record per decision. New ADRs go on the bottom with today's date.
> Format: Context → Decision → Consequences. The "why" outlives the "what".

---

## ADR-001: Anteroom runs on Docker on homelab1 (2026-08-08)

**Context:** AI Nexus News (as it was) needed Postgres+pgvector, a Python ingest engine, and a Next.js frontend, deployable and rebuildable on a homelab host that also runs 40 other services.
**Decision:** Docker Compose per component, project `ai-news-nexus` (name pinned so container/volume names survive directory renames), repo at `/home/todd/anteroom`.
**Consequences:** `hermes update`-style in-place upgrades don't apply; deploys are `build + up`. Port conflicts with homelable (3000) forced frontend to host :3001. Bare-metal Hermes on the same box is a *separate* decision (ADR-004) — the two run differently on purpose.

---

## ADR-002: Two repos forked (2026-08-16) — and re-merged (2026-09-04)

**Context:** An agent stood the Anteroom-branded frontend up on homelab2 (repo `~/projects/anteroom`) while the original kept evolving on hl1 (`~/ai-news-nexus`). Diverged at `08df286`: hl1 gained 54 commits (auto-publish, notifications, search, DMs), hl2 gained 9 (branding, identity-in-data, Explore drawer).
**Decision:** hl1 repo is the survivor (features + it hosts the DB/engine). hl2's fork bundled, cherry-merged into `consolidate` → `master` at `1a70879`; tag `pre-consolidation-2026-09-04` = pre-merge state. hl2 stack decommissioned, fork archived.
**Consequences:** Conflict rule was "master wins features, hl2 wins branding/identity-in-data". One regression slipped through (api/articles lost `imageUrl` on 2026-08-17, restored in the merge). hl2 is now agents+vault only, RAM reserved for local LLMs.

---

## ADR-003: anteroom.news served from homelab1 (2026-09-04)

**Context:** From the merge until cutover, public anteroom.news was served by hl2's containers while the code lived on hl1 — two tunnels, two sources of truth.
**Decision:** DNS (`anteroom.news`, `www`, `preview`) CNAMEs repointed from hl2's tunnel to hl1's (`adams-server` `8e0d9521`); ingress hostnames added to that tunnel; hl2 stack stopped and archived. `nexus.osiris2025.com` kept as **backdoor/testing alias** (documented in Traefik file).
**Consequences:** hl2 has zero Anteroom footprint. Rollback path = re-point CNAMEs at hl2 tunnel `11e7e071` (still exists, unused). Old tunnel should be deleted in CF when convenient.

---

## ADR-004: Hermes on hl1 is bare-metal; Anteroom is Docker (2026-09-04)

**Context:** Hermes had been running as two v0.19 containers against the same `~/.hermes` a native v0.21 gateway was also using — state clobbering, a dashboard reporting "stopped", double cron.
**Decision:** Removed the containers; Hermes = systemd user units (`hermes-gateway`, `hermes-dashboard`) from `~/.hermes/hermes-agent`. Anteroom stays Docker.
**Consequences:** `hermes update` works natively on hl1 now. One host, two deployment styles — that's intentional, don't "fix" either direction without an ADR.

---

## ADR-005: Staging = separate folder + separate DB (2026-09-04)

**Context:** hl2's original pattern (one folder, two containers differing only by env) meant preview always ran the same code as live — useless for testing. Also, a staging schema migration would hit the live DB.
**Decision:** `~/anteroom` (branch `main`) = live; `~/anteroom-preview` (git worktree, branch `staging`) = preview; Postgres gains a second database `nexus_preview` restored from nightly dumps (`scripts/refresh-preview-db.sh`). Both frontends share the `nexus-db` container.
**Consequences:** Preview can break freely; migrations are isolated. Refresh preview DB before meaningful testing so its data is recent.

---

## ADR-006: Content quality gate + source strikes (2026-09-04)

**Context:** Feeds produced "articles" with no substance — reddit RSS `submitted by…[link][comments]` boilerplate, HN discussion links, Google News encrypted redirects, empty-description feeds. 1,109 junk rows accumulated (896 live before purge). Manual bulk-publishing couldn't scale.
**Decision:** Engine gate at insert (`has_substance`, `is_aggregator_link`): empty/boilerplate summaries and aggregator links are forced to `draft` regardless of auto-publish tier. Each gate-fail = +1 strike on the source; ≥15 strikes auto-pauses it. Summarizer skips gate-failures (no LLM tokens on crap).
**Consequences:** Good-but-empty feeds (Hugging Face, Google Research) stay active — their items draft, AI summarizer rescues real ones. Blacklist is earned by data, not opinions. Purge history in [[Source-Quality-Policy]] §6.

---

## ADR-007: Google News search feeds retired (2026-09-04)

**Context:** `nh-nous-releases` used a `news.google.com/rss/search` feed. GN "article" URLs are encrypted redirects (token protobuf is encrypted; batchexecute decode API refused); the engine can never fetch the real page — only titles, published as fake summaries.
**Decision:** Source retired (`status='retired'`, tune −5), 213 redirect articles demoted to draft, `news.google.com/rss/articles` added to the aggregator pattern list.
**Consequences:** For "mentions of Hermes/Nous" tracking, use a real scraper with publisher URLs, or accept headline-only items that stay draft. Never re-add GN search feeds.

---

## ADR-008: API list contract keeps `offset/total` (2026-09-04)

**Context:** `/api/articles` had lost `imageUrl/pinned/offset/total` in an Aug 17 commit — magazine pages silently lost thumbnails, FLASH pins, and pagination for weeks.
**Decision:** Restored from the hl2 fork and made the contract explicit: list endpoints return `{articles:[…], total}` with `offset`+`limit` support, and every article carries `imageUrl`, `pinned`, `pinKind`, `headline`. UI paginates server-side (Per-page 20/50/100/200 + Prev/Next) instead of accumulating "Load more".
**Consequences:** Any API change must keep `total` correct or pagination breaks. Reader page uses a different endpoint — check both when touching routes.
