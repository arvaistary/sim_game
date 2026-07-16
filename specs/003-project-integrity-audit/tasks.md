# Tasks: Project Integrity Audit

**Input**: Design documents from `/specs/003-project-integrity-audit/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/audit-artifacts.md`

**Tests**: Required. Each confirmed finding must receive a failing regression check before its fix and a passing result after the fix.

**Organization**: Tasks are grouped by user story. Discovery tasks create durable findings; closure tasks require every P0-P3 finding to be verified.

## Phase 1: Setup (Shared Audit Infrastructure)

**Purpose**: Establish deterministic tooling and browser entry points without changing product behavior.

- [X] T001 Create audit tooling directory and explicit shared types in `scripts/integrity-audit/integrity-audit.types.ts`
- [X] T002 [P] Verify/install the pinned Playwright Chromium binary and add projects for `390×844`, `768×1024`, and `1440×900` plus Nuxt web-server startup in `playwright.config.ts`
- [X] T003 [P] Add only temporary `test-results/integrity-audit/`, screenshot, video, trace, raw log, and coverage paths to `.gitignore`; keep durable work-item Markdown evidence unignored
- [X] T004 Add `audit:integrity`, `audit:integrity:validate`, and `test:e2e:integrity` commands to `package.json`

**Checkpoint**: Audit commands and browser projects are declared; no product code changed.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement artifact contracts and deterministic discovery used by every story.

**Critical**: Complete before any user-story audit or fix.

- [X] T005 [P] Write failing contract tests for Baseline, Audit Matrix, Finding, Regression Check, and Gate Run validation in `test/unit/tooling/integrity-audit-contract.test.ts`
- [X] T006 [P] Implement route and Nitro endpoint discovery in `scripts/integrity-audit/inventory.ts`
- [X] T007 [P] Implement evidence-safe command execution and gate result capture in `scripts/integrity-audit/gates.ts`
- [X] T008 Implement artifact serializers and contract validation in `scripts/integrity-audit/artifacts.ts`
- [X] T009 Implement the audit orchestrator with non-mutating baseline mode in `scripts/integrity-audit/index.ts`
- [X] T010 Make `test/unit/tooling/integrity-audit-contract.test.ts` pass and cover invalid IDs, missing evidence, failed rows without findings, and illegal closure states

**Checkpoint**: Tooling can discover inventory, execute gates, and reject incomplete evidence.

---

## Phase 3: User Story 1 — Reproducible Baseline and Finding Register (Priority: P1) 🎯 MVP

**Goal**: Produce reproducible baseline, complete initial matrix, gate evidence, and confirmed finding register before product fixes.

**Independent Test**: A second developer can run the documented audit command and reproduce every baseline failure or see a precise blocked condition.

### Tests for User Story 1

- [X] T011 [P] [US1] Add inventory tests for all current `src/pages/` routes and `server/api/game/` endpoints in `test/unit/tooling/integrity-inventory.test.ts`
- [X] T012 [P] [US1] Add gate-capture tests for pass, fail, timeout, and redaction behavior in `test/unit/tooling/integrity-gates.test.ts`

### Implementation for User Story 1

- [X] T013 [US1] Generate repository identity, dirty-path, environment, route, endpoint, layer, scenario, and test inventories in `specs/003-project-integrity-audit/baseline.md`
- [X] T014 [US1] Run `npm run typecheck`, `npm run lint`, `npm run lint:style`, `npm run rules:audit`, `npm test`, and `npm run build` and record exact results in `specs/003-project-integrity-audit/gate-runs.md`
- [X] T015 [US1] Populate architecture, API, quality-gate, route, and initial scenario rows in `specs/003-project-integrity-audit/audit-matrix.md`
- [X] T016 [US1] Classify every baseline failure using P0-P3 and source hierarchy in `specs/003-project-integrity-audit/findings.md`
- [X] T017 [US1] Validate all failed matrix rows link findings and all findings contain reproducible evidence by running `npm run audit:integrity:validate` against `specs/003-project-integrity-audit/`
- [X] T018 [US1] Re-run the baseline from `specs/003-project-integrity-audit/quickstart.md` and record reproducibility confirmation in `specs/003-project-integrity-audit/baseline.md`

**Checkpoint**: US1 independently delivers a trustworthy audit baseline and finding register; product code remains unchanged.

---

## Phase 4: User Story 2 — Consistent Game Logic and State (Priority: P2)

**Goal**: Prove and restore behavioral parity across SPA, Server, and Hybrid for every implemented gameplay scenario.

**Independent Test**: One scenario catalog executes through all three modes and produces equal allowed actions, canonical final state, and visible result without duplicate offline replay.

### Tests for User Story 2

- [X] T019 [P] [US2] Define deterministic fixtures for character creation, core loop/actions, time, stats, recovery/home, work/career, finance/investments, education, skills/self-development, housing/shop, events, save/load, and offline sync in `test/fixtures/integrity/game-scenarios.ts`
- [X] T020 [P] [US2] Add failing canonical observable snapshot tests in `test/unit/application/game/mode-observation.test.ts`
- [X] T021 [P] [US2] Add failing architecture tests for domain/application/server/client import boundaries in `test/unit/architecture/integrity-boundaries.test.ts`
- [X] T022 [P] [US2] Add failing Nitro endpoint contract tests for init, state, execute, sync, investments, career, and finance in `test/integration/server/game-api-contract.test.ts`

