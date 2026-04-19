<template>
  <RoundedPanel class="current-job-panel">
    <div class="job-info">
      <div class="job-info__header">
        <span class="job-info__label">Текущая должность</span>
        <span v-if="isEmployed" class="job-info__salary">{{ formatMoney(currentSalaryPerHour) }} ₽/ч</span>
      </div>
      <span class="job-info__name">{{ currentJobName }}</span>
    </div>

    <div v-if="isEmployed" class="shift-actions">
      <GameButton label="Смена 8 ч" accent-key="accent" @click="doWork(8)" />
      <GameButton label="Смена 4 ч" accent-key="sage" @click="doWork(4)" />
    </div>

    <p v-if="workResult" class="work-result">{{ workResult }}</p>
  </RoundedPanel>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGameStore } from '@/stores/game.store'
import { formatMoney } from '@/utils/format'

const store = useGameStore()
const workResult = ref('')

const isEmployed = computed(() => {
  const job = store.currentJobSnapshot
  return !!(job && job.id && job.employed)
})

const currentJobName = computed<string>(() => {
  const job = store.currentJobSnapshot
  if (!job || !job.id || !job.employed) return 'Безработный'
  return job.name
})

const currentSalaryPerHour = computed<number>(() => {
  const job = store.currentJobSnapshot
  if (!job || !job.id || !job.employed) return 0
  return job.salaryPerHour
})

function doWork(hours: number): void {
  workResult.value = store.applyWorkShift(hours)
}
</script>

<style scoped lang="scss">
@use '@/assets/scss/variables.scss' as *;

.current-job-panel {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.job-info {
  display: flex;
  flex-direction: column;
  gap: $space-1;
}

.job-info__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.job-info__label {
  font-size: $font-size-xs;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.job-info__salary {
  font-size: $font-size-sm;
  color: var(--color-brand-accent);
  font-weight: $font-weight-bold;
}

.job-info__name {
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
}

.shift-actions {
  display: flex;
  gap: $space-2;
}

.work-result {
  font-size: $font-size-xs;
  white-space: pre-line;
  background: color-mix(in srgb, var(--color-pastel-green) 72%, transparent);
  padding: $space-2 $space-3;
  border-radius: var(--radius-sm);
}
</style>
