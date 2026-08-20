#!/bin/bash
# AI News Nexus — daily cron script
# Runs the engine pipeline, then triggers email digest generation.
# This is owned by todd and runs from the user crontab.

set -e

cd /home/todd/ai-news-nexus

echo "[nexus-daily] Running engine pipeline..."
/usr/bin/docker exec nexus-engine python -c "from engine.pipeline import run_pipeline; run_pipeline()"
PIPELINE_EXIT=$?
echo "[nexus-daily] Pipeline exit code: $PIPELINE_EXIT"

# Read CRON_SECRET from .env
CRON_SECRET=$(grep '^CRON_SECRET=' /home/todd/ai-news-nexus/.env | head -1 | cut -d= -f2-)

if [ -n "$CRON_SECRET" ]; then
  echo "[nexus-daily] Triggering email digest generation..."
  /usr/bin/curl -sf "http://localhost:3001/api/digest/generate?key=$CRON_SECRET&frequency=daily" || echo "[nexus-daily] Digest trigger returned non-zero (non-fatal)"
else
  echo "[nexus-daily] No CRON_SECRET set, skipping digest"
fi

echo "[nexus-daily] Done."