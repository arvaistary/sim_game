<template>
  <div
    :style="containerStyle"
    class="progress-bar"
    >
    <div
      :style="fillStyle"
      class="progress-bar__fill"
      />
    <span
      v-if="showValue"
      class="progress-bar__value"
      >
      {{ Math.round(value) }}
    </span>
  </div>
</template>

<script setup lang="ts">

import './style.scss'

/**
 * @prop {number} value - Текущее значение прогресса
 * @prop {number} [max] - Максимальное значение (знаменатель)
 * @prop {string} [color] - Цвет заливки полосы
 * @prop {number} [height] - Высота полосы в пикселях
 * @prop {boolean} [showValue] - Показывать числовое значение внутри полосы
 */
const props: boolean = withDefaults(defineProps<{
  value: number
  max?: number
  color?: string
  height?: number
  showValue?: boolean
}>(), {
  max: 100,
  color: 'var(--color-status-success)',
  height: 8,
  showValue: false,
})

const percentage = computed<number>(() => Math.min(100, Math.max(0, (props.value / props.max) * 100)))

const containerStyle = computed(() => ({
  height: `${props.height}px`,
}))

const fillStyle = computed(() => ({
  width: `${percentage.value}%`,
  backgroundColor: props.color,
}))
</script>
