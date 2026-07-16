# Reliable E2E Integrity Gate Closure — Implementation Plan

**Branch**: `004-e2e-closure-fix` | **Date**: 2026-07-16 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification for `004-e2e-closure-fix`

## Summary

Make `npm run test:e2e:integrity` own and close its Nuxt/Playwright process trees deterministically on Windows and CI. Preserve existing 60 tests and three viewport projects; add a bounded Node/Vitest lifecycle regression check; record two consecutive exit-code-0 runs and classify every relevant working-tree path in 003 closure artifacts.

## Technical Context

**Language/Version**: TypeScript 6.0.2; Node.js 24.x runtime with `--experimental-strip-types` for tooling  
**Primary Dependencies**: Playwright/@playwright-test 1.50.1, Vitest 4.1.4, Nuxt 4.4.2  
**Storage**: N/A; temporary Playwright output remains under `test-results/integrity-audit/`  
**Testing**: Playwright route/viewport E2E, Vitest unit/integration tests, existing integrity artifact validator  
**Target Platform**: Windows developer environment and CI-compatible Node process execution  
**Project Type**: Nuxt web application with repository test/audit tooling  
**Performance Goals**: Two complete integrity runs, each with 60 passing tests and exit code 0 within 180 seconds  
**Constraints**: No game logic, route, SPA/Server/Hybrid behavior, GDD, or archived-document changes; no test filtering or viewport reduction; process-tree cleanup must work on Windows  
**Scale/Scope**: 4 Playwright spec files, 60 cases across 390x844, 768x1024, and 1440x900; one lifecycle runner and one targeted Vitest regression spec

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / gate | Status | Plan evidence |
|---|---|---|
| Layered Architecture | PASS | Changes stay in Playwright configuration and test/audit tooling; no `src/` imports or runtime-layer changes. |
| Type Safety | PASS | New runner and regression code use explicit TypeScript types and existing Node/Vitest type support; no `any`. |
| Code Style & Quality | PASS | Follow existing scripts/test naming, `.cursor/rules/`, and lint/typecheck gates. |
| Separation of Concerns | PASS | Process ownership is isolated in test tooling; application behavior remains untouched. |
| Testing | PASS | Preserve 60 Playwright cases, add targeted lifecycle integration coverage, and run existing unit/integrity validators. |
| Documentation | PASS | Update 003 gate-runs, closure-report, findings only with observed facts; retain 003 artifacts and document 004 scope. |

No constitution violations require complexity justification.

## Research Summary

See [research.md](research.md). Local Playwright 1.50.1 implementation confirms that Windows `webServer` teardown uses recursive `taskkill`; the reproduced hang occurs after a passing test while that teardown waits. Direct Nuxt ownership in the runner moves cleanup to a testable fallback path. `npm run test:e2e:integrity -- --list` currently reports exactly 60 tests in 4 files across the three configured projects.

## Design

### Process ownership and cleanup

1. Add typed runner `scripts/e2e/run-integrity.ts`.
   - Resolve Playwright CLI without a shell wrapper where possible and spawn it with `process.execPath`.
   - Forward CLI arguments so `--list`, reporters, and focused diagnostics remain available.
   - Enforce 180,000 ms command timeout.
   - On timeout, interruption, or child failure, terminate the complete child tree using Windows `taskkill /PID /T /F` and a POSIX process-group fallback.
   - Return child exit code on success/failure; return 124 for timeout; always clear timers and listeners.
2. Change `package.json` `test:e2e:integrity` to invoke the typed runner and add a dedicated `test:e2e:integrity:regression` command for the targeted Vitest spec.
3. Remove Playwright `webServer` ownership from `playwright.config.ts`. The runner starts Nuxt directly, waits for `http://127.0.0.1:3000`, then launches Playwright with the unchanged `testDir`, `testMatch`, output directory, and three viewport projects. This bypasses Windows Playwright webServer teardown while keeping coverage unchanged.

### Regression test

