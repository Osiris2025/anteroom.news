# Catboy sightings drip

25 "Catboy sighting" articles for Weekly Weird News (`weekly-weird-news`), released on a randomized drip.

- `articles.json` - the 25 articles (order = release order, cookie-jar-caper first).
- Images: `frontend/public/images/catboy/<slug>.jpg` (baked into the frontend image, so adding them needs a frontend rebuild).
- `seed.py` - inserts all 25 as `status='draft'` with ids `catboy-<slug>`; `published_at` = planned drop time (this IS the schedule). Slot 1 = now, each next slot = previous + uniform 72-192h, local time kept between 08:00 and 22:00 America/New_York. `--dry-run` prints a schedule; `--show` prints the schedule from the DB; `CATBOY_DB=nexus_preview` targets the preview DB.
- `catboy-drip.sh` - cron publisher (every 10 min). Flips the oldest due draft to `live` and inserts a FLASH pin (`pin_catboy-<slug>_7d`, run_for 7d, expires now()+7d). Idempotent, max one article per run, logs to `~/catboy-drip.log`.

Rows use `image_url='/images/catboy/<slug>.jpg'` (relative) so `social-queue.sh` / `social-autoflag.sql` (which only pick `image_url LIKE 'http%'`) never post them to Bluesky/X. `source_url` is NULL (no outbound "via ..." link).

## Operate (on homelab1, user todd)
- Cron: `*/10 * * * * /home/todd/anteroom/scripts/catboy-drip/catboy-drip.sh >> /home/todd/catboy-drip.cron.log 2>&1`
- Pause: `touch ~/anteroom/.catboy-drip-paused` (resume: `rm` it)
- Schedule: `python3 ~/anteroom/scripts/catboy-drip/seed.py --show`

## Rollback / removal
1. Pause: `touch ~/anteroom/.catboy-drip-paused`, or delete the cron line (`crontab -e`).
2. Remove content:
   ```
   docker exec nexus-db psql -U nexus -d nexus -c "DELETE FROM pin WHERE article_id LIKE 'catboy-%' AND article_id NOT LIKE 'catboy-episode-%'; DELETE FROM article WHERE id LIKE 'catboy-%' AND id NOT LIKE 'catboy-episode-%';"
   ```
   (Never touch `catboy-episode-1` / `catboy-episode-2`.)
3. Frontend: previous image tag `ai-news-nexus-frontend:backup-pre-catboy` (retag to `:latest` and `docker compose up -d frontend`), or revert the PR and rebuild.
4. DB backup taken before seeding: see the report / `~/anteroom/backups/` (pre-catboy file).
