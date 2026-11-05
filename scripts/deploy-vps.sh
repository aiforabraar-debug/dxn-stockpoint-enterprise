#!/bin/bash
# =============================================================================
# DXN Stockpoint Enterprise — 1-Command VPS / Docker Production Deployment
# =============================================================================
set -e

echo "====================================================="
echo "  DXN Stockpoint Enterprise — VPS / Docker Deploy"
echo "====================================================="

# Pull latest code
git pull origin main

# Build and start all services
echo "[1/3] Building and starting Docker containers..."
docker compose down || true
docker compose up -d --build

# Wait for database healthcheck
echo "[2/3] Waiting for PostgreSQL database to be healthy..."
sleep 5

# Apply database migrations & seed catalog
echo "[3/3] Applying migrations and seeding 51-product DXN catalog..."
docker exec dxn-stockpoint-backend npx prisma migrate deploy
docker exec dxn-stockpoint-backend npx tsx prisma/seed.ts

echo "====================================================="
echo "🎉 DXN Stockpoint Enterprise is successfully deployed!"
echo "   API Health: http://localhost:4000/health"
echo "   API Base:   http://localhost:4000/api/v1"
echo "   Web App:    http://localhost:5173"
echo "====================================================="
