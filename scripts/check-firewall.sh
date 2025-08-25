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

success() {
    echo -e "${GREEN}SUCCESS: $1${NC}"
}

warning() {
    echo -e "${YELLOW}WARNING: $1${NC}"
}

error() {
    echo -e "${RED}ERROR: $1${NC}"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   error "This script must be run as root"
   exit 1
fi

log "Checking firewall configuration and network connectivity..."

# Check if ufw is active
if command -v ufw &> /dev/null; then
    log "UFW firewall detected"
    ufw status verbose
    
    # Ensure required ports are open
    log "Ensuring required ports are open..."
    ufw allow 22/tcp comment "SSH"
    ufw allow 80/tcp comment "HTTP"
    ufw allow 443/tcp comment "HTTPS"
    
    success "UFW configured for HTTP and HTTPS traffic"
else
    log "UFW not found, checking iptables..."
fi

# Check iptables rules
log "Current iptables rules:"
iptables -L -n

# Check if ports are listening
log "Checking listening ports..."
netstat -tlnp | grep -E ":(22|80|443|3000|8080)"

# Check nginx status and configuration
log "Checking Nginx status..."
if systemctl is-active --quiet nginx; then
    success "Nginx is running"
    nginx -t && success "Nginx configuration is valid"
else
    error "Nginx is not running"
    systemctl status nginx
fi

# Test local connectivity
log "Testing local connectivity..."
curl -I http://127.0.0.1 && success "HTTP localhost works" || warning "HTTP localhost failed"
curl -I https://127.0.0.1 --insecure && success "HTTPS localhost works" || warning "HTTPS localhost failed"

# Test external connectivity (if domain is provided)
if [ ! -z "$1" ]; then
    DOMAIN="$1"
    log "Testing external connectivity to $DOMAIN..."
    
    # Test DNS resolution
    if nslookup "$DOMAIN" > /dev/null 2>&1; then
        success "DNS resolution works for $DOMAIN"
        nslookup "$DOMAIN"
    else
        warning "DNS resolution failed for $DOMAIN"
    fi
    
    # Test HTTP
    if curl -I "http://$DOMAIN" --connect-timeout 10 --max-time 20; then
        success "HTTP connection to $DOMAIN works"
    else
        warning "HTTP connection to $DOMAIN failed"
    fi
    
    # Test HTTPS
    if curl -I "https://$DOMAIN" --connect-timeout 10 --max-time 20; then
        success "HTTPS connection to $DOMAIN works"
    else
        warning "HTTPS connection to $DOMAIN failed"
    fi
fi

# Check SSL certificates
if [ -d "/etc/letsencrypt/live" ]; then
    log "Checking SSL certificates..."
    for cert_dir in /etc/letsencrypt/live/*/; do
        if [ -d "$cert_dir" ]; then
            domain=$(basename "$cert_dir")
            log "Certificate for $domain:"
            openssl x509 -in "$cert_dir/cert.pem" -noout -dates -subject 2>/dev/null || warning "Could not read certificate for $domain"
        fi
    done
fi

log "Firewall and connectivity check completed!"