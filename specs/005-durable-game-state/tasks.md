# Tasks: Durable game-state persistence

**Input**: Design documents from `specs/005-durable-game-state/`
**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/persistence-api.md](contracts/persistence-api.md)

**Organization**: Tasks grouped by user story. User Story 1 is MVP: durable state survives process and instance changes. User Stories 2 and 3 add retry safety and conflict handling.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare local PostgreSQL, migration tooling, environment boundaries and persistence test harness.

- [ ] T001 Add Drizzle ORM/schema tooling, `pg`, and required type packages to `package.json` and `package-lock.json`.
- [ ] T002 [P] Create PostgreSQL 16 service with health check and named volume in `infra/docker-compose.yml`.
- [ ] T003 Add database configuration and non-destructive migration scripts in `drizzle.config.ts`, `package.json`, and `scripts/db-migrate.mjs`.
- [ ] T004 [P] Document server-only local persistence variables and safe defaults in `apps/server/.env.example` and `.gitignore`.
- [ ] T005 [P] Create reusable PostgreSQL test setup and teardown helpers in `test/helpers/persistence-harness.ts`.

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish typed contracts and database boundary before any user story implementation.

**⚠️ CRITICAL**: User story work starts only after foundational ports, schema and migration checks pass.

- [ ] T006 Extend repository, command-log, unit-of-work and persistence-error ports in `packages/application/src/ports.types.ts`, `packages/application/src/persistence-errors.types.ts`, and `packages/application/src/index.ts`.
- [ ] T007 Extend mutation DTOs and error codes with `commandId`, `expectedStateVersion`, `stateVersion`, `command_id_conflict`, `state_version_conflict`, and `persistence_unavailable` in `packages/contracts/src/command.types.ts`, `packages/contracts/src/game.types.ts`, `packages/contracts/src/api.types.ts`, and `packages/contracts/src/index.ts`.
- [ ] T008 Add process-scoped PostgreSQL pool/bootstrap with server-only environment validation in `apps/server/src/infrastructure/persistence/db.ts`.
- [ ] T009 Define `players`, `game_sessions`, and `processed_commands` schema plus indexes and initial migration in `apps/server/src/infrastructure/persistence/schema.ts` and `apps/server/src/infrastructure/persistence/migrations/0001_durable_game_state.sql`.
- [ ] T010 [P] Add empty-database migration, repeat-application, constraint and rollback-safety tests in `test/integration/persistence/migrations.test.ts`.
- [ ] T011 [P] Add repository error mapping and persistence readiness types in `apps/server/src/infrastructure/persistence/persistence-errors.ts` and `apps/server/src/app.types.ts`.

## Phase 3: User Story 1 — Return to saved game (Priority: P1)

**Story goal**: Existing session state remains available after API process restart, new instance, or deployment.

**Independent test**: Initialize a session, apply an action, restart or replace the API process, then load the same session and verify the committed state and version.

- [ ] T012 [P] [US1] Add repository integration tests for create, load, expiry, state serialization and state survival in `test/integration/persistence/game-state-repository.test.ts`.
- [ ] T013 [US1] Implement PostgreSQL game-state repository with JSONB snapshots, 24-hour expiry and typed not-found handling in `apps/server/src/infrastructure/persistence/postgres-game-state-repository.ts`.
- [ ] T014 [US1] Implement safe session initialization that does not silently overwrite an existing durable session in `apps/server/src/infrastructure/persistence/postgres-game-state-repository.ts` and `server/api/game/init.post.ts`.
- [ ] T015 [US1] Replace Nitro memory storage calls with the PostgreSQL repository boundary in `server/utils/session.ts`, `server/utils/persistence.ts`, `server/api/game/state.get.ts`, and `server/api/game/init.post.ts`.
- [ ] T016 [US1] Inject the PostgreSQL repository into standalone Fastify without changing route envelopes in `apps/server/src/app.ts`, `apps/server/src/index.ts`, and `apps/server/src/app.types.ts`.
- [ ] T017 [US1] Make `/ready` verify authoritative PostgreSQL availability while keeping `/health` as liveness in `server/api/health.get.ts` and `apps/server/src/app.ts`.
- [ ] T018 [US1] Add Nitro and standalone API integration coverage for init, action, state reload, process restart simulation and expired session behavior in `test/integration/server/game-api-persistence.test.ts` and `test/integration/standalone-server/app.persistence.test.ts`.

## Phase 4: User Story 2 — Safe action retry (Priority: P2)

**Story goal**: Repeated delivery of one command returns its original result without applying game effects twice.

**Independent test**: Submit one mutation twice with the same command identity and request hash; verify one state transition and identical response on retry.

