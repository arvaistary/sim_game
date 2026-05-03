<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        :style="overlayStyle"
        @click.self="handleOverlayClick"
        class="modal-overlay"
        >
        <div
          :style="contentStyle"
          class="modal-content"
          >
          <div class="modal-header">
            <h3 class="modal-title">
              {{ title }}
            </h3>
            <button
              v-if="showClose"
              @click="close"
              class="modal-close"
              aria-label="Close dialog"
              >
              x
            </button>
          </div>
          <div class="modal-body">
            <slot />
          </div>
          <div
            v-if="$slots.actions"
            class="modal-actions"
            >
            <slot name="actions" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import './style.scss'

/**
 * @prop {boolean} [isOpen] - Флаг видимости модального окна
 * @prop {string} [title] - Заголовок модального окна
 * @prop {boolean} [showClose] - Показывать кнопку закрытия
 * @prop {string} [maxWidth] - Максимальная ширина модального окна
 * @prop {boolean} [closeOnOverlay] - Закрывать по клику на оверлей
 * @prop {boolean} [closeOnEscape] - Закрывать по нажатию Escape
 * @prop {number} [zIndex] - Z-index модального окна
 */
const props: boolean = withDefaults(defineProps<{
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

const emit: boolean = defineEmits<{
  close: []
}>()

const contentStyle = computed(() => ({
  maxWidth: props.maxWidth,
}))

const overlayStyle = computed(() => ({
  zIndex: props.zIndex,
}))

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
