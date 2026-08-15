---
name: speckit-taskstoissues
description: Convert tasks from tasks.md into GitHub issues. Use after task breakdown
  to track work items in GitHub project management.
metadata:
  author: github-spec-kit
  source: templates/commands/taskstoissues.md
---

# Speckit Taskstoissues Skill

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. Run one platform-appropriate prerequisite command from repo root and parse FEATURE_DIR and AVAILABLE_DOCS list. All paths must be absolute:
   - Windows: `& powershell -NoProfile -ExecutionPolicy Bypass -File .specify/scripts/powershell/check-prerequisites.ps1 -Json -RequireTasks -IncludeTasks`
   - POSIX: `.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks`
1. From the executed script, extract the path to **tasks**.
1. Get the Git remote by running:

```bash
git config --get remote.origin.url
```

> [!CAUTION]
> ONLY PROCEED TO NEXT STEPS IF THE REMOTE IS A GITHUB URL

1. Parse stable task IDs (`T001`, `T002`, ...) and build unique markers in the form `Spec-kit: <work-item>/<task-id>`.
1. Search existing issues for each marker before any write. If issue search/read is unavailable, stop before creating issues and report the missing capability; never guess that an issue is absent.
1. For each task without an existing marker, use the GitHub MCP server to create one issue in the repository represented by the Git remote. Include marker, task text, dependencies, and source artifact path in the body.
1. Report task-to-issue mapping and skipped existing issues; rerunning command must be idempotent.

> [!CAUTION]
> UNDER NO CIRCUMSTANCES EVER CREATE ISSUES IN REPOSITORIES THAT DO NOT MATCH THE REMOTE URL
