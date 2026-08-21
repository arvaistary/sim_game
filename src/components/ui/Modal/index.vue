<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="modal-overlay"
        :style="overlayStyle"
        @click.self="handleOverlayClick"
      >
        <div
          class="modal-content"
          :class="{ 'modal-content--with-media': !!$slots.media }"
          :style="contentStyle"
        >
          <div v-if="$slots.media" class="modal-media">
            <slot name="media" />
          </div>
          <div class="modal-header">
            <h3 class="modal-title">{{ title }}</h3>
            <button v-if="showClose" class="modal-close" aria-label="Close dialog" @click="close">
              <GameIcon name="close" :size="20" :stroke-width="1.5" />
            </button>
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
import GameIcon from '@/components/ui/GameIcon/GameIcon.vue'

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
