<template>
  <div
    class="rounded-panel"
    :class="{
      'rounded-panel--accent': accent,
      'rounded-panel--no-shadow': !shadow,
    }"
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

interface RoundedPanelProps {
  color?: string
  shadow?: boolean
  radius?: number
  padding?: string
  /** Декоративная emerald-полоса слева 3px */
  accent?: boolean
}

const props = withDefaults(defineProps<RoundedPanelProps>(), {
  color: 'var(--color-bg-card)',
  shadow: true,
  radius: 20,
  padding: 'var(--space-card-padding)',
})

const panelStyle = computed(() => ({
  backgroundColor: props.color,
  borderRadius: `${props.radius}px`,
  boxShadow: props.shadow ? 'var(--shadow-card)' : 'none',
  padding: props.padding,
}))
</script>
