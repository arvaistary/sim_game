---
description: Start a work item in lite mode (default) or full mode.
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

The text after `start` is the work-item description.

1. Validate repository readiness:
   - If `.specify/` is missing, stop and tell the user to run `adopt` first.
   - If `.specify/.active-work-item.json` exists, show current active work item and ask for confirmation before superseding it.

2. Determine mode:
   - Default mode is `lite`.
   - If user passed `--full`, use `full`.
   - Accept `--short-name <name>` and `--number <N>` and forward them to script.

3. Create the work-item directory and active context by running:
   - `.specify/scripts/bash/start-work-item.sh --json --mode <lite|full> [--short-name ...] [--number ...] "<description>"`
   - Parse JSON response with `WORK_ITEM_NAME`, `WORK_ITEM_DIR`, and `MODE`.

4. Escalation trigger detection (for lite mode only):
   - Review the description for these triggers:
     1) ambiguous requirements
     2) API/contract changes
     3) data model/schema changes
     4) cross-team dependencies
     5) security/compliance impact
     6) multi-module or cross-cutting changes
     7) multi-sprint scope
     8) meaningful UX change
   - If any trigger is found, recommend switching to `--full` and offer to continue in lite only if user confirms.

5. Generation behavior:
   - **Lite mode**: generate/update `plan.md` and `tasks.md` in `WORK_ITEM_DIR`; do not create `spec.md` unless explicitly requested later.
     - Immediately populate both files from the work-item description plus repository context; do not stop at copying or acknowledging template files.
     - `plan.md` must describe the concrete change, affected files or areas, constraints, and verification approach for this work item.
     - `tasks.md` must contain executable, work-item-specific tasks rather than sample checklist entries from the template.
     - Re-read both generated files before reporting success and remove any unresolved template markers.
     - After generation, STOP. Do not implement without explicit user approval.
   - **Full mode**: generate/update only `spec.md` in `WORK_ITEM_DIR`; do not auto-generate `plan.md` or `tasks.md`, full STOP. Do not write any code.Do not implement the spec. Output the spec summary and next steps only, then await user input.

6. Completion report:
   - Show mode, work-item name/path, and files generated.
   - In full mode, suggest next steps: `clarify` → `plan` → `tasks`.
   - In lite mode, suggest next steps: implement work → `finalize`.

## Managed Artifact Completion Rules

- This workflow owns `spec.md` in full mode and any workflow-managed `plan.md` / `tasks.md` output in lite mode.
- Treat unresolved template markers as blocking. Replace shipped placeholder headings, instructional comments, bracketed examples, and sample bullets with concrete artifact content.
- If unresolved markers remain after an incremental edit or partial patch, retry with a section-level or file-level rewrite of template-derived content.
- Preserve valid user-authored content when updating an existing artifact unless the user explicitly requested a full overwrite.
- If essential information is missing, use explicit, fact-specific `NEEDS CLARIFICATION` or `TODO:` markers instead of leaving generic template text in place.
- If unresolved markers still remain after retry, fail the command, keep the partial artifact on disk, and report the unresolved sections instead of claiming success.
