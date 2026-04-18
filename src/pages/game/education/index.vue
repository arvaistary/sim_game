<template>
  <GameLayout title="Образование">
    <div class="education-page">
      <EducationLevel />
      <ProgramList />
      <SectionHeader title="Учебные занятия" subtitle="Повседневные действия для развития навыков и знаний" />
      <ActionCardList
        :actions="actions"
        :empty-text="actionsEmptyHint"
        :is-disabled="(a: any) => !canExecute(a.id)"
        @execute="executeAction"
      />
    </div>
  </GameLayout>
</template>

<script setup lang="ts">
import { definePageMeta } from '#imports'
import GameLayout from '@/components/layout/GameLayout/GameLayout.vue'
import SectionHeader from '@/components/game/SectionHeader/SectionHeader.vue'
import ActionCardList from '@/components/game/ActionCardList/ActionCardList.vue'
import EducationLevel from '@/components/pages/education/EducationLevel/EducationLevel.vue'
import ProgramList from '@/components/pages/education/ProgramList/ProgramList.vue'
import { useActions } from '@/composables/useActions'

definePageMeta({ middleware: 'game-init' })

const { getActionsByCategory, canExecute, executeAction, actionsEmptyHint } = useActions()
const actions = getActionsByCategory('education') as any
</script>

<style scoped lang="scss">
.education-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
