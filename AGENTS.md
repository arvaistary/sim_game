# Game Life — agent entry

## Host roles

- **Cursor:** Speckit workflows + `.cursor/rules/` are the source of truth for code style and architecture. Use Speckit skills/commands for feature work-items.
- **Codex:** Prefer global lean instructions (`~/.codex/AGENTS.md`, Honey skill). Do not expand this file with Speckit dumps or always-on essay rules.

## Project rules

Follow `.cursor/rules/*.mdc` and `.specify/memory/constitution.md`.
Durable project memory: `.specify/memory/` and `doc/`.

## CCE (when MCP tools are available)

If `context_search` / `session_recall` / `record_decision` / `record_code_area` tools are present:

- Prefer `context_search` for “how/where does X work?” before reading whole files.
- Use `Read` when you already know the path or need full file content to edit.
- `session_recall` before non-trivial design questions; `record_decision` after choices worth keeping.
- If CCE tools are missing, use normal Grep/Read — do not invent CCE calls.

## Output

Be concise. Keep code, paths, commands, and errors exact.
When suggesting edits, show only changed lines with a few lines of context.
