# GitHub Projects + Issues workflow

**Статус:** настроено локально  
**Дата:** 3 сентября 2026  
**Репозиторий:** [arvaistary/sim_game](https://github.com/arvaistary/sim_game)  
**Канбан:** [Game Life Kanban](https://github.com/users/arvaistary/projects/2)

## Назначение

Управление задачами Game Life через GitHub Issues и Projects v2 (канбан).  
Локальный `gh` CLI читает токен из `.env` — без коммита секретов.

## Одноразовая настройка

1. Установить [GitHub CLI](https://cli.github.com/): `winget install GitHub.cli`
2. Скопировать `.env.example` → `.env` (если ещё нет)
3. Создать **classic** token: [github.com/settings/tokens/new](https://github.com/settings/tokens/new)  
   Scopes: `repo`, `project`
4. Положить токен в `.env`:

```env
GH_TOKEN_CLASSIC=ghp_...
```

Fine-grained `GH_TOKEN` подходит для Issues, но **не** для `gh project` без scope Projects.

## Проверка подключения

```powershell
npm run gh:verify
```

Должен показать `Logged in to github.com account arvaistary`.

## Обёртка `npm run gh`

Все команды `gh` запускать через обёртку — она подставляет `GH_TOKEN` из `.env`:

```powershell
npm run gh -- project list
npm run gh -- issue list --repo arvaistary/sim_game
npm run gh -- project view 2 --owner "@me"
```

Для user-проектов owner всегда `@me`, не логин.

## Канбан: колонки Status

Проект **Game Life Kanban** (#2) использует стандартное поле **Status**:

| Колонка | Назначение |
|---|---|
| **Todo** | Запланировано |
| **In Progress** | В работе |
| **Done** | Завершено |

Перемещение карточки:

```powershell
npm run gh -- project item-edit --id <ITEM_ID> --field-id PVTSSF_lAHOAdyhj84BiVZJzhhN064 --single-select-option-id <OPTION_ID>
```

Проще — перетаскиванием в [веб-интерфейсе](https://github.com/users/arvaistary/projects/2).

## Типовые операции

### Создать issue и добавить в канбан

```powershell
npm run gh -- issue create --repo arvaistary/sim_game --title "Задача" --body "Описание"
npm run gh -- project item-add 2 --owner "@me" --url https://github.com/arvaistary/sim_game/issues/<NUMBER>
```

### Список задач в проекте

```powershell
npm run gh -- project item-list 2 --owner "@me" --format json
```

### Закрыть issue

```powershell
npm run gh -- issue close <NUMBER> --repo arvaistary/sim_game
```

## Связь с репозиторием

Проект #2 привязан к `arvaistary/sim_game` (можно добавлять issues репозитория в канбан).

## Безопасность

- `.env` в `.gitignore` — не коммитить токены
- Периодически перевыпускать токены в [GitHub Settings → Tokens](https://github.com/settings/tokens)
- После перевыпуска обновить `GH_TOKEN_CLASSIC` в `.env`

## Следующий шаг

Перевыпустить `GH_TOKEN` и `GH_TOKEN_CLASSIC`, обновить `.env`, снова выполнить `npm run gh:verify`.
