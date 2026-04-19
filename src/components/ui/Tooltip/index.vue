<template>
  <div
    class="tooltip-wrapper"
    :class="{
      'tooltip-wrapper--bottom': placement === 'bottom',
      'tooltip-wrapper--stretch': stretch,
      'tooltip-wrapper--follow': followCursor,
    }"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
    @mousemove="onMove"
  >
    <slot />
    <Teleport to="body">
      <Transition name="tooltip">
        <div
          v-if="show && text"
          ref="tooltipEl"
          class="tooltip"
          :class="{
            'tooltip--multiline': multiline,
            'tooltip--follow': followCursor,
          }"
          :style="tooltipStyle"
        >
          {{ text }}
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import './style.scss'

const props = withDefaults(defineProps<{
  text?: string
  /** Разрешить переносы строк и ограниченную ширину (длинные подсказки) */
  multiline?: boolean
  /** Снизу от якоря — удобно в прокручиваемых контейнерах и модалках */
  placement?: 'top' | 'bottom' | 'follow'
  /** На всю ширину родителя (строки списка) */
  stretch?: boolean
  /** Следовать за курсором */
  followCursor?: boolean
}>(), {
  placement: 'top',
})

const show = ref(false)
const mouseX = ref(0)
const mouseY = ref(0)

const tooltipStyle = computed(() => {
  if (props.followCursor || props.placement === 'follow') {
    return {
      position: 'fixed' as const,
      left: `${mouseX.value + 12}px`,
      top: `${mouseY.value + 16}px`,
      transform: 'none',
    }
  }
  return {}
})

function onEnter() {
  show.value = true
}

function onLeave() {
  show.value = false
}

function onMove(e: MouseEvent) {
  if (props.followCursor || props.placement === 'follow') {
    mouseX.value = e.clientX
    mouseY.value = e.clientY
  }
}
</script>
