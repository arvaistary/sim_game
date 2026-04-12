<template>
  <RoundedPanel>
    <h3 class="section-title">Текущая должность</h3>
    <div class="current-job">
      <span class="job-name">{{ currentJobName }}</span>
      <span class="job-salary">{{ formatMoney(currentSalaryPerHour) }} ₽/ч</span>
    </div>
  </RoundedPanel>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import RoundedPanel from '@/components/ui/RoundedPanel/index.vue'
import { useGameStore } from '@/stores/game.store'
import { formatMoney } from '@/utils/format'

const store = useGameStore()

const currentJobName = computed<string>(() => {
  const job = store.currentJobSnapshot
  if (!job || !job.id || !job.employed) return 'Безработный'
  return job.name
})

const currentSalaryPerHour = computed<number>(() => {
  const job = store.currentJobSnapshot
  if (!job || !job.id || !job.employed) return 0
  return job.salaryPerHour
})
</script>

<style scoped lang="scss" src="./CurrentJobPanel.scss"></style>
