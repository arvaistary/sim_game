<template>
  <GameLayout title="Действия">
    <Tabs
      v-model="activeCategory"
      :items="ACTION_CATEGORIES"
    />
    <div class="action-filters rounded-panel">
      <div class="action-filters__field">
        <span>Восполняет ресурс</span>
        <DropdownSelect v-model="activeStat" :options="resourceOptions" />
      </div>
      <div class="action-filters__field action-filters__field--sort">
        <span>Сортировка</span>
        <DropdownSelect v-model="sortMode" :options="sortOptions" />
      </div>
    </div>
    <p
      v-if="activeStat !== 'all'"
      class="action-filters__hint"
    >Показываем действия из всех категорий, которые восполняют выбранный ресурс.</p>
    <ActionCardList
      :actions="sortedActions"
      :empty-text="emptyText"
      :is-disabled="(a: BalanceAction) => !canExecute(a.id)"
      :get-disabled-reason="getDisabledReason"
      @execute="executeAction"
    />
  </GameLayout>
</template>

<script setup lang="ts">
import type { ComputedRef } from 'vue'
import { ACTION_CATEGORIES } from '@/config/action-categories'
import type { ActionCategory as ActionCategoryId } from '@/domain/balance/types'
import type { BalanceAction } from '@/domain/balance/actions'
import type { CanExecuteActionResult } from '@/stores/game.store.types'

definePageMeta({ middleware: 'game-init' })

const store = useGameStore()
const actionsStore = useActionsStore()

const { getActionsByCategory, getAllActions, canExecute, executeAction, actionsEmptyHint } = useActions()

const activeCategory = ref<string>(ACTION_CATEGORIES[0]?.id ?? 'fun')
const activeStat = ref<StatFilterId>('all')
const sortMode = ref<SortMode>('usage')

type StatFilterId = 'all' | 'energy' | 'health' | 'mood' | 'stress' | 'hunger' | 'physical'
type SortMode = 'usage' | 'price' | 'parameter'

const STAT_FILTERS: Array<{ id: Exclude<StatFilterId, 'all'>; label: string }> = [
  { id: 'energy', label: 'Энергия' },
  { id: 'health', label: 'Здоровье' },
  { id: 'mood', label: 'Настроение' },
  { id: 'stress', label: 'Стресс' },
  { id: 'hunger', label: 'Голод' },
  { id: 'physical', label: 'Форма' },
]

const resourceOptions = [
  { value: 'all', label: 'Все ресурсы' },
  ...STAT_FILTERS.map((item) => ({ value: item.id, label: item.label })),
]

const sortOptions = [
  { value: 'usage', label: 'По использованию' },
  { value: 'price', label: 'По цене' },
  { value: 'parameter', label: 'По параметру' },
]

const actions: ComputedRef<BalanceAction[]> = computed(() => {
  const categoryActions = activeStat.value === 'all'
    ? getActionsByCategory(activeCategory.value as ActionCategoryId)
    : getAllActions()

  if (activeStat.value === 'all') return categoryActions

  return categoryActions.filter((action) => {
    const value = action.statChanges?.[activeStat.value]
    if (typeof value !== 'number') return false
    return value > 0
  })
})

const emptyText: ComputedRef<string> = computed(() => activeStat.value === 'all'
  ? actionsEmptyHint.value
  : 'Нет действий, восполняющих выбранный ресурс.')

function getDisabledReason(action: BalanceAction): string {
  const result: CanExecuteActionResult = store.canExecuteAction(action.id)
  return result.reason ?? 'Действие недоступно'
}

const sortedActions: ComputedRef<BalanceAction[]> = computed(() => {
  void store.worldTick
  const originalOrder = new Map(actions.value.map((action, index) => [action.id, index]))
  return [...actions.value].sort((a, b) => {
    if (sortMode.value === 'usage') {
      const usageA = actionsStore.actionUsage[a.id] ?? { count: 0, lastUsedAt: 0 }
      const usageB = actionsStore.actionUsage[b.id] ?? { count: 0, lastUsedAt: 0 }
      if (usageA.count !== usageB.count) return usageB.count - usageA.count
      if (usageA.lastUsedAt !== usageB.lastUsedAt) return usageB.lastUsedAt - usageA.lastUsedAt
    } else if (sortMode.value === 'parameter') {
      const parameterA = getPositiveEffect(a)
      const parameterB = getPositiveEffect(b)
      if (parameterA !== parameterB) return parameterB - parameterA
    } else if (a.price !== b.price) {
      return a.price - b.price
    }

    return (originalOrder.get(a.id) ?? 0) - (originalOrder.get(b.id) ?? 0)
  })
})

function getPositiveEffect(action: BalanceAction): number {
  if (activeStat.value !== 'all') return action.statChanges?.[activeStat.value] ?? 0
  return Math.max(0, ...Object.values(action.statChanges ?? {}).filter((value): value is number => typeof value === 'number'))
}
</script>

<style scoped lang="scss">
:deep(.dashboard-shell__content) {
  gap: $space-3;
}

.action-filters {
  display: flex;
  flex-wrap: wrap;
  gap: $space-4;
  align-items: flex-end;
  margin: $space-3 0 $space-2;
  padding: $space-3;
}

.action-filters__field {
  display: flex;
  flex: 0 1 260px;
  flex-direction: column;
  gap: $space-1;
  color: var(--color-text-secondary);
  font-size: $font-size-sm;
}

.action-filters__hint {
  margin: 0 0 $space-3;
  color: var(--color-text-secondary);
  font-size: $font-size-xs;
}

@include mobile {
  .action-filters__field {
    flex-basis: 100%;
  }
}
</style>
