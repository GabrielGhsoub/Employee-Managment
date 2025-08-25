#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/opt/employee-management"
BACKUP_DIR="/opt/backups/employee-management"
LOG_FILE="/var/log/employee-management-deploy.log"
SERVER_IP="${SERVER_IP:-127.0.0.1}"

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

log "Starting deployment process..."

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup current deployment if it exists
if [ -d "$APP_DIR/current" ]; then
    log "Creating backup of current deployment..."
    BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
    rsync -a --delete "$APP_DIR/current/" "$BACKUP_DIR/$BACKUP_NAME/"
    success "Backup created: $BACKUP_DIR/$BACKUP_NAME"
fi

# Ensure the 'current' directory exists
mkdir -p "$APP_DIR/current"

cd "$APP_DIR/current"

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    log "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    success "Node.js installed"
fi

# Install pnpm if not present
if ! command -v pnpm &> /dev/null; then
    log "Installing pnpm..."
    npm install -g pnpm@10.15.0
    success "pnpm installed"
fi

# Check for build artifacts and build if needed
build_needed=false

if [ -d "packages/backend" ]; then
    if [ -d "packages/backend/dist" ] && [ "$(ls -A packages/backend/dist 2>/dev/null)" ]; then
        log "Backend build artifacts found, skipping build step"
        success "Backend build skipped (artifacts present)"
    else
        log "Backend needs building"
        build_needed=true
    fi
fi

if [ -d "packages/frontend" ]; then
    if [ -d "packages/frontend/dist" ] && [ "$(ls -A packages/frontend/dist 2>/dev/null)" ]; then
        log "Frontend build artifacts found, skipping build step"
        success "Frontend build skipped (artifacts present)"
    else
        log "Frontend needs building"
        build_needed=true
    fi
fi

# If building is needed, install all dependencies first
if [ "$build_needed" = true ]; then
    log "Installing all dependencies (including dev) for building..."
    pnpm install --frozen-lockfile
    success "All dependencies installed for building"
    
    if [ -d "packages/backend" ] && [ ! -d "packages/backend/dist" ]; then
        log "Building backend..."
        pnpm --filter backend build
        success "Backend built"
    fi
    
    if [ -d "packages/frontend" ] && [ ! -d "packages/frontend/dist" ]; then
        log "Building frontend..."
        pnpm --filter frontend build
        success "Frontend built"
    fi
else
    log "All build artifacts present, skipping build process"
fi

# Install only production dependencies for the final artifact
log "Installing production dependencies..."
pnpm install --prod --frozen-lockfile
success "Production dependencies installed"


# Install PM2 if not present
if ! command -v pm2 &> /dev/null; then
    log "Installing PM2..."
    npm install -g pm2
    success "PM2 installed"
fi

# Stop and delete old processes to ensure a clean start
log "Stopping existing processes..."
pm2 stop employee-backend 2>/dev/null || true
pm2 stop employee-frontend 2>/dev/null || true
pm2 delete employee-backend 2>/dev/null || true
pm2 delete employee-frontend 2>/dev/null || true


# Health check function
health_check() {
    local service=$1
    local url=$2
    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -f --silent --output /dev/null "$url"; then
            success "$service health check passed"
            return 0
        fi
        log "Health check attempt $attempt/$max_attempts for $service..."
        sleep 2
        ((attempt++))
    done

    error_exit "$service health check failed after $max_attempts attempts"
}

# Start backend if it exists
if [ -d "packages/backend/dist" ]; then
    log "Starting backend service..."
    cd packages/backend
    
    if [ ! -f ".env" ]; then
        cp .env.production .env 2>/dev/null || warning "No production environment file found"
    fi
    
    pm2 start dist/main.js --name employee-backend --restart-delay=3000
    cd "$APP_DIR/current"
    
    health_check "Backend" "http://127.0.0.1:3000/api/health"
fi

# Start frontend with serve if built
if [ -d "packages/frontend/dist" ]; then
    log "Starting frontend service..."
    
    if ! command -v serve &> /dev/null; then
        npm install -g serve
    fi
    
    cd packages/frontend
    pm2 start serve --name employee-frontend -- -s dist -l 8080
    cd "$APP_DIR/current"
    
    health_check "Frontend" "http://127.0.0.1:8080"
fi


# Save PM2 configuration
pm2 save
pm2 startup

# Setup log rotation
log "Setting up log rotation..."
cat > /etc/logrotate.d/employee-management << EOF
/var/log/employee-management-deploy.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 root root
}
EOF

# Setup nginx
if ! command -v nginx &> /dev/null; then
    log "Installing nginx..."
    apt-get update
    apt-get install -y nginx
fi

log "Configuring Nginx..."
cat > /etc/nginx/sites-available/employee-management << EOF
server {
    listen 80;
    server_name $SERVER_IP;
    
    # Security headers
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # Frontend
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Health check endpoint
    location /api/health {
        proxy_pass http://127.0.0.1:3000/api/health;
        access_log off;
    }
}
EOF

if [ ! -L /etc/nginx/sites-enabled/employee-management ]; then
    ln -sf /etc/nginx/sites-available/employee-management /etc/nginx/sites-enabled/
fi
rm -f /etc/nginx/sites-enabled/default

nginx -t || error_exit "Nginx configuration test failed"
systemctl enable nginx
systemctl restart nginx
success "Nginx configured and (re)started"

# Final health check
log "Performing final health checks..."
sleep 5

if ! pm2 list | grep -q "employee-backend.*online"; then
    warning "Backend service is not running"
fi

if ! pm2 list | grep -q "employee-frontend.*online"; then
    warning "Frontend service is not running"
fi

if ! systemctl is-active --quiet nginx; then
    warning "Nginx is not running"
fi

# Use the public IP for the final check through Nginx
if curl -f --silent --output /dev/null "http://$SERVER_IP/api/health"; then
    success "Application is healthy and accessible"
else
    warning "Application health check failed - manual intervention may be required"
fi

log "Deployment completed successfully!"
success "Application deployed to http://$SERVER_IP"

log "Current running services:"
pm2 list