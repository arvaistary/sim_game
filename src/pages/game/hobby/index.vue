<template>
  <GameLayout title="Хобби">
    <SectionHeader title="Хобби" subtitle="Творческие занятия для души и развития навыков" />
    <ActionCardList
      :actions="actions"
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

const { getActionsByCategory, canExecute, executeAction } = useActions()
const actions = getActionsByCategory('hobby')
</script>
