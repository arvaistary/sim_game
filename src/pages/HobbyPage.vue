<template>
  <GameLayout title="Хобби">
    <div class="action-page">
      <RoundedPanel>
        <h3 class="page-section-title">Хобби</h3>
        <p class="page-section-subtitle">Творческие занятия для души и развития навыков</p>
      </RoundedPanel>

      <div class="cards-grid">
        <RoundedPanel
          v-for="action in actions"
          :key="action.id"
          class="action-card"
          :class="{ disabled: !canDo(action.id) }"
        >
          <div class="card-header">
            <span class="card-title">{{ action.title }}</span>
            <span v-if="action.price > 0" class="card-price">{{ formatMoney(action.price) }} ₽</span>
          </div>
          <p class="card-effect">{{ action.effect }}</p>
          <p v-if="action.mood" class="card-mood">{{ action.mood }}</p>
          <div class="card-meta">
            <span v-if="action.hourCost" class="meta-tag">{{ action.hourCost }} ч</span>
          </div>
          <GameButton
            label="Выполнить"
            :disabled="!canDo(action.id)"
            color="var(--color-accent)"
            text-color="#fff"
            small
            class="card-btn"
            @click="handleAction(action.id)"
          />
        </RoundedPanel>
      </div>

      <RoundedPanel v-if="!actions.length">
        <p class="page-desc">Нет доступных действий</p>
      </RoundedPanel>
    </div>
  </GameLayout>
</template>

<script setup lang="ts">
import GameLayout from '@/components/layout/GameLayout.vue'
import RoundedPanel from '@/components/ui/RoundedPanel.vue'
import GameButton from '@/components/ui/GameButton.vue'
import { useActions } from '@/composables/useActions'

const { getActionsByCategory, canExecute, executeAction } = useActions()

const actions = getActionsByCategory('hobby')

function canDo(id: string): boolean {
  return canExecute(id)
}

function handleAction(id: string): void {
  executeAction(id)
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value)
}
</script>

<style scoped>
.action-page{display:flex;flex-direction:column;gap:12px}
.page-section-title{font-size:16px;font-weight:700;margin:0 0 4px}
.page-section-subtitle{font-size:12px;color:var(--color-text);opacity:.7;margin:0}
.cards-grid{display:flex;flex-direction:column;gap:10px}
.action-card{transition:all .2s}
.action-card.disabled{opacity:.5}
.card-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
.card-title{font-size:14px;font-weight:600}
.card-price{font-size:13px;font-weight:700;color:var(--color-accent)}
.card-effect{font-size:12px;color:var(--color-text);opacity:.85;margin:4px 0}
.card-mood{font-size:11px;color:var(--color-sage);font-style:italic;margin:2px 0}
.card-meta{display:flex;gap:8px;margin-top:6px}
.meta-tag{font-size:10px;background:rgba(0,0,0,.05);padding:2px 8px;border-radius:8px}
.card-btn{margin-top:8px;width:100%}
.page-desc{font-size:14px;text-align:center;opacity:.6}
</style>

