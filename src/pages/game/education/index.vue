<template>
  <GameLayout title="Образование">
    <div class="education-page">
      <EducationLevel />
      <ProgramList />
    </div>
  </GameLayout>
</template>

<script setup lang="ts">
import { definePageMeta } from '#imports'
import GameLayout from '@/components/layout/GameLayout/GameLayout.vue'
import EducationLevel from '@/components/pages/education/EducationLevel/EducationLevel.vue'
import ProgramList from '@/components/pages/education/ProgramList/ProgramList.vue'

definePageMeta({ middleware: 'game-init' })
</script>

<style scoped lang="scss">
.education-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
