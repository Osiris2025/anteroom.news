# Anteroom Operations Runbook

> The 3am doc. Everything needed to run, diagnose, and recover the platform.
> Host: **homelab1** (100.65.69.37, ssh alias `adams-server`). Repo: `/home/todd/anteroom`.
> Topology details: [[Topology-Verified]]. Product plan: [[Anteroom]].
> Last verified: 2026-09-04.

## 1. Components

| Component | Container | Port | Notes |
|---|---|---|---|
| Live frontend | `nexus-frontend` (next-server) | host `:3001` → 3000 | brand: Anteroom |
| Staging frontend | `anteroom-preview` | Traefik-only | DB `nexus_preview` |
| Ingest engine | `nexus-engine` | — | discovery + summarization loop |
| Postgres 16 + pgvector | `nexus-db` | `127.0.0.1:5433` | DBs: `nexus` (live), `nexus_preview` |
| Traefik (homelab stack) | `traefik` | :80/:443/:8080 | routes in `~/homelab/traefik/dynamic/anteroom.yml` |
| cloudflared (homelab stack) | `cloudflared` | — | tunnel `adams-server` (remote-managed in CF dashboard) |

Hostnames → live: `anteroom.news`, `www`, `nexus.osiris2025.com` (**backdoor/testing only**). Staging: `preview.anteroom.news`.

## 2. Everyday commands

```bash
cd ~/anteroom
docker compose ps                          # what's running
docker compose logs -f engine              # ingest cycle live
docker compose logs -f frontend            # web errors
docker compose restart engine              # kick the pipeline
docker compose build frontend && docker compose up -d --no-deps frontend   # deploy web change
docker compose build engine  && docker compose up -d --no-deps engine     # deploy engine change
```

Deploy a code change = build + up that service. No downtime beyond the ~15s the container takes to boot (frontend only; engine restart is transparent).

### Staging (preview)
```bash
cd ~/anteroom-preview
git pull                       # preview worktree tracks `staging` branch
docker compose -f docker-compose.preview.yml up -d --build frontend
~/anteroom/scripts/refresh-preview-db.sh     # reset preview DB from latest nightly dump
```

## 3. Health checks (what normal looks like)

```bash
# Site answers
curl -s -o /dev/null -w '%{http_code}\n' https://anteroom.news              # 200
curl -s https://anteroom.news/api/articles?limit=1 | head -c 120            # JSON w/ total

# Article flow (compare to ~300-450 ingested/day, most to draft or live)
docker exec nexus-db psql -U nexus -d nexus -Atc "
  select date_trunc('day',created_at)::date d, count(*) filter (where status='live') live,
         count(*) filter (where status='draft') draft
  from article where created_at > now()-interval '7 days' group by 1 order by 1;"

# Engine cycle ran recently (summarization line every cycle)
docker logs --since 24h nexus-engine 2>&1 | grep "Summarization complete" | tail -3

# Ingest ratios — discovery found vs inserted (dupes skipped)
docker logs --since 24h nexus-engine 2>&1 | grep "Discovery results" | tail -3

# Disk (DB + images grow; prune monthly)
df -h / | tail -1
docker system df

# DB connections (normal: <10)
docker exec nexus-db psql -U nexus -d nexus -Atc "select count(*) from pg_stat_activity where state='active';"
```

**Normal daily numbers (as of 2026-09-04):** ~10,800 live articles total, 300–450 ingested/day, DB ~15 GB, nightly dump ~15 MB→ growing ~0.5 MB/day.

## 4. Incidents & playbooks

### Site down / 5xx
1. `docker compose ps` — is `nexus-frontend` up? If restarting: `docker compose logs --tail 50 frontend`.
2. Common cause: bad env var, DB unreachable. Check `docker exec nexus-frontend env | grep DATABASE_URL`.
3. Build failure mid-deploy: the old container keeps running (`up -d` only swaps on success). Rebuild after fixing code.
4. Traefik level: `curl -s 127.0.0.1:8080/api/http/routers | python3 -m json.tool | grep -A3 anteroom` — routers `enabled`?

