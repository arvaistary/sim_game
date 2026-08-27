"""Validate the portable workflow package structure."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


REQUIRED_FILES = (
    "README.md",
    "layers/core.md",
    "layers/host-codex.md",
    "layers/environment-windows.md",
    "layers/AGENTS.template.md",
    "layers/technology.template.md",
    "layers/project.template.md",
    "checklists/audit.md",
    "checklists/code-review.md",
    "standards/best-practices.md",
    "templates/findings.md",
    "templates/recurring-patterns.md",
    "templates/decision.md",
    "templates/task-state.md",
    "skills/task-flow/SKILL.md",
    "skills/audit/SKILL.md",
    "skills/code-review/SKILL.md",
    "skills/windows-shell/SKILL.md",
)

TASK_STATE_FIELDS = (
    "- Status:",
    "- Phase:",
    "- Goal:",
    "- Acceptance criteria:",
    "- Next action:",
    "- Handoff notes:",
)


def validate(root: Path) -> list[str]:
    errors: list[str] = []
    for relative_path in REQUIRED_FILES:
        path = root / relative_path
        if not path.is_file():
            errors.append(f"missing: {relative_path}")

    for relative_path in REQUIRED_FILES:
        path = root / relative_path
        if not path.is_file() or not relative_path.endswith("SKILL.md"):
            continue
        text = path.read_text(encoding="utf-8")
        if not text.startswith("---\n") or "\nname:" not in text or "\ndescription:" not in text:
            errors.append(f"invalid frontmatter: {relative_path}")
        if re.search(r"<[^>]+>", text):
            errors.append(f"unfinished placeholder: {relative_path}")

    task_state_path = root / "templates/task-state.md"
    if task_state_path.is_file():
        task_state = task_state_path.read_text(encoding="utf-8")
        for field in TASK_STATE_FIELDS:
            if field not in task_state:
                errors.append(f"missing task-state field: {field}")

    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", nargs="?", type=Path, default=Path(__file__).parents[1])
    args = parser.parse_args()
    root = args.root.resolve()
    errors = validate(root)
    if errors:
        print("Workflow validation failed")
        print("\n".join(f"- {error}" for error in errors))
        return 1
    print(f"Workflow validation passed: {root}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
