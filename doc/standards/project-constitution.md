# Game Life project constitution

## Core principles

### Layered architecture

The project follows this dependency direction:

```text
utils/constants → domain → application → infrastructure → stores/composables → components → pages
```

- Domain contains business rules and game balance, without UI or infrastructure.
- Application coordinates use cases without owning business rules.
- Infrastructure owns persistence and external systems.
- Stores, composables, components, and pages own presentation and interaction.
- Import violations between layers are critical failures.

### Type safety

- TypeScript strict mode is mandatory.
- Types belong in `*.types.ts` files when they cross module boundaries.
- Do not use `any`; use `unknown` with a type guard or an explicit domain type.
- Public parameters, return values, and module boundaries are explicitly typed.

### Separation of concerns

Keep domain behavior, application orchestration, infrastructure, and presentation separate. Game balance lives in `src/domain/balance/`; UI components live under `src/components/` with project naming conventions.

### Testing and documentation

- Test behavior, not implementation details.
- Add regression coverage for new or changed behavior when it can be deterministic.
- Keep architecture, implementation status, roadmap, GDD, ADRs, and workflow adapters synchronized.

## Development gates

For source changes, run the relevant checks from `doc/agent-workflow/technology.md`, including typecheck, rules audit, tests, and architecture checks when applicable. Documentation-only changes may use focused link and format checks.

New architecture, public contracts, security policy, or restrictive project rules require an explicit decision record.

## Authority

The shared rules in `.cursor/rules/10-typing.mdc`, `15-nuxt-typescript.mdc`, `20-code-style.mdc`, `30-architecture.mdc`, and `40-styles.mdc` define code conventions. This document defines the project-level principles. The portable workflow defines process, not product or architecture.
