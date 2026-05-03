<template>
  <Modal
    @close="handleClose"
    title="Итоги смены"
    >
    <p class="work-modal__result">
      {{ workSummary }}
    </p>
    <div
      v-if="statDiffs.length > 0"
      class="work-modal__stats"
      >
      <p class="work-modal__stats-title">
        Изменения характеристик:
      </p>
      <ul class="work-modal__stats-list">
        <li
          v-for="diff in statDiffs"
          :key="diff.key"
          class="work-modal__stats-item"
          >
          <span>
            {{ diff.label }}
          </span>
          <span :class="getDeltaClass(diff.delta)">
            {{ formatDelta(diff.delta) }}
          </span>
        </li>
      </ul>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import './WorkResultModal.scss'

import type { WorkResultModalProps } from './WorkResultModal.types'

/**
 * @prop {string} workSummary - Текстовое описание результата работы
 * @prop {WorkStatDiff[]} statDiffs - Массив изменений характеристик
 */
defineProps<WorkResultModalProps>()

const emit: boolean = defineEmits<{
  close: []
}>()

function handleClose() {
  emit('close')
}

function formatDelta(delta: number): string {
  return delta > 0 ? `+${delta}` : `${delta}`
}

function getDeltaClass(delta: number): string {
  return delta >= 0 ? 'work-modal__delta--positive' : 'work-modal__delta--negative'
}
</script>
