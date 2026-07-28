# M3 local persistence quickstart

## Prerequisites

- Node.js LTS
- npm
- Docker Desktop

## First-run flow

```powershell
npm ci
npm run infra:up
npm run db:migrate
npm run dev
```

`npm run db:migrate` is non-destructive and uses Drizzle's migration journal. Run it after `infra:up` and before first API request. `npm run db:status` must report `Everything's fine` and Production must fail readiness until applied migration count equals `CURRENT_SCHEMA_VERSION`.

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

Persistence-specific tests must additionally cover restart simulation, duplicate command, stale version, malformed snapshot, migration fixture and unavailable database. Repository/integration tests run against PostgreSQL when `RUN_PERSISTENCE_TESTS=1`.

## API command metadata

Mutation calls may include `commandId` and `expectedStateVersion`. Server generates compatibility IDs for legacy callers. Repeating same ID with same payload replays cached result; reusing ID with different payload returns `409 command_id_conflict`; stale version returns `409 state_version_conflict`.

## Production/Vercel

Set `DATABASE_URL` only in Vercel Production Environment Variables. Never put it in `NUXT_PUBLIC_*`, `.env` tracked files or client config. Run reviewed migration before deployment, verify `/api/ready` returns `200`, then deploy `main`. `/api/health` checks process liveness only; `/api/ready` checks PostgreSQL and migration count.

## Destructive operations

Stopping containers must retain named volumes. Database reset/drop is a separate explicit command and is never called by ordinary `dev` or test setup.
