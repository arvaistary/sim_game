<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="modal-overlay" @click.self="close">
        <div class="modal-content" :style="contentStyle">
          <div class="modal-header">
            <h3 class="modal-title">{{ title }}</h3>
            <button v-if="showClose" class="modal-close" @click="close" aria-label="Close dialog">x</button>
          </div>
          <div class="modal-body">
            <slot />
          </div>
          <div v-if="$slots.actions" class="modal-actions">
            <slot name="actions" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import './style.scss'

const props = withDefaults(defineProps<{
  isOpen: boolean
  title?: string
  showClose?: boolean
  maxWidth?: string
}>(), {
  title: '',
  showClose: true,
  maxWidth: '360px',
})

const emit = defineEmits<{
  close: []
}>()

function close() {
  emit('close')
}

const contentStyle = { maxWidth: props.maxWidth }
</script>
