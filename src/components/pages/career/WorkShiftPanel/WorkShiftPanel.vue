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
import { appGameCommands } from '@/application/game'

const careerStore = useCareerStore()

const statsStore = useStatsStore()

const workResult = ref('')

function doWork(hours: number): void {
  if (!careerStore.isEmployed) {
    workResult.value = 'Сначала устройтесь на работу'
    return
  }

  if (statsStore.energy < hours * 3) {
    workResult.value = 'Недостаточно энергии'
    return
  }

  workResult.value = appGameCommands.simulateWorkShift(hours)
}
</script>

<style scoped lang="scss" src="./WorkShiftPanel.scss"></style>
