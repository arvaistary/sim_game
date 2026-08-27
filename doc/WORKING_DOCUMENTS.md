# Documentation boundary

## Keep in Git

- `doc/core/`, `doc/GDD/`, `doc/adr/`, `doc/guides/`, `doc/reference/`
- `doc/SERVER_MIGRATION.md`
- Portable agent workflow under `agent-workflow/`
- Game Life workflow adapters under `doc/agent-workflow/`
- Project constitution under `doc/standards/project-constitution.md`

These files describe product rules, architecture, decisions, stable workflows, or current implementation status.

## Keep local only

- `doc/plans/` — ad-hoc implementation plans
- `VERCEL_DEPLOYMENT_PLAN.md` and manual testing journals
- IDE-local plan files

`.gitignore` excludes local work artifacts. Carry durable conclusions into `doc/`, ADRs, or the project journals.
