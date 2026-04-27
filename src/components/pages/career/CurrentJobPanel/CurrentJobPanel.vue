<template>
  <RoundedPanel class="current-job-panel">
    <!-- Reactivity trigger -->
    <span
      v-if="reactivityTrigger"
      class="sr-only"
      >
      {{ reactivityTrigger }}
    </span>
    <div class="job-info">
      <div class="job-info__header">
        <span class="job-info__label">
          Текущая должность
        </span>
        <span
          v-if="isEmployed"
          class="job-info__salary"
          >
          {{ formatMoney(currentSalaryPerHour) }} ₽/ч
        </span>
      </div>
      <span class="job-info__name">
        {{ currentJobName }}
      </span>
    </div>

    <div
      v-if="isEmployed"
      class="quit-action"
      >
      <GameButton
        @click="quitJob"
        label="Уволиться"
        accent-key="danger"
        small
        />
    </div>

    <p
      v-if="workResult"
      class="work-result"
      >
      {{ workResult }}
    </p>
  </RoundedPanel>
</template>

<script setup lang="ts">
import './CurrentJobPanel.scss'

import type { QuitCareerResult } from './CurrentJobPanel.types'
import { formatMoney } from '@utils/format'

const store = useGameStore()
const careerStore = useCareerStore()

const workResult = ref('')

const isEmployed = computed<boolean>(() => careerStore.isEmployed)
const reactivityTrigger = computed<number>(() => useGameStore().worldTick)
const currentJobName = computed<string>(() => careerStore.currentJob.name ?? 'Безработный')
const currentSalaryPerHour = computed<number>(() => careerStore.currentJob.salaryPerHour ?? 0)

function quitJob(): void {
  careerStore.endWork()
  const result: QuitCareerResult = store.quitCareer()
  workResult.value = result?.message ?? 'Вы уволились'
}
</script>
