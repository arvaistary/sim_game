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
   - `.specify/scripts/bash/adopt-project.sh --json`
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

## Managed Artifact Completion Rules

- This workflow owns populated durable memory artifacts under `.specify/memory/`.
- Treat unresolved template markers as blocking. Replace shipped placeholder headings, instructional comments, bracketed examples, and sample bullets with repository-derived facts before reporting success.
- If a memory file or constitution file is still mostly template-derived after an incremental edit, retry with a section-level or file-level rewrite of template-derived content.
- Preserve valid user-authored content in existing memory files; rewrite only template-derived or explicitly targeted sections unless the user explicitly requested a full overwrite.
- If essential repository facts are missing, use explicit, fact-specific `TODO:` markers instead of leaving generic template text in place.
- If unresolved markers still remain after retry, fail the command, keep the partial memory files on disk, and report the unresolved sections instead of claiming success.
