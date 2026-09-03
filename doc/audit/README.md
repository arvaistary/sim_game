# Audit area

The portable checklist is [`../../agent-workflow/checklists/audit.md`](../../agent-workflow/checklists/audit.md). This directory stores Game Life's local checklist extensions and audit records.

- `audit-checklist.md` — repeatable checks;
- `findings.md` — append-only defect and risk journal;
- `recurring-patterns.md` — patterns supported by multiple findings.

Findings are triaged by severity and scope. They are not automatically implementation tasks.

Statuses: `Open` → `In progress` → `Fixed` → `Verified`.

Use `Verified` only after the verification command or test passes and the relevant manual QA is complete. A planned verification path alone is insufficient.

Other statuses: `Accepted risk`, `Duplicate`, `Out of scope`, `Blocked`.

Severity: `P0` blocker/data loss/critical security; `P1` major behavior or release risk; `P2` normal defect; `P3` minor quality issue.
