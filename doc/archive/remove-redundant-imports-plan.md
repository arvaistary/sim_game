# План удаления избыточных импортов в Nuxt 4

## Обзор задачи

В проекте на Nuxt 4 обнаружено **76 файлов** с избыточными импортами, которые автоимпортируются фреймворком. Удаление этих импортов улучшит читаемость кода и приведёт его в соответствие с соглашениями Nuxt 4.

## ⚠️ Важное ограничение автоимпортов

**Критическое правило:** Когда есть явный импорт из модуля `vue`, TypeScript ожидает, что **все** используемые функции из этого модуля будут явно импортированы. Автоимпорты не работают для функций из того же модуля, который уже явно импортирован.

**Пример проблемы:**
```typescript
// ❌ НЕ РАБОТАЕТ - ошибка "Не удается найти имя 'computed'"
import { ref } from 'vue'
const message = ref('')
const data = computed(() => ...) // computed не импортирован!

// ✅ РАБОТАЕТ - вариант 1: удалить все импорты из vue
const message = ref('')
const data = computed(() => ...)

// ✅ РАБОТАЕТ - вариант 2: импортировать все используемые функции
import { ref, computed } from 'vue'
const message = ref('')
const data = computed(() => ...)
```

**Стратегия удаления:**
- Если файл использует только функции из Vue → удалить ВСЕ импорты из `vue`
- Если файл использует функции из Vue и других модулей → удалить ВСЕ импорты из `vue`
- Если файл использует type-only импорты из Vue (например, `type Component`) → оставить их

## Что автоимпортируется в Nuxt 4

### Из Vue
- `ref`, `computed`, `reactive`, `watch`, `watchEffect`
- `onMounted`, `onUnmounted`, `onBeforeMount`, `onBeforeUnmount`, `onBeforeUpdate`, `onUpdated`, `onErrorCaptured`, `onRenderTracked`, `onRenderTriggered`, `onServerPrefetch`, `onActivated`, `onDeactivated`, `onScopeDispose`
- `nextTick`, `defineComponent`, `defineProps`, `defineEmits`, `withDefaults`, `useSlots`, `useAttrs`, `useTemplateRef`
- `toRef`, `toRefs`, `isRef`, `unref`, `shallowRef`, `triggerRef`, `customRef`, `toValue`
- `useModel`, `useId`, `useCssModule`, `useCssVars`
- `provide`, `inject`, `hasInjectionContext`, `getCurrentInstance`
- `useHydration`, `useSSRContext`, `useTransitionState`, `useSuspense`
- `type Component`

### Из Vue Router
- `useRouter`, `useRoute`, `navigateTo`
- `onBeforeRouteLeave`, `onBeforeRouteUpdate`

### Из Nuxt
- `useNuxtApp`, `defineNuxtPlugin`, `defineNuxtRouteMiddleware`, `useRuntimeConfig`
- `useState`, `useCookie`, `useRequestHeaders`, `useRequestEvent`
- `useFetch`, `useAsyncData`, `useLazyAsyncData`, `useLazyFetch`
- `useHead`, `useSeoMeta`, `useServerHead`, `useServerSeoMeta`
- `definePageMeta`, `abortNavigation`, `addRouteMiddleware`
- `clearNuxtData`, `clearNuxtState`
- `onNuxtReady`, `preloadRouteComponents`, `prefetchComponents`
- `refreshNuxtData`, `setResponseStatus`, `useAppConfig`, `useError`

### Из Pinia (через @pinia/nuxt)
- `defineStore`

### Из @nuxtjs/color-mode
- `useColorMode`

## Статистика избыточных импортов

| Импорт | Количество файлов |
|--------|-------------------|
| `import { computed } from 'vue'` | ~50 |
| `import { ref } from 'vue'` | ~30 |
| `import { defineStore } from 'pinia'` | 13 |
| `import { navigateTo } from '#imports'` | ~10 |
| `import { definePageMeta } from '#imports'` | ~10 |
| `import { useRouter } from '#imports'` | ~5 |
| `import { useRoute } from '#imports'` | ~5 |
| `import { onMounted } from 'vue'` | ~5 |
| `import { onUnmounted } from 'vue'` | ~5 |
| `import { watch } from 'vue'` | ~5 |

## Стратегия выполнения

