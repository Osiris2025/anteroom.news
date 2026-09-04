# Anteroom — Verified Topology (2026-09-04, post-cutover)

> **Source of truth for WHERE things run.** Verified by direct inspection (docker ps, Traefik API, git, curl) on both hosts, 2026-09-04.
> Supersedes the 2026-09-03 version, which was **wrong** (it claimed homelab2 ran no docker and was never an app host — in fact homelab2 was serving anteroom.news at that time).
> Product/architecture plan: [[projects/anteroom/Anteroom]]. Migration plan: `~/.hermes/plans/2026-09-04_083000-anteroom-consolidate-to-homelab1.md` (on Todd's Mac).

## Design intent (Todd)
- **homelab1** (`100.65.69.37`, ssh alias `adams-server`) = the ONLY Anteroom app/DB host during dev/test. Production later moves to Hostinger per [[projects/anteroom/Anteroom]].
- **homelab2** (`100.126.101.5`, ssh alias `pop-os`) = agents + Obsidian vault only. RAM is reserved for local LLMs; **no critical-path services** (no Postgres, no web apps).

## homelab1 — layout
| Path / container | Role |
|---|---|
| `/home/todd/anteroom/` (git `master`) | **Live** code. `docker compose` project `ai-news-nexus` (name pinned so existing containers/volume survive the rename from `~/ai-news-nexus`). |
| `/home/todd/anteroom-preview/` (git worktree, branch `staging`) | **Staging** code. `docker compose -f docker-compose.preview.yml up -d --build` |
| `nexus-frontend` | Live Next.js (next-server). Host `:3001` → container `:3000`. `AUTH_URL/SITE_BASE_URL=https://anteroom.news` |
| `anteroom-preview` | Staging Next.js, container `:3000` (no host port; Traefik only). DB = `nexus_preview` |
| `nexus-engine` | Ingest/summarize pipeline → DB `nexus` only |
| `nexus-db` | Postgres 16 + pgvector. DBs: `nexus` (live), `nexus_preview` (staging). `127.0.0.1:5433→5432` only (tailnet forward retired 2026-09-04). Password in `~/anteroom/.env` `NEXUS_DB_PASSWORD` |
| `traefik` (homelab stack) | `/home/todd/homelab/traefik/dynamic/anteroom.yml` (replaced `nexus.yml`) |
| `cloudflared` (homelab stack) | Tunnel **`adams-server`** (`8e0d9521-…`), remote-managed. Ingress: all `*.osiris2025.com` + `anteroom.news`, `www`, `preview` → `http://traefik:80`. (`nextcloud-tunnel` `fcbb2683` is the host-level cloudflared for osiris2025.com/docs only.) |

### Hostnames → Traefik routers (hl1)
| Host | Router | Backend | Note |
|---|---|---|---|
| `anteroom.news`, `www.anteroom.news` | `anteroom-http/https` | `nexus-frontend:3000` | DNS CNAME → `8e0d9521….cfargotunnel.com` (cut over 2026-09-04) |
| `nexus.osiris2025.com` | same router | same | **BACKDOOR / TESTING ONLY** — legacy alias, do not publish |
| `preview.anteroom.news` | `anteroom-preview-*` | `anteroom-preview:3000` | staging, DB `nexus_preview` |

### Ops scripts (hl1)
- `~/anteroom/pg-backup.sh` — nightly 07:00 dump → `~/anteroom/backups/`
- `~/anteroom/scripts/refresh-preview-db.sh [dump.sql.gz]` — rebuild `nexus_preview` from latest dump
- `~/anteroom/pin-cleanup-cron.sh` — every 10 min
- `~/nexus-daily.sh` — 06:00 engine run + digest

## homelab2 — DECOMMISSIONED from Anteroom (2026-09-04)
- All Anteroom containers removed (`anteroom-frontend`, `preview-frontend`, `anchor-traefik`, `anteroom-cloudflared`). Port 3001 free.
- Old fork archived at `~/projects/_archive/anteroom-hl2-fork` (git tip `f6fdcee`, fully merged into hl1 master). Cloudflare tunnel `Anteroom` (`11e7e071`) is now unused — delete in dashboard when convenient.
- Vault lives here: `~/.hermes/obsidian-vault` (this file).

## Code history
- Common ancestor `08df286` (2026-08-16). hl1 fork had 54 unique commits (auto-publish kill-switch/decide_tier/Admin Publishing tab, notifications, DMs, search, digests, OG/quote/thread, traffic). hl2 fork had 9 (Anteroom branding, identity-in-data realm/theme/cards, Explore drawer, Safari fixes).
- Merged 2026-09-04 on hl1: `1a70879` (master wins on features; hl2 wins on branding). Tag `pre-consolidation-2026-09-04` = hl1 state before merge. hl2 bundle: `anteroom-hl2-2026-09-04.bundle` (Mac `~/forensics-hl2/`, hl1 `/tmp/`).
- Neither repo has a remote yet → push to Gitea on zeus (`100.68.149.17:3000`) pending.

## Remaining (post-migration)
- Push repo to Gitea on zeus (`100.68.149.17:3000`) — no remote yet.
- Delete unused Cloudflare tunnel `Anteroom` (11e7e071) and revoke the `hermes-tunnel` API token.
- Move Hermes on homelab1 from Docker to bare-metal (Todd's standing request).

## Rule for future work
Before deploying/troubleshooting: (1) read this page, (2) `docker ps` on **homelab1**, (3) `curl -s 127.0.0.1:8080/api/http/routers` on homelab1, (4) act. Never deploy Anteroom to homelab2.
