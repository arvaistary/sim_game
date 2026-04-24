<template>
  <RoundedPanel>
    <h3 class="section-title">Рабочая смена</h3>
    <div class="work-actions">
      <GameButton label="Смена 8 ч" accent-key="accent" @click="doWork(8)" />
      <GameButton label="Смена 4 ч" accent-key="sage" @click="doWork(4)" />
    </div>
    <p v-if="workResult" class="work-result">{{ workResult }}</p>
  </RoundedPanel>
</template>

<script setup lang="ts">
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
  const salary = hours * careerStore.currentJob.salaryPerHour
  careerStore.addPendingSalary(salary)
  statsStore.applyStatChanges({ energy: -(hours * 3), hunger: +(hours * 2) })
  workResult.value = `Вы заработали ${salary} ₽`
}
</script>

<style scoped lang="scss" src="./WorkShiftPanel.scss"></style>
