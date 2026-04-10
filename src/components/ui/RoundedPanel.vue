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
  color: 'var(--color-panel)',
  shadow: true,
  radius: 22,
  padding: '16px',
})

const panelStyle = computed(() => ({
  backgroundColor: props.color,
  borderRadius: `${props.radius}px`,
  boxShadow: props.shadow ? 'var(--shadow-panel)' : 'none',
  border: `1px solid var(--color-line)`,
  padding: props.padding,
}))
</script>

<style scoped>
.rounded-panel {
  position: relative;
}
</style>

