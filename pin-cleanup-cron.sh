#!/bin/bash
# pin-cleanup-cron.sh
# Run from cron every 10 minutes on homelab1.
# Cleans up expired pins in the pin table.
#
# Add to crontab (crontab -e):
#   */10 * * * * /home/todd/ai-news-nexus/pin-cleanup-cron.sh >> /var/log/pin-cleanup.log 2>&1

LOG="/var/log/pin-cleanup.log"

docker exec -i nexus-db psql -U nexus -d nexus << SQL
-- Deactivate expired pins
WITH expired AS (
    UPDATE "pin"
    SET active = false
    WHERE active = true AND expires_at < NOW()
    RETURNING id, article_id
)    
SELECT CONCAT(NOW(), ' — Deactivated ', COUNT(*), ' expired pins') AS result    FROM expired;    
SQL
