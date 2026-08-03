# Documentation boundary

## Keep in Git

- `doc/core/`, `doc/GDD/`, `doc/adr/`, `doc/guides/`, `doc/reference/`
- `doc/SERVER_MIGRATION.md`
- Spec-kit workflow documentation and templates under `doc/spec-kit/`
- Durable project memory under `.specify/memory/`

These files describe product rules, architecture, decisions, stable workflows, or current implementation status.

## Keep local only

- `specs/` — active and historical Spec-kit work items: specs, plans, tasks, research, and evidence
- `doc/plans/` — ad-hoc implementation plans
- `doc/spec-kit/specs/*` except `README.md` — manual Spec-kit fallback artifacts
- `VERCEL_DEPLOYMENT_PLAN.md` and manual testing journals
- `.specify/.active-work-item.json` and IDE-local plan files

`.gitignore` excludes local work artifacts; existing files stay on disk and are not deleted. When work finishes, carry durable conclusions into `doc/`, ADRs, or `.specify/memory/` instead of committing the work item itself.
