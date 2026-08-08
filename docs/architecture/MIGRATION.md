# Migration Plan: Monolith → Multi-App Architecture

## Current State
Single Next.js monolith at `src/` serving all routes.

## Target State
Three independently deployed apps + shared backend:

| App | Port | URL | Role |
|---|---|---|---|
| Admin Panel | 3001 | admin.theugmusic.com | ADMIN roles |
| Artist Portal | 3002 | artists.theugmusic.com | ARTIST roles |
| Backend API | 3000 | api.theugmusic.com | All (tRPC) |

## Migration Steps

### Step 1: Extract Shared Code
- Move lib/db.ts, lib/auth.ts, lib/theme.ts, lib/utils.ts → shared/lib/
- All apps import from shared/

### Step 2: Create Independent Apps
- admin-panel/ — only admin routes, port 3001
- artist-portal/ — only artist routes, port 3002
- Existing src/ is repurposed as backend API at port 3000

### Step 3: Route Separation
- Admin panel: `admin-panel/src/app/` contains only admin routes
- Artist portal: `artist-portal/src/app/` contains only artist routes  
- Backend: `src/app/api/` serves tRPC + auth endpoints

### Step 4: Authentication
- Admin login → JWT with admin role → `/admin/dashboard`
- Artist login → JWT with artist role → `/artist/dashboard`
- Listener login → JWT → user dashboard

### Step 5: Deployment
```bash
# Admin Panel
docker compose -f docker/docker-compose.admin.yml up -d

# Artist Portal
docker compose -f docker/docker-compose.artist.yml up -d

# Backend API
docker compose -f docker/docker-compose.prod.yml up -d
```

## Rollback Plan
If any issue occurs: revert to single-app mode.
The existing monolith at `src/` remains fully functional as fallback.
