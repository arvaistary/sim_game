# MemPalace в Game Life

Этот проект подключен к `MemPalace` как локальной памяти для команды и AI-ассистентов.

## Что уже настроено

- локальное Python-окружение: `.venv`
- установлен пакет `mempalace`
- npm-скрипты для запуска MemPalace через это окружение
- локальное хранилище palace в `.mempalace/palace` (в git не коммитится)

## Быстрый запуск

Из корня проекта:

```bash
npm run mem:init
npm run mem:mine
npm run mem:status
```

После этого можно получить компактный "wake-up" контекст для AI:

```bash
npm run mem:wakeup
```

## Рекомендуемый workflow для команды

1. После заметных изменений в коде/доках запускать `npm run mem:mine`
2. Перед длинной сессией с AI запускать `npm run mem:wakeup`
3. Для проверки объема памяти и структуры запускать `npm run mem:status`

## Стандартный путь: старт новой задачи -> делегирование ассистенту

Ниже базовый сценарий, который стоит использовать по умолчанию.

1. **Обновить память проекта перед новой задачей**

```bash
npm run mem:mine
npm run mem:status
```

1. **Собрать контекст для новой задачи**

```bash
npm run mem:wakeup
.venv\Scripts\python -m mempalace.cli --palace ./.mempalace/palace search "ключевые решения по теме задачи"
```

1. **Сформировать brief для ассистента**

В brief включать:

- цель задачи (что должно получиться в итоге);
- ограничения (что нельзя ломать, какие файлы трогать/не трогать);
- найденные через MemPalace решения/договоренности;
- критерии приемки (как проверить, что задача сделана корректно).

1. **Делегировать задачу ассистенту**

Передавать ассистенту не "с нуля", а с памятью:

- `wake-up` контекст;
- 2-5 релевантных результатов `search`;
- явный список файлов и сцен, которые затрагиваются.

1. **После выполнения задачи зафиксировать новое знание**

```bash
npm run mem:mine
npm run mem:status
```

Это сохраняет свежие решения и уменьшает повторные обсуждения в следующих сессиях.

## Поисковые шаблоны для доменов Game Life

Чтобы быстро вытаскивать нужный контекст перед делегированием, используйте однотипные запросы:

```bash
.venv\Scripts\python -m mempalace.cli --palace ./.mempalace/palace search "StartScene onboarding flow решение"
.venv\Scripts\python -m mempalace.cli --palace ./.mempalace/palace search "education school institute balancing"
.venv\Scripts\python -m mempalace.cli --palace ./.mempalace/palace search "career progression requirements salary"
.venv\Scripts\python -m mempalace.cli --palace ./.mempalace/palace search "finance reserve monthly expenses events"
.venv\Scripts\python -m mempalace.cli --palace ./.mempalace/palace search "ui-kit adaptive cards mobile layout"
```

## Skill + slash-команда для делегирования

В проект добавлен локальный навык и slash-команда:

- skill: `.cursor/skills/mempalace-delegator/SKILL.md`
- command: `.cursor/commands/mempalace-task.md`

Как использовать:

```text
/mempalace-task <описание задачи>
```

Пример:

```text
/mempalace-task Добавить адаптивные карточки в StartScene без изменения баланса механик
```

Что произойдет после триггера:

1. Агент обновит память (`mem:mine`, `mem:status`, `mem:wakeup`).
1. Агент достанет релевантный контекст через MemPalace `search`.
1. Агент соберет `Task Brief` (цель, ограничения, затронутые файлы, критерии приемки).
1. Агент выполнит задачу на основе brief.
1. Агент повторно запишет новое знание в MemPalace (`mem:mine`).

## Полезные команды напрямую

```bash
.venv\Scripts\python -m mempalace.cli --palace ./.mempalace/palace search "start scene education flow"
.venv\Scripts\python -m mempalace.cli --palace ./.mempalace/palace compress --wing game_life
```

## Примечания

- MemPalace хранит данные локально и не требует внешнего API.
- В `wake-up` попадает только компактный срез контекста; подробности подтягиваются поиском.
- Если нужно пересоздать окружение: удалить `.venv` и установить заново `python -m venv .venv` + `pip install mempalace`.
