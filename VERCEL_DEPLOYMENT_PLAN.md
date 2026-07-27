# План публикации Game Life на Vercel

**Статус:** выбран main-only workflow; первый deploy выполнен
**Дата актуализации:** 28 июля 2026
**Ответственный:** агент публикации
**Цель:** проверять hosted production runtime через deploy после merge в `main`.

> Ежедневный workflow зафиксирован в [Git/Vercel workflow](doc/guides/VERCEL_GIT_WORKFLOW.md). Этот план описывает deployment gate и ограничения production persistence.

## 1. Главный вывод

Текущий проект можно развернуть на Vercel как Nuxt/Nitro full-stack приложение. Nuxt официально поддерживает Vercel с автоматическим определением Nitro-конфигурации: [Nuxt Deploy — Vercel](https://nuxt.com/deploy/vercel).

Однако production-релиз нельзя считать завершённым до подключения durable persistence:

- Nitro API хранит игровые сессии через memory storage;
- serverless-инстансы Vercel не являются постоянным хранилищем;
- после cold start, переноса запроса или нового deploy игровая сессия может исчезнуть;
- целевая архитектура требует PostgreSQL 16 как source of truth и Redis 7 только для cache/locks/rate limits.

Поэтому нужно разделять два результата:

1. **Hosted verification:** после локальных тестов feature-ветка вливается в `main`, Vercel пересобирает Production Deployment, UI и `/api/game/*` проверяются на hosted runtime.
2. **Durable production:** постоянный пользовательский прогресс разрешается только после M3 persistence либо после явно подтверждённого владельцем решения принять потерю сессий.

## 2. Фактическая база проекта

Агент обязан считать источниками истины:

- `nuxt.config.ts` — `ssr: false`, `runtimeConfig`, Nitro memory storage;
- `package.json` — рабочие команды и npm workspaces;
- `doc/SERVER_MIGRATION.md` — M0/M1/M2 и ограничения persistence;
- `doc/core/IMPLEMENTATION_STATUS.md` — текущий статус разработки;
- `specs/server-first-arch/plan.md` — целевая схема PostgreSQL/Redis и отдельного API.

Текущий runtime:

- UI: Nuxt 4 + Vue 3, client-only;
- server mode: `NUXT_PUBLIC_GAME_MODE=server`;
- текущий клиентский API по умолчанию — same-origin `/api/game/*` через Nitro;
- standalone Fastify реализован для локального/server-first M2, но не имеет отдельного Vercel adapter в текущем репозитории;
- `npm run build:client` предназначен для static output, `npm run build` — для full-stack Nitro deployment.

## 3. Правила работы агента

- Не удалять и не откатывать пользовательские изменения.
- Разрабатывать в локальных feature-ветках; feature-ветки не пушить в обычном workflow.
- После локальных тестов вливать feature-ветку в `main` и пушить только `main`.
- Рассматривать Vercel deploy из `main` как hosted production verification, но не объявлять durable production-ready.
- Не помещать секреты в репозиторий, `README`, `nuxt.config.ts` или `NUXT_PUBLIC_*` переменные.
- Не добавлять `vercel.json` для текущего workflow, если не включается отдельный PR/Preview процесс.
- Не использовать `npm run build:client`: он не проверяет Nitro API.
- Не объявлять Production-ready при memory persistence.
- Все изменения конфигурации сопровождать проверками и краткой записью причины.

## 4. Этапы выполнения

### Этап 0 — Проверка контекста и доступа

- [ ] Проверить `git status` и сохранить список уже изменённых файлов.
- [ ] Проверить, что агент работает с нужным репозиторием и веткой.
- [ ] Проверить доступ к GitHub и Vercel только чтением.
- [ ] Проверить целевой Vercel project, production branch `main` и домен.
- [ ] Подтвердить main-only workflow: локальная разработка, merge в `main`, Vercel deploy.

**Стоп-условие:** нет доступа к нужному Vercel project, неизвестен production domain или не определён режим релиза. Изменения не вносить.

### Этап 1 — Локальный baseline

Запустить из корня проекта:

```text
npm test
npm run typecheck
npm run typecheck:packages
npm run typecheck:standalone-server
npm run test:architecture
npm run test:standalone-server
npm run rules:audit
npm run audit:integrity:validate
npm run build
```

Проверить:

- build завершается с кодом `0`;
- `.output/server` создан;
- `.output/public` создан;
- Nitro server содержит маршруты `server/api/game/**`;
- после build не появились неожиданные изменения вне `.output/**`.

Если baseline уже падает, агент фиксирует причину и не маскирует её Vercel-конфигурацией.

### Этап 2 — Выбор deployment track

#### Track A — Nuxt/Nitro на Vercel, main-only hosted verification

Использовать как текущий и основной workflow проекта.

- Vercel Project Root: корень репозитория;
- Framework Preset: Nuxt, если Vercel не определит его автоматически;
- Install Command: `npm ci`;
- Build Command: `npm run build`;
- Output Directory: оставить автоматическое определение;
- Node version: выбрать совместимую с lockfile и локальным baseline;
- не подключать standalone Fastify как отдельный Vercel service на этом этапе;
- feature-ветки проверяются локально и не отправляются в GitHub в обычном процессе;
- merge в `main` запускает единственный обязательный Vercel deployment;
- memory storage не считать подходящим для реальных пользовательских сохранений.

#### Track B — Vercel static client + внешний API, Production target

Использовать после M3 или при наличии уже подготовленного внешнего API.

- Vercel публикует только клиент;
- standalone API размещается отдельно на постоянном Node/container runtime;
- API подключается через `NUXT_PUBLIC_GAME_API_BASE_URL`;
- API использует PostgreSQL 16 и Redis 7;
- CORS, cookies, identity, health/readiness и migrations проверяются отдельно;
- production client не содержит authority или секретов.

**Не выбирать Track B автоматически:** текущий static build и standalone API ещё не образуют полностью production-ready независимую пару.

### Этап 3 — Environment variables

Для Track A, same-origin Production verification:

```text
NUXT_PUBLIC_GAME_MODE=server
NUXT_PUBLIC_GAME_API_BASE_URL=
NUXT_GAME_CORS_ORIGIN=https://<production-domain>
NUXT_GAME_COOKIE_SAME_SITE=lax
NUXT_GAME_COOKIE_SECURE=true
```

Для Track B, cross-origin:

```text
NUXT_PUBLIC_GAME_MODE=server
NUXT_PUBLIC_GAME_API_BASE_URL=https://<api-domain>
NUXT_GAME_CORS_ORIGIN=https://<vercel-domain>,https://<custom-domain>
NUXT_GAME_COOKIE_SAME_SITE=none
NUXT_GAME_COOKIE_SECURE=true
```

Правила:

- `NUXT_PUBLIC_GAME_API_BASE_URL` содержит только публичный URL API;
- `NUXT_GAME_CORS_ORIGIN` принимает точные origin без wildcard, потому что API использует credentials;
- Production variables задаются в Production environment; Preview variables не требуются для main-only workflow;
- `DATABASE_URL`, `REDIS_URL` и другие секреты не добавлять, пока runtime действительно их не читает;
- после изменения variables выполнить новый deploy: runtime config собирается из `NUXT_*` переменных.

### Этап 4 — Deploy из `main`

- [ ] Подключить репозиторий к существующему Vercel project.
- [ ] Установить Track A и Production Branch `main`.
- [ ] Добавить Production environment variables.
- [ ] Выполнить локальные тесты на feature-ветке.
- [ ] Влить feature-ветку в `main` и выполнить `git push origin main`.
- [ ] Дождаться автоматического Production deployment.
- [ ] Сохранить URL deployment и commit SHA.
- [ ] Проверить build logs и отсутствие secret leakage.
- [ ] Проверить, что Vercel не заменил команду на `npm run build:client`.

При необходимости CLI:

```text
npx vercel
npx vercel --prod
```

В штатном workflow CLI не используется: основной триггер — `git push origin main`.
`--prod` оставлять для аварийного или явно согласованного ручного deploy.

### Этап 5 — Hosted production smoke test

Проверить на Production URL после deploy из `main`:

1. Открывается `/`.
2. Открываются ключевые маршруты из `doc/core/PAGES_REFERENCE.md`.
3. `POST /api/game/init` возвращает успешный `ApiResponse`.
4. Ответ устанавливает `gl_session` cookie.
5. `GET /api/game/state` с этой cookie возвращает состояние.
6. `POST /api/game/actions/execute` применяет тестовое действие.
7. `POST /api/game/sync` обрабатывает очередь и версию состояния.
8. Перезагрузка страницы восстанавливает состояние в пределах живого runtime.
9. В браузере нет CORS, 4xx/5xx и hydration errors.
10. В Vercel Functions logs нет необработанных исключений.

Для проверки не использовать реальные пользовательские данные и секреты.

### Этап 6 — Persistence gate

Агент обязан отдельно проверить, не теряется ли состояние при:

- новом serverless invocation;
- повторном запросе через некоторое время;
- redeploy/rollback;
- параллельных запросах;
- обращении к разным регионам или инстансам, если они включены.

Текущий ожидаемый результат: memory storage может потерять состояние. Это не ошибка агента, а **Production blocker M3**.

Production gate закрывается только если выполнены все условия:

- [ ] PostgreSQL подключён как authoritative storage.
- [ ] Redis используется только для operational concerns.
- [ ] Есть schema migration и rollback procedure.
- [ ] State survives restart, second instance и redeploy.
- [ ] Есть idempotency/version conflict tests.
- [ ] `/ready` проверяет реальные зависимости.
- [ ] Cookie/CORS/identity настроены для production domain.

### Этап 7 — Durable production gate

После письменного подтверждения владельца:

- [ ] Зафиксировать production environment variables.
- [ ] Проверить custom domain и HTTPS.
- [ ] После закрытия persistence gate выполнить новый deploy из `main`.
- [ ] Повторить smoke test на production URL.
- [ ] Проверить сохранение состояния после redeploy или rollback rehearsal.
- [ ] Зафиксировать deployment URL, commit SHA, время, результат checks и known limitations.
- [ ] Настроить Vercel deployment protection, доступ к logs и rollback procedure.

Если persistence gate не пройден, hosted deployment использовать только как production verification с явной пометкой:

> Игровые сессии временные; deploy не предназначен для хранения пользовательского прогресса.

## 5. Definition of Done

### Для Hosted verification

- build и все локальные gates проходят;
- Production deployment создан из ожидаемого commit после push `main`;
- UI и `/api/game/*` отвечают;
- cookie session и основной game loop работают;
- CORS не ломает запросы;
- known limitation memory persistence зафиксирована.

### Для Durable production

- все Hosted verification criteria выполнены;
- persistence gate закрыт;
- секреты находятся только в Vercel Environment Variables или API provider;
- после redeploy состояние не теряется;
- есть rollback и smoke-test процедура;
- владелец подтвердил Production release.

## 6. Итоговый отчёт агента

После каждого этапа агент возвращает:

- выбранный Track;
- Vercel project и deployment URL;
- commit SHA;
- список изменённых файлов;
- environment variables без значений секретов;
- команды и результаты проверок;
- smoke-test matrix;
- unresolved blockers;
- явный статус: `Hosted verification ready`, `Durable production blocked` или `Durable production ready`.

## 7. Связанные документы

- [Nuxt → Vercel](https://nuxt.com/deploy/vercel)
- [SERVER_MIGRATION.md](doc/SERVER_MIGRATION.md)
- [IMPLEMENTATION_STATUS.md](doc/core/IMPLEMENTATION_STATUS.md)
- [server-first plan](specs/server-first-arch/plan.md)
- [PAGES_REFERENCE.md](doc/core/PAGES_REFERENCE.md)
