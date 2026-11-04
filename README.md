# DXN Stockpoint Enterprise

Enterprise-grade offline-first POS & inventory management platform for DXN distributors.

[![CI/CD](https://github.com/abraar05/dxn-stockpoint/actions/workflows/ci.yml/badge.svg)](https://github.com/abraar05/dxn-stockpoint/actions/workflows/ci.yml)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://docker.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)](https://postgresql.org/)

---

## Overview

DXN Stockpoint is a complete full-stack point-of-sale and inventory management system
designed for DXN distributors. It features:

- **Offline-first architecture** — sales queue locally and sync when connection returns
- **Revision-based sync** — efficient change feed keeps web and mobile in sync
- **Idempotent orders** — client-generated UUIDs prevent duplicate sales on retry
- **Atomic stock deduction** — prevents overselling with database-level constraints
- **Multi-client** — web PWA + native Android app share one API
- **Real-time** — Socket.io for live sync across devices
- **Enterprise security** — JWT authentication, bcrypt hashing, rate limiting, brute-force protection
- **Production-ready** — Docker, Docker Compose, GitHub Actions CI/CD, comprehensive testing

---

## Architecture

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   Web PWA       │      │  Android App    │      │   Staff Portal  │
│  (React + TS)   │      │ (Kotlin + Compose)│     │  (React + TS)   │
└────────┬────────┘      └────────┬────────┘      └────────┬────────┘
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │   API Gateway (Express)   │
                    │   Node.js + TypeScript    │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │   PostgreSQL 16           │
                    │   Prisma ORM              │
                    └───────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Tailwind CSS, Vite, TanStack Query, Zustand, PWA |
| Backend | Node.js, Express, TypeScript, Socket.io |
| Database | PostgreSQL 16, Prisma ORM |
| Auth | JWT (access + refresh), bcrypt, brute-force protection |
| Caching | Redis (optional) |
| Validation | Zod |
| Testing | Jest, Supertest, Vitest, React Testing Library |
| CI/CD | GitHub Actions, Docker, Docker Compose |
| Docs | OpenAPI/Swagger |

---

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16 (if not using Docker)

### 1. Clone and configure

```bash
git clone https://github.com/abraar05/dxn-stockpoint.git
cd dxn-stockpoint/enterprise

# Copy environment files
cp apps/backend/.env.example apps/backend/.env
cp .env.example .env

# Edit .env with your values
```

### 2. Start with Docker Compose

```bash
# Start all services
docker-compose up -d

# Generate Prisma client and run migrations
docker exec dxn-stockpoint-backend npx prisma generate
docker exec dxn-stockpoint-backend npx prisma migrate deploy

# Seed the database with DXN catalogue
docker exec dxn-stockpoint-backend npx tsx prisma/seed.ts
```

### 3. Access the application

| Service | URL | Default Credentials |
|---------|-----|---------------------|
| Frontend (Web PWA) | http://localhost:5173 | Shop PIN: `2468` |
| Backend API | http://localhost:4000 | — |
| API Health | http://localhost:4000/health | — |
| PostgreSQL | localhost:5432 | dxn_user / dxn_pass |
| Prisma Studio | http://localhost:5555 | — |

### 4. Development

```bash
# Backend (with hot reload)
cd apps/backend
npm run dev

# Frontend (with hot reload)
cd apps/frontend
npm run dev
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/auth/login` | Shop PIN login | None |
| POST | `/api/v1/auth/refresh` | Refresh access token | None |
| POST | `/api/v1/auth/pin` | Change shop PIN | JWT |
| POST | `/api/v1/auth/register` | Register staff user | None |
| POST | `/api/v1/auth/user-login` | Staff login | None |
| GET | `/api/v1/auth/me` | Get current user | JWT |

### Products
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/products` | List products | Optional |
| GET | `/api/v1/products/:id` | Get product | Optional |
| POST | `/api/v1/products` | Create product | Admin |
| PUT | `/api/v1/products/:id` | Update product | Admin |
| DELETE | `/api/v1/products/:id` | Archive product | Admin |
| POST | `/api/v1/products/:id/restore` | Restore product | Admin |
| POST | `/api/v1/products/:id/stock/adjust` | Adjust stock | Auth |
| POST | `/api/v1/products/:id/stock/take` | Stock take | Auth |
| GET | `/api/v1/products/stock/movements` | Stock movement log | Auth |
| GET | `/api/v1/products/categories` | List categories | Optional |

### Orders
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/orders` | Create order (idempotent) | Optional |
| GET | `/api/v1/orders` | List orders | JWT |
| GET | `/api/v1/orders/:id` | Get order | JWT |
| POST | `/api/v1/orders/:id/status` | Update order status | Admin |
| GET | `/api/v1/orders/:id/receipt` | Get receipt | JWT |

### Dashboard & Reports
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/dashboard` | Dashboard statistics | JWT |
| GET | `/api/v1/reports/sales` | Sales report | JWT |

### Settings & Sync
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/settings` | Get shop settings | JWT |
| PUT | `/api/v1/settings` | Update shop settings | Admin |
| GET | `/api/v1/sync` | Sync feed (revision-based) | JWT |
| GET | `/api/v1/sync/status` | Sync status | JWT |

### Health
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/health` | Health check | None |
| GET | `/healthz` | Lightweight health check | None |

---

## Offline-First Design

### Sync Strategy
1. **Revision counter** — every product and order row carries a `revision` field
2. **Change feed** — `GET /api/v1/sync?since=<rev>` returns only changed rows
3. **Outbox queue** — sales made offline are queued locally and replayed on reconnect
4. **Idempotency** — each order has a `client_uuid`; replays are deduplicated
5. **Optimistic UI** — stock decrements immediately on the client, server confirms

### Client UUID Flow
```
Client generates UUID → Order queued locally → UI updates immediately
                                          ↓
                                    Connection returns
                                          ↓
                              Order POSTed to API with client_uuid
                                          ↓
                    API checks if client_uuid exists → duplicate detected → returns existing order
                                          ↓
                              If new → order created, stock deducted atomically
```

---

## Security

- **JWT Authentication** — short-lived access tokens (15 min), long-lived refresh tokens (30 days)
- **Password Hashing** — bcrypt with 12 salt rounds
- **Brute-Force Protection** — max 8 failed PIN attempts per 15 minutes per IP
- **Rate Limiting** — 100 requests per 15 minutes per IP
- **CORS** — configurable allowed origins
- **Helmet** — security headers (CSP, X-Frame-Options, etc.)
- **Input Validation** — Zod schemas on all endpoints
- **SQL Injection Prevention** — Prisma ORM with parameterized queries

---

## Testing

```bash
# Backend tests
cd apps/backend
npm test

# Frontend tests
cd apps/frontend
npm test

# With coverage
cd apps/backend
npm test -- --coverage
```

---

## Deployment

### Docker Compose (Production)

```bash
# Build and start
docker-compose -f docker-compose.yml up -d --build

# Run migrations
docker exec dxn-stockpoint-backend npx prisma migrate deploy

# View logs
docker-compose logs -f
```

### GitHub Actions

Push a git tag to trigger deployment:

```bash
git tag v1.0.0
git push origin v1.0.0
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_ACCESS_SECRET` | Access token signing secret (32+ chars) | Yes |
| `JWT_REFRESH_SECRET` | Refresh token signing secret (32+ chars) | Yes |
| `ADMIN_PIN` | Default shop PIN | Yes |
| `ADMIN_API_KEY` | Machine-to-machine API key | Yes |
| `CORS_ORIGINS` | Comma-separated allowed origins | Yes |
| `NODE_ENV` | `development`, `production`, or `test` | No |

---

## Project Structure

```
enterprise/
├── apps/
│   ├── backend/
│   │   ├── prisma/
│   │   │   ├── schema.prisma       # Database schema
│   │   │   └── seed.ts             # Database seeder
│   │   ├── src/
│   │   │   ├── config/             # Configuration
│   │   │   ├── controllers/        # Route handlers
│   │   │   ├── middleware/         # Auth, error, validation
│   │   │   ├── routes/             # API route definitions
│   │   │   ├── services/           # Business logic
│   │   │   ├── utils/              # Logger, auth, responses
│   │   │   ├── validators/         # Zod schemas
│   │   │   └── server.ts           # Entry point
│   │   ├── tests/                  # Test suites
│   │   ├── Dockerfile.backend
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── frontend/
│       ├── src/
│       │   ├── components/         # UI components
│       │   │   ├── ui/             # Base UI (Button, Input, Card, etc.)
│       │   │   ├── cart/           # Cart drawer
│       │   │   ├── catalog/        # Product card
│       │   │   └── layout/         # Header, BottomNav
│       │   ├── pages/              # Route pages
│       │   ├── services/           # API client
│       │   ├── stores/             # Zustand state (cart, auth, sync)
│       │   ├── types/              # TypeScript types
│       │   ├── utils/              # Formatting, cn helper
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── Dockerfile.frontend
│       ├── package.json
│       └── vite.config.ts
│
├── docker-compose.yml
├── .github/workflows/
│   ├── ci.yml
│   └── deploy.yml
├── package.json
└── README.md
```

---

## License

Private project for DXN stockpoint operations.

---

## Support

For issues and feature requests, please open a GitHub issue in the repository.