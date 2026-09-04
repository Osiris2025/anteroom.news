# Source Quality Policy

> How feeds get in, how bad ones get out. Established 2026-09-04 after the first
> mass quality purge (896 articles demoted, 3 sources paused, 2 retired).
> Mechanics live in the engine (`engine/src/engine/agents/__init__.py` →
> `has_substance`, `is_aggregator_link`, `insert_articles`) and the `source` table.

## 1. The quality bar

An article has **substance** when it carries readable content:
- summary ≥ 20 chars that is not boilerplate, OR
- AI commentary ≥ 40 chars that is not boilerplate.

**Boilerplate** (auto-detected): `submitted by … [link] [comments]` (reddit/HN RSS),
`[Reddit r/…]` placeholders.

**Aggregator links** are never articles, regardless of title quality:
- `news.ycombinator.com/item…` (discussion pages)
- `reddit.com/r/hackernews…` (HN mirror)
- `news.google.com/rss/articles…` (encrypted redirects — no fetchable page, ever)

## 2. Article lifecycle

```
RSS/reddit feed ──▶ [quality gate at insert] ──▶ draft ──▶ (human or auto-publish) ──▶ approved ──▶ live
                                                      │
                                                      └──▶ rejected (visible in Dispatch, never published)
```

- **Gate at insert:** no-substance or aggregator-link ⇒ `draft`, **always**, even with
  auto-publish on. Aggregator links never enter the pipeline as liveable content.
- **Summarizer skips** gate-failed articles — no LLM tokens spent on crap.
- Human tools (hover card tools / Dispatch) can publish a draft anyway if it's
  genuinely good (e.g. a title-only HF post worth rescuing) — the gate is a
  default, not a law.

## 3. Source strikes and demotion

Every gate-failed insert adds **+1 `delete_count`** to the source.

| Strike level | Effect |
|---|---|
| ≥ 5 (tune < thresholds) | Source stops auto-publishing; everything needs human approve |
| **≥ 15** | **Auto-paused** (`status='paused'`, tune −5) — blacklisted, no ingestion |

Existing per-source counters (2026-09-04 purge):

| Source | Strikes | Status |
|---|---|---|
| Hacker News (r/hackernews mirror) | 248 | **deleted** — pure aggregator, zero original content |
| r/weird | 30 | paused (boilerplate; can be un-paused, gate will hold the line) |
| Grist | 37 | paused |
| io9 - Gizmodo | 7 | active (watch) |
| Hugging Face Blog | 13 | active (good source; empty RSS descriptions get drafted, AI can rescue) |
| Google Research | 6 | active (same) |
| Hermes/Nous Google-News search feed | — | **retired** — structurally unable to produce real articles |

## 4. Source onboarding criteria

A feed is worth adding when:
1. Items link to **the publisher's own article page** (no aggregator/redirect chains)
2. The feed carries descriptions (or the pages are fetchable for og:image/summary)
3. Content matches one magazine's realm; not a duplicate of an existing source
4. Test run: insert for a few days, check the thin-rate in Dispatch before enabling auto-publish

To review a source's health:
```bash
docker exec nexus-db psql -U nexus -d nexus -c "
select name, status, tune, delete_count from source where magazine_id='<mag>' order by delete_count desc;"
```

## 5. Manual override (admin)

Un-pause / resurrect a source:
```bash
docker exec nexus-db psql -U nexus -d nexus -c "UPDATE source SET status='active', delete_count=0, tune=0 WHERE id='<id>';"
```
Retire a source (keep row for history): `status='retired'`. Hard-delete is reserved
for aggregator junk; a retired row documents *why* it was rejected.

Bulk-demote bad articles already live:
```bash
docker exec nexus-db psql -U nexus -d nexus -c "
UPDATE article SET status='draft'
WHERE status='live' AND source_url LIKE '%<bad-pattern>%';"
```

## 6. Purge history (2026-09-04)

- 896 live → draft (reddit boilerplate 554, r/hackernews 505 overlap, HN item links 8, thin/no-commentary 159)
- 213 Google News redirect articles → draft
- Post-purge totals: ~10,775 live · 1,109 draft · 927 rejected
- Root causes fixed in engine: quality gate, aggregator patterns, summarizer skip
