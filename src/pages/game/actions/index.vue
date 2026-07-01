<template>
  <GameLayout title="Действия">
    <Tabs
      v-model="activeCategory"
      :items="ACTION_CATEGORIES"
    />
    <ActionCardList
      :actions="sortedActions"
      :empty-text="actionsEmptyHint"
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

const { getActionsByCategory, canExecute, executeAction, actionsEmptyHint } = useActions()

const activeCategory = ref<ActionCategoryId>('fun')

const actions: ComputedRef<BalanceAction[]> = computed(() => getActionsByCategory(activeCategory.value))

function getDisabledReason(action: BalanceAction): string {
  const result: CanExecuteActionResult = store.canExecuteAction(action.id)
  return result.reason ?? 'Действие недоступно'
}

const sortedActions: ComputedRef<BalanceAction[]> = computed(() => {
  void store.worldTick
  return [...actions.value].sort((a, b) => (canExecute(a.id) ? 0 : 1) - (canExecute(b.id) ? 0 : 1))
})
</script>
