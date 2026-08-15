---
name: speckit-uiplan
description: Produce and validate an optional UI screen plan (ui-plan.md) for a feature
  with UI. Use after planning (full) or after start (lite) when the feature introduces
  new screens or changes the states/navigation of existing ones. Creates ui-plan.md with
  screens, states, a state model, interactions, a test matrix and a constitution gate.
metadata:
  author: github-spec-kit
  source: templates/commands/uiplan.md
---

# Speckit UI Plan Skill

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

This skill generates and validates `ui-plan.md` for the active work item. It works in
both **full** mode (after `/speckit.plan`, sourcing the "what" from `spec.md`) and
**lite** mode (after `/speckit.start`, sourcing the "what" from `plan.md` + the work-item
description). UI is the "how"; behavior and states are taken as given.

1. **Setup**: Run one platform-appropriate paths-only command:
   - Windows: `& powershell -NoProfile -ExecutionPolicy Bypass -File .specify/scripts/powershell/check-prerequisites.ps1 -Json -PathsOnly`
   - POSIX: `.specify/scripts/bash/check-prerequisites.sh --json --paths-only`
   from repo root and parse REPO_ROOT, FEATURE_DIR (folder resolution is the fork's
   standard: first `.specify/.active-work-item.json`, then fall back to the branch).
   If FEATURE_DIR has no `plan.md` → ERROR: run `/speckit.plan` (full) or
   `/speckit.start` (lite) first.

2. **Load context**:
   - `plan.md` (required);
   - `spec.md` (if present — full mode: source of WHAT);
   - `data-model.md` (if present: entities for the data/empty states);
   - `.specify/memory/constitution.md` (for the Constitution Check, section B). FILE
     MISSING → anomaly (`/speckit.adopt` was not run): STOP and ask the user to run
     `/speckit.adopt`. A stub file (ALL_CAPS placeholders) is NOT a stop: load it,
     section B yields N/A.
   - `.specify/memory/architecture/tech-stack.md` (tech canon: state management, router,
     theme/tokens, i18n, test tools);
   - `.specify/memory/ui/screens.md` (the durable screen registry — read it
     automatically to resolve CHANGED screens to their `SCREEN-<slug>` and confirm
     archetypes; this is an intentional exception to "commands auto-read only
     constitution.md" — a durable registry is useless without auto-read);
   - `.specify/memory/ui/navigation.md` (the durable navigation map — guards/redirects
     table + `SCREEN-source → SCREEN-target` edges; same writer `/speckit.finalize` as
     screens.md — read it so CHANGED-screen transitions resolve to existing
     `SCREEN-<slug>`/recorded guards instead of contradicting the graph);
   - `.specify/memory/ui/conventions.md` (the durable UI convention/canon registry —
     state-modeling rules, reusable components, and design-token/theme mappings — read
     it so the Constitution Check can "cite the canon, do not invent" rather than
     inventing canons);
   - the work-item description from `.active-work-item.json` (in lite, the primary
     source of WHAT).

3. **Applicability**: if the feature introduces no new screens and changes no states /
   navigation of existing ones — STOP, do NOT create the file, report "UI not affected"
   and offer a note in `plan.md`. Cosmetics are not grounds for a ui-plan (changing the
   COPY/label/styling of an existing state is cosmetic; adding/removing/splitting a state,
   or changing when it occurs or what actions it offers, is a state change).

4. **Create** `FEATURE_DIR/ui-plan.md` from `.specify/templates/ui-plan-template.md`
   if it does not exist. If it exists — extend it, never overwriting hand-authored content.

5. **Fill in per the template** (the template's per-section comments own the ID rules —
   sequential/unique IDs, no ranges; follow them, don't restate them). Per screen:
   - **Screen Overview**: the ARCHETYPE (collection/detail/form/gate/shell/composite) and
     the STATUS vs the durable registry `.specify/memory/ui/screens.md` — NEW, or CHANGED
     (reference the `SCREEN-<slug>` and describe ONLY the delta).
   - **Route & Context**: the route.
   - **Screen States** (ST-###): the baseline minimum is BY ARCHETYPE (not a hardcoded
     loading/data/empty/error); each row's "Source" — `US-###` / `FR-###` / `§spec` (full)
     or `<work-item description item>` (lite) / `clarify` / `UI-mechanic`.
   - **States → State Model**, then the **Component Tree** (branches tagged `(ST-###)`).
   - **Interactions** (IX-###, + Source) and the **Design Reference** (Figma — links to
     specific frames with node-id).
   - **Test Matrix**: explicit IDs.
   - **composite** → repeat §"Screen States" and §"State Model" PER REGION; keep
     §"Component Tree" and §"Test Matrix" as one section per screen.
   - **shell/gate** with no content → §"Screen States" = "N/A (archetype …)" + a
     structural description.
   - Source of WHAT: `spec.md` (full) or the work-item description + `plan.md` (lite);
     anything missing → `[NEEDS CLARIFICATION]`, duplicated under "Deferred Clarifications".

6. **Constitution Check**:
   - Section A: run `& powershell -NoProfile -ExecutionPolicy Bypass -File .specify/scripts/powershell/check-ui-plan.ps1 FEATURE_DIR/ui-plan.md -Json` on Windows, or `.specify/scripts/bash/check-ui-plan.sh --json FEATURE_DIR/ui-plan.md` on POSIX;
     fix the document until the status is green.
   - Section B: read the constitution; walk the CONCERN MAP from the template (section →
     concern, invariant) — for EACH concern look for the project canon that pins it:
     found → a row (concern + the canon cited by its EXACT principle ID and verbatim
     title from `constitution.md` — NOT a section header, NOT a paraphrase + SCR-/ST-/IX-
     references), not found → advisory (not a gate). Stub constitution → "N/A:
     constitution not filled in". Do not invent canons; if unsure of a canon's exact
     name/ID, mark the row advisory rather than guess — the deterministic Section-A gate
     does NOT validate canon names (only `/speckit.analyze` re-verifies them), so a wrong
     guess ships silently.

7. **Completion contract** (Managed Artifact Completion Rules): re-read the file, remove
   template markers; if you cannot, STOP, keep the partial result and report honestly.

8. **Report**: path to `ui-plan.md`, gate status (A — by the script, B — by the table),
   list of deferred clarifications. Next: full → `/speckit.tasks`;
   lite → edits/implementation → `/speckit.finalize`.

## Managed Artifact Completion Rules

- This workflow owns `ui-plan.md`.
- Treat unresolved template markers as blocking. Replace shipped placeholder headings, instructional comments, bracketed examples, and sample rows with concrete UI design content before reporting success.
- If unresolved markers remain after an incremental edit or partial patch, retry with a section-level or file-level rewrite of template-derived content.
- Preserve valid user-authored content when updating an existing `ui-plan.md` unless the user explicitly requested a full overwrite.
- If essential information is missing, use explicit, fact-specific `[NEEDS CLARIFICATION]` markers (duplicated under "Deferred Clarifications") instead of leaving generic template text in place.
- If unresolved markers still remain after retry, fail the command, keep the partial `ui-plan.md` on disk, and report the unresolved sections instead of claiming success.

## Key rules

- Use absolute paths
- ERROR if section A (the script-variant `check-ui-plan` linter) is not green or the constitution is missing
- UI is the "how"; do not re-derive or override the "what" from `spec.md` / the work-item description
