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
    cp -r "$APP_DIR/current" "$BACKUP_DIR/$BACKUP_NAME"
    success "Backup created: $BACKUP_DIR/$BACKUP_NAME"
fi

# Create application directory structure
mkdir -p "$APP_DIR"/{current,releases,logs}

cd "$APP_DIR"

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

# Install dependencies
log "Installing dependencies..."
pnpm install --frozen-lockfile --prod
success "Dependencies installed"

# Build applications if source is available
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

# Install PM2 if not present
if ! command -v pm2 &> /dev/null; then
    log "Installing PM2..."
    npm install -g pm2
    success "PM2 installed"
fi

# Stop existing processes
log "Stopping existing processes..."
pm2 stop employee-backend 2>/dev/null || true
pm2 stop employee-frontend 2>/dev/null || true

# Health check function
health_check() {
    local service=$1
    local port=$2
    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -f "http://$SERVER_IP:$port" &>/dev/null; then
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
    
    # Copy environment file if it doesn't exist
    if [ ! -f ".env" ]; then
        cp .env.production .env 2>/dev/null || warning "No production environment file found"
    fi
    
    pm2 start dist/main.js --name employee-backend --restart-delay=3000
    cd "$APP_DIR"
    
    # Health check for backend
    health_check "Backend" 3000
fi

# Start frontend with serve if built
if [ -d "packages/frontend/dist" ]; then
    log "Starting frontend service..."
    
    # Install serve if not present
    if ! command -v serve &> /dev/null; then
        npm install -g serve
    fi
    
    cd packages/frontend
    pm2 start serve --name employee-frontend -- -s dist -l 80
    cd "$APP_DIR"
    
    # Health check for frontend
    health_check "Frontend" 80
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

# Setup nginx if not present
if ! command -v nginx &> /dev/null; then
    log "Installing nginx..."
    apt-get update
    apt-get install -y nginx
    
    # Configure nginx
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
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
EOF

    # Enable site
    ln -sf /etc/nginx/sites-available/employee-management /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Test nginx configuration
    nginx -t || error_exit "Nginx configuration test failed"
    
    # Start nginx
    systemctl enable nginx
    systemctl restart nginx
    
    success "Nginx configured and started"
fi

# Final health check
log "Performing final health checks..."
sleep 5

# Check if services are running
if ! pm2 list | grep -q "employee-backend.*online"; then
    warning "Backend service is not running"
fi

if ! pm2 list | grep -q "employee-frontend.*online"; then
    warning "Frontend service is not running"
fi

# Check nginx
if ! systemctl is-active --quiet nginx; then
    warning "Nginx is not running"
fi

# Final application health check
if curl -f "http://$SERVER_IP/health" &>/dev/null; then
    success "Application is healthy and accessible"
else
    warning "Application health check failed - manual intervention may be required"
fi

log "Deployment completed successfully!"
success "Application deployed to http://$SERVER_IP"

# Display running services
log "Current running services:"
pm2 list
systemctl status nginx --no-pager -l