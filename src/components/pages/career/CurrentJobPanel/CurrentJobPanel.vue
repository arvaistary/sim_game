<template>
  <RoundedPanel class="current-job-panel" padding="15px 19px">
    <!-- Reactivity trigger -->
    <span v-if="reactivityTrigger" class="sr-only">
      {{ reactivityTrigger }}
    </span>

    <span class="current-job-panel__label">
      Текущая должность
    </span>

    <span v-if="isEmployed" class="current-job-panel__salary">
      {{ formatMoney(currentSalaryPerHour) }} ₽/ч
    </span>

    <h2 class="current-job-panel__title">
      {{ currentJobName }}
    </h2>

    <div v-if="isEmployed" class="current-job-panel__actions">
      <GameButton label="Уволиться" variant="secondary" small @click="quitJob" />
    </div>

    <p v-if="workResult" class="current-job-panel__result">
      {{ workResult }}
    </p>
  </RoundedPanel>
</template>

<script setup lang="ts">
import type { ComputedRef } from 'vue'
import { formatMoney } from '@/utils/format'
import type { QuitCareerResult } from '@/stores/game.store.types'
import './CurrentJobPanel.scss'

const emit = defineEmits<{
  quit: []
}>()

const store = useGameStore()

const careerStore = useCareerStore()

const toast = useToast()

const workResult = ref('')

const isEmployed: ComputedRef<boolean> = computed(() => careerStore.isEmployed)
const reactivityTrigger: ComputedRef<number> = computed(() => useGameStore().worldTick)
const currentJobName: ComputedRef<string> = computed(() => careerStore.currentJob?.name ?? 'Безработный')
const currentSalaryPerHour: ComputedRef<number> = computed(() => careerStore.currentJob?.salaryPerHour ?? 0)

async function quitJob(): Promise<void> {
  try {
    const result: QuitCareerResult = await store.quitCareerAsync()

    if (result.success) {
      workResult.value = result.message ?? 'Вы уволились'
      toast.showSuccess(result.message ?? 'Вы уволились')
      emit('quit')
    } else {
      toast.showWarning(result.message ?? 'Не удалось уволиться')
    }
  } catch (error: unknown) {
    const message: string = error instanceof Error ? error.message : 'Не удалось уволиться'
    toast.showWarning(message)
  }
}
</script>
