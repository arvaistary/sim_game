# Audit findings journal

Append findings; do not rewrite history. Keep original evidence when a fix is applied.

## Entry template

```text
### AUD-YYYYMMDD-NNN — <short title>

- Severity: P0 | P1 | P2 | P3
- Status: Open | In progress | Fixed | Verified | Accepted risk | Duplicate | Out of scope | Blocked
- Area: <domain or subsystem>
- Location: <file and line>
- Found in task: <task or conversation reference>
- Symptom: <what happens>
- Reproduction: <steps, input, or evidence>
- Expected: <expected behavior>
- Actual: <actual behavior>
- Impact: <user, data, security, or maintenance impact>
- Root cause: <known cause or Unknown>
- Fix: <change or Not fixed>
- Verification: <test, command, or manual scenario>
- Pattern: <pattern ID or None>
- Notes: <decisions, duplicates, or remaining risk>
```

## Findings

### AUD-20260827-001 — Conflicting rule and skill sources

- Severity: P1
- Status: Verified
- Area: Agent workflow and rule precedence
- Location: `AGENTS.md:6,14-15`; `.cursor/rules/00-local-only.mdc:9-13`
- Found in task: Full audit of the Codex workflow on 2026-08-27
- Symptom: Codex and Cursor can select different authorities for the same repository task.
- Reproduction: Read `.cursor/rules/00-local-only.mdc`, then `AGENTS.md`. The Cursor rule requires only `.cursor/rules/` and `.cursor/skills/`, while `AGENTS.md` requires `doc/agent-workflow.md` and `.agents/skills/` for Codex. `.cursor/skills/` contains only `rules-check-uncommitted`; the Game Life workflow skills are in `.agents/skills/`.
- Expected: Host-specific precedence is explicit: Cursor uses its local rules and skills; Codex uses `AGENTS.md`, `doc/agent-workflow.md`, and `.agents/skills/`, while both obey the project architecture and style constraints.
- Actual: The always-applied Cursor rule is written as a repository-wide source policy and conflicts with the Codex entrypoint.
- Impact: The default workflow, audit, and review skills may be skipped or misrouted.
- Root cause: `.cursor/rules/00-local-only.mdc` is not scoped to Cursor-only execution.
- Fix: Clarify host-specific source precedence and update the affected entrypoints after the policy decision.
- Verification: Run a workflow probe in Codex and Cursor, or an equivalent activation/source-resolution check, after the change.
- Post-fix verification: Static source-resolution review confirms `AGENTS.md` → portable workflow → Codex adapter → canonical skills; `.cursor/rules/00-local-only.mdc` is explicitly Cursor-only.
- Pattern: PAT-20260827-001
- Notes: Speckit exclusion from the Codex workflow is otherwise explicit in `AGENTS.md`, `doc/agent-workflow.md`, and `game-life-task-flow`.

### AUD-20260827-002 — External practice adapters lack an availability gate

- Severity: P2
- Status: Verified
- Area: Hybrid plugin workflow
- Location: `doc/agent-workflow.md:21-23,55`; `.agents/skills/game-life-task-flow/SKILL.md:27-28`; `.agents/skills/game-life-audit/SKILL.md:27-29`
- Found in task: Full audit of the Codex workflow on 2026-08-27
- Symptom: The workflow can instruct the agent to use `game-studio` or `codex-security` even when the corresponding plugin capability is unavailable.
- Reproduction: Inspect the current skill catalog: `game-studio` and `codex-security` are not available as local Game Life skills. The workflow uses imperative routing without an explicit availability check or local fallback.
- Expected: If an adapter is installed and callable, use it; otherwise apply the mirrored local checklist and record that the adapter was unavailable or not applicable.
- Actual: The documents name the adapters but do not define the runtime availability gate or the required fallback evidence.
- Impact: The agent may report a security or playtest pass that was not actually performed, or stop on a missing optional capability.
- Root cause: Optional plugin practices were documented as routing targets without runtime fallback semantics.
- Fix: Add a capability check, local fallback checklist, and explicit “not run” evidence requirement for unavailable adapters.
- Verification: Run a workflow probe with the adapters unavailable and confirm the task continues using local checklists with an explicit note.
- Post-fix verification: The canonical audit skill and checklist define the availability gate, local fallback, and required “not run” evidence; the package validator passes.
- Pattern: None
- Notes: The local journal, checklist, and phase owner should remain authoritative.

