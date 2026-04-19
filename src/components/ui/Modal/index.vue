<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="modal-overlay"
        :style="overlayStyle"
        @click.self="handleOverlayClick"
      >
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
import { computed, onMounted, onUnmounted } from 'vue'
import './style.scss'

const props = withDefaults(defineProps<{
  isOpen?: boolean
  title?: string
  showClose?: boolean
  maxWidth?: string
  closeOnOverlay?: boolean
  closeOnEscape?: boolean
  zIndex?: number
}>(), {
  isOpen: true,
  title: '',
  showClose: true,
  maxWidth: '420px',
  closeOnOverlay: true,
  closeOnEscape: true,
  zIndex: 1000,
})

const emit = defineEmits<{
  close: []
}>()

function close() {
  emit('close')
}

function handleOverlayClick() {
  if (props.closeOnOverlay) {
    close()
  }
}

function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.isOpen && props.closeOnEscape) {
    event.preventDefault()
    close()
  }
}

const contentStyle = computed(() => ({
  maxWidth: props.maxWidth,
}))

const overlayStyle = computed(() => ({
  zIndex: props.zIndex,
}))

onMounted(() => {
  if (props.closeOnEscape) {
    window.addEventListener('keydown', handleEscape)
  }
})

onUnmounted(() => {
  if (props.closeOnEscape) {
    window.removeEventListener('keydown', handleEscape)
  }
})
</script>
