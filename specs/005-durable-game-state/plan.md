# Implementation Plan: Durable game-state persistence

**Branch**: `005-durable-game-state` | **Date**: 2026-07-28 | **Spec**: [spec.md](spec.md)
**Input**: [Feature specification](spec.md), [server-first architecture plan](../server-first-arch/plan.md), current Nitro/Fastify session adapters

## Summary

Replace process-local game-session storage with PostgreSQL-backed persistence while preserving current `/api/game/*` contracts. Store one versioned `GameWorldJSON` snapshot per active session, use transaction-scoped optimistic compare-and-swap for mutations, and record command results for idempotent retries. Keep PostgreSQL authoritative; defer Redis to operational concerns after the durable baseline passes.

## Technical Context

**Language/Version**: TypeScript, Node.js LTS, strict mode
**Primary Dependencies**: Nuxt 4/Nitro compatibility layer, standalone Fastify, Drizzle ORM/schema tooling, `pg`, `dotenv`, existing npm workspaces
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
- **Documentation**: PASS only when ADR-0006 is accepted before implementation and migration status, persistence guide and ADR are updated after cutover.

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

doc/adr/
└── 0006-durable-game-state-persistence.md  # accepted architecture decision before implementation
```

### Source and tests

```text
apps/server/src/
├── infrastructure/persistence/
│   ├── db.ts
│   ├── schema.ts
│   ├── migrations/
│   └── postgres-game-state-repository.ts
├── application/                 # runtime adapters only; canonical service lives in packages/application
└── http/                        # future route modules; current app.ts compatibility remains

src/domain/
├── game-command-executor.ts      # concrete DomainCommandExecutor over framework-free game commands
└── game-command-executor.types.ts

packages/application/src/
├── ports.types.ts               # repository, command log, unit-of-work and domain executor contracts
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

### Architecture decision gate

Before implementation, create and accept [ADR-0006](../../doc/adr/0006-durable-game-state-persistence.md). The ADR must approve PostgreSQL as authoritative storage, JSONB snapshot strategy, transaction/idempotency boundary, canonical application service location, anonymous M3 identity and Redis deferral. No database, repository or route changes begin before this gate passes.

Canonical mutation orchestration lives in `packages/application/src/game-state-service.ts`. It depends on an injected, framework-neutral `DomainCommandExecutor` port defined in `packages/application/src/ports.types.ts`; the concrete executor is supplied by the domain layer. Nitro and standalone Fastify provide transport/runtime adapters only; `apps/server/src/application/game-application-service.ts` must not become a second implementation of command, transaction or conflict rules, and the application layer must not import a concrete domain executor.

The concrete executor is implemented in `src/domain/game-command-executor.ts` over the existing framework-free `src/domain/game-world/commands` surface, with explicit types in `src/domain/game-command-executor.types.ts`. Nitro composition in `server/utils/persistence.ts` and standalone Fastify composition in `apps/server/src/app.ts` inject the same executor into the canonical application service; route handlers do not construct it directly.

### Domain command mapping

Every `GameCommandType` from `packages/contracts/src/command.types.ts` must have one explicit executor mapping before T028:

| Command type | Payload/subcommand | Domain operation |
|---|---|---|
| `action` | `actionId` | `executeActionCommand` |
| `work` | `hours` | `simulateWorkShiftCommand` |
| `event` | `eventId`, `choiceId` | `resolveEventDecisionCommand` |
| `career` | `action=change\|quit`, `jobId` | `changeCareer` / `quitCareer` adapter over `startCareerWork` / `endCareerWork` |
| `finance` | `action=collect\|monthly_settlement`, investment payloads | `collectInvestment` / `applyMonthlySettlement` over `divestFromWorld` / `processMonthlySettlementForWorld`; preserve `executeFinanceDecision` for legacy finance calls |
| `education` | `action=start\|advance`, `programId` | `startEducationProgram` / `advanceEducation` adapter with typed education payloads |

