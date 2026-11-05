#!/usr/bin/env bash
set -e

SERVER="alpine-server"
REMOTE_DIR="/opt/apps/technova-quiz"
SSH_CONFIG="/home/radz/.ssh/config"

echo "=== 1. Testing SSH connectivity to $SERVER ==="
ssh -F "$SSH_CONFIG" "$SERVER" "echo 'SSH Connected successfully to' \$(hostname)"

echo "=== 2. Syncing updated codebase to $SERVER:$REMOTE_DIR (excluding .git) ==="
rsync -avz \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude 'data/*.sqlite*' \
  -e "ssh -F $SSH_CONFIG" \
  /home/radz/Projects/quiz_website_kahoot/ "$SERVER:$REMOTE_DIR/"

echo "=== 3. Rebuilding and starting container on $SERVER ==="
ssh -F "$SSH_CONFIG" "$SERVER" "cd $REMOTE_DIR && docker compose up -d --build && docker builder prune -f"

echo "=== 4. Verifying container status on $SERVER ==="
ssh -F "$SSH_CONFIG" "$SERVER" "docker ps --filter 'name=technova_quiz' --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"

echo "=== DEPLOYMENT TO ALPINE-SERVER COMPLETE ==="
