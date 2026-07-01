# План исправления нарушений правил типизации и code style

> Дата создания: 2024-04-24
> Источник: `scripts/rules-audit.mjs`
> Статус: 🔄 Продолжение (Revalidation: 2026-06-02)
> Спецификация: `specs/001-rules-revalidation/spec.md`
> Решение: Continue — план остаётся активным

---

## Revalidation Summary (2026-06-02)

Полная ревалидация проведена 2026-06-02. Результаты:

- **Typecheck**: PASS (0 errors)
- **Rules Audit**: FAIL — множественные нарушения
- **Tests**: FAIL — 6 failed test files, 2 assertion failures

Из 59 legacy-записей: 27 Done, 31 Remaining, 1 Outdated.

Детальная матрица: `specs/001-rules-revalidation/assessment.md`
Решение: `specs/001-rules-revalidation/decision-record.md`

---

## Сводка

| Категория | Описание | Кол-во файлов |
|-----------|----------|:-------------:|
| **A** | Inline типы/интерфейсы вне `*.types.ts` / `types.ts` | 52 |
| **B** | Inline object-типы в параметрах функций | 6 |
| **C** | Константы вне `*.constants.ts` | 23 |
| | **Уникальных файлов с нарушениями** | **62** |
| | **Общее количество нарушений** | **81** |

Файлов с пересечением категорий: **16** (A+B, A+C, A+B+C).

---

## Нарушаемые правила

### Из `.roo/rules/10-typing.mdc`

1. **Типы в отдельных файлах** — локальные и публичные типы должны храниться в `*.types.ts` или `types.ts` рядом с модулем. Типы не объявляются внутри файлов реализации `*.ts` и `*.vue`, только реэкспортируются из них.
2. **Запрет inline object-типов** — не использовать inline object-типы в параметрах функций и в generic-аргументах. Обязательно использовать именованный type/interface из `*.types.ts` / `types.ts`.
3. **Импорт типов** — для type-only импортов использовать `import type`.

### Из `.roo/rules/20-code-style.mdc`

4. **Локальные константы** — `const SOME_VALUE = ...` выносить в соседний `*.constants.ts` и импортировать в файл использования.

---

## Порядок исправления: волны (Waves)

Волны упорядочены по направлению зависимостей (от нижних слоёв к верхним). Исправление начинается с **domain** — самого нижнего слоя, от которого зависят все остальные.

```
Wave 1: Domain layer        (src/domain/)
Wave 2: Stores              (src/stores/)
Wave 3: Composables         (src/composables/)
Wave 4: Components          (src/components/)
Wave 5: Infrastructure & Config & Constants
Wave 6: Utils & Plugins
Wave 7: Pages & Application
```

