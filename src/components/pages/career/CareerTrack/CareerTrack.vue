<template>
  <div class="career-track-wrapper">
    <h3 class="section-title">Карьерный путь</h3>
    <div class="career-track">
      <RoundedPanel
        v-for="job in careerTrack"
        :key="job.id"
        class="job-card"
        :class="{ current: job.current, locked: !job.unlocked, clickable: job.unlocked && !job.current }"
        :clickable="job.unlocked && !job.current"
        @click="takeJob(job)"
      >
        <div class="job-header">
          <span class="job-title">{{ job.name }}</span>
          <span v-if="job.current" class="badge current-badge">Текущая</span>
          <span v-else-if="job.unlocked" class="badge unlock-badge">Доступна</span>
          <span v-else class="badge lock-badge">🔒</span>
        </div>
        <div class="job-details">
          <span class="detail">Уровень: {{ job.level }}</span>
          <span class="detail">График: {{ job.schedule }}</span>
          <span class="detail">ЗП: {{ formatMoney(job.salaryPerHour) }} ₽/ч</span>
        </div>
        <div v-if="!job.unlocked" class="job-reqs">
          <span v-if="job.missingProfessionalism > 0" class="req">
            Профессионализм: ещё {{ job.missingProfessionalism }} ур.
          </span>
          <span class="req">Образование: {{ job.educationRequiredLabel }}</span>
        </div>
        <div v-else-if="job.unlocked && !job.current" class="job-action-hint">
          Кликните, чтобы устроиться
        </div>
      </RoundedPanel>
    </div>
    <p v-if="message" class="career-message">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
import { CAREER_JOBS } from '@/domain/balance/constants/career-jobs'
import type { CareerTrackJobItem } from '@/domain/balance/types'
import { EDUCATION_RANK_TO_LABEL, storeLevelToCareerRank } from '@/domain/balance/utils/education-ranks'
import { formatMoney } from '@/utils/format'

const store = useGameStore()

const skillsStore = useSkillsStore()

const educationStore = useEducationStore()

const careerStore = useCareerStore()

const message = ref('')

const careerTrack = computed<CareerTrackJobItem[]>(() => {
  void store.worldTick
  void skillsStore.totalLevels
  void educationStore.educationLevel

  const currentJobId: string = careerStore.currentJob?.id ?? ''
  const educationRank: number = storeLevelToCareerRank(educationStore.educationLevel)
  const professionalism: number = skillsStore.skills?.professionalism?.level ?? 0

  return CAREER_JOBS.map(job => {
    const educationRequiredLabel: string = job.minEducationRank === -1
      ? 'Любое'
      : EDUCATION_RANK_TO_LABEL[job.minEducationRank] ?? 'Неизвестно'

    const missing: number = job.minProfessionalism - professionalism
    const unlocked: boolean = professionalism >= job.minProfessionalism && educationRank >= job.minEducationRank

    return {
      id: job.id,
      name: job.name,
      level: job.level,
      schedule: job.schedule,
      salaryPerHour: job.salaryPerHour,
      description: job.description,
      current: job.id === currentJobId,
      unlocked,
      missingProfessionalism: Math.max(0, missing),
      educationRequiredLabel,
      effectiveSalaryPerHour: job.salaryPerHour,
    }
  })
})

function takeJob(job: CareerTrackJobItem): void {
  if (!job.unlocked || job.current) return
  careerStore.startWork({
    id: job.id,
    name: job.name,
    schedule: job.schedule,
    employed: true,
    level: job.level,
    salaryPerHour: job.salaryPerHour,
    salaryPerDay: job.salaryPerHour * 8,
    salaryPerWeek: job.salaryPerHour * 40,
    requiredHoursPerWeek: 40,
    workedHoursCurrentWeek: 0,
    pendingSalaryWeek: 0,
    totalWorkedHours: 0,
    daysAtWork: 0,
  })
  message.value = `Вы устроились на работу: ${job.name}`
  setTimeout(() => {
    message.value = ''
  }, 3000)
}
</script>

<style scoped lang="scss" src="./CareerTrack.scss"></style>
