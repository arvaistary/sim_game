# Decision log

## Template

```text
### DEC-YYYYMMDD-NNN — <decision title>

- Date: <date>
- Context: <problem and constraints>
- Decision: <chosen option>
- Rejected: <alternative and reason>
- Consequences: <trade-offs>
- Status: Proposed | Accepted | Superseded
```

## Decisions

### DEC-20260827-001 — Explicit Git Bash fallback path

- Date: 2026-08-27
- Context: Windows shell startup can fail, while bare `bash.exe` resolves first to `C:\Windows\System32\bash.exe` rather than Git Bash. Full access to the workspace does not imply Windows Administrator privileges.
- Decision: Use the Windows-native shell first. If Codex requests elevated shell confirmation, accept it only for the current in-scope operation when no safer route exists. If native startup still fails, use the verified explicit Git for Windows executable `C:\Program Files\Git\bin\bash.exe` through the same-command wrapper and report `fallback-ok` or `elevated-fallback` as applicable.
- Rejected: Bare `bash.exe` resolution, because it is ambiguous and can select a non-Git or WSL launcher.
- Consequences: Fallback is deterministic and bounded; environments without Git for Windows report an execution-environment blocker. Elevated approval does not authorize unrelated or destructive actions.
- Status: Accepted

### DEC-20260827-002 — Selective external practice adapters

- Date: 2026-08-27
- Context: `superpowers`, `game-studio`, and `codex-security` provide useful practices but also contain workflow or stack assumptions that do not fully match Game Life.
- Decision: Keep the portable `agent-task-flow`, `agent-audit`, and `agent-code-review` workflow as the local authority. Adopt compatible practices selectively: brainstorming, risk-based planning, TDD where feasible, systematic debugging, and evidence-based verification; use browser-game playtest checks and targeted trust-boundary reviews when the applicable adapter is available.
- Rejected: Installing all three as unconditional workflow owners, because that could introduce Phaser defaults, duplicate checkpoints, mandatory worktrees or subagents, and external security workflow overhead.
- Consequences: Project behavior stays predictable while useful practices are available through local skills and checklists. Plugin installation remains optional.
- Status: Accepted
