#!/bin/sh
set -e

echo "====================================================="
echo "  DXN Stockpoint Enterprise — Backend Starting"
echo "====================================================="

echo "[1/3] Applying database migrations..."
npx prisma migrate deploy

echo "[2/3] Verifying and seeding DXN catalogue..."
npx tsx prisma/seed.ts || echo "Seed notice: proceeding with server launch."

echo "[3/3] Starting Express API Server on port ${PORT:-4000}..."
exec node dist/server.js
