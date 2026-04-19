<template>
  <div class="stat-bar">
    <div class="stat-bar__header">
      <span class="stat-bar__label">{{ label }}</span>
      <span class="stat-bar__value">{{ Math.round(value) }}</span>
    </div>
    <ProgressBar :value="value" :color="barColor" :height="6" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  label: string
  value: number
  color?: string
}>(), {
  color: '',
})

const barColor = computed(() => {
  if (props.color) return props.color
  if (props.value > 60) return 'var(--color-sage)'
  if (props.value > 30) return 'var(--color-accent)'
  return 'var(--color-danger)'
})
</script>

<style scoped>
.stat-bar {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-bar__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-bar__label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
}

.stat-bar__value {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
}
</style>