### Ограничения
- **Максимум 2 подзадачи одновременно** (согласно глобальным инструкциям)
- **Ждать завершения перед запуском новых**
- **Последовательные зависимости** — если задача B зависит от A, запускать строго последовательно

### Порядок выполнения
1. **Composables** (14 файлов) — низкий риск, простые файлы
2. **Stores** (13 файлов) — низкий риск, изолированные файлы
3. **UI Components** (8 файлов) — низкий риск
4. **Pages Components** (20 файлов) — средний риск
5. **Pages** (13 файлов) — средний риск
6. **Global Components** (2 файла) — средний риск
7. **Game Components** (3 файла) — средний риск
8. **Layout & Middleware & Plugins** (3 файла) — высокий риск, проверять в последнюю очередь

## Детальный план по раундам

### Раунд 1: Composables (Batch 1)
**Файлы:**
1. `src/composables/use-activity/index.ts`
2. `src/composables/use-stats/index.ts`

**Действия:**
- Удалить `import { computed } from 'vue'` (оба файла)

**Примечание:** Эти файлы используют только `computed` из Vue, поэтому можно удалить импорт полностью.

---

### Раунд 2: Composables (Batch 2)
**Файлы:**
1. `src/composables/use-finance/index.ts`
2. `src/composables/use-education/index.ts`

**Действия:**
- Удалить `import { computed } from 'vue'` (оба файла)

**Примечание:** Эти файлы используют только `computed` из Vue, поэтому можно удалить импорт полностью.

---

### Раунд 3: Composables (Batch 3)
**Файлы:**
1. `src/composables/useToast/index.ts`
2. `src/composables/use-career/index.ts`

**Действия:**
- Удалить `import { ref } from 'vue'` (useToast)
- Удалить `import { computed } from 'vue'` (use-career)

---

### Раунд 4: Composables (Batch 4)
**Файлы:**
1. `src/composables/useActions/index.ts`
2. `src/composables/use-skills/index.ts`

**Действия:**
- Удалить `import { computed } from 'vue'` (оба файла)

**Примечание:** Эти файлы используют только `computed` из Vue, поэтому можно удалить импорт полностью.

---

### Раунд 5: Composables (Batch 5)
**Файлы:**
1. `src/composables/use-housing/index.ts`
2. `src/composables/use-wallet/index.ts`

**Действия:**
- Удалить `import { computed } from 'vue'`

---

### Раунд 6: Composables (Batch 6)
**Файлы:**
1. `src/composables/useAgeRestrictions/index.ts`
2. `src/composables/useModalStack/index.ts`

**Действия:**
- Удалить `import { computed } from 'vue'` (useAgeRestrictions)
- Удалить `import { ref, computed, type Component } from 'vue'` (useModalStack)

---

### Раунд 7: Composables (Batch 7)
**Файлы:**
1. `src/composables/useEvents/index.ts`
2. `src/composables/use-time/index.ts`

**Действия:**
- Удалить `import { ref, computed } from 'vue'` (useEvents)
- Удалить `import { computed } from 'vue'` (use-time)

---

### Раунд 8: Composables (Batch 8)
**Файлы:**
1. `src/composables/useGameModal/index.ts`
2. `src/composables/useActivityLog/index.ts`

**Действия:**
- Удалить `import { ref, type Component } from 'vue'` (useGameModal)
- Удалить `import { ref, computed } from 'vue'` (useActivityLog)

---

### Раунд 9: Stores (Batch 1)
**Файлы:**
1. `src/stores/activity-store/index.ts`
2. `src/stores/actions-store/index.ts`

**Действия:**
- Удалить `import { defineStore } from 'pinia'`
- Удалить `import { ref, computed } from 'vue'`

---

### Раунд 10: Stores (Batch 2)
**Файлы:**
1. `src/stores/wallet-store/index.ts`
2. `src/stores/housing-store/index.ts`

**Действия:**
- Удалить `import { defineStore } from 'pinia'`
- Удалить `import { ref, computed } from 'vue'`

---

### Раунд 11: Stores (Batch 3)
**Файлы:**
1. `src/stores/game.store.ts`
2. `src/stores/time-store/index.ts`

**Действия:**
- Удалить `import { defineStore } from 'pinia'`
- Удалить `import { computed, ref, watch } from 'vue'` (game.store.ts)
- Удалить `import { ref, computed } from 'vue'` (time-store)

---

