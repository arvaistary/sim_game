# План миграции архитектуры game_life → эталон henderson

Дата: 2026-04-10

## Контекст

Эталон: `E:\project\games\henderson` — Nuxt 3 e-commerce проект с зрелой архитектурой.
Текущий: `E:\project\games\game_life` — Nuxt 4 клиентская игра с ECS-движком.

Переносятся **структурные паттерны** организации кода, а не специфичные для e-commerce слои (services, API, i18n).

---

## GAP-анализ

### GAP 1: Barrel exports (index.ts) — ❌ отсутствуют

**Henderson**: каждая директория компонентов (`global/`, `layouts/`, `pages/`, `ui/`) + `composables/`, `stores/`, `services/`, `utils/` имеет `index.ts` с реэкспортами. Автоимпорты отключены — всё явно через алиасы.

**Game_life**: алиасы `@constants`, `@utils`, `@domain`, `@composables` указывают на `index.ts`, но `components/` **не имеет barrel exports**. Нет алиасов `@components`, `@stores`. Импорты в страницах — прямые пути к `.vue`.

**Задачи**:
1. Создать `src/components/ui/index.ts` — barrel export всех UI-компонентов
2. Создать `src/components/game/index.ts` — barrel export всех game-компонентов
3. Создать `src/components/pages/index.ts` — barrel export всех page-компонентов
4. Создать `src/components/global/index.ts` — barrel export BottomNav
5. Создать `src/components/layout/index.ts` — barrel export GameLayout
6. Создать `src/components/index.ts` — общий barrel (реэкспорт подкатегорий)
7. Добавить алиасы в `nuxt.config.ts`: `@components`, `@stores`, `@ui`, `@game`
8. Обновить все импорты в страницах на использование barrel exports

---

### GAP 2: Стили вынесены в .scss — ⚠️ частично

**Henderson**: **ни один** `.vue` файл не содержит `<style>`. Все стили — в `ComponentName.scss` рядом, импорт через `import './ComponentName.scss'`.

**Game_life**:
- ✅ `game/` компоненты — стили вынесены
- ✅ `pages/` компоненты — стили вынесены
- ✅ `layout/GameLayout/`, `global/BottomNav/` — вынесены
- ❌ `ui/` компоненты — **все 6** содержат инлайн `<style scoped>` внутри `.vue`
- ❌ `game/StatBar.vue` — инлайн стили

**Задачи**:
9. Вынести стили из `ui/GameButton.vue` → `GameButton.scss`
10. Вынести стили из `ui/Modal.vue` → `Modal.scss`
11. Вынести стили из `ui/ProgressBar.vue` → `ProgressBar.scss`
12. Вынести стили из `ui/RoundedPanel.vue` → `RoundedPanel.scss`
13. Вынести стили из `ui/Toast.vue` → `Toast.scss`
14. Вынести стили из `ui/Tooltip.vue` → `Tooltip.scss`
15. Вынести стили из `game/StatBar.vue` → преобразовать в папку `StatBar/StatBar.vue` + `StatBar.scss`
16. Удалить все `<style>` блоки из `.vue` файлов

---

### GAP 3: UI-компоненты — папочная структура — ❌ отсутствует

**Henderson**: каждый UI-компонент — папка `ComponentName/` с `.vue`, `.scss`, `.types.ts`.

**Game_life**: `ui/` — плоские `.vue` файлы без папок, без `.types.ts`.

**Задачи**:
17. Каждый UI-компонент обернуть в папку: `GameButton/`, `Modal/`, `ProgressBar/`, `RoundedPanel/`, `Toast/`, `Tooltip/`
18. Создать `.types.ts` для каждого UI-компонента (вынести типы из `defineProps`)
19. Обновить все импорты UI-компонентов в `pages/`, `game/`, `global/`

---

### GAP 4: Nuxt Layouts — ❌ не используются

**Henderson**: использует Nuxt `layouts/default.vue` для оболочки страницы (хедер, футер, меню, попапы). Страницы содержат только контент.

**Game_life**: `GameLayout` — обычный компонент, вручную импортируется в каждой из 13 страниц. Nuxt `layouts/` не существует.

**Задачи**:
20. Создать `src/layouts/default.vue` + `default.scss` — Nuxt layout с GameLayout
21. Перенести BottomNav и хедер в layout
22. Убрать ручной импорт `GameLayout` из всех 13 страниц — оставить только контент
23. Упростить или удалить `GameLayout` если layout его полностью заменяет

---

### GAP 5: Barrel export для stores — ❌ отсутствует

**Henderson**: `stores/index.ts` реэкспортирует все stores.

**Game_life**: один store `game.store.ts` без barrel export.

**Задачи**:
24. Создать `src/stores/index.ts` — barrel export
25. Добавить алиас `@stores` в `nuxt.config.ts`

