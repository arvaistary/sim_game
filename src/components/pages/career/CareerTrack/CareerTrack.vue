<template>
  <div class="career-track-wrapper">
    <h3 class="section-title">Доступные вакансии</h3>

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
          @change="handleIndustryChange"
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
            {{ formatMoney((job.effectiveSalaryPerHour ?? job.salaryPerHour)) }} ₽/ч
          </span>
        </div>

        <p
          v-if="job.description"
          class="card-effect"
          >
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
            v-if="job.missingProfessionalism && job.missingProfessionalism > 0"
            class="meta-tag meta-tag--req"
            >
            Профессионализм: ещё {{ job.missingProfessionalism }} ур.
          </span>
          <span class="meta-tag meta-tag--req">
            Образование: {{ job.educationRequiredLabel ?? 'Неизвестно' }}
          </span>
        </div>

        <div class="card-footer">
          <GameButton
            v-if="job.unlocked && !job.current"
            @click="takeJob(job)"
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
  </div>
</template>

<script setup lang="ts">
import './CareerTrack.scss'

import type { CareerTrackJob } from './CareerTrack.types'
import type { EducationLevel } from '@stores/education-store'
import type { Industry, IndustryId, WorkType } from '@constants/work-categories.types'
import { RANK_LABELS } from '@stores/education-store'

import { CAREER_JOBS } from '@domain/balance/constants/career-jobs'
import { WORK_TYPES, INDUSTRIES, resolveJobIndustry } from '@constants/work-categories'

import { formatMoney } from '@utils/format'

const emit: boolean = defineEmits<{
  apply: [job: CareerTrackJob]
}>()

const props: boolean = defineProps<{
  jobs?: CareerTrackJob[]
}>()

const skillsStore = useSkillsStore()
const educationStore = useEducationStore()
const careerStore = useCareerStore()

const types: WorkType[] = WORK_TYPES
const industries: Industry[] = INDUSTRIES

const activeWorkType = ref<string>('full-time')
const activeIndustry = ref<IndustryId>('all')

const careerTrack = computed<CareerTrackJob[]>(() => {

  if (props.jobs !== undefined) {
    return props.jobs
  }

  const currentJobId: string = careerStore.currentJob?.id ?? ''
  const educationRank: number = educationStore.educationRank
  const professionalism: number = skillsStore.skills?.professionalism?.level ?? 0

  return CAREER_JOBS.map(job => {
    const educationRequiredLabel: string = job.minEducationRank === -1
      ? 'Любое'
      : RANK_LABELS[job.minEducationRank as unknown as EducationLevel] ?? 'Неизвестно'

    const missing: number = job.minProfessionalism - professionalism
    const unlocked: boolean = professionalism >= job.minProfessionalism && educationRank >= job.minEducationRank

    return {
      id: job.id,
      name: job.name,
      level: job.level,
      schedule: job.schedule,
      salaryPerHour: job.salaryPerHour,
      current: job.id === currentJobId,
      unlocked,
      missingProfessionalism: Math.max(0, missing),
      educationRequiredLabel,
      description: job.description,
    }
  })
})

const currentWorkType = computed<WorkType>(() =>
  WORK_TYPES.find(t => t.id === activeWorkType.value) ?? WORK_TYPES[0]!
)

const filteredJobs = computed<CareerTrackJob[]>(() => {
  const jobOrder: boolean = new Map<string, number>()

  careerTrack.value.forEach((job: CareerTrackJob, index: number) => {
    jobOrder.set(job.id, index)
  })

  return careerTrack.value
    .filter(job => {
      const scheduleMatches: boolean = currentWorkType.value.scheduleFilter.includes(job.schedule)
      const industryId: IndustryId = resolveJobIndustry(job.id)
      const industryMatches: boolean = activeIndustry.value === 'all' || industryId === activeIndustry.value

      return scheduleMatches && industryMatches
    })
    .sort((left: CareerTrackJob, right: CareerTrackJob): number => {
      const leftPriority: number = left.current ? 0 : left.unlocked ? 1 : 2
      const rightPriority: number = right.current ? 0 : right.unlocked ? 1 : 2

      if (leftPriority !== rightPriority) return leftPriority - rightPriority

      return (jobOrder.get(left.id) ?? 0) - (jobOrder.get(right.id) ?? 0)
    })
})

function takeJob(job: CareerTrackJob): void {
  if (!job.unlocked || job.current) return

  emit('apply', job)
}

function handleIndustryChange(event: Event): void {
  const target: HTMLSelectElement = event.target as HTMLSelectElement

  activeIndustry.value = target.value as IndustryId
}
</script>

