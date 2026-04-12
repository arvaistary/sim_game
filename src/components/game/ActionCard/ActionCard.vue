<template>
  <RoundedPanel class="action-card" :class="{ disabled }">
    <div class="card-header">
      <span class="card-title">{{ action.title }}</span>
      <span v-if="showPriceWhenZero || action.price > 0" class="card-price">{{ formatMoney(action.price) }} ₽</span>
    </div>
    <p class="card-effect">{{ displayEffect }}</p>
    <p v-if="action.mood" class="card-mood">{{ action.mood }}</p>
    <div class="card-meta">
      <span v-if="action.hourCost" class="meta-tag">{{ action.hourCost }} ч</span>
    </div>
    <div class="card-footer">
      <GameButton
        :label="buttonLabel"
        :disabled="disabled"
        color="var(--color-accent)"
        text-color="#fff"
        small
        @click="$emit('execute', action.id)"
      />
    </div>
  </RoundedPanel>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import RoundedPanel from '@/components/ui/RoundedPanel/index.vue'
import GameButton from '@/components/ui/GameButton/index.vue'
import { formatMoney, formatEffect } from '@/utils/format'

interface ActionItem {
  id: string
  title: string
  price: number
  effect: string
  mood?: string
  hourCost?: number
  [key: string]: unknown
}

const props = withDefaults(defineProps<{
  action: ActionItem
  disabled?: boolean
  buttonLabel?: string
  showPriceWhenZero?: boolean
  useFormatEffect?: boolean
}>(), {
  disabled: false,
  buttonLabel: 'Выполнить',
  showPriceWhenZero: false,
  useFormatEffect: false,
})

defineEmits<{
  execute: [id: string]
}>()

const displayEffect = computed(() => {
  if (props.useFormatEffect) return formatEffect(props.action.effect)
  return props.action.effect
})
</script>

<style scoped lang="scss" src="./ActionCard.scss"></style>
