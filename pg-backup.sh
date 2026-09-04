#!/bin/bash
# pg-backup.sh — Daily Postgres backup for AI News Nexus
# Backup only (no rotation). Run daily: 0 7 * * *
BACKUP_DIR="/home/todd/ai-news-nexus/backups"
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
FILENAME="${BACKUP_DIR}/nexus-${TIMESTAMP}.sql.gz"
docker exec nexus-db pg_dump -U nexus nexus | gzip > "$FILENAME"
if [ $? -ne 0 ]; then
    echo "[$(date)] ERROR: pg_dump failed" >&2
    exit 1
fi
gunzip -t "$FILENAME" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "[$(date)] ERROR: backup corrupt" >&2
    exit 1
fi
echo "[$(date)] OK: $(du -h "$FILENAME" | cut -f1)"
exit 0