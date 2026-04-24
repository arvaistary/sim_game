<template>
  <div v-if="isVisible" class="action-section">
    <button class="action-button" @click="handleWorkClick">
      <span class="action-button__label">Пойти на работу</span>
      <span class="action-button__subtitle">обменять своё здоровье на деньги</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import './WorkButton.scss'

import WorkChoiceModal from '../WorkChoiceModal/WorkChoiceModal.vue'

import WorkResultModal from '../WorkResultModal/WorkResultModal.vue'
import type { WorkStatDefinition, WorkStatDiff, WorkSnapshot, WorkOptions, WorkStatSnapshot } from './WorkButton.types'

const careerStore = useCareerStore()
const statsStore = useStatsStore()
const walletStore = useWalletStore()
const gameStore = useGameStore()

const { isTabVisible } = useAgeRestrictions()
const gameModal = useGameModal()
const isVisible = computed(() => isTabVisible('career'))

const STAT_DEFINITIONS: WorkStatDefinition[] = [
  { key: 'money', label: 'Деньги' },
  { key: 'energy', label: 'Энергия' },
  { key: 'hunger', label: 'Голод' },
  { key: 'stress', label: 'Стресс' },
  { key: 'mood', label: 'Настроение' },
  { key: 'health', label: 'Здоровье' },
  { key: 'physical', label: 'Физическая форма' },
  { key: 'workedHoursCurrentWeek', label: 'Рабочие часы за неделю' },
]

const isWorkInProgress = ref<boolean>(false)
const workSummary = ref<string>('')
const statDiffs = ref<WorkStatDiff[]>([])
let workChoiceModalId: symbol | null = null
let workResultModalId: symbol | null = null

const currentWork = computed<WorkSnapshot | null>(() => {
  const job = careerStore.currentJob
  if (!job || !job.id) return null

  return {
    id: job.id,
    name: job.name,
    schedule: job.schedule,
    employed: job.employed,
    salaryPerHour: job.salaryPerHour,
    salaryPerDay: job.salaryPerDay,
    requiredHoursPerWeek: job.requiredHoursPerWeek,
    workedHoursCurrentWeek: job.workedHoursCurrentWeek,
  }
})

const workOptions = computed<WorkOptions | null>(() => {
  const work = currentWork.value
  if (!work || !work.employed) return null

  const dailyHours = resolveDailyHours(work)
  const requiredHoursPerWeek = Math.max(0, work.requiredHoursPerWeek)
  const workedHoursCurrentWeek = Math.max(0, work.workedHoursCurrentWeek)
  const remainingHoursCurrentWeek = requiredHoursPerWeek > 0
    ? Math.max(0, requiredHoursPerWeek - workedHoursCurrentWeek)
    : dailyHours
  const oneDayHours = remainingHoursCurrentWeek > 0 ? Math.min(dailyHours, remainingHoursCurrentWeek) : 0
  const fullShiftHours = remainingHoursCurrentWeek > 0 ? remainingHoursCurrentWeek : 0

  return {
    jobName: work.name,
    schedule: work.schedule,
    dailyHours,
    oneDayHours,
    fullShiftHours,
    requiredHoursPerWeek,
    workedHoursCurrentWeek,
    remainingHoursCurrentWeek,
  }
})

const canStartOneDayShift = computed<boolean>(() => {
  return Boolean(workOptions.value && workOptions.value.oneDayHours > 0)
})

const canStartFullShift = computed<boolean>(() => {
  return Boolean(workOptions.value && workOptions.value.fullShiftHours > 0)
})

function handleWorkClick(): void {
  if (!currentWork.value?.employed) {
    gameModal.show({
      title: 'Нет работы',
      lines: [
        'У вас пока нет работы.',
        'Сначала устройтесь на работу, чтобы начать зарабатывать.',
      ],
      buttons: [
        { label: 'Найти работу', route: '/game/work', accent: true },
      ],
    })

    return
  }

  workChoiceModalId = openModal(WorkChoiceModal, {
    workOptions: workOptions.value,
    isWorkInProgress: isWorkInProgress.value,
    canStartOneDayShift: canStartOneDayShift.value,
    canStartFullShift: canStartFullShift.value,
    onClose: () => {
      workChoiceModalId = null
    },
    onRunShift: (hours: number) => {
      runShift(hours)
    },
  })
}

function resolveDailyHours(work: WorkSnapshot): number {
  if (work.salaryPerHour > 0 && work.salaryPerDay > 0) {
    return Math.max(1, Math.round(work.salaryPerDay / work.salaryPerHour))
  }

  const [workDaysRaw] = work.schedule.split('/')
  const workDays = Math.max(1, Number(workDaysRaw) || 1)
  const bySchedule = work.requiredHoursPerWeek > 0
    ? Math.round(work.requiredHoursPerWeek / workDays)
    : 8

  return Math.max(1, bySchedule)
}

function createWorkStatSnapshot(): WorkStatSnapshot {
  return {
    money: walletStore.money,
    energy: statsStore.energy,
    hunger: statsStore.hunger,
    stress: statsStore.stress,
    mood: statsStore.mood,
    health: statsStore.health,
    physical: statsStore.physical,
    workedHoursCurrentWeek: careerStore.currentJob?.workedHoursCurrentWeek ?? 0,
  }
}

function buildDiffs(beforeState: WorkStatSnapshot, afterState: WorkStatSnapshot): WorkStatDiff[] {
  return STAT_DEFINITIONS
    .map((definition) => {
      const beforeValue = beforeState[definition.key]
      const afterValue = afterState[definition.key]
      const delta = afterValue - beforeValue

      return {
        key: definition.key,
        label: definition.label,
        before: beforeValue,
        after: afterValue,
        delta,
      }
    })
    .filter((diff) => diff.delta !== 0)
}

function runShift(hours: number): void {
  if (!hours || hours <= 0 || isWorkInProgress.value) return

  isWorkInProgress.value = true
  const beforeSnapshot = createWorkStatSnapshot()
  const summary = gameStore.applyWorkShift(hours)
  const afterSnapshot = createWorkStatSnapshot()
  isWorkInProgress.value = false

  workSummary.value = summary || 'Смена завершена.'
  statDiffs.value = buildDiffs(beforeSnapshot, afterSnapshot)

  if (workChoiceModalId) {
    closeModal(workChoiceModalId)
    workChoiceModalId = null
  }

  workResultModalId = openModal(WorkResultModal, {
    workSummary: workSummary.value,
    statDiffs: statDiffs.value,
    onClose: () => {
      workResultModalId = null
    },
  })
}
</script>

