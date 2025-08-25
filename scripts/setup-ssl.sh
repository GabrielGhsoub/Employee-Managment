#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

error_exit() {
    echo -e "${RED}ERROR: $1${NC}" >&2
    exit 1
}

success() {
    echo -e "${GREEN}SUCCESS: $1${NC}"
}

warning() {
    echo -e "${YELLOW}WARNING: $1${NC}"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   error_exit "This script must be run as root"
fi

# Check if domain is provided
if [ -z "$1" ]; then
    error_exit "Please provide your domain name as argument: ./setup-ssl.sh yourdomain.com"
fi

DOMAIN="$1"
EMAIL="${2:-admin@$DOMAIN}"

log "Setting up SSL certificate for domain: $DOMAIN"
log "Using email: $EMAIL"

# Install snapd if not present
if ! command -v snap &> /dev/null; then
    log "Installing snapd..."
    apt update
    apt install -y snapd
    success "snapd installed"
fi

# Install certbot via snap (recommended method)
if ! command -v certbot &> /dev/null; then
    log "Installing certbot..."
    snap install core; snap refresh core
    snap install --classic certbot
    ln -sf /snap/bin/certbot /usr/bin/certbot
    success "certbot installed"
fi

# Stop nginx temporarily for certificate generation
log "Stopping nginx for certificate generation..."
systemctl stop nginx

# Generate SSL certificate
log "Generating SSL certificate for $DOMAIN..."
if ! certbot certonly --standalone \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN" \
    -d "www.$DOMAIN"; then
    error_exit "Failed to generate SSL certificate"
fi

success "SSL certificate generated successfully"

# Update Nginx configuration for SSL
log "Updating Nginx configuration for SSL..."
cat > /etc/nginx/sites-available/employee-management << EOF
# HTTP redirect to HTTPS
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

# HTTPS server configuration
server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # SSL security settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_session_timeout 1d;
    ssl_session_cache shared:MozTLS:10m;
    ssl_session_tickets off;
    
    # OCSP stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/letsencrypt/live/$DOMAIN/chain.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options SAMEORIGIN always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self';" always;
    
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
    
    # Security.txt
    location /.well-known/security.txt {
        return 200 "Contact: mailto:$EMAIL";
        add_header Content-Type text/plain;
    }
}
EOF

# Test nginx configuration
if ! nginx -t; then
    error_exit "Nginx configuration test failed"
fi

# Start nginx
systemctl start nginx
systemctl reload nginx
success "Nginx configured and restarted with SSL"

# Setup automatic certificate renewal
log "Setting up automatic certificate renewal..."
if ! crontab -l | grep -q certbot; then
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet --nginx") | crontab -
    success "Automatic certificate renewal configured"
fi

# Test certificate renewal
log "Testing certificate renewal..."
certbot renew --dry-run

success "SSL setup completed successfully!"
echo ""
echo "=== SSL Configuration Summary ==="
echo "Domain: $DOMAIN"
echo "Certificate: /etc/letsencrypt/live/$DOMAIN/fullchain.pem"
echo "Private Key: /etc/letsencrypt/live/$DOMAIN/privkey.pem"
echo "Auto-renewal: Configured (runs daily at 12:00)"
echo ""
echo "Your site should now be accessible at:"
echo "https://$DOMAIN"
echo "https://www.$DOMAIN"
echo ""
echo "Certificate expires: $(openssl x509 -enddate -noout -in /etc/letsencrypt/live/$DOMAIN/cert.pem | cut -d= -f2)"