# План: Возрастные ограничения UI

> Дата создания: 2026-04-15
> Дата проверки актуальности: 15.04.2026
> Статус: **📋 Черновик / Планируется**
> Цель: Скрыть недоступные по возрасту элементы UI, обеспечить реалистичное разграничение контента для детей/подростков/взрослых.

---

> ⚠️ Примечание: На текущий момент система возрастных ограничений UI **не реализована** в кодовой базе. Документ является техническим планом для будущей реализации.
> ℹ️ Примечание: Проект был мигрирован на Nuxt 4 и архитектуру ECS после создания этого документа. Некоторые технические детали могут отличаться.

---

## 📋 Проблема

Система `useAgeRestrictions` уже содержит правила `hiddenTabs` для каждой возрастной группы, но **ни один UI-компонент их не использует**. Результат:

- Младенец (0-3 года) видит вкладку «Карьера», «Финансы», «Недвижимость»
- Подросток (13-15 лет) видит «Ипотеку»
- Дошкольник (4-7 лет) видит «Магазин» со взрослыми товарами
- Навигация показывает **все** вкладки без фильтрации
- Страницы не имеют middleware на проверку возраста
- Действия (actions) на страницах не фильтруются по возрасту

---

## 🎯 Принцип разграничения «здравый реализм»

| Возраст | Группа | Что ДОСТУПНО | Что СКРЫТО |
|---------|--------|-------------|------------|
| 0-3 | Младенец | Здоровье, развитие (базовое), обучение (игровое), хобби, развлечения (детские) | Финансы, карьера, недвижимость, машина, соц. жизнь, магазин (взрослый), дом |
| 4-7 | Дошкольник | + Обучение, хобби, здоровье, развлечения (детские), навыки | Финансы, карьера, недвижимость, машина, магазин (взрослый), дом |
| 8-12 | Младший школьник | + Навыки, обучение, хобби, здоровье, развлечения, развитие | Финансы, недвижимость, машина, магазин (частично), дом |
| 13-15 | Подросток | + Соц. жизнь, частичный магазин | Недвижимость, ипотека, машина, финансы (частично) |
| 16-18 | Молодёжь | **Всё кроме ипотеки** | Ипотека |
| 18+ | Взрослый | **Всё** | — |

---

## 🏗️ Этапы реализации

### Этап 1 — Интеграция `useAgeRestrictions` в навигацию

**Файл**: `src/components/global/GameNav/GameNav.vue`
**Задача**: Фильтровать `navItems` через `isTabVisible()` из `useAgeRestrictions`
**Что сделать**:

