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

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: var(--color-bg-card);
  border-radius: var(--radius-2xl);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-popover);
  width: 100%;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px 12px;
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.modal-close {
  background: none;
  border: none;
  font-size: 18px;
  color: var(--color-text-secondary);
  opacity: 0.5;
  cursor: pointer;
  padding: 4px;
}

.modal-close:hover {
  opacity: 1;
}

.modal-body {
  padding: 0 20px 16px;
  color: var(--color-text-primary);
  font-size: 14px;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: 8px;
  padding: 12px 20px 16px;
}

/* Transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>

