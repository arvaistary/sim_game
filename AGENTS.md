# Game Life — Codex entry

## Project rules

- Follow `agent-workflow/README.md` for the portable workflow.
- Follow `doc/agent-workflow/technology.md` and `doc/agent-workflow/project.md` for Game Life adapters.
- Use global lean instructions for Codex and the shared project rules in `.cursor/rules/10-typing.mdc`, `15-nuxt-typescript.mdc`, `20-code-style.mdc`, `30-architecture.mdc`, and `40-styles.mdc`.

## Codex workflow

- Follow `agent-workflow/README.md` for every repository task.
- Begin with discovery and a baseline; ask grouped questions only after reading relevant code and rules.
- Move through implementation, manual QA, audit, and code review automatically; do not wait for phase commands.
- Pause after implementation for manual QA. Treat reported bugs as part of the current task unless scope is explicitly expanded.
- Use `.agents/skills/agent-task-flow/SKILL.md` as the default task-flow skill.
- Use `.agents/skills/agent-audit/SKILL.md` for audit and `.agents/skills/agent-code-review/SKILL.md` for final review.
- Shell on Windows: start with the environment's native shell. On `CreateProcess`, `helper`, or equivalent startup failure, do not retry indefinitely — switch to explicit Git Bash at `C:\Program Files\Git\bin\bash.exe` (never bare `bash.exe`, WSL, or WindowsApps aliases). Follow `.agents/skills/agent-windows-shell/SKILL.md` and `agent-workflow/layers/environment-windows.md`.
- Codex does not use or create another tool's workflow state or planning artifacts by default.
- Поддерживайте `doc/agent-workflow/current-task.md` в актуальном состоянии и возобновляйте задачу после прерывания вместо запуска параллельной задачи.
- Record findings in `doc/audit/findings.md` and recurring patterns in `doc/audit/recurring-patterns.md`.
- Pause before destructive, irreversible, external, credential-dependent, public-contract, materially different architecture, or new-policy decisions.

## Output

Be concise. Keep code, paths, commands, and errors exact.
