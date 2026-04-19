<template>
  <GameLayout title="Магазин">
    <SectionHeader title="Магазин" subtitle="Покупки товаров и услуг для персонажа" />
    <ActionCardList
      :actions="sortedActions"
      :empty-text="actionsEmptyHint"
      :is-disabled="isDisabled"
      :get-disabled-reason="getDisabledReason"
      button-label="Применить"
      :show-price-when-zero="true"
      :use-format-effect="true"
      @execute="executeAction"
    />
  </GameLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { definePageMeta } from '#imports'
import { useActions } from '@/composables/useActions'
import { useGameStore } from '@/stores/game.store'
import type { BalanceAction } from '@/domain/balance/actions'

definePageMeta({ middleware: 'game-init' })

const store = useGameStore()
const { getActionsByCategory, canExecute, executeAction, actionsEmptyHint } = useActions()

const actions = getActionsByCategory('shop' as any)

function isDisabled(action: BalanceAction): boolean {
  return !canExecute(action.id)
}

function getDisabledReason(action: any): string {
  const result = store.canExecuteAction(action.id)
  return result.reason ?? 'Действие недоступно'
}

const sortedActions = computed(() => {
  void store.worldTick
  return [...actions].sort((a, b) => (canExecute(a.id) ? 0 : 1) - (canExecute(b.id) ? 0 : 1))
})
</script>
