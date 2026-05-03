<template>
  <button
    :class="{ 'game-button--disabled': disabled, 'game-button--small': small }"
    :style="buttonStyle"
    :disabled="disabled"
    @click="$emit('click', $event)"
    class="game-button"
    >
    <slot>{{ label }}</slot>
  </button>
</template>

<script setup lang="ts">

import './style.scss'

/**
 * @prop {string} [label] - Текст кнопки
 * @prop {string} [color] - Цвет фона кнопки
 * @prop {string} [textColor] - Цвет текста кнопки
 * @prop {boolean} [disabled] - Флаг отключённого состояния кнопки
 * @prop {boolean} [small] - Уменьшенный размер кнопки
 */
const props: boolean = withDefaults(defineProps<{
  label?: string
  color?: string
  textColor?: string
  disabled?: boolean
  small?: boolean
}>(), {
  color: 'var(--color-action-primary)',
  textColor: 'var(--color-text-on-primary)',
  disabled: false,
  small: false,
})

defineEmits<{
  click: [event?: MouseEvent]
}>()

const buttonStyle = computed(() => ({
  backgroundColor: props.color,
  color: props.textColor,
}))
</script>
