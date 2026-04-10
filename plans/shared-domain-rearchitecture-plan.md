# План: Реструктуризация src/shared и src/domain

**Дата:** 2026-04-10
**Статус:** Анализ + Рекомендация

---

## 1. Текущее состояние

### game_life — `src/shared/`

```
src/shared/
├── constants/
│   ├── index.ts          ← импортирует типы из @/domain/balance/types (StatDef, NavItem)
│   ├── activity-log.ts   ← доменные константы (ACTION_ID_PATTERN, ACTION_ID_ALIASES)
│   ├── metric-labels.ts  ← UI-лейблы (STAT_LABELS_RU, METRIC_LABELS, EFFECT_LABELS)
│   └── navigation.ts     ← UI-роутинг (ROUTE_MAP)
├── types/
│   └── activity-log.ts   ← доменные типы (ActionMetadata, ActivityLogEntry)
└── utils/
    ├── activity-log-formatters.ts ← импортирует из domain (getActionById, getSkillByKey)
    ├── stat-changes-format.ts     ← импортирует тип из domain (StatChanges)
    ├── skill-tooltip-content.ts   ← импортирует тип из domain (SkillDef)
    └── format.ts                  ← чистая UI-утилита (formatMoney, formatEffect)
```

### game_life — `src/domain/`

```
src/domain/
├── balance/         ← данные баланса (actions, constants, types, utils)
├── engine/          ← ECS (world, components, 18 systems, types, utils)
│   ├── systems/StatsSystem/index.ts       ← импортирует STAT_DEFS из @/shared/constants
│   └── utils/stat-change-summary/index.ts ← импортирует STAT_LABELS_RU из @/shared/constants
└── game-facade/     ← фасад домена (commands, queries, system-context)
```

### 🔴 Проблема: Циклическая зависимость

```
src/shared → src/domain  (4 импорта: типы + функции)
src/domain → src/shared  (2 импорта: константы)
```

Это нарушает принцип слоёной архитектуры. `shared` не может зависеть от `domain`.

---

## 2. Эталон — Henderson

Henderson использует **плоскую Nuxt-структуру** (без `src/`, без `shared/`):

```
henderson/
├── types/        ← глобальные shared-типы (CountryCode, MaskPhone, TypeInput...)
├── constants/    ← глобальные shared-константы (USER_AGENT_MOBILE, PHONE_MASKS...)
├── utils/        ← глобальные shared-утилиты (address, validation, url, global)
├── classes/      ← переиспользуемые классы (ObserverIntersection, ScrollOneSection)
├── services/     ← API-слой, каждый модуль: index.ts + types.ts + constants.ts
├── stores/       ← Pinia stores, каждый модуль: index.ts + types.ts + constants.ts + utils.ts
├── composables/  ← Vue composables, каждый модуль: index.ts + types.ts + utils.ts
├── components/
├── pages/
├── plugins/
├── middleware/
└── layouts/
```

### Ключевые паттерны Henderson:

1. **Нет `shared/`** — вместо него плоские `types/`, `constants/`, `utils/` для глобальных вещей
2. **Модульная локальность** — каждый модуль (service, store, composable) владеет своими `types.ts`, `constants.ts`, `utils.ts`
3. **Алиасы** — `@services`, `@stores`, `@composables`, `@constants`, `@types`, `@utils`, `@classes`
4. **Строгий index.ts** — barrel re-export как публичный API модуля

---

## 3. Рекомендация: Упразднить `src/shared/`

### Принцип

Следуя паттерну Henderson: **убрать `src/shared/` как директорию**, распределив содержимое по назначению.

### Что куда переносим

| Файл в `src/shared/` | Проблема | Куда переносим |
|---|---|---|
| `constants/index.ts` (STAT_DEFS, NAV_ITEMS) | Импортирует типы из domain | → `src/domain/balance/constants/stat-defs.ts` + `src/constants/navigation.ts` |
| `constants/activity-log.ts` | Доменное знание | → `src/domain/balance/constants/activity-log.ts` |
| `constants/metric-labels.ts` | UI-лейблы, чистые | → `src/constants/metric-labels.ts` |
| `constants/navigation.ts` | UI-роутинг, чистый | → `src/constants/navigation.ts` |
| `types/activity-log.ts` | Доменные типы | → `src/domain/balance/types/activity-log.ts` |
| `utils/activity-log-formatters.ts` | Зависит от domain | → `src/composables/useActivityLog/utils/activity-log-formatters.ts` |
| `utils/stat-changes-format.ts` | Зависит от domain-типов | → `src/domain/engine/utils/stat-changes-format.ts` (уже есть `stat-change-summary/`) |
| `utils/skill-tooltip-content.ts` | Зависит от domain-типов | → `src/domain/balance/utils/skill-tooltip-content.ts` |
| `utils/format.ts` | Чистая UI-утилита | → `src/utils/format.ts` |

### Итоговая структура (после миграции)

