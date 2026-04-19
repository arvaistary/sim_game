<template>
  <RoundedPanel class="current-job-panel">
    <!-- Reactivity trigger -->
    <span v-if="reactivityTrigger" class="sr-only">{{ reactivityTrigger }}</span>
    <div class="job-info">
      <div class="job-info__header">
        <span class="job-info__label">Текущая должность</span>
        <span v-if="isEmployed" class="job-info__salary">{{ formatMoney(currentSalaryPerHour) }} ₽/ч</span>
      </div>
      <span class="job-info__name">{{ currentJobName }}</span>
    </div>

    <div v-if="isEmployed" class="quit-action">
      <GameButton label="Уволиться" accent-key="danger" small @click="quitJob" />
    </div>

    <p v-if="workResult" class="work-result">{{ workResult }}</p>
  </RoundedPanel>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGameStore } from '@/stores/game.store'
import { useGameModal, openModal, closeModal } from '@/composables/useGameModal'
import { formatMoney } from '@/utils/format'

const store = useGameStore()
const gameModal = useGameModal()
const workResult = ref('')
const resourceModalId = ref<symbol | null>(null)

// Принудительная реактивность через computed
const reactivityTrigger = computed(() => store.worldTick)

const isEmployed = computed(() => {
  void reactivityTrigger.value
  const job = store.currentJobSnapshot
  return !!(job && job.id && job.employed)
})

const currentJobName = computed<string>(() => {
  void reactivityTrigger.value
  const job = store.currentJobSnapshot
  if (!job || !job.id || !job.employed) return 'Безработный'
  return job.name
})

const currentSalaryPerHour = computed<number>(() => {
  void reactivityTrigger.value
  const job = store.currentJobSnapshot
  if (!job || !job.id || !job.employed) return 0
  return job.salaryPerHour
})

function doWork(hours: number): void {
  const check = store.canApplyWorkShift(hours)
  if (!check.canDo) {
    gameModal.show({
      title: 'Нельзя работать',
      lines: [check.reason || 'Невозможно выполнить работу.'],
      buttons: [{ label: 'OK', accent: true }],
    })
    return
  }
  workResult.value = store.applyWorkShift(hours)
}

function quitJob(): void {
  const result = store.quitCareer()
  workResult.value = result.message
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

.work-result {
  font-size: $font-size-xs;
  white-space: pre-line;
  background: color-mix(in srgb, var(--color-pastel-green) 72%, transparent);
  padding: $space-2 $space-3;
  border-radius: var(--radius-sm);
}

.quit-action {
  margin-top: $space-2;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
