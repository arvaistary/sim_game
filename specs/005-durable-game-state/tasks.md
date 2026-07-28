# Tasks: Durable game-state persistence

**Input**: Design documents from `specs/005-durable-game-state/`
**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/persistence-api.md](contracts/persistence-api.md)

**Organization**: Tasks grouped by user story. ADR and baseline gates precede all implementation. User Story 1 is MVP; User Stories 2 and 3 extend it with retry and concurrency safety.

## Phase 1: Setup (Architecture and Shared Infrastructure)

**Purpose**: Accept architecture decision, capture current behavior, and prepare local PostgreSQL tooling.

- [X] T001 Create and accept architecture decision record for PostgreSQL authority, JSONB snapshots, idempotency boundary, canonical application service, anonymous M3 identity and Redis deferral in `doc/adr/0006-durable-game-state-persistence.md`.
- [X] T002 [P] Add characterization coverage for current Nitro session behavior and standalone memory repository behavior in `test/integration/server/game-api-contract.test.ts`, `test/integration/standalone-server/app.test.ts`, `server/utils/session.ts`, and `apps/server/src/session-repository.ts`.
- [X] T003 [P] Inventory current `/api/game/init`, `/api/game/actions/execute`, and `/api/game/sync` callers and request shapes in `src/application/game/server-executor.ts`, `src/stores/game.store.ts`, and `packages/contracts/src/game.types.ts`.
- [X] T004 Run baseline gate after T002-T003 with `npm run test`, `npm run test:standalone-server`, `npm run test:architecture`, `npm run typecheck:packages`, and `npm run typecheck:standalone-server`; require every command to exit `0`, verify `git check-ignore -v .env .env.local apps/server/.env apps/server/.env.local .output`, and confirm no credentials or generated artifacts are tracked in `test/integration/server/game-api-contract.test.ts`, `test/integration/standalone-server/app.test.ts`, `.gitignore`, and `doc/guides/VERCEL_GIT_WORKFLOW.md`.
- [X] T005 Add Drizzle ORM/schema tooling, `pg`, `dotenv`, and required type packages to `package.json` and `package-lock.json`.
- [X] T006 [P] Create PostgreSQL 16 service with health check and named volume in `infra/docker-compose.yml`.
- [X] T007 Add database configuration and non-destructive migration scripts in `drizzle.config.ts`, `package.json`, and `scripts/db-migrate.mjs`.
- [X] T008 Add standalone server environment loading and server-only variable validation with `dotenv` in `apps/server/src/index.ts`, `apps/server/src/infrastructure/persistence/db.ts`, and `apps/server/.env.example`.
- [X] T009 [P] Create reusable PostgreSQL test setup and teardown helpers in `test/helpers/persistence-harness.ts`.

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish typed contracts, schema, snapshot migration validation and canonical service boundary before user stories.

**⚠️ CRITICAL**: T001 must be accepted before database, repository or route implementation begins.