- [ ] T019 [P] [US2] Add contract tests for command metadata, cached retry response and command identity conflict in `test/contract/persistence-api.test.ts`.
- [ ] T020 [US2] Implement canonical command request hashing in `apps/server/src/infrastructure/persistence/request-hash.ts` with deterministic payload ordering.
- [ ] T021 [US2] Implement transaction-scoped command application service that checks `processed_commands`, executes domain logic, updates state and records response atomically in `packages/application/src/game-state-service.ts` and `packages/application/src/game-state-service.types.ts`.
- [ ] T022 [US2] Wire idempotent command service into Nitro execute/sync handlers in `server/api/game/actions/execute.post.ts` and `server/api/game/sync.post.ts`.
- [ ] T023 [US2] Wire the same idempotent command service into standalone Fastify execute/sync routes in `apps/server/src/app.ts` and `apps/server/src/application/game-application-service.ts`.
- [ ] T024 [US2] Generate and send command IDs plus current expected state versions from server-mode client paths in `src/application/game/server-executor.ts`, `src/stores/game.store.ts`, and `src/application/game/offline-queue.types.ts`.
- [ ] T025 [US2] Add duplicate-command, lost-response retry and mismatched-payload integration tests in `test/integration/persistence/idempotency.test.ts`.

## Phase 5: User Story 3 — Detect conflicting changes (Priority: P2)

**Story goal**: A stale client cannot overwrite a newer committed state and receives an actionable conflict response.

**Independent test**: Submit two mutations based on one state version; commit one and verify the other returns `409 state_version_conflict` without changing stored state.

- [ ] T026 [P] [US3] Add compare-and-swap repository tests for concurrent stale updates and monotonic state versions in `test/integration/persistence/concurrency.test.ts`.
- [ ] T027 [US3] Implement PostgreSQL `state_version` compare-and-swap and typed conflict details in `apps/server/src/infrastructure/persistence/postgres-game-state-repository.ts` and `packages/application/src/persistence-errors.types.ts`.
- [ ] T028 [US3] Map stale-version failures to `409 state_version_conflict` without partial response/state writes in `server/utils/error-handler.ts`, `apps/server/src/app.ts`, and `server/api/game/actions/execute.post.ts`.
- [ ] T029 [US3] Update server-mode client state projection and conflict recovery path in `src/application/game/server-executor.ts`, `src/stores/game.store.ts`, and `src/stores/game.store.types.ts`.
- [ ] T030 [US3] Add two-tab/stale-request integration coverage for Nitro and standalone API in `test/integration/persistence/concurrency.test.ts` and `test/integration/standalone-server/app.concurrency.test.ts`.

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Snapshot migration, documentation, quality gates and hosted verification.

- [ ] T031 [P] Add snapshot schema validation and ordered migration fixtures in `apps/server/src/infrastructure/persistence/snapshot-migrations.ts` and `test/integration/persistence/snapshot-migrations.test.ts`.
- [ ] T032 [P] Add persistence-specific local commands and non-destructive Docker guidance to `package.json`, `scripts/db-migrate.mjs`, and `specs/005-durable-game-state/quickstart.md`.
- [ ] T033 [P] Document Production `DATABASE_URL`, readiness expectations and no-secret rules in `doc/guides/VERCEL_GIT_WORKFLOW.md`, `VERCEL_DEPLOYMENT_PLAN.md`, and `doc/SERVER_MIGRATION.md`.
- [ ] T034 Update implementation status and architecture decision records after persistence cutover in `doc/core/IMPLEMENTATION_STATUS.md` and `doc/adr/0006-durable-game-state-persistence.md`.
- [ ] T035 Run typecheck, architecture tests, unit tests, persistence integration tests, rules audit and Nuxt build; record results in `specs/005-durable-game-state/quickstart.md` and `doc/core/IMPLEMENTATION_STATUS.md`.
- [ ] T036 Deploy merged `main` to Vercel with Production `DATABASE_URL`, then verify pre-deploy state survival, redeploy survival, `/health`, `/ready`, action retry and conflict smoke cases in `VERCEL_DEPLOYMENT_PLAN.md`.

## Dependencies and Execution Order

```text
T001-T005
    ↓
T006-T011
    ↓
T012-T018  (US1: durable state MVP)
    ↓
T019-T025  (US2: idempotent retries)
    ↓
T026-T030  (US3: stale-write conflicts)
    ↓
T031-T036  (polish, documentation, hosted verification)
```

User Story 2 and User Story 3 both require User Story 1's repository wiring. T019 and T026 may begin in parallel after foundational contracts, but their implementation integration tasks wait for T013-T018. T031-T034 can run in parallel after the relevant story gates; T035 and T036 run last.

## Parallel Execution Examples

### After foundational phase

```text
Parallel: T012 repository tests, T019 contract test preparation, T026 concurrency test preparation
Sequential: T013 → T014 → T015 → T016 → T017 → T018
```

### User Story 2

```text
Parallel: T020 request hash, T021 application service design, T024 client metadata
Sequential: T021 → T022/T023 → T025
```

### User Story 3

```text
Parallel: T026 concurrency tests, T029 client conflict projection
Sequential: T027 → T028 → T030
```

## Implementation Strategy

1. **MVP first**: Complete T001-T018. This delivers durable session reload after restart/instance replacement without introducing Redis.
2. **Retry safety**: Complete T019-T025. This makes network retries safe before enabling broader offline queue behavior.
3. **Concurrency safety**: Complete T026-T030. This prevents stale tabs and reconnects from silently overwriting state.
4. **Cutover**: Complete T031-T036, then merge the feature branch into `main` and deploy through the documented main-only Vercel workflow.

## Task Format Validation

All tasks use `- [ ]`, sequential `T###` IDs, `[P]` only for parallelizable work, `[US#]` on user-story tasks, and explicit repository file paths.
