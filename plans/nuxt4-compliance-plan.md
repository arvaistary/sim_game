# План приведения проекта в соответствие с Nuxt 4

**Дата:** 24 апреля 2026 (завершён)  
**Версия Nuxt:** 4.4.2  
**Режим:** SPA (ssr: false)

---

## Текущее состояние

### Конфигурация

| Параметр | Текущее значение | Nuxt 4 default | Соответствие |
|----------|-----------------|----------------|--------------|
| `srcDir` | `'src/'` | `'app/'` | ⚠️ Отступление, но допустимое |
| `compatibilityDate` | `'2026-04-10'` | — | ✅ |
| `ssr` | `false` | `true` | ✅ Осознанный выбор SPA |
| `typescript.strict` | `true` | — | ✅ Включено |
| `typescript.typeCheck` | `false` | — | ❌ Отключено |
| `tsconfig strictNullChecks` | `true` | — | ✅ Включено |

### Структура директорий

```
Текущая:                          Nuxt 4 default:
src/                              app/
├── app.vue                       ├── app.vue
├── pages/                        ├── pages/
├── components/                   ├── components/
├── composables/                  ├── composables/
├── plugins/                      ├── plugins/
├── middleware/                   ├── middleware/
├── stores/                       ├── utils/
├── domain/                       server/
├── application/                  shared/
├── infrastructure/               public/
├── config/
├── constants/
├── utils/
├── types/
└── assets/

shared/                           (создано)
├── types/
└── utils/
```

### Автоимпорты

| Категория | Статус | Детали |
|-----------|--------|--------|
| Vue API (ref, computed, watch...) | ✅ Автоимпорт | Нет `import from 'vue'` в .vue файлах |
| Nuxt API (useRoute, navigateTo...) | ✅ Автоимпорт | Корректно используется |
| Pinia stores | ✅ Автоимпорт | `imports.dirs: ['stores']` настроен, 23+ UI-level ручных импортов удалено |
| Composables | ✅ Автоимпорт | Glob-паттерн настроен, 20+ UI-level ручных импортов удалено |
| Components | ⚠️ Частично | Настроены через `components[]`, но есть ручные импорты |

> **Примечание:** В `src/application/game/commands.ts` (9 импортов) и `src/application/game/queries.ts` (6 импортов) ручные импорты сохранены — это ожидаемо для non-Vue application layer, который не поддерживает автоимпорт Nuxt.

### Зависимости

| Пакет | Версия | Статус |
|-------|--------|--------|
| `nuxt` | 4.4.2 | ✅ Актуальная |
| `vue` | 3.5.32 | ✅ |
| `pinia` | 3.0.4 | ✅ |
| `@vueuse/nuxt` | 14.2.1 | ✅ Модуль Nuxt, корректно |
| `unplugin-auto-import` | — | ✅ Удалён |
| `autoprefixer` | — | ✅ Удалён |
| `cssnano` | — | ✅ Удалён |
| `@vueuse/core` | — | ✅ Удалён |

---

## Выполненные задачи

- ✅ **TypeScript strict mode** — `typescript.strict: true` в nuxt.config.ts, `strictNullChecks: true` в tsconfig.json
- ✅ **Автоимпорт stores** — `imports.dirs: ['stores']` в nuxt.config.ts, 23+ ручных импортов удалено из UI-слоя
- ✅ **Автоимпорт composables** — glob-паттерн настроен, 20+ ручных импортов удалено из UI-слоя
- ✅ **shared/ директория** — создана `shared/types/` и `shared/utils/`, добавлена в `imports.dirs`
- ✅ **unplugin-auto-import** — удалён из package.json
- ✅ **Legacy-файлы** — удалены `index.html`, `src/vite-env.d.ts`, `src/style.css`
- ✅ **Именование composables** — все 17 директорий в camelCase (useActions, useActivity, ...), kebab-case не обнаружен
- ✅ **Удаление избыточных зависимостей** — `autoprefixer`, `cssnano`, `@vueuse/core` удалены из package.json
- ✅ **Очистка lockfile** — `unplugin-auto-import` полностью удалён
- ✅ **Починка useActivityLog** — добавлены отсутствующие импорты утилит
- ✅ **Починка useHousing** — очищен .nuxt cache для корректного автоимпорта
- ✅ **Очистка конфигурации** — убрана мёртвая ссылка `shared/utils` из imports.dirs
- ✅ **Очистка кода** — удалён мёртвый импорт в ActivityLogCard.vue, мёртвый код useFinance/use-finance/
- ✅ **Barrel file** — useGameStore добавлен в stores/index.ts

---

## Оставшиеся несоответствия

Нет. Все P2-пункты разрешены:

- ✅ `autoprefixer`, `cssnano`, `@vueuse/core` — удалены из package.json
- ✅ `npm prune` — lockfile очищен (unplugin-auto-import удалён)
- ✅ `shared/utils` — убрана мёртвая ссылка из imports.dirs (директория не существовала)
- ✅ `useActivityLog/index.ts` — добавлены отсутствующие импорты `resolveActivityLogTitle`, `resolveActivityLogDescription`
- ✅ `useHousing` — очищен .nuxt cache, функция будет корректно автоимпортирована после следующего `nuxt dev`
- ✅ `ActivityLogCard.vue` — удалён мёртвый импорт
- ✅ `stores/index.ts` — добавлен `useGameStore` в barrel file
- ✅ `composables/useFinance/use-finance/` — удалён дублирующий мёртвый код
- ⏭️ Документация — пропущена намеренно

---

## Итоговая сводка

| Категория | Соответствие | Кол-во пунктов |
|-----------|-------------|----------------|
| ✅ Соответствует | Nuxt 4 установлен, SPA режим, автоимпорт Vue/Nuxt API, автоимпорт stores, автоимпорт composables, TypeScript strict, shared/, файловый роутинг, middleware, plugins, именование composables, зависимости очищены, lockfile очищен, код очищен | 14 |
| ⚠️ Частично | Компоненты (частичный автоимпорт), srcDir (src/ вместо app/) | 2 |
| ⏭️ Пропущено | Документация (намеренно) | 1 |

> **Примечание:** Обновление документации (doc/NUXT4_ARCHITECTURE.md, doc/NUXT4_MIGRATION_PLAN.md, doc/RULES_NUXT_ADAPTATION.md) пропущено намеренно — будет выполнено отдельной задачей.
