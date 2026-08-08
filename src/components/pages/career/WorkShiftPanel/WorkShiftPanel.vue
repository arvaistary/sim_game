<template>
  <RoundedPanel>
    <h3 class="section-title">Рабочая смена</h3>
    <div class="work-actions">
      <GameButton
        v-for="hours in workPresets"
        :key="hours"
        :label="`План на ${hours} ч`"
        accent-key="accent"
        :disabled="!canConfirm"
        @click="doWork(hours)"
      />
    </div>
    <p v-if="workResult" class="work-result">{{ workResult }}</p>
  </RoundedPanel>
</template>

<script setup lang="ts">
import { useDayPlanner } from '@/composables/useDayPlanner'
import { useWorkShiftOptions } from '@/composables/useWorkShiftOptions'

const careerStore = useCareerStore()

const planner = useDayPlanner()
const { canConfirm } = planner
const { workOptions } = useWorkShiftOptions()
const workPresets = computed(() => workOptions.value
  ? [workOptions.value.oneDayHours, workOptions.value.fullShiftHours].filter((hours, index, values) => hours > 0 && values.indexOf(hours) === index)
  : [])

const workResult = ref('')

async function doWork(hours: number): Promise<void> {
  if (!careerStore.isEmployed) {
    workResult.value = 'Сначала устройтесь на работу'
    return
  }

  planner.setWorkHours(hours)
  const result = await planner.confirmDay()
  workResult.value = result ? `День завершён: ${result.totalHoursSpent} ч.` : 'План недоступен для текущего дня'
}
</script>

<style scoped lang="scss" src="./WorkShiftPanel.scss"></style>
