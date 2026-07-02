# Архитектурный контракт: Application-First модель

## Цель контракта

Зафиксировать каноническую архитектурную модель для проекта `game_life` и правила, которыми руководствуется миграция. Контракт определяет единый источник истины для размещения кода — куда класть новую логику и где искать существующую.

## Слои и их обязанности

### `domain` — правила, каталоги, pure-логика

**Может содержать:**
- игровые каталоги (actions, career-jobs, education-programs, events)
- pure-утилиты без зависимостей от Nuxt/Pinia/browser API
- типы и интерфейсы для domain-сущностей
- константы и справочники
- pure-функции для расчетов (формулы, валидация входных данных)

**НЕ может содержать:**
- импорты `pinia`, `useStore`, `defineStore`
- обращения к `localStorage`, `sessionStorage`, `window`, `document`
- вызовы `useNuxtApp`, `useRoute`, `useRouter`, `useState`
- UI-компоненты или стили
- orchestration-логику

**Пример:** `src/domain/balance/actions/index.ts`, `src/domain/balance/constants/career-jobs.ts`

---

### `application` — единая точка входа для use-case команд и запросов

**Может содержать:**
- команды (commands): действия пользователя, которые изменяют состояние
- запросы (queries): проверки возможности, получение данных
- порты (ports): интерфейсы для infrastructure-адаптеров
- result-модели для каждого use-case сценария

**Структура:**
- `application/game/commands.ts` — игровые команды
- `application/game/queries.ts` — игровые запросы
- `application/game/ports/` — порты для infrastructure
- `application/game/index.ts` — публичный API
- `application/game/index.types.ts` — result-модели и контракты

**НЕ может содержать:**
- импорты stores или использование Pinia
- прямые мутации состояния
- UI-side effects (toast, modal, navigation)
- знание о Nuxt routing или компонентах

**Пример:** `canExecuteAction()`, `executeAction()`, `applyWorkShift()`, `changeCareer()`

---

### `stores` — состояние, slice-level мутации, сериализация

**Может содержать:**
- reactive state через Pinia
- локальные mutations для своего slice
- применение effect payload от application commands
- `save()` / `load()` для своего slice
- computed projections для UI
- вызовы application commands для orchestration

**НЕ может содержать:**
- бизнес-логику, которая относится к use-case сценариям (для этого есть application)
- cross-store orchestration (для этого есть application или thin game-store facade)
- UI-side effects

**Исключение:** тонкий `game-store` может оставаться агрегирующим фасадом, но НЕ god-объектом с бизнес-логикой.

**Пример:** `src/stores/wallet-store/index.ts`, `src/stores/career-store/index.ts`

---

### `composables` — UI orchestration, coordination

**Может содержать:**
- UI flows: открытие модалки, toast, навигация после результата
- coordination между UI и application/stores
- переиспользуемое presentation-level поведение
- вызовы application commands и stores для данных

**НЕ может содержать:**
- игровые правила или продуктовую логику
- прямые мутации store state (кроме через вызов команд)
- бизнес-решения (можно/нельзя)

**Пример:** `src/composables/useActions/index.ts` — только UI-реакции после результата use-case

---

### `infrastructure` — реализация портов

**Может содержать:**
- адаптеры для портов (LocalStorage, future API, etc.)
- browser API wrappers
- persistence implementation

**НЕ может содержать:**
- продуктовые правила или бизнес-логику
- UI-компоненты

**Пример:** `src/infrastructure/persistence/LocalStorageSaveRepository.ts`

---

### `pages` и `components` — UI only

**Могут содержать:**
- шаблоны, стили
- вызовы composables для получения данных
- вызовы composables для действий пользователя

**НЕ могут содержать:**
- бизнес-логику или use-case логику
- прямые вызовы stores для правил
- импорты domain напрямую (только через application)

---

## Критерии "куда класть новый код"

### Новый игровой сценарий (новое действие, карьера, событие и т.д.)

1. Правила и каталог — в `domain`
2. Use-case логика (проверки, применение) — в `application`
3. Данные для проверки — передаются как параметры из stores
4. Результат возвращается как result-модель
5. Применение эффектов — в stores
6. UI feedback — в composables

