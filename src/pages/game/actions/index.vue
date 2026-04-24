<template>
  <GameLayout title="Действия">
    <ActionTabs
      v-model:active-category="activeCategory"
      :categories="ACTION_CATEGORIES"
    />
    <ActionCardList
      :actions="sortedActions"
      :empty-text="actionsEmptyHint"
      :is-disabled="(a: any) => !canExecute(a.id)"
      :get-disabled-reason="getDisabledReason"
      @execute="executeAction"
    />
  </GameLayout>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'game-init' })

const store = useGameStore()

const { getActionsByCategory, canExecute, executeAction, actionsEmptyHint } = useActions()

const activeCategory = ref<ActionCategory>('fun')

const actions = computed(() => getActionsByCategory(activeCategory.value))

function getDisabledReason(action: any): string {
  const result = store.canExecuteAction(action.id)

  return result.reason ?? 'Действие недоступно'
}

const sortedActions = computed(() => {
  void store.worldTick

  return [...actions.value].sort((a, b) => (canExecute(a.id) ? 0 : 1) - (canExecute(b.id) ? 0 : 1))
})
</script>
