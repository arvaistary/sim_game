# UI Screen Plan: [FEATURE NAME]

**Work-item**: `[NNN-name]`
**Created**: [DATE]
**Mode**: [full | lite]
**Spec**: [link to spec.md — or N/A in lite mode]
**Plan**: [link to plan.md]
**Data-model**: [link to data-model.md — or N/A]
**Tech canon**: [project stack file, e.g. `.specify/memory/architecture/tech-stack.md`] — source of state management, router, theme/tokens, i18n, test tooling
**Input**: feature screens from `spec.md` §[sections describing behavior and states] (full) — or work-item description + `plan.md` (lite)

**Note**: this artifact is produced by the optional UI step after planning (`/speckit.uiplan`) and lives in the work-item folder next to `plan.md`. UI is the "how"; behavior and states are taken as given from `spec.md` (full) or from the work-item description (lite; anything missing → `[NEEDS CLARIFICATION]`). **The template does not fix concrete technologies**: the names of the state-management library, router, theme, i18n and test tools come from the project's tech canon — just as the stack is not hardcoded into the constitution. This keeps the template reusable and guards against stack drift.

<!--
  COMPLETION CONTRACT (Managed Artifact Completion Rules):
  the finished document must contain no template markers — no [square
  placeholders] and no examples from comments. [NEEDS CLARIFICATION: ...]
  is allowed, but every such marker is duplicated under §"Deferred
  Clarifications" and blocks the gate until closed.
-->

## Applicability *(read before filling)*

Fill in only if the feature **introduces new screens** or **changes the states / navigation** of existing ones. Otherwise the UI step is skipped with a note in `plan.md` ("UI not affected"). Minor cosmetics (padding, copy, color) do not require a full ui-plan — a line in `plan.md` is enough.

## ID Scheme *(invariant)*

- `SCR-###`, `ST-###`, `IX-###` are numbered **sequentially across the whole document**: every ID is unique, the second screen continues the first screen's numbering (e.g. SCR-002 starts at ST-005).
- In references, list IDs **explicitly, without ranges** (`ST-001, ST-002` — not `ST-001…ST-004`): the machine check `check-ui-plan.sh` relies on this.
- The gate, `/speckit.tasks` and `/speckit.analyze` reference these IDs — ambiguity breaks the checks.

## Screen Archetypes *(invariant — read before filling)*

Every screen in §"Screen Overview" gets an **archetype**. The archetype decides which
set of states is the **baseline norm** (a "don't forget to consider" minimum checklist),
instead of a hardcoded `loading/data/empty/error`. The baseline minimum is a checklist,
**not** a closed list: there may be several real `empty`/`error` states — each its own `ST-###`.

| Archetype | Baseline state minimum | Notes |
|---|---|---|
| `collection` | loading / data / empty / error | list; + substates refreshing, loadingMore; empty/error split out |
| `detail` | loading / data / error | single entity; "not found / no access" is a subtype of error |
| `form` | idle / submitting / submitError(message, fieldErrors) / success | input; validation lives on `idle`; `success` is often transient → redirect |
| `gate` | resolving → navigation branches | splash/auto-login; no content, one visible state + redirect decisions |
| `shell` | — (`N/A`) | tab/navigation container; §"Screen States" = `N/A`, described structurally |
| `composite` | — (decomposed into regions) | screen built from 2+ **regions**; each region has its own archetype and controller |

The list is open — a project may add its own archetype. A **region** (for `composite`):
§"Screen States" and §"States → State Model" are repeated per region
(sub-heading "Region: …(archetype)"); the `ST/IX` IDs stay **sequential across the document**
(the region only groups them). Keep §"Component Tree" and §"Test Matrix" as **one
section per screen** (branches/rows tagged with `ST` by region) — otherwise the
deterministic `check-ui-plan.sh` check breaks.

## "What" / "How" boundary *(read before filling)*

