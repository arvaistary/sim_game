<template>
  <div
    class="tooltip-wrapper"
    :class="{
      'tooltip-wrapper--bottom': placement === 'bottom',
      'tooltip-wrapper--stretch': stretch,
    }"
    @mouseenter="show = true"
    @mouseleave="show = false"
  >
    <slot />
    <Transition name="tooltip">
      <div
        v-if="show && text"
        class="tooltip"
        :class="{ 'tooltip--multiline': multiline }"
      >
        {{ text }}
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import './style.scss'

defineProps<{
  text?: string
  /** Разрешить переносы строк и ограниченную ширину (длинные подсказки) */
  multiline?: boolean
  /** Снизу от якоря — удобно в прокручиваемых контейнерах и модалках */
  placement?: 'top' | 'bottom'
  /** На всю ширину родителя (строки списка) */
  stretch?: boolean
}>()

const show = ref(false)
</script>