### Изменение существующего правила

Искать в `domain` каталог, правило — обновить там.

### Добавление нового типа состояния

1. Snapshot interface — в `domain` или types
2. Store — в `stores`
3. Persistence — store реализует `save()`/`load()`
4. Правила работы — в `application`

### Изменение UI-поведения

В composables для конкретного UI-паттерна.

---

## Контрактные правила миграции

1. **Новая use-case логика идет в `application` first** — не в stores, не в composables, не в pages

2. **`application` не импортирует stores** — только domain и ports

3. **Stores применяют эффекты, но не решают** — применение result payload, не валидация или orchestration

4. **Composables — UI orchestration** — только реакции на результат, не сами решения

5. **`domain` — чистый и не зависит от фреймворка** — без Nuxt, Pinia, browser API

6. **Ports отделяют infrastructure** — `SaveRepository` и другие порты — единственное место для смены адаптера

---

## Архитектурные тесты

Контракт проверяется автоматически:

- `test/unit/architecture/layer-boundaries.test.ts` — проверяет границы слоев (domain, application, infrastructure)
- `test/unit/architecture/store-boundaries.test.ts` — проверяет границы stores

При нарушении правил тесты падают.

---

## Known violations (на июль 2026)

Контракт нарушен в нескольких местах. Нарушения отслеживаются и постепенно устраняются через recovery plan ниже.

### V-1. `application` импортирует Pinia stores

**Файлы:**
- `src/application/game/commands.ts`
- `src/application/game/queries.ts`
- `src/application/game/index.types.ts`

**Нарушает:** §application «НЕ может содержать: импорты stores или использование Pinia».

**Почему:** После ADR-0003 application layer реализован с прямым доступом к Pinia stores для orchestration. Это блокирует server-first миграцию (Domain Layer должен работать без Pinia в server mode).

**Отслеживание:** `layer-boundaries.test.ts` → test «application does not import Pinia stores», счётчик capped ≤3. При росте — тест падает.

### V-2. Бизнес-логика в `stores` (часть stores)

**Файлы:** `applyWorkShift` логика в `game.store.ts`, `recalculateSkillModifiers` в `skills-store` (хотя сама функция в domain), per-stat модификаторы в stores.

**Нарушает:** §stores «НЕ может содержать: бизнес-логику, которая относится к use-case сценариям».

**Почему:** Исторически stores были единственным местом для бизнес-логики. Частично исправлено в аудите P1-4/P1-5 (делегирование в `appGameCommands`), но полный перенос требует восстановления `GameWorld` aggregate.

---

## Recovery plan

Устранение known violations выполняется через стратегию A (ADR-0005): восстановление `GameWorld` aggregate в `src/domain/game-world/` как единого source of truth.

**План:** [.cursor/plans/game_world_aggregate_foundation_e7a3c2b1.plan.md](../../.cursor/plans/game_world_aggregate_foundation_e7a3c2b1.plan.md)

**Этапы:**
1. **Фаза 1 — Foundation** (~3-5 дней): `GameWorld.ts`, `toJSON`/`fromJSON`, `game-facade/`, временный bridge `fromStores`/`applyToStores`.
2. **Фаза 2 — Actions migration** (~3-4 дня): `executeAction`/`simulateWorkShift`/`resolveEventDecision` переносятся в domain commands с signature `(world: GameWorld, ...)`.
3. **Фаза 3 — Stores → projections** (~5-7 дней, store-by-store): career → skills → finance → events → wallet/stats/time.
4. **Фаза 4 — Application pure + SPAExecutor** (~2-3 дня): убираем импорт Pinia из application (V-1 устранён), реализуем `SPAExecutor`.
5. **Фаза 5 — Cleanup + docs** (~2 дня): удаляем bridge, обновляем документацию.

**Итого:** 15-21 рабочий день (~3-4 недели). Каждая фаза — отдельный PR с e2e smoke-test.

После завершения V-1 и V-2 устранены, `layer-boundaries.test.ts` показывает 0 violations application→stores.

---

## Когда правила можно нарушить

Только явным решением через PR и обновлением контракта. Хаос по умолчанию не допускается.