#!/bin/bash

# Server Initial Setup Script for Ubuntu
# Run this on your Ubuntu server as root: curl -sSL https://raw.githubusercontent.com/yourusername/employee-management/main/scripts/server-setup.sh | bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error_exit() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
    exit 1
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   error_exit "This script must be run as root"
fi

log "Starting server setup for Employee Management System..."

# Update system
log "Updating system packages..."
apt-get update -y
apt-get upgrade -y

# Install essential packages
log "Installing essential packages..."
apt-get install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release ufw fail2ban logrotate

# Install Node.js 20
log "Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install pnpm
log "Installing pnpm..."
npm install -g pnpm@10.15.0

# Install PM2
log "Installing PM2..."
npm install -g pm2

# Install Docker
log "Installing Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start and enable Docker
systemctl start docker
systemctl enable docker

# Install Docker Compose
log "Installing Docker Compose..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install Nginx
log "Installing Nginx..."
apt-get install -y nginx

# Configure firewall
log "Configuring firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw allow 3000/tcp  # Backend
ufw --force enable

# Configure fail2ban
log "Configuring fail2ban..."
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
EOF

systemctl enable fail2ban
systemctl start fail2ban

# Create application directories
log "Creating application directories..."
mkdir -p /opt/employee-management
mkdir -p /opt/backups/employee-management
mkdir -p /var/log/employee-management

# Create deploy user (optional - for non-root deployments)
log "Creating deploy user..."
useradd -m -s /bin/bash deploy
usermod -aG docker deploy
mkdir -p /home/deploy/.ssh
chmod 700 /home/deploy/.ssh

# Set up log rotation
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
        systemctl reload nginx > /dev/null 2>&1 || true
    endscript
}
EOF

# Configure system limits
log "Configuring system limits..."
cat >> /etc/security/limits.conf << EOF
# Employee Management System limits
* soft nofile 65536
* hard nofile 65536
* soft nproc 65536
* hard nproc 65536
EOF

# Configure sysctl for better performance
log "Optimizing system parameters..."
cat >> /etc/sysctl.conf << EOF
# Employee Management System optimizations
vm.max_map_count=262144
fs.file-max=2097152
net.core.somaxconn=65535
net.ipv4.tcp_max_syn_backlog=65535
EOF

sysctl -p

# Install monitoring tools
log "Installing monitoring tools..."
apt-get install -y htop iotop nethogs ncdu

# Set up automatic security updates
log "Configuring automatic security updates..."
apt-get install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades

# Create basic nginx configuration
log "Creating basic nginx configuration..."
cat > /etc/nginx/sites-available/default << EOF
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    root /var/www/html;
    index index.html index.htm index.nginx-debian.html;
    
    server_name _;
    
    location / {
        return 200 'Server is ready for deployment!';
        add_header Content-Type text/plain;
    }
}
EOF

nginx -t && systemctl reload nginx

# Display summary
log "Server setup completed successfully!"
echo ""
echo "=== Setup Summary ==="
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"
echo "pnpm version: $(pnpm --version)"
echo "PM2 version: $(pm2 --version)"
echo "Docker version: $(docker --version)"
echo "Docker Compose version: $(docker-compose --version)"
echo "Nginx version: $(nginx -v 2>&1)"
echo ""
echo "=== Next Steps ==="
echo "1. Add your GitHub Actions SSH public key to /root/.ssh/authorized_keys"
echo "2. Test SSH connection from GitHub Actions"
echo "3. Deploy your application using the CI/CD pipeline"
echo ""
echo "=== Important Information ==="
echo "- Application will be deployed to: /opt/employee-management"
echo "- Backups will be stored in: /opt/backups/employee-management"
echo "- Logs will be stored in: /var/log/employee-management"
echo "- Firewall is enabled with ports 22, 80, 443, and 3000 open"
echo "- fail2ban is configured for SSH and Nginx protection"
echo ""
warning "Don't forget to:"
warning "1. Change default passwords"
warning "2. Configure SSH key authentication"
warning "3. Disable password authentication in SSH"
warning "4. Set up SSL certificates (Let's Encrypt recommended)"

log "Server is ready for Employee Management System deployment!"