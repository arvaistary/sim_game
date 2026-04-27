<template>
  <RoundedPanel>
    <h3 class="section-title">
      Рабочая смена
    </h3>
    <div class="work-actions">
      <GameButton
        @click="doWork(8)"
        label="Смена 8 ч"
        accent-key="accent"
        />
      <GameButton
        @click="doWork(4)"
        label="Смена 4 ч"
        accent-key="sage"
        />
    </div>
    <p
      v-if="workResult"
      class="work-result"
      >
      {{ workResult }}
    </p>
  </RoundedPanel>
</template>

<script setup lang="ts">
import './WorkShiftPanel.scss'

const careerStore = useCareerStore()
const statsStore = useStatsStore()

const workResult = ref('')

function doWork(hours: number): void {
  if (!careerStore.isEmployed) {
    workResult.value = 'Сначала устройтесь на работу'

    return
  }
  
  // Проверяем достаточно ли энергии

  if (statsStore.energy < hours * 3) {
    workResult.value = 'Недостаточно энергии'

    return
  }

  careerStore.addWorkHours(hours)

  const salary: number = hours * careerStore.currentJob.salaryPerHour

  careerStore.addPendingSalary(salary)
  statsStore.applyStatChanges({ energy: -(hours * 3), hunger: +(hours * 2) })
  workResult.value = `Вы заработали ${salary} ₽`
}
</script>

