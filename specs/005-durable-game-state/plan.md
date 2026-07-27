# Implementation Plan: Durable game-state persistence

**Branch**: `005-durable-game-state` | **Date**: 2026-07-28 | **Spec**: [spec.md](spec.md)
**Input**: [Feature specification](spec.md), [server-first architecture plan](../server-first-arch/plan.md), current Nitro/Fastify session adapters

## Summary

Replace process-local game-session storage with PostgreSQL-backed persistence while preserving current `/api/game/*` contracts. Store one versioned `GameWorldJSON` snapshot per active session, use transaction-scoped optimistic compare-and-swap for mutations, and record command results for idempotent retries. Keep PostgreSQL authoritative; defer Redis to operational concerns after the durable baseline passes.

## Technical Context

**Language/Version**: TypeScript, Node.js LTS, strict mode
**Primary Dependencies**: Nuxt 4/Nitro compatibility layer, standalone Fastify, Drizzle ORM/schema tooling, `pg`, existing npm workspaces
**Storage**: PostgreSQL 16 as source of truth; Redis 7 optional after baseline for locks/cache/rate limits
**Testing**: Vitest unit/contract/integration tests, TypeScript package/server checks, Nuxt build, persistence tests against Docker PostgreSQL
**Target Platform**: Local Docker services; Nuxt/Nitro hosted verification on Vercel; standalone Fastify remains future deploy target
**Project Type**: TypeScript web application with Nuxt client, Nitro API compatibility layer, standalone API and shared packages
**Performance Goals**: Warm mutation p95 under 300 ms in local/hosted smoke baseline; one authoritative state transition per committed command
**Constraints**: No secrets in Git or client bundle; no direct database access from route handlers; anonymous `gl_session` identity remains in M3; current 24-hour retention remains default; Vercel instances are disposable
**Scale/Scope**: One active session per player/session; JSONB aggregate snapshot; no save slots, accounts, leaderboards or normalized analytics in M3

## Constitution Check

*Gate before research: PASS.*

- **Layered architecture**: PASS. PostgreSQL/Drizzle code lives in infrastructure; application consumes repository and unit-of-work ports; domain remains framework-free.
- **Type safety**: PASS. New DTOs and ports use explicit types in `*.types.ts`; strict TypeScript and no `any`.
- **Separation of concerns**: PASS. Nitro/Fastify handlers call application services/repositories; they do not open connections or implement transaction rules.
- **Testing**: PASS. Add behavior-focused repository, contract, concurrency, migration and deployment smoke tests before cutover.
- **Documentation**: PASS. Update migration status, persistence guide and ADR if final architecture decision differs from existing server-first record.

## Research Summary

Research decisions are recorded in [research.md](research.md): PostgreSQL JSONB authority, Drizzle plus `pg`, transactional idempotency, optimistic concurrency, anonymous M3 identity, provider-neutral deployment and Redis deferral.

## Project Structure

### Documentation

```text
specs/005-durable-game-state/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/persistence-api.md
└── checklists/requirements.md
```

### Source and tests

```text
apps/server/src/
├── infrastructure/persistence/
│   ├── db.ts
│   ├── schema.ts
│   ├── migrations/
│   └── postgres-game-state-repository.ts
├── application/                 # transaction/use-case orchestration as extraction advances
└── http/                        # future route modules; current app.ts compatibility remains

packages/application/src/
├── ports.types.ts               # repository, command log and unit-of-work contracts
└── ...

server/
├── utils/persistence.ts         # Nitro compatibility wiring to shared repository
└── api/game/                    # current endpoint compatibility layer

infra/
└── docker-compose.yml            # PostgreSQL required; Redis optional operational service

test/
├── integration/persistence/
├── integration/standalone-server/
└── contract/
```

**Structure Decision**: Keep root Nuxt/Nitro runtime working while adding shared persistence infrastructure. Reuse the same repository semantics in Nitro and standalone Fastify. Do not move all handlers or finish full client/server extraction as part of M3.

## Design

### Repository boundary

Extend the existing application ports so persistence semantics are explicit:

- load active session by player/session identity;
- initialize without accidental overwrite of an existing durable session;
- save only when expected `stateVersion` matches;
- read/write processed command records within the same unit of work;
- expose typed not-found, version-conflict, command-conflict and persistence-unavailable errors.

Keep a memory adapter for unit tests and local fallback tests only. It must implement the same semantics as PostgreSQL, including command idempotency once the port is extended.

### PostgreSQL schema and migrations

Create `players`, `game_sessions` and `processed_commands` as described in [data-model.md](data-model.md). Use Drizzle schema definitions plus reviewed migrations. Add indexes for player/session lookup, expiry cleanup and processed command lookup. Do not add audit or analytics tables in first migration.

### Mutation transaction

Centralize mutation flow in an application service or repository unit-of-work. Route handlers pass validated command envelopes; they do not load, mutate and save independently. The transaction must make state update and processed-command insert atomic. Duplicate command with same request hash returns cached response; duplicate identity with different hash returns `409 command_id_conflict`; stale version returns `409 state_version_conflict`.

### API compatibility

Keep response envelope and existing routes. Extend mutation requests with `commandId` and `expectedStateVersion` through the contract in [contracts/persistence-api.md](contracts/persistence-api.md). Generate compatibility IDs for legacy calls temporarily, instrument their use, and remove fallback only after client callers send explicit metadata.

`POST /api/game/init` must distinguish initial creation from ordinary reload. Verify current client call sites before changing behavior; safe default is no silent replacement of an existing durable session.

### Runtime wiring

