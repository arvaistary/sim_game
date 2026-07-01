# Spec-kit в Game Life

Этот раздел внедряет Spec-kit workflow в текущий проект на основе форка Umbrella AI Dev Kit: от идеи до реализации через спецификацию, план и задачи.

## Зачем это нужно

- снизить количество "размытых" задач без критериев готовности;
- фиксировать продуктовый и технический контекст перед кодом;
- сделать реализацию предсказуемой для команды и AI-агентов.

## Подключение к проекту (первый раз)

1. Установить `uv` (если не установлен).
2. Установить `specify-cli` из форка Umbrella:

```bash
uv tool install specify-cli --from git+https://gitlab.com/umbrella-artem-seryak/umbrella-ai-dev-kit
```

1. В корне репозитория инициализировать Spec-kit:

```bash
specify init --here --ai cursor-agent
```

1. Запустить адаптацию существующего репозитория:

```text
/speckit.adopt
```

После этого появится структура `.specify/memory/` для долговременного контекста проекта.

Сразу после `/speckit.adopt` синхронизируйте проектные правила из `.cursor/rules/*.mdc` в Spec-kit memory по инструкции: `doc/spec-kit/CURSOR_RULES_BRIDGE.md`.

## Базовый workflow

### Lite поток (по умолчанию, рекомендуется)

1. `/speckit.start <описание задачи>`
2. `/speckit.implement`
3. `/speckit.finalize`

### Full поток (для сложных/неоднозначных задач)

1. `/speckit.start --full <описание задачи>`
2. `/speckit.clarify` (опционально)
3. `/speckit.plan`
4. `/speckit.tasks`
5. `/speckit.analyze`
6. `/speckit.implement`
7. `/speckit.finalize`

Наши локальные шаблоны в `templates/` остаются как fallback и reference, если работу нужно вести вручную без слеш-команд.

## Где хранить документы

- рабочие артефакты Spec-kit: `specs/` (создаются CLI-потоком);
- активные ручные спецификации (fallback): `doc/spec-kit/specs/`;
- долговременная память проекта: `.specify/memory/`;
- архив завершённых/отменённых: `doc/archive/`;
- ADR по архитектурным решениям: `doc/adr/`.

## Правила качества Spec-kit артефактов

- каждая спецификация содержит измеримые критерии приёмки;
- в плане есть явные риски и стратегия валидации;
- задачи можно выполнить независимо и проверить локально;
- изменения согласованы со слоями архитектуры проекта (`domain -> application -> stores/composables -> components -> pages`).

## Команда finalize (обязательный шаг)

`/speckit.finalize` используется как quality gate перед закрытием work-item:

- сверяет выполнение `tasks.md`;
- сверяет соответствие `spec.md` (в full-режиме);
- запускает best-effort проверки проекта;
- синхронизирует `.specify/memory/`.

## Быстрый старт

1. Выполните подключение Spec-kit (раздел выше).
2. Для быстрой задачи используйте lite-поток (`start -> implement -> finalize`).
3. Для сложной задачи используйте full-поток.
4. Если нужен ручной режим, скопируйте шаблоны из `doc/spec-kit/templates/`.
5. Создайте файлы:
   - `doc/spec-kit/specs/<feature-name>.spec.md`
   - `doc/spec-kit/specs/<feature-name>.plan.md`
   - `doc/spec-kit/specs/<feature-name>.tasks.md`
6. Заполните документы и только после этого начинайте реализацию.