<!--
  IMPORTANT: do not duplicate spec.md and do not drag UI components into the spec.
  The `empty` state is a requirement (what the user sees when there is no data) and
  lives in spec.md. The concrete empty-state component is implementation and lives here.
  Source of each section (full list, names match the headings):
    §"Screen States", §"Design Reference"               → from spec.md / description (WHAT)
    §"Route & Context", §"States → State Model",
    §"Accessibility", §"Localization"                    → bridge (spec/canon ↔ implementation)
    §"Component Tree", §"Interactions & Navigation",
    §"Performance", §"Test Matrix"                       → plan (HOW)
-->

## Screen Overview *(required)*

<!--
  ACTION REQUIRED: list every screen of the feature. Each gets an ID SCR-###,
  an ARCHETYPE (see §"Screen Archetypes") and a status relative to the durable
  registry `.specify/memory/ui/screens.md`:
    NEW     — new screen; finalize will add a row to the registry with ID SCREEN-<slug>.
    CHANGED — changing an existing one; put the SCREEN-<slug> from the registry in
              the "Durable-ID" column; describe ONLY the delta (added/changed ST/IX),
              the reader gets the full picture from the registry + prior ui-plans.
-->

| SCR | Screen name | Archetype | Status | Durable-ID (for CHANGED) | Role (one sentence) |
|-----|-------------|-----------|--------|--------------------------|---------------------|
| SCR-001 | [ScreenName] | [collection/detail/form/gate/shell/composite] | [NEW \| CHANGED] | [SCREEN-… or —] | [...] |
| SCR-002 | [ScreenName] | [...] | [...] | [...] | [...] |

---

## SCR-001: [ScreenName]

### Route & Context *(required)*