### Раунд 12: Stores (Batch 4)
**Файлы:**
1. `src/stores/education-store/index.ts`
2. `src/stores/finance-store/index.ts`

**Действия:**
- Удалить `import { defineStore } from 'pinia'`
- Удалить `import { ref, computed } from 'vue'`

---

### Раунд 13: Stores (Batch 5)
**Файлы:**
1. `src/stores/career-store/index.ts`
2. `src/stores/events-store/index.ts`

**Действия:**
- Удалить `import { defineStore } from 'pinia'`
- Удалить `import { ref, computed } from 'vue'`

---

### Раунд 14: Stores (Batch 6)
**Файлы:**
1. `src/stores/skills-store/index.ts`
2. `src/stores/stats-store/index.ts`

**Действия:**
- Удалить `import { defineStore } from 'pinia'`
- Удалить `import { ref, computed } from 'vue'`

---

### Раунд 15: Stores (Batch 7)
**Файлы:**
1. `src/stores/player-store/index.ts`

**Действия:**
- Удалить `import { defineStore } from 'pinia'`
- Удалить `import { ref, computed } from 'vue'`

---

### Раунд 16: UI Components (Batch 1)
**Файлы:**
1. `src/components/ui/Tooltip/index.vue`
2. `src/components/ui/Toast/index.vue`

**Действия:**
- Удалить `import { ref, computed, onMounted, onUnmounted } from 'vue'` (Tooltip)
- Удалить `import { watch } from 'vue'` (Toast)

---

### Раунд 17: UI Components (Batch 2)
**Файлы:**
1. `src/components/ui/GameModalHost/GameModalHost.vue`
2. `src/components/ui/GameButton/index.vue`

**Действия:**
- Удалить `import { computed } from 'vue'` и `import { navigateTo } from '#imports'` (GameModalHost)
- Удалить `import { computed } from 'vue'` (GameButton)

---

### Раунд 18: UI Components (Batch 3)
**Файлы:**
1. `src/components/ui/StatChange/StatChange.vue`
2. `src/components/ui/RoundedPanel/index.vue`

**Действия:**
- Удалить `import { computed } from 'vue'` (оба файла)

---

### Раунд 19: UI Components (Batch 4)
**Файлы:**
1. `src/components/ui/ProgressBar/index.vue`
2. `src/components/ui/Modal/index.vue`

**Действия:**
- Удалить `import { computed } from 'vue'` (ProgressBar)
- Удалить `import { computed, onMounted, onUnmounted } from 'vue'` (Modal)

---

### Раунд 20: Pages Components (Batch 1)
**Файлы:**
1. `src/components/pages/skills/SkillList/SkillList.vue`
2. `src/components/pages/skills/SkillCard/SkillCard.vue`

**Действия:**
- Удалить `import { ref, computed } from 'vue'` (SkillList)
- Удалить `import { computed } from 'vue'` (SkillCard)

---

### Раунд 21: Pages Components (Batch 2)
**Файлы:**
1. `src/components/pages/finance/FinanceActionList/FinanceActionList.vue`
2. `src/components/pages/finance/ExpenseList/ExpenseList.vue`

**Действия:**
- Удалить `import { computed, ref } from 'vue'` (FinanceActionList)
- Удалить `import { computed } from 'vue'` (ExpenseList)

---

### Раунд 22: Pages Components (Batch 3)
**Файлы:**
1. `src/components/pages/finance/BalancePanel/BalancePanel.vue`
2. `src/components/pages/events/EventModal/EventModal.vue`

**Действия:**
- Удалить `import { computed } from 'vue'` (BalancePanel)
- Удалить `import { computed, ref, onMounted } from 'vue'` (EventModal)

---

### Раунд 23: Pages Components (Batch 4)
**Файлы:**
1. `src/components/pages/events/EventCard/EventCard.vue`
2. `src/components/pages/dashboard/WorkButton/WorkButton.vue`

**Действия:**
- Удалить `import { computed } from 'vue'` (EventCard)
- Удалить `import { computed, ref } from 'vue'` (WorkButton)

---

### Раунд 24: Pages Components (Batch 5)
**Файлы:**
1. `src/components/pages/dashboard/StatsCard/StatsCard.vue`
2. `src/components/pages/dashboard/SkillsModal/SkillsModal.vue`

**Действия:**
- Удалить `import { computed } from 'vue'` (оба файла)

---

