<template>
  <template v-for="entry in stack" :key="entry.id">
    <component
      :is="entry.component"
      v-bind="entry.props"
      :z-index="entry.zIndex"
      @close="() => handleClose(entry)"
    />
  </template>
</template>

<script setup lang="ts">
import { useModalStack, type ModalEntry } from '@/composables/useModalStack'

const { stack, close } = useModalStack()

function handleClose(entry: ModalEntry): void {
  // Сначала вызываем onClose из пропсов (если есть)
  const onClose = entry.props?.onClose
  if (typeof onClose === 'function') {
    try {
      onClose()
    } catch (error) {
      console.error('[ModalStackHost] Error in onClose callback:', error)
    }
  }
  // Затем закрываем модалку в стеке
  close(entry.id)
}
</script>
