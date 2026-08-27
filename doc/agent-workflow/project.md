# Проектный адаптер Game Life

## Источники продукта

- Требования продукта: `doc/GDD/`;
- статус реализации: `doc/core/IMPLEMENTATION_STATUS.md`;
- roadmap: `doc/core/ROADMAP.md`;
- ссылки на страницы и API: `doc/core/` и `doc/reference/`.

## Источники репозитория

- обзор архитектуры: `doc/core/ARCHITECTURE_OVERVIEW.md`;
- архитектурный контракт: `doc/core/ARCHITECTURE_CONTRACT.md`;
- общие правила кода: `.cursor/rules/10-typing.mdc`, `15-nuxt-typescript.mdc`, `20-code-style.mdc`, `30-architecture.mdc` и `40-styles.mdc`; `.cursor/rules/00-local-only.mdc` — Cursor-only host routing;
- стандарты проекта: `doc/standards/`;
- архитектурные решения: `doc/adr/` и `doc/decisions/decisions.md`.

## Локальные записи

- findings: `doc/audit/findings.md`;
- recurring patterns: `doc/audit/recurring-patterns.md`;
- чеклист аудита: `doc/audit/audit-checklist.md` и `agent-workflow/checklists/audit.md`;
- чеклист code review: `doc/review/code-review-checklist.md` и `agent-workflow/checklists/code-review.md`;
- активное состояние задачи: `doc/agent-workflow/current-task.md`;
- история задач: `doc/agent-workflow/task-history/`.

Активное состояние задачи не должно содержать секреты. После закрытия задачи сохраняйте checkpoint в истории.

## Границы

- Переносимый workflow владеет процессом; этот адаптер владеет контекстом Game Life.
- Не добавляйте правила продукта в переносимое ядро.
- Не изменяйте несвязанные пользовательские изменения.
- Останавливайтесь перед новой архитектурой, public contracts, destructive-действиями, credentials, внешними системами или новой policy проекта.
