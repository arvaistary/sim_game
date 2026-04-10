<template>
  <div class="rounded-panel" :style="panelStyle">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  color?: string
  shadow?: boolean
  radius?: number
  padding?: string
}>(), {
  color: 'var(--color-bg-card)',
  shadow: true,
  radius: 24,
  padding: '24px',
})

const panelStyle = computed(() => ({
  backgroundColor: props.color,
  borderRadius: `${props.radius}px`,
  boxShadow: props.shadow ? 'var(--shadow-card)' : 'none',
  border: `1px solid var(--color-border)`,
  padding: props.padding,
}))
</script>

<style scoped>
.rounded-panel {
  position: relative;
}
</style>

