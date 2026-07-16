# Tasks: Reliable E2E Integrity Gate Closure

**Input**: Design documents from `E:/project/games/game_life/specs/004-e2e-closure-fix/`  
**Prerequisites**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `quickstart.md`  
**Tests**: Required by FR-003; lifecycle tests must be written before implementation.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish baseline and protect existing 003 evidence before lifecycle changes.

- [X] T001 Record current working-tree state with `git status --short` and preserve `specs/003-project-integrity-audit/` evidence paths in the implementation notes.
- [X] T002 [P] Confirm `npm run test:e2e:integrity -- --list` reports 60 tests in 4 files across `390x844`, `768x1024`, and `1440x900`.
- [X] T003 [P] Confirm `package.json`, `playwright.config.ts`, `test/e2e/routes/*.spec.ts`, and existing integrity tooling are the only planned implementation surfaces; record unrelated dirty paths without modifying them.

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Define shared process-runner behavior before user-story implementation.

**Checkpoint**: Baseline and 003 preservation confirmed; no application-layer changes allowed.

- [X] T004 Define typed process-runner result, timeout sentinel, signal handling, and cleanup invariants in `scripts/e2e/run-integrity.ts` design notes or implementation scaffolding.
- [X] T005 [P] Define lifecycle evidence fields and validation expectations in `test/integration/tooling/integrity-e2e-lifecycle.spec.ts` using `IntegrityE2ERun` and `LifecycleRegressionResult` from `specs/004-e2e-closure-fix/data-model.md`.

## Phase 3: User Story 1 - Reliable browser gate completion (Priority: P1) - MVP

**Goal**: Make the real integrity command finish with exit code 0, preserve all 60 checks, and fail boundedly when a process hangs.

**Independent Test**: Run `npm run test:e2e:integrity:regression`; the real command must report 60 passing tests and exit code 0 within 180 seconds, while the deliberate hanging-child case must terminate within its short test timeout.

### Tests for User Story 1

- [X] T006 [US1] Write the failing positive lifecycle test that spawns `npm run test:e2e:integrity` through `child_process`, captures stdout/stderr and elapsed time, and asserts exit code 0, no timeout, 60 passing tests, and completion within 180 seconds in `test/integration/tooling/integrity-e2e-lifecycle.spec.ts`.
- [X] T007 [US1] Write the failing bounded-hang test using a deliberately non-terminating Node child and assert timeout status, non-zero result, and terminated process tree in `test/integration/tooling/integrity-e2e-lifecycle.spec.ts`.

### Implementation for User Story 1

- [X] T008 [US1] Implement cross-platform Playwright child spawning, argument forwarding, elapsed-time capture, exit-code propagation, 180,000 ms timeout, and Windows/POSIX process-tree cleanup in `scripts/e2e/run-integrity.ts`.
- [X] T009 [US1] Change `test:e2e:integrity` to invoke `node --experimental-strip-types scripts/e2e/run-integrity.ts` and add `test:e2e:integrity:regression` targeting `test/integration/tooling/integrity-e2e-lifecycle.spec.ts` through `vitest.integrity.config.ts` in `package.json`.
- [X] T010 [US1] Remove Playwright `webServer` ownership from `playwright.config.ts`; preserve `testDir`, `testMatch`, base URL, output directory, and all three viewport projects while `scripts/e2e/run-integrity.ts` owns Nuxt startup and cleanup.
- [X] T011 [US1] Run `npm run test:e2e:integrity:regression` and make both lifecycle cases pass without changing `src/`, route specs, or viewport definitions.

**Checkpoint**: User Story 1 is independently complete when the targeted regression command passes and the 60-case list remains unchanged.

## Phase 4: User Story 2 - Root-cause-scoped lifecycle fix (Priority: P1)

**Goal**: Prove lifecycle changes do not weaken application behavior, route coverage, or SPA/Server/Hybrid parity.

**Independent Test**: Inspect the diff and run existing type, unit, build, rules, route, and mode checks; confirm no product-facing paths, GDD, or archive documents were changed for this fix.

- [X] T012 [P] [US2] Compare `playwright.config.ts` and `test/e2e/routes/*.spec.ts` against the baseline to verify all 4 spec files, 60 cases, three viewport projects, and existing assertions remain enabled.
- [X] T013 [P] [US2] Run `npm test`, `npm run typecheck`, and applicable mode-parity integration tests in `test/integration/game/` to verify no runtime behavior changed.
- [X] T014 [US2] Run `npm run rules:audit` and `npm run build`; record whether generated `.output/` changes are build artifacts rather than lifecycle source changes.
- [X] T015 [US2] Review `git diff -- package.json playwright.config.ts scripts/e2e test/integration/tooling src test/e2e doc/GDD doc/archive` and document any pre-existing or unknown-origin paths without reverting or rewriting them.

**Checkpoint**: User Story 2 is independently complete when coverage is unchanged, application checks pass, and the change classification shows test-tooling lifecycle scope only.

## Phase 5: User Story 3 - Fact-based closure evidence (Priority: P2)

**Goal**: Produce reproducible 003 browser-gate evidence and ensure closed 003 is not left as active context.

**Independent Test**: Execute two consecutive full integrity runs, record observed exit code/duration/summary, validate 003 artifacts, and inspect `.specify/.active-work-item.json`.

