# План миграции на TypeScript

**Дата создания:** 7 апреля 2026
**Статус:** Не начато
**Приоритет:** Низкий (опциональная оптимизация)

---

## Обзор проекта

| Параметр | Значение |
|----------|----------|
| JS файлов в src/ | 42 |
| ECS систем | 15 |
| ECS адаптеров | 3 |
| Phaser сцен | 8+ |
| Тестов | 5 |
| Билд-система | Vite 5.4 |

---

## Цели миграции

1. **Типобезопасность** — отлов ошибок на этапе компиляции
2. **Автодополнение** — лучшая поддержка IDE
3. **Самодокументирование** — интерфейсы как документация
4. **Рефакторинг** — безопасное переименование и изменение структуры

---

## Этап 0: Подготовка инфраструктуры

**Статус:** Не начато
**Оценка времени:** 1-2 часа

### Задачи

- [ ] Установить TypeScript и типы

  ```bash
  npm install -D typescript @types/node
  npm install -D @types/jest (для тестов)
  ```

- [ ] Создать `tsconfig.json`

  ```json
  {
    "compilerOptions": {
      "target": "ES2020",
      "module": "ESNext",
      "moduleResolution": "bundler",
      "strict": true,
      "esModuleInterop": true,
      "skipLibCheck": true,
      "allowJs": true,
      "outDir": "./dist",
      "rootDir": "./src",
      "baseUrl": ".",
      "paths": {
        "@/*": ["src/*"]
      }
    },
    "include": ["src/**/*"],
    "exclude": ["node_modules", "dist"]
  }
  ```

- [ ] Обновить `vite.config.ts` для поддержки TypeScript

- [ ] Установить типы для Phaser

  ```bash
  npm install -D @types/phaser
  ```

- [ ] Добавить скрипты в `package.json`

  ```json
  {
    "typecheck": "tsc --noEmit",
    "typecheck:watch": "tsc --noEmit --watch"
  }
  ```

- [ ] Проверить сборку: `npm run build` должен работать

### Критерий завершения

- [ ] `npm run typecheck` выполняется без ошибок (допускаются warnings)
- [ ] `npm run build` собирает проект
- [ ] `npm run dev` запускает dev-сервер

---

## Этап 1: Типы данных и компоненты

**Статус:** Не начато
**Оценка времени:** 2-3 часа
**Зависимости:** Этап 0

### Файлы для миграции

| Файл | Приоритет | Сложность |
|------|-----------|-----------|
| `src/ecs/components/index.js` | Высокий | Низкая |
| `src/shared/constants.js` | Высокий | Низкая |
| `src/ecs/data/default-save.js` | Высокий | Средняя |
| `src/ecs/data/career-jobs.js` | Средний | Средняя |
| `src/ecs/data/housing-levels.js` | Средний | Низкая |

### Задачи

- [ ] Создать директорию `src/types/`

- [ ] Создать `src/types/components.ts` — интерфейсы для всех компонентов:

  ```typescript
  export interface StatsComponent {
    hunger: number;
    energy: number;
    stress: number;
    mood: number;
    health: number;
    physical: number;
  }

  export interface SkillsComponent {
    // ...
  }

  // и т.д.
  ```

- [ ] Создать `src/types/game-state.ts` — полный тип состояния игры

- [ ] Создать `src/types/events.ts` — типы для системы событий

- [ ] Мигрировать `src/ecs/components/index.js` → `index.ts`

- [ ] Мигрировать `src/shared/constants.js` → `constants.ts`

- [ ] Мигрировать `src/ecs/data/*.js` → `*.ts`

### Критерий завершения

- [ ] Все компоненты имеют TypeScript интерфейсы
- [ ] `npm run typecheck` проходит без ошибок для этих файлов
- [ ] `npm run build` собирает проект

---

## Этап 2: ECS World и ядро

**Статус:** Не начато
**Оценка времени:** 2-3 часа
**Зависимости:** Этап 1

