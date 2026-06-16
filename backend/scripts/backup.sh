#!/bin/bash
# Database Backup Script

BACKUP_DIR="/opt/finshield/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
CONTAINER="finshield-db"
DB_USER="root"
DB_PASS="finshield_root_pass"
DB_NAME="finshield"

mkdir -p $BACKUP_DIR

echo "Starting backup of $DB_NAME at $TIMESTAMP"
docker exec $CONTAINER mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > $BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql

if [ $? -eq 0 ]; then
  echo "Backup successful: ${DB_NAME}_${TIMESTAMP}.sql"
else
  echo "Backup failed"
  exit 1
fi
