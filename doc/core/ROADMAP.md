# План разработки (Roadmap)

**Последнее обновление:** 2 июля 2026
**Версия:** 5.0
**Технологический стек:** Nuxt 4 + Vue 3 + TypeScript + Pinia + Nitro Server API

---

## Обзор проекта

Проект Game Life — симулятор жизни с пошаговым геймплеем. Текущая архитектура:

- **Server-first слоистая архитектура:** `domain → application → infrastructure → stores/composables → components → pages`
- **`GameWorld` aggregate** (ADR-0005): pure TypeScript state container, единый source of truth в `src/domain/game-world/`
- **Три режима исполнения:** Server (по умолчанию для dev), SPA (offline fallback), Hybrid
- **~222 действия в 10 категориях:** полная система восстановления
- **TypeScript:** строгая типизация на всех уровнях, 0 typecheck-ошибок
- **210+ unit/integration тестов:** `rules:audit` 0 нарушений

---

## Текущее состояние

### Архитектура (завершено)

- ✅ **GameWorld aggregate** (Фазы 1-4, ADR-0005): pure domain state, pure commands `(world: GameWorld, ...)`, SPAExecutor
- ✅ **Server-first миграция** (Stages 1-7): GameMode, API contract, executor-factory, Nitro Server API (7 endpoints), OfflineQueueManager, state-sync, error-handler
- ✅ **Application layer чистый:** 0 импортов Pinia, 0 импортов infrastructure
- ✅ **Domain layer:** `game-world/`, `game-mode/`, `api-contract/`, `balance/`
- ✅ **Infrastructure layer:** `LocalStorageSaveRepository`, `config/game-mode.ts`
- ✅ **Presentation layer:** stores (projections over GameWorld), composables, components, pages

### Базовые механики (завершено)

- ✅ Система шкал персонажа (6 шкал)
- ✅ Система времени и возраста (часовая модель)
- ✅ Экономика и прогресс (деньги, работы, инвестиции, кредиты, подписки)
- ✅ Система сохранения (localStorage + автосохранение)
- ✅ Навигация между экранами (Nuxt роутинг)

### Игровые механики (частично)

- ✅ Система навыков (10 базовых)
- ✅ Образование в рантайме (программы, активные курсы)
- ✅ Карьера (должности, доход, требования)
- ✅ Финансы (обзор, расходы, действия, инвестиции)
- ✅ Восстановление (~222 действия в 10 категориях)
- ✅ Жильё и мебель (5 уровней)
- ✅ Ежемесячный расчёт
- 🔄 Случайные события (~25%): базовая система, нужны полный список + cooldown
- 🔄 Хобби и побочный заработок (~35%): UI реализован, нет побочного заработка

---

## Завершённые вехи (архив)

| Веха | Дата | Документы |
|------|------|-----------|
| Nuxt 4 миграция | Апрель 2026 | ADR-0001 |
| ECS удаление → Application-first | Апрель-Май 2026 | ADR-0002, ADR-0003 |
| Dashboard restyle v2 (Linear aesthetic) | Июль 2026 | [`DESIGN_SYSTEM.md`](../guides/DESIGN_SYSTEM.md) |
| GameWorld aggregate foundation | Июль 2026 | ADR-0005 |
| Server-first architecture migration | Июль 2026 | [`SERVER_MIGRATION.md`](../SERVER_MIGRATION.md), [`specs/server-first-arch/plan.md`](../../specs/server-first-arch/plan.md) |
| Аудит и рекомендации | Июль 2026 | соответствующие `specs/` work items |

---

## Краткосрочные планы (1-2 спринта)

### 1. Завершить bridge removal (после server-first)

**Статус:** Запланировано (после стабилизации server-mode)

**Задачи:**
- [ ] Превратить stores в true projections (reactive-computed над `gameStore.world: Ref<GameWorld>`)
- [ ] Удалить `src/domain/game-world/bridge.ts` (deprecated)
- [ ] Удалить `src/application/game/legacy.ts` shim

### 2. Качество кода и testing

**Статус:** Continuous

**Задачи:**
- [ ] E2E тесты (Playwright) для основных user flows
- [ ] Покрыть server-mode integration тестами (с моками Nitro)
- [ ] Storybook для переиспользуемых UI компонентов