- Импортировать `useAgeRestrictions`
- Добавить computed `visibleNavItems` — отфильтрованные `NAV_ITEMS`
- В шаблоне `v-for` использовать `visibleNavItems` вместо `navItems`
- Для скрытых вкладок — **не показывать вообще** (без placeholder'ов)

**Затрагиваемые файлы**:

- `src/components/global/GameNav/GameNav.vue`

---

### Этап 2 — Route guard middleware для защищённых страниц

**Файл**: `src/middleware/age-guard.ts` (новый)
**Задача**: Перенаправлять на `/game` если пользователь пытается зайти на страницу недоступную по возрасту
**Что сделать**:

- Создать middleware `age-guard`
- Маппинг route → required age tab:
  - `/game/finance` → `finance`
  - `/game/career` → `career`
  - `/game/home` → `home`
  - `/game/social` → `social`
  - `/game/shop` → `shop`
  - и т.д.
- Если `isTabVisible(tabId) === false` → redirect на `/game` + toast «Ещё не время...»

**Затрагиваемые файлы**:

- `src/middleware/age-guard.ts` (новый)
- Все `src/pages/game/*/index.vue` — добавить `middleware: ['game-init', 'age-guard']`

---

### Этап 3 — Фильтрация действий (actions) на страницах по возрасту

**Задача**: Действия на страницах должны фильтроваться через `filterActionsByAge()`
**Что сделать**:

- В каждой странице с `ActionCardList` обернуть `actions` через `filterActionsByAge()`
- Использовать композабл `useAgeRestrictions` в страницах:
  - `/game/shop/index.vue`
  - `/game/fun/index.vue`
  - `/game/education/index.vue`
  - `/game/hobby/index.vue`
  - `/game/health/index.vue`
  - `/game/selfdev/index.vue`
  - `/game/activity/index.vue`
  - `/game/finance/index.vue` (если уже доступна)
  - `/game/home/index.vue` (если уже доступна)

**Затрагиваемые файлы**:

- `src/pages/game/shop/index.vue`
- `src/pages/game/fun/index.vue`
- `src/pages/game/education/index.vue`
- `src/pages/game/hobby/index.vue`
- `src/pages/game/health/index.vue`
- `src/pages/game/selfdev/index.vue`
- `src/pages/game/activity/index.vue`
- `src/pages/game/finance/index.vue`
- `src/pages/game/home/index.vue`

---

### Этап 4 — Скрытие статистики по возрасту

**Файл**: `src/components/pages/dashboard/StatsCard/StatsCard.vue`
**Задача**: Скрыть статы которые недоступны по возрасту (`hiddenStats`)
**Что сделать**:

- Использовать `isStatVisible()` из `useAgeRestrictions`
- Скрыть: `money`, `salary`, `debt`, `investments` для младших возрастов

**Затрагиваемые файлы**:

- `src/components/pages/dashboard/StatsCard/StatsCard.vue`

---

### Этап 5 — Скрытие кнопки «Работа» на главной

**Файл**: `src/components/pages/dashboard/WorkButton/WorkButton.vue`
**Задача**: Кнопка «Работа» не должна быть видна детям до 14 лет
**Что сделать**:

- Обернуть в `v-if="isTabVisible('career')"`

**Затрагиваемые файлы**:

- `src/components/pages/dashboard/WorkButton/WorkButton.vue`
- `src/pages/game/index.vue` — возможно `WorkButton` нужно убрать из шаблона

---

### Этап 6 — Скрытие HomePreview для малышей

**Файл**: `src/components/pages/dashboard/HomePreview/HomePreview.vue`
**Задача**: Превью недвижимости скрыто для возрастов где `home` недоступен
**Что сделать**:

- Обернуть в `v-if="isTabVisible('home')"`

**Затрагиваемые файлы**:

- `src/components/pages/dashboard/HomePreview/HomePreview.vue`
- `src/pages/game/index.vue`

---

### Этап 7 — Уведомления о разблокировке

**Файл**: `src/composables/useAgeRestrictions/index.ts`
**Задача**: При достижении нового возраста показывать toast о разблокировке вкладок
**Что сделать**:

- `checkUnlocks()` уже реализован, но **никогда не вызывается** — нужно вызвать его в store при изменении возраста
- Интегрировать вызов `checkUnlocks()` в `game.store.ts` при обновлении `age`

**Затрагиваемые файлы**:

- `src/stores/game.store.ts`
- `src/composables/useAgeRestrictions/index.ts` — возможно потребуется рефакторинг для singleton state

---

### Этап 8 — Визуальная индикация «скоро будет доступно»

**Файл**: `src/components/global/GameNav/GameNav.vue`
**Задача**: Показать ребёнку что некоторые вещи «ещё впереди» — motivational lock
**Что сделать**:

- Опционально: показывать заблокированные вкладки с иконкой 🔒 и подсказкой «Доступно в X лет»
- При клике — tooltip «Это станет доступно когда ты подрастёшь»
- **Это опциональный этап** — можно полностью скрыть (Этап 1)

---

## 📁 Итоговый список изменяемых файлов

| Файл | Этап | Тип изменения |
|------|------|---------------|
| `src/composables/useAgeRestrictions/index.ts` | 7 | Возможно singleton state reset |
| `src/components/global/GameNav/GameNav.vue` | 1, 8 | Фильтрация навигации + опционально lock UI |
| `src/components/pages/dashboard/WorkButton/WorkButton.vue` | 5 | Скрытие кнопки работы |
| `src/middleware/age-guard.ts` | 2 | **Новый файл** — middleware защиты страниц |
| `src/pages/game/*/index.vue` (9 файлов) | 2, 3 | Добавить middleware + фильтрация actions |
| `src/components/pages/dashboard/StatsCard/StatsCard.vue` | 4 | Скрытие статов |
| `src/components/pages/dashboard/HomePreview/HomePreview.vue` | 6 | Скрытие превью дома |
| `src/pages/game/index.vue` | 5, 6 | Убрать обёртки для скрытых компонентов |
| `src/stores/game.store.ts` | 7 | Вызов `checkUnlocks()` при смене возраста |

---

## 🔍 Детализация по каждому этапу

### Этап 1 — GameNav фильтрация

```vue
<!-- Было -->
<button v-for="item in navItems" ...>

<!-- Стало -->
<button v-for="item in visibleNavItems" ...>
```

```ts
const { isTabVisible } = useAgeRestrictions()
const visibleNavItems = computed(() =>
  navItems.filter(item => isTabVisible(item.id))
)
```

### Этап 2 — age-guard middleware

```ts
// src/middleware/age-guard.ts
const ROUTE_TAB_MAP: Record<string, string> = {
  '/game/finance': 'finance',
  '/game/career': 'career',
  '/game/home': 'home',
  '/game/social': 'social',
  '/game/shop': 'shop',
  // ...
}

export default defineNuxtRouteMiddleware((to) => {
  const { isTabVisible } = useAgeRestrictions()
  const tabId = ROUTE_TAB_MAP[to.path]
  if (tabId && !isTabVisible(tabId)) {
    return navigateTo('/game')
  }
})
```

### Этап 3 — Фильтрация actions

```vue
<!-- Было -->
const actions = getActionsByCategory('shop')

<!-- Стало -->
const { filterActionsByAge } = useAgeRestrictions()
const actions = computed(() =>
  filterActionsByAge(getActionsByCategory('shop'))
)
```

---

## ⚠️ Риски и заметки

1. **`useAgeRestrictions` использует singleton state** (`lastKnownAge`, `unlockedTabsCache`) — при SSR это проблема. Но игра клиентская, так что ок.
2. **`checkUnlocks()` нужно вызывать** при каждом тике времени когда возраст меняется. Сейчас он не вызывается нигде.
3. **Действия (BalanceAction) могут иметь поле `ageGroup`** — но нужно проверить что все действия его имеют или правильно обрабатывают отсутствие.
4. **`shop` нет в `hiddenTabs`** ни для одной группы — нужно решить: показывать ли магазин малышам? Скорее всего нет — добавить в `hiddenTabs` для INFANT/TODDLER.
5. **`hobby`, `health`, `selfdev`, `education`, `fun`** — доступны всем возрастам, но **действия** внутри них должны фильтроваться (например «инвестиции» в fun не для ребёнка).

---

## 📋 Порядок выполнения

1. Этап 1 — Навигация (самое видимое)
2. Этап 2 — Route guard (защита от прямого захода)
3. Этап 3 — Фильтрация actions (контент страниц)
4. Этап 4 — Скрытие статистики
5. Этап 5 — Скрытие кнопки «Работа»
6. Этап 6 — Скрытие HomePreview
7. Этап 7 — Интеграция `checkUnlocks()` в store
8. Этап 8 — Lock UI с подсказками

---

## ✅ Критерии приёмки

- [ ] Младенец (0-3) видит только: здоровье, развитие, хобби, развлечения, навыки
- [ ] Дошкольник (4-7) видит: + обучение
- [ ] Младший школьник (8-12) видит: + всё кроме финансов/недвижимости/машины
- [ ] Подросток (13-15) видит: + соц. жизнь, частичный магазин
- [ ] Молодёжь (16-18) видит: всё кроме ипотеки
- [ ] Взрослый (18+) видит: всё
- [ ] Прямой заход по URL на защищённую страницу → редирект на `/game`
- [ ] При разблокировке вкладки показывается toast-уведомление
- [ ] Действия на страницах отфильтрованы по возрасту
- [ ] Статы (`money`, `salary`) скрыты для малышей
- [ ] Кнопка «Работа» скрыта до 14 лет
- [ ] Превью «Недвижимость» скрыто до доступа к `home`

---

> Последнее обновление: 15.04.2026
