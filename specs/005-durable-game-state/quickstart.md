# M3 local persistence quickstart

## Prerequisites

- Node.js LTS
- npm
- Docker Desktop

## Planned first-run flow

```powershell
npm ci
npm run infra:up
npm run db:migrate
npm run dev
```

Expected local services:

```text
Client:      http://127.0.0.1:3000
API:         http://127.0.0.1:3001
PostgreSQL:  localhost:5432
```

Redis is optional for first PostgreSQL persistence slice. When operational integration is added, it runs on `localhost:6379` and remains non-authoritative.

## Local environment

Keep values in an ignored `.env.local` or server-specific local environment file:

```text
DATABASE_URL=postgres://game:game@127.0.0.1:5432/game_life
SESSION_SECRET=local-only-change-me
GAME_SESSION_TTL_SECONDS=86400
API_PORT=3001
GAME_CORS_ORIGINS=http://127.0.0.1:3000,http://localhost:3000
```

Production `DATABASE_URL` must be configured in Vercel Environment Variables, never committed.

## Verification commands

```powershell
npm run db:migrate
npm run typecheck:packages
npm run typecheck:standalone-server
npm run test:architecture
npm run test:standalone-server
npm test
npm run build
```

Persistence-specific tests must additionally cover restart simulation, duplicate command, stale version, malformed snapshot, migration fixture and unavailable database.

## Destructive operations

Stopping containers must retain named volumes. Database reset/drop is a separate explicit command and is never called by ordinary `dev` or test setup.
