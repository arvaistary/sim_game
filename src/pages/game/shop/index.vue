<template>
  <GameLayout title="Магазин">
    <div class="shop-page">
      <!-- Табы-переключатели категорий -->
      <Tabs
        v-model="activeTab"
        :items="tabItems"
      />

      <!-- Контент: Еда -->
      <template v-if="activeTab === 'food'">
        <ActionCardList
          :actions="sortedFoodActions"
          :empty-text="actionsEmptyHint"
          :is-disabled="isDisabled"
          :get-disabled-reason="getDisabledReason"
          button-label="Купить"
          :show-price-when-zero="true"
          :use-format-effect="true"
          @execute="executeAction"
        />
      </template>

      <!-- Контент: Обучение -->
      <template v-if="activeTab === 'learning'">
        <ActionCardList
          :actions="sortedLearningActions"
          :empty-text="actionsEmptyHint"
          :is-disabled="isDisabled"
          :get-disabled-reason="getDisabledReason"
          button-label="Купить"
          :show-price-when-zero="true"
          :use-format-effect="true"
          @execute="executeAction"
        />
      </template>

      <!-- Контент: Вещи -->
      <template v-if="activeTab === 'things'">
        <ActionCardList
          :actions="sortedThingsActions"
          :empty-text="actionsEmptyHint"
          :is-disabled="isDisabled"
          :get-disabled-reason="getDisabledReason"
          button-label="Купить"
          :show-price-when-zero="true"
          :use-format-effect="true"
          @execute="executeAction"
        />
      </template>

      <!-- Контент: Дом -->
      <template v-if="activeTab === 'home'">
        <ActionCardList
          :actions="sortedHomeActions"
          :empty-text="actionsEmptyHint"
          :is-disabled="isDisabled"
          :get-disabled-reason="getDisabledReason"
          button-label="Купить"
          :show-price-when-zero="true"
          :use-format-effect="true"
          @execute="executeAction"
        />
      </template>
    </div>
  </GameLayout>
</template>

<script setup lang="ts">
import './shop.scss'
import { getActionById } from '@/domain/balance/actions'
import type { BalanceAction } from '@/domain/balance/actions'
import { FOOD_ACTION_IDS, LEARNING_ACTION_IDS, THINGS_ACTION_IDS, HOME_ACTION_IDS } from '@/config/shop-tab-groups'

definePageMeta({ middleware: 'game-init' })

const timeStore = useTimeStore()

const walletStore = useWalletStore()

const tabs = [
  { id: 'food', icon: '🍔', title: 'Еда', shortDesc: 'Продукты, напитки и доставка' },
  { id: 'learning', icon: '📚', title: 'Обучение', shortDesc: 'Книги, курсы и техника для учёбы' },
  { id: 'things', icon: '👕', title: 'Вещи', shortDesc: 'Одежда, подарки и личные покупки' },
  { id: 'home', icon: '🏠', title: 'Дом', shortDesc: 'Мебель, техника и уют' },
] as const

// Map tabs to Tabs.vue API
const tabItems = computed(() => tabs.map(t => ({
  id: t.id,
  icon: t.icon,
  label: t.title,
  subtitle: t.shortDesc,
})))

const route = useRoute()
const availableTabIds = tabs.map(tab => tab.id)

function normalizeTab(rawValue: unknown): string {
  const value = typeof rawValue === 'string' ? rawValue : ''
  return availableTabIds.includes(value as (typeof tabs)[number]['id']) ? value : 'food'
}

const activeTab = ref<string>(normalizeTab(route.query.tab))

watch(
  () => route.query.tab,
  (nextTab) => {
    activeTab.value = normalizeTab(nextTab)
  },
)

const { getActionsByCategory, canExecute, executeAction, actionsEmptyHint } = useActions()

const allShopActions = getActionsByCategory('shop')

/** Сортировка: доступные действия первыми */
function isDisabled(action: BalanceAction): boolean {
  return !canExecute(action.id)
}

function sortByAvailability(actions: BalanceAction[]): BalanceAction[] {
  return [...actions].sort((a, b) => {
    const aOk = canExecute(a.id) ? 0 : 1
    const bOk = canExecute(b.id) ? 0 : 1
    return aOk - bOk
  })
}

/** Получить причину недоступности действия */
function getDisabledReason(action: BalanceAction): string {
  const result = getActionById(action.id)
  if (!result) return 'Действие не найдено'
  if (walletStore.money < result.price) return 'Недостаточно денег'
  if (timeStore.weekHoursRemaining < result.hourCost) return 'Недостаточно времени'
  return 'Действие недоступно'
}

// Еда
const foodActions = computed(() => {
  void timeStore.totalHours
  return allShopActions.filter((action: BalanceAction) => FOOD_ACTION_IDS.has(action.id))
})

// Обучение
const learningActions = computed(() => {
  void timeStore.totalHours
  return allShopActions.filter((action: BalanceAction) => LEARNING_ACTION_IDS.has(action.id))
})

// Вещи
const thingsActions = computed(() => {
  void timeStore.totalHours
  return allShopActions.filter((action: BalanceAction) => THINGS_ACTION_IDS.has(action.id))
})

// Дом
const homeActions = computed(() => {
  void timeStore.totalHours
  return allShopActions.filter((action: BalanceAction) => HOME_ACTION_IDS.has(action.id))
})

const sortedFoodActions = computed(() => sortByAvailability(foodActions.value))
const sortedLearningActions = computed(() => sortByAvailability(learningActions.value))
const sortedThingsActions = computed(() => sortByAvailability(thingsActions.value))
const sortedHomeActions = computed(() => sortByAvailability(homeActions.value))
</script>
