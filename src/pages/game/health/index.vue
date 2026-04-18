<template>
  <GameLayout title="Здоровье">
    <SectionHeader title="Здоровье" subtitle="Забота о физическом и ментальном здоровье" />
    <ActionCardList
      :actions="actions"
      :empty-text="actionsEmptyHint"
      :is-disabled="(a: any) => !canExecute(a.id)"
      @execute="executeAction"
    />
  </GameLayout>
</template>

<script setup lang="ts">
import { definePageMeta } from '#imports'
import GameLayout from '@/components/layout/GameLayout/GameLayout.vue'
import SectionHeader from '@/components/game/SectionHeader/SectionHeader.vue'
import ActionCardList from '@/components/game/ActionCardList/ActionCardList.vue'
import { useActions } from '@/composables/useActions'

definePageMeta({ middleware: 'game-init' })

const { getActionsByCategory, canExecute, executeAction, actionsEmptyHint } = useActions()
const actions = getActionsByCategory('health')
</script>
