#!/bin/bash
# System Resource Monitor Script

TIMESTAMP=$(date)
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
MEM_USAGE=$(free -m | awk '/Mem:/ { printf("%.2f"), $3/$2*100 }')
DISK_USAGE=$(df -h / | awk '/\// {print $(NF-1)}')

echo "[$TIMESTAMP] CPU: ${CPU_USAGE}% | Mem: ${MEM_USAGE}% | Disk: ${DISK_USAGE}"
docker ps --format "[$TIMESTAMP] Container {{.Names}} is {{.Status}}"
