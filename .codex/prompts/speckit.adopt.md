---
description: Bootstrap an existing repository with durable memory docs.
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. Run deterministic scaffolding:
   - Windows: `& powershell -NoProfile -ExecutionPolicy Bypass -File .specify/scripts/powershell/adopt-project.ps1 -Json`
   - POSIX: `.specify/scripts/bash/adopt-project.sh --json`
   - Parse JSON summary (`REPO_ROOT`, `FILES_CREATED`, `FILES_SKIPPED`, `CONSTITUTION_STATUS`).

2. Analyze repository context (read-only analysis only):
   - Inspect key files if present: `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `Makefile`, `Dockerfile`, `README.md`.
   - Inspect directory tree up to 2 levels.
   - Use only repository-derived facts.

3. Fill/update these durable files under `.specify/memory/`:
   - `context.md`
   - `constitution.md`
   - `architecture/overview.md`
   - `architecture/tech-stack.md`
   - `architecture/data-flow.md`
   - `architecture/adr/README.md`
   - `development/code-style.md`

4. Content rules:
   - Never invent modules/components/services that are not discoverable in the repo.
   - Use `TODO:` markers for unknowns.
   - Keep files compact and non-redundant.
   - Avoid tutorials and large code excerpts.
   - Never overwrite `.specify/memory/constitution.md` if it already exists (unless it exists as a template - in this case you need to populate it).

5. Output:
   - Summarize scaffold results and list updated memory files.
   - Call out unresolved TODOs that require human input.
