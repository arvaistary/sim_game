# Feature Specification: Reliable E2E Integrity Gate Closure

**Feature Branch**: `004-e2e-closure-fix`  
**Created**: 2026-07-16  
**Status**: Completed
**Input**: Repair closure evidence for `003-project-integrity-audit` after 60 Playwright checks pass but `npm run test:e2e:integrity` does not exit cleanly.

## Clarifications

### Session 2026-07-16

- Q: What bounded timeout must the complete integrity E2E command satisfy? → A: 180 seconds.
- Q: What form must detect a hanging integrity E2E process? → A: Node/Vitest integration test using `child_process`.
- Q: How many successful complete runs establish reproducible browser-gate evidence? → A: Two consecutive runs.

## User Scenarios & Testing

### User Story 1 - Reliable browser gate completion (Priority: P1)

As a maintainer, I need the integrity E2E command to terminate on its own with exit code 0 after all route and viewport checks pass, so browser-gate closure is trustworthy.

**Why this priority**: A command that reports passing tests but remains alive cannot provide reproducible closure evidence or safely run in CI.

**Independent Test**: Run `npm run test:e2e:integrity`, capture exit code and elapsed time, and verify all 60 cases pass within the repository-defined timeout without manual termination.

**Acceptance Scenarios**:

1. **Given** the integrity test command starts with its required dev server, **When** all 60 Playwright cases finish, **Then** the command closes its browser, test runner, and server resources and exits with code 0.
2. **Given** a process-lifecycle regression leaves a handle or child process alive, **When** the regression check runs the command, **Then** it fails within the configured time limit and reports non-zero status rather than hanging indefinitely.

### User Story 2 - Root-cause-scoped lifecycle fix (Priority: P1)

As a maintainer, I need the fix to target Playwright or dev-server cleanup only, so route behavior, viewport coverage, SPA/Server/Hybrid behavior, game logic, GDD, and archive records remain unchanged.

**Why this priority**: Integrity audit evidence must distinguish test-harness lifecycle changes from product behavior changes.

**Independent Test**: Inspect the change set and run existing type, unit, build, route, and mode checks required by the audit; confirm no product-facing behavior or coverage was removed.

**Acceptance Scenarios**:

1. **Given** existing route/viewport checks cover 60 cases across three viewports, **When** lifecycle cleanup is corrected, **Then** the same 60 checks remain enabled and passing.
2. **Given** audit and build artifacts already exist for 003, **When** 004 is implemented, **Then** 003 artifacts remain preserved and final reporting separates build artifacts, audit changes, and unknown-origin working-tree changes.

### User Story 3 - Fact-based closure evidence (Priority: P2)

As an auditor, I need reproducible command evidence and an inactive closed-work-item context, so the 003 browser gate can be closed without overstating results.

**Why this priority**: Closure records must prove exit status, duration, test count, and repository state rather than rely on a visual test summary.

**Independent Test**: Re-run the complete integrity command, record exit code, duration, and summary in `gate-runs.md`, update `closure-report.md` and `findings.md`, then verify active context no longer points to closed 003.

**Acceptance Scenarios**:

1. **Given** a completed E2E run, **When** closure artifacts are reviewed, **Then** they include command, timestamp, exit code 0, measured duration, and 60 passing tests.
2. **Given** 003 is closed, **When** active work-item state is inspected, **Then** it is absent or points only to an active 004 item and does not identify 003 as active.

## Edge Cases

- Dev server fails to start: runner exits non-zero promptly and records startup failure, without falsely marking browser gate passing.
- Browser tests pass but server, worker, or child process remains alive: timeout regression check fails and identifies incomplete cleanup.
- Test command is interrupted or times out: closure artifacts retain prior facts and do not claim exit code 0.
- Existing unrelated dirty files are present: final report lists them separately and does not attribute them to 004 without evidence.

## Requirements

### Functional Requirements

- **FR-001**: Integrity E2E command MUST execute all existing 60 route/viewport Playwright checks across three configured viewports.
- **FR-002**: Integrity E2E command MUST close Playwright and dev-server resources after success and exit with code 0 without manual process termination.
- **FR-003**: Node/Vitest lifecycle regression test MUST launch the complete integrity E2E command through `child_process`, enforce a 180-second timeout, fail on non-zero exit or timeout, and clean up the spawned process tree.
- **FR-004**: Lifecycle change MUST NOT remove or weaken route, viewport, SPA, Server, or Hybrid assertions.
- **FR-005**: Lifecycle change MUST NOT alter game logic, application routes, GDD, or archived audit documents unless directly required to repair test cleanup.
- **FR-006**: Closure evidence MUST record command, timestamp, exit code, elapsed duration, pass/fail summary, and test count using observed run facts.
- **FR-007**: `003-project-integrity-audit` artifacts MUST remain preserved while 004 artifacts and code changes are clearly identified.
- **FR-008**: Active work-item context MUST NOT continue to identify closed 003 after closure is confirmed.
- **FR-009**: Final report MUST distinguish build-generated artifacts, intentional audit changes, and working-tree changes of unknown origin.

## Key Entities

- **Integrity E2E run**: One invocation of `npm run test:e2e:integrity`, including exit code, duration, test summary, and cleanup outcome.
- **Lifecycle regression check**: Automated bounded-time check proving the E2E command terminates and returns expected status.
- **Closure evidence**: Updated `gate-runs.md`, `closure-report.md`, and `findings.md` facts supporting 003 closure.
- **Active work-item context**: `.specify/.active-work-item.json` state identifying current work item.

## Success Criteria

### Measurable Outcomes

- **SC-001**: `npm run test:e2e:integrity` completes without manual termination, returns exit code 0, and reports 60 passing tests.
- **SC-002**: Complete E2E command finishes within 180 seconds with exit code 0 on two consecutive invocations, each reporting 60 passing tests.
- **SC-003**: Regression check fails within its bounded timeout when cleanup is intentionally prevented or the command remains alive.
- **SC-004**: 003 closure artifacts contain observed exit code, elapsed duration, and 60-test summary, with no unsupported passing claim.
- **SC-005**: No active context identifies closed `003-project-integrity-audit`, and final working-tree classification accounts for every relevant changed path.