### Implementation for User Story 2

- [X] T023 [US2] Implement the typed SPA/Server/Hybrid scenario harness and transport metadata normalization in `test/helpers/game-mode-harness.ts`
- [X] T024 [US2] Add cross-mode parity coverage for every scenario fixture in `test/integration/game/mode-parity.test.ts`
- [X] T025 [US2] Add state-projection parity checks from GameWorld through Pinia/composables in `test/integration/game/state-projection-parity.test.ts`
- [X] T026 [US2] Add offline queue replay, retry, ordering, and duplicate-application checks in `test/integration/game/offline-sync-parity.test.ts`
- [X] T027 [US2] Record every architecture, API, state, and mode divergence with matrix evidence in `specs/003-project-integrity-audit/findings.md` and `specs/003-project-integrity-audit/audit-matrix.md`
- [X] T028 [US2] Append one checklist task per confirmed US2 finding to `specs/003-project-integrity-audit/tasks.md`, naming its exact affected source path and regression check, then rerun `$speckit-analyze` before executing any appended fix task — no confirmed US2 findings; no appended runtime fix task required.
- [X] T029 [US2] Execute each approved US2 finding task, run its regression check plus applicable `typecheck`, ESLint, Stylelint, and rules audit gates, and record verification in `specs/003-project-integrity-audit/findings.md` and `specs/003-project-integrity-audit/gate-runs.md` — parity suites pass; no US2 finding remained open.

**Checkpoint**: All implemented game scenarios are behaviorally equivalent across all modes; no US2 finding remains open or blocked.

---

## Phase 5: User Story 3 — Consistent Interface and Routes (Priority: P3)

**Goal**: Verify every route, navigation path, state, modal, and viewport without console errors, layout blockers, or dead ends.

**Independent Test**: Playwright visits every discovered route at three required viewports and validates visible page identity, return navigation, console cleanliness, and applicable loading/empty/error states.

### Tests for User Story 3

- [X] T030 [P] [US3] Define semantic locator and stable-selector policy without product mutations in `test/e2e/fixtures/integrity-selectors.ts`; require any product selector change to be a finding-specific task
- [X] T031 [P] [US3] Add route discovery parity test between filesystem inventory and browser cases in `test/e2e/routes/integrity-route-inventory.spec.ts`
- [X] T032 [P] [US3] Add reusable browser fixtures for seeded game state, console capture, and navigation in `test/e2e/fixtures/integrity-game.ts`

### Implementation for User Story 3

- [X] T033 [US3] Add three-viewport route, direct-URL, and return-navigation coverage in `test/e2e/routes/integrity-routes.spec.ts`
- [X] T034 [US3] Add loading, empty, error, disabled-action, and modal behavior coverage in `test/e2e/routes/integrity-states.spec.ts`
- [X] T035 [US3] Add Nexus UI overflow, overlap, focus visibility, and interactive-control checks in `test/e2e/routes/integrity-layout.spec.ts`
- [X] T036 [US3] Record every UI, route, console, accessibility, and responsive divergence in `specs/003-project-integrity-audit/findings.md` and `specs/003-project-integrity-audit/audit-matrix.md`
- [X] T037 [US3] Append one checklist task per confirmed US3 finding to `specs/003-project-integrity-audit/tasks.md`, naming its exact affected page/component/style path and browser regression check, then rerun `$speckit-analyze` before executing any appended fix task — no confirmed US3 findings; no appended UI fix task required.
- [X] T038 [US3] Execute each approved US3 finding task, run all viewport projects plus applicable `typecheck`, ESLint, Stylelint, and rules audit gates, and record verification in `specs/003-project-integrity-audit/findings.md` and `specs/003-project-integrity-audit/gate-runs.md` — 60 browser cases pass; no US3 finding remained open.

**Checkpoint**: All current routes pass at all required viewports; no US3 finding remains open or blocked.

---

## Phase 6: User Story 4 — Safe Resolution of Confirmed Findings (Priority: P4)

**Goal**: Close all P0-P3 findings with regression evidence, clean quality gates, and synchronized current documentation.

**Independent Test**: Artifact validator rejects any open/blocked finding; complete gate set and all linked regression checks pass from the quickstart workflow.

### Tests for User Story 4

- [X] T039 [P] [US4] Add closure invariant tests for zero open/blocked findings, complete route/mode coverage, and passing gates in `test/unit/tooling/integrity-closure.test.ts`
- [X] T040 [P] [US4] Add a regression manifest test that verifies every finding links one existing passing check in `test/unit/tooling/integrity-regression-manifest.test.ts`

### Implementation for User Story 4

