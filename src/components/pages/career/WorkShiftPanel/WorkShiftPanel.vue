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
import { ref } from 'vue'
import RoundedPanel from '@/components/ui/RoundedPanel/index.vue'
import GameButton from '@/components/ui/GameButton/index.vue'
import { useGameStore } from '@/stores/game.store'

const store = useGameStore()
const workResult = ref('')

function doWork(hours: number): void {
  workResult.value = store.applyWorkShift(hours)
}
</script>

<style scoped lang="scss" src="./WorkShiftPanel.scss"></style>
