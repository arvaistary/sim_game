<template>
  <GameLayout title="Магазин">
    <div class="shop-page">
      <RoundedPanel class="header-panel">
        <h3 class="section-title">Магазин</h3>
        <p class="section-subtitle">Покупки товаров и услуг для персонажа</p>
      </RoundedPanel>

      <div class="cards-list">
        <RoundedPanel
          v-for="action in actions"
          :key="action.id"
          class="action-card"
          :class="{ disabled: !isAvailable(action) }"
        >
          <div class="card-header">
            <span class="card-title">{{ action.title }}</span>
            <span class="card-price">{{ formatMoney(action.price) }} ₽</span>
          </div>
          <p class="card-effect">{{ formatEffect(action.effect) }}</p>
          <p v-if="action.mood" class="card-mood">{{ action.mood }}</p>
          <div class="card-meta">
            <span class="meta-tag">⏱ {{ action.hourCost }} ч</span>
          </div>
          <div class="card-footer">
            <GameButton
              :label="isAvailable(action) ? 'Применить' : 'Недоступно'"
              :color="isAvailable(action) ? 'var(--color-accent)' : 'var(--color-neutral)'"
              :text-color="isAvailable(action) ? '#fff' : 'var(--color-text)'"
              :disabled="!isAvailable(action)"
              small
              @click="applyAction(action)"
            />
          </div>
        </RoundedPanel>
      </div>

      <RoundedPanel v-if="actions.length === 0" class="empty-panel">
        <p class="empty-text">Нет доступных действий</p>
      </RoundedPanel>
    </div>
  </GameLayout>
</template>

<script setup lang="ts">
import GameLayout from '@/components/layout/GameLayout.vue'
import RoundedPanel from '@/components/ui/RoundedPanel.vue'
import GameButton from '@/components/ui/GameButton.vue'
import { useActions } from '@/composables/useActions'
import { useToast } from '@/composables/useToast'
import { useGameStore } from '@/stores/game.store'
import type { BalanceAction } from '@/domain/balance/actions'

const store = useGameStore()
const { getActionsByCategory, canExecute } = useActions()
const toast = useToast()

const actions = getActionsByCategory('shop' as any)

function isAvailable(action: BalanceAction): boolean {
  if (action.price > 0 && store.money < action.price) return false
  return canExecute(action.id)
}

function applyAction(action: BalanceAction) {
  const result = store.executeAction(action.id)
  if (result.includes('Не удалось') || result.includes('нельзя')) {
    toast.showError(result)
  } else {
    toast.showSuccess(result)
  }
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value)
}

function formatEffect(effect: string): string {
  const raw = (effect || '').trim()
  if (!raw) return ''
  if (raw.includes('•')) return raw
  return raw
}
</script>

<style scoped>
.shop-page{display:flex;flex-direction:column;gap:12px}
.header-panel{display:flex;flex-direction:column;gap:4px}
.section-title{font-size:16px;font-weight:700;margin:0}
.section-subtitle{font-size:12px;color:var(--color-text);opacity:.7;margin:0}
.cards-list{display:flex;flex-direction:column;gap:10px}
.action-card{display:flex;flex-direction:column;gap:4px;transition:all .2s}
.action-card.disabled{opacity:.5}
.card-header{display:flex;justify-content:space-between;align-items:center}
.card-title{font-size:14px;font-weight:600}
.card-price{font-size:13px;font-weight:700;color:var(--color-accent)}
.card-effect{font-size:12px;color:var(--color-text);opacity:.85;margin:4px 0;white-space:pre-line;line-height:1.4}
.card-mood{font-size:11px;color:var(--color-sage);font-style:italic;margin:2px 0}
.card-meta{display:flex;gap:8px;margin-top:2px}
.meta-tag{font-size:10px;background:rgba(0,0,0,.05);padding:2px 8px;border-radius:8px}
.card-footer{display:flex;justify-content:flex-end;margin-top:6px}
.empty-panel{text-align:center;padding:24px}
.empty-text{font-size:14px;opacity:.6;margin:0}
</style>

