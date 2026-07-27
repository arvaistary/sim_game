# Feature Specification: Durable game-state persistence

**Feature Branch**: `005-durable-game-state`
**Created**: 2026-07-28
**Status**: Draft
**Input**: Define durable game-state persistence for M3: PostgreSQL source of truth, optimistic concurrency, idempotent commands, local development dependencies, and Vercel environment configuration.

## User Scenarios & Testing

### User Story 1 - Return to saved game (Priority: P1)

As a player, I want my current game to remain available after server restart, new server instance, or deployment, so that hosted deployment can be used for real progress instead of a temporary demo.

**Why this priority**: Durable state is prerequisite for calling hosted runtime production-capable.

**Independent Test**: Create a game, apply an action, restart the API or switch its process instance, reload with the same session, and verify the updated state is returned.

**Acceptance Scenarios**:

1. **Given** a valid session with an initialized game, **When** the API process restarts, **Then** the same game state is available after reload.
2. **Given** a valid session with an initialized game, **When** a new server instance handles the next request, **Then** it loads the latest committed state.
3. **Given** a session older than its retention period, **When** the player requests state, **Then** the session is reported as expired and no unrelated state is returned.

---

### User Story 2 - Safe action retry (Priority: P2)

As a player, I want a retried network request to produce the same result without applying an action twice, so that unstable connections do not corrupt progress.

**Why this priority**: Browser retries, reconnect queues, and duplicate deliveries are expected in game clients.

**Independent Test**: Submit one command twice with the same command identity and verify one state transition plus the original result on the second request.

**Acceptance Scenarios**:

1. **Given** a command already committed, **When** the same command is submitted again, **Then** the original result is returned and game effects are not repeated.
2. **Given** the same command identity with a different payload, **When** it is submitted, **Then** the request is rejected as inconsistent.

---

### User Story 3 - Detect conflicting changes (Priority: P2)

As a player using multiple tabs or reconnecting clients, I want stale changes rejected clearly, so that a newer state is not silently overwritten.

**Why this priority**: Lost updates would invalidate both gameplay and future offline retry behavior.

**Independent Test**: Load one state version twice, commit one mutation, then submit the other stale mutation and verify a conflict response.

**Acceptance Scenarios**:

1. **Given** two requests based on the same state version, **When** the first commits, **Then** the second receives a version-conflict response and does not modify state.
2. **Given** a successful mutation, **When** the client receives the response, **Then** it receives the next state version together with updated state.

### Edge Cases

- Storage service unavailable: mutation fails safely, and no partial state is reported as committed.
- State payload is malformed or has an unsupported schema version: request is rejected without overwriting valid state.
- Database response is lost after commit: retry with the same command identity returns the committed result.
- Two tabs submit valid actions concurrently: exactly one stale request is rejected; committed state remains internally consistent.
- Session cookie is missing or expired: a new session may be created, but existing unrelated sessions remain inaccessible.
- Redis is unavailable after it is introduced: PostgreSQL path remains authoritative and state is not lost.

## Requirements

### Functional Requirements

- **FR-001**: System MUST persist each initialized game state beyond the lifetime of an API process or deployment instance.
- **FR-002**: System MUST associate stored state with the current session/player identity and prevent access through a different identity.
- **FR-003**: System MUST preserve the canonical game snapshot, schema version, state version, creation time, update time, and retention expiry.
- **FR-004**: System MUST commit each state-changing command atomically with its resulting state version.
- **FR-005**: System MUST reject a mutation based on an outdated state version without changing stored state.
- **FR-006**: System MUST identify commands uniquely and return the original result for a repeated command identity.
- **FR-007**: System MUST reject reuse of a command identity with a different request payload.
- **FR-008**: System MUST preserve current game API response envelopes and expose explicit not-found, conflict, validation, and dependency-error outcomes.
- **FR-009**: System MUST support snapshot schema migration checks before loading or saving state.
- **FR-010**: System MUST provide reproducible local persistence setup and documented production environment configuration without committing secrets.
- **FR-011**: System MUST report readiness separately from liveness and identify whether authoritative persistence is available.
- **FR-012**: M3 MUST keep anonymous session identity; cross-device account recovery and external player authentication are out of scope.

### Key Entities

- **Player identity**: Anonymous or future provider-backed identity that owns one active game session in M3.
- **Game session**: Current canonical game snapshot with schema/version metadata and retention timestamps.
- **Processed command**: Idempotency record linking command identity, request fingerprint, state transition, and original response.
- **Persistence migration**: Versioned transformation that makes an older game snapshot readable by current runtime.

## Success Criteria

### Measurable Outcomes

- **SC-001**: In persistence integration tests, 10 of 10 initialized sessions remain readable after API restart simulation.
- **SC-002**: In concurrency tests, no accepted command is applied twice and no committed state transition is silently overwritten.
- **SC-003**: In retry tests, 100% of duplicate command requests return the original result without an additional state transition.
- **SC-004**: A fresh local checkout can start required persistence dependencies and apply schema setup using documented commands without manual database edits.
- **SC-005**: A production deployment can load and update an existing session using only configured environment variables; no persistence credential appears in repository files or client output.
- **SC-006**: Existing game API contract tests continue to pass after persistence adapter replacement.

## Assumptions and Scope Boundaries

- M3 uses one active game session per player/session; multiple saves and save slots are deferred.
- Canonical game state remains one versioned snapshot; normalized analytics/read models are deferred.
- PostgreSQL is authoritative; Redis, if introduced, is limited to locks, rate limits, cache, and other operational concerns.
- Initial hosted identity is existing `gl_session` cookie. Permanent cross-device progress requires a later identity milestone.
- Automatic backup policy, account management, leaderboards, and audit history are outside M3 unless required by implementation safety.
