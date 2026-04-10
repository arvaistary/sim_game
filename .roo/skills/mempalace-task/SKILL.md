---
name: mempalace-task
description: Собрать контекст из MemPalace перед реализацией задачи. /mempalace-task Запускает mine → status → wakeup → search, формирует execution brief, затем выполняет задачу.
---

# MemPalace Task

## Instructions

Используй этот навык, когда пользователь даёт новую задачу и нужно собрать контекст из памяти проекта (MemPalace) перед реализацией.

### Шаг 1: Подготовка памяти

Запусти последовательно (каждая команда должна завершиться перед следующей):

```
npm run mem:mine
npm run mem:status
npm run mem:wakeup
```

Если любая команда падает (non-zero exit code), запиши ошибку в brief и продолжай без памяти MemPalace.

### Шаг 2: Построить поисковые запросы

Из описания задачи построй 3–6 целевых запросов:
- Доменные термины (названия систем, компонентов, сцен)
- Имена файлов и модулей
- Ограничения и требования

### Шаг 3: Поиск в MemPalace

Для каждого запроса выполни:
```
npm run mem:search -- "<query>"
```

Альтернативно, любая подкоманда CLI:
```
npm run mem -- <args…>
```

Примеры:
- `npm run mem -- search "engine systems architecture"`
- `npm run mem -- compress --wing game_life`

### Шаг 4: Сформировать Execution Brief

Собери краткий brief:
- **Objective** — цель задачи
- **Context from MemPalace** — релевантные решения из памяти
- **Affected files/systems** — затрагиваемые файлы и системы
- **Guardrails** — ограничения и non-goals
- **Validation plan** — как проверить результат

### Шаг 5: Реализация

Выполни задачу, используя brief как контекст.

### Шаг 6: Сохранить контекст

После реализации запусти:
```
npm run mem:mine
```

## Output format

- **Task Brief**: Goal, Context, Files, Constraints, Acceptance criteria
- **Execution Plan**: короткий, actionable план

## Notes

- Предпочитай проектную память предположениям.
- Если память конфликтует, укажи конфликт и выбери самое свежее/явное решение.
- Если MemPalace недоступен (ошибки Python, venv не найден), работай без памяти, но укажи это в brief.
