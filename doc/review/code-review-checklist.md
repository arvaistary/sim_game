# Code review checklist

The portable checklist is [`../../agent-workflow/checklists/code-review.md`](../../agent-workflow/checklists/code-review.md). This file contains the Game Life review overlay.

## Correctness

- [ ] Diff implements requested behavior and no unrequested behavior.
- [ ] Callers, state transitions, error paths, and boundaries were traced.
- [ ] Regression coverage tests observable behavior and edge cases.

## Design

- [ ] Existing patterns and helpers are reused.
- [ ] No unnecessary abstraction, dependency, indirection, or duplication was added.
- [ ] Complexity and performance are appropriate.
- [ ] Public contracts and persistence behavior are unchanged or documented.

## Safety and quality

- [ ] Validation, security, data integrity, and accessibility basics are preserved.
- [ ] Error handling does not hide failures.
- [ ] No generated file, secret, unrelated formatting, or unrelated refactor entered the diff.

## Verification

- [ ] Relevant tests, lint, type checks, and build were run.
- [ ] Baseline and post-change results were compared.
- [ ] Manual QA feedback is resolved or documented.
- [ ] Findings have stable IDs and correct statuses.
- [ ] Verification mode is recorded when Windows shell fallback affected checks.
- [ ] Browser-visible changes include playtest or visual evidence where applicable.
- [ ] Security-sensitive changes include the targeted security review or a documented reason it was not needed.