### Файлы для миграции

| Файл | Приоритет | Сложность |
|------|-----------|-----------|
| `src/ecs/world.js` | Критический | Высокая |
| `src/ecs/index.js` | Высокий | Низкая |

### Задачи

- [ ] Создать `src/types/ecs.ts`:

  ```typescript
  export type ComponentKey = 
    | 'time' 
    | 'stats' 
    | 'skills' 
    | 'work'
    // ...;

  export interface Entity {
    id: string;
    components: Set<ComponentKey>;
  }

  export type ComponentData = StatsComponent | SkillsComponent | ...;

  export interface ECSEvent {
    type: string;
    payload?: unknown;
  }
  ```

- [ ] Мигрировать `src/ecs/world.js` → `world.ts`
  - Типизировать методы класса ECSWorld
  - Добавить generic для `addComponent`, `getComponent`

- [ ] Мигрировать `src/ecs/index.js` → `index.ts`

### Критерий завершения

- [ ] ECSWorld полностью типизирован
- [ ] Методы имеют правильные типы аргументов и возврата
- [ ] `npm run typecheck` проходит без ошибок

---

## Этап 3: ECS Системы

**Статус:** Не начато
**Оценка времени:** 4-6 часов
**Зависимости:** Этап 2

### Файлы для миграции (в порядке приоритета)

| Файл | Приоритет | Сложность |
|------|-----------|-----------|
| `src/ecs/systems/StatsSystem.js` | Высокий | Средняя |
| `src/ecs/systems/TimeSystem.js` | Высокий | Низкая |
| `src/ecs/systems/PersistenceSystem.js` | Высокий | Средняя |
| `src/ecs/systems/WorkPeriodSystem.js` | Высокий | Средняя |
| `src/ecs/systems/RecoverySystem.js` | Средний | Средняя |
| `src/ecs/systems/SkillsSystem.js` | Средний | Средняя |
| `src/ecs/systems/CareerProgressSystem.js` | Средний | Высокая |
| `src/ecs/systems/FinanceActionSystem.js` | Средний | Средняя |
| `src/ecs/systems/InvestmentSystem.js` | Средний | Средняя |
| `src/ecs/systems/MonthlySettlementSystem.js` | Средний | Высокая |
| `src/ecs/systems/EventQueueSystem.js` | Средний | Высокая |
| `src/ecs/systems/EventChoiceSystem.js` | Средний | Средняя |
| `src/ecs/systems/EventHistorySystem.js` | Низкий | Низкая |
| `src/ecs/systems/EducationSystem.js` | Средний | Средняя |
| `src/ecs/systems/MigrationSystem.js` | Низкий | Средняя |

### Подход

Мигрировать по 2-3 системы за итерацию:

**Итерация 3.1: Базовые системы**

- [ ] StatsSystem.js → StatsSystem.ts
- [ ] TimeSystem.js → TimeSystem.ts
- [ ] PersistenceSystem.js → PersistenceSystem.ts

**Итерация 3.2: Игровой процесс**

- [ ] WorkPeriodSystem.js → WorkPeriodSystem.ts
- [ ] RecoverySystem.js → RecoverySystem.ts
- [ ] SkillsSystem.js → SkillsSystem.ts

**Итерация 3.3: Финансы и карьера**

- [ ] CareerProgressSystem.js → CareerProgressSystem.ts
- [ ] FinanceActionSystem.js → FinanceActionSystem.ts
- [ ] InvestmentSystem.js → InvestmentSystem.ts

**Итерация 3.4: События и время**

- [ ] MonthlySettlementSystem.js → MonthlySettlementSystem.ts
- [ ] EventQueueSystem.js → EventQueueSystem.ts
- [ ] EventChoiceSystem.js → EventChoiceSystem.ts
- [ ] EventHistorySystem.js → EventHistorySystem.ts

**Итерация 3.5: Остальное**