**Route**: [path and name per the router convention from the tech canon; nesting / tab navigation if any]
**Entry parameters**: [path/query params, passed objects, their types — or N/A]
**Guard / redirect**: [requires auth? where an unauthenticated user is sent]
**Transitions**: in — [where users arrive from]; out — [where actions lead, with references to SCR-### or routes]

### Screen States *(required)* — WHAT, from `spec.md` / description

<!--
  ACTION REQUIRED: fill the table. The baseline state minimum is PER ARCHETYPE
  (the sets are listed in §"Screen Archetypes" — not duplicated here), not a
  hardcoded loading/data/empty/error.
  The minimum is a checklist, not a closed list: split empty (initial/no-query/
  no-results) and error (offline/not-found/no-access) — each its own ST-###.
  A state missing from the mockup → [NEEDS CLARIFICATION: ...]. ST-### IDs are sequential!

  "Source" COLUMN (spec→ui-plan traceability): where the state came from —
  US-### / FR-### / §<section of spec.md> (full) | <item of work-item description> (lite) |
  clarify (defined during /speckit.clarify) | UI-mechanic (an implementation substate:
  skeleton, refreshing — not in the requirements and shouldn't be).

  composite/shell/gate — how to fill this section (repeat per region, or N/A with a
  structural description): see the rule in §"Screen Archetypes".
-->

| ID     | State | Source | When it occurs | What the user sees | Available actions |
|--------|-------|--------|----------------|--------------------|-------------------|
| ST-001 | [...] | [...]  | [...]          | [...]              | [...]             |
| ST-002 | [...] | [...]  | [...]          | [...]              | [...]             |

### States → State Model *(required)* — bridge

<!--
  Binds screen states to the controller state (state management from the tech canon).
  The state model is an immutable type; prefer a sum type/union so that incompatible
  states are unrepresentable. Type/tool names come from the tech canon.

  Screen states (ST-###, WHAT) ≠ model variants (HOW): N:1 is allowed. Empty is
  modeled two ways — a separate `empty` variant OR `loaded` with an empty collection;
  the template does not mandate the choice. The single rule: every ST-### must be
  UNAMBIGUOUSLY derivable from the model — by its own variant, or a variant plus a
  deterministic condition (the "Derivation rule" column). The choice is recorded in
  the table and checked by self-check A.

  Example fill (DO NOT copy as-is):
    | `loading` | ST-001         | —                  | —                          |
    | `loaded`  | ST-002, ST-003 | `items`, `hasMore` | ST-003 when `items` is empty |
    | `error`   | ST-004         | `message`          | —                          |
-->

**State controller**: `[Name]` (presentation layer)
**Input events / signals**: `[Signal1]`, `[Signal2]`, …

| State variant (type) | Covers (ST-###) | State fields | Derivation rule |
|----------------------|-----------------|--------------|-----------------|
| `[variant]`          | [ST-###]        | [fields — or —] | [condition — or —] |

### Component Tree *(required)* — HOW

<!--
  ACTION REQUIRED: hierarchy from the screen's root container downward, branching
  by state. Tag each state branch with its ID — (ST-###): the machine check works
  off these tags. All colors/spacing/typography come only from the theme/design
  tokens; styling literals are forbidden as a practice; the ban becomes a gate when
  a canon exists (see Constitution Check, section B).
-->

```text
[ScreenName] (screen root container)
├─ [header / nav bar]
└─ content area → branch by state:
   ├─ (ST-001) loading → [skeleton / indicator]
   ├─ (ST-003) empty   → [empty state + call to action]
   ├─ (ST-004) error   → [message + retry]
   └─ (ST-002) data    → [content]
```

**Reusable components**: [list anything extracted into a shared layer]
**Token binding**: [which values come from the theme/tokens]

### Interactions & Navigation *(required)* — HOW

<!--
  Each interaction gets an ID IX-### (sequential numbering). The "Source" column
  is as in §"Screen States": US-###/FR-###/§spec (action from the spec) |
  clarify | UI-mechanic (e.g. auto-load on scroll).
-->

| ID     | Gesture / action | Source | Controller event | Result / navigation |
|--------|------------------|--------|------------------|---------------------|
| IX-001 | [...]            | [...]  | `[Signal]`       | [...]               |

**Optimistic updates**: [where the UI changes before the server responds and how it rolls back on error]

### Design Reference *(required)* — from `spec.md` / description

<!--
  Links to the mockups (design source — see the tech canon). For Figma — a link to a
  SPECIFIC frame (URL with node-id, e.g.
  https://www.figma.com/design/<file>?node-id=<id>) so the agent can open it via the
  Figma MCP without searching the file.
-->

- ST-002 (data): [link to mockup]
- ST-003 (empty): [link / NEEDS CLARIFICATION: not in mockup]
- ST-004 (error): [link / NEEDS CLARIFICATION: not in mockup]

**Token mapping** (design token → theme entry):

| Mockup token | Theme entry |
|--------------|-------------|
| [...]        | [...]       |

### Accessibility *(required when a canon exists; otherwise advisory)*

- Semantic labels for interactive elements (for screen readers); mark a toggle as `toggled`.
- Tap target no smaller than the target platform's guideline (e.g. 48dp); support large system fonts.
- Alt text for images; contrast per the mockup.

### Localization *(required when a canon exists; otherwise advisory)*

- All strings go through the project's i18n system (see tech canon), zero hardcoding.
- Pluralization, number/date formatting, relative time.
- Keys introduced by the screen: [list].

### Performance *(optional)*

- Lazy lists for long collections; image caching.
- Minimize rebuilds — update only the changed subtree.

### Test Matrix *(required)* — test strategy from the tech canon; "test-first" only if TDD is requested or mandated by a canon

<!--
  Name concrete test tools per the tech canon. List IDs explicitly, no ranges.
  Below are generalized categories.
-->

| What we verify   | Test type                  | State / scenario |
|------------------|----------------------------|------------------|
| State rendering  | snapshot                   | [ST-###, ST-###, …] |
| Transition logic | state-controller test      | events → states  |
| Interactions     | UI/widget test             | [IX-###, …]      |
| Navigation       | UI test                    | transition leads to route |

---

## Constitution Check (UI gates) *(gate)*

*GATE: pass before `/speckit.tasks`. Re-check after design changes.*

### A. Artifact self-check *(invariant — no canons needed)*

<!--
  Internal integrity of the ui-plan: every reference inside the document is closed.
  These are not constitution gates but a document "linter" — true for any project.
  MOST boxes are checked deterministically by the script
  `.specify/scripts/bash/check-ui-plan.sh <path to ui-plan.md>` — tick those by its green
  status, not "by eye". The two items marked *(LLM-verified)* are NOT machine-checked
  (the script only confirms the ST appears in the section, not that the derivation is
  unambiguous or that the reference is a real link) — judge those yourself; /speckit.analyze
  re-checks them semantically.
-->

- [ ] Every screen from §"Screen Overview" has a filled-in `SCR-###` section
- [ ] Every `ST-###` has a branch in §"Component Tree" and a row in §"Test Matrix"
- [ ] Every `IX-###` has a row in §"Test Matrix"
- [ ] Every `ST-###` is unambiguously derivable from §"States → State Model" (own variant or variant + derivation rule) *(LLM-verified)*
- [ ] Every `ST-###` has a design reference (link or NEEDS CLARIFICATION) *(LLM-verified)*
- [ ] Every `ST-###` has a non-empty "Source" column (traceability to spec/clarify/UI-mechanic)
- [ ] §"Deferred Clarifications" is empty

### B. Constitution compliance *(derived from the PROJECT constitution — cited)*

Fill in by walking the table rows below, not "from memory" — that way you won't miss
relevant canons. The first column ("Concern") is **invariant**: typical UI concerns
bound to ui-plan sections. The template does not know canon numbers or names — they
come from the specific project's constitution.

<!--
  How to fill EACH table row:
  1. Open the project constitution (`.specify/memory/constitution.md`).
  2. The constitution is an empty stub (ALL_CAPS placeholders remain) →
     there is nothing to fill section B with: mark "N/A: constitution not filled in".
     This is NOT "all good": the UI phase is not blocked (no canons → nothing to
     violate), but the state is recorded, and /speckit.analyze raises the unresolved
     constitution placeholders as a finding (as stock spec-kit does). Intentionally
     deferred slots, explicitly justified in the constitution, are not findings.
  3. Otherwise, for the row's concern find the canon in the constitution that pins it:
       • found     → write the canon (ID and name FROM THIS constitution) and how
                     the screen(s) satisfy it (SCR-/ST-/IX- references), mark ✓;
       • not found → "no canon → advisory" (NOT a gate, does not block the phase).
  4. Do not invent canons. A failed gate (concern pinned by a canon but not
     satisfied) = phase ERROR.
-->

| Concern (← ui-plan section) | Project canon (ID + name) | How the screen(s) satisfy it (SCR-/ST-/IX-) | ✓ |
|-----------------------------|---------------------------|---------------------------------------------|-----|
| Styling only via theme tokens; logic outside widgets *(Component Tree, Token binding)* | [§… "…" / no canon → advisory] | … | [ ] |
| Immutability; unrepresentable invalid states; effect isolation *(State Model)* | … | … | [ ] |
| Idempotency; error handling and rollback *(Interactions, Optimistic updates)* | … | … | [ ] |
| i18n, zero hardcoded strings *(Localization)* | … | … | [ ] |
| Tap targets, semantics, contrast *(Accessibility)* | … | … | [ ] |
| UI performance: lazy lists, minimal rebuilds *(Performance)* | … | … | [ ] |
| Testability; Test-First if a canon requires it *(Test Matrix)* | … | … | [ ] |

## Deferred Clarifications

<!-- Collect every [NEEDS CLARIFICATION] from the sections above. Empty — the gate is clean. -->

- [NEEDS CLARIFICATION: ...]
