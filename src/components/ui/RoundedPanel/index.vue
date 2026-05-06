<template>
  <div
    :style="panelStyle"
    class="rounded-panel"
    >
    <slot />
  </div>
</template>

<script setup lang="ts">
import './style.scss'

/**
 * @prop {string} [color] - Цвет фона панели
 * @prop {boolean} [shadow] - Показывать тень
 * @prop {number} [radius] - Радиус скругления углов в пикселях
 * @prop {string} [padding] - Внутренний отступ
 */
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
