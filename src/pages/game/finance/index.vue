<template>
  <GameLayout title="Финансы">
    <div class="finance-page">
      <BalancePanel />
      <ExpenseList />
      <SectionHeader
        title="Финансовые действия"
        subtitle="Инвестиции, сбережения и управление деньгами"
      />
      <ActionCardList
        :actions="sortedActions"
        :empty-text="actionsEmptyHint"
        :is-disabled="isActionDisabled"
        :get-disabled-reason="getDisabledReason"
        :show-price-when-zero="true"
        @execute="executeAction"
      />
    </div>
  </GameLayout>
</template>

<script setup lang="ts">
import './index.scss'

import type { BalanceAction } from '@domain/balance/actions'

definePageMeta({ middleware: 'game-init' })

const { getActionsByCategory, canExecute, executeAction, getCanExecuteReason, actionsEmptyHint } = useActions()

const actions: BalanceAction[] = getActionsByCategory('finance')

const sortedActions = computed<BalanceAction[]>(() => {
  return [...actions].sort((a: BalanceAction, b: BalanceAction) => (canExecute(a.id) ? 0 : 1) - (canExecute(b.id) ? 0 : 1))
})

function isActionDisabled(action: BalanceAction): boolean {
  return !canExecute(action.id)
}

function getDisabledReason(action: BalanceAction): string {
  return getCanExecuteReason(action.id) ?? 'Действие недоступно'
}
</script>
