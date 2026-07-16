# Implementation Plan: Project Integrity Audit

**Branch**: `003-project-integrity-audit` | **Date**: 2026-07-15 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-project-integrity-audit/spec.md`

## Summary

Build a reproducible audit pipeline and evidence set, inventory every implemented route and game scenario, compare observable behavior across SPA, Server, and Hybrid, classify every confirmed discrepancy as P0-P3, then fix all findings in dependency-aware batches with regression coverage. Audit tooling stays outside runtime layers; product fixes preserve the existing application-first architecture.

## Technical Context

**Language/Version**: TypeScript 6.0.2 on Node.js 25.x-compatible tooling  
**Primary Dependencies**: Nuxt 4.4.2, Vue 3.5.32, Pinia 3.0.4, Nitro/H3, SCSS 1.85.1  
**Storage**: Browser LocalStorage for SPA saves; Nitro `game-sessions` memory storage with 24-hour TTL for server sessions  
**Testing**: Vitest 4.1.4, Vue Test Utils 2.4.6, happy-dom 17.1.8, Playwright 1.50.1, existing custom rules audit  
**Target Platform**: Modern desktop and mobile browsers; client-rendered Nuxt UI with same-origin Nitro API  
**Project Type**: Full-stack web application with client-only rendering and optional local/server/hybrid command execution  
**Performance Goals**: N/A — product latency, throughput, and memory budgets are outside this integrity audit; existing performance defects may still be recorded when they break specified behavior  
**Constraints**: Behavioral parity across all three modes; all P0-P3 findings fixed; viewport matrix `390×844`, `768×1024`, `1440×900`; no Stage 8 backend, redesign, new gameplay, or archive rewrites  
**Scale/Scope**: 12 current page components/routes, 7 Nitro game endpoints, all implemented game commands/queries, architecture boundaries, quality gates, and working documentation

## Constitution Check

*GATE: Must pass before Phase 0 research and after Phase 1 design.*

| Gate | Pre-design | Post-design evidence |
|---|---|---|
| Layered architecture | PASS | Audit helpers remain in `scripts/`/`test/`; runtime fixes follow domain → application → infrastructure → presentation dependency rules. |
| Strict TypeScript | PASS | New schemas, fixtures, and helpers use explicit named types; `any` remains prohibited. |
| Code style and quality | PASS | ESLint, Stylelint, rules audit, import grouping, separate SCSS, and TSDoc stay mandatory. |
| Separation of concerns | PASS | Mode comparison uses public application/domain contracts; UI tests do not introduce domain rules. |
| Behavior-focused testing | PASS | Regression checks assert commands, final state, visible output, routes, and errors rather than private implementation. |
| Documentation sync | PASS | Audit report, matrix, current architecture docs, and ADRs are updated when behavior or architecture changes. |

No constitution violation is required by the design.

## Project Structure

### Documentation (this feature)

```text
specs/003-project-integrity-audit/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── audit-artifacts.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── domain/                 # GameWorld, balance rules, game-mode and API contracts
├── application/game/       # commands, queries, executors, state sync, offline queue
├── infrastructure/         # mode config and persistence adapters
├── stores/                 # Pinia projections
├── composables/            # presentation coordination
├── components/             # global, game, layout, page and UI components
└── pages/                  # Nuxt routes under / and /game/**

server/
├── api/game/               # Nitro init, state, execute, sync and query endpoints
└── utils/                  # session storage and API error handling

scripts/
├── rules-audit.mjs         # existing rule gate
└── integrity-audit/        # planned deterministic inventory/report helpers

test/
├── unit/
│   ├── architecture/
│   ├── application/game/
│   ├── domain/
│   └── stores/
├── integration/            # planned cross-mode behavioral parity suites
└── e2e/routes/             # route and viewport browser coverage
```

**Structure Decision**: Keep one Nuxt repository and existing layers. Add only audit-specific scripts, fixtures, integration tests, browser configuration, and evidence under existing `scripts/`, `test/`, and work-item directories.

## Audit Design

### Evidence pipeline

1. Capture repository identity, dirty paths, tool versions, route/API inventories, and gate commands into Baseline.
2. Build Audit Matrix from discovered routes, implemented scenarios, execution modes, and required viewports.
3. Run static gates before runtime exploration to separate compilation/style failures from behavioral findings.
4. Execute shared scenario fixtures through SPA, Server, and Hybrid adapters; normalize only transport-specific metadata and compare allowed actions, final state, and visible result.
5. Exercise every route at three viewports with console, navigation, loading, empty, error, and modal assertions.
6. Record each discrepancy as a Finding conforming to `contracts/audit-artifacts.md`.
7. Convert every confirmed finding into one checklist task with an exact affected path and regression check, then rerun `/speckit.analyze` before fixes.
8. Fix approved finding tasks in dependency order: architecture/data integrity → executor/API parity → stores/composables → routes/UI → docs.
9. Re-run each regression check plus applicable typecheck/lint/style/rules gates after every batch and the complete gate set before closure.

### Severity and closure

- **P0**: data corruption/loss, security boundary failure, or application unusable.
- **P1**: core loop blocked, mode parity broken, duplicate application, or save/sync failure.
- **P2**: localized functional, route, state projection, accessibility, or recovery-flow defect.
- **P3**: cosmetic, documentation, diagnostic, or low-impact consistency defect.
- Every confirmed P0-P3 finding must reach `verified`; `blocked`, `deferred`, and `accepted-risk` are not terminal states for this work item.

## Implementation Phases

### Phase 0 — Baseline and inventory

- Add deterministic inventory/report helpers.
- Capture all mandatory gate outputs without changing product code.
- Generate route, endpoint, layer, scenario, and existing-test inventories.
- Materialize initial Audit Matrix and finding register.

### Phase 1 — Architecture and mode parity

- Extend architecture tests for server/client and layer boundaries.
- Create shared scenario fixtures and normalized observable snapshots.
- Cover executor selection, SPA/server/hybrid behavior, serialization, errors, offline queue replay, and idempotency.
- Fix all findings in domain/application/infrastructure/server boundaries before presentation work.

### Phase 2 — State projections and UI routes

- Verify Pinia/composable projections against final GameWorld state.
- Add Playwright configuration for required viewports.
- Exercise every discovered route, navigation return path, modal, loading, empty, error, and disabled-action state.
- Fix all route/UI findings while preserving Nexus UI and separate SCSS rules.

### Phase 3 — Closure and durable knowledge

- Run the complete quality gate set and all regression suites.
- Require zero open/blocked P0-P3 findings and complete matrix coverage.
- Update current implementation status, architecture/ADR documents when warranted, and durable memory.
- Preserve archive content unchanged.

## Risks and Mitigations

| Risk | Mitigation |
|---|---|
| In-memory Nitro sessions make tests order-dependent | Isolate session cookie/storage per scenario and reinitialize world explicitly. |
| Mode-specific transport fields create false parity failures | Compare canonical observable state and UI outcome; exclude only documented transport metadata. |
| `doc/GDD/GDD.md` contains Phaser-era implementation claims | Use `doc/GDD/GDD.md` only for current product behavior; constitution and accepted ADRs override engine/architecture claims, and archive paths remain historical evidence. |
| Fix-all P0-P3 expands scope | Freeze inventory after baseline; new gameplay remains out of scope, but every confirmed in-scope finding is closed. |
| Browser tests become flaky | Use deterministic seed/state fixtures, explicit readiness signals, stable selectors, and no arbitrary sleeps. |

## Complexity Tracking

No constitution exception or additional deployable project is planned.
