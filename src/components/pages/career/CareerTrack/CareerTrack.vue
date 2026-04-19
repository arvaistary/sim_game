<template>
  <div class="career-track-wrapper">
    <!-- Reactivity trigger -->
    <span v-if="reactivityTrigger" class="sr-only">{{ reactivityTrigger }}</span>
    <h3 class="section-title">Карьерный путь</h3>
    <div class="career-track">
      <RoundedPanel
        v-for="job in careerTrack"
        :key="(job as any).id"
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
          <span class="detail">ЗП: {{ formatMoney((job as any).effectiveSalaryPerHour ?? (job as any).salaryPerHour) }} ₽/ч</span>
        </div>
        <div v-if="!job.unlocked" class="job-reqs">
          <span v-if="(job as any).missingProfessionalism > 0" class="req">
            Профессионализм: ещё {{ (job as any).missingProfessionalism }} ур.
          </span>
          <span class="req">Образование: {{ (job as any).educationRequiredLabel }}</span>
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
import { computed, ref } from 'vue'
import { useGameStore } from '@/stores/game.store'
import { formatMoney } from '@/utils/format'

const store = useGameStore()
const message = ref('')

// Принудительная реактивность
const reactivityTrigger = computed(() => store.worldTick)

const careerTrack = computed(() => {
  void reactivityTrigger.value
  return store.getCareerTrack()
})

function takeJob(job: Record<string, unknown>): void {
  if (!job.unlocked || job.current) return
  
  const result = store.changeCareer(job.id as string)
  message.value = result.message
  
  setTimeout(() => {
    message.value = ''
  }, 3000)
}
</script>

<style scoped lang="scss" src="./CareerTrack.scss"></style>
