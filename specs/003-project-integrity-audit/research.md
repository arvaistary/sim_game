# Research: Project Integrity Audit

## Decision 1: Compare observable behavior, not transport internals

**Decision**: Reuse one scenario catalog across SPA, Server, and Hybrid; compare allowed actions, canonical final GameWorld state, and visible result. Normalize session IDs, timestamps, cookies, and transport envelopes only.

**Rationale**: Clarified contract requires functional equivalence while allowing different internal mechanisms.

**Alternatives considered**: Byte-for-byte payload equality was rejected because transport/storage legitimately differ. Core-scenario-only parity was rejected because all implemented scenarios are in scope.

## Decision 2: Evidence-first audit artifacts

**Decision**: Persist Baseline, Audit Matrix, Finding, Regression Check, and Gate Run as structured Markdown records following one contract.

**Rationale**: Reproduction and closure need stable IDs, source evidence, commands, environment, and status transitions.

**Alternatives considered**: Console-only output loses durable evidence. Free-form notes cannot enforce complete P0-P3 closure.

## Decision 3: Vitest for deterministic logic; Playwright for browser truth

**Decision**: Keep Vitest for domain, application, architecture, executor, and state projection checks. Add Playwright configuration and browser suites for route/viewports/console/navigation behavior.

**Rationale**: Repository already uses Vitest and includes Playwright, but lacks a root Playwright configuration; browser layout and navigation cannot be validated reliably in the Node test environment.

**Alternatives considered**: happy-dom-only UI tests cannot validate responsive layout. Manual-only checks are not reproducible enough for SC-001/SC-007.

## Decision 4: Discover inventory from code

**Decision**: Generate route and Nitro endpoint inventories from `src/pages/` and `server/api/`; maintain scenario catalog explicitly because executable behavior cannot be inferred safely from filenames alone.

**Rationale**: Code discovery prevents stale hard-coded route/API lists while scenario intent needs reviewed fixtures.

**Alternatives considered**: Documentation-only inventory was rejected because current docs contain stale SPA-only and Phaser-era statements.

## Decision 5: Severity controls order, not completion eligibility

**Decision**: Use P0 data/security/unusable, P1 core/parity/save, P2 localized functional/accessibility, and P3 cosmetic/docs/diagnostics. Fix all severities before completion.

**Rationale**: User clarification forbids deferring any confirmed P0-P3 finding; severity still provides dependency and urgency ordering.

**Alternatives considered**: Deferring P3 or P2 was explicitly rejected.

## Decision 6: Existing quality gates remain authoritative

**Decision**: Required final gates are `npm run typecheck`, `npm run lint`, `npm run lint:style`, `npm run rules:audit`, `npm test`, and `npm run build`, plus browser audit suites introduced by this work item.

**Rationale**: These commands are repository-defined and constitution-required. Audit-specific suites supplement rather than replace them.

**Alternatives considered**: Introducing a new CI platform or alternate build tool is unnecessary and out of scope.
