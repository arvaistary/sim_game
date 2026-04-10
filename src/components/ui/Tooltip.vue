<template>
  <div class="tooltip-wrapper" @mouseenter="show = true" @mouseleave="show = false">
    <slot />
    <Transition name="tooltip">
      <div v-if="show && text" class="tooltip">
        {{ text }}
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  text?: string
}>()

const show = ref(false)
</script>

<style scoped>
.tooltip-wrapper {
  position: relative;
  display: inline-flex;
}

.tooltip {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 10px;
  background: var(--color-text-primary);
  color: var(--color-white);
  font-size: 12px;
  line-height: 1.4;
  border-radius: var(--radius-sm);
  white-space: nowrap;
  z-index: 500;
  pointer-events: none;
  box-shadow: var(--shadow-card);
}

.tooltip-enter-active,
.tooltip-leave-active {
  transition: opacity 0.15s ease;
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
}
</style>

