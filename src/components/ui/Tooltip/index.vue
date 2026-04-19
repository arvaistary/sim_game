<template>
  <div
    ref="wrapperRef"
    class="tooltip-wrapper"
    :class="{
      'tooltip-wrapper--bottom': placement === 'bottom',
      'tooltip-wrapper--stretch': stretch,
      'tooltip-wrapper--follow': followCursor,
    }"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
    @mousemove="onMove"
    @click="onWrapperClick"
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
            'tooltip--interactive': pinOnClick && pinned,
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
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
  /**
   * Клик по якорю закрепляет подсказку (удобно без hover).
   * Повторный клик по якорю или снаружи — закрывает.
   */
  pinOnClick?: boolean
}>(), {
  placement: 'top',
})

const show = ref(false)
const pinned = ref(false)
const wrapperRef = ref<HTMLElement | null>(null)
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
  if (props.pinOnClick && pinned.value) return
  show.value = true
}

function onLeave() {
  if (props.pinOnClick && pinned.value) return
  show.value = false
}

function onWrapperClick(e: MouseEvent) {
  if (!props.pinOnClick) return
  e.stopPropagation()
  pinned.value = !pinned.value
  show.value = pinned.value
}

function onDocPointerDown(e: MouseEvent) {
  if (!props.pinOnClick || !pinned.value) return
  const t = e.target
  if (!(t instanceof Node)) return
  // Подсказка в Teleport(body) — клик по тексту не должен считаться «снаружи»
  if (t instanceof Element && t.closest('.tooltip')) return
  const root = wrapperRef.value
  if (!root?.contains(t)) {
    pinned.value = false
    show.value = false
  }
}

function onMove(e: MouseEvent) {
  if (props.followCursor || props.placement === 'follow') {
    mouseX.value = e.clientX
    mouseY.value = e.clientY
  }
}

onMounted(() => {
  if (props.pinOnClick) {
    document.addEventListener('pointerdown', onDocPointerDown, true)
  }
})

onUnmounted(() => {
  document.removeEventListener('pointerdown', onDocPointerDown, true)
})
</script>
