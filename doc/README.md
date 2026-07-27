# Документация проекта Game Life

Добро пожаловать в документацию проекта Game Life! Здесь вы найдёте всю информацию о разработке, дизайне и архитектуре игры.

## Быстрый старт

Для новых разработчиков рекомендуем следующий порядок чтения:

1. [Обзор архитектуры](./core/ARCHITECTURE_OVERVIEW.md) — слоистая архитектура
2. [Архитектурный контракт](./core/ARCHITECTURE_CONTRACT.md) — куда класть код
3. [Server-first миграция](./SERVER_MIGRATION.md) — режимы SPA/Server/Hybrid
4. [Git/Vercel workflow](./guides/VERCEL_GIT_WORKFLOW.md) — локальные feature-ветки и deploy из `main`
5. [Статус реализации](./core/IMPLEMENTATION_STATUS.md) — что готово
6. [Справочник страниц](./core/PAGES_REFERENCE.md) — Vue страницы и роутинг
7. [Game Design Document](./GDD/GDD.md) — описание механик
8. [Composables Reference](./reference/COMPOSABLES_REFERENCE.md) — API composables
9. [Stores Reference](./reference/STORES_REFERENCE.md) — API stores

## Структура документации

```
doc/
├── README.md                          # Этот файл — главная навигация
├── SERVER_MIGRATION.md                # Server-first миграция: режимы, offline, API
│
├── core/                              # Основная документация
│   ├── README.md                      # Обзор проекта и быстрый старт
│   ├── ARCHITECTURE_OVERVIEW.md       # Обзор слоистой архитектуры
│   ├── ARCHITECTURE_CONTRACT.md       # Архитектурный контракт (куда класть код)
│   ├── IMPLEMENTATION_STATUS.md       # Статус реализации всех модулей
│   ├── ROADMAP.md                     # План разработки
│   ├── PAGES_REFERENCE.md             # Справочник Vue страниц и роутинга
│   ├── START_GAME_DOCUMENTATION.md    # Документация старта игры
│   ├── MEMPALACE_SETUP.md             # Настройка MemPalace
│   └── SKILLS.md                      # Справочник по навыкам
│
├── gdd/                               # Game Design Document
│   ├── README.md                      # Обзор GDD и навигация
│   ├── GDD.md                         # Полный GDD (все в одном файле)
│   └── modules/                       # Модульные документы по темам
│       ├── 01_general.md
│       ├── 02_implementation.md
│       ├── 03_core_mechanics.md
│       ├── 04_balance.md
│       ├── 05_save_system.md
│       ├── 06_death_system.md
│       ├── 07_random_events.md
│       ├── 08_family.md
│       ├── 09_hobbies.md
│       ├── 10_achievements.md
│       ├── 11_seasonal.md
│       ├── 12_technical.md
│       ├── 13_roadmap.md
│       └── 14_conclusion.md
│
├── adr/                               # Architecture Decision Records
│   ├── README.md                      # Обзор ADR
│   ├── decision-guide.md              # Руководство по ADR
│   ├── 0001-phaser-to-nuxt-migration.md
│   ├── 0002-ecs-removal.md
│   ├── 0003-layered-architecture.md
│   ├── 0005-game-world-aggregate-strategy-a.md
│   ├── architecture-research-report.md
│   ├── ARCHITECTURE_DECISION_HENDERSON_ADAPTATION.md
│   └── nuxt4-architecture-analysis.md
│
├── guides/                            # Практические руководства
│   ├── DESIGN_SYSTEM.md               # Design system проекта
│   ├── MODAL_SYSTEM_GUIDE.md          # Руководство по модальной системе
│   ├── RULES_NUXT_ADAPTATION.md       # Правила адаптации под Nuxt
│   └── VERCEL_GIT_WORKFLOW.md         # Локальные feature-ветки и deploy из main
│
├── reference/                         # API Reference
│   ├── COMPOSABLES_REFERENCE.md       # Справочник Vue composables
│   └── STORES_REFERENCE.md            # Справочник Pinia stores
│
├── spec-kit/                          # Spec-kit workflow и шаблоны
│   ├── README.md                      # Описание процесса
│   ├── ADOPTION_CHECKLIST.md          # Чеклист внедрения
│   ├── CURSOR_RULES_BRIDGE.md         # Маппинг project rules → Spec-kit
│   ├── templates/                     # Шаблоны spec/plan/tasks
│   └── specs/                         # Активные спецификации
│
└── adr/                               # Архитектурные решения, включая Phaser → Nuxt
```

