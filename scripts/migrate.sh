#!/bin/sh
set -e

echo "[$(date)] Running database migrations..."
cd /app
npx prisma migrate deploy

echo "[$(date)] Generating Prisma client..."
npx prisma generate

echo "[$(date)] Migration complete."