### AUD-20260827-003 — Elevated fallback status is not defined consistently

- Severity: P2
- Status: Verified
- Area: Windows shell verification
- Location: `doc/windows-shell-policy.md:46,52`; `doc/agent-workflow.md:67`; `.agents/skills/game-life-audit/SKILL.md:40`
- Found in task: Full audit of the Codex workflow on 2026-08-27
- Symptom: Audit and workflow documents require the `elevated-fallback` verification label, but the shell policy does not define it.
- Reproduction: Compare the verification labels in `doc/agent-workflow.md` and `game-life-audit` with the status list in `doc/windows-shell-policy.md`. The policy lists `native-shell-ok`, `fallback-required`, `fallback-ok`, `fallback-failed`, and `blocker`, but not `elevated-fallback`. Its table also hard-codes “Native shell (elevated PowerShell)”.
- Expected: One canonical status set explains when `elevated-fallback` applies, including the approval boundary and explicit Git Bash wrapper.
- Actual: The label and trigger are split across documents, and the policy still assumes elevated PowerShell in its status table.
- Impact: Verification records can use undefined or contradictory shell states.
- Root cause: The elevated fallback update was propagated to workflow and audit text, but not normalized in the shell policy.
- Fix: Align the status vocabulary, wrapper, approval boundary, and native-shell wording across policy, workflow, and audit/review documents.
- Verification: Cross-file label check plus a controlled shell fallback probe with recorded original error and repository context.
- Post-fix verification: The Windows layer, shell skill, audit checklist, and decision log use the same status vocabulary and explicit wrapper; the package validator passes.
- Pattern: None
- Notes: Full access is not equivalent to Windows Administrator; the documents should preserve that distinction.

### AUD-20260827-004 — Decision log omits approval boundary and elevated wrapper

- Severity: P2
- Status: Verified
- Area: Durable workflow decisions
- Location: `doc/decisions/decisions.md:18-25`
- Found in task: Full audit of the Codex workflow on 2026-08-27
- Symptom: The decision log does not preserve the accepted approval and elevated-fallback behavior discussed for Windows.
- Reproduction: Read `DEC-20260827-001`. It records native-first execution and the explicit Git Bash path, but not the one-time approval boundary, the elevated PowerShell wrapper, the `elevated-fallback` status, or the distinction between full access and administrator privileges.
- Expected: The durable decision records the native attempt, permitted confirmation/elevation boundary, explicit Git Bash wrapper, stop conditions, and reporting label.
- Actual: Only the executable path and rejection of bare `bash.exe` are recorded.
- Impact: Future agents cannot reconstruct the complete shell decision from the decision log alone.
- Root cause: The decision entry captured the executable choice but not the complete operational contract.
- Fix: Amend the decision entry after confirming the canonical status and approval semantics.
- Verification: Review the decision against `doc/windows-shell-policy.md` and the Windows shell skill.
- Post-fix verification: `doc/decisions/decisions.md`, `doc/windows-shell-policy.md`, and the Windows shell skill describe the same approval boundary, wrapper, and status labels.
- Pattern: None
- Notes: This is a documentation consistency issue; no shell behavior was changed by this audit.

### AUD-20260827-005 — Skill validation command is not reproducible

- Severity: P2
- Status: Verified
- Area: Workflow verification and maintenance
- Location: `.agents/skills/game-life-audit/`, `.agents/skills/game-life-code-review/`, `.agents/skills/game-life-task-flow/`, `.agents/skills/game-life-windows-shell/`
- Found in task: Full audit of the Codex workflow on 2026-08-27
- Symptom: The four expected `quick_validate.py` checks cannot be run from the repository.
- Reproduction: Run `python .agents/skills/<skill>/scripts/quick_validate.py` for each Game Life skill. Each command fails because `scripts/quick_validate.py` is absent; no replacement validation command is documented in the skill files.
- Expected: A documented, reproducible structural validation path exists, or the audit reports the exact manual checks that replace it.
- Actual: The validation evidence is not reproducible from the current checkout.
- Impact: Skill syntax, required references, and cross-file consistency can regress without a deterministic pre-commit check.
- Root cause: The workflow skills contain instruction files but no repository-local validator or documented equivalent.
- Fix: Add a minimal validator or document and maintain the actual validation commands.
- Verification: Run the documented validator against all four Game Life skills and record its result.
- Post-fix verification: `python agent-workflow/scripts/validate.py` and `python scripts/validate.py .` both exit 0; all four canonical skills and four discovery wrappers are present.
- Pattern: None
- Notes: This finding does not assess unrelated source changes currently present in the working tree.