- [X] T010 Extend repository, command-log, unit-of-work and persistence-error ports in `packages/application/src/ports.types.ts`, `packages/application/src/persistence-errors.types.ts`, and `packages/application/src/index.ts`.
- [X] T011 Extend mutation DTOs and error codes with `commandId`, `expectedStateVersion`, `stateVersion`, `command_id_conflict`, `state_version_conflict`, and `persistence_unavailable` in `packages/contracts/src/command.types.ts`, `packages/contracts/src/game.types.ts`, `packages/contracts/src/api.types.ts`, and `packages/contracts/src/index.ts`.
- [X] T012 First write failing mapping tests for all six `GameCommandType` values (`action`, `work`, `event`, `career`, `finance`, `education`), supported subcommands and invalid payloads; only after those tests fail, define and implement canonical application-service dependency injection and the concrete typed `DomainCommandExecutor` adapter over existing domain commands in `packages/contracts/src/command.types.ts`, `packages/application/src/game-state-service.types.ts`, `packages/application/src/ports.types.ts`, `packages/application/src/index.ts`, `src/domain/game-command-executor.ts`, `src/domain/game-command-executor.types.ts`, `src/domain/game-world/commands/index.ts`, `src/application/game/commands.ts`, and `test/unit/domain/game-command-executor.test.ts`; keep database, HTTP and transaction rules outside the executor and account for every current mutation helper.
- [X] T013 Add process-scoped PostgreSQL pool/bootstrap with server-only environment validation in `apps/server/src/infrastructure/persistence/db.ts`.
- [X] T014 Define `players`, `game_sessions`, and `processed_commands` schema plus indexes and initial migration in `apps/server/src/infrastructure/persistence/schema.ts` and `apps/server/src/infrastructure/persistence/migrations/0001_durable_game_state.sql`.
- [X] T015 [P] Add empty-database migration, repeat-application, constraint and rollback-safety tests in `test/integration/persistence/migrations.test.ts`.
- [X] T016 Implement snapshot schema validation and ordered migration hooks in `apps/server/src/infrastructure/persistence/snapshot-migrations.ts`.
- [X] T017 [P] Add old-snapshot, current-snapshot, unsupported-version and non-overwrite fixtures in `test/integration/persistence/snapshot-migrations.test.ts`.
- [X] T018 [P] Add repository error mapping, typed `PersistenceReadiness` response shape, ordered append-only `MIGRATION_MANIFEST` and derived `CURRENT_SCHEMA_VERSION = MIGRATION_MANIFEST.length` in `apps/server/src/infrastructure/persistence/persistence-errors.ts`, `apps/server/src/app.types.ts`, and `apps/server/src/infrastructure/persistence/migration-version.ts`; document that migration filenames are never reordered or deleted.

## Phase 3: User Story 1 — Return to saved game (Priority: P1)

**Story goal**: Existing session state remains available after API process restart, new instance, or deployment.

**Independent test**: Initialize 10 sessions, apply actions, restart or replace the API process, then load the same sessions and verify committed state and versions.

- [X] T019 [P] [US1] Add repository integration tests for create, load, expiry, state serialization, player/session binding and state survival in `test/integration/persistence/game-state-repository.test.ts`.
- [X] T020 [US1] Implement PostgreSQL game-state repository with JSONB snapshots, 24-hour expiry, player/session binding, monotonic `stateVersion` and compare-and-swap updates in `apps/server/src/infrastructure/persistence/postgres-game-state-repository.ts`.
- [X] T021 [US1] Implement safe session initialization that does not silently overwrite an existing durable session in `packages/application/src/game-state-service.ts`, `apps/server/src/infrastructure/persistence/postgres-game-state-repository.ts`, and `server/api/game/init.post.ts`.
- [X] T022 [US1] Build Nitro composition root with PostgreSQL repository, unit-of-work and `DomainCommandExecutor` dependencies, then route state/init handlers through the canonical application-service boundary in `packages/application/src/game-state-service.ts`, `server/utils/persistence.ts`, `server/utils/session.ts`, `server/api/game/state.get.ts`, and `server/api/game/init.post.ts`.
- [X] T023 [US1] Build standalone Fastify composition root with the same repository, unit-of-work and `DomainCommandExecutor` dependencies, then route state/init handlers through the canonical application service without duplicating transaction or conflict rules in `apps/server/src/app.ts`, `apps/server/src/index.ts`, and `apps/server/src/app.types.ts`.
- [X] T024 [US1] Implement and test Nitro `server/api/health.get.ts` liveness and `server/api/ready.get.ts` readiness endpoints plus equivalent Fastify `/health` and `/ready` routes in `apps/server/src/app.ts` and `apps/server/src/app.types.ts`; use `CURRENT_SCHEMA_VERSION = MIGRATION_MANIFEST.length` from `apps/server/src/infrastructure/persistence/migration-version.ts`, read applied ordinal with `COUNT(*)` from Drizzle `__drizzle_migrations`, return typed `200` readiness when counts match, typed `503` for unavailable PostgreSQL or count mismatch, and cover zero/current/mismatch/missing-table cases, version fields and secret-free payloads in `test/contract/readiness-api.test.ts`.
- [X] T025 [US1] Add Nitro and standalone integration coverage for 10-session restart survival, new-instance loading, expired sessions and cross-session identity isolation in `test/integration/server/game-api-persistence.test.ts` and `test/integration/standalone-server/app.persistence.test.ts`.

