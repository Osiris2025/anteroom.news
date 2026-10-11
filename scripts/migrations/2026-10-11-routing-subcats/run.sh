#!/usr/bin/env bash
# Run the routing/subcategory data migration against the live DB on homelab1.
#   ./run.sh              dry run: read-only, prints the before/after summary
#   ./run.sh --apply      pg_dump backup first (pg-backup.sh), then one transaction
# It runs in a throwaway container from the engine image with this checkout
# mounted read-only, so it works before or after the engine is redeployed and
# never touches the running containers. Secrets are read from the running
# nexus-engine container's environment and passed by name (never printed).
set -euo pipefail
REPO=$(cd "$(dirname "$0")/../../.." && pwd)
MIG=scripts/migrations/2026-10-11-routing-subcats
IMAGE=${ENGINE_IMAGE:-ai-news-nexus-engine}
NETWORK=${DB_NETWORK:-ai-news-nexus_default}

if [[ " $* " == *" --apply "* ]]; then
  echo "Backing up the database first..."
  "$REPO/pg-backup.sh"
fi

envof() { docker inspect nexus-engine --format '{{range .Config.Env}}{{println .}}{{end}}' | sed -n "s/^$1=//p" | head -1; }
DATABASE_URL=$(envof DATABASE_URL); export DATABASE_URL
OPENROUTER_API_KEY=$(envof OPENROUTER_API_KEY); export OPENROUTER_API_KEY

mkdir -p "$REPO/backups"
docker run --rm --network "$NETWORK" \
  -e DATABASE_URL -e OPENROUTER_API_KEY \
  -e ROUTING_RULES_PATH=/w/frontend/src/lib/routing-rules.json \
  -e SUBCATEGORIES_PATH=/w/frontend/src/lib/subcategories.json \
  -v "$REPO":/w:ro -v "$REPO/backups":/out \
  "$IMAGE" python "/w/$MIG/migrate.py" --log "/out/routing-migration-$(date +%Y%m%d-%H%M%S).csv" "$@"
