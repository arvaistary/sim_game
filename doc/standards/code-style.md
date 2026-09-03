# Code style

The canonical style and architecture rules are the shared files in `.cursor/rules/10-typing.mdc`, `15-nuxt-typescript.mdc`, `20-code-style.mdc`, `30-architecture.mdc`, and `40-styles.mdc`. The portable workflow is in `agent-workflow/`; this document defines how Codex applies the project rules.

- Follow the local pattern before introducing a new one.
- Use names that describe domain behavior; avoid unexplained abbreviations.
- Keep functions and modules focused.
- Validate input at trust boundaries and preserve error handling.
- Keep public contracts explicit and document non-obvious invariants.
- Add regression coverage for changed behavior and edge cases.
- Keep formatting-only changes out of functional diffs.
- Preserve accessibility basics and user-visible behavior where UI is involved.
- Do not edit generated files manually when a source or generator exists.
