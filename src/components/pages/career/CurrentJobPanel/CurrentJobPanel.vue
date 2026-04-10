<template>
  <RoundedPanel>
    <h3 class="section-title">Текущая должность</h3>
    <div class="current-job">
      <span class="job-name">{{ store.currentJobName }}</span>
      <span class="job-salary">{{ formatMoney(currentSalary) }} ₽/ч</span>
    </div>
  </RoundedPanel>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import RoundedPanel from '@/components/ui/RoundedPanel.vue'
import { useGameStore } from '@/stores/game.store'
import { formatMoney } from '@/utils/format'

const store = useGameStore()

const currentSalary = computed(() => {
  const career = store.career as unknown as Record<string, unknown> | null
  if (!career) return 0
  const job = career.currentJob as Record<string, unknown> | null
  return (job?.salaryPerHour as number) ?? 0
})
</script>

<style scoped lang="scss" src="./CurrentJobPanel.scss"></style>
