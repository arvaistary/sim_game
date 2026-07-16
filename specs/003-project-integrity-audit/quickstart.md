# Quickstart: Project Integrity Audit

## Purpose

Run the audit reproducibly, create evidence before fixes, and close every confirmed P0-P3 finding.

## Preconditions

1. Confirm target resolution:

   ```powershell
   .\.specify\scripts\powershell\check-prerequisites.ps1 -Json -PathsOnly
   ```

   Expected: `BRANCH=003-project-integrity-audit`, `RESOLUTION_SOURCE=active-work-item` or explicit environment override.

2. Preserve pre-existing dirty files. Record `git status --short`; do not discard unrelated changes.
3. Install dependencies already declared by the repository.

## Baseline gates

Run and capture each command independently:

```powershell
npm run typecheck
npm run lint
npm run lint:style
npm run rules:audit
npm test
npm run build
```

Any failure creates or links a Finding. Do not fix product code until `tasks.md` exists and `/speckit.analyze` completes.

## Audit order

1. Inventory `src/pages/`, `server/api/`, layers, executors, and current tests.
2. Populate Audit Matrix.
3. Compare each implemented scenario across SPA, Server, and Hybrid using canonical observable snapshots.
4. Run every route at `390×844`, `768×1024`, and `1440×900`.
5. Record console errors, dead navigation, loading/empty/error gaps, modal failures, and layout defects.
6. Create Findings using `contracts/audit-artifacts.md`.
7. Fix in dependency order and add Regression Checks.
8. Re-run focused gates per batch and complete gates at closure.

## Expected-behavior hierarchy

1. `specs/003-project-integrity-audit/spec.md`
2. `.specify/memory/constitution.md` and accepted `doc/adr/`
3. `doc/GDD/GDD.md` for current product behavior only; constitution and accepted ADRs override Phaser/engine/architecture claims
4. Code and tests are evidence of actual behavior, not automatic expected behavior

Temporary browser artifacts belong in `test-results/integrity-audit/`; durable Baseline, Audit Matrix, Findings, Gate Runs, and Closure Report stay in this work-item directory.

## Completion check

- Audit Matrix complete for all routes, viewports, scenarios, and modes.
- All P0-P3 Findings are `verified`.
- No blocked or deferred Finding remains.
- Every Finding has a passing Regression Check.
- All mandatory gates and browser suites pass.
- Current documentation is synchronized.