- [ ] EducationSystem.js → EducationSystem.ts
- [ ] MigrationSystem.js → MigrationSystem.ts

- [ ] Мигрировать `src/ecs/systems/index.js` → `index.ts`

### Критерий завершения

- [ ] Все 15 систем мигрированы
- [ ] `npm run typecheck` проходит без ошибок
- [ ] Все тесты проходят: `npm run test`

---

## Этап 4: ECS Адаптеры

**Статус:** Не начато
**Оценка времени:** 2-3 часа
**Зависимости:** Этап 3

### Файлы для миграции

| Файл | Приоритет | Сложность |
|------|-----------|-----------|
| `src/ecs/adapters/GameStateAdapter.js` | Высокий | Высокая |
| `src/ecs/adapters/SceneAdapter.js` | Высокий | Средняя |
| `src/ecs/adapters/LegacyFacade.js` | Средний | Средняя |

### Задачи

- [ ] Создать `src/types/adapters.ts` — типы для адаптеров

- [ ] Мигрировать GameStateAdapter.js → GameStateAdapter.ts
  - Типизировать все методы доступа к состоянию

- [ ] Мигрировать SceneAdapter.js → SceneAdapter.ts
  - Типизировать интеграцию с Phaser сценами

- [ ] Мигрировать LegacyFacade.js → LegacyFacade.ts

### Критерий завершения

- [ ] Все адаптеры типизированы
- [ ] `npm run typecheck` проходит без ошибок
- [ ] `npm run test` проходит

---

## Этап 5: Phaser Сцены

**Статус:** Не начато
**Оценка времени:** 3-4 часа
**Зависимости:** Этап 4

### Файлы для миграции

| Файл | Приоритет | Сложность |
|------|-----------|-----------|
| `src/scenes/MainGameSceneECS.js` | Критический | Высокая |
| `src/scenes/StartScene.js` | Высокий | Средняя |
| `src/scenes/RecoveryScene.js` | Средний | Средняя |
| `src/scenes/CareerScene.js` | Средний | Средняя |
| `src/scenes/EducationScene.js` | Средний | Средняя |
| `src/scenes/FinanceScene.js` | Средний | Средняя |
| `src/scenes/EventQueueScene.js` | Средний | Высокая |
| `src/scenes/SchoolIntroScene.js` | Низкий | Низкая |
| `src/scenes/InstituteIntroScene.js` | Низкий | Низкая |

### Подход

**Итерация 5.1: Главная сцена**

- [ ] MainGameSceneECS.js → MainGameSceneECS.ts

**Итерация 5.2: Основные сцены**

- [ ] StartScene.js → StartScene.ts
- [ ] RecoveryScene.js → RecoveryScene.ts
- [ ] EventQueueScene.js → EventQueueScene.ts

**Итерация 5.3: Дочерние сцены**

- [ ] CareerScene.js → CareerScene.ts
- [ ] EducationScene.js → EducationScene.ts
- [ ] FinanceScene.js → FinanceScene.ts

**Итерация 5.4: Интро-сцены**

- [ ] SchoolIntroScene.js → SchoolIntroScene.ts
- [ ] InstituteIntroScene.js → InstituteIntroScene.ts

### Критерий завершения

- [ ] Все сцены мигрированы
- [ ] Игра запускается и работает корректно
- [ ] `npm run typecheck` проходит без ошибок

---

## Этап 6: UI и утилиты

**Статус:** Не начато
**Оценка времени:** 1-2 часа
**Зависимости:** Этап 5

### Файлы для миграции

| Файл | Приоритет | Сложность |
|------|-----------|-----------|
| `src/ui-kit.js` | Средний | Средняя |
| `src/debug-panel.js` | Низкий | Низкая |

### Задачи

- [ ] Создать `src/types/ui.ts` — типы для UI компонентов

- [ ] Мигрировать ui-kit.js → ui-kit.ts
  - Типизировать методы создания UI элементов

- [ ] Мигрировать debug-panel.js → debug-panel.ts

