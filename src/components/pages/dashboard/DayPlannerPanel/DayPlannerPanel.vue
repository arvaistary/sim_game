<template>
  <RoundedPanel class="day-planner">
    <div class="day-planner__header">
      <div>
        <h2 class="day-planner__title">План дня</h2>
        <p class="day-planner__meta">Осталось часов: {{ dayHoursRemaining }}</p>
      </div>
      <button class="day-planner__reset" type="button" @click="planner.resetPlan">Сбросить</button>
    </div>

    <div class="day-planner__section">
      <h3>Сон</h3>
      <div class="day-planner__presets">
        <GameButton v-for="hours in sleepPresets" :key="hours" :label="`${hours} ч`" :variant="plan.sleepHours === hours ? 'primary' : 'secondary'" small @click="planner.setSleepHours(hours)" />
      </div>
      <p v-if="sleepDebtWarning" class="day-planner__warning">Недостаток сна усилит последствия усталости.</p>
    </div>

    <div v-if="careerStore.currentJob?.employed" class="day-planner__section">
      <h3>Работа</h3>
      <div class="day-planner__presets">
        <GameButton v-for="hours in workPresets" :key="hours" :label="`${hours} ч`" :variant="plan.workHours === hours ? 'primary' : 'secondary'" small @click="planner.setWorkHours(hours)" />
      </div>
    </div>

    <div class="day-planner__section">
      <h3>Свободные действия ({{ plan.actionIds.length }}/3)</h3>
      <ul v-if="plan.actionIds.length" class="day-planner__actions">
        <li v-for="actionId in plan.actionIds" :key="actionId">
           <span>{{ planner.getActionTitle(actionId) }}</span>
          <button type="button" @click="planner.removeFreeAction(actionId)">Убрать</button>
        </li>
      </ul>
      <p v-else class="day-planner__empty">Добавьте действия из каталога.</p>
    </div>

    <GameButton label="Прожить день" :disabled="!canConfirm" accent-key="accent" @click="confirm" />
    <p v-if="!canConfirm" class="day-planner__warning">План превышает доступное время или содержит неподдерживаемые параметры.</p>

    <div v-if="result" class="day-planner__result">
      <strong>{{ result.success ? 'День завершён' : 'План отклонён' }}</strong>
      <span v-if="!result.success">{{ result.message }}</span>
      <span>Потрачено: {{ result.totalHoursSpent }} ч, нейтрально: {{ result.idleHours }} ч</span>
      <span>Деньги: {{ formatDelta(result.moneyDelta) }}</span>
      <span>Статы: {{ formatStatChanges(result.statChanges) }}</span>
      <ul v-if="failedSteps.length" class="day-planner__skipped">
        <li v-for="step in failedSteps" :key="`${step.kind}-${step.actionId ?? 'none'}`">{{ step.message }}</li>
      </ul>
    </div>
  </RoundedPanel>
</template>

<script setup lang="ts">
import { useDayPlanner } from '@/composables/useDayPlanner'
import { useTime } from '@/composables/useTime'
import { useWorkShiftOptions } from '@/composables/useWorkShiftOptions'
import { useCareerStore } from '@/stores/career-store'
import type { DayPlanStepResult } from '@/composables/useDayPlanner'

const planner: ReturnType<typeof useDayPlanner> = useDayPlanner()
const { plan, result, canConfirm, sleepDebtWarning } = planner
const { dayHoursRemaining } = useTime()
const careerStore: ReturnType<typeof useCareerStore> = useCareerStore()

const { workOptions }: ReturnType<typeof useWorkShiftOptions> = useWorkShiftOptions()

const sleepPresets: number[] = [4, 7, 10]
const workPresets: ComputedRef<number[]> = computed<number[]>(() => workOptions.value ? [workOptions.value.oneDayHours, workOptions.value.fullShiftHours].filter((hours: number, index: number, values: number[]) => hours > 0 && values.indexOf(hours) === index) : [])
const failedSteps: ComputedRef<DayPlanStepResult[]> = computed<DayPlanStepResult[]>(() => planner.result.value?.steps.filter((step: DayPlanStepResult) => !step.success) ?? [])

async function confirm(): Promise<void> {
  await planner.confirmDay()
}

function formatDelta(value: number): string {
  return value > 0 ? `+${value}` : String(value)
}

function formatStatChanges(changes: Record<string, number | undefined>): string {
  const entries: string[] = Object.entries(changes)
    .filter((entry: [string, number | undefined]) => typeof entry[1] === 'number')
    .map(([key, value]: [string, number | undefined]) => `${key}: ${value && value > 0 ? '+' : ''}${value}`)
  return entries.length > 0 ? entries.join(', ') : 'нет изменений'
}
</script>

<style scoped lang="scss" src="./DayPlannerPanel.scss"></style>
