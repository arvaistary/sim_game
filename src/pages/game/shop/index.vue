<template>
  <GameLayout title="Магазин">
    <div class="shop-page">
      <!-- Табы-переключатели категорий -->
      <div class="shop-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="{ 'shop-tab--active': activeTab === tab.id }"
          @click="activeTab = tab.id"
          class="shop-tab"
        >
          <span class="shop-tab__icon">
            {{ tab.icon }}
          </span>
          <span class="shop-tab__content">
            <span class="shop-tab__title">
              {{ tab.title }}
            </span>
            <span class="shop-tab__desc">
              {{ tab.shortDesc }}
            </span>
          </span>
        </button>
      </div>

      <!-- Контент: Еда -->
      <template v-if="activeTab === 'food'">
        <ActionCardList
          :actions="sortedFoodActions"
          :empty-text="actionsEmptyHint"
          :is-disabled="isActionDisabled"
          :get-disabled-reason="getDisabledReason"
          :show-price-when-zero="true"
          :use-format-effect="true"
          @execute="executeAction"
          button-label="Купить"
        />
      </template>

      <!-- Контент: Обучение -->
      <template v-if="activeTab === 'learning'">
        <ActionCardList
          :actions="sortedLearningActions"
          :empty-text="actionsEmptyHint"
          :is-disabled="isActionDisabled"
          :get-disabled-reason="getDisabledReason"
          :show-price-when-zero="true"
          :use-format-effect="true"
          @execute="executeAction"
          button-label="Купить"
        />
      </template>

      <!-- Контент: Вещи -->
      <template v-if="activeTab === 'things'">
        <ActionCardList
          :actions="sortedThingsActions"
          :empty-text="actionsEmptyHint"
          :is-disabled="isActionDisabled"
          :get-disabled-reason="getDisabledReason"
          :show-price-when-zero="true"
          :use-format-effect="true"
          @execute="executeAction"
          button-label="Купить"
        />
      </template>

      <!-- Контент: Дом -->
      <template v-if="activeTab === 'home'">
        <ActionCardList
          :actions="sortedHomeActions"
          :empty-text="actionsEmptyHint"
          :is-disabled="isActionDisabled"
          :get-disabled-reason="getDisabledReason"
          :show-price-when-zero="true"
          :use-format-effect="true"
          @execute="executeAction"
          button-label="Купить"
        />
      </template>
    </div>
  </GameLayout>
</template>

<script setup lang="ts">
import './index.scss'

import type { BalanceAction } from '@domain/balance/actions'
import { FOOD_ACTION_IDS, LEARNING_ACTION_IDS, THINGS_ACTION_IDS, HOME_ACTION_IDS } from '@constants/shop-tab-groups'
import { tabs } from './index.constants'

definePageMeta({ middleware: 'game-init' })

const route = useRoute()

const timeStore = useTimeStore()

const { getActionsByCategory, canExecute, executeAction, getCanExecuteReason, actionsEmptyHint } = useActions()

const availableTabIds: string[] = tabs.map(tab => tab.id)
const allShopActions: BalanceAction[] = getActionsByCategory('shop')

const activeTab = ref<string>(normalizeTab(route.query.tab))

// Еда
const foodActions = computed<BalanceAction[]>(() => {
  void timeStore.totalHours

  return allShopActions.filter((a: BalanceAction) => FOOD_ACTION_IDS.has(a.id))
})

// Обучение
const learningActions = computed<BalanceAction[]>(() => {
  void timeStore.totalHours

  return allShopActions.filter((a: BalanceAction) => LEARNING_ACTION_IDS.has(a.id))
})

// Вещи
const thingsActions = computed<BalanceAction[]>(() => {
  void timeStore.totalHours

  return allShopActions.filter((a: BalanceAction) => THINGS_ACTION_IDS.has(a.id))
})

// Дом
const homeActions = computed<BalanceAction[]>(() => {
  void timeStore.totalHours

  return allShopActions.filter((a: BalanceAction) => HOME_ACTION_IDS.has(a.id))
})

const sortedFoodActions = computed<BalanceAction[]>(() => sortByAvailability(foodActions.value))
const sortedLearningActions = computed<BalanceAction[]>(() => sortByAvailability(learningActions.value))
const sortedThingsActions = computed<BalanceAction[]>(() => sortByAvailability(thingsActions.value))
const sortedHomeActions = computed<BalanceAction[]>(() => sortByAvailability(homeActions.value))

function normalizeTab(rawValue: unknown): string {
  const value: string = typeof rawValue === 'string' ? rawValue : ''

  return availableTabIds.includes(value as (typeof tabs)[number]['id']) ? value : 'food'
}

function sortByAvailability(actions: BalanceAction[]): BalanceAction[] {
  return [...actions].sort((a: BalanceAction, b: BalanceAction) => {
    const aOk: number = canExecute(a.id) ? 0 : 1
    const bOk: number = canExecute(b.id) ? 0 : 1

    return aOk - bOk
  })
}

function isActionDisabled(action: BalanceAction): boolean {
  return !canExecute(action.id)
}

function getDisabledReason(action: BalanceAction): string {
  return getCanExecuteReason(action.id) ?? 'Действие недоступно'
}

watch(
  () => route.query.tab,
  (nextTab) => {
    activeTab.value = normalizeTab(nextTab)
  },
)
</script>
