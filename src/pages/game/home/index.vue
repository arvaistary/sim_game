<template>
  <GameLayout title="Дом">
    <SectionHeader
      title="Дом"
      subtitle="Действия для обустройства дома и комфорта"
      />
    <ActionCardList
      :actions="sortedActions"
      :empty-text="actionsEmptyHint"
      :is-disabled="isDisabled"
      :get-disabled-reason="getDisabledReason"
      :show-price-when-zero="true"
      :use-format-effect="true"
      @execute="executeAction"
      button-label="Применить"
      />
  </GameLayout>
</template>

<script setup lang="ts">
import { getActionById, type BalanceAction } from '@domain/balance/actions'

definePageMeta({ middleware: 'game-init' })

const timeStore = useTimeStore()
const walletStore = useWalletStore()

const { getActionsByCategory, canExecute, executeAction, actionsEmptyHint } = useActions()

const actions: BalanceAction[] = getActionsByCategory('home' as any)

const sortedActions = computed<BalanceAction[]>(() => {
  void timeStore.totalHours

  return [...actions].sort((a, b) => (canExecute(a.id) ? 0 : 1) - (canExecute(b.id) ? 0 : 1))
})

function isDisabled(action: BalanceAction): boolean {
  return !canExecute(action.id)
}

function getDisabledReason(action: any): string {
  const result: BalanceAction | null = getActionById(action.id)

  if (!result) return 'Действие не найдено'

  if (walletStore.money < result.price) return 'Недостаточно денег'

  if (timeStore.weekHoursRemaining < result.hourCost) return 'Недостаточно времени'

  return 'Действие недоступно'
}
</script>