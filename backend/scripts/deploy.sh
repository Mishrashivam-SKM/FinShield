#!/bin/bash
# Deployment Automation Script

APP_DIR="/opt/finshield"

echo "Deploying FinShield application..."
cd $APP_DIR

echo "Pulling latest code..."
# git pull origin main (simulated)

echo "Rebuilding containers..."
docker compose build

echo "Restarting services..."
docker compose up -d

echo "Cleaning up..."
docker system prune -f

echo "Deployment complete."
