<template>
  <div
    :class="{
      'tooltip-wrapper--bottom': placement === 'bottom',
      'tooltip-wrapper--stretch': stretch,
      'tooltip-wrapper--follow': followCursor,
    }"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
    @mousemove="onMove"
    @click="onWrapperClick"
    ref="wrapperRef"
    class="tooltip-wrapper"
    >
    <slot />
    <Teleport to="body">
      <Transition name="tooltip">
        <div
          v-if="show && text"
          :class="{
            'tooltip--multiline': multiline,
            'tooltip--follow': followCursor,
            'tooltip--interactive': pinOnClick && pinned,
          }"
          :style="tooltipStyle"
          ref="tooltipEl"
          class="tooltip"
          >
          {{ text }}
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import './style.scss'

/**
 * @prop {string} [text] - Текст подсказки
 * @prop {boolean} [multiline] - Разрешить переносы строк и ограниченную ширину (длинные подсказки)
 * @prop {'top' | 'bottom' | 'follow'} [placement] - Позиционирование: сверху, снизу или следование за курсором
 * @prop {boolean} [stretch] - Растянуть на всю ширину родителя
 * @prop {boolean} [followCursor] - Следовать за курсором мыши
 * @prop {boolean} [pinOnClick] - Закреплять подсказку по клику на якорь
 */
const props: boolean = withDefaults(defineProps<{
  text?: string
  multiline?: boolean
  placement?: 'top' | 'bottom' | 'follow'
  stretch?: boolean
  followCursor?: boolean
  pinOnClick?: boolean
}>(), {
  placement: 'top',
})

const show = ref(false)
const pinned = ref(false)
const wrapperRef = ref<HTMLElement | null>(null)
const mouseX = ref(0)
const mouseY = ref(0)

const tooltipStyle = computed<Record<string, string | undefined>>(() => {

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
  const t: EventTarget | null = e.target

  if (!(t instanceof Node)) return
  // Подсказка в Teleport(body) — клик по тексту не должен считаться «снаружи»

  if (t instanceof Element && t.closest('.tooltip')) return
  const root: HTMLElement | null = wrapperRef.value

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
