<template>
  <GameLayout title="Дом">
    <SectionHeader title="Дом" subtitle="Действия для обустройства дома и комфорта" />
    <ActionCardList
      :actions="actions"
      :is-disabled="isDisabled"
      button-label="Применить"
      :show-price-when-zero="true"
      :use-format-effect="true"
      @execute="handleExecute"
    />
  </GameLayout>
</template>

<script setup lang="ts">
import { definePageMeta } from '#imports'
import GameLayout from '@/components/layout/GameLayout/GameLayout.vue'
import SectionHeader from '@/components/game/SectionHeader/SectionHeader.vue'
import ActionCardList from '@/components/game/ActionCardList/ActionCardList.vue'
import { useActions } from '@/composables/useActions'
import { useToast } from '@/composables/useToast'
import { useGameStore } from '@/stores/game.store'
import type { BalanceAction } from '@/domain/balance/actions'

definePageMeta({ middleware: 'game-init' })

const store = useGameStore()
const { getActionsByCategory, canExecute } = useActions()
const toast = useToast()

const actions = getActionsByCategory('home' as any)

function isDisabled(action: BalanceAction): boolean {
  if (action.price > 0 && store.money < action.price) return true
  return !canExecute(action.id)
}

function handleExecute(id: string): void {
  const result = store.executeAction(id)
  if (result.includes('Не удалось') || result.includes('нельзя')) {
    toast.showError(result)
  } else {
    toast.showSuccess(result)
  }
}
</script>
