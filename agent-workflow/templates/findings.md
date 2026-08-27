# Шаблон журнала findings

Добавляйте новые findings; сохраняйте исходные доказательства после применения исправления.

```text
### AUD-YYYYMMDD-NNN — <краткое название>

- Severity: P0 | P1 | P2 | P3
- Status: Open | In progress | Fixed | Verified | Accepted risk | Duplicate | Out of scope | Blocked
- Area: <домен или подсистема>
- Location: <файл и строка>
- Symptom: <что происходит>
- Reproduction: <шаги, входные данные или доказательство>
- Expected: <ожидаемое поведение>
- Actual: <фактическое поведение>
- Impact: <влияние на пользователя, данные, безопасность или сопровождение>
- Root cause: <известная причина или Unknown>
- Fix: <изменение или Not fixed>
- Verification: <тест, команда или ручной сценарий>
- Pattern: <идентификатор паттерна или None>
- Notes: <решения, дубликаты или остаточный риск>
```
