# Git/Vercel workflow Game Life

**Статус:** выбранный рабочий процесс
**Дата:** 28 июля 2026
**Production branch:** `main`

## Решение

Для текущего этапа используем Vercel как удалённую production-проверку:

```text
локальная feature-ветка → локальные тесты → merge в main → push main → Vercel deploy
```

- Feature-ветки создаются и проверяются локально.
- Feature-ветки не отправляются в GitHub в обычном процессе.
- Pull Request и Vercel Preview не используются как обязательный этап.
- `main` — единственная ветка, push которой запускает Vercel Production Deployment.
- После успешной локальной проверки feature-ветка вливается в локальный `main`.
- Vercel пересобирает проект после `git push origin main`.

Это проверяет hosted runtime, Nitro API, cookies, environment variables и реальный Vercel build. Текущая memory persistence остаётся ограничением: состояние игры может исчезнуть после cold start или redeploy.

## Одноразовая настройка Vercel

В Vercel Project Settings проверить:

```text
Production Branch: main
Root Directory: .
Framework Preset: Nuxt
Install Command: npm ci
Build Command: npm run build
Output Directory: automatic
```

Production environment variables задаются в Vercel, не в Git. Для same-origin deployment используются:

```text
NUXT_PUBLIC_GAME_MODE=server
NUXT_GAME_COOKIE_SECURE=true
NUXT_GAME_COOKIE_SAME_SITE=lax
NUXT_GAME_CORS_ORIGIN=https://<production-domain>
```

Если включён парольный gate, добавить `NUXT_GAME_AUTH_USERNAME` и `NUXT_GAME_AUTH_PASSWORD` как Production variables. `NUXT_PUBLIC_GAME_API_BASE_URL` для same-origin можно оставить пустым.

## Ежедневный цикл

Начать работу от актуального `main`:

```powershell
git switch main
git pull --ff-only origin main
git switch -c feature/<short-name>
```

Работать и проверять изменения локально:

```powershell
npm ci
npm test
npm run typecheck:packages
npm run typecheck:standalone-server
npm run build
```

После успешных проверок зафиксировать изменения и выполнить merge:

```powershell
git add <изменённые-файлы>
git commit -m "feat: <short description>"

git switch main
git pull --ff-only origin main
git merge --no-ff feature/<short-name> -m "merge: feature/<short-name>"
git push origin main
```

После push:

1. Открыть последний Vercel Production Deployment.
2. Проверить commit SHA и успешный build.
3. Открыть production URL.
4. Проверить `/api/health`, login, создание игры, игровое действие и reload.
5. Проверить Vercel Runtime Logs.

После успешного merge локальную ветку можно удалить:

```powershell
git branch -d feature/<short-name>
```

## Правила безопасности

- Не выполнять `git push --force` для `main`.
- Не добавлять `.output/`, `.nuxt/`, `node_modules/` и `.env` в коммиты.
- Не хранить production secrets в репозитории.
- Перед merge проверять `git status` и `git diff --stat`.
- При ошибке production deployment сначала исправить код и сделать новый merge/push; для срочного возврата использовать Vercel rollback.

## Граница процесса

Этот workflow не требует удалённых feature-веток и GitHub Pull Request. Если позже понадобится code review через PR, можно включить отдельный PR workflow и отключить deployments для остальных веток через Vercel Git configuration. Это отдельное решение, не текущий default.

## Known limitations

M3 persistence cutover: PostgreSQL is authoritative when `DATABASE_URL` is configured. `npm run db:migrate` must complete before Production deploy; `/api/ready` is release gate. Vercel Environment Variables hold `DATABASE_URL`; it must never appear in `NUXT_PUBLIC_*`, repository files or client output.

- Vercel deployment успешно проверяет runtime, но memory storage не гарантирует сохранение игрового состояния между serverless-инстансами.
- Production-ready persistence требует PostgreSQL как source of truth и Redis для operational concerns.
- Текущие tracked `.output/*` следует удалить из Git отдельным cleanup-коммитом; локальные build-артефакты не добавлять в feature merge.
