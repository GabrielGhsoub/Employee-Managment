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
backend_needs_build=false
frontend_needs_build=false

if [ -d "packages/backend" ]; then
    if [ -d "packages/backend/dist" ] && [ "$(ls -A packages/backend/dist 2>/dev/null)" ]; then
        log "Backend build artifacts found, skipping build step"
        success "Backend build skipped (artifacts present)"
    else
        log "Backend needs building"
        backend_needs_build=true
    fi
fi

if [ -d "packages/frontend" ]; then
    if [ -d "packages/frontend/dist" ] && [ "$(ls -A packages/frontend/dist 2>/dev/null)" ]; then
        log "Frontend build artifacts found, skipping build step"
        success "Frontend build skipped (artifacts present)"
    else
        log "Frontend needs building"
        frontend_needs_build=true
    fi
fi

# If building is needed, install ALL dependencies (including dev) first
if [ "$backend_needs_build" = true ] || [ "$frontend_needs_build" = true ]; then
    log "Installing all dependencies (including dev) for building..."
    # Install ALL dependencies, not just production
    pnpm install --frozen-lockfile
    success "All dependencies installed for building"
    
    if [ "$backend_needs_build" = true ]; then
        log "Building backend..."
        # Verify nest CLI is available
        if [ -f "packages/backend/node_modules/.bin/nest" ]; then
            log "NestJS CLI found in local node_modules"
        else
            log "Installing NestJS CLI globally as fallback..."
            npm install -g @nestjs/cli
        fi
        
        cd packages/backend
        # Try to use local nest first, fallback to global
        if [ -f "node_modules/.bin/nest" ]; then
            ./node_modules/.bin/nest build
        else
            nest build
        fi
        cd "$APP_DIR/current"
        success "Backend built"
    fi
    
    if [ "$frontend_needs_build" = true ]; then
        log "Building frontend..."
        pnpm --filter frontend build
        success "Frontend built"
    fi
    
    # After building, remove dev dependencies to save space
    log "Removing development dependencies..."
    pnpm prune --prod
    success "Development dependencies removed"
else
    log "All build artifacts present, installing production dependencies only..."
    pnpm install --prod --frozen-lockfile
    success "Production dependencies installed"
fi

# Install PM2 if not present
if ! command -v pm2 &> /dev/null; then
    log "Installing PM2..."
    npm install -g pm2
    success "PM2 installed"
fi

# Install serve if not present (for frontend)
if ! command -v serve &> /dev/null; then
    log "Installing serve..."
    npm install -g serve
    success "serve installed"
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
    
    # Setup environment file
    if [ ! -f ".env" ]; then
        if [ -f ".env.production" ]; then
            cp .env.production .env
            log "Using .env.production for backend configuration"
        else
            warning "No production environment file found"
        fi
    fi
    
    # Start with PM2
    pm2 start dist/main.js \
        --name employee-backend \
        --restart-delay=3000 \
        --max-memory-restart 500M \
        --log /var/log/employee-management/backend.log \
        --error /var/log/employee-management/backend-error.log
    
    cd "$APP_DIR/current"
    
    # Wait a bit for the service to start
    sleep 5
    
    health_check "Backend" "http://127.0.0.1:3000/api/health"
fi

# Start frontend if built
if [ -d "packages/frontend/dist" ]; then
    log "Starting frontend service..."
    
    cd packages/frontend
    pm2 start serve \
        --name employee-frontend \
        -- -s dist -l 8080 \
        --max-memory-restart 200M \
        --log /var/log/employee-management/frontend.log \
        --error /var/log/employee-management/frontend-error.log
    
    cd "$APP_DIR/current"
    
    # Wait a bit for the service to start
    sleep 5
    
    health_check "Frontend" "http://127.0.0.1:8080"
fi

# Save PM2 configuration
pm2 save
pm2 startup systemd -u root --hp /root || true

# Setup log rotation
log "Setting up log rotation..."
cat > /etc/logrotate.d/employee-management << EOF
/var/log/employee-management/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        pm2 reloadLogs >/dev/null 2>&1 || true
    endscript
}
EOF

# Setup nginx if not already configured
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
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
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
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check endpoint
    location /api/health {
        proxy_pass http://127.0.0.1:3000/api/health;
        access_log off;
    }
}
EOF

# Enable the site if not already enabled
if [ ! -L /etc/nginx/sites-enabled/employee-management ]; then
    ln -sf /etc/nginx/sites-available/employee-management /etc/nginx/sites-enabled/
fi

# Remove default site if it exists
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
nginx -t || error_exit "Nginx configuration test failed"

# Enable and restart nginx
systemctl enable nginx
systemctl restart nginx
success "Nginx configured and (re)started"

# Final health check
log "Performing final health checks..."
sleep 5

# Check PM2 services
if ! pm2 list | grep -q "employee-backend.*online"; then
    warning "Backend service is not running"
    pm2 logs employee-backend --lines 20 --nostream
fi

if ! pm2 list | grep -q "employee-frontend.*online"; then
    warning "Frontend service is not running"
    pm2 logs employee-frontend --lines 20 --nostream
fi

# Check nginx
if ! systemctl is-active --quiet nginx; then
    warning "Nginx is not running"
    systemctl status nginx
fi

# Final application health check through Nginx
if curl -f --silent --output /dev/null "http://$SERVER_IP/api/health"; then
    success "Application is healthy and accessible"
else
    warning "Application health check failed - checking individual services..."
    
    # Debug individual services
    echo "Backend direct check:"
    curl -I http://127.0.0.1:3000/api/health || true
    
    echo "Frontend direct check:"
    curl -I http://127.0.0.1:8080 || true
    
    echo "PM2 status:"
    pm2 list
fi

log "Deployment completed!"
success "Application should be accessible at http://$SERVER_IP"

# Show current status
echo ""
echo "=== Current Service Status ==="
pm2 list
echo ""
echo "=== Recent Logs ==="
pm2 logs --lines 10 --nostream