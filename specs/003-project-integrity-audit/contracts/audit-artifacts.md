# Contract: Audit Artifacts

## Required files

Implementation must produce these durable Markdown records under `specs/003-project-integrity-audit/`:

- `baseline.md`
- `audit-matrix.md`
- `findings.md`
- `gate-runs.md`
- `closure-report.md`

## Finding record

```markdown
## F-001: Short title

- Severity: P0|P1|P2|P3
- Status: open|confirmed|fixing|fixed|verified|rejected|blocked
- Expected source: path + section
- Affected layer: layer
- Affected modes: spa, server, hybrid
- Evidence: command/path/screenshot/state reference
- Reproduction:
  1. deterministic step
- Expected: observable result
- Actual: observable result
- Recommendation: concrete proposed correction or verification approach
- Root cause: required before fixing
- Fix: changed paths or commit
- Regression check: RC-001
```

## Matrix row

```markdown
| ID | Kind | Subject | Mode | Viewport | Expected source | Result | Evidence | Findings |
```

Rules:

- Route coverage contains one row per route and required viewport.
- Scenario coverage contains one row per scenario and execution mode.
- `fail` requires at least one Finding ID.
- `pass` requires evidence.
- `blocked` cannot remain at closure.
- A confirmed Finding requires a non-empty Recommendation.

## Gate record

```markdown
| Run ID | Gate | Command | Exit | Result | Evidence | Findings |
```

All commands are copied exactly. Summaries may redact secrets but must not omit failure context.

Browser screenshots, videos, traces, raw coverage, and command logs are temporary evidence under `test-results/integrity-audit/`; durable Markdown records link them by run ID and summarize the reproducible evidence.

## Closure invariants

- Every confirmed P0-P3 Finding is `verified`.
- No Finding or matrix row is `open`, `confirmed`, `fixing`, `fixed`, or `blocked`.
- Every Finding links one passing Regression Check.
- Every route has passing entries at `390×844`, `768×1024`, and `1440×900`.
- Every implemented scenario has equivalent SPA, Server, and Hybrid observations.
- Mandatory final Gate Runs pass.
- Current docs reflect confirmed behavior/architecture changes; archive remains unchanged.
