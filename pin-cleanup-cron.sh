#!/bin/bash
# pin-cleanup-cron.sh
# Run from cron every 10 minutes on homelab1.
# Cleans up expired pins and resets article pinned flags.
#
# Add to crontab (crontab -e):
#   */10 * * * * /home/todd/ai-news-nexus/pin-cleanup-cron.sh >> /var/log/pin-cleanup.log 2>&1

SITE="http://localhost:3001"
LOG="/var/log/pin-cleanup.log"

# An API-to-API call using the internal docker network doesn't need auth
# But the stale endpoint needs admin auth — use the cleanup endpoint indirectly
# via the stale endpoint with auto-cleanup.
# Actually, since the stale endpoint requires admin session, we need a different approach.
#
# SIMPLER: Just run a direct DB query from the host:
# (This only works if psql is installed on the host, and docker can execute it)

docker exec -i nexus-db psql -U nexus -d nexus << SQL
-- Deactivate expired pins
UPDATE "pin"
SET active = false, updated_at = NOW()
WHERE active = true AND expires_at < NOW();

-- Clear article pin flags for any articles that just had their pins expire
UPDATE "article"
SET pinned = false, pin_kind = NULL, updated_at = NOW()
WHERE pinned = true
AND id IN (
    SELECT article_id FROM "pin" WHERE active = false AND expires_at < NOW()
);

-- Run again for articles whose pins were already inactive but article was never reset
UPDATE "article"
SET pinned = false, pin_kind = NULL, updated_at = NOW()
WHERE pinned = true
AND id NOT IN (
    SELECT article_id FROM "pin" WHERE active = true
);

SELECT CONCAT(NOW(), ' — Cleaned ', COUNT(*), ' articles with stale pinned flags') AS result
FROM "article"
WHERE pinned = false AND pin_kind IS NULL AND updated_at > NOW() - INTERVAL '1 minute';
SQL