### Критерий завершения

- [ ] UI утилиты типизированы
- [ ] `npm run typecheck` проходит без ошибок

---

## Этап 7: Точки входа

**Статус:** Не начато
**Оценка времени:** 1 час
**Зависимости:** Этап 6

### Файлы для миграции

| Файл | Приоритет | Сложность |
|------|-----------|-----------|
| `src/main.js` | Критический | Низкая |
| `src/main-ecs.js` | Критический | Низкая |
| `src/game-state.js` | Высокий | Средняя |

### Задачи

- [ ] Мигрировать main.js → main.ts

- [ ] Мигрировать main-ecs.js → main-ecs.ts

- [ ] Мигрировать game-state.js → game-state.ts

- [ ] Обновить index.html для подключения новых entry points

### Критерий завершения

- [ ] Все точки входа мигрированы
- [ ] Игра запускается через `npm run dev`
- [ ] Сборка работает: `npm run build`

---

## Этап 8: Тесты

**Статус:** Не начато
**Оценка времени:** 2-3 часа
**Зависимости:** Этап 7

### Файлы для миграции

| Файл | Приоритет | Сложность |
|------|-----------|-----------|
| `test/ecs/StatsSystem.test.js` | Высокий | Средняя |
| `test/ecs/EducationSystem.test.js` | Средний | Средняя |
| `test/ecs/WorkPeriodSystem.test.js` | Средний | Средняя |
| `test/ecs/MonthlySettlementSystem.test.js` | Средний | Средняя |
| `test/ecs/smoke-tests.test.js` | Высокий | Высокая |

### Задачи

- [ ] Обновить `jest.config.js` → `jest.config.ts`

- [ ] Мигрировать все тесты в TypeScript

- [ ] Добавить типы для Jest: `npm install -D @types/jest`

### Критерий завершения

- [ ] Все тесты мигрированы
- [ ] `npm run test` проходит успешно
- [ ] `npm run test:coverage` генерирует отчёт

---

## Этап 9: Финализация

**Статус:** Не начато
**Оценка времени:** 1-2 часа
**Зависимости:** Этап 8

### Задачи

- [ ] Удалить старые JS файлы (после проверки)

- [ ] Обновить документацию:
  - [ ] Обновить `doc/core/README.md` — упомянуть TypeScript
  - [ ] Обновить `README.md` в корне проекта

- [ ] Настроить stricter режим в `tsconfig.json`:

  ```json
  {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
  ```

- [ ] Добавить pre-commit hook для проверки типов

- [ ] Проверить производительность сборки

### Критерий завершения

- [ ] Проект полностью на TypeScript
- [ ] `npm run typecheck` без ошибок и warnings
- [ ] `npm run build` создаёт оптимизированную сборку
- [ ] `npm run test` — все тесты проходят
- [ ] Игра работает в браузере без ошибок

---

## Итоговая статистика

| Метрика | Значение |
|---------|----------|
| Общее время оценки | 19-28 часов |
| Количество этапов | 10 |
| Количество файлов | 42 |
| Критических файлов | 5 |

---

## Риски и митигация

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| Регрессия функционала | Средняя | Высокое | Тесты после каждого этапа |
| Конфликты с Phaser типами | Низкая | Среднее | Использовать @types/phaser |
| Долгая сборка | Низкая | Низкое | Оптимизировать tsconfig |
| Увеличение размера бандла | Низкая | Низкое | Tree-shaking в Vite |

---

## Откат

В случае критических проблем:

1. Восстановить JS файлы из git
2. Откатить изменения в package.json
3. Вернуться к предыдущей рабочей версии

---

## Примечания

- Миграция **опциональна** — проект работает на JavaScript
- Можно остановиться на любом этапе и продолжить позже
- Рекомендуется делать commit после каждого завершённого этапа
- Порядок этапов важен — каждый зависит от предыдущего

---

**Последнее обновление:** 7 апреля 2026
