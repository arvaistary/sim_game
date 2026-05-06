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
      :use-format-effect="useFormatEffect"
      @execute="$emit('execute', $event)"
    />
    <EmptyState
      v-if="actions.length === 0"
      :text="emptyText"
      />
  </div>
</template>

<script setup lang="ts">
import './ActionCardList.scss'

import type { BalanceAction } from '@domain/balance/actions/types'
/**
 * @prop {BalanceAction[]} actions - Список действий для отображения
 * @prop {(action: BalanceAction) => boolean} isDisabled - Функция проверки недоступности действия
 * @prop {(action: BalanceAction) => string} [getDisabledReason] - Функция получения причины недоступности
 * @prop {string} [buttonLabel] - Текст кнопки действия
 * @prop {boolean} [showPriceWhenZero] - Показывать цену даже если она равна 0
 * @prop {boolean} [useFormatEffect] - Использовать форматирование эффекта
 * @prop {string} [emptyText] - Текст при пустом списке действий
 */
withDefaults(defineProps<{
  actions: BalanceAction[]
  isDisabled: (action: BalanceAction) => boolean
  getDisabledReason?: (action: BalanceAction) => string
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

