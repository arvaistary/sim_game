<template>
  <GameLayout title="Дом">
    <SectionHeader title="Дом" subtitle="Действия для обустройства дома и комфорта" />
    <ActionCardList
      :actions="actions"
      :is-disabled="isDisabled"
      button-label="Применить"
      :show-price-when-zero="true"
      :use-format-effect="true"
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
import type { BalanceAction } from '@/domain/balance/actions'

definePageMeta({ middleware: 'game-init' })

const { getActionsByCategory, canExecute, executeAction } = useActions()

const actions = getActionsByCategory('home' as any)

function isDisabled(action: BalanceAction): boolean {
  return !canExecute(action.id)
}
</script>