## Phase 4: User Story 2 — Safe action retry (Priority: P2)

**Story goal**: Repeated delivery of one command returns its original result without applying game effects twice.

**Independent test**: Submit one mutation twice with the same command identity and request hash; verify one state transition and identical response on retry.

- [X] T026 [P] [US2] Add contract tests for command metadata, cached retry response and command identity conflict in `test/contract/persistence-api.test.ts`.
- [X] T027 [US2] Implement canonical command request hashing with deterministic payload ordering in `apps/server/src/infrastructure/persistence/request-hash.ts`.
- [X] T028 [US2] Implement the canonical transaction-scoped command service that checks `processed_commands`, invokes the injected `DomainCommandExecutor`, updates state and records response atomically in `packages/application/src/game-state-service.ts` and `packages/application/src/game-state-service.types.ts`; do not import a concrete domain executor or duplicate domain rules in application.
- [X] T029 [US2] Wire the canonical idempotent command service into Nitro execute/sync handlers in `server/api/game/actions/execute.post.ts` and `server/api/game/sync.post.ts`.
- [X] T030 [US2] Wire standalone Fastify execute/sync routes as thin adapters to the canonical service in `apps/server/src/app.ts` and `apps/server/src/app.types.ts`.
- [X] T031 [US2] Generate and send command IDs plus current expected state versions from server-mode client paths in `src/application/game/server-executor.ts`, `src/stores/game.store.ts`, and `src/application/game/offline-queue.types.ts`.
- [X] T032 [US2] Add duplicate-command, lost-response retry and mismatched-payload integration tests in `test/integration/persistence/idempotency.test.ts`.

## Phase 5: User Story 3 — Detect conflicting changes (Priority: P2)

**Story goal**: A stale client cannot overwrite a newer committed state and receives an actionable conflict response.

**Independent test**: Submit two mutations based on one state version; commit one and verify the other returns `409 state_version_conflict` without changing stored state.

- [X] T033 [P] [US3] Add compare-and-swap repository tests for concurrent stale updates and monotonic state versions in `test/integration/persistence/concurrency.test.ts`.
- [X] T034 [US3] Add typed stale-state conflict details and concurrency diagnostics on top of completed compare-and-swap behavior in `apps/server/src/infrastructure/persistence/postgres-game-state-repository.ts` and `packages/application/src/persistence-errors.types.ts`.
- [X] T035 [US3] Map stale-version failures to `409 state_version_conflict` without partial response/state writes in `server/utils/error-handler.ts`, `apps/server/src/app.ts`, and `server/api/game/actions/execute.post.ts`.
- [X] T036 [US3] Update server-mode client state projection and conflict recovery path in `src/application/game/server-executor.ts`, `src/stores/game.store.ts`, and `src/stores/game.store.types.ts`.
- [X] T037 [US3] Add two-tab/stale-request integration coverage for Nitro and standalone API in `test/integration/persistence/concurrency.test.ts` and `test/integration/standalone-server/app.concurrency.test.ts`.

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Production migration, documentation, quality gates and hosted verification.

