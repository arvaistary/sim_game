<template>
  <div class="progress-bar" :style="containerStyle">
    <div class="progress-bar__fill" :style="fillStyle" />
    <span v-if="showValue" class="progress-bar__value">{{ Math.round(value) }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import './style.scss'

const props = withDefaults(defineProps<{
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

const percentage = computed(() => Math.min(100, Math.max(0, (props.value / props.max) * 100)))

const containerStyle = computed(() => ({
  height: `${props.height}px`,
}))

const fillStyle = computed(() => ({
  width: `${percentage.value}%`,
  backgroundColor: props.color,
}))
</script>
