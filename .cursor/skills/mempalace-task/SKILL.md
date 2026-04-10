---
name: mempalace-task
description: Собрать контекст из MemPalace перед реализацией задачи. /mempalace-task Запускает mine → status → wakeup → search, формирует execution brief, затем выполняет задачу.
---

# MemPalace Task

Use this skill when the user provides a new task description and wants the agent to gather project memory context from MemPalace before implementation.

## Trigger

- User asks to start a new task and wants context from MemPalace.
- User asks to delegate a task to an assistant with prior project decisions.
- Slash command `/mempalace-task` is invoked with task text.

## Inputs

- Task description in natural language.
- Optional constraints (files, deadlines, forbidden changes).

## Required workflow

1. Запусти последовательно (каждая команда должна завершиться перед следующей):

```
npm run mem:mine
npm run mem:status
npm run mem:wakeup
```

Если любая команда падает (non-zero exit code), запиши ошибку в brief и продолжай без памяти MemPalace.
2. Из описания задачи построй 3–6 целевых запросов:
- Доменные термины (названия систем, компонентов, сцен)
- Имена файлов и модулей
- Ограничения и требования
3. Для каждого запроса выполни:
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
4. Собери краткий brief:
- **Objective** — цель задачи
- **Context from MemPalace** — релевантные решения из памяти
- **Affected files/systems** — затрагиваемые файлы и системы
- **Guardrails** — ограничения и non-goals
- **Validation plan** — как проверить результат
5. Выполни задачу, используя brief как контекст.
6. После реализации запусти:
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
