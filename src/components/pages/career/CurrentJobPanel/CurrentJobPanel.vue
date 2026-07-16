<template>
  <RoundedPanel class="current-job-panel">
    <!-- Reactivity trigger -->
    <span v-if="reactivityTrigger" class="sr-only">
      {{ reactivityTrigger }}
    </span>
    <div class="job-info">
      <div class="job-info__header">
        <span class="job-info__label">
          Текущая должность
        </span>
        <span v-if="isEmployed" class="job-info__salary">
          {{ formatMoney(currentSalaryPerHour) }} ₽/ч
        </span>
      </div>
      <span class="job-info__name">
        {{ currentJobName }}
      </span>
    </div>

    <div v-if="isEmployed" class="quit-action">
      <GameButton label="Уволиться" accent-key="danger" small @click="quitJob" />
    </div>

    <p v-if="workResult" class="work-result">
      {{ workResult }}
    </p>
  </RoundedPanel>
</template>

<script setup lang="ts">
import type { ComputedRef } from 'vue'
import { formatMoney } from '@/utils/format'
import type { QuitCareerResult } from '@/stores/game.store.types'
import './CurrentJobPanel.scss'

const store = useGameStore()

const careerStore = useCareerStore()

const workResult = ref('')

const isEmployed: ComputedRef<boolean> = computed(() => careerStore.isEmployed)
const reactivityTrigger: ComputedRef<number> = computed(() => useGameStore().worldTick)
const currentJobName: ComputedRef<string> = computed(() => careerStore.currentJob?.name ?? 'Безработный')
const currentSalaryPerHour: ComputedRef<number> = computed(() => careerStore.currentJob?.salaryPerHour ?? 0)

async function quitJob(): Promise<void> {
  const result: QuitCareerResult = await store.quitCareerAsync()

  workResult.value = result?.message ?? 'Вы уволились'
}
</script>
