<template>
  <div class="progress-bar" :style="containerStyle">
    <div class="progress-bar__fill" :style="fillStyle" />
    <span v-if="showValue" class="progress-bar__value">{{ Math.round(value) }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

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

<style scoped>
.progress-bar {
  width: 100%;
  background-color: var(--color-bg-elevated);
  border-radius: var(--radius-full);
  overflow: hidden;
  position: relative;
}

.progress-bar__fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width var(--transition-normal);
}

.progress-bar__value {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 10px;
  font-weight: 600;
  color: var(--color-text-primary);
}
</style>

