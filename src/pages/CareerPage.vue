<template>
  <GameLayout title="Карьера">
    <div class="career-page">
      <!-- Текущая работа -->
      <RoundedPanel>
        <h3 class="section-title">Текущая должность</h3>
        <div class="current-job">
          <span class="job-name">{{ store.currentJobName }}</span>
          <span class="job-salary">{{ formatMoney(currentSalary) }} ₽/ч</span>
        </div>
      </RoundedPanel>

      <!-- Карьерный трек -->
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

      <!-- Отработать смену -->
      <RoundedPanel>
        <h3 class="section-title">Рабочая смена</h3>
        <div class="work-actions">
          <GameButton label="Смена 8 ч" accent-key="accent" @click="doWork(8)" />
          <GameButton label="Смена 4 ч" accent-key="sage" @click="doWork(4)" />
        </div>
        <p v-if="workResult" class="work-result">{{ workResult }}</p>
      </RoundedPanel>
    </div>
  </GameLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import GameLayout from '@/components/layout/GameLayout.vue'
import RoundedPanel from '@/components/ui/RoundedPanel.vue'
import GameButton from '@/components/ui/GameButton.vue'
import { useGameStore } from '@/stores/game.store'

const store = useGameStore()
const workResult = ref('')

const careerTrack = computed(() => store.getCareerTrack())
const currentSalary = computed(() => {
  const career = store.career as unknown as Record<string, unknown> | null
  if (!career) return 0
  const job = career.currentJob as Record<string, unknown> | null
  return (job?.salaryPerHour as number) ?? 0
})

function doWork(hours: number): void {
  workResult.value = store.applyWorkShift(hours)
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value)
}
</script>

<style scoped>
.career-page{display:flex;flex-direction:column;gap:12px}
.section-title{font-size:15px;font-weight:700;margin:0 0 8px}
.current-job{display:flex;justify-content:space-between;align-items:center}
.job-name{font-size:16px;font-weight:700}
.job-salary{font-size:14px;color:var(--color-accent);font-weight:600}
.career-track{display:flex;flex-direction:column;gap:8px}
.job-card{transition:all .2s}
.job-card.current{border-left:4px solid var(--color-accent)}
.job-card.locked{opacity:.6}
.job-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px}
.job-title{font-size:14px;font-weight:600}
.badge{font-size:10px;padding:2px 8px;border-radius:8px;font-weight:600}
.current-badge{background:rgba(232,180,160,.2);color:var(--color-accent)}
.unlock-badge{background:rgba(168,202,186,.2);color:var(--color-sage)}
.lock-badge{opacity:.5}
.job-details{display:flex;gap:12px;flex-wrap:wrap;margin:4px 0}
.detail{font-size:12px;color:var(--color-text);opacity:.7}
.job-reqs{margin-top:4px;display:flex;flex-direction:column;gap:2px}
.req{font-size:11px;color:var(--color-text);opacity:.5}
.work-actions{display:flex;gap:8px;margin-bottom:8px}
.work-result{font-size:12px;white-space:pre-line;background:rgba(168,202,186,.1);padding:8px;border-radius:10px;margin-top:8px}
</style>