### anteroom.news unreachable but site up locally
Tunnel/DNS. `curl -s -H 'Host: anteroom.news' http://127.0.0.1:80` on hl1 — if that works, it's Cloudflare: check tunnel status in CF dashboard (Zero Trust → Tunnels → `adams-server`) and that DNS CNAMEs point at `8e0d9521-….cfargotunnel.com`.

### Ingest stuck (no new articles)
1. `docker compose restart engine`, watch `docker compose logs -f engine`.
2. Engine logs show per-feed lines: `Fetching RSS:` / `Got N entries from`. A feed returning 0 for days = source died; check its URL manually.
3. LLM failures show as `Summarization: X attempted, Y failed` — check OPENROUTER_API_KEY balance/validity.

### Feed spamming garbage
See [[Source-Quality-Policy]]: the engine auto-demotes (strikes) and auto-pauses at 15 strikes. For immediate action:
```bash
docker exec nexus-db psql -U nexus -d nexus -c "UPDATE source SET status='paused' WHERE id='<source-id>';"
docker exec nexus-db psql -U nexus -d nexus -c "UPDATE article SET status='draft' WHERE source_url LIKE '%<bad-domain>%' AND status='live';"
```

### Disk full
```bash
docker system df                          # usually build cache
docker builder prune -af                  # frees tens of GB safely
docker image prune -af                    # removes images w/o running containers
```
(2026-09-04: reclaimed 288 GB this way.) Dangling volumes hold possible data — review before pruning.

### DB restore (the one that matters)
```bash
# nightly dumps land in ~/anteroom/backups/ at 07:00 (pg-backup.sh via cron)
gunzip -c ~/anteroom/backups/nexus-YYYYMMDD-HHMMSS.sql.gz | \
  docker exec -i nexus-db psql -U nexus -d nexus       # into LIVE (careful!)
# safer: restore into preview first, verify, then swap
~/anteroom/scripts/refresh-preview-db.sh ~/anteroom/backups/<file>.sql.gz
```
**Test a restore into `nexus_preview` monthly.** A backup you haven't restored is a hope, not a backup.

### Full host recovery (hl1 lost)
1. Provision host, install Docker + Tailscale.
2. Restore `~/anteroom` (git — push to Gitea! see Known Gaps), `~/homelab` (traefik/cloudflared config), `~/anteroom/backups` (off-site copy needed — see Known Gaps).
3. `cd ~/anteroom && docker compose up -d` — DB volume is **not** in git; restore from latest dump into a fresh `nexus-db` container.
4. Cloudflare: tunnel `adams-server` re-enroll (token in CF dashboard), DNS unchanged.

## 5. Cron on hl1 (`crontab -l`)

| Schedule | Job | Purpose |
|---|---|---|
| `0 6 * * *` | `~/nexus-daily.sh` | full engine run + digest |
| `0 7 * * *` | `~/anteroom/pg-backup.sh` | nightly DB dump |
| `*/10 * * * *` | `~/anteroom/pin-cleanup-cron.sh` | expire pins |

## 6. Admin UI cheat-sheet
- **Dispatch** (`/admin`): queue, bulk **Approve All / Publish All Approved** (server-side, honors magazine+status+search filters, confirms with true counts).
- **Any article card site-wide**: hover (desktop) or **(A)** toggle (touch) → Approve/Publish/Reject/Draft/Delete/Star/Pin/Move-mag/Move-subcat/Regen-commentary. Works on magazine grid, Live strip, Search, Bookmarks, My-Feed, Highlights, History.
- **Magazine grid**: Per-page 20/50/100/200 + ◀ Prev / Next ▶.
- **Admin Publishing tab**: auto-publish kill-switch, thresholds, per-source overrides, 24h digest.

## 7. Known gaps (fix me)
- [ ] **No git remote** — repo exists only on hl1 (+ hl2 archive bundle). zeus/Gitea is OUT (work resource, personal project). Options: hl2 bare repo + private GitHub (recommended).
- [ ] **Backups not off-site** — dumps live on the same host as the DB. Copy to hl2 or CF R2 (zeus excluded: work resource).
- [ ] Restore into `nexus_preview` never tested end-to-end.
- [ ] Secrets in `.env` unencrypted (`NEXUS_DB_PASSWORD`, OPENROUTER, SMTP). Acceptable on tailnet-only host; revisit if ever exposed.
