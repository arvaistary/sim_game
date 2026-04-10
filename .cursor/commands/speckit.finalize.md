---
description: Verify implementation quality and sync durable knowledge.
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. Resolve active work item:
   - Read `.specify/.active-work-item.json` and locate work-item directory.
   - Error clearly if active state is missing.

2. Load verification inputs:
   - Required: `tasks.md`, `plan.md`
   - Optional: `spec.md` (full mode)
   - Required: `.specify/memory/constitution.md`
   - Optional: `.specify/templates/finalize-report-template.md` as report structure reference.

3. Verify implementation completeness:
   - Evaluate each task from `tasks.md` against implementation evidence.
   - If `spec.md` exists, verify acceptance scenarios/requirements coverage.
   - Record pass/fail with concise evidence notes.

4. Constitution compliance:
   - Check each principle in `.specify/memory/constitution.md` against delivered work.
   - Mark PASS/WARN/FAIL with rationale.

5. Best-effort local verification:
   - Discover and run relevant commands when available:
     - `pytest`
     - `npm test`
     - `cargo test`
     - `make test`
   - If none are available, report graceful skip.

6. Durable docs sync:
   - Update `.specify/memory/` files for any durable architectural/convention decisions discovered during implementation.
   - Never delete, move, or archive work-item artifacts in `specs/`.

7. Output a structured finalize report in chat using sections from `finalize-report-template.md`:
   - Header (work item, mode, date)
   - Task verification
   - Spec verification (full mode only)
   - Constitution compliance
   - Local verification
   - Durable docs updated
   - Completion summary
