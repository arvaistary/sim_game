<template>
  <RoundedPanel class="day-planner">
    <div class="day-planner__header">
      <div>
        <h2 class="day-planner__title">План дня</h2>
        <p class="day-planner__meta">
          Осталось часов: {{ formatHours(dayHoursRemaining) }}
          <span v-if="dayHoursSpent > 0"> · Потрачено сегодня: {{ formatHours(dayHoursSpent) }} ч</span>
        </p>
      </div>
      <button class="day-planner__reset" type="button" @click="planner.resetPlan">Сбросить</button>
    </div>

    <div class="day-planner__section">
      <h3>Сон</h3>
      <div class="day-planner__presets">
        <GameButton
          v-for="hours in sleepPresets"
          :key="hours"
          :label="`${hours} ч`"
          :variant="plan.sleepHours === hours ? 'primary' : 'secondary'"
          small
          @click="planner.setSleepHours(hours)"
        />
      </div>
      <p class="day-planner__sleep-hint">{{ sleepGuidance }}</p>
      <p v-if="sleepDebtWarning" class="day-planner__warning">Недостаток сна усилит последствия усталости.</p>
    </div>

    <div v-if="careerStore.currentJob?.employed" class="day-planner__section">
      <h3>Работа</h3>
      <div class="day-planner__presets">
        <GameButton
          v-for="hours in workPresets"
          :key="hours"
          :label="`${hours} ч`"
          :variant="plan.workHours === hours ? 'primary' : 'secondary'"
          small
          @click="planner.setWorkHours(hours)"
        />
      </div>
    </div>

    <div class="day-planner__section">
      <h3>Свободные действия · {{ plannedActionHours }} ч из {{ freeActionHoursBudget }} ч</h3>
      <ul v-if="plan.actionIds.length" class="day-planner__actions">
        <li
          v-for="(actionId, actionIndex) in plan.actionIds"
          :key="`${actionId}-${actionIndex}`"
        >
          <span>{{ planner.getActionTitle(actionId) }}</span>
          <button type="button" @click="planner.removeFreeActionAt(actionIndex)">Убрать</button>
        </li>
      </ul>
      <p v-else class="day-planner__empty">Добавьте действия из каталога.</p>
      <p
        v-if="freeActionHoursRemaining === 0 && freeActionHoursBudget > 0"
        class="day-planner__meta"
      >Свободные часы дня распределены.</p>
    </div>

    <GameButton class="day-planner__confirm" label="Прожить день" :disabled="!canConfirm" accent-key="accent" @click="confirm" />
    <p v-if="!canConfirm" class="day-planner__warning">План превышает доступное время или содержит неподдерживаемые параметры.</p>

    <button
      v-if="hasDeferredEventBadge"
      class="day-planner__events-badge"
      type="button"
      @click="openEventsPage"
    >
      События ждут решения: {{ pendingEventsCount }}
    </button>
  </RoundedPanel>
</template>

<script setup lang="ts">
import { useDayPlanner } from '@/composables/useDayPlanner'
import { useTime } from '@/composables/useTime'
import { useWorkShiftOptions } from '@/composables/useWorkShiftOptions'
import { useCareerStore } from '@/stores/career-store'
import { showGameResultModal } from '@/composables/useGameModal'
import { SLEEP_GUIDANCE, SLEEP_PRESETS } from '@/config/day-planner'
import type { DayPlanResult, DayPlanStepResult } from '@/domain/game-world/commands/commands.types'
import './DayPlannerPanel.scss'

const planner: ReturnType<typeof useDayPlanner> = useDayPlanner()

const plan = planner.plan

const { canConfirm, plannedActionHours, freeActionHoursBudget, freeActionHoursRemaining, sleepDebtWarning, hasDeferredEventBadge, pendingEventsCount } = planner
const { dayHoursRemaining, dayHour } = useTime()
const careerStore: ReturnType<typeof useCareerStore> = useCareerStore()

const dayHoursSpent: ComputedRef<number> = computed<number>(() => dayHour.value)

const { workOptions }: ReturnType<typeof useWorkShiftOptions> = useWorkShiftOptions()

const sleepPresets: readonly number[] = SLEEP_PRESETS
const sleepGuidance: ComputedRef<string> = computed<string>(() => SLEEP_GUIDANCE[plan.value.sleepHours] ?? 'Выбери комфортный ритм сна.')
const workPresets: ComputedRef<number[]> = computed<number[]>(() => workOptions.value
  ? [workOptions.value.oneDayHours].filter((hours: number) => hours > 0)
  : [])
async function confirm(): Promise<void> {
  const dayResult: DayPlanResult | null = await planner.confirmDay()

  if (!dayResult) return

  showDayPlanResultModal(dayResult)
  planner.clearResult()
}

function showDayPlanResultModal(dayResult: DayPlanResult): void {
  const lines: string[] = []
  const hasCompletedStep: boolean = dayResult.steps.some((step: DayPlanStepResult) => step.success)

  if (!dayResult.success) {
    lines.push(dayResult.message)
  }

  lines.push(`Потрачено: ${formatHours(dayResult.totalHoursSpent)} ч, нейтрально: ${formatHours(dayResult.idleHours)} ч`)
  lines.push(`Деньги: ${formatDelta(dayResult.moneyDelta)}`)

  const statLine: string = formatStatChanges(dayResult.statChanges)

  if (statLine) {
    lines.push(`Статы: ${statLine}`)
  }

  for (const step of dayResult.steps) {
    if (!step.success) {
      lines.push(step.message)
    }
  }

  showGameResultModal(
    dayResult.success ? 'День завершён' : hasCompletedStep ? 'День выполнен частично' : 'План отклонён',
    lines.join('\n'),
  )
}

function openEventsPage(): void {
  navigateTo('/game/events')
}

function formatDelta(value: number): string {
  return value > 0 ? `+${value}` : String(value)
}

function formatHours(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function formatStatChanges(changes: Record<string, number | undefined>): string {
  const entries: string[] = Object.entries(changes)
    .filter((entry: [string, number | undefined]) => typeof entry[1] === 'number')
    .map(([key, value]: [string, number | undefined]) => `${key}: ${value && value > 0 ? '+' : ''}${value}`)
  return entries.length > 0 ? entries.join(', ') : 'нет изменений'
}
</script>
