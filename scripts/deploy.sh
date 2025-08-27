#!/bin/bash

# Employee Management System Deployment Script
# 
# Usage Examples:
#   Basic deployment:     ./deploy.sh
#   With custom domain:   DOMAIN=empmanagement.online ./deploy.sh
#   With SSL setup:       DOMAIN=empmanagement.online SSL_EMAIL=admin@empmanagement.online ./deploy.sh
#   Full production:      DOMAIN=empmanagement.online SSL_EMAIL=admin@empmanagement.online USE_HTTPS=true ./deploy.sh
#
# This script will:
# 1. Pull latest code from git
# 2. Make all scripts executable
# 3. Install dependencies and build applications
# 4. Deploy with PM2 and Nginx
# 5. Setup SSL certificate (if SSL_EMAIL provided)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/opt/employee-management"
LOG_FILE="/var/log/employee-management-deploy.log"
SERVER_IP="${SERVER_IP:-127.0.0.1}"
DOMAIN="${DOMAIN:-$SERVER_IP}"
USE_HTTPS="${USE_HTTPS:-false}"
SSL_EMAIL="${SSL_EMAIL:-}"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Display configuration
log "Deployment Configuration:"
log "  APP_DIR: $APP_DIR"
log "  DOMAIN: $DOMAIN"
log "  SSL_EMAIL: ${SSL_EMAIL:-'not set'}"
log "  USE_HTTPS: $USE_HTTPS"

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

# Ensure the 'current' directory exists
mkdir -p "$APP_DIR/current"

cd "$APP_DIR/current"

# Pull latest code from repository
log "Pulling latest code from repository..."
if [ -d ".git" ]; then
    git reset --hard origin/main
    git pull origin main
    success "Code updated from repository"
else
    warning "Not a git repository - skipping git pull"
fi

# Make deployment scripts executable
log "Making deployment scripts executable..."
chmod +x scripts/*.sh 2>/dev/null || warning "No scripts directory found or chmod failed"
success "Scripts made executable"

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

# Always build both backend and frontend for fresh deployment
log "Installing all dependencies (including dev) for building..."
# Remove any existing node_modules to ensure clean install
rm -rf node_modules packages/*/node_modules 2>/dev/null || true
pnpm install --frozen-lockfile
success "All dependencies installed for building"

# Always build backend
if [ -d "packages/backend" ]; then
    log "Building backend..."
    if ! pnpm --filter backend build; then
        error_exit "Backend build failed"
    fi
    success "Backend built"
fi

# Always build frontend
if [ -d "packages/frontend" ]; then
    log "Building frontend..."
    if ! pnpm --filter frontend build; then
        error_exit "Frontend build failed"
    fi
    success "Frontend built"
fi

# After building, clean install production dependencies only
log "Cleaning and installing production dependencies..."
rm -rf node_modules packages/*/node_modules 2>/dev/null || true
pnpm install --prod --frozen-lockfile
success "Production dependencies installed"

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

# Clear PM2 cache and logs to prevent stale configurations
log "Clearing PM2 cache and logs..."
pm2 flush 2>/dev/null || warning "Failed to flush PM2 logs"
# Clear any cached module resolutions
rm -rf "$APP_DIR/current/node_modules/.cache" 2>/dev/null || true
rm -rf "$APP_DIR/current/packages/*/node_modules/.cache" 2>/dev/null || true
success "PM2 cache cleared"

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
    
    # Ensure backend package.json has correct module type
    if grep -q '"type": "module"' package.json; then
        log "Fixing backend package.json module type..."
        sed -i 's/"type": "module"/"type": "commonjs"/g' package.json
        success "Backend package.json module type fixed"
    fi
    
    # Setup environment file
    if [ ! -f ".env" ]; then
        if [ -f ".env.production" ]; then
            cp .env.production .env
            log "Using .env.production for backend configuration"
        else
            warning "No production environment file found"
        fi
    fi
    
    # Remove old main.cjs to ensure fresh deployment
    rm -f dist/main.cjs
    
    # Rename main.js to main.cjs to ensure CommonJS execution
    if [ -f "dist/main.js" ]; then
        log "Renaming main.js to main.cjs for CommonJS compatibility..."
        mv dist/main.js dist/main.cjs
        success "Backend main file renamed to .cjs"
    fi
    
    # Start with PM2 using .cjs file
    pm2 start dist/main.cjs \
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
    # Corrected PM2 command for the frontend
    pm2 start serve \
        --name employee-frontend \
        --max-memory-restart 200M \
        --log /var/log/employee-management/frontend.log \
        --error /var/log/employee-management/frontend-error.log \
        -- -s dist -l 8080
    
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
    server_name $DOMAIN;
    
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
HEALTH_URL="http://$DOMAIN/api/health"
if [ "$USE_HTTPS" = "true" ]; then
    HEALTH_URL="https://$DOMAIN/api/health"
fi

if curl -f --silent --output /dev/null "$HEALTH_URL"; then
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

# Setup SSL if domain is provided and not localhost
if [ "$DOMAIN" != "127.0.0.1" ] && [ "$DOMAIN" != "localhost" ] && [ -n "$SSL_EMAIL" ]; then
    log "Setting up SSL certificate..."
    if [ -f "scripts/setup-ssl.sh" ]; then
        chmod +x scripts/setup-ssl.sh
        ./scripts/setup-ssl.sh "$DOMAIN" "$SSL_EMAIL"
        success "SSL setup completed"
        USE_HTTPS="true"
    else
        warning "SSL setup script not found at scripts/setup-ssl.sh"
    fi
elif [ -z "$SSL_EMAIL" ]; then
    warning "SSL_EMAIL not provided - skipping SSL setup"
    log "To setup SSL later, run: SSL_EMAIL=your@email.com ./scripts/setup-ssl.sh $DOMAIN your@email.com"
else
    log "Skipping SSL setup for localhost/IP domain"
fi

APP_URL="http://$DOMAIN"
if [ "$USE_HTTPS" = "true" ]; then
    APP_URL="https://$DOMAIN"
fi
success "Application should be accessible at $APP_URL"

# Show current status
echo ""
echo "=== Current Service Status ==="
pm2 list
echo ""
echo "=== Recent Logs ==="
pm2 logs --lines 10 --nostream
echo ""
echo "=== Deployment Summary ==="
echo "Domain: $DOMAIN"
echo "HTTPS: $USE_HTTPS"
echo "Application URL: $APP_URL"
echo "Backend API: $APP_URL/api"
echo "Health Check: $APP_URL/api/health"
if [ "$USE_HTTPS" = "false" ] && [ "$DOMAIN" != "127.0.0.1" ] && [ "$DOMAIN" != "localhost" ]; then
    echo ""
    echo "💡 To enable HTTPS, run:"
    echo "SSL_EMAIL=your@email.com DOMAIN=$DOMAIN ./scripts/deploy.sh"
fi
