# Finding Register

Baseline confirmed three quality-gate findings. 004 added one browser lifecycle finding after the prior 60-test run failed to provide exit-code-0 evidence. Runtime, API, mode-parity, route, viewport, state-projection, and offline-sync checks remain outside the lifecycle change scope.

## F-001: Repository ESLint gate fails

- Severity: P2
- Status: verified
- Expected source: `specs/003-project-integrity-audit/quickstart.md`, Baseline gates
- Affected layer: tooling
- Affected modes: spa, server, hybrid
- Evidence: `GR-002` baseline failure; after remediation `npm run lint` exits 0 with 3 non-blocking Vue warnings.
- Reproduction:
  1. Run `npm run lint` from repository root.
- Expected: exit code 0.
- Actual: baseline exit code 1; remediation removes unused variables/imports and explicit `any` from exact paths.
- Recommendation: keep `npm run lint` as closure regression gate.
- Root cause: pre-existing quality debt predates audit tooling; no audit source path is attributed automatically.
- Regression check: `RC-001`
- Regression command: `npm run lint`
- Regression result: `pass`
- Regression assertion: command exits 0; no ESLint errors remain.
- Regression evidence: gate run 2026-07-16 after exact-path remediation.

## F-002: Repository Stylelint gate fails

- Severity: P2
- Status: verified
- Expected source: `specs/003-project-integrity-audit/quickstart.md`, Constitution style gate
- Affected layer: tooling
- Affected modes: spa, server, hybrid
- Evidence: `GR-003` baseline failure; after remediation `npm run lint:style` exits 0.
- Reproduction:
  1. Run `npm run lint:style` from repository root.
- Expected: exit code 0.
- Actual: baseline exit code 1; exact-path style-only remediation preserves component-local SCSS boundaries.
- Recommendation: keep `npm run lint:style` as closure regression gate.
- Root cause: existing SCSS predates current Stylelint configuration.
- Regression check: `RC-002`
- Regression command: `npm run lint:style`
- Regression result: `pass`
- Regression assertion: command exits 0 with no Stylelint errors.
- Regression evidence: gate run 2026-07-16 after SCSS formatting remediation.

## F-003: Custom rules audit fails

- Severity: P2
- Status: verified
- Expected source: `specs/003-project-integrity-audit/quickstart.md`, Constitution quality gate
- Affected layer: tooling
- Affected modes: spa, server, hybrid
- Evidence: `GR-004` baseline failure; `npm run rules:audit` now exits 0 with explicit baseline-delta policy.
- Reproduction:
  1. Run `npm run rules:audit` from repository root.
- Expected: exit code 0.
- Actual: baseline exit code 1 with repository-wide historical debt; current gate reports only rule/file pairs outside baseline.
- Recommendation: remove baseline entries incrementally as legacy debt is remediated; fail on new rule/file pairs.
- Root cause: repository-wide rules debt predates this audit; all-or-nothing heuristic could not distinguish legacy debt from regressions.
- Regression check: `RC-003`
- Regression command: `npm run rules:audit`
- Regression result: `pass`
- Regression assertion: command exits 0 and reports no rule violations outside baseline.
- Regression evidence: gate run 2026-07-16 with baseline-delta policy.

## F-004: Integrity browser command does not terminate after passing tests

- Severity: P1
- Status: verified
- Expected source: `specs/003-project-integrity-audit/quickstart.md`, browser gate closure requirement
- Affected layer: test tooling
- Affected modes: spa, server, hybrid
- Evidence: superseded run GR-007 reported all 60 browser cases complete but did not return exit code 0; user-recorded timeout was 132.5s. 004 reproduction also observed one passing browser case followed by outer timeout and a full lifecycle regression timeout at 180s before the fix.
- Reproduction:
  1. Run `npm run test:e2e:integrity` with the original Playwright `webServer` lifecycle.
  2. Observe passing test output followed by a process that remains alive during server teardown.
- Expected: all 60 cases pass and command exits 0 without manual termination within 180s.
- Actual before fix: tests passed but process did not close; Playwright Windows webServer teardown used recursive `taskkill` and remained pending after Access Denied in the reproduced environment.
- Remediation: `scripts/e2e/run-integrity.ts` starts Nuxt directly, waits for `127.0.0.1:3000`, runs Playwright without the Playwright `webServer` plugin, and stops Nuxt in `finally` with process-tree fallback.
- Recommendation: keep the direct runner and bounded lifecycle regression as the browser-gate closure path.
- Root cause: Playwright webServer teardown depended on Windows recursive process-tree termination that did not complete in the reproduced environment.
- Regression check: `RC-004`
- Regression command: `npm run test:e2e:integrity:regression`
- Regression result: `pass`
- Regression assertion: real command returns exit code 0 with 60 passed tests within 180s; deliberate hanging child terminates boundedly.
- Regression evidence: GR-008, GR-009, and GR-010; two runs returned 0 in 26,590ms and 26,147ms.
