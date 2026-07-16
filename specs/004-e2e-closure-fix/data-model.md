# Data Model: E2E Lifecycle Closure

This work item introduces no runtime application entities. It defines test-run and audit-evidence records used to prove process lifecycle behavior.

## Entity: IntegrityE2ERun

- **Represents**: One invocation of `npm run test:e2e:integrity`.
- **Fields**:
  - `runId`: stable evidence identifier.
  - `startedAt`: ISO timestamp.
  - `completedAt`: ISO timestamp when process closes.
  - `durationMs`: non-negative elapsed duration.
  - `exitCode`: integer process exit code.
  - `passedTests`: expected value `60` for closure.
  - `viewportProjects`: exact set `390x844`, `768x1024`, `1440x900`.
  - `timedOut`: boolean; true only when bounded timeout fired.
  - `cleanup`: `complete` or `incomplete` based on child/server termination evidence.
  - `output`: redacted command output summary.
- **Validation**: `exitCode === 0`, `timedOut === false`, `passedTests === 60`, and `durationMs <= 180000` for a passing closure run.

## Entity: LifecycleRegressionResult

- **Represents**: Result of the targeted Node/Vitest process-lifecycle check.
- **Fields**:
  - `case`: real-command or hanging-child cleanup case.
  - `status`: pass or fail.
  - `observedExitCode`: child exit code or timeout sentinel `124`.
  - `durationMs`: elapsed test duration.
  - `processTreeTerminated`: boolean.
  - `evidence`: captured, secret-redacted stdout/stderr.
- **Validation**: real-command case requires pass, exit code 0, 60 tests, and <=180000 ms; hanging-child case requires bounded failure and terminated process tree.

## Entity: ClosureEvidence

- **Represents**: Durable 003 audit update.
- **Fields**:
  - `gateRunsPath`: `specs/003-project-integrity-audit/gate-runs.md`.
  - `closureReportPath`: `specs/003-project-integrity-audit/closure-report.md`.
  - `findingsPath`: `specs/003-project-integrity-audit/findings.md`.
  - `runIds`: two successful `IntegrityE2ERun` identifiers.
  - `workingTreeClassification`: build artifact, intentional audit/004 change, or unknown origin.
  - `activeContextStatus`: must not identify closed 003.
- **Validation**: all facts link to observed runs; no unsupported exit-0 or cleanup claim remains.

## Relationships and state transitions

```text
IntegrityE2ERun (two passing instances)
        ↓
LifecycleRegressionResult (real command + bounded hang case)
        ↓
ClosureEvidence (003 artifacts + working-tree classification)
        ↓
003 closure confirmed; active context no longer points to 003
```

No persistence schema, API contract, or game-state transition changes.
