<template>
  <GameLayout title="Действия">
    <ActionTabs
      v-model:active-category="activeCategory"
      :categories="ACTION_CATEGORIES"
    />
    <ActionCardList
      :actions="sortedActions"
      :empty-text="actionsEmptyHint"
      :is-disabled="isActionDisabled"
      :get-disabled-reason="getDisabledReason"
      @execute="executeAction"
    />
  </GameLayout>
</template>

<script setup lang="ts">
import { type BalanceAction, ACTION_CATEGORIES } from '@domain/balance/actions'
import type { ActionCategory } from '@domain/balance/types'
import type { CanExecuteActionResult } from '@stores/game-store'

definePageMeta({ middleware: 'game-init' })

const store = useGameStore()

const { getActionsByCategory, canExecute, executeAction, actionsEmptyHint } = useActions()

const activeCategory = ref<ActionCategory>('fun')

const actions = computed<BalanceAction[]>(() => getActionsByCategory(activeCategory.value))

const sortedActions = computed<BalanceAction[]>(() => {
  void store.worldTick

  return [...actions.value].sort((a: BalanceAction, b: BalanceAction) => Number(isActionDisabled(a)) - Number(isActionDisabled(b)))
})

function isActionDisabled(action: BalanceAction): boolean {
  return !canExecute(action.id)
}

function getDisabledReason(action: BalanceAction): string {
  const result: CanExecuteActionResult = store.canExecuteAction(action.id)

  return result.reason ?? 'Действие недоступно'
}
</script>