- [X] T038 [P] Add non-interactive Production migration command and schema-version check using `CURRENT_SCHEMA_VERSION = MIGRATION_MANIFEST.length`, append-only migration ordering and `COUNT(*)` from Drizzle `__drizzle_migrations` in `scripts/db-migrate.mjs`, `package.json`, `apps/server/src/infrastructure/persistence/db.ts`, and `apps/server/src/infrastructure/persistence/migration-version.ts`; fail deployment when applied ordinal differs from expected.
- [X] T039 [P] Document local persistence commands, Production `DATABASE_URL`, readiness expectations and no-secret rules in `specs/005-durable-game-state/quickstart.md`, `doc/guides/VERCEL_GIT_WORKFLOW.md`, `VERCEL_DEPLOYMENT_PLAN.md`, and `doc/SERVER_MIGRATION.md`.
- [X] T040 Update implementation status and record final ADR status after persistence cutover in `doc/core/IMPLEMENTATION_STATUS.md` and `doc/adr/0006-durable-game-state-persistence.md`.
- [X] T041 Run typecheck, architecture tests, unit tests, persistence integration tests, rules audit and Nuxt build; record results in `doc/core/IMPLEMENTATION_STATUS.md`.
- [X] T042 Provision managed PostgreSQL, apply reviewed Production migrations, verify schema version, and configure Vercel Production Environment in `scripts/db-migrate.mjs`, `apps/server/src/infrastructure/persistence/db.ts`, and `VERCEL_DEPLOYMENT_PLAN.md`.
- [ ] T043 Deploy merged `main` through the main-only Vercel workflow and verify pre-deploy state survival, `/health`, `/ready`, retry and conflict smoke cases in `VERCEL_DEPLOYMENT_PLAN.md`.
- [ ] T044 Execute rollback/recovery rehearsal, verify state readability and schema compatibility, and record recovery result in `VERCEL_DEPLOYMENT_PLAN.md` and `doc/SERVER_MIGRATION.md`.

## Dependencies and Execution Order

```text
T001-T003  (ADR and baseline preparation)
    ↓
T004       (baseline test and safety gate)
    ↓
T005-T009  (local PostgreSQL foundation)
    ↓
T010-T018  (typed contracts, schema and snapshot migrations)
    ↓
T019-T025  (US1: durable state MVP)
    ↓
T026-T032  (US2: idempotent retries)
    ↓
T033-T037  (US3: stale-write conflicts)
    ↓
T038-T044  (production migration, deploy and rollback verification)
```

T001 is a hard gate. T002-T003 can run in parallel after T001; T004 runs after both and blocks T005. T015 and T017 can run in parallel after schema/migration definitions. User Story 2 and User Story 3 wait for User Story 1 repository wiring. T039-T041 can run in parallel after story gates; T042 → T043 → T044 run sequentially.

## Parallel Execution Examples

### After ADR gate

```text
Parallel: T002 characterization coverage, T003 caller inventory
Sequential: T001 → T002/T003 → T004 → T005-T009 → T010-T018
```

### User Story 1

```text
Parallel: T019 repository tests, T024 readiness tests/design
Sequential: T020 → T021 → T022/T023 → T025
```

### User Story 2

```text
Parallel: T026 contract tests, T027 request hash, T031 client metadata
Sequential: T028 → T029/T030 → T032
```

### User Story 3

```text
Parallel: T033 concurrency tests, T036 client conflict projection
Sequential: T034 → T035 → T037
```

## Implementation Strategy

1. **Architecture gate**: Complete T001-T004; do not implement code before ADR acceptance and baseline inventory.
2. **MVP first**: Complete T005-T025. This delivers durable session reload, migration validation and identity isolation without Redis.
3. **Retry safety**: Complete T026-T032. This makes network retries safe before broader offline queue behavior.
4. **Concurrency safety**: Complete T033-T037. This prevents stale tabs and reconnects from silently overwriting state.
5. **Cutover**: Complete T038-T044, then merge the feature branch into `main` and deploy through the documented main-only Vercel workflow.

## Task Format Validation

All tasks use `- [ ]`, sequential `T###` IDs, `[P]` only for parallelizable work, `[US#]` on user-story tasks, and explicit repository file paths.
