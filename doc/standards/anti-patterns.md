# Anti-patterns and rejected approaches

- broad rewrite without measured need;
- symptom patching at multiple call sites when a shared cause exists;
- speculative abstraction or dependency;
- unrelated formatting mixed into a behavior change;
- weakened, deleted, or skipped tests to hide a failure;
- silent public API or persistence changes;
- manual edits to generated output;
- closing a bug without evidence or verification;
- turning one isolated incident into a permanent rule without a recurring pattern.

Task-specific rejected alternatives belong in `doc/decisions/decisions.md`.