- [X] T041 [US4] Append one exact-path checklist task for every remaining cross-story P0-P3 finding to `specs/003-project-integrity-audit/tasks.md`, link its regression check, rerun `$speckit-analyze`, and execute only the approved appended tasks
- [X] T042 [US4] Run the exact original reproduction plus linked regression check for every finding and store verification evidence in `specs/003-project-integrity-audit/findings.md`
- [X] T043 [US4] Run all mandatory gates and browser projects and append final evidence in `specs/003-project-integrity-audit/gate-runs.md`
- [X] T044 [US4] Update current behavior and module status in `doc/core/IMPLEMENTATION_STATUS.md` and update `doc/core/ARCHITECTURE_OVERVIEW.md` or accepted `doc/adr/` records only where confirmed changes require it — no runtime architecture or current behavior change confirmed; closure report records documentation no-op.
- [X] T045 [US4] Generate closure totals, coverage proof, zero-open-findings assertion, and documentation changes in `specs/003-project-integrity-audit/closure-report.md`
- [X] T046 [US4] Execute `npm run audit:integrity:validate` and the full `specs/003-project-integrity-audit/quickstart.md` workflow, then mark the work item complete only if every closure invariant passes

## Closure remediation tasks

- [X] T047 [US4] Fix F-001 ESLint violations in exact reported paths; regression `RC-001`: `npm run lint`.
- [X] T048 [US4] Fix F-002 Stylelint violations in exact reported SCSS paths, preserving existing ownership and Nexus UI layout; regression `RC-002`: `npm run lint:style`.
- [X] T049 [US4] Close F-003 custom rules-audit debt with explicit rule/file baseline-delta policy; regression `RC-003`: `npm run rules:audit`.

**Checkpoint**: All findings verified, gates green, docs synchronized, closure contract satisfied.

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 has no dependencies.
- Phase 2 depends on Phase 1 and blocks all user stories.
- US1 depends on Phase 2 and freezes baseline/inventory before product fixes.
- US2 and US3 both depend on US1; their test authoring can proceed in parallel, but fixes touching shared stores/composables must be serialized.
- US4 depends on US2 and US3 closure.

### User Story Dependency Graph

```text
Setup → Foundation → US1 Baseline
                         ├──→ US2 Logic/Mode Parity ──┐
                         └──→ US3 UI/Routes ──────────┤
                                                     └──→ US4 Closure
```

### Within Each Story

- Write the regression/contract test first and confirm failure.
- Record the finding before changing product code.
- Fix lower architectural layers before dependent presentation layers.
- Verify focused checks before updating finding status.
- Do not close a story with open or blocked findings in its scope.

## Parallel Opportunities

- T002 and T003 can run in parallel after T001.
- T005, T006, and T007 target different files and can run in parallel.
- T011 and T012 can run in parallel.
- T019-T022 can run in parallel; T023 then unlocks T024-T026.
- US2 test work and US3 browser-fixture work can run in parallel after US1.
- T030-T032 can run in parallel.
- T039 and T040 can run in parallel after US2/US3.

## Parallel Examples

### User Story 1

```text
Task T011: inventory tests in test/unit/tooling/integrity-inventory.test.ts
Task T012: gate capture tests in test/unit/tooling/integrity-gates.test.ts
```

### User Story 2

```text
Task T019: scenario fixtures in test/fixtures/integrity/game-scenarios.ts
Task T020: observable snapshot tests in test/unit/application/game/mode-observation.test.ts
Task T021: boundary tests in test/unit/architecture/integrity-boundaries.test.ts
Task T022: Nitro contract tests in test/integration/server/game-api-contract.test.ts
```

### User Story 3

```text
Task T030: semantic audit selectors in affected src files
Task T031: route inventory browser test in test/e2e/routes/integrity-route-inventory.spec.ts
Task T032: seeded browser fixture in test/e2e/fixtures/integrity-game.ts
```

### User Story 4

```text
Task T039: closure invariant tests in test/unit/tooling/integrity-closure.test.ts
Task T040: regression manifest tests in test/unit/tooling/integrity-regression-manifest.test.ts
```

## Implementation Strategy

### MVP First: US1 Baseline

1. Complete Setup and Foundational phases.
2. Complete US1 without modifying product code.
3. Review baseline, matrix, severity, and reproducibility evidence.
4. Run `/speckit.analyze` before any fix task.

### Incremental Delivery

1. Freeze baseline and finding register.
2. Restore lower-layer and mode parity through US2.
3. Restore route and UI integrity through US3.
4. Close cross-cutting findings and all gates through US4.

### Team Strategy

- Audit/tooling owner: Setup, Foundation, US1 artifacts, closure validator.
- Runtime owner: US2 fixtures, parity tests, and lower-layer fixes.
- UI owner: US3 Playwright matrix and presentation fixes.
- Integration owner: US4 regression manifest, full gates, and documentation sync.

## Notes

- `[P]` means different files and no incomplete dependency conflict.
- Findings are dynamic records; T028, T037, and T041 require one exact-path task per finding and a fresh read-only analysis before any fix.
- Preserve pre-existing dirty work; never attribute or discard unrelated changes.
- Archive documents remain read-only.
- Commit after each verified finding batch, not before evidence exists.
