# Best practices

The portable baseline is [`../../agent-workflow/standards/best-practices.md`](../../agent-workflow/standards/best-practices.md). This file contains the Game Life overlay.

- Read before writing; search for existing helpers, callers, tests, and configuration.
- Fix the shared cause instead of adding repeated call-site guards.
- Prefer the smallest change that satisfies acceptance criteria.
- Make state transitions and failure paths explicit.
- Keep tests deterministic and focused on observable behavior.
- Separate baseline failures from regressions.
- Record important trade-offs and rejected alternatives in `doc/decisions/decisions.md`.
- Convert repeated bug patterns into tests or rules, not broad rewrites.
- Recheck the final diff after tests and cleanup.
- Prefer evidence over completion claims: record the command, observed result, and verification mode when fallback was used.
- Apply TDD to deterministic behavior changes and bug fixes where feasible; use a direct verification path for docs, configuration, generated output, and purely visual adjustments.
- For browser-visible changes, verify the player-facing flow, not only DOM or unit-test output.
- Treat security review as a targeted gate for trust-boundary changes, not as a mandatory full scan for every task.
