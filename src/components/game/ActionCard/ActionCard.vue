<template>
  <Tooltip
    :text="disabled && disabledReason ? disabledReason : undefined"
    :follow-cursor="true"
    multiline
    >
    <RoundedPanel
      :class="{ disabled }"
      @click="handleClick"
      class="action-card"
      >
      <div class="card-header">
        <span class="card-title">
          {{ action.title }}
        </span>
        <span
          v-if="showPriceWhenZero || action.price > 0"
          class="card-price"
          >
          {{ formatMoney(action.price) }} ₽
        </span>
      </div>
      <p class="card-effect">
        {{ displayEffect }}
      </p>
      <p
        v-if="action.mood"
        class="card-mood"
        >
        {{ action.mood }}
      </p>
      <div class="card-meta">
        <span
          v-if="action.hourCost"
          class="meta-tag"
          >
          {{ action.hourCost }} ч
        </span>
      </div>
      <div class="card-footer">
        <GameButton
          :label="buttonLabel"
          :disabled="disabled"
          @click="handleButtonClick"
          color="var(--color-accent)"
          text-color="#fff"
          small
          />
      </div>
    </RoundedPanel>
  </Tooltip>
</template>

<script setup lang="ts">
import './ActionCard.scss'

import { formatMoney, formatEffect } from '@utils/format'

import type { BalanceAction } from '@domain/balance/actions/types'

/**
 * @prop {BalanceAction} action - Данные действия для отображения
 * @prop {boolean} [disabled] - Флаг отключённого (недоступного) действия
 * @prop {string} [disabledReason] - Причина недоступности действия для подсказки
 * @prop {string} [buttonLabel] - Текст кнопки действия
 * @prop {boolean} [showPriceWhenZero] - Показывать цену даже если она равна 0
 * @prop {boolean} [useFormatEffect] - Использовать форматирование эффекта через formatEffect
 */
const props = withDefaults(defineProps<{
  action: BalanceAction
  disabled?: boolean
  disabledReason?: string
  buttonLabel?: string
  showPriceWhenZero?: boolean
  useFormatEffect?: boolean
}>(), {
  disabled: false,
  disabledReason: '',
  buttonLabel: 'Выполнить',
  showPriceWhenZero: false,
  useFormatEffect: false,
})

const emit = defineEmits<{
  execute: [id: string]
}>()

const toast = useToast()

const displayEffect = computed<string>(() => {
  if (props.useFormatEffect) return formatEffect(props.action.effect)

  return props.action.effect
})

function handleClick() {
  if (props.disabled && props.disabledReason) {
    toast.showInfo(`🔒 ${props.disabledReason}`)
  }
}

function handleButtonClick(event?: MouseEvent) {
  event?.stopPropagation()
  emit('execute', props.action.id)
}
</script>

