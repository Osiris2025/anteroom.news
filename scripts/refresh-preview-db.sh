#!/bin/bash
# Refresh nexus_preview from the latest nightly dump (or a given file). Live DB never touched.
set -e
DUMP=${1:-$(ls -t /home/todd/anteroom/backups/nexus-*.sql.gz | head -1)}
echo "restoring $DUMP -> nexus_preview"
docker exec nexus-db psql -U nexus -d postgres -qc "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='nexus_preview' AND pid<>pg_backend_pid()"
docker exec nexus-db psql -U nexus -d postgres -qc "DROP DATABASE IF EXISTS nexus_preview"
docker exec nexus-db psql -U nexus -d postgres -qc "CREATE DATABASE nexus_preview OWNER nexus"
gunzip -c "$DUMP" | docker exec -i nexus-db psql -U nexus -d nexus_preview -q
echo "done: $(docker exec nexus-db psql -U nexus -d nexus_preview -Atc 'select count(*) from article') articles"
