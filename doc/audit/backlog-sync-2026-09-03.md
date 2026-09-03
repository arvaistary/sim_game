# Backlog sync audit — 2026-09-03

**Scope:** сопоставление `doc/` с GitHub Issues / Game Life Kanban (#2)  
**Epic seed:** `scripts/seed-github-backlog.ps1` → issues **#11–#31** (ROADMAP §1.1–4.3)  
**Subtask seed:** `scripts/seed-github-subtasks.ps1` → issues **#32–#143** (112 issues: 3 epics + 109 subtasks)

## Что уже было в канбане

| Источник | Покрытие |
|---|---|
| `doc/core/ROADMAP.md` §1.1–4.3 | 21 epic (#11–#31) |
| `doc/core/IMPLEMENTATION_STATUS.md` | Включено в тела epic через ссылки на модули GDD |
| `doc/agent-workflow/current-task.md` | Закрытая TASK-002 (meta-progression) — не дублировали |

## Пробелы, найденные при аудите (до subtask seed)

### Новые epic (добавлены #32–#34)

| Issue | Источник | Почему не было в ROADMAP seed |
|---|---|---|
| #32 Server-first production cutover | `doc/SERVER_MIGRATION.md` | Шире, чем #29 (только Vercel smoke) |
| #33 Figma-to-app screen parity | `doc/audits/figma-vs-app-gaps.md` | UI-эпик, не выделен в ROADMAP |
| #34 Redis operational layer | `doc/adr/0006`, SERVER_MIGRATION §5–6 | Отложено в ADR, не в ROADMAP |

### Учтено как subtasks существующих epic

| Тема | Epic | Источник |
|---|---|---|
| Hourly-budget unification | #22 subtask | `doc/GDD/modules/15_calendar_planner.md` §15.12 |
| ~311 actions skill migration | #24 subtask | `doc/GDD/modules/16_skill_depth.md` §16.9.6 |
| Integrity audit baseline (AUD-016) | #27 subtask | `doc/audit/findings.md` |
| Prologue microbeat/MatchPairs | #26 subtask | `doc/prologue-audit-2026-08-15.md` |
| Work page Figma layout | #21 subtask | `figma-vs-app-gaps.md` |
| NG+ UI + achievement producers | #11 subtasks | AUD-009 residual |

### Открытые audit findings

| ID | Severity | Issue |
|---|---|---|
| AUD-20260827-016 | P2 | Subtask under #27 — integrity baseline artifacts |

AUD-007–012 в журнале помечены Fixed в post-fix блоке — **не** создавали duplicate issues.

## Намеренно не вынесено в отдельные issues

| Элемент | Причина |
|---|---|
| `doc/new-plans/2026-08-20-current-backlog.md` | Файл отсутствует в репозитории (ссылка битая в ROADMAP/README) |
| Tracked `.output/*` cleanup | Одноразовая repo hygiene; низкий приоритет, упомянуто в VERCEL_GIT_WORKFLOW |
| Agent workflow AUD-001–005 | Fixed/Verified; не продуктовый беклог |
| Architecture ADR nuxt4-analysis recommendations | Архивный анализ, дублирует #27 |

## Структура беклога после sync

```text
Epic #11–#31  (ROADMAP)
  └── sub-issues #35+  (по 3–6 на epic)
Epic #32–#34  (audit gaps)
  └── sub-issues
Label: subtask + P0|P1|P2|P3
```

## Повторный запуск

- `seed-github-backlog.ps1` — создаёт **дубликаты** epic
- `seed-github-subtasks.ps1` — создаёт **дубликаты** sub-issues

Использовать только при пустом проекте или после ручной очистки.

## Следующие шаги

1. В [канбане](https://github.com/users/arvaistary/projects/2) сгруппировать по epic (фильтр `subtask` / parent)
2. Взять #11 + первый subtask в **In Progress**
3. Исправить битую ссылку `doc/new-plans/2026-08-20-current-backlog.md` в ROADMAP (отдельная docs-задача)
