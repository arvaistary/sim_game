<template>
  <div class="progress-bar">
    <div
      v-if="label"
      class="progress-bar__label"
    >
      <span class="progress-bar__label-text">{{ label }}</span>
      <span v-if="showValue" class="progress-bar__label-value metric">{{ Math.round(value) }}</span>
    </div>
    <div
      class="progress-bar__track"
      :style="trackStyle"
    >
      <div
        class="progress-bar__fill"
        :style="fillStyle"
      />
      <span v-if="showValue && !label" class="progress-bar__value">{{ Math.round(value) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import './style.scss'

interface ProgressBarProps {
  value: number
  max?: number
  color?: string
  height?: number
  showValue?: boolean
  /** Optional label above the track */
  label?: string
}

const props = withDefaults(defineProps<ProgressBarProps>(), {
  max: 100,
  color: 'var(--color-action-primary)',
  height: 8,
  showValue: false,
  label: '',
})

const percentage = computed<number>(() => Math.min(100, Math.max(0, (props.value / props.max) * 100)))

const trackStyle = computed(() => ({
  height: `${props.height}px`,
}))

const fillStyle = computed(() => ({
  width: `${percentage.value}%`,
  backgroundColor: props.color,
}))
</script>
