#!/bin/bash

# Deployment script voor Plesk server
SERVER="85.215.43.194"
USER="root"
DOMAIN_PATH="/var/www/vhosts/adultsplaystore.com/httpdocs"

echo "🚀 Starting deployment to Plesk server..."

# SSH naar server en deploy
ssh $USER@$SERVER << 'EOF'
    cd /var/www/vhosts/adultsplaystore.com/httpdocs

    echo "📥 Pulling latest code..."
    git pull origin main

    echo "🔨 Building frontend..."
    cd frontend
    npm run build

    echo "📂 Deploying to webroot..."
    cd ..
    cp -r frontend/dist/* .

    echo "🔧 Setting correct permissions..."
    chown -R apache:apache .
    chmod -R 755 .

    echo "✅ Deployment completed!"
EOF

echo "🎉 Deployment finished!" 