```
src/
├── constants/              ← НОВО: глобальные UI-константы (henderson-style)
│   ├── index.ts
│   ├── metric-labels.ts    ← STAT_LABELS_RU, METRIC_LABELS, EFFECT_LABELS
│   └── navigation.ts       ← ROUTE_MAP, NAV_ITEMS
│
├── utils/                  ← НОВО: глобальные UI-утилиты (henderson-style)
│   ├── index.ts
│   └── format.ts           ← formatMoney, formatEffect
│
├── domain/
│   ├── balance/
│   │   ├── constants/
│   │   │   ├── ... (существующие)
│   │   │   ├── stat-defs.ts      ← ПЕРЕНОС: STAT_DEFS
│   │   │   └── activity-log.ts   ← ПЕРЕНОС: ACTION_ID_PATTERN, ACTION_ID_ALIASES
│   │   ├── types/
│   │   │   ├── ... (существующие)
│   │   │   └── activity-log.ts   ← ПЕРЕНОС: ActionMetadata, ActivityLogEntry
│   │   └── utils/
│   │       ├── ... (существующие)
│   │       └── skill-tooltip-content.ts  ← ПЕРЕНОС
│   │
│   └── engine/
│       └── utils/
│           ├── stat-change-summary/  (существующий)
│           └── stat-changes-format/  ← ПЕРЕНОС: summarizeStatChangesRu, formatStatChangesBulletListRu
│
├── composables/
│   └── useActivityLog/
│       ├── index.ts
│       └── utils/
│           └── activity-log-formatters.ts  ← ПЕРЕНОС
│
├── components/
├── pages/
├── stores/
├── application/
├── infrastructure/
└── ...
```

---

## 4. Алиасы (в стиле Henderson)

Добавить в `nuxt.config.ts` или `tsconfig.json`:

```typescript
// tsconfig.json paths (или nuxt.config.ts alias)
{
  "@constants": ["./src/constants/index.ts"],
  "@utils": ["./src/utils/index.ts"],
  "@domain": ["./src/domain/index.ts"],
  "@composables": ["./src/composables/index.ts"]
}
```

---

## 5. Порядок миграции (пошагово)

### Шаг 1: Создать новые директории
- `src/constants/` с `metric-labels.ts`, `navigation.ts`, `index.ts`
- `src/utils/` с `format.ts`, `index.ts`

### Шаг 2: Перенести доменные файлы из shared → domain
- `shared/types/activity-log.ts` → `domain/balance/types/activity-log.ts`
- `shared/constants/activity-log.ts` → `domain/balance/constants/activity-log.ts`
- `shared/constants/index.ts` (STAT_DEFS) → `domain/balance/constants/stat-defs.ts`
- `shared/utils/skill-tooltip-content.ts` → `domain/balance/utils/skill-tooltip-content.ts`
- `shared/utils/stat-changes-format.ts` → `domain/engine/utils/stat-changes-format/`

### Шаг 3: Перенести presentation-утилиты
- `shared/utils/activity-log-formatters.ts` → `composables/useActivityLog/utils/activity-log-formatters.ts`

### Шаг 4: Обновить все импорты
- Pages: `@/shared/utils/format` → `@/utils/format`
- Pages: `@/shared/constants` → `@/constants` или `@/domain/balance/constants`
- Domain: `@/shared/constants` → локальные импорты
- Composables: `@/shared/utils` → локальные импорты

### Шаг 5: Удалить `src/shared/`

### Шаг 6: Добавить алиасы в tsconfig/nuxt.config

---

## 6. Что НЕ менять в src/domain/

`src/domain/` уже хорошо структурирован по паттерну Henderson:
- Каждый модуль (`balance/`, `engine/`, `game-facade/`) имеет локальные `types/`, `constants/`, `utils/`
- ECS-системы следуют модульному паттерну: `index.ts` + `index.types.ts` + `index.constants.ts` + `index.utils.ts`
- `game-facade/` — публичный API домена

**Единственное изменение в domain** — убрать 2 импорта из `@/shared`:
- `StatsSystem` → импортировать `STAT_DEFS` из локального `domain/balance/constants/`
- `stat-change-summary` → импортировать `STAT_LABELS_RU` из `@/constants/metric-labels`

---

## 7. Guardrails

- ❌ НЕ переносить UI-утилиты в domain (domain не должен знать про форматирование)
- ❌ НЕ создавать новые циклические зависимости
- ✅ Domain → может импортировать из `@/constants` (глобальные UI-константы без domain-зависимостей)
- ✅ Pages → могут импортировать из `@/constants`, `@/utils`, `@/domain`
- ✅ Composables → могут импортировать из `@/domain`, `@/constants`, `@/utils`

---

## 8. Итог

| Аспект | До | После |
|---|---|---|
| Циклическая зависимость | shared ↔ domain | Устранена |
| Структура | `src/shared/` (не henderson-style) | `src/constants/` + `src/utils/` (henderson-style) |
| Доменные типы | В shared | В domain |
| UI-константы | В shared | В `src/constants/` |
| UI-утилиты | В shared | В `src/utils/` |
| Форматтеры с domain-зависимостью | В shared | В composables или domain/utils |
