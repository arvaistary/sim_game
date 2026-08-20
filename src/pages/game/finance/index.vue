<template>
  <GameLayout title="Финансы">
    <div class="finance-page">
      <BalancePanel />
      <ExpenseList />
      <SectionHeader plain title="Финансовые действия" subtitle="Инвестиции, сбережения и управление деньгами" />
      <ActionCardList
        :actions="sortedActions"
        :empty-text="actionsEmptyHint"
        :is-disabled="isDisabled"
        :get-disabled-reason="getDisabledReason"
        :show-price-when-zero="true"
        @execute="executeAction"
      />
    </div>
  </GameLayout>
</template>

<script setup lang="ts">
import './finance.scss'
import type { BalanceAction } from '@/domain/balance/actions'

definePageMeta({ middleware: 'game-init' })

const store = useGameStore()

const { getActionsByCategory, canExecute, executeAction, actionsEmptyHint } = useActions()
const actions = getActionsByCategory('finance')

function isDisabled(action: BalanceAction): boolean {
  return !canExecute(action.id)
}

function getDisabledReason(action: BalanceAction): string {
  const result = store.canExecuteAction(action.id)
  return result.reason ?? 'Действие недоступно'
}

const sortedActions = computed(() => {
  void store.worldTick
  return [...actions].sort((a, b) => (canExecute(a.id) ? 0 : 1) - (canExecute(b.id) ? 0 : 1))
})
</script>
