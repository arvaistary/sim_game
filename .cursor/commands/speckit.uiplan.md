---
description: Create and validate an optional UI screen plan for the active Spec-kit work item.
---

Use local skill `speckit-uiplan` end-to-end.

Input: `$ARGUMENTS`

Resolve active work-item paths, determine whether UI is affected, create or update `ui-plan.md` only when needed, run the platform-appropriate validator, and report gate results. Do not modify `spec.md`, `plan.md`, `tasks.md`, or implementation code.