---

## Среднесрочные планы (1-3 месяца)

### 3. Глубокое развитие финансовой системы

**Статус:** В процессе (~30%)

**Задачи:**
- [ ] Множество инвестиционных продуктов
- [ ] Цели накопления
- [ ] Давление долгов/кредитов
- [ ] Экстренные финансовые события

### 4. Реальное развитие жилья

**Статус:** Частично (~20%)

**Задачи:**
- [ ] Расширение уровней жилья с визуальными улучшениями
- [ ] Долгосрочные контракты аренды
- [ ] Возможность изменения уровня жилья
- [ ] Влияние соседей на комфорт

### 5. Расширение социальных систем

**Статус:** В зачатке (~5%)

**Задачи:**
- [ ] Отношения (шкала 0-100)
- [ ] Романтические отношения
- [ ] Поиск партнёра (20-45 лет)
- [ ] Брак и развод
- [ ] Друзья

### 6. Добавление объёма событиям

**Статус:** Частично (~25%)

**Задачи:**
- [ ] Полный список 25 событий из GDD
- [ ] Возрастные события (E018–E025)
- [ ] Система cooldown
- [ ] Нейтральные/сюжетные события с выбором
- [ ] Ветвящиеся последствия

### 7. Полноценная система работы/карьеры

**Статус:** Частично (~50%)

**Задачи:**
- [ ] Ручное переключение между работами
- [ ] Заявки на вакансии
- [ ] Система требований для каждой работы
- [ ] Специальные рабочие события по профессии

---

## Долгосрочные планы (Backlog)

### 8. Server-first Stage 8: выделенный Node.js сервер

**Статус:** В процессе (M0/M1/M2 завершены, M3 persistence в работе)

**Задачи:**
- [x] Выделить контракты, domain и application boundaries в npm workspaces
- [x] Создать standalone Fastify API
- [ ] Мигрировать с in-memory storage на БД
- [ ] Отключить Nitro server-mode в Nuxt

### 9. Платформы дистрибуции

**Статус:** Не начато

**Задачи:**
- [ ] Яндекс.Игры интеграция
- [ ] VK Play
- [ ] PWA (offline-capable SPA build)

### 10. Система смерти и концовки

**Статус:** В зачатке (~10%)

**Задачи:**
- [ ] Финальный экран статистики жизни
- [ ] Типы концовок (5 типов)
- [ ] Оценка жизни
- [ ] Возрождение (New Game+)

### 11. Семья и дети

**Статус:** В зачатке (~5%)

**Задачи:**
- [ ] Система отношений
- [ ] Брак и развод
- [ ] Рождение детей
- [ ] Воспитание детей

### 12. Достижения и трофеи

**Статус:** В зачатке (~5%)

**Задачи:**
- [ ] Система достижений
- [ ] Уведомления
- [ ] Leaderboard (локальный)

### 13. Сезонные и праздничные события

**Статус:** Не начато (0%)

**Задачи:**
- [ ] Сезонные события
- [ ] Праздничные события
- [ ] Влияние сезонов на механики

---

## Технические улучшения

### Production-ready

- [ ] CI/CD pipeline
- [ ] Production build optimisation
- [ ] Performance monitoring
- [ ] Error tracking (Sentry)
- [ ] Analytics

---

## Отклонённые идеи

- ❌ ECS-архитектура (удалена, см. ADR-0002)
- ❌ Canvas-рендеринг / Phaser (см. ADR-0001)
- ❌ SSR-режим (остаёмся SPA-only клиент, server-логика через Nitro API)

---

## Связанные документы

- **Статус реализации:** [`IMPLEMENTATION_STATUS.md`](IMPLEMENTATION_STATUS.md)
- **Архитектура:** [`ARCHITECTURE_OVERVIEW.md`](ARCHITECTURE_OVERVIEW.md)
- **Архитектурный контракт:** [`ARCHITECTURE_CONTRACT.md`](ARCHITECTURE_CONTRACT.md)
- **Server-first миграция:** [`../SERVER_MIGRATION.md`](../SERVER_MIGRATION.md)
- **GDD:** [`../GDD/GDD.md`](../GDD/GDD.md)
- **ADR:** [`../adr/`](../adr/)

---

**Последнее обновление:** 2 июля 2026
