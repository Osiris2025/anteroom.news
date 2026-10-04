#!/bin/bash
# catboy-drip.sh - publishes the next due "Catboy sighting" draft and pins it as BREAKING (FLASH, 7d).
# Cron (user todd, every 10 min):
#   */10 * * * * /home/todd/anteroom/scripts/catboy-drip/catboy-drip.sh >> /home/todd/catboy-drip.cron.log 2>&1
# Pause:  touch ~/anteroom/.catboy-drip-paused     Resume: rm ~/anteroom/.catboy-drip-paused
# Idempotent: only rows with status='draft' are flipped; pin id is deterministic (pin_<articleId>_7d) + ON CONFLICT DO NOTHING.
# At most ONE article is published per run (oldest due first), so a backlog after an outage never dumps all at once.
ROOT="${CATBOY_ROOT:-$HOME/anteroom}"
LOG="${CATBOY_LOG:-$HOME/catboy-drip.log}"
DB="${CATBOY_DB:-nexus}"
[ -e "$ROOT/.catboy-drip-paused" ] && exit 0

exec 9>/tmp/catboy-drip.lock
flock -n 9 || exit 0

OUT=$(docker exec -i nexus-db psql -U nexus -d "$DB" -v ON_ERROR_STOP=1 -At --single-transaction <<'SQL' 2>&1
WITH due AS (
  SELECT id FROM article
  WHERE id LIKE 'catboy-%' AND id NOT LIKE 'catboy-episode-%'
    AND magazine_id = 'weekly-weird-news'
    AND status = 'draft' AND published_at <= now()
  ORDER BY published_at
  LIMIT 1
  FOR UPDATE SKIP LOCKED
), upd AS (
  UPDATE article a SET status = 'live' FROM due WHERE a.id = due.id RETURNING a.id
), pinned AS (
  INSERT INTO pin (id, article_id, kind, run_for, expires_at, pinned_at, active)
  SELECT 'pin_' || id || '_7d', id, 'FLASH', '7d', now() + interval '7 days', now(), true FROM upd
  ON CONFLICT (id) DO NOTHING
  RETURNING article_id
)
SELECT 'published ' || upd.id || ' pinned=' || (EXISTS (SELECT 1 FROM pinned))::text FROM upd;
SQL
)
RC=$?
if [ $RC -ne 0 ]; then
  echo "$(date '+%F %T %Z') ERROR rc=$RC: $OUT" >> "$LOG"
  exit $RC
fi
[ -n "$OUT" ] && echo "$(date '+%F %T %Z') $OUT" >> "$LOG"
exit 0