После каждой волны — **обязательная проверка** (см. раздел [Проверка](#проверка-после-каждой-волны)).

---

## Wave 1: Domain layer (`src/domain/`)

**Приоритет:** 🔴 Высший — от domain зависят все остальные слои.

**Файлов с нарушениями:** 16
**Нарушений:** 19 (A: 13, B: 2, C: 2, пересечения: 2 файла A+B, 2 файла A+C, 1 файл A+B+C)

| # | Файл | Категория | Действие |
|---|------|:---------:|----------|
| 1 | `src/domain/balance/types/activity-log.ts` | A | ⚠️ Переименовать в `activity-log.types.ts` |
| 2 | `src/domain/balance/types/childhood-event.ts` | A | ⚠️ Переименовать в `childhood-event.types.ts` |
| 3 | `src/domain/balance/types/childhood-skill.ts` | A | ⚠️ Переименовать в `childhood-skill.types.ts` |
| 4 | `src/domain/balance/types/life-memory.ts` | A | ⚠️ Переименовать в `life-memory.types.ts` |
| 5 | `src/domain/balance/types/personality.ts` | A | ⚠️ Переименовать в `personality.types.ts` |
| 6 | `src/domain/balance/types/index.ts` | A | Проверить barrel-файл на наличие inline-объявлений |
| 7 | `src/domain/balance/actions/action-schema.ts` | A | Создать `action-schema.types.ts`, перенести типы |
| 8 | `src/domain/balance/constants/default-save.ts` | A | Создать `default-save.types.ts`, перенести типы |
| 9 | `src/domain/balance/constants/game-events.ts` | A + B | Создать `game-events.types.ts`, перенести типы + вынести inline object type (line 370) |
| 10 | `src/domain/balance/constants/initial-save.ts` | A | Создать `initial-save.types.ts`, перенести типы |
| 11 | `src/domain/balance/constants/recovery-tabs.ts` | A | Создать `recovery-tabs.types.ts`, перенести типы |
| 12 | `src/domain/balance/constants/skill-effects-generator.ts` | A + C | Создать `skill-effects-generator.types.ts` + переименовать файл в `skill-effects-generator.constants.ts` |
| 13 | `src/domain/balance/constants/skill-progression-config.ts` | A | Создать `skill-progression-config.types.ts`, перенести типы |
| 14 | `src/domain/balance/utils/build-new-game-save.ts` | A + B + C | Создать `build-new-game-save.types.ts` + `build-new-game-save.constants.ts`, вынести inline object type (line 31) |
| 15 | `src/domain/balance/utils/hourly-rates.ts` | A + C | Создать `hourly-rates.types.ts` + `hourly-rates.constants.ts` |
| 16 | `src/domain/balance/utils/skill-system.ts` | A | Создать `skill-system.types.ts`, перенести типы |
| 17 | `src/domain/balance/utils/skill-ui-explainability.ts` | A | Создать `skill-ui-explainability.types.ts`, перенести типы |

### Шаблон действий для Wave 1

#### Для файлов с категорией A (inline типы)

```
1. Создать файл <name>.types.ts рядом с исходным
2. Вырезать все type/interface объявления из исходного файла
3. Вставить их в <name>.types.ts
4. Добавить export перед каждым type/interface
5. В исходном файле добавить: import type { ... } from './<name>.types'
6. Обновить barrel-файл (index.ts) если типы реэкспортируются
```

#### Для файлов с категорией B (inline object в параметрах)

```
1. Создать/дополнить <name>.types.ts
2. Вынести inline object type в именованный type
3. Заменить inline тип в параметре функции на ссылку
4. Добавить import type
```

#### Для файлов с категорией C (константы)

```
1. Создать файл <name>.constants.ts рядом с исходным
2. Вынести локальные const-объявления
3. Добавить import из ./<name>.constants в исходный файл
```

#### Для переименования файлов (⚠️)

```
1. Переименовать файл (git mv)
2. Обновить все импорты, ссылающиеся на старое имя
3. Проверить barrel-файлы
```

### Проверка после Wave 1

```bash
npm run rules:audit -- src/domain/
npx vitest run
```

---

## Wave 2: Stores (`src/stores/`)

**Приоритет:** 🟠 Высокий — stores зависят от domain и используются composables/components.

**Файлов с нарушениями:** 11
**Нарушений:** 22 (A: 11, C: 11, все файлы — пересечение A+C)

| # | Файл | Категория | Действие |
|---|------|:---------:|----------|
| 1 | `src/stores/actions-store/index.ts` | A + C | Создать `index.types.ts` + `index.constants.ts` |
| 2 | `src/stores/activity-store/index.ts` | A + C | Создать `index.types.ts` + `index.constants.ts` |
| 3 | `src/stores/career-store/index.ts` | A + C | Создать `index.types.ts` + `index.constants.ts` |
| 4 | `src/stores/education-store/index.ts` | A | Создать `index.types.ts` |
| 5 | `src/stores/events-store/index.ts` | A + C | Создать `index.types.ts` + `index.constants.ts` |
| 6 | `src/stores/finance-store/index.ts` | A | Создать `index.types.ts` |
| 7 | `src/stores/housing-store/index.ts` | A | Создать `index.types.ts` |
| 8 | `src/stores/player-store/index.ts` | A + C | Создать `index.types.ts` + `index.constants.ts` |
| 9 | `src/stores/skills-store/index.ts` | A + C | Создать `index.types.ts` + `index.constants.ts` |
| 10 | `src/stores/stats-store/index.ts` | A + C | Создать `index.types.ts` + `index.constants.ts` |
| 11 | `src/stores/time-store/index.ts` | A + C | Создать `index.types.ts` + `index.constants.ts` |
| 12 | `src/stores/wallet-store/index.ts` | A + C | Создать `index.types.ts` + `index.constants.ts` |

### Шаблон действий для Wave 2

Для каждого store-файла с пересечением A+C:

```
1. Создать index.types.ts — перенести все type/interface
2. Создать index.constants.ts — перенести все const-значения (MAP-объекты, конфиги и т.д.)
3. В index.ts добавить:
   import type { ... } from './index.types'
   import { ... } from './index.constants'
4. Проверить, что публичный API store не изменился (все экспорты на месте)
```

### Проверка после Wave 2

```bash
npm run rules:audit -- src/stores/
npx vitest run
```

---

## Wave 3: Composables (`src/composables/`)

**Приоритет:** 🟡 Средний — composables зависят от stores и domain.

**Файлов с нарушениями:** 5
**Нарушений:** 8 (A: 5, C: 3, пересечение A+C: 3 файла)

| # | Файл | Категория | Действие |
|---|------|:---------:|----------|
| 1 | `src/composables/useActivityLog/index.ts` | A + C | Создать `index.types.ts` + `index.constants.ts` |
| 2 | `src/composables/useAgeRestrictions/age-constants.ts` | A | Создать `age.types.ts`, перенести типы |
| 3 | `src/composables/useAgeRestrictions/age-unlocks.ts` | C | Создать `age-unlocks.constants.ts` |
| 4 | `src/composables/useGameModal/index.ts` | A | Создать `index.types.ts` |
| 5 | `src/composables/useModalStack/index.ts` | A + C | Создать `index.types.ts` + `index.constants.ts` |
| 6 | `src/composables/useToast/index.ts` | A + C | Создать `index.types.ts` + `index.constants.ts` |

### Проверка после Wave 3

```bash
npm run rules:audit -- src/composables/
npx vitest run
```

---

## Wave 4: Components (`src/components/`)

**Приоритет:** 🟢 Средний — components зависят от composables и stores.

**Файлов с нарушениями:** 9
**Нарушений:** 11 (A: 7, B: 2, C: 3, пересечения: 1 файл A+C, 1 файл A+B)

| # | Файл | Категория | Действие |
|---|------|:---------:|----------|
| 1 | `src/components/global/GameNav/GameNav.vue` | A + B | Создать `GameNav.types.ts`, вынести inline object type (line 83) |
| 2 | `src/components/pages/career/CareerTrack/CareerTrack.vue` | A | Создать `CareerTrack.types.ts` |
| 3 | `src/components/pages/dashboard/ActivityLogCard/ActivityLogCard.vue` | A | Создать `ActivityLogCard.types.ts` |
| 4 | `src/components/pages/dashboard/StatsCard/StatsCard.vue` | C | Создать `StatsCard.constants.ts` |
| 5 | `src/components/pages/dashboard/WorkButton/WorkButton.vue` | C | Создать `WorkButton.constants.ts` |
| 6 | `src/components/pages/dashboard/WorkChoiceModal/WorkChoiceModal.vue` | A | Создать `WorkChoiceModal.types.ts` |
| 7 | `src/components/pages/dashboard/WorkResultModal/WorkResultModal.vue` | A | Создать `WorkResultModal.types.ts` |
| 8 | `src/components/pages/education/EducationLevel/EducationLevel.vue` | A | Создать `EducationLevel.types.ts` |
| 9 | `src/components/pages/education/StudyModal/StudyModal.vue` | A | Создать `StudyModal.types.ts` |
| 10 | `src/components/ui/GameModalHost/GameModalHost.vue` | C | Создать `GameModalHost.constants.ts` |
| 11 | `src/components/ui/Modal/modal.constants.ts` | A | Создать `modal.types.ts` (типы из файла констант) |
| 12 | `src/components/ui/StatChange/StatChange.vue` | A + C | Создать `StatChange.types.ts` + `StatChange.constants.ts` |

### Особенности для Vue-компонентов

```
1. Создать ComponentName.types.ts рядом с .vue файлом
2. Для defineProps — вынести interface в .types.ts:
   // ComponentName.types.ts
   export interface ComponentNameProps { ... }
   
   // ComponentName.vue
   import type { ComponentNameProps } from './ComponentName.types'
   const props = defineProps<ComponentNameProps>()
3. Для defineEmits — аналогично вынести interface
4. Для локальных const — создать ComponentName.constants.ts
```

### Проверка после Wave 4

```bash
npm run rules:audit -- src/components/
npx vitest run
```

---

## Wave 5: Infrastructure, Config & Constants (`src/infrastructure/`, `src/config/`, `src/constants/`)

**Приоритет:** 🟢 Средний

**Файлов с нарушениями:** 6
**Нарушений:** 6 (A: 6, C: 0)

| # | Файл | Категория | Действие |
|---|------|:---------:|----------|
| 1 | `src/infrastructure/persistence/event-migration.ts` | A | Создать `event-migration.types.ts` |
| 2 | `src/config/actions-feature-flags.ts` | A | Создать `actions-feature-flags.types.ts` |
| 3 | `src/config/event-feature-flags.ts` | A | Создать `event-feature-flags.types.ts` |
| 4 | `src/config/feature-flags.ts` | A | Создать `feature-flags.types.ts` |
| 5 | `src/constants/action-categories.ts` | A | Создать `action-categories.types.ts` |
| 6 | `src/constants/work-categories.ts` | A | Создать `work-categories.types.ts` |

### Проверка после Wave 5

```bash
npm run rules:audit -- src/infrastructure/ src/config/ src/constants/
npx vitest run
```

---

## Wave 6: Utils & Plugins (`src/utils/`, `src/plugins/`)

**Приоритет:** 🔵 Низкий

**Файлов с нарушениями:** 2
**Нарушений:** 3 (A: 1, C: 1)

| # | Файл | Категория | Действие |
|---|------|:---------:|----------|
| 1 | `src/utils/stat-breakdown-format.ts` | A | Создать `stat-breakdown-format.types.ts` |
| 2 | `src/plugins/auto-save.client.ts` | C | Создать `auto-save.constants.ts` |

### Проверка после Wave 6

```bash
npm run rules:audit -- src/utils/ src/plugins/
npx vitest run
```

---

## Wave 7: Pages & Application (`src/pages/`, `src/application/`)

**Приоритет:** 🔵 Низкий — верхние слои, зависят от всех остальных.

**Файлов с нарушениями:** 3
**Нарушений:** 4 (A: 1, B: 2, C: 1)

| # | Файл | Категория | Действие |
|---|------|:---------:|----------|
| 1 | `src/application/game/commands.ts` | C | Создать `commands.constants.ts` |
| 2 | `src/application/game/ports/SaveRepository.ts` | A | Создать `SaveRepository.types.ts` |
| 3 | `src/pages/game/events/index.vue` | B | Создать `index.types.ts`, вынести inline object type (line 41) |
| 4 | `src/components/pages/events/EventModal/EventModal.vue` | B | Создать `EventModal.types.ts`, вынести inline object type (line 50) |

### Проверка после Wave 7

```bash
npm run rules:audit -- src/pages/ src/application/
npx vitest run
```

---

## Специальные случаи

### `src/types/plugins.d.ts` (Категория A)

| Файл | Примечание |
|------|------------|
| `src/types/plugins.d.ts` | ⚠️ `.d.ts` — возможен false positive. Глобальные декларации типов в `.d.ts` допустимы. **Не требует изменений** без дополнительного анализа. |

### `src/domain/balance/types/index.ts` (Barrel-файл)

Проверить, содержит ли barrel-файл inline-объявления типов. Если содержит только реэкспорты (`export type { ... } from './...'`) — нарушений нет. Если содержит объявления — вынести в отдельный файл.

---

## Сводная таблица по волнам

| Wave | Слой | Файлов | Нарушений | A | B | C | Пересечений |
|:----:|------|:------:|:---------:|:::|:::|:::|:-----------:|
| 1 | `src/domain/` | 16 | 19 | 13 | 2 | 2 | 3 |
| 2 | `src/stores/` | 12 | 22 | 11 | 0 | 11 | 11 |
| 3 | `src/composables/` | 6 | 8 | 5 | 0 | 3 | 3 |
| 4 | `src/components/` | 12 | 14 | 7 | 2 | 3 | 2 |
| 5 | `src/infrastructure/`, `src/config/`, `src/constants/` | 6 | 6 | 6 | 0 | 0 | 0 |
| 6 | `src/utils/`, `src/plugins/` | 2 | 3 | 1 | 0 | 1 | 0 |
| 7 | `src/pages/`, `src/application/` | 4 | 4 | 1 | 2 | 1 | 0 |
| | **Итого** | **58** | **76** | **44** | **6** | **21** | **19** |

> Примечание: 62 уникальных файла — 4 файла из специальных случаев (plugins.d.ts, barrel index.ts, EventModal.vue отнесён к Wave 4 по компонентам, но указан в Wave 7 по pages — фактически отнесён к Wave 4).

---

## Проверка после каждой волны

После завершения каждой волны выполнять:

```bash
# 1. Аудит правил в изменённом слое
npm run rules:audit -- src/<layer>/

# 2. Полный прогон тестов
npx vitest run

# 3. TypeScript-проверка
npx nuxi typecheck

# 4. Если всё прошло — коммит
git add -A
git commit -m "refactor(wave N): extract types/constants per rules <layer>"
```

### Финальная проверка (после всех волн)

```bash
# Полный аудит
npm run rules:audit

# Полные тесты
npx vitest run

# TypeScript
npx nuxi typecheck

# Сборка
npm run build
```

---

## Приложение: Файлы с пересечением нарушений

Для этих файлов требуется комбинированный подход (создать и `.types.ts`, и `.constants.ts`):

| Файл | Пересечение | `.types.ts` | `.constants.ts` |
|------|:-----------:|:-----------:|:---------------:|
| `src/domain/balance/constants/game-events.ts` | A + B | ✅ | — |
| `src/domain/balance/constants/skill-effects-generator.ts` | A + C | ✅ | ✅ (переименовать) |
| `src/domain/balance/utils/build-new-game-save.ts` | A + B + C | ✅ | ✅ |
| `src/domain/balance/utils/hourly-rates.ts` | A + C | ✅ | ✅ |
| `src/stores/actions-store/index.ts` | A + C | ✅ | ✅ |
| `src/stores/activity-store/index.ts` | A + C | ✅ | ✅ |
| `src/stores/career-store/index.ts` | A + C | ✅ | ✅ |
| `src/stores/events-store/index.ts` | A + C | ✅ | ✅ |
| `src/stores/player-store/index.ts` | A + C | ✅ | ✅ |
| `src/stores/skills-store/index.ts` | A + C | ✅ | ✅ |
| `src/stores/stats-store/index.ts` | A + C | ✅ | ✅ |
| `src/stores/time-store/index.ts` | A + C | ✅ | ✅ |
| `src/stores/wallet-store/index.ts` | A + C | ✅ | ✅ |
| `src/composables/useActivityLog/index.ts` | A + C | ✅ | ✅ |
| `src/composables/useModalStack/index.ts` | A + C | ✅ | ✅ |
| `src/composables/useToast/index.ts` | A + C | ✅ | ✅ |
| `src/components/ui/StatChange/StatChange.vue` | A + C | ✅ | ✅ |
| `src/components/global/GameNav/GameNav.vue` | A + B | ✅ | — |
