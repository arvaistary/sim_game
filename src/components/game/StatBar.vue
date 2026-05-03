<template>
  <div class="stat-bar">
    <div class="stat-bar__header">
      <span class="stat-bar__label">
        {{ label }}
      </span>
      <span class="stat-bar__value">
        {{ Math.round(value) }}
      </span>
    </div>
    <ProgressBar
      :value="value"
      :color="barColor"
      :height="6"
      />
  </div>
</template>

<script setup lang="ts">
import './StatBar.scss'

/**
 * @prop {string} label - Подпись показателя (например, «Здоровье»)
 * @prop {number} value - Текущее числовое значение показателя
 * @prop {string} [color] - Кастомный цвет полосы (переопределяет автоматический)
 */
const props: boolean = withDefaults(defineProps<{
  label: string
  value: number
  color?: string
}>(), {
  color: '',
})

const barColor = computed<string>(() => {

  if (props.color) return props.color

  if (props.value > 60) return 'var(--color-sage)'

  if (props.value > 30) return 'var(--color-accent)'

  return 'var(--color-danger)'
})
</script>

