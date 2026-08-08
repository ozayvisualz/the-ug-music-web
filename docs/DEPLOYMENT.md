# TheUgMusic — Deployment Guide

## Prerequisites

- Docker & Docker Compose v2+
- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- Domain names configured:
  - `theugmusic.com` (user-facing app)
  - `api.theugmusic.com` (API)
  - `admin.theugmusic.com` (admin panel)

## Quick Start (Development)

```bash
# Clone and install
git clone <repo-url>
cd ugandan-music
cp .env.development .env
npm install --legacy-peer-deps

# Start services
docker compose -f docker-compose.yml up -d
npx prisma db push
npm run dev
```

## Production Deployment

### 1. Configure Environment

```bash
cp .env.production .env
# Edit .env with production values
```

### 2. Generate SSL Certificates

```bash
mkdir -p docker/nginx/ssl
# Place your SSL certificate files:
#   docker/nginx/ssl/fullchain.pem
#   docker/nginx/ssl/privkey.pem
```

### 3. Build and Deploy

```bash
docker compose -f docker/docker-compose.prod.yml build
docker compose -f docker/docker-compose.prod.yml up -d
```

### 4. Run Migrations

```bash
docker compose -f docker/docker-compose.prod.yml exec backend npx prisma migrate deploy
```

### 5. Verify

```bash
curl https://api.theugmusic.com/health
docker ps
```

## Database Backups

```bash
# Manual backup
docker compose -f docker/docker-compose.prod.yml exec postgres sh /backup.sh

# Restore
docker compose -f docker/docker-compose.prod.yml exec postgres sh /restore.sh /backups/db_20250101_120000.dump
```

## Scaling

```bash
# Scale backend instances
docker compose -f docker/docker-compose.prod.yml up -d --scale backend=3

# Scale workers
docker compose -f docker/docker-compose.prod.yml up -d --scale worker=2
```

## Monitoring

- Application logs: `docker compose logs -f backend`
- Nginx access logs: `docker compose logs -f nginx`
- Database health: `docker compose exec postgres pg_isready`
