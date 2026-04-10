# Architecture Decision: Henderson Pattern Adaptation

## Context

`game_life` uses an ECS-first domain model with Nuxt + Pinia as UI orchestration.
`henderson` uses a store/service-heavy Nuxt architecture designed for API-driven e-commerce flows.

Direct migration of the `henderson` approach would move business rules into stores and dilute the ECS boundary.

## Decision

Adopt a hybrid architecture:

- Keep ECS as the single source of domain logic.
- Introduce an explicit application layer between Pinia stores and ECS systems.
- Split application API into commands (mutations) and queries (read-only).
- Reuse selected `henderson` ideas only for module organization and infrastructure hygiene.

## Layer Boundaries

1. `src/stores/**`
   - owns UI state and orchestration
   - may call application facade/use-cases
   - must not import ECS systems directly
2. `src/domain/game-facade/**`
   - owns application use-cases and orchestration of ECS systems
   - may import ECS systems and world
3. `src/domain/ecs/**`
   - owns domain state (components), domain behavior (systems), and world runtime

## Consequences

- Cleaner separation of concerns and easier testability.
- Lower risk of store bloat as features grow.
- Gradual migration path without a breaking rewrite.
