#!/bin/bash
set -e

BACKUP_DIR="/root/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
MONGO_URI="${MONGODB_URI:-mongodb://admin:password123@localhost:27017/boss478?authSource=admin}"

mkdir -p "$BACKUP_DIR/$TIMESTAMP"

echo "[$TIMESTAMP] Starting backup..."

# Dump MongoDB
echo "Dumping MongoDB..."
docker exec $(docker ps -qf "name=mongo") mongodump \
    --uri="$MONGO_URI" \
    --out="/tmp/mongo_backup" \
    && docker cp $(docker ps -qf "name=mongo"):/tmp/mongo_backup "$BACKUP_DIR/$TIMESTAMP/mongo" \
    && docker exec $(docker ps -qf "name=mongo") rm -rf /tmp/mongo_backup \
    || echo "MongoDB dump failed, continuing..."

# Archive uploads volume
echo "Archiving uploads..."
docker run --rm -v uploads:/uploads -v "$BACKUP_DIR/$TIMESTAMP":/backup alpine \
    tar czf /backup/uploads.tar.gz -C /uploads . 2>/dev/null || echo "Uploads archive failed, continuing..."

# Rotate: keep last 7 days
echo "Rotating old backups..."
find "$BACKUP_DIR" -maxdepth 1 -type d -mtime +7 -exec rm -rf {} \; 2>/dev/null || true

echo "[$TIMESTAMP] Backup complete: $BACKUP_DIR/$TIMESTAMP"
ls -la "$BACKUP_DIR/$TIMESTAMP"