Add `test/integration/tooling/integrity-e2e-lifecycle.spec.ts`, intentionally outside default `test/**/*.test.ts` discovery and run by `test:e2e:integrity:regression`.

- Positive case spawns `npm run test:e2e:integrity` through `child_process`, captures stdout/stderr and elapsed time, asserts no timeout, exit code 0, and the 60-test passing summary.
- Negative helper case spawns a deliberately non-terminating Node child with a short injected timeout and asserts bounded failure plus process-tree cleanup; this keeps the hang detector fast while the positive case covers the real command.
- Use an explicit Vitest timeout above 180 seconds and clean all spawned resources in `finally` blocks.

### Closure evidence and attribution

- Preserve all files in `specs/003-project-integrity-audit/`.
- Update only `gate-runs.md`, `closure-report.md`, and `findings.md` for 003 with command, timestamp, exit code, measured duration, 60-test summary, and cleanup result from two consecutive runs.
- Capture `git status --short` and classify paths as build artifacts, intentional 004/audit changes, or unknown-origin changes; do not infer ownership from timestamps alone.
- Remove or replace active context that identifies closed 003 only after the browser gate and artifact validator pass; leave 004 context active until finalization rules require closure.

## Project Structure

### Documentation (this feature)

```text
specs/004-e2e-closure-fix/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
└── quickstart.md
```

003 durable closure evidence remains in:

```text
specs/003-project-integrity-audit/
├── gate-runs.md
├── closure-report.md
└── findings.md
```

### Source Code (repository root)

```text
playwright.config.ts                         # Playwright matrix; server lifecycle owned by runner
package.json                                  # integrity and regression commands
scripts/e2e/run-integrity.ts                  # typed cross-platform process runner
vitest.integrity.config.ts                   # targeted lifecycle regression discovery
test/integration/tooling/integrity-e2e-lifecycle.spec.ts  # targeted Vitest lifecycle regression
test/e2e/routes/*.spec.ts                     # existing 60 route/viewport checks, unchanged
scripts/integrity-audit/*.ts                  # existing artifact/gate validators, changed only if required
```

**Structure Decision**: Keep lifecycle code in repository test tooling. Do not place process management in `src/` or alter application layers. Keep the regression spec outside default Vitest discovery so ordinary unit runs do not launch a full browser matrix; invoke it explicitly through its dedicated npm script.

## Verification Plan

1. `npm run test:e2e:integrity -- --list` reports 60 tests in 4 files.
2. Targeted lifecycle regression passes and its intentional hanging-child case fails within its short test-double timeout.
3. Run `npm run test:e2e:integrity` twice consecutively; capture exit code, duration, and `60 passed` summary without manual termination.
4. Run `npm test`, `npm run typecheck`, `npm run rules:audit`, `npm run build`, and `npm run audit:integrity:validate -- specs/003-project-integrity-audit` as applicable to changed files.
5. Confirm no active context identifies `003-project-integrity-audit`; inspect `git status --short` and classify all relevant changes in closure report.

## Post-Design Constitution Check

| Principle / gate | Status | Evidence after design |
|---|---|---|
| Layered Architecture | PASS | New files are limited to `scripts/e2e`, Playwright configuration, and test tooling; no application imports. |
| Type Safety | PASS | Runner and regression spec are TypeScript with explicit process/result types; Node 24 strip-types execution is already used by audit tooling. |
| Code Style & Quality | PASS | Dedicated scripts and tests follow existing repository paths; typecheck, lint, and rules audit remain verification gates. |
| Separation of Concerns | PASS | Web-server ownership and process cleanup stay outside domain/application/presentation layers. |
| Testing | PASS | Existing 60-case matrix remains unchanged; positive and bounded-negative lifecycle checks are explicit. |
| Documentation | PASS | 003 evidence updates are factual and scoped; 004 plan/data/research/quickstart are durable. |

Design introduces no constitutional violation and no ADR is required because runtime architecture and behavior do not change.

## Complexity Tracking

No violations. Additional runner, targeted Vitest config, and direct Nuxt ownership are required by FR-003 and are isolated from product runtime code.
