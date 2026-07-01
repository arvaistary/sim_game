---
description: Two-phase rules check — automation + agent pass over .cursor/rules
---

# Rules Check (uncommitted)

Optional focus path:
$ARGUMENTS

Use skill **`rules-check-uncommitted`** end-to-end. **Both phases are mandatory.**

## Phase A — automation

1. `git status --short`
2. `npm run rules:audit:changed` (or `npm run rules:audit -- <path>` if $ARGUMENTS set)
3. If `src/**` or `tsconfig.json` changed: `npx nuxt prepare` then `npm run typecheck`
4. Fix and re-run until Phase A passes

## Phase B — agent over `.cursor/rules`

1. Read **all** `.cursor/rules/*.mdc` and [RULES-MAP.md](.cursor/skills/rules-check-uncommitted/RULES-MAP.md)
2. For each uncommitted code path: `git diff` / `git diff --cached` (or full file if untracked)
3. Apply checklist from skill § B3; mark each rule file pass/fail/n/a
4. Fix Phase B findings; re-run Phase A + B until clean

## Output

Return the **Verdict** report from the skill (Phase A table + Phase B table + ready to commit yes/no).

Do not commit or push unless the user explicitly asks.