### AUD-20260827-006 — Speckit skills are discoverable from the Codex skill directory

- Severity: P2
- Status: Verified
- Area: Host-specific workflow isolation
- Location: `.agents/skills/speckit-*/`; `.cursor/commands/speckit.*`; `doc/spec-kit/README.md`
- Found in task: Reassessment of host-specific workflow boundaries on 2026-08-27
- Symptom: Cursor's Speckit workflow and Codex's conversational workflow share a skill discovery directory.
- Reproduction: `.cursor/commands/` contains the Speckit commands and `.specify/` contains the Speckit state/scripts, while `.agents/skills/` also contains `speckit-*` skills that are exposed to Codex. `AGENTS.md` says Speckit is not the Codex default, but the directory-level isolation is not explicit.
- Expected: Cursor invokes Speckit through `.cursor/commands/speckit.*` and `.specify/*`; Codex invokes `doc/agent-workflow.md` and `game-life-*` skills. Codex must not enter or mutate Speckit state unless explicitly requested.
- Actual: Codex can discover `speckit-*` skills in its project skill catalog, so an ambiguous task or explicit skill trigger can enter the Cursor workflow.
- Impact: A task may unexpectedly create or modify `spec.md`, `plan.md`, `tasks.md`, or `.specify/.active-work-item.json`, causing cross-tool state conflicts.
- Root cause: Speckit support files and Codex-discoverable skills are colocated under `.agents/skills/` without an explicit host-boundary rule.
- Fix: Define and enforce host-specific entrypoints; either remove Speckit skills from Codex discovery or add an explicit Codex deny/ignore contract while preserving `.cursor/commands/speckit.*`.
- Verification: Run an ambiguous feature request in Codex and a `/speckit.start` request in Cursor; confirm only the intended workflow artifacts change.
- Post-fix verification: `.specify/`, `specs/`, `doc/spec-kit/`, old Speckit commands/prompts, and old Speckit/Game Life skill directories are absent; active repository references are absent outside this historical journal.
- Pattern: PAT-20260827-001
- Notes: This finding does not require removing Speckit from the repository; Cursor must retain its Speckit path.

### AUD-20260827-007 — Server day planning does not persist terminal life state

- Severity: P1
- Status: Open
- Area: GameWorld lifecycle and server executor
- Location: `src/application/game/server-executor.ts:91-95,141-150`; `src/domain/game-command-executor.ts:63-66`; `src/domain/game-world/commands/plan-day.ts:209-217`
- Found in task: Repeat audit of the death/endings implementation on 2026-08-27
- Symptom: SPA day planning can end a life, but the server day-planning path does not persist the same terminal transition.
- Reproduction: `createServerExecutor().planDay()` first runs `planDayCommand(GameWorld.fromJSON(before.toJSON()), plan)` on a validation copy. When the copy reaches a death rule, the executor returns that result before sending state-changing commands. When the actual path reaches the day boundary, its `type: time` command only advances age in `GameCommandExecutor` and never calls `recordLifeDay`. Direct probe: a world with `startAge=89` and `currentAge=89` advanced by `365*24` returns `{"success":true,"age":90,"status":"active","deathCause":null}`.
- Expected: SPA and server modes apply and persist the same death rule at the actual day boundary, then expose `/game/end` with a complete report.
- Actual: Server state remains active; a death-causing plan can be rejected without persisting the terminal state, or age can pass 90 through the generic time command.
- Impact: Server-mode players may never reach the final screen and can continue from an invalid life state; behavior diverges by runtime mode.
- Root cause: Life transition is attached to the SPA `planDayCommand` mutation, while server validation uses a disposable copy and server command execution has no day-boundary lifecycle transition.
- Fix: Apply the lifecycle transition to the actual server world/state at day close and persist it in the same command flow; cover natural age, illness, depression, and exhaustion.
- Verification: Add a server-executor test that closes a day causing each terminal rule and asserts persisted `state.life.status`, `deathCause`, and summary.
- Pattern: None
- Notes: This is a release-blocking parity issue for server mode; current unit tests cover the validation copy but not persisted death state.

