# Шаблон состояния задачи

Этот файл — видимый долговременный checkpoint текущей задачи. Храните его в целевом проекте по пути из проектного адаптера, а не в переносимом пакете. Обновляйте после каждой значимой фазы или операции. Не записывайте секреты, токены и содержимое учётных данных.

```text
### TASK-YYYYMMDD-NNN — <краткое название>

- Status: Active | Blocked | Closed
- Phase: Discovery | Clarification | Implementation | Manual QA | Audit | Code review | Close
- Last updated: <date/time>
- Goal: <цель>
- Acceptance criteria: <критерии приёмки>
- Non-goals: <что не входит>
- Baseline: <исходное состояние>
- Decisions: <принятые решения>
- Assumptions: <допущения>
- Changed files: <изменённые файлы>
- Checks completed: <проверки и результаты>
- Known failures: <известные ошибки или None>
- Manual QA: <сценарий и статус>
- Verification mode: <native-shell-ok | fallback-required | fallback-ok | elevated-fallback | fallback-failed | blocker | n/a>
- Next action: <следующее действие>
- Handoff notes: <что должен знать следующий агент>
- History: <путь к архивной записи после закрытия или None>
```

Сохраняйте стабильные значения `Status`, `Phase` и `Verification mode` без перевода: по ним следующий агент определяет состояние без двусмысленности.
