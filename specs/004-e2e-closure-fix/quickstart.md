# Quickstart: E2E Lifecycle Closure

Run commands from `E:\project\games\game_life` in PowerShell.

## Preconditions

- Node.js 24.x and installed dependencies are available.
- No unrelated process owns `127.0.0.1:3000`; the test-owned server must be deterministic.
- Preserve existing 003 files before editing closure evidence.

## Verify matrix before implementation

```powershell
npm run test:e2e:integrity -- --list
```

Expected: `Total: 60 tests in 4 files`, with projects `390x844`, `768x1024`, and `1440x900`.

## Run lifecycle regression check

```powershell
npm run test:e2e:integrity:regression
```

Expected: real integrity command returns exit code 0 within 180 seconds; hanging-child case fails fast and leaves no child process.

## Capture two closure runs

```powershell
$run = Measure-Command { npm run test:e2e:integrity }
$code = $LASTEXITCODE
"exitCode=$code durationMs=$([int]$run.TotalMilliseconds)"
```

Repeat command once more. Record both observed exit codes, durations, timestamps, and the Playwright summary in `specs/003-project-integrity-audit/gate-runs.md`.

## Validate surrounding gates

```powershell
npm test
npm run typecheck
npm run rules:audit
npm run build
npm run audit:integrity:validate -- specs/003-project-integrity-audit
```

Do not change route, game, GDD, or archived documents to make lifecycle checks pass.

## Final working-tree review

```powershell
git status --short
git diff --stat
git diff -- package.json playwright.config.ts scripts/e2e test/integration/tooling specs/003-project-integrity-audit
```

Classify each relevant path as build-generated, intentional 004/audit, or unknown origin. Remove closed-003 active context only after all closure facts and validators pass.