### AUD-20260827-008 — New Game+ is not guarded by terminal-life state

- Severity: P2
- Status: Open
- Area: New Game+ state transition
- Location: `src/stores/game.store.ts:412-435`
- Found in task: Repeat audit of the death/endings implementation on 2026-08-27
- Symptom: The public store action can reset an active run even though New Game+ is intended to start only after death.
- Reproduction: Call `gameStore.startNewGamePlus()` while `life.status === 'active'`. The action builds `GameWorld.createEmpty()`, preserves only the player name/tags, then replaces or syncs the current session.
- Expected: New Game+ rejects an active life and leaves the current state unchanged; only a terminal life can enter the transition.
- Actual: No `life.status === 'ended'` precondition exists in the store action.
- Impact: A future caller, stale UI path, or direct store invocation can irreversibly reset active progress.
- Root cause: Route middleware protects the current end page, but the state-changing store action does not enforce its own invariant.
- Fix: Add the terminal-state guard to the shared store action and test both active rejection and ended success paths.
- Verification: Store-level test with active and ended snapshots; assert no API replace/reset call and no state mutation on rejection.
- Pattern: None
- Notes: The current end-page route reduces normal exposure but is not an authoritative invariant.

### AUD-20260827-009 — New Game+ does not implement the documented transfer contract

- Severity: P1
- Status: Open
- Area: New Game+ product behavior and persistence
- Location: `src/stores/game.store.ts:417-425`; `doc/GDD/modules/05_save_system.md:288-302`
- Found in task: Repeat audit of the death/endings implementation on 2026-08-27
- Symptom: The enabled New Game+ action creates a fresh state without the progress transfer described in the GDD.
- Reproduction: Complete a life with money, skills, achievements, and revealed knowledge, then invoke the end-page New Game+ action. `nextState` copies only `player.playerName` and `tags.items`; `freshState` supplies zero money, empty skills, reset education/knowledge, and no selected achievement.
- Expected: Transfer the configured 10–20% money buff, 1–2 selected skills at half level, one selected achievement, and revealed knowledge; reset current-life state.
- Actual: Only name and character tags are carried over. The end page exposes the action as active `Новая игра+`.
- Impact: Users lose the documented meta-progression and the feature behaves as a misleading full reset.
- Root cause: New Game+ was wired through the existing init flow before the meta-progression aggregates/selection model were implemented.
- Fix: Implement an explicit transfer policy and selection state, or remove/disable the action until the contract is available; update the status document to match the shipped behavior.
- Verification: Integration test asserts transferred and reset fields in both SPA and server modes.
- Pattern: None
- Notes: The current implementation-status document calls New Game+ implemented but does not state that the GDD transfer fields are absent.

### AUD-20260827-010 — Partial persisted life can enter a dead-end end screen

