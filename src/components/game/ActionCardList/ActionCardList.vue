<template>
  <div class="action-card-list">
    <ActionCard
      v-for="action in actions"
      :key="action.id"
      :action="action"
      :disabled="isDisabled(action)"
      :disabled-reason="getDisabledReason ? getDisabledReason(action) : ''"
      :button-label="buttonLabel"
      :show-price-when-zero="showPriceWhenZero"
      :show-details="showDetails"
      :use-format-effect="useFormatEffect"
      :show-add-to-plan="showAddToPlan"
      @execute="$emit('execute', $event)"
    />
    <EmptyState v-if="actions.length === 0" :text="emptyText" />
  </div>
</template>

<script setup lang="ts">
import './ActionCardList.scss'
import type { ActionCardListEmits, ActionCardListProps } from './ActionCardList.types'

withDefaults(defineProps<ActionCardListProps>(), {
  buttonLabel: 'Выполнить',
  showPriceWhenZero: false,
  showDetails: true,
  useFormatEffect: false,
  showAddToPlan: true,
  emptyText: 'Нет доступных действий',
})

defineEmits<ActionCardListEmits>()
</script>
