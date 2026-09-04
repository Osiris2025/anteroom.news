# Anteroom — Verified Topology (2026-09-04)

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
| `nexus-db` | Postgres 16 + pgvector. DBs: `nexus` (live), `nexus_preview` (staging). `127.0.0.1:5433→5432`; also listens on tailnet `100.65.69.37:5432` (legacy, for hl2 — remove after hl2 decommission) |
| `traefik` (homelab stack) | `/home/todd/homelab/traefik/dynamic/anteroom.yml` (replaced `nexus.yml`) |
| `cloudflared` (homelab stack) | Remote-managed tunnel; hostnames configured in Cloudflare Zero Trust dashboard |

### Hostnames → Traefik routers (hl1)
| Host | Router | Backend | Note |
|---|---|---|---|
| `anteroom.news`, `www.anteroom.news` | `anteroom-http/https` | `nexus-frontend:3000` | **public DNS still points at homelab2's tunnel until Phase 2 cutover** |
| `nexus.osiris2025.com` | same router | same | **BACKDOOR / TESTING ONLY** — legacy alias, do not publish |
| `preview.anteroom.news` | `anteroom-preview-*` | `anteroom-preview:3000` | staging; DNS also still on hl2 tunnel |

### Ops scripts (hl1)
- `~/anteroom/pg-backup.sh` — nightly 07:00 dump → `~/anteroom/backups/`
- `~/anteroom/scripts/refresh-preview-db.sh [dump.sql.gz]` — rebuild `nexus_preview` from latest dump
- `~/anteroom/pin-cleanup-cron.sh` — every 10 min
- `~/nexus-daily.sh` — 06:00 engine run + digest

## homelab2 — current (transitional) state
- `~/projects/anteroom/` — the **old Anteroom fork** (branch tip `f6fdcee`, bundled + merged into hl1 `master` at `1a70879`). Still running `anteroom-frontend`, `preview-frontend`, `anteroom-cloudflared`, `anchor-traefik` and serving public anteroom.news. **To be shut down** (`docker compose down`) after Cloudflare DNS is repointed to hl1's tunnel; then archive dir to `~/projects/_archive/anteroom-hl2-fork`.
- Vault lives here: `~/.hermes/obsidian-vault` (this file).

## Code history
- Common ancestor `08df286` (2026-08-16). hl1 fork had 54 unique commits (auto-publish kill-switch/decide_tier/Admin Publishing tab, notifications, DMs, search, digests, OG/quote/thread, traffic). hl2 fork had 9 (Anteroom branding, identity-in-data realm/theme/cards, Explore drawer, Safari fixes).
- Merged 2026-09-04 on hl1: `1a70879` (master wins on features; hl2 wins on branding). Tag `pre-consolidation-2026-09-04` = hl1 state before merge. hl2 bundle: `anteroom-hl2-2026-09-04.bundle` (Mac `~/forensics-hl2/`, hl1 `/tmp/`).
- Neither repo has a remote yet → push to Gitea on zeus (`100.68.149.17:3000`) pending.

## Remaining steps (Phase 2)
1. Cloudflare dashboard: delete `anteroom.news`/`www`/`preview` CNAMEs (→ hl2 tunnel), add them as public hostnames on hl1's tunnel → `http://traefik:80`.
2. Verify externally (title Anteroom, `/api/magazines` has `realm`, sign-in, Admin → Publishing tab).
3. hl2: `usermod -aG docker todd`; `cd ~/projects/anteroom && docker compose down`; archive dir.
4. hl1: set real `NEXUS_DB_PASSWORD`; drop the tailnet `5432` listener.

## Rule for future work
Before deploying/troubleshooting: (1) read this page, (2) `docker ps` on **homelab1**, (3) `curl -s 127.0.0.1:8080/api/http/routers` on homelab1, (4) act. Never deploy Anteroom to homelab2.