Mapping tests must cover every row, each supported subcommand and invalid payloads. Any legacy helper in `src/application/game/commands.ts` must be moved behind this mapping, wrapped by the executor, or explicitly classified as non-mutation; no current mutation path may remain unaccounted for.

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

Centralize mutation flow in an application service or repository unit-of-work. Route handlers pass validated command envelopes; they do not load, mutate and save independently. The application service invokes the injected `DomainCommandExecutor` and coordinates persistence; it does not implement domain rules. The transaction must make state update and processed-command insert atomic. Duplicate command with same request hash returns cached response; duplicate identity with different hash returns `409 command_id_conflict`; stale version returns `409 state_version_conflict`.

### API compatibility

Keep response envelope and existing routes. Extend mutation requests with `commandId` and `expectedStateVersion` through the contract in [contracts/persistence-api.md](contracts/persistence-api.md). Generate compatibility IDs for legacy calls temporarily, instrument their use, and remove fallback only after client callers send explicit metadata.

`POST /api/game/init` must distinguish initial creation from ordinary reload. Verify current client call sites before changing behavior; safe default is no silent replacement of an existing durable session.

### Runtime wiring

Create one process-local PostgreSQL pool per runtime process and reuse it across requests. Read `DATABASE_URL` and pool limits from server-only environment. Nitro exposes liveness in `server/api/health.get.ts` and readiness in `server/api/ready.get.ts`; standalone Fastify exposes equivalent `/health` and `/ready` routes from `apps/server/src/app.ts`. `/health` checks process liveness only. `/ready` checks PostgreSQL connectivity and expected migration/schema version, returning `503` when authoritative persistence is unavailable or not ready. No `DATABASE_URL` value may enter `NUXT_PUBLIC_*`, generated client assets or logs.

Readiness uses typed `PersistenceReadiness` from `apps/server/src/app.types.ts` and one ordered `MIGRATION_MANIFEST` source in `apps/server/src/infrastructure/persistence/migration-version.ts`. `CURRENT_SCHEMA_VERSION` equals `MIGRATION_MANIFEST.length`; migration filenames are append-only and ordered (`0001_...`, `0002_...`). `apps/server/src/infrastructure/persistence/db.ts` reads `COUNT(*)` from Drizzle's `__drizzle_migrations` bookkeeping table, treats that count as applied ordinal version, and compares it with `CURRENT_SCHEMA_VERSION`. Missing table, connection failure or count mismatch is not ready. A ready response is `200` with dependency and version status; unavailable PostgreSQL or schema mismatch is `503` with the same typed status shape and no credentials.

### Redis boundary

Do not require Redis for first PostgreSQL cutover. When added, use it only for short-lived locks, rate limits and cache; a Redis outage must fall back to the PostgreSQL correctness path. Never store canonical game snapshot only in Redis.

## Implementation Phases

### Phase 0 — Architecture decision and baseline gate

1. Create and accept `doc/adr/0006-durable-game-state-persistence.md` before implementation.
2. Resolve canonical application-service ownership and persistence adapter boundary.
3. Record current `server/utils/session.ts` and `apps/server/src/session-repository.ts` behavior.
4. Inventory all `/api/game/*` mutation callers and current request/response shapes.
5. Add persistence feature fixtures and test helpers without changing production storage.
6. Confirm `.env*`, database credentials and generated artifacts remain ignored/uncommitted.

Baseline commands: `npm run test`, `npm run test:standalone-server`, `npm run test:architecture`, `npm run typecheck:packages` and `npm run typecheck:standalone-server`; every command must exit `0`, and `git check-ignore -v .env .env.local apps/server/.env apps/server/.env.local .output` must confirm server secrets and generated artifacts are ignored.

**Gate**: ADR is accepted; baseline API contract and current local tests pass; no caller of `init`, `execute` or `sync` is unknown.

### Phase 1 — Local PostgreSQL foundation

