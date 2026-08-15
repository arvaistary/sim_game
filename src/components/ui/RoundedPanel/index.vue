<template>
  <div
    class="rounded-panel"
    :class="[
      `rounded-panel--${variant}`,
      {
        'rounded-panel--accent': accent,
        'rounded-panel--no-shadow': !shadow,
      },
    ]"
    :style="panelStyle"
  >
    <div v-if="$slots.header" class="rounded-panel__header">
      <slot name="header" />
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
import './style.scss'
import type { RoundedPanelProps } from './RoundedPanel.types'

const props = withDefaults(defineProps<RoundedPanelProps>(), {
  color: undefined,
  shadow: true,
  radius: 20,
  padding: 'var(--space-card-padding)',
  variant: 'panel',
})

const panelStyle = computed(() => ({
  ...(props.color ? { backgroundColor: props.color } : {}),
  borderRadius: `${props.radius}px`,
  padding: props.padding,
}))
</script>
