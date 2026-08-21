<template>
  <RoundedPanel :class="['day-summary', `day-summary--${dayRhythm.tone}`]">
    <div class="day-summary__header">
      <div>
        <p class="day-summary__eyebrow">Ритм дня</p>
        <h2 class="day-summary__title">{{ dayRhythm.title }}</h2>
        <p class="day-summary__intro">{{ dayRhythm.intro }}</p>
      </div>
      <span class="day-summary__mood" aria-hidden="true">
        <GameIcon :name="dayRhythm.moodIcon" :size="20" :stroke-width="1.5" />
      </span>
    </div>

    <div class="day-summary__metrics">
      <div class="day-summary__metric">
        <span class="day-summary__metric-label">Сон</span>
        <strong>{{ plan.sleepHours }} ч</strong>
        <span>{{ sleepGuidance }}</span>
      </div>
      <div v-if="isEmployed" class="day-summary__metric">
        <span class="day-summary__metric-label">Работа</span>
        <strong>{{ formatHours(plan.workHours ?? 0) }} ч</strong>
        <span>рабочий день</span>
      </div>
      <div class="day-summary__metric">
        <span class="day-summary__metric-label">Свободно</span>
        <strong>{{ formatHours(freeActionHoursRemaining) }} ч</strong>
        <span>для своих дел</span>
      </div>
    </div>

    <div class="day-summary__footer">
      <div class="day-summary__remaining" aria-label="Баланс времени">
        <span class="day-summary__time-item">
          <span class="day-summary__time-label">До конца дня</span>
          <strong>{{ formatHours(dayHoursRemaining) }} ч</strong>
        </span>
        <span class="day-summary__time-item">
          <span class="day-summary__time-label">План занимает</span>
          <strong>{{ formatHours(plannedHours) }} ч</strong>
        </span>
        <span class="day-summary__time-item">
          <span class="day-summary__time-label">Запас после плана</span>
          <strong>{{ formatHours(freeActionHoursRemaining) }} ч</strong>
        </span>
      </div>
      <div class="day-summary__actions">
        <GameButton label="Посмотреть план" variant="secondary" small @click="openPlan" />
        <GameButton label="Прожить день" small :disabled="!canConfirm" @click="confirm" />
      </div>
    </div>

    <p v-if="!canConfirm" class="day-summary__warning">
      В плане больше часов, чем осталось в сегодняшнем дне.
    </p>
    <button
      v-if="hasDeferredEventBadge"
      class="day-summary__events"
      type="button"
      @click="openEventsPage"
    >
      События ждут решения · {{ pendingEventsCount }}
    </button>
  </RoundedPanel>
</template>

<script setup lang="ts">
import { useDayPlanner } from '@/composables/useDayPlanner'
import { useTime } from '@/composables/useTime'
import { useCareerStore } from '@/stores/career-store'
import { SLEEP_GUIDANCE } from '@/config/day-planner'
import { showGameResultModal } from '@/composables/useGameModal'
import type { DayPlanResult } from '@/domain/game-world/commands/commands.types'
import { useStatsStore } from '@/stores/stats-store'
import { getDayRhythm } from './day-rhythm'
import type { DayRhythm } from './DayPlannerSummary.types'
import './DayPlannerSummary.scss'

const planner = useDayPlanner()

const { plan } = planner

const { canConfirm, freeActionHoursRemaining, hasDeferredEventBadge, pendingEventsCount, plannedActionHours } = planner
const { dayHoursRemaining } = useTime()
const careerStore = useCareerStore()

const statsStore = useStatsStore()

const isEmployed = computed<boolean>(() => Boolean(careerStore.currentJob?.employed))
const plannedHours = computed<number>(() => plan.value.sleepHours + (plan.value.workHours ?? 0) + plannedActionHours.value)
const sleepGuidance = computed<string>(() => SLEEP_GUIDANCE[plan.value.sleepHours] ?? 'Выбери комфортный ритм сна.')
const dayRhythm = computed<DayRhythm>(() => getDayRhythm({
  availableHours: dayHoursRemaining.value,
  plannedHours: plannedHours.value,
  freeHours: freeActionHoursRemaining.value,
  stats: {
    energy: statsStore.energy,
    health: statsStore.health,
    hunger: statsStore.hunger,
    stress: statsStore.stress,
    mood: statsStore.mood,
    physical: statsStore.physical,
  },
}))

async function confirm(): Promise<void> {
  const result: DayPlanResult | null = await planner.confirmDay()

  if (!result) return

  showGameResultModal(
    result.success ? 'День завершён' : 'План отклонён',
    result.success
      ? `Потрачено ${formatHours(result.totalHoursSpent)} ч. Спокойно закрыто: ${formatHours(result.idleHours)} ч.`
      : result.message,
  )
  planner.clearResult()
}

function openPlan(): void {
  navigateTo('/game/plan')
}

function openEventsPage(): void {
  navigateTo('/game/events')
}

function formatHours(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}
</script>
