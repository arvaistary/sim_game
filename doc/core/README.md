# Game Life — Документация для разработчиков

Добро пожаловать в проект Game Life! Симулятор жизни с пошаговым геймплеем на Nuxt 4 + Vue 3 + TypeScript + Pinia + Nitro Server API.

## Быстрый старт для новых разработчиков

Рекомендуемый порядок чтения:

1. [Обзор архитектуры](ARCHITECTURE_OVERVIEW.md) — слоистая архитектура, server-first
2. [Архитектурный контракт](ARCHITECTURE_CONTRACT.md) — правила размещения кода
3. [Server-first миграция](../SERVER_MIGRATION.md) — режимы SPA/Server/Hybrid, offline-first
4. [Статус реализации](IMPLEMENTATION_STATUS.md) — что готово, что в работе
5. [Roadmap](ROADMAP.md) — планы разработки
6. [Справочник страниц](PAGES_REFERENCE.md) — Vue страницы и Nuxt роутинг
7. [GDD](../GDD/GDD.md) — полное описание механик
8. [Документация старта игры](START_GAME_DOCUMENTATION.md) — StartPage и инициализация

## Структура документации

### Основная документация (эта папка `doc/core/`)

- **README.md** — этот файл, обзор и навигация
- **ARCHITECTURE_OVERVIEW.md** — обзор слоистой архитектуры (domain → application → infrastructure → presentation)
- **ARCHITECTURE_CONTRACT.md** — куда класть новый код, известные нарушения
- **IMPLEMENTATION_STATUS.md** — текущий статус реализации всех модулей
- **ROADMAP.md** — кратко-/средне-/долгосрочные планы
- **PAGES_REFERENCE.md** — таблица Vue страниц и Nuxt роутинга
- **START_GAME_DOCUMENTATION.md** — документация старта игры

### Server-first миграция (`doc/SERVER_MIGRATION.md`)

Полное описание архитектуры сервер-первой миграции: 3 режима работы (SPA/Server/Hybrid), offline-first flow, API endpoints, план Stage 8 (выделенный Node.js сервер).

### Game Design Document (`doc/GDD/`)