### Раунд 25: Pages Components (Batch 6)
**Файлы:**
1. `src/components/pages/dashboard/ProfileCard/ProfileCard.vue`
2. `src/components/pages/dashboard/ActivityLogCard/ActivityLogCard.vue`

**Действия:**
- Удалить `import { computed, ref } from 'vue'` (ProfileCard)
- Удалить `import { computed } from 'vue'` и `import { navigateTo } from '#imports'` (ActivityLogCard)

---

### Раунд 26: Pages Components (Batch 7)
**Файлы:**
1. `src/components/pages/career/WorkShiftPanel/WorkShiftPanel.vue`
2. `src/components/pages/career/CurrentJobPanel/CurrentJobPanel.vue`

**Действия:**
- Удалить `import { ref } from 'vue'` (WorkShiftPanel)
- Удалить `import { computed, ref } from 'vue'` (CurrentJobPanel)

---

### Раунд 27: Pages Components (Batch 8)
**Файлы:**
1. `src/components/pages/career/CareerTrack/CareerTrack.vue`
2. `src/components/pages/education/StudyModal/StudyModal.vue`

**Действия:**
- Удалить `import { computed, ref } from 'vue'` (CareerTrack)
- Удалить `import { ref, computed, watch } from 'vue'` (StudyModal)

---

### Раунд 28: Pages Components (Batch 9)
**Файлы:**
1. `src/components/pages/education/ProgramList/ProgramList.vue`
2. `src/components/pages/education/EducationLevel/EducationLevel.vue`

**Действия:**
- Удалить `import { computed } from 'vue'` и `import { useRouter } from '#imports'` (ProgramList)
- Удалить `import { ref, computed } from 'vue'` (EducationLevel)

---

### Раунд 29: Pages Components (Batch 10)
**Файлы:**
1. `src/components/pages/activity/ActivityLogList/ActivityLogList.vue`

**Действия:**
- Удалить `import { ref } from 'vue'`

---

### Раунд 30: Pages (Batch 1)
**Файлы:**
1. `src/pages/index.vue`
2. `src/pages/game/activity/index.vue`

**Действия:**
- Удалить `import { computed, ref } from 'vue'` и `import { navigateTo } from '#imports'` (index.vue)
- Удалить `import { ref } from 'vue'` и `import { definePageMeta } from '#imports'` (activity/index.vue)

---

### Раунд 31: Pages (Batch 2)
**Файлы:**
1. `src/pages/game/work/index.vue`
2. `src/pages/game/actions/index.vue`

**Действия:**
- Удалить `import { computed, ref } from 'vue'` и `import { definePageMeta } from '#imports'` (work/index.vue)
- Удалить `import { computed, ref } from 'vue'` и `import { definePageMeta } from '#imports'` (actions/index.vue)

---

### Раунд 32: Pages (Batch 3)
**Файлы:**
1. `src/pages/game/skills/index.vue`
2. `src/pages/game/index.vue`

**Действия:**
- Удалить `import { definePageMeta } from '#imports'` (оба файла)

---

### Раунд 33: Pages (Batch 4)
**Файлы:**
1. `src/pages/game/shop/index.vue`
2. `src/pages/game/finance/index.vue`

**Действия:**
- Удалить `import { ref, computed, watch } from 'vue'` и `import { definePageMeta, useRoute } from '#imports'` (shop/index.vue)
- Удалить `import { computed } from 'vue'` и `import { definePageMeta } from '#imports'` (finance/index.vue)

---

### Раунд 34: Pages (Batch 5)
**Файлы:**
1. `src/pages/game/selfdev/index.vue`
2. `src/pages/game/events/index.vue`

**Действия:**
- Удалить `import { definePageMeta, navigateTo } from '#imports'` (selfdev/index.vue)
- Удалить `import { ref, computed, onMounted } from 'vue'` и `import { useRouter, definePageMeta } from '#imports'` (events/index.vue)

---

### Раунд 35: Pages (Batch 6)
**Файлы:**
1. `src/pages/game/education/index.vue`
2. `src/pages/game/home/index.vue`

**Действия:**
- Удалить `import { ref, computed, watch } from 'vue'` и `import { definePageMeta, useRoute } from '#imports'` (education/index.vue)
- Удалить `import { computed } from 'vue'` и `import { definePageMeta } from '#imports'` (home/index.vue)

---

