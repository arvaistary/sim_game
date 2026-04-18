<template>
  <div class="action-card-list">
    <ActionCard
      v-for="action in actions"
      :key="action.id"
      :action="action"
      :disabled="isDisabled(action)"
      :button-label="buttonLabel"
      :show-price-when-zero="showPriceWhenZero"
      :use-format-effect="useFormatEffect"
      @execute="$emit('execute', $event)"
    />
    <EmptyState v-if="actions.length === 0" :text="emptyText" />
  </div>
</template>

<script setup lang="ts">
import ActionCard from '@/components/game/ActionCard/ActionCard.vue'
import EmptyState from '@/components/game/EmptyState/EmptyState.vue'
import type { BalanceAction } from '@/domain/balance/actions/types'

withDefaults(defineProps<{
  actions: BalanceAction[]
  isDisabled: (action: BalanceAction) => boolean
  buttonLabel?: string
  showPriceWhenZero?: boolean
  useFormatEffect?: boolean
  emptyText?: string
}>(), {
  buttonLabel: 'Выполнить',
  showPriceWhenZero: false,
  useFormatEffect: false,
  emptyText: 'Нет доступных действий',
})

defineEmits<{
  execute: [id: string]
}>()
</script>

<style scoped lang="scss" src="./ActionCardList.scss"></style>
