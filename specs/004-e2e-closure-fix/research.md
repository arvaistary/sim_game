# Research: Reliable E2E Integrity Gate Closure

## Decision 1: Treat Playwright as test-owned server lifecycle

**Decision**: Remove Playwright `webServer` ownership from the integrity config. Start Nuxt directly in the typed runner, wait for the deterministic loopback URL, and stop Nuxt in the runner's `finally` block.

**Rationale**: The current configuration uses `reuseExistingServer: true`, and even with reuse disabled, a single passing test reproduced a hang during Playwright webServer teardown on Windows. Playwright 1.50.1 uses recursive `taskkill` there; this environment returns Access Denied and leaves teardown waiting. Direct Nuxt ownership lets the runner use child-process fallback cleanup and guarantees cleanup after Playwright exits. The route matrix and viewport projects are independent of this setting.

**Alternatives considered**:

- Keep Playwright webServer enabled: rejected because its Windows teardown can remain pending after tests pass.
- Set `reuseExistingServer: false` only: rejected because the one-test reproduction still hung during webServer teardown.
- Change application/server behavior: rejected because scope excludes game and SPA/Server/Hybrid runtime behavior.

## Decision 2: Use a typed Node process runner for the npm command

**Decision**: Change `test:e2e:integrity` to invoke `scripts/e2e/run-integrity.ts`, which launches Nuxt and Playwright without intermediate npm/shell wrappers where possible and enforces a 180-second total timeout.

**Rationale**: The observed failure is process lifecycle, not test assertion coverage. A repository-owned runner can wait for server readiness, forward Playwright arguments, record elapsed time, propagate exit code, and terminate both process trees on Windows. Direct Node CLI launches avoid npm.cmd `spawn EINVAL`; `taskkill` is attempted with direct-child fallback.

**Alternatives considered**:

- PowerShell-only wrapper: rejected because npm scripts and CI should use one cross-platform Node implementation.
- Shell `timeout`: rejected because shell semantics and process-tree behavior differ across Windows and POSIX environments.
- Change only Playwright reporter or test assertions: rejected because it does not own dev-server cleanup.

## Decision 3: Add targeted Vitest lifecycle regression coverage

**Decision**: Add an explicitly invoked Vitest integration spec that spawns the real integrity command and also exercises the runner's timeout path with a non-terminating child.

**Rationale**: The real-command case proves the browser gate returns exit code 0 with 60 passes; the short test double proves a future hang is detected without waiting 180 seconds. The spec uses `.spec.ts` plus a dedicated npm script so ordinary `npm test` does not launch a full browser run.

**Alternatives considered**:

- Only assert `--list`: rejected because listing does not start Playwright or the dev server.
- Only rerun the command manually: rejected because it is not a durable regression check.
- Add the full lifecycle test to default Vitest discovery: rejected because every unit run would launch the browser matrix.

## Decision 4: Preserve and fact-check 003 closure artifacts

**Decision**: Modify only `gate-runs.md`, `closure-report.md`, and `findings.md` in 003 after two independent successful runs; classify the full working tree in the final report.

**Rationale**: Existing 003 claims a passing browser gate without reliable process termination evidence. Closure must replace unsupported claims with observed command facts while retaining all historical audit artifacts.

**Alternatives considered**:

- Rewrite or archive 003 documents: rejected because the user requires artifact preservation and no archive-document changes.
- Attribute every dirty path to 004: rejected because build output and unknown-origin changes must remain distinct.

## Evidence collected

- `npm run test:e2e:integrity -- --list` completed with exit code 0 and reported `Total: 60 tests in 4 files`.
- `playwright.config.ts` defines projects `390x844`, `768x1024`, and `1440x900`; its `webServer` block is now absent.
- Installed Playwright 1.50.1 implementation documents Windows webServer force cleanup through recursive `taskkill`; the reproduced environment returned Access Denied and hung after a passing test until the outer runner timeout.
- Existing `scripts/integrity-audit/gates.ts` kills only its direct shell child on timeout; it is not the direct implementation of `test:e2e:integrity`, so it remains out of scope unless implementation proves shared cleanup needs.

All technical unknowns needed for planning are resolved. Exact process-tree API details belong to implementation and verification, not an unresolved product requirement.
