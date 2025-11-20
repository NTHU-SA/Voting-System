# Production Deployment Guide

This guide provides step-by-step instructions for deploying the NTHU Voting System to production.

## Prerequisites

### Infrastructure Requirements

1. **Application Server**
   - Linux server (Ubuntu 20.04+ or similar)
   - Docker and Docker Compose installed
   - 2GB+ RAM, 10GB+ disk space
   - Open ports: 80 (HTTP), 443 (HTTPS)

2. **MongoDB Instance**
   - MongoDB 6.0+
   - Accessible from application server
   - Authentication enabled
   - Regular backup configured

3. **Domain and SSL**
   - Domain name (e.g., voting.nthusa.tw)
   - SSL/TLS certificate (Let's Encrypt recommended)

4. **OAuth Credentials**
   - CCXP OAuth client ID and secret
   - Registered callback URL

## Deployment Steps

### 1. Prepare MongoDB

If you don't have a MongoDB instance, set one up:

```bash
# Example: MongoDB on separate server
# Install MongoDB 6.0
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Enable authentication
sudo mongosh
> use admin
> db.createUser({
    user: "admin",
    pwd: "STRONG_PASSWORD_HERE",
    roles: [ { role: "userAdminAnyDatabase", db: "admin" } ]
  })
> exit

# Create application database and user
sudo mongosh -u admin -p
> use voting_sa
> db.createUser({
    user: "voting_user",
    pwd: "STRONG_PASSWORD_HERE",
    roles: [ { role: "readWrite", db: "voting_sa" } ]
  })
> exit

# Enable auth in config
sudo nano /etc/mongod.conf
# Add:
# security:
#   authorization: enabled

# Restart MongoDB
sudo systemctl restart mongod
sudo systemctl enable mongod
```

### 2. Prepare Application Server

```bash
# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone repository
cd /opt
sudo git clone https://github.com/l7wei/Voting-New.git
cd Voting-New
```

### 3. Configure Environment

```bash
# Create production environment file
sudo nano .env.production

# Add the following (replace with your values):
```

```env
# MongoDB Connection
MONGODB_URI=mongodb://voting_user:YOUR_PASSWORD@mongodb-host:27017/voting_sa?authSource=voting_sa

# Security
TOKEN_SECRET=GENERATE_WITH_openssl_rand_base64_32

# OAuth Configuration
OAUTH_CLIENT_ID=your-ccxp-client-id
OAUTH_CLIENT_SECRET=your-ccxp-client-secret
OAUTH_AUTHORIZE=https://oauth.ccxp.nthu.edu.tw/v1.1/authorize.php
OAUTH_TOKEN_URL=https://oauth.ccxp.nthu.edu.tw/v1.1/token.php
OAUTH_RESOURCE_URL=https://oauth.ccxp.nthu.edu.tw/v1.1/resource.php
OAUTH_CALLBACK_URL=https://voting.nthusa.tw/api/auth/callback
OAUTH_SCOPE=userid name inschool uuid

# Application
NODE_ENV=production
PORT=3000
# External hostname for your application (without protocol)
# This is used for building OAuth callback URLs and other absolute URLs
APP_HOSTNAME=voting.nthusa.tw
```

```bash
# Generate strong secret
openssl rand -base64 32
# Copy the output and paste as TOKEN_SECRET value
```

**Important Notes:**
- `APP_HOSTNAME` should be your domain name without protocol (e.g., `voting.nthusa.tw`)
- `OAUTH_CALLBACK_URL` must match exactly what you registered with CCXP OAuth
- The application will automatically construct URLs using `https://` for production
- The `HOSTNAME="0.0.0.0"` in Docker is the bind address (internal), not the external hostname

### 4. Configure Voter and Admin Lists

```bash
# Edit voter list
sudo nano data/voterList.csv
# Add all eligible student IDs, one per line:
# student_id
# 110000001
# 110000002

# Edit admin list
sudo nano data/adminList.csv
# Add admin student IDs:
# student_id
# 108060001
```

### 5. Set Up Reverse Proxy (Nginx)

```bash
# Install Nginx
sudo apt-get install -y nginx certbot python3-certbot-nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/voting
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name voting.nthusa.tw;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/voting /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Obtain SSL certificate
sudo certbot --nginx -d voting.nthusa.tw
# Follow the prompts to configure HTTPS
```

### 6. Deploy Application

```bash
# Build and start the application
sudo docker-compose up -d

# Verify it's running
sudo docker-compose ps
sudo docker-compose logs -f app

# Test the application
curl http://localhost:3000
```

### 7. Configure Systemd Service (Optional)

Create a systemd service to auto-start on boot:

```bash
sudo nano /etc/systemd/system/voting-app.service
```

```ini
[Unit]
Description=NTHU Voting System
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/Voting-New
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl enable voting-app
sudo systemctl start voting-app
```

## Post-Deployment

### 1. Verify Deployment

- [ ] Access https://voting.nthusa.tw
- [ ] Test OAuth login flow
- [ ] Create a test activity (as admin)
- [ ] Submit a test vote
- [ ] Verify admin dashboard access
- [ ] Check logs for errors

### 2. Set Up Monitoring

```bash
# Monitor application logs
sudo docker-compose logs -f app

# Monitor system resources
htop

# Set up log rotation
sudo nano /etc/logrotate.d/voting-app
```

```
/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    size=10M
    missingok
    delaycompress
    copytruncate
}
```

### 3. Configure Backups

```bash
# Create backup script
sudo nano /opt/backup-voting-db.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups/mongodb"
mkdir -p $BACKUP_DIR

# Backup MongoDB
mongodump --uri="mongodb://voting_user:PASSWORD@mongodb-host:27017/voting_sa?authSource=voting_sa" --out=$BACKUP_DIR/backup_$DATE

# Keep only last 7 days
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} +

# Backup voter and admin lists
cp /opt/Voting-New/data/*.csv $BACKUP_DIR/backup_$DATE/
```

```bash
# Make executable
sudo chmod +x /opt/backup-voting-db.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
# Add: 0 2 * * * /opt/backup-voting-db.sh
```

### 4. Security Hardening

```bash
# Configure firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Secure MongoDB (if on same server)
sudo ufw allow from YOUR_APP_SERVER_IP to any port 27017

# Keep system updated
sudo apt-get update && sudo apt-get upgrade -y

# Set up fail2ban for SSH protection
sudo apt-get install -y fail2ban
sudo systemctl enable fail2ban
```

## Maintenance

### Update Application

```bash
cd /opt/Voting-New
sudo git pull
sudo docker-compose down
sudo docker-compose build
sudo docker-compose up -d
```

### View Logs

```bash
# Application logs
sudo docker-compose logs -f app

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Restart Services

```bash
# Restart application
sudo docker-compose restart app

# Restart all services
sudo docker-compose restart

# Restart Nginx
sudo systemctl restart nginx
```

## Rollback

If issues occur:

```bash
cd /opt/Voting-New
sudo git log  # Find previous commit
sudo git checkout PREVIOUS_COMMIT_HASH
sudo docker-compose down
sudo docker-compose up -d --build
```

## Troubleshooting

### Application won't start

```bash
# Check logs
sudo docker-compose logs app

# Check environment variables
sudo docker-compose config

# Verify MongoDB connectivity
sudo docker-compose exec app nc -zv mongodb-host 27017
```

### OAuth errors

- Verify callback URL matches registered URL exactly
- Check OAuth credentials are correct
- Ensure HTTPS is properly configured
- Review browser console for errors

### Performance issues

```bash
# Check resource usage
sudo docker stats

# Increase resources if needed
# Edit docker-compose.yml and add:
# deploy:
#   resources:
#     limits:
#       cpus: '2'
#       memory: 2G
```

## Support

For issues or questions:

- Check logs: `sudo docker-compose logs -f app`
- Review documentation: README.md
- Contact: NTHU Student Association Technology Department
