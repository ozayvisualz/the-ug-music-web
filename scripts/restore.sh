#!/bin/sh
set -e

if [ -z "$1" ]; then
    echo "Usage: restore.sh <backup-file>"
    echo "Available backups:"
    ls -la /backups/
    exit 1
fi

BACKUP_FILE="$1"
DB_NAME="ugmusic"
DB_USER="ugmusic"

echo "[$(date)] Restoring database from $BACKUP_FILE..."
pg_restore -U "$DB_USER" -d "$DB_NAME" -c --if-exists "$BACKUP_FILE"

echo "[$(date)] Restore completed."
