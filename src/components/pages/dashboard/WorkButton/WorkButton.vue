<template>
  <div class="action-section">
    <button class="action-button" @click="handleWorkClick">
      <span class="action-button__label">Пойти на работу</span>
      <span class="action-button__subtitle">обменять своё здоровье на деньги</span>
    </button>

    <Modal :is-open="isWorkChoiceModalOpen" title="Рабочая смена" @close="closeWorkChoiceModal">
      <div v-if="workOptions" class="work-modal">
        <p class="work-modal__line"><strong>Должность:</strong> {{ workOptions.jobName }}</p>
        <p class="work-modal__line"><strong>График:</strong> {{ workOptions.schedule }}</p>
        <p class="work-modal__line"><strong>Один рабочий день:</strong> {{ workOptions.dailyHours }} ч</p>
        <p class="work-modal__line"><strong>Норма недели:</strong> {{ workOptions.requiredHoursPerWeek }} ч</p>
        <p class="work-modal__line"><strong>Отработано:</strong> {{ workOptions.workedHoursCurrentWeek }} ч</p>
        <p class="work-modal__line"><strong>Осталось:</strong> {{ workOptions.remainingHoursCurrentWeek }} ч</p>
      </div>

      <template #actions>
        <GameButton
          :disabled="isWorkInProgress || !canStartOneDayShift"
          :label="`1 день (${workOptions?.oneDayHours ?? 0} ч)`"
          @click="runShift(workOptions?.oneDayHours ?? 0)"
        />
        <GameButton
          :disabled="isWorkInProgress || !canStartFullShift"
          :label="`Вся смена (${workOptions?.fullShiftHours ?? 0} ч)`"
          color="var(--color-action-secondary)"
          @click="runShift(workOptions?.fullShiftHours ?? 0)"
        />
      </template>
    </Modal>

    <Modal :is-open="isWorkResultModalOpen" title="Итоги смены" @close="closeWorkResultModal">
      <p class="work-modal__result">{{ workSummary }}</p>
      <div v-if="statDiffs.length > 0" class="work-modal__stats">
        <p class="work-modal__stats-title">Изменения характеристик:</p>
        <ul class="work-modal__stats-list">
          <li v-for="diff in statDiffs" :key="diff.key" class="work-modal__stats-item">
            <span>{{ diff.label }}</span>
            <span :class="getDeltaClass(diff.delta)">
              {{ formatDelta(diff.delta) }}
            </span>
          </li>
        </ul>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import GameButton from '@/components/ui/GameButton/index.vue'
import Modal from '@/components/ui/Modal/index.vue'
import { useGameStore } from '@/stores/game.store'
import { useGameModal } from '@/composables/useGameModal'
import type { WorkOptions, WorkSnapshot, WorkStatDefinition, WorkStatDiff, WorkStatSnapshot } from './WorkButton.types'

const store = useGameStore()
const gameModal = useGameModal()

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

const isWorkChoiceModalOpen = ref<boolean>(false)
const isWorkResultModalOpen = ref<boolean>(false)
const isWorkInProgress = ref<boolean>(false)
const workSummary = ref<string>('')
const statDiffs = ref<WorkStatDiff[]>([])

const currentWork = computed<WorkSnapshot | null>(() => {
  const job = store.currentJobSnapshot
  if (!job) return null

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
        { label: 'Найти работу', route: '/game/career', accent: true },
      ],
    })
    return
  }

  isWorkChoiceModalOpen.value = true
}

function closeWorkChoiceModal(): void {
  isWorkChoiceModalOpen.value = false
}

function closeWorkResultModal(): void {
  isWorkResultModalOpen.value = false
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
  const job = store.currentJobSnapshot

  return {
    money: store.money,
    energy: store.energy,
    hunger: store.hunger,
    stress: store.stress,
    mood: store.mood,
    health: store.health,
    physical: store.physical,
    workedHoursCurrentWeek: job?.workedHoursCurrentWeek ?? 0,
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
  const summary = store.applyWorkShift(hours)
  const afterSnapshot = createWorkStatSnapshot()
  isWorkInProgress.value = false

  workSummary.value = summary || 'Смена завершена.'
  statDiffs.value = buildDiffs(beforeSnapshot, afterSnapshot)

  isWorkChoiceModalOpen.value = false
  isWorkResultModalOpen.value = true
}

function formatDelta(delta: number): string {
  return delta > 0 ? `+${delta}` : `${delta}`
}

function getDeltaClass(delta: number): string {
  return delta >= 0 ? 'work-modal__delta--positive' : 'work-modal__delta--negative'
}
</script>

<style scoped lang="scss" src="./WorkButton.scss"></style>
