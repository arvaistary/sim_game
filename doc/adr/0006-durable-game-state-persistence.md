# ADR-0006: Durable game-state persistence with PostgreSQL

**Date:** 2026-07-28
**Status:** Accepted

**Implementation status:** Local M3 implementation complete and Production migration applied. PostgreSQL-backed runtime is wired; Production activation remains gated by readiness, deployment smoke and restart/rollback verification.

## Context

Current Nitro sessions use process-local storage and standalone Fastify uses an in-memory repository. Both implementations lose canonical game state when the process, instance or deployment changes. Network retries and concurrent clients also need durable command identity and state-version coordination.

M3 must preserve existing `/api/game/*` response envelopes, keep anonymous `gl_session` identity, and avoid making Redis a correctness dependency. The application layer must remain framework-neutral and route handlers must not own transaction rules.

## Decision

- PostgreSQL 16 is authoritative source of truth for one active game session per player/session identity.
- `game_sessions.state` stores validated `GameWorldJSON` snapshots in JSONB with snapshot schema version, monotonic state version and 24-hour retention metadata.
- `processed_commands` stores request hash and original response for transactional idempotent retries.
- Mutations run through one application service and unit-of-work. State update and processed-command insert commit atomically.
- Optimistic compare-and-swap on `stateVersion` rejects stale mutations without changing stored state.
- `DomainCommandExecutor` is an injected framework-neutral port. Concrete command mapping remains in the domain boundary; Nitro and Fastify only compose dependencies and adapt transport.
- M3 continues using anonymous `gl_session` identity. Accounts, provider authentication and cross-device recovery are deferred.
- Redis is deferred and, when introduced, may provide only locks, cache, rate limits and operational TTLs. It cannot become canonical state storage.
- Production migration is a separate gate before application deployment. Readiness reports PostgreSQL/schema availability; liveness remains process-only.

## Consequences

Positive:

- State survives process restart, instance replacement, deployment and rollback.
- Retry, stale-write and identity-isolation behavior are testable at repository/application boundaries.
- Nitro and standalone Fastify share persistence semantics instead of duplicating transaction logic.

Trade-offs:

- Local development requires PostgreSQL and migration tooling.
- JSONB snapshot migrations must remain ordered and backward-compatible.
- Anonymous identity is session-bound and does not provide account recovery.
- Production deployment now depends on a managed PostgreSQL service and explicit migration verification.

## Alternatives rejected

- Process memory or Nitro memory storage: not durable across instances.
- Browser local storage: not authoritative and device-local.
- Redis as primary state store: weaker fit for canonical transactional snapshots.
- Direct SQL in route handlers: duplicates transaction and conflict behavior and violates layered architecture.
- Full snapshot normalization: unnecessary for current aggregate-shaped game state and increases first-migration risk.
