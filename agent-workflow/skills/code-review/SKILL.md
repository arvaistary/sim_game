---
name: agent-code-review
description: Выполняет финальный evidence-based review diff после реализации, Manual QA и аудита.
---

# Code review

Прочитайте `../../layers/core.md`, `../../checklists/code-review.md`, адаптеры технологий и проекта, а также журнал аудита проекта.

Проверьте полный diff относительно критериев приёмки и наблюдаемого поведения. Проследите callers, переходы состояния, persistence, ошибки, contracts, архитектуру, тесты, scope, dead code, дублирование и ненужную сложность. Выполняйте только безопасную cleanup-работу в рамках scope, затем повторяйте затронутые проверки и отдельно сообщайте baseline failures.

Не создавайте branches, worktrees, commits, merges или pull requests, если это явно не запрошено.
