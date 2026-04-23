<template>
  <GameLayout title="Магазин">
    <div class="shop-page">
      <!-- Табы-переключатели категорий -->
      <div class="shop-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="shop-tab"
          :class="{ 'shop-tab--active': activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <span class="shop-tab__icon">{{ tab.icon }}</span>
          <span class="shop-tab__content">
            <span class="shop-tab__title">{{ tab.title }}</span>
            <span class="shop-tab__desc">{{ tab.shortDesc }}</span>
          </span>
        </button>
      </div>

      <!-- Контент: Еда -->
      <template v-if="activeTab === 'food'">
        <ActionCardList
          :actions="sortedFoodActions"
          :empty-text="actionsEmptyHint"
          :is-disabled="(a: any) => !canExecute(a.id)"
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
          :is-disabled="(a: any) => !canExecute(a.id)"
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
          :is-disabled="(a: any) => !canExecute(a.id)"
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
          :is-disabled="(a: any) => !canExecute(a.id)"
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
import { ref, computed, watch } from 'vue'
import { definePageMeta, useRoute } from '#imports'
import { useActions } from '@/composables/useActions'
import { useTimeStore } from '@/stores/time-store'
import { useWalletStore } from '@/stores/wallet-store'
import { getActionById } from '@/domain/balance/actions'
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

const allShopActions = getActionsByCategory('shop' as any)

/** Сортировка: доступные действия первыми */
function sortByAvailability(actions: any[]): any[] {
  return [...actions].sort((a, b) => {
    const aOk = canExecute(a.id) ? 0 : 1
    const bOk = canExecute(b.id) ? 0 : 1
    return aOk - bOk
  })
}

/** Получить причину недоступности действия */
function getDisabledReason(action: any): string {
  const result = getActionById(action.id)
  if (!result) return 'Действие не найдено'
  if (walletStore.money < result.price) return 'Недостаточно денег'
  if (timeStore.weekHoursRemaining < result.hourCost) return 'Недостаточно времени'
  return 'Действие недоступно'
}

// Еда
const foodActions = computed(() => {
  void timeStore.totalHours
  return allShopActions.filter((a: any) => FOOD_ACTION_IDS.has(a.id))
})

// Обучение
const learningActions = computed(() => {
  void timeStore.totalHours
  return allShopActions.filter((a: any) => LEARNING_ACTION_IDS.has(a.id))
})

// Вещи
const thingsActions = computed(() => {
  void timeStore.totalHours
  return allShopActions.filter((a: any) => THINGS_ACTION_IDS.has(a.id))
})

// Дом
const homeActions = computed(() => {
  void timeStore.totalHours
  return allShopActions.filter((a: any) => HOME_ACTION_IDS.has(a.id))
})

const sortedFoodActions = computed(() => sortByAvailability(foodActions.value))
const sortedLearningActions = computed(() => sortByAvailability(learningActions.value))
const sortedThingsActions = computed(() => sortByAvailability(thingsActions.value))
const sortedHomeActions = computed(() => sortByAvailability(homeActions.value))
</script>

<style scoped lang="scss">
@use '@/assets/scss/mixins.scss' as *;

.shop-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.shop-tabs {
  display: flex;
  gap: $space-2;
}

.shop-tab {
  flex: 1;
  display: flex;
  align-items: flex-start;
  gap: $space-2;
  padding: $space-3 $space-3;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl, 16px);
  background: var(--color-bg-card);
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-card);
  text-align: left;

  &:hover {
    border-color: var(--color-accent);
    background: var(--color-accent-soft);
  }

  &--active {
    background: var(--color-accent);
    border-color: var(--color-accent);

    .shop-tab__title {
      color: var(--color-text-on-accent);
    }

    .shop-tab__desc {
      color: rgba(255, 255, 255, 0.8);
    }

    .shop-tab__icon {
      filter: brightness(0) invert(1);
    }

    &:hover {
      background: var(--color-accent);
      border-color: var(--color-accent);
    }
  }
}

.shop-tab__icon {
  font-size: $font-size-lg;
  line-height: 1;
  flex-shrink: 0;
  margin-top: 2px;
}

.shop-tab__content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.shop-tab__title {
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: var(--color-text-primary);
  line-height: 1.2;
}

.shop-tab__desc {
  font-size: 11px;
  color: var(--color-text-secondary);
  line-height: 1.3;
}

// Mobile: show only icons
@include mobile {
  .shop-tab {
    justify-content: center;
    align-items: center;
    padding: $space-3 $space-2;
  }

  .shop-tab__content {
    display: none;
  }

  .shop-tab__icon {
    margin-top: 0;
    font-size: $font-size-xl;
  }
}
</style>
