<template>
  <GameLayout title="Финансы">
    <div class="finance-page">
      <BalancePanel />
      <ExpenseList />
      <SectionHeader title="Финансовые действия" subtitle="Инвестиции, сбережения и управление деньгами" />
      <ActionCardList
        :actions="sortedActions"
        :empty-text="actionsEmptyHint"
        :is-disabled="(a: any) => !canExecute(a.id)"
        :get-disabled-reason="getDisabledReason"
        :show-price-when-zero="true"
        @execute="executeAction"
      />
    </div>
  </GameLayout>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'game-init' })

const store = useGameStore()
const { getActionsByCategory, canExecute, executeAction, actionsEmptyHint } = useActions()
const actions = getActionsByCategory('finance')

function getDisabledReason(action: any): string {
  const result = store.canExecuteAction(action.id)
  return result.reason ?? 'Действие недоступно'
}

const sortedActions = computed(() => {
  void store.worldTick
  return [...actions].sort((a, b) => (canExecute(a.id) ? 0 : 1) - (canExecute(b.id) ? 0 : 1))
})
</script>

<style scoped lang="scss">
.finance-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