---

### GAP 6: Barrel export для composables — ⚠️ проверить

**Henderson**: `composables/index.ts` реэкспортирует все composables.

**Game_life**: алиас `@composables` → `src/composables/index.ts`, нужно проверить полноту.

**Задачи**:
26. Проверить и дополнить `src/composables/index.ts`

---

### GAP 7: Alias-ы для компонентных категорий — ❌ отсутствуют

**Henderson**: `@components` → `components/`, затем `@components/global`, `@components/layouts`, `@components/pages`, `@components/ui`.

**Game_life**: нет алиаса `@components`. Импорты через `@/components/...`.

**Задачи**:
27. Добавить в `nuxt.config.ts`:
    - `@components` → `src/components/`
    - `@stores` → `src/stores/index.ts`
    - Расширить существующие алиасы при необходимости

---

### GAP 8: Barrel export для constants — ⚠️ проверить

**Задачи**:
28. Проверить что `src/constants/index.ts` реэкспортирует всё необходимое

---

### GAP 9: Правила (rules) — обновить

**Задачи**:
29. Обновить `.cursor/rules/30-architecture.mdc` — отразить новую структуру (global/, barrel exports, Nuxt layouts)
30. Обновить `.cursor/rules/40-styles.mdc` — уточнить правило «стили только в .scss»

---

## Волны реализации

### Wave 1: Стили (GAP 2) — задачи 9–16
Вынести стили из `ui/*.vue` и `game/StatBar.vue` в отдельные `.scss` файлы.

### Wave 2: Папочная структура UI (GAP 3) — задачи 17–19
Обернуть UI-компоненты в папки, создать `.types.ts`, обновить импорты.

### Wave 3: Barrel exports + алиасы (GAP 1, 5, 6, 7, 8) — задачи 1–8, 24–28
Создать `index.ts` для каждой категории, алиасы в `nuxt.config.ts`, обновить импорты.

### Wave 4: Nuxt Layouts (GAP 4) — задачи 20–23
Создать `src/layouts/default.vue`, убрать GameLayout из страниц.

### Wave 5: Правила (GAP 9) — задачи 29–30
Обновить `.cursor/rules/` файлы.

---

## Что НЕ переносим

| Слой henderson | Причина |
|---|---|
| `services/` + HTTP client | game_life — клиентское приложение без API |
| `server/` | SSR отключен, серверного кода нет |
| `locales/` + i18n | Локализация не требуется (русскоязычная игра) |
| `plugins/` (20+ плагинов) | Нет аналогичной потребности |
| `middleware/` (5 middlewares) | Один middleware `game-init` — достаточно |
| `classes/` | Нет IntersectionObserver / scroll-контроллеров |
| `stories/` + Storybook | Инфраструктура Storybook не настроена |

---

## Целевая структура `src/`

```
src/
├── application/              # (без изменений)
├── assets/
│   └── scss/                 # (без изменений)
├── components/
│   ├── game/                 # Game-специфичные — каждый в папке + .scss
│   │   ├── index.ts          # Barrel export ← NEW
│   │   ├── ActionCard/
│   │   ├── ActionCardList/
│   │   ├── EmptyState/
│   │   ├── SectionHeader/
│   │   ├── StatBar/          # ← папка (был плоский .vue)
│   │   └── TabBar/
│   ├── global/               # Глобальные компоненты
│   │   ├── index.ts          # Barrel export ← NEW
│   │   └── BottomNav/
│   ├── layout/               # Layout компоненты
│   │   ├── index.ts          # Barrel export ← NEW
│   │   └── GameLayout/
│   ├── pages/                # Page-specific
│   │   ├── index.ts          # Barrel export ← NEW
│   │   ├── activity/
│   │   ├── career/
│   │   ├── dashboard/
│   │   ├── education/
│   │   ├── events/
│   │   ├── finance/
│   │   ├── recovery/
│   │   └── skills/
│   └── ui/                   # UI-примитивы — каждый в папке + .scss + .types.ts
│       ├── index.ts          # Barrel export ← NEW
│       ├── GameButton/       # ← папка (был плоский .vue)
│       ├── Modal/
│       ├── ProgressBar/
│       ├── RoundedPanel/
│       ├── Toast/
│       └── Tooltip/
├── composables/
│   └── index.ts              # Barrel (дополнить)
├── constants/
│   └── index.ts              # Barrel (дополнить)
├── domain/                   # (без изменений)
├── infrastructure/           # (без изменений)
├── layouts/                  # ← NEW — Nuxt layouts
│   ├── default.vue
│   └── default.scss
├── middleware/
├── pages/                    # Упрощённые (без GameLayout обёртки)
├── plugins/
├── stores/
│   ├── index.ts              # ← NEW barrel
│   └── game.store.ts
└── utils/
    └── index.ts
```
