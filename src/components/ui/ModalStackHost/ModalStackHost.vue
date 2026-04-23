<template>
  <template v-for="entry in stack" :key="entry.id">
    <component
      :is="entry.component"
      v-bind="getComponentProps(entry)"
      :z-index="entry.zIndex"
      @close="() => handleClose(entry)"
    />
  </template>
</template>

<script setup lang="ts">
import { useModalStack, type ModalEntry } from '@/composables/useModalStack'

const { stack, close } = useModalStack()

/**
 * Извлекает props для передачи в компонент через v-bind,
 * исключая onClose — он обрабатывается в handleClose.
 * Это avoids конфликт Vue3 между on*-пропами и @close event listener.
 */
function getComponentProps(entry: ModalEntry): Record<string, any> {
  if (!entry.props) return {}
  const { onClose, ...rest } = entry.props
  return rest
}

function handleClose(entry: ModalEntry): void {
  // Вызываем onClose из пропсов (если есть)
  const onClose = entry.props?.onClose
  if (typeof onClose === 'function') {
    try {
      onClose()
    } catch (error) {
      console.error('[ModalStackHost] Error in onClose callback:', error)
    }
  }
  // Закрываем модалку в стеке
  close(entry.id)
}
</script>
