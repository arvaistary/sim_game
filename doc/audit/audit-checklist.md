# Audit checklist

## Scope and behavior

- [ ] Matches requested behavior and acceptance criteria.
- [ ] Non-goals were not implemented accidentally.
- [ ] Existing callers and state transitions remain compatible.
- [ ] Edge cases and invalid input have defined behavior.

## Correctness and data

- [ ] Trust-boundary input is validated.
- [ ] Errors do not cause data loss or silent corruption.
- [ ] Persistence and serialization are safe where applicable.
- [ ] Repeated operations are idempotent where required.

## Security and privacy

- [ ] Authentication and authorization remain intact where applicable.
- [ ] Secrets and sensitive data are not logged or embedded.
- [ ] User-controlled output is handled safely.

## Maintainability

- [ ] Existing helpers and conventions are reused.
- [ ] No speculative abstraction, dead code, or accidental dependency was added.
- [ ] Complexity is appropriate for current scale.
- [ ] Public behavior and invariants are documented.

## Tests and delivery

- [ ] Regression tests cover changed behavior and edge cases.
- [ ] Relevant tests, lint, type checks, and build pass.
- [ ] Baseline failures are distinguished from new failures.
- [ ] Manual QA is complete or remaining risks are documented.
- [ ] Final diff contains no unrelated changes.

## Browser game QA (when applicable)

- [ ] First actionable screen boots correctly.
- [ ] Main player actions and state transitions work.
- [ ] HUD, menus, and overlays remain readable and do not obscure important content.
- [ ] Relevant keyboard, pointer, responsive, and reduced-motion states were checked.
- [ ] Screenshots or equivalent evidence cover visual states that DOM assertions cannot prove.

## Security gate (when applicable)

- [ ] Security-sensitive scope was identified.
- [ ] The targeted security sub-audit was run, or the reason it was not needed is recorded.
- [ ] Auth, input validation, secrets, data integrity, and error boundaries were verified.

## Consistency

- [ ] Shared `.cursor/rules/*.mdc` and `doc/standards/project-constitution.md` are respected.
- [ ] Findings are recorded and deduplicated.
- [ ] Repeated negative patterns were evaluated for a rule or test update.
