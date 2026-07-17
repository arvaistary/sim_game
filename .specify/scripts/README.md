# Spec Kit Script Resolution Contract

PowerShell and Bash scripts resolve the current work item using the same priority:

1. `SPECIFY_FEATURE` environment variable (`RESOLUTION_SOURCE=environment`).
2. Valid `.specify/.active-work-item.json` (`RESOLUTION_SOURCE=active-work-item`).
3. Current Git branch (`RESOLUTION_SOURCE=git-branch`).
4. Highest numbered directory under `specs/` when Git is unavailable (`RESOLUTION_SOURCE=latest-spec`).

Active state is valid when `name` is non-empty, `path` is repository-relative without `..`, and the target directory exists. Invalid active state emits a warning and falls back without changing the state file.

Use path-only diagnostics before mutating artifacts:

```powershell
.\.specify\scripts\powershell\check-prerequisites.ps1 -Json -PathsOnly
```

```bash
.specify/scripts/bash/check-prerequisites.sh --json --paths-only
```

Both commands include `RESOLUTION_SOURCE`, `FEATURE_DIR`, `FEATURE_SPEC`, `IMPL_PLAN`, and `TASKS` in JSON output.