- **GDD.md** — основной документ со всеми механиками
- **modules/** — модульные документы по темам (01_general ... 14_conclusion)

### Architecture Decision Records (`doc/adr/`)

Ключевые архитектурные решения:

- **ADR-0001**: Phaser.js → Nuxt миграция
- **ADR-0002**: Удаление ECS
- **ADR-0003**: Layered architecture
- **ADR-0005**: GameWorld aggregate (Strategy A)
- См. [`adr/README.md`](../adr/README.md) для полного списка

### Practical guides (`doc/guides/`)

- **DESIGN_SYSTEM.md** — design system проекта
- **MODAL_SYSTEM_GUIDE.md** — руководство по модальной системе
- **RULES_NUXT_ADAPTATION.md** — правила адаптации под Nuxt

### Reference (`doc/reference/`)

- **COMPOSABLES_REFERENCE.md** — справочник Vue composables
- **STORES_REFERENCE.md** — справочник Pinia stores

### Spec-kit (`doc/spec-kit/`)

Workflow для постановки задач: spec → plan → tasks. См. [`spec-kit/README.md`](../spec-kit/README.md).

История архитектурных решений хранится только в ADR. Миграция Phaser → Nuxt
описана в [`../adr/0001-phaser-to-nuxt-migration.md`](../adr/0001-phaser-to-nuxt-migration.md).

## Запуск проекта

```bash
# Установка зависимостей
npm install

# Dev-сервер (server-first режим)
npm run dev

# Production build
npm run build

# Typecheck
npm run typecheck

# Unit/integration тесты
npm run test

# Audit правил проекта
npm run rules:audit
```

Nuxt выведет адрес (часто `http://localhost:3000/`).

## Технологический стек

- **Nuxt 4** — веб-фреймворк на базе Vue 3; UI работает как SPA (`ssr: false`), game API запускается отдельно
- **Vue 3** — UI фреймворк (`<script setup lang="ts">`)
- **TypeScript** — строгая типизация на всех уровнях
- **Pinia** — state management (13 stores)
- **Nitro Server API** — server-first endpoints (`server/api/game/**`)
- **Vitest** — unit/integration тесты (210+ тестов)
- **SCSS** — стилизация компонентов

## Архитектурные слои

```
utils/constants → domain → application → infrastructure → stores/composables → components → pages
```

| Слой | Назначение |
|------|------------|
| **Domain** (`src/domain/`) | `game-world/` aggregate, `game-mode/`, `api-contract/`, `balance/` — pure TypeScript, без фреймворков |
| **Application** (`src/application/`) | Use cases (commands, queries), async executors (SPA/Server), offline queue, state-sync |
| **Infrastructure** (`src/infrastructure/`) | `LocalStorageSaveRepository`, `config/game-mode.ts` |
| **Presentation** (`src/stores/`, `src/composables/`, `src/components/`, `src/pages/`) | Pinia stores (projections over GameWorld), composables, UI |

Подробнее: [ARCHITECTURE_OVERVIEW.md](ARCHITECTURE_OVERVIEW.md), [ARCHITECTURE_CONTRACT.md](ARCHITECTURE_CONTRACT.md).

## Режимы работы

Проект поддерживает три режима исполнения game-логики (см. [SERVER_MIGRATION.md](../SERVER_MIGRATION.md)):

- **Server** (по умолчанию для `npm run dev`) — standalone Fastify API; Nitro API остается compatibility layer
- **SPA** — локальное исполнение и offline fallback через Pinia + GameWorld bridge
- **Hybrid** — Server + offline queue (fallback на SPA при offline)

Переключение через `nuxt.config.ts` `runtimeConfig.public.gameMode` или `.env` (`NUXT_PUBLIC_GAME_MODE`).

## Ключевые механики

### Core Loop

1. **Создание персонажа** — игрок вводит имя, выбирает возраст и путь образования (`src/pages/index.vue`)
2. **Работа** — игрок выбирает длительность рабочего периода
3. **Восстановление** — игрок тратит деньги на восстановление шкал (~222 действия в 10 категориях)
4. **Повтор** — цикл повторяется

### Шкалы персонажа (6)

Голод (Hunger), Энергия (Energy), Стресс (Stress), Настроение (Mood), Здоровье (Health), Физическая форма (Physical)

### Игровые системы

- **GameWorld aggregate** — единый state-container (`src/domain/game-world/`)
- **Domain commands** — pure functions `(world: GameWorld, ...)`: executeAction, simulateWorkShift, resolveEventDecision, и т.д.
- **Async executors** — SPA/Server/Hybrid (server-first migration)
- **Offline queue** — буферизация действий при offline (server/hybrid режимы)
- **Pinia stores** — projections над GameWorld для UI
- **Composables** (17) — UI orchestration

## Вклад в проект

### Разработка новой функции

1. Изучите соответствующий модуль в GDD
2. Проверьте [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) для контекста
3. Проверьте [ARCHITECTURE_CONTRACT.md](ARCHITECTURE_CONTRACT.md) — куда класть код
4. Для server-side: см. [SERVER_MIGRATION.md](../SERVER_MIGRATION.md), раздел «Добавление нового API endpoint»
5. Добавьте тесты (vitest)
6. Проверьте `npm run typecheck` и `npm run rules:audit`

### Создание новой Vue страницы

1. Создайте route-файл в `src/pages/game/<section>/index.vue`
2. Создайте page-specific компоненты в `src/components/pages/<section>/`
3. Добавьте ссылку в навигацию
4. Обновите [PAGES_REFERENCE.md](PAGES_REFERENCE.md)

### Добавление новой game-команды

1. Реализуйте pure command в `src/domain/game-world/commands/` (signature `(world: GameWorld, ...): Result`)
2. Добавьте тип в `index.types.ts`
3. При необходимости — расширьте `AsyncGameExecutor` interface и реализуйте в `SPAExecutor`/`ServerExecutor`
4. При server-side — создайте endpoint в `server/api/game/`
5. Покройте unit-тестом

## Полезные ссылки

- [Nuxt 4 Documentation](https://nuxt.com/docs)
- [Vue 3 Documentation](https://vuejs.org/)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Vitest Documentation](https://vitest.dev/)
- GDD модули в `doc/GDD/modules/`

---

**Последнее обновление:** 2 июля 2026
**Версия документа:** 5.0
**Статус:** Активная
**Технологический стек:** Nuxt 4 + Vue 3 + TypeScript + Pinia + Nitro Server API