Create one process-local PostgreSQL pool per runtime process and reuse it across requests. Read `DATABASE_URL` and pool limits from server-only environment. Nitro and standalone Fastify must report persistence dependency in `/ready`; `/health` remains liveness. No `DATABASE_URL` value may enter `NUXT_PUBLIC_*`, generated client assets or logs.

### Redis boundary

Do not require Redis for first PostgreSQL cutover. When added, use it only for short-lived locks, rate limits and cache; a Redis outage must fall back to the PostgreSQL correctness path. Never store canonical game snapshot only in Redis.

## Implementation Phases

### Phase 0 — Baseline and safety inventory

1. Record current `server/utils/session.ts` and `apps/server/src/session-repository.ts` behavior.
2. Inventory all `/api/game/*` mutation callers and current request/response shapes.
3. Add persistence feature fixtures and test helpers without changing production storage.
4. Confirm `.env*`, database credentials and generated artifacts remain ignored/uncommitted.

**Gate**: baseline API contract and current local tests pass; no caller of `init`, `execute` or `sync` is unknown.

### Phase 1 — Local PostgreSQL foundation

1. Add `infra/docker-compose.yml` with PostgreSQL 16 named volume and health check.
2. Add database scripts for start, migration and status without destructive volume reset.
3. Add Drizzle/`pg` dependencies and server-only database bootstrap.
4. Add first migration for `players`, `game_sessions`, `processed_commands`.
5. Add migration smoke test on empty database and repeat application check.

**Gate**: clean local database starts, migration applies twice safely, and credentials stay outside repository.

### Phase 2 — Repository and transaction implementation

1. Extend application persistence ports and error types.
2. Implement PostgreSQL repository/unit-of-work adapter.
3. Implement snapshot schema validation and migration hook.
4. Implement compare-and-swap state update and state version increment.
5. Implement processed-command lookup, request hash check and cached response.
6. Keep/update memory adapter as a deterministic test double.

**Gate**: repository tests cover create/load, TTL, update, stale version, duplicate command, mismatched payload and rollback after failure.

### Phase 3 — API wiring and client metadata

1. Route Nitro compatibility layer through shared repository adapter.
2. Route standalone Fastify application through same repository semantics.
3. Add `commandId` and `expectedStateVersion` to mutation request paths and sync queue.
4. Preserve current response envelope and map persistence errors to documented codes.
5. Update readiness checks to verify PostgreSQL availability without exposing credentials.
6. Ensure ordinary reload does not reset an existing durable session.

**Gate**: existing contract tests pass; init/state/action/sync work with PostgreSQL; legacy compatibility path is observable.

### Phase 4 — Persistence and concurrency verification

1. Test state survival after process restart and second application instance.
2. Test duplicate request after simulated lost response.
3. Test two concurrent commands from same state version.
4. Test unsupported snapshot version and migration fixture.
5. Test PostgreSQL outage and recovery behavior.
6. Run full typecheck, unit, integration, architecture, rules and build gates.

**Gate**: M3 success criteria pass; no accepted command is applied twice; no stale update overwrites committed state.

### Phase 5 — Vercel hosted verification

1. Provision provider-neutral managed PostgreSQL through approved Vercel Marketplace integration.
2. Set `DATABASE_URL` and non-secret persistence settings in Vercel Production Environment only.
3. Deploy from merged `main` using existing main-only workflow.
4. Run production smoke: init, action, state reload, redeploy/retry and readiness.
5. Record provider, region, migration version, deployment commit and known limitations.

**Gate**: state created before a new deployment is readable afterward; no secret leakage; hosted runtime reports durable readiness.

### Phase 6 — Follow-up operational hardening

1. Decide whether to add Redis for lock/rate-limit/cache concerns.
2. Add backup/restore rehearsal and retention monitoring.
3. Add signed/provider-backed identity and cross-device recovery as M5.
4. Update `doc/SERVER_MIGRATION.md`, implementation status and ADR after cutover.

## Verification Matrix

| Area | Required check |
|---|---|
| Types | `npm run typecheck`, `npm run typecheck:packages`, `npm run typecheck:standalone-server` |
| Unit | Repository errors, version transitions, hash and snapshot migration tests |
| Contract | Existing `/api/game/*` envelopes plus new command/version metadata |
| Integration | PostgreSQL migration, persistence, restart, conflict and duplicate command |
| Architecture | `npm run test:architecture`, no domain/framework or handler/DB violations |
| Runtime | `npm run build`, `/health`, `/ready`, Vercel deployment smoke |
| Security | Secret scan, no `DATABASE_URL` in client bundle/logs, configured origin/cookie behavior |

## Constitution Re-check

*Gate after design: PASS.*

- PostgreSQL adapter is infrastructure-only and consumed through application ports.
- Snapshot and command DTOs remain explicitly typed and framework-neutral.
- Transaction and conflict behavior is tested at repository/application boundaries, not only through route mocks.
- Existing API compatibility and documentation updates are included in completion gates.

## Complexity Tracking

| Addition | Why needed | Simpler alternative rejected because |
|---|---|---|
| PostgreSQL adapter plus unit-of-work | Atomic state and idempotency commit required | Direct handler SQL duplicates transaction logic and risks partial writes |
| `processed_commands` table | Network retries must not double-apply actions | State version alone detects stale writes but cannot replay original result safely |
| JSONB snapshot versioning | Current game is aggregate-shaped and evolving | Full normalization would expand migration risk without current query need |
| Local Docker database | Reproducible persistence tests and development | Shared remote database would make tests slow, unsafe and non-deterministic |

## Out of Scope

- User accounts, Yandex identity verification and cross-device recovery.
- Multiple save slots and player-visible save management.
- Redis as canonical state storage.
- Full static-client/standalone-server extraction and Yandex production deployment.
- Analytics schema, leaderboards and complete audit event history.
