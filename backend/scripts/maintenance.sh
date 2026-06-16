#!/bin/bash
# Routine maintenance script

LOG_DIR="/var/log/finshield"
BACKUP_DIR="/opt/finshield/backups"

echo "Starting weekly maintenance..."

# Clear old logs
echo "Rotating logs..."
find $LOG_DIR -name "*.log" -mtime +30 -exec rm {} \;

# Clear old backups (keep last 7 days)
echo "Cleaning old backups..."
find $BACKUP_DIR -name "*.sql" -mtime +7 -exec rm {} \;

# Prune docker
echo "Pruning docker unused data..."
docker system prune -af --volumes

echo "Maintenance complete."
