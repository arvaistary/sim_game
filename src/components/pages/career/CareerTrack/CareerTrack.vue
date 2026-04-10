<template>
  <div class="career-track-wrapper">
    <h3 class="section-title">Карьерный путь</h3>
    <div class="career-track">
      <RoundedPanel
        v-for="job in careerTrack"
        :key="(job as any).id"
        class="job-card"
        :class="{ current: job.current, locked: !job.unlocked }"
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
          <span class="detail">ЗП: {{ formatMoney((job as any).effectiveSalaryPerHour ?? (job as any).salaryPerHour) }} ₽/ч</span>
        </div>
        <div v-if="!job.unlocked" class="job-reqs">
          <span v-if="(job as any).missingProfessionalism > 0" class="req">
            Профессионализм: ещё {{ (job as any).missingProfessionalism }} ур.
          </span>
          <span class="req">Образование: {{ (job as any).educationRequiredLabel }}</span>
        </div>
      </RoundedPanel>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import RoundedPanel from '@/components/ui/RoundedPanel.vue'
import { useGameStore } from '@/stores/game.store'
import { formatMoney } from '@/utils/format'

const store = useGameStore()

const careerTrack = computed(() => store.getCareerTrack())
</script>

<style scoped lang="scss" src="./CareerTrack.scss"></style>