- [X] T016 [US3] Execute the first full `npm run test:e2e:integrity` run with `Measure-Command`, capture timestamp, exit code, duration, 60-test summary, and cleanup observation in a temporary evidence note outside durable artifacts.
- [X] T017 [US3] Execute the second consecutive full `npm run test:e2e:integrity` run with the same capture method and reject closure if either run is manually terminated, times out, or lacks exit code 0.
- [X] T018 [P] [US3] Update `specs/003-project-integrity-audit/gate-runs.md` with only observed two-run command facts, including exit code, duration, test count, viewport matrix, and lifecycle result.
- [X] T019 [P] [US3] Update `specs/003-project-integrity-audit/closure-report.md` with corrected browser-gate status, two run identifiers, closure totals, and explicit separation of build artifacts, audit changes, and unknown-origin changes.
- [X] T020 [P] [US3] Update `specs/003-project-integrity-audit/findings.md` to remove unsupported browser-gate passing claims, link the lifecycle regression evidence, and close only findings supported by observed results.
- [X] T021 [US3] Run `npm run audit:integrity:validate -- specs/003-project-integrity-audit` and fix only evidence-contract errors in the 003 audit documents.
- [X] T022 [US3] Inspect `.specify/.active-work-item.json`; ensure it does not identify `003-project-integrity-audit` as active, preserving 004 context until finalization requires closure.

**Checkpoint**: User Story 3 is independently complete when both runs and artifact validation pass and active context no longer points to closed 003.

## Phase 6: Polish & Cross-Cutting Verification

**Purpose**: Run final quickstart and consistency checks, then hand off to analysis/finalization.

- [X] T023 [P] Run every command in `specs/004-e2e-closure-fix/quickstart.md` and record final observed statuses in the 004 work notes.
- [X] T024 [P] Re-run `npm run test:e2e:integrity -- --list` and compare output with the 60-case baseline from T002.
- [X] T025 Review all modified and untracked paths with `git status --short` and classify each relevant path in `specs/003-project-integrity-audit/closure-report.md` as build-generated, intentional 004/audit, or unknown origin.
- [X] T026 Verify no changes exist in game logic, routes, SPA/Server/Hybrid behavior, GDD, or archive documents; record the checked path groups in `specs/003-project-integrity-audit/closure-report.md`.
- [X] T027 Run the cross-artifact consistency analysis for `spec.md`, `plan.md`, and `tasks.md` before implementation handoff.

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies; T001 protects evidence and T002/T003 establish baseline.
- **Phase 2 (Foundational)**: Depends on Phase 1; blocks lifecycle implementation.
- **Phase 3 (US1)**: Depends on Phase 2; delivers MVP runner, config ownership, and regression proof.
- **Phase 4 (US2)**: Depends on T008-T011 from US1; validates scope and unchanged product behavior.
- **Phase 5 (US3)**: Depends on US1 and US2; closure evidence is invalid until lifecycle and scope gates pass.
- **Phase 6 (Polish)**: Depends on all required user-story checkpoints.

### User Story Dependencies

```text
Setup -> Foundational -> US1 (MVP) -> US2 scope verification -> US3 closure evidence -> Polish/finalize
```

- **US1 (P1)**: No story dependency after Foundational; primary implementation slice.
- **US2 (P1)**: Depends on US1 because it verifies the changed runner/config and preserved matrix.
- **US3 (P2)**: Depends on US1 and US2 because closure facts require a passing lifecycle fix and scope review.

### Parallel Opportunities

- T002 and T003 can run in parallel after T001.
- T005 can run in parallel with T004.
- T006 and T007 are ordered within the same regression file; implement both before T008.
- T012, T013, T014, and T015 can run in parallel after US1 implementation, provided each records its own evidence.
- T018, T019, and T020 can run in parallel after T016-T017; each edits a different 003 evidence file.
- T023 and T024 can run in parallel after all stories; T025-T026 require the final change set and should follow evidence generation.

## Parallel Example: User Story 1

```text
Task T006: Write positive real-command lifecycle test in test/integration/tooling/integrity-e2e-lifecycle.spec.ts
Task T007: Write bounded hanging-child lifecycle test in test/integration/tooling/integrity-e2e-lifecycle.spec.ts after T006
```

After both tests exist:

```text
Task T008: Implement runner in scripts/e2e/run-integrity.ts
Task T010: Configure owned web server in playwright.config.ts
```

T009 integrates the npm commands after T008 and T010 are ready; T011 is the story checkpoint.

## Implementation Strategy

### MVP First (User Story 1)

1. Complete baseline and foundational tasks.
2. Write failing real-command and bounded-hang regression cases.
3. Implement runner, npm scripts, and owned Playwright server cleanup.
4. Run targeted regression and verify 60-case listing.
5. Stop at the US1 checkpoint before touching closure documents.

### Incremental Delivery

1. US1 makes the browser command reliable.
2. US2 proves no route, viewport, or runtime behavior was weakened.
3. US3 records two reproducible runs and closes evidence gaps in 003.
4. Polish verifies quickstart, working-tree attribution, and cross-artifact consistency.

### Parallel Team Strategy

1. One contributor handles T006-T011 (runner, config, regression).
2. A second contributor can prepare T012-T015 review commands after US1 changes are available.
3. A third contributor can update T018-T020 after the two full runs complete; each evidence file is independent.

## Notes

- Every task uses required checklist syntax with sequential IDs and exact file paths.
- `[P]` marks only tasks with disjoint files or independent evidence.
- No contracts phase is included because this feature changes internal test tooling and exposes no external API.
- Do not implement tasks in `src/`, route files, GDD, or archive documents; those paths are verification-only scope boundaries.
