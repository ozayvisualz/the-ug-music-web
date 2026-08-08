# TheUgMusic — System Architecture

## Overview

TheUgMusic is a full-stack Ugandan music streaming platform with:
- Web app (Next.js)
- Mobile app (React Native / Expo)
- Admin panel
- Artist portal
- REST API (tRPC)

## Architecture Diagram

```
                    ┌─────────────┐
                    │   CloudFlare CDN  │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   Nginx LB   │
                    │  (port 80/443)│
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────▼─────┐ ┌───▼───┐ ┌─────▼─────┐
        │  Backend  │ │ Backend│ │  Backend  │
        │  (Node 1) │ │(Node 2)│ │  (Node N) │
        └─────┬─────┘ └───┬───┘ └─────┬─────┘
              │            │            │
              └────────────┼────────────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
     ┌─────▼─────┐   ┌─────▼─────┐   ┌─────▼─────┐
     │ PostgreSQL │   │   Redis   │   │   MinIO   │
     │  (Primary) │   │  (Cache)  │   │ (Storage) │
     └───────────┘   └───────────┘   └───────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS |
| Mobile | React Native, Expo SDK 54 |
| API | tRPC, Next.js API Routes |
| Database | PostgreSQL 16, Prisma ORM |
| Cache | Redis 7 |
| Storage | MinIO (S3-compatible) |
| Auth | JWT, NextAuth v5 |
| Payments | Flutterwave |
| Queue | Redis-based worker |
| CDN | CloudFlare |
| Monitoring | Docker logs, health checks |

## Data Flow

1. User requests → Nginx → Next.js Backend
2. Next.js → tRPC → Prisma → PostgreSQL
3. Uploads → Next.js → MinIO Storage
4. Streaming → CDN → User
5. Revenue → Worker (nightly) → Artist Wallets
6. Payments → Flutterwave → Webhooks → Backend

## Security

- JWT authentication with 30-day expiry
- Role-based access (LISTENER, ARTIST, ADMIN)
- Rate limiting (100 req/min per IP)
- CORS allowlist
- Security headers (HSTS, XSS, CSP)
- Input validation (Zod)
- API key for Flutterwave webhooks
