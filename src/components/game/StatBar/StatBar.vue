<template>
  <Tooltip
    :text="`${Math.round(value)} / ${max}`"
    stretch
  >
    <div class="stat-bar">
      <div class="stat-bar__header">
        <span class="stat-bar__label">{{ label }}</span>
      </div>
      <ProgressBar :value="value" :max="max" :color="barColor" :height="6" />
    </div>
  </Tooltip>
</template>

<script setup lang="ts">
import './StatBar.scss'

interface StatBarProps {
  label: string
  value: number
  max?: number
  color?: string
}

const props = withDefaults(defineProps<StatBarProps>(), {
  color: '',
  max: 100,
})

const barColor = computed<string>(() => {
  if (props.color) return props.color
  if (props.value > 60) return 'var(--color-status-success)'
  if (props.value > 30) return 'var(--color-status-warning)'
  return 'var(--color-status-danger)'
})
</script>