### Раунд 36: Global Components
**Файлы:**
1. `src/components/global/GameNav/GameNav.vue`
2. `src/components/game/StatBar.vue`

**Действия:**
- Удалить `import { computed } from 'vue'` и `import { navigateTo, useRoute } from '#imports'` (GameNav)
- Удалить `import { computed } from 'vue'` (StatBar)

---

### Раунд 37: Game Components
**Файлы:**
1. `src/components/game/NewbornWelcomeScreen/index.vue`
2. `src/components/game/ActionCard/ActionCard.vue`

**Действия:**
- Удалить `import { ref, computed, onMounted } from 'vue'` (NewbornWelcomeScreen)
- Удалить `import { computed } from 'vue'` (ActionCard)

---

### Раунд 38: Layout, Middleware, Plugins
**Файлы:**
1. `src/components/layout/GameLayout/GameLayout.vue`
2. `src/middleware/game-init.ts`

**Действия:**
- Удалить `import { useRouter } from '#imports'` (GameLayout)
- Удалить `import { defineNuxtRouteMiddleware, navigateTo, useNuxtApp } from '#imports'` (game-init.ts)

---

### Раунд 39: App & Plugin
**Файлы:**
1. `src/app.vue`
2. `src/plugins/auto-save.client.ts`

**Действия:**
- Удалить `import { computed, onMounted, onUnmounted, ref, watch } from 'vue'` и `import { navigateTo, useColorMode, useNuxtApp, useRoute } from '#imports'` (app.vue)
- Удалить `import { defineNuxtPlugin } from '#imports'` (auto-save.client.ts)

---

## Проверка после выполнения

### 1. Сборка проекта
```bash
npm run build
```

### 2. Запуск dev-сервера
```bash
npm run dev
```

### 3. Проверка типов
```bash
npx vue-tsc --noEmit
```

### 4. Проверка на оставшиеся избыточные импорты
```bash
grep -r "import.*from ['\"]vue['\"]" src/ --include="*.vue" --include="*.ts" --include="*.js"
grep -r "import.*from ['\"]pinia['\"]" src/ --include="*.vue" --include="*.ts" --include="*.js"
grep -r "import.*from ['\"]#imports['\"]" src/ --include="*.vue" --include="*.ts" --include="*.js"
```

## Итоговая статистика

- **Всего раундов:** 39
- **Всего файлов:** 76
- **Ожидаемое удаление строк импорта:** ~100-120 строк

## Примечания

1. **Важно:** После каждого раунда проверять, что проект собирается без ошибок
2. **Типы:** Если после удаления импорта TypeScript выдаёт ошибку типа, значит импорт был нужен (например, для type-only импортов)
3. **Тесты:** Запустить тесты после завершения всех изменений
4. **Git:** Рекомендуется делать коммит после каждых 5-10 раундов для возможности отката

## Риски

- **Низкий риск:** Composables, Stores, UI Components
- **Средний риск:** Pages Components, Pages
- **Высокий риск:** Layout, Middleware, Plugins, app.vue

Порядок выполнения от низкого к высокому риску минимизирует вероятность критических ошибок.

## Что делать, если после удаления импортов появляются ошибки

Если после удаления импортов появляются ошибки TypeScript "Не удается найти имя X", это может означать:

1. **VSCode не перезагрузил TypeScript сервер** — перезагрузите окно VSCode или выполните команду "TypeScript: Restart TS Server" (Ctrl+Shift+P → "Restart TS Server")

2. **Файл `.nuxt/imports.d.ts` не был обновлён** — убедитесь, что Nuxt dev server запущен (`npm run dev`)

3. **Нарушено правило автоимпортов** — если в файле есть явный импорт из Vue, то ВСЕ используемые функции из Vue должны быть явно импортированы. Либо удалите ВСЕ импорты из Vue.

**Пример правильного подхода:**

```typescript
// ❌ НЕПРАВИЛЬНО - частичное удаление импортов
import { ref } from 'vue'
const message = ref('')
const data = computed(() => ...) // ОШИБКА: computed не импортирован!

// ✅ ПРАВИЛЬНО - вариант 1: удалить все импорты из vue
const message = ref('')
const data = computed(() => ...)

// ✅ ПРАВИЛЬНО - вариант 2: импортировать все используемые функции
import { ref, computed } from 'vue'
const message = ref('')
const data = computed(() => ...)
```
