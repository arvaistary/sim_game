<template>
  <section v-if="isEmployed" class="career-track-section">
    <SectionHeader
      plain
      title="Карьерный путь"
      subtitle="Ваш прогресс по уровням профессии"
    />

    <div class="career-track">
      <RoundedPanel
        v-for="job in trackJobs"
        :key="job.id"
        class="career-track-card"
        :class="{ 'career-track-card--current': job.current }"
        padding="12px 16px"
      >
        <div class="career-track-card__content">
          <span class="career-track-card__title">{{ job.name }}</span>
          <span class="career-track-card__meta">
            Уровень {{ job.level }} · {{ formatMoney(job.salaryPerHour) }} ₽/ч
          </span>
        </div>

        <span
          class="career-track-card__status"
          :class="`career-track-card__status--${getCareerTrackStatus(job).tone}`"
        >
          {{ getCareerTrackStatus(job).label }}
        </span>
      </RoundedPanel>
    </div>
  </section>
</template>

<script setup lang="ts">
import './CareerTrack.scss'
import type { ComputedRef } from 'vue'
import type { CareerTrackJobItem } from '@/domain/balance/types'
import { formatMoney } from '@/utils/format'
import { useWorkCareerItems } from '@/composables/useWorkCareerItems'
import { getCareerTrackStatus } from './career-track-status'

const careerStore = useCareerStore()

const { items } = useWorkCareerItems()

const isEmployed: ComputedRef<boolean> = computed(() => careerStore.isEmployed)

const trackJobs: ComputedRef<CareerTrackJobItem[]> = computed(() => items.value.trackJobs)
</script>
