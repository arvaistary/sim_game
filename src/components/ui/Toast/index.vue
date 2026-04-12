<template>
  <Teleport to="body">
    <Transition name="toast">
      <div v-if="visible" class="toast" :class="`toast--${type}`">
        <span class="toast__icon">{{ iconMap[type] }}</span>
        <span class="toast__message">{{ message }}</span>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { TOAST_ICON_MAP } from './index.constants'
import './style.scss'

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

const iconMap = TOAST_ICON_MAP

watch(() => props.visible, (val) => {
  if (val) {
    setTimeout(() => {
      emit('update:visible', false)
    }, props.duration)
  }
})
</script>
