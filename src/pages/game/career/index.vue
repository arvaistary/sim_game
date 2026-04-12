<template>
  <GameLayout title="Карьера">
    <div class="career-page">
      <CurrentJobPanel />
      <CareerTrack />
      <!-- <WorkShiftPanel /> -->
    </div>
  </GameLayout>
</template>

<script setup lang="ts">
import { definePageMeta } from '#imports'
import GameLayout from '@/components/layout/GameLayout/GameLayout.vue'
import CurrentJobPanel from '@/components/pages/career/CurrentJobPanel/CurrentJobPanel.vue'
import CareerTrack from '@/components/pages/career/CareerTrack/CareerTrack.vue'
// import WorkShiftPanel from '@/components/pages/career/WorkShiftPanel/WorkShiftPanel.vue'

definePageMeta({ middleware: 'game-init' })
</script>

<style scoped lang="scss">
.career-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