Активные планы (Spec-kit): создаются через `spec-kit/` workflow и хранятся в `.cursor/plans/` (вне `doc/`).

## Режимы работы (Server-First Migration)

Проект поддерживает три режима исполнения game-логики. См. [`SERVER_MIGRATION.md`](./SERVER_MIGRATION.md) для полного описания архитектуры.

### SPA режим (по умолчанию)
Локальное исполнение через Pinia stores + `GameWorld` bridge. Все команды синхронные под капотом, обёрнуты в `Promise.resolve` для совместимости с async API.

### Server режим
Через Nitro Server API (`server/api/game/**`). Состояние хранится в сессии (cookie-based, TTL 24h). Команды выполняются на сервере, клиент получает обновлённое состояние.

### Hybrid режим
Server при online, fallback на SPA при offline. Действия буферизуются в offline queue (`localStorage`) и синхронизируются при восстановлении сети через `POST /api/game/sync`.

### Переключение режимов

Через `nuxt.config.ts` `runtimeConfig.public.gameMode` или `.env`:

```
NUXT_PUBLIC_GAME_MODE=server
NUXT_PUBLIC_GAME_API_BASE_URL=https://api.example.com
```

Для разработки: dev-компонент `ModeSwitcher` (`src/components/dev/ModeSwitcher/`) позволяет переключать режимы в UI.

## Что где искать

### Хочу узнать о проекте в целом
Обзор проекта и архитектуры → [`core/ARCHITECTURE_OVERVIEW.md`](./core/ARCHITECTURE_OVERVIEW.md)

### Хочу узнать правила размещения кода
Архитектурный контракт → [`core/ARCHITECTURE_CONTRACT.md`](./core/ARCHITECTURE_CONTRACT.md)

### Хочу узнать про server-first миграцию
Архитектура и режимы работы → [`SERVER_MIGRATION.md`](./SERVER_MIGRATION.md)

### Хочу понять процесс разработки и деплоя
Git/Vercel workflow → [`guides/VERCEL_GIT_WORKFLOW.md`](./guides/VERCEL_GIT_WORKFLOW.md)

### Хочу узнать, что уже готово
Статус реализации → [`core/IMPLEMENTATION_STATUS.md`](./core/IMPLEMENTATION_STATUS.md)

### Хочу узнать план разработки
Roadmap → [`core/ROADMAP.md`](./core/ROADMAP.md)

### Хочу понять механики игры
Полный GDD → [`GDD/GDD.md`](./GDD/GDD.md)

### Хочу понять механики старта игры
Документация старта игры → [`core/START_GAME_DOCUMENTATION.md`](./core/START_GAME_DOCUMENTATION.md)

### Хочу понять, какие страницы есть в коде
Справочник Vue страниц → [`core/PAGES_REFERENCE.md`](./core/PAGES_REFERENCE.md)

### Хочу найти API composable или store
Composables → [`reference/COMPOSABLES_REFERENCE.md`](./reference/COMPOSABLES_REFERENCE.md)
Stores → [`reference/STORES_REFERENCE.md`](./reference/STORES_REFERENCE.md)

### Хочу понять архитектурные решения
ADR → [`adr/`](./adr/) (Architecture Decision Records)

### Хочу добавить новую функцию
1. Проверьте [`GDD/GDD.md`](./GDD/GDD.md) — возможно, это уже описано
2. Изучите [`core/IMPLEMENTATION_STATUS.md`](./core/IMPLEMENTATION_STATUS.md)
3. Создайте Spec-kit артефакты в [`spec-kit/specs/`](./spec-kit/specs/) по шаблонам [`spec-kit/templates/`](./spec-kit/templates/)
4. Следуйте архитектуре проекта: `domain → application → infrastructure → stores/composables → components → pages`
5. Проверьте `npm run typecheck` и `npm run rules:audit`

## Роли и документация

### Разработчик

