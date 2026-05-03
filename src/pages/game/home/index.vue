<template>
  <GameLayout title="Дом">
    <SectionHeader
      title="Дом"
      subtitle="Действия для обустройства дома и комфорта"
    />
    <ActionCardList
      :actions="sortedActions"
      :empty-text="actionsEmptyHint"
      :is-disabled="isActionDisabled"
      :get-disabled-reason="getDisabledReason"
      :show-price-when-zero="true"
      :use-format-effect="true"
      @execute="executeAction"
      button-label="Применить"
    />
  </GameLayout>
</template>

<script setup lang="ts">
import type { BalanceAction } from '@domain/balance/actions'

definePageMeta({ middleware: 'game-init' })

const timeStore = useTimeStore()

const { getActionsByCategory, canExecute, executeAction, getCanExecuteReason, actionsEmptyHint } = useActions()

const actions: BalanceAction[] = getActionsByCategory('home')

const sortedActions = computed<BalanceAction[]>(() => {
  void timeStore.totalHours

  return [...actions].sort((a: BalanceAction, b: BalanceAction) => (canExecute(a.id) ? 0 : 1) - (canExecute(b.id) ? 0 : 1))
})

function isActionDisabled(action: BalanceAction): boolean {
  return !canExecute(action.id)
}

function getDisabledReason(action: BalanceAction): string {
  return getCanExecuteReason(action.id) ?? 'Действие недоступно'
}
</script>
