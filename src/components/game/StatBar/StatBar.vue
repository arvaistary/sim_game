<template>
  <Tooltip
    :text="`${Math.round(value)} / ${max}`"
    stretch
  >
    <div
      :class="[
        'stat-bar',
        { 'stat-bar--underflow': alert === 'underflow', 'stat-bar--overflow': alert === 'overflow' },
      ]"
    >
      <div v-if="showValue" class="stat-bar__inline">
        <span class="stat-bar__label">{{ label }}</span>
        <ProgressBar :value="value" :max="max" :color="barColor" :height="4" />
        <span class="stat-bar__value">{{ Math.round(value) }}%</span>
      </div>
      <template v-else>
        <div class="stat-bar__header">
          <span class="stat-bar__label">{{ label }}</span>
          <span
            v-if="delta !== undefined"
            :class="['stat-bar__delta', `stat-bar__delta--${deltaTone}`]"
          >
            {{ formatDelta(delta) }}
          </span>
        </div>
        <ProgressBar :value="value" :max="max" :color="barColor" :height="6" />
      </template>
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
  delta?: number
  alert?: 'underflow' | 'overflow' | ''
  showValue?: boolean
}

const props = withDefaults(defineProps<StatBarProps>(), {
  color: '',
  max: 100,
  delta: undefined,
  alert: '',
  showValue: false,
})

const deltaTone = computed<'positive' | 'negative' | 'neutral'>(() => {
  if (props.delta === undefined || props.delta === 0) return 'neutral'
  return props.delta > 0 ? 'positive' : 'negative'
})

function formatDelta(value: number): string {
  const rounded: number = Math.round(value)
  if (rounded > 0) return `↑ +${rounded}`
  if (rounded < 0) return `↓ ${rounded}`
  return '→ 0'
}

const barColor = computed<string>(() => {
  if (props.color) return props.color
  if (props.value > 60) return 'var(--color-status-success)'
  if (props.value > 30) return 'var(--color-status-warning)'
  return 'var(--color-status-danger)'
})
</script>
