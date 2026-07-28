# Research and decisions: M3 durable game-state persistence

## Current state

The deployed Nuxt/Nitro runtime stores sessions through `useStorage('game-sessions')` in `server/utils/session.ts`. No external Nitro storage driver is configured, so state is process-local. The standalone Fastify runtime uses `MemoryGameStateRepository` with a `Map` in `apps/server/src/session-repository.ts`. Both adapters use a 24-hour TTL. This is suitable for smoke testing, not durable hosted progress.

The application package already exposes repository and unit-of-work ports in `packages/application/src/ports.types.ts`. The existing standalone adapter already increments `stateVersion` and rejects stale writes, so M3 can replace storage behind a boundary instead of rewriting domain rules.

## Decision: PostgreSQL is authoritative

**Decision**: Store one canonical versioned game snapshot per active player/session in PostgreSQL. Keep the snapshot in JSONB for the first migration.

**Rationale**:

- survives process restart, cold start, instance changes, redeploy and rollback;
- supports atomic transactions, unique command identities and compare-and-swap updates;
- preserves current aggregate-shaped `GameWorldJSON` without premature normalization;
- gives clear backup, migration and operational ownership.

**Alternatives rejected**:

- Nitro memory storage: loses state across instances and deploys;
- browser local storage: device-local, user-clearable, and not authoritative for hosted API;
- Redis as primary save store: useful operationally but wrong source of truth for durable game state;
- one document/blob per save: lacks transactional concurrency and command idempotency guarantees.

## Decision: Drizzle schema and migrations over `pg`

**Decision**: Use Drizzle ORM/schema tooling with PostgreSQL `pg` driver. Keep database access in infrastructure and expose framework-neutral repository ports to application code.

**Rationale**: Existing server-first plan already targets Drizzle and `pg`; migrations remain reviewable SQL/schema changes, while repository code stays testable without Nuxt or Fastify imports. Use a pooled connection string supplied by the provider and configure pool size for serverless limits.

**Alternative rejected**: Direct SQL in route handlers. It would duplicate transaction and conflict logic across Nitro and Fastify and violate layered architecture.

## Decision: Transactional idempotency plus optimistic concurrency

Each mutation uses one PostgreSQL transaction:

1. Identify player/session and command identity.
2. Return cached result if the same command was already committed with the same request hash.
3. Reject same command identity with a different request hash.
4. Check expected `stateVersion`.
5. Execute domain command.
6. Update snapshot with `WHERE state_version = expectedStateVersion`.
7. Record processed command and response.
8. Commit and return new state/version.

Redis lock is not required for correctness. If added later, it only reduces contention; PostgreSQL compare-and-swap and unique constraints remain authoritative.

## Decision: Redis deferred from durable baseline

**Decision**: Do not block first M3 persistence cutover on Redis. Add Docker/Redis integration after PostgreSQL correctness is proven, only for locks, rate limits, cache or other operational TTL data.

**Rationale**: A reliable PostgreSQL transaction solves current data-loss and lost-update risks. Introducing Redis simultaneously increases setup and failure modes without improving the first save guarantee.

## Decision: Keep anonymous identity for M3

**Decision**: Continue using `gl_session` as anonymous session identity. Bind stored state to that identity. Defer signed/provider-backed identity, accounts and cross-device recovery to M5.

**Rationale**: This is the smallest safe persistence slice and preserves current API behavior. It does not claim account-level recovery or protection against a compromised client identity.

## Decision: Provider-neutral deployment, Vercel Marketplace allowed

**Decision**: Code against PostgreSQL, not a vendor-specific API. Provision a managed provider through Vercel Marketplace when deploying the Nuxt/Nitro verification runtime; set credentials only in Vercel Production Environment Variables.

Vercel documents Marketplace integrations for external PostgreSQL providers and automatic environment-variable injection: [Vercel Storage](https://vercel.com/docs/storage), [Postgres on Vercel](https://vercel.com/docs/postgres). Provider selection, region and plan are deployment choices, not repository architecture choices.

## Resolved implementation constraints

- Snapshot retention initially remains 24 hours to match current behavior; extending retention is a separate product decision.
- One active session per player/session is in scope; save slots are not.
- Existing `/api/game/*` response envelope remains compatible; mutation requests gain command/version metadata through backward-compatible contract changes.
- `POST /api/game/init` must not silently overwrite an existing durable session during ordinary reload; reset behavior requires an explicit decision or endpoint.
- Persistence readiness must fail when PostgreSQL is unavailable, while liveness can still report that the process is running.