- Severity: P1
- Status: Open
- Area: Persistence boundary and terminal-state validation
- Location: `src/domain/game-world/bridge.ts:232-250,253-280`; `src/domain/game-world/GameWorld.ts:228-231`; `src/stores/game.store.ts:163-170`; `src/middleware/game-init.ts:44-50`; `src/pages/game/end/index.vue:7-10`
- Found in task: Repeat audit of the death/endings implementation on 2026-08-27
- Symptom: A persisted object with only `life.status = 'ended'` is accepted as a terminal life without a cause or summary.
- Reproduction: `npx tsx -e "import { fromStores } from './src/domain/game-world/bridge.ts'; const life=fromStores({life:{status:'ended'}}).life; console.log(JSON.stringify(life));"` outputs `{"status":"ended","lowMoodDays":0,"deathCause":null,"summary":null}`. Middleware redirects this state to `/game/end`, where the page renders only `Итоговый отчёт пока недоступен.` and no recovery action.
- Expected: Persistence validation accepts an ended state only with a valid cause and complete summary, or repairs/rejects it to a recoverable active/error state.
- Actual: The bridge validates the summary only shallowly and preserves `ended` independently of `deathCause` and `summary`; `GameWorld.fromJSON` clones optional life without invariant validation.
- Impact: A malformed/partial local or server save can strand the player on an end route with no report and no visible way to start over.
- Root cause: Terminal-state invariants are not enforced at the persistence boundary and the route guard trusts the status flag alone.
- Fix: Validate the complete life schema and terminal invariant at every load boundary; provide a recoverable fallback when the report is missing.
- Verification: Persistence tests for missing/invalid cause, incomplete nested summary, valid ended state, and route recovery.
- Pattern: None
- Notes: `fromStores` currently normalizes ordinary missing life to active; the defect is specifically partial data marked `ended`.

### AUD-20260827-011 — Accident death has no runtime producer

- Severity: P1
- Status: Open
- Area: Death-cause integration and random events
- Location: `src/domain/game-world/life/life.types.ts:9-17`; `src/domain/game-world/life/life-rules.ts:26-38`; `src/domain/game-world/commands/mutations.ts:165-183`; `src/domain/game-world/commands/plan-day.ts:212`
- Found in task: Repeat audit of the death/endings implementation on 2026-08-27
- Symptom: The accident rule exists as a pure branch, but the running game never supplies its trigger.
- Reproduction: Search all production call sites for `accidentTriggered` and `recordLifeDay(`. `accidentTriggered` is only declared, read by `evaluateDeathCause`, and covered by unit tests; the day planner calls `recordLifeDay(world)` with the default `false`. No random event/day-end producer exists.
- Expected: The documented random accident event (1–2% per year) or an equivalent event outcome supplies the trigger and persists `deathCause = 'accident'`.
- Actual: Accident death is reachable only through a direct domain call or test input, not normal gameplay.
- Impact: One of the five advertised death causes is functionally unavailable; the final report cannot represent it from actual play.
- Root cause: The domain API was added without wiring it to the existing event/random-roll lifecycle.
- Fix: Integrate a deterministic random accident roll/event outcome at the appropriate year/day boundary and pass it into the actual lifecycle transition.
- Verification: Fake-random integration test through SPA and server day closure; assert accident terminal state and final report.
- Pattern: None
- Notes: The GDD specifies the probability, while the current implementation-status note only documents an external trigger and does not identify a runtime producer.

### AUD-20260827-012 — Depression rule triggers at 30 days instead of “more than 30”

- Severity: P2
- Status: Open
- Area: Death-rule specification parity
- Location: `src/domain/game-world/life/life-rules.ts:3-4,26-33`; `doc/GDD/modules/06_death_system.md:13-15`; `test/unit/domain/game-world/life.test.ts:31-34`
- Found in task: Repeat audit of the death/endings implementation on 2026-08-27
- Symptom: The implementation ends the life on the 30th consecutive low-mood day, while the GDD says “более 30 дней подряд”.
- Reproduction: `evaluateDeathCause({ currentAge: 18, health: 100, mood: 9, energy: 100, stress: 0, lowMoodDays: 30 })` returns `depression`; the unit test explicitly locks that value.
- Expected: Follow the canonical threshold wording consistently: trigger after 31 consecutive days if “more than 30” is intentional, or amend the GDD to “30 дней” if the threshold is inclusive.
- Actual: Code/tests and GDD disagree at the boundary.
- Impact: One-day difference in Game Over timing and ambiguity for future event balancing.
- Root cause: The numeric constant was chosen without resolving the inclusive/exclusive wording in the product source.
- Fix: Decide the canonical boundary, align the rule, test, and GDD.
- Verification: Boundary tests for 29, 30, and 31 consecutive days plus documentation review.
- Pattern: None
- Notes: This is a specification decision, not fixed during audit.

### AUD-20260827-013 — New tasks can overwrite a closed active checkpoint

