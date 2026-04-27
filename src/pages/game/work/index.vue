<template>
  <GameLayout title="Работа">
    <CurrentJobPanel />

    <CareerTrack />

    <SectionHeader
      title="Доступные вакансии"
      subtitle="Выберите подходящую ваканцию"
      />

    <div class="filter-bar">
      <div class="filter-bar__chips">
        <button
          v-for="type in types"
          :key="type.id"
          :class="{ 'chip--active': activeWorkType === type.id }"
          @click="activeWorkType = type.id"
          class="chip"
          >
          <span class="chip__icon">{{ type.icon }}</span>
          <span class="chip__label">{{ type.label }}</span>
        </button>
      </div>

      <div class="filter-bar__select-wrap">
        <select
          :value="activeIndustry"
          @change="activeIndustry = ($event.target as HTMLSelectElement).value"
          class="filter-bar__select"
          >
          <option
            v-for="industry in industries"
            :key="industry.id"
            :value="industry.id"
          >
            {{ industry.icon }} {{ industry.label }}
          </option>
        </select>
        <span class="filter-bar__arrow">
          <svg
            width="12"
            height="8"
            viewBox="0 0 12 8"
            fill="none"
            >
            <path
              d="M1 1.5L6 6.5L11 1.5"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              />
          </svg>
        </span>
      </div>
    </div>

    <div class="action-card-list">
      <RoundedPanel
        v-for="job in filteredJobs"
        :key="job.id"
        :class="{ disabled: !job.unlocked }"
        class="action-card"
        >
        <div class="card-header">
          <span class="card-title">
            {{ job.name }}
          </span>
          <span class="card-price">
            {{ formatMoney((job as any).effectiveSalaryPerHour ?? (job as any).salaryPerHour) }} ₽/ч
          </span>
        </div>

        <p class="card-effect">
          {{ job.description }}
        </p>

        <div class="card-meta">
          <span class="meta-tag">
            Уровень {{ job.level }}
          </span>
          <span class="meta-tag">
            {{ job.schedule }}
          </span>
          <span
            v-if="job.current"
            class="meta-tag meta-tag--current"
            >
            Текущая
          </span>
        </div>

        <div
          v-if="!job.unlocked"
          class="card-meta"
          >
          <span
            v-if="(job as any).missingProfessionalism > 0"
            class="meta-tag meta-tag--req"
            >
            Профессионализм: ещё {{ (job as any).missingProfessionalism }} ур.
          </span>
          <span class="meta-tag meta-tag--req">
            Образование: {{ (job as any).educationRequiredLabel }}
          </span>
        </div>

        <div class="card-footer">
          <GameButton
            v-if="job.unlocked && !job.current"
            @click="applyForJob(job)"
            label="Устроиться"
            color="var(--color-accent)"
            text-color="#fff"
            small
            />
        </div>
      </RoundedPanel>

      <EmptyState
        v-if="filteredJobs.length === 0"
        text="Нет доступных вакансий по выбранному фильтру"
        />
    </div>
  </GameLayout>
</template>

<script setup lang="ts">
import './index.scss'

import type { CareerTrackItem, CareerTrackRawEntry } from './index.types'
import type { WorkType, Industry } from '@constants/work-categories.types'
import type { QuitCareerResult } from '@stores/game.store.types'

import { formatMoney } from '@utils/format'
import { WORK_TYPES, INDUSTRIES, JOB_INDUSTRY_MAP } from '@constants/work-categories'
import CareerTrack from '@components/pages/career/CareerTrack/CareerTrack.vue'

definePageMeta({ middleware: 'game-init' })

const store = useGameStore()

const toast = useToast()

const types: WorkType[] = WORK_TYPES
const industries: Industry[] = INDUSTRIES

const activeWorkType = ref<string>('full-time')
const activeIndustry = ref<string>('all')

const careerTrack = computed<CareerTrackRawEntry[]>(() => {
  void store.worldTick

  return store.getCareerTrack()
})

const currentWorkType = computed<WorkType>(() =>
  WORK_TYPES.find(t => t.id === activeWorkType.value) ?? WORK_TYPES[0]!
)

const filteredJobs = computed<CareerTrackItem[]>(() => {
  const jobs: CareerTrackItem[] = careerTrack.value as CareerTrackItem[]

  return jobs.filter(job => {
    const scheduleMatches: boolean = currentWorkType.value.scheduleFilter.includes(job.schedule)
    const industryId: string = JOB_INDUSTRY_MAP[job.id] ?? 'all'
    const industryMatches: boolean = activeIndustry.value === 'all' || industryId === activeIndustry.value

    return scheduleMatches && industryMatches
  })
})

function applyForJob(job: CareerTrackItem): void {
  const result: QuitCareerResult = store.changeCareer(job.id)

  if (result.success) {
    toast.showSuccess(result.message)
  } else {
    toast.showWarning(result.message)
  }
}
</script>
