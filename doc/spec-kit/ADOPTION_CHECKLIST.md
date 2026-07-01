# Spec-kit adoption checklist

Checklist для внедрения Umbrella AI Dev Kit (Spec-kit fork) в текущий репозиторий.

## 1. Tooling

- [ ] Установлен `uv`
- [ ] Выполнен `uv tool install specify-cli --from git+https://gitlab.com/umbrella-artem-seryak/umbrella-ai-dev-kit`
- [ ] Команда `specify --help` доступна локально

## 2. Инициализация проекта

- [ ] Выполнен `specify init --here --ai cursor-agent`
- [ ] В репозитории появилась директория `.specify/`
- [ ] В проекте доступны slash-команды `/speckit.*`

## 3. Адаптация памяти проекта

- [ ] Выполнен `/speckit.adopt`
- [ ] Создан `.specify/memory/context.md`
- [ ] Создан `.specify/memory/architecture/overview.md`
- [ ] Создан `.specify/memory/architecture/tech-stack.md`
- [ ] Создан `.specify/memory/architecture/data-flow.md`
- [ ] Создан `.specify/memory/development/code-style.md`
- [ ] Создан `.specify/memory/constitution.md`
- [ ] Правила из `.cursor/rules/*.mdc` синхронизированы в `.specify/memory/*` по `doc/spec-kit/CURSOR_RULES_BRIDGE.md`

## 4. Пилотный work-item

- [ ] Выполнен `/speckit.start <task>` (или `/speckit.start --full <task>`)
- [ ] Выполнен `/speckit.implement`
- [ ] Выполнен `/speckit.finalize`
- [ ] Сверены обновления в `.specify/memory/` после finalize

## 5. Встраивание в рабочий процесс команды

- [ ] Команда использует lite-поток для стандартных задач
- [ ] Команда использует full-поток для сложных задач
- [ ] `finalize` закреплён как обязательный шаг перед закрытием work-item
