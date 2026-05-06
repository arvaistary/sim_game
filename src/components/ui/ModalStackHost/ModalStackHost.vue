<template>
  <template
    v-for="entry in stack"
    :key="entry.id"
    >
    <component
      :is="entry.component"
      v-bind="getComponentProps(entry)"
      :z-index="entry.zIndex"
      @close="() => handleClose(entry)"
    />
  </template>
</template>

<script setup lang="ts">
import type { ModalEntry } from '@composables/useModalStack'
const { stack, close } = useModalStack()

function getComponentProps(entry: ModalEntry): Record<string, unknown> {
  if (!entry.props) return {}

  const { onClose, ...rest } = entry.props

  return rest
}

function handleClose(entry: ModalEntry): void {
  const onClose = entry.props?.onClose

  if (typeof onClose === 'function') {
    try {
      onClose()
    } catch (error: unknown) {
      console.error('[ModalStackHost] Error in onClose callback:', error)
    }
  }

  close(entry.id)
}
</script>