- Severity: P2
- Status: Verified
- Area: Agent workflow task state
- Location: `agent-workflow/layers/core.md:74-85`; `agent-workflow/skills/task-flow/SKILL.md:10-18`; `agent-workflow/templates/task-state.md:6-24`
- Found in task: Audit of the task-state workflow on 2026-08-27
- Symptom: The workflow says to create a checkpoint when a task starts, but does not define the branch for an existing `Status: Closed` checkpoint or a unique archive filename.
- Reproduction: Start a new task when `doc/agent-workflow/current-task.md` contains a closed task. The documented startup path can replace the file before checking its `History` entry or generating a new `TASK-YYYYMMDD-NNN` identifier.
- Expected: Preserve the closed record, verify or create its history entry, and start a new task with a unique identifier. An active or blocked task must be resumed instead of overwritten.
- Actual: The resume rule covers only `Active` and `Blocked`; the closed-state transition and identifier collision rule are implicit.
- Impact: A careless continuation can lose the visible final checkpoint or overwrite an older history record.
- Root cause: Startup and archival transitions are not specified as an explicit state machine.
- Fix: Document closed-state startup, unique task identifiers, and archive-before-overwrite requirements.
- Verification: Static workflow review plus a simulated `Active → Manual QA → Closed → new task` transition.
- Pattern: None
- Notes: Documentation-only finding; no runtime data is affected by this audit.
- Post-fix verification: Core, task-flow and README now define the `Status: Closed` branch, unique `TASK-YYYYMMDD-NNN` identifiers and archive-before-overwrite; validators and link checks pass.

### AUD-20260827-014 — Checkpoint cadence omits Audit and code review boundaries

- Severity: P2
- Status: Verified
- Area: Agent workflow task state
- Location: `agent-workflow/layers/core.md:76-84`; `agent-workflow/skills/task-flow/SKILL.md:12-18`
- Found in task: Audit of the task-state workflow on 2026-08-27
- Symptom: The required checkpoint update list ends before Audit and code review, although both phases can be interrupted.
- Reproduction: Read the checkpoint cadence and then stop an agent after Audit or during code review. The documents do not require recording the new phase, findings, review result, or next action at those boundaries.
- Expected: Update the checkpoint after Audit and code review, and set the phase explicitly before each one and before Close.
- Actual: The task-flow text only says to update after Manual QA confirmation and then continue automatically.
- Impact: The next agent may resume with stale phase, checks, findings, or next action after context loss or an outage.
- Root cause: Checkpoint cadence was defined for implementation and Manual QA but not for every lifecycle boundary.
- Fix: Add Audit and code review to the cadence and define their phase transitions.
- Verification: Static workflow review plus interruption/resume simulation at each post-QA phase.
- Pattern: None
- Notes: Documentation-only finding; no runtime data is affected by this audit.
- Post-fix verification: Core and task-flow explicitly update the checkpoint before and after Audit, code review and Close; transition-contract and validator checks pass.

### AUD-20260827-015 — Portable workflow hard-codes the task-history directory

- Severity: P2
- Status: Verified
- Area: Workflow portability
- Location: `agent-workflow/layers/core.md:95,99`; `agent-workflow/skills/task-flow/SKILL.md:12,20`
- Found in task: Code review of the task-state workflow on 2026-08-27
- Symptom: The portable core and task-flow refer to a literal `task-history/` directory even though each project adapter may choose a different history path.
- Reproduction: Integrate the package into a project whose adapter stores history outside a directory named `task-history`; follow the closed-task archival instructions.
- Expected: All portable instructions resolve the history path through the project adapter.
- Actual: A literal example path can be mistaken for the required destination and create an unconfigured directory.
- Impact: Closed checkpoints may be archived outside the configured project records, weakening resume and audit continuity.
- Root cause: The archive filename protocol was specified together with a project-specific directory name.
- Fix: Keep only the filename convention in the portable layer and refer to the history directory named by the adapter.
- Verification: Static portability scan, relative-link check and workflow validator after the wording change.
- Pattern: None
- Notes: Documentation-only finding; no runtime data is affected by this review.
- Post-fix verification: Core and task-flow now resolve the history directory through the project adapter; the portable scan finds no hard-coded `task-history/` path, validators pass, and all relative links resolve.
