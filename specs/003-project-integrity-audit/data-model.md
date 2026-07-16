# Data Model: Project Integrity Audit

This work item adds audit records, not persistent gameplay entities.

## Baseline

- `id`: stable audit run ID (`AUD-YYYYMMDD-NN`)
- `capturedAt`: UTC timestamp
- `repositoryRevision`: commit SHA
- `dirtyPaths`: paths present before audit; never attributed to audit automatically
- `environment`: Node, npm, OS, browser, and relevant runtime config versions
- `inventories`: route, endpoint, layer, scenario, and test references
- `gateRuns`: ordered Gate Run IDs
- `status`: `capturing | complete | invalid`

Validation: baseline is complete only when repository identity, environment, inventories, and every mandatory initial gate have evidence.

## Audit Matrix Entry

- `id`: unique matrix key
- `kind`: `route | scenario | architecture | api | quality-gate | documentation`
- `subject`: route path, scenario ID, boundary, endpoint, command, or document
- `mode`: `spa | server | hybrid | all | not-applicable`
- `viewport`: `390x844 | 768x1024 | 1440x900 | not-applicable`
- `expectedSource`: active spec, constitution, accepted ADR, or current GDD reference
- `evidence`: command/test/manual evidence references
- `result`: `not-run | pass | fail | blocked`
- `findingIds`: zero or more linked findings

Validation: every current route has three viewport entries; every implemented gameplay scenario has SPA, Server, and Hybrid entries.

## Finding

- `id`: monotonic `F-###`
- `title`: concise observed discrepancy
- `severity`: `P0 | P1 | P2 | P3`
- `status`: `open | confirmed | fixing | fixed | verified | rejected | blocked`
- `expectedSource`: reference following spec → constitution/ADR → current GDD hierarchy
- `evidence`: file/line, command output, screenshot, trace, or state snapshot
- `reproduction`: deterministic ordered steps
- `expected`: expected observable behavior
- `actual`: observed behavior
- `recommendation`: concrete proposed correction or verification approach
- `affectedLayer`: `domain | application | infrastructure | server | store | composable | component | page | documentation | tooling`
- `affectedModes`: one or more of `spa | server | hybrid`
- `rootCause`: required before status `fixing`
- `fixReferences`: changed paths/commit references
- `regressionCheckId`: required before status `fixed`

Validation: `recommendation` is required before status `confirmed`; `rootCause` is required before status `fixing`; `regressionCheckId` is required before status `fixed`.

Transitions: `open → confirmed → fixing → fixed → verified`; `open → rejected` with evidence; any executable state may become `blocked`, but completion requires no blocked record.

## Regression Check

- `id`: stable `RC-###`
- `findingId`: exactly one Finding
- `type`: `unit | integration | browser | architecture | manual`
- `command`: exact executable command or manual protocol
- `assertions`: behavior proven by the check
- `result`: `not-run | pass | fail | blocked`
- `evidence`: output, snapshot, screenshot, or trace reference

Validation: automated checks are preferred; manual checks require repeatable environment and steps.

## Gate Run

- `id`: stable run ID
- `gate`: `typecheck | eslint | stylelint | rules-audit | vitest | browser | build`
- `command`: exact command
- `startedAt`, `completedAt`: UTC timestamps
- `exitCode`: integer
- `result`: `pass | fail | blocked`
- `evidence`: captured output path/reference
- `relatedFindingIds`: findings created or verified by the run

## Mode Equivalence Observation

- `scenarioId`: scenario catalog key
- `mode`: `spa | server | hybrid`
- `allowedActions`: canonical ordered/set representation
- `finalState`: canonical GameWorld snapshot
- `visibleResult`: normalized user-facing result
- `transportMetadata`: retained as evidence but excluded from parity comparison
- `result`: `equivalent | divergent | blocked`

Relationship: three observations form one comparison set; any divergence creates a Finding.