Что читать:
- [Архитектура проекта](./core/ARCHITECTURE_OVERVIEW.md)
- [Архитектурный контракт](./core/ARCHITECTURE_CONTRACT.md)
- [Статус реализации](./core/IMPLEMENTATION_STATUS.md)
- [GDD](./GDD/GDD.md) — разделы реализуемых функций
- [Server-first миграция](./SERVER_MIGRATION.md)
- Rules и code style (`.cursor/rules/`)

Где искать:
- Механики игры → `gdd/modules/`
- Архитектура кода → `core/ARCHITECTURE_OVERVIEW.md`
- Nuxt фреймворк → `nuxt.config.ts`
- API composables/stores → `reference/`
- Текущий статус → `core/IMPLEMENTATION_STATUS.md`

### Дизайнер/Геймдизайнер

Что читать:
- Полный GDD (Game Design Document)
- Статус реализации модулей
- Roadmap разработки

Где искать:
- Все механики и баланс → `gdd/modules/`
- Планы на будущее → `core/ROADMAP.md`

### Архитектор/Техлид

Что читать:
- [Архитектура проекта](./core/ARCHITECTURE_OVERVIEW.md)
- [Архитектурный контракт](./core/ARCHITECTURE_CONTRACT.md)
- [Server-first миграция](./SERVER_MIGRATION.md)
- ADR (Architecture Decision Records)

Где искать:
- Технические решения → `adr/`
- Конфигурация → `nuxt.config.ts`
- Правила проекта → `.cursor/rules/`

## Глоссарий терминов

- **GDD** — Game Design Document (документ геймдизайна)
- **Core Loop** — основной игровой цикл
- **Nuxt 4** — веб-фреймворк на базе Vue 3
- **Vue 3** — UI фреймворк для интерфейса
- **TypeScript** — язык программирования с типами
- **Pinia** — state management библиотека для Vue 3
- **Nitro** — server engine Nuxt (Server API)
- **GameWorld** — domain aggregate, единый state-container
- **Domain layer** — доменный слой (бизнес-логика)
- **Application layer** — прикладной слой (use cases: commands/queries)
- **Infrastructure layer** — инфраструктурный слой (persistence)
- **ADR** — Architecture Decision Record (архитектурные решения)
- **SPA/Server/Hybrid** — режимы исполнения game-логики
- **Offline queue** — буферизация действий при offline (server/hybrid режимы)

## Обновление документации

### Основные правила

1. **Держите в актуальном состоянии**
   - Обновляйте `IMPLEMENTATION_STATUS.md` при завершении модуля
   - Обновляйте `ROADMAP.md` при изменении планов
   - Создавайте ADR при принятии архитектурных решений

2. **Соблюдайте структуру**
   - Используйте существующие папки и файлы
   - Промежуточные и завершенные work items → `../specs/`
   - Новые ADR → `adr/`
   - Новые планы → через Spec-kit workflow в `.cursor/plans/`

3. **Кросс-ссылки**
   - Обновляйте ссылки в других файлах при переименовании
   - Проверяйте актуальность ссылок периодически

### Процесс добавления новой документации

1. Определите категорию (core/GDD/adr/guides/reference)
2. Создайте файл с понятным именем
3. Добавьте описание в соответствующий README.md
4. Обновите перекрёстные ссылки
5. Уведомите команду

## Архитектурные решения (ADR)

Для всех ключевых архитектурных решений создаются ADR-файлы в папке `adr/`:
- Описание контекста и проблемы
- Рассмотренные альтернативы
- Принятое решение
- Последствия решения

См. [`adr/decision-guide.md`](./adr/decision-guide.md) для формата ADR.

Актуальные ADR:
- **ADR-0001**: Phaser.js → Nuxt миграция
- **ADR-0002**: Удаление ECS
- **ADR-0003**: Layered architecture
- **ADR-0005**: GameWorld aggregate (Strategy A)

## Участие

### Нашли ошибку в документации?
1. Исправьте ошибку
2. Обновите связанные файлы
3. Создайте PR с описанием изменений

### Хотите улучшить документацию?
1. Создайте issue с предложением
2. Обсудите с командой
3. Внесите изменения

---

**Последнее обновление:** 2 июля 2026
**Версия документации:** 5.0
**Статус:** Активная
**Технологический стек:** Nuxt 4 + Vue 3 + TypeScript + Pinia + Nitro Server API
