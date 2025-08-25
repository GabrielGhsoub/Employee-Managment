#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
APP_DIR="/opt/employee-management"
BACKUP_DIR="/opt/backups/employee-management"
LOG_FILE="/var/log/employee-management-deploy.log"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

error_exit() {
    echo -e "${RED}ERROR: $1${NC}" >&2
    log "ERROR: $1"
    exit 1
}

success() {
    echo -e "${GREEN}SUCCESS: $1${NC}"
    log "SUCCESS: $1"
}

warning() {
    echo -e "${YELLOW}WARNING: $1${NC}"
    log "WARNING: $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   error_exit "This script must be run as root"
fi

# Show available backups
echo "Available backups:"
ls -la "$BACKUP_DIR" 2>/dev/null || error_exit "No backups found in $BACKUP_DIR"

# Get the most recent backup or allow user to specify
if [ -n "$1" ]; then
    BACKUP_NAME="$1"
else
    BACKUP_NAME=$(ls -1t "$BACKUP_DIR" | head -n1)
    warning "Using most recent backup: $BACKUP_NAME"
fi

BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

if [ ! -d "$BACKUP_PATH" ]; then
    error_exit "Backup not found: $BACKUP_PATH"
fi

log "Starting rollback to backup: $BACKUP_NAME"

# Stop current services
log "Stopping current services..."
pm2 stop employee-backend 2>/dev/null || true
pm2 stop employee-frontend 2>/dev/null || true

# Create rollback backup of current state
if [ -d "$APP_DIR/current" ]; then
    ROLLBACK_BACKUP="rollback-$(date +%Y%m%d-%H%M%S)"
    cp -r "$APP_DIR/current" "$BACKUP_DIR/$ROLLBACK_BACKUP"
    log "Created rollback backup: $ROLLBACK_BACKUP"
fi

# Restore from backup
log "Restoring from backup..."
rm -rf "$APP_DIR/current"
cp -r "$BACKUP_PATH" "$APP_DIR/current"
cd "$APP_DIR/current"

# Install dependencies
log "Installing dependencies..."
pnpm install --frozen-lockfile --prod

# Start services
log "Starting services..."

# Start backend
if [ -d "packages/backend" ]; then
    cd packages/backend
    pm2 start dist/main.js --name employee-backend --restart-delay=3000
    cd "$APP_DIR/current"
fi

# Start frontend
if [ -d "packages/frontend/dist" ]; then
    cd packages/frontend
    pm2 start serve --name employee-frontend -- -s dist -l 80
    cd "$APP_DIR/current"
fi

# Save PM2 configuration
pm2 save

# Health check
log "Performing health check..."
sleep 10

if curl -f http://localhost/health &>/dev/null; then
    success "Rollback completed successfully!"
    success "Application is healthy at http://207.180.197.168"
else
    error_exit "Rollback failed - application is not healthy"
fi

log "Rollback to $BACKUP_NAME completed successfully"