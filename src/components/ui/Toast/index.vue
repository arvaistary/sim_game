<template>
  <Teleport to="body">
    <Transition name="toast">
      <div
        v-if="visible"
        :class="`toast--${type}`"
        class="toast"
        >
        <span class="toast__icon">{{ iconMap[type] }}</span>
        <span class="toast__message">{{ message }}</span>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">

import './style.scss'

import { TOAST_ICON_MAP } from './index.constants'
/**
 * @prop {string} message - Текст уведомления
 * @prop {'info' | 'success' | 'warning' | 'error'} [type] - Тип уведомления для иконки и стиля
 * @prop {number} [duration] - Длительность показа в миллисекундах
 * @prop {boolean} [visible] - Флаг видимости уведомления
 */
const props = withDefaults(defineProps<{
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  duration?: number
  visible?: boolean
}>(), {
  type: 'info',
  duration: 2500,
  visible: false,
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const iconMap: Record<string, string> = TOAST_ICON_MAP

watch(() => props.visible, (val) => {
  if (val) {
    setTimeout(() => {
      emit('update:visible', false)
    }, props.duration)
  }
})
</script>
