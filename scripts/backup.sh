#!/bin/sh
set -e

BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="ugmusic"
DB_USER="ugmusic"

mkdir -p "$BACKUP_DIR"

# Database backup
echo "[$(date)] Starting database backup..."
pg_dump -U "$DB_USER" -d "$DB_NAME" -Fc -f "$BACKUP_DIR/db_$TIMESTAMP.dump"

# Keep only last 7 daily backups
find "$BACKUP_DIR" -name "db_*.dump" -mtime +7 -delete

# Upload to S3 (optional)
if [ -n "$S3_BACKUP_BUCKET" ]; then
    echo "[$(date)] Uploading to S3..."
    aws s3 cp "$BACKUP_DIR/db_$TIMESTAMP.dump" "s3://$S3_BACKUP_BUCKET/backups/db_$TIMESTAMP.dump"
fi

echo "[$(date)] Backup completed: db_$TIMESTAMP.dump"