1. Add `infra/docker-compose.yml` with PostgreSQL 16 named volume and health check.
2. Add database scripts for start, migration and status without destructive volume reset.
3. Add Drizzle/`pg` dependencies and server-only database bootstrap.
4. Add `dotenv`-based standalone server environment loading and document server-only variables.
5. Add first migration for `players`, `game_sessions`, `processed_commands`.
6. Add migration smoke test on empty database and repeat application check; verify applied ordinal equals `MIGRATION_MANIFEST.length`.

**Gate**: clean local database starts, migration applies twice safely, and credentials stay outside repository.

### Phase 2 — Repository and transaction implementation

1. Extend application persistence ports and error types.
2. Write failing mapping tests for all six `GameCommandType` values and supported subcommands, then define and implement the concrete domain command executor and its typed adapter boundary.
3. Implement snapshot schema validation and ordered migration hook.
4. Add old-snapshot/current-snapshot fixtures and migration tests before repository implementation.
5. Implement PostgreSQL repository/unit-of-work adapter.
6. Implement compare-and-swap state update and state version increment; this is prerequisite for command service.
7. Implement processed-command lookup, request hash check and cached response on top of completed CAS behavior.
8. Keep/update memory adapter as a deterministic test double.

**Gate**: migration tests pass before repository tests; repository tests cover create/load, TTL, update, stale version, duplicate command, mismatched payload and rollback after failure.

### Phase 3 — API wiring and client metadata

1. Build Nitro composition in `server/utils/persistence.ts` with shared repository, unit-of-work and `DomainCommandExecutor` dependencies, then route compatibility handlers through the canonical application service.
2. Build standalone Fastify composition in `apps/server/src/app.ts` and `apps/server/src/index.ts` with the same dependencies; keep transport adapter thin.
3. Add `commandId` and `expectedStateVersion` to mutation request paths and sync queue.
4. Preserve current response envelope and map persistence errors to documented codes.
5. Update readiness checks to verify PostgreSQL availability without exposing credentials.
6. Ensure ordinary reload does not reset an existing durable session.

**Gate**: existing contract tests pass; init/state/action/sync work with PostgreSQL; legacy compatibility path is observable.

### Phase 4 — Persistence and concurrency verification

1. Test 10 initialized sessions surviving process restart simulation and second application instance.
2. Test duplicate request after simulated lost response.
3. Test two concurrent commands from same state version.
4. Test access through a different session identity is rejected.
5. Test unsupported snapshot version and migration fixture.
6. Test PostgreSQL outage and recovery behavior.
7. Run full typecheck, unit, integration, architecture, rules and build gates.

**Gate**: M3 success criteria pass; no accepted command is applied twice; no stale update overwrites committed state.

### Phase 5 — Vercel hosted verification

1. Provision provider-neutral managed PostgreSQL through approved Vercel Marketplace integration.
2. Apply reviewed database migrations to Production and verify migration version before application deploy.
3. Set `DATABASE_URL` and non-secret persistence settings in Vercel Production Environment only.

**Migration gate**: Production schema count in `__drizzle_migrations` equals `MIGRATION_MANIFEST.length`, migration output is recorded, and migration failure leaves application deploy blocked.

4. Deploy from merged `main` using existing main-only workflow.
5. Run production smoke: init, action, state reload, retry, conflict and readiness.

**Runtime gate**: State created before deploy is readable afterward; no secret leakage; hosted runtime reports durable readiness.

6. Execute rollback/recovery rehearsal and verify state readability, schema compatibility, readiness and documented recovery steps.
7. Record provider, region, migration version, deployment commit, rollback result and known limitations.

**Rollback gate**: Recovery path is tested and does not require destructive data rollback.

### Phase 6 — Follow-up operational hardening (post-M3, non-blocking)

This phase is outside M3 completion criteria and must not block M3 implementation, migration or deployment gates.

1. Decide whether to add Redis for lock/rate-limit/cache concerns.
2. Add backup/restore rehearsal and retention monitoring.
3. Add signed/provider-backed identity and cross-device recovery as M5.
4. Update `doc/SERVER_MIGRATION.md` and implementation status after cutover; ADR-0006 must already be accepted.

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
