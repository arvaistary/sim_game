<template>
  <GameLayout title="Восстановление">
    <div class="recovery-page">
      <!-- Табы -->
      <div class="tabs-row">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab-btn"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-label">{{ tab.label }}</span>
        </button>
      </div>

      <!-- Заголовок таба -->
      <RoundedPanel v-if="currentTab">
        <h3 class="tab-title">{{ currentTab.title }}</h3>
        <p class="tab-subtitle">{{ currentTab.subtitle }}</p>
      </RoundedPanel>

      <!-- Карточки -->
      <div class="cards-grid">
        <RoundedPanel
          v-for="card in currentCards"
          :key="card.title"
          class="recovery-card"
          :class="{ disabled: !canAfford(card) }"
          @click="handleCard(card)"
        >
          <div class="card-header">
            <span class="card-title">{{ card.title }}</span>
            <span class="card-price">{{ formatMoney(card.price) }} ₽</span>
          </div>
          <p class="card-effect">{{ card.effect }}</p>
          <p class="card-mood">{{ card.mood }}</p>
          <div class="card-meta">
            <span v-if="card.dayCost" class="meta-tag">⏱ {{ card.dayCost }} дн</span>
            <span v-if="card.hourCost" class="meta-tag">🕐 {{ card.hourCost }} ч</span>
          </div>
        </RoundedPanel>
      </div>

      <!-- Пусто -->
      <RoundedPanel v-if="!currentCards.length">
        <p class="page-desc">Нет доступных действий</p>
      </RoundedPanel>

      <!-- Результат -->
      <RoundedPanel v-if="lastResult" class="result-panel">
        <p class="result-text">{{ lastResult }}</p>
        <GameButton label="Закрыть" accent-key="accent" @click="lastResult = ''" />
      </RoundedPanel>
    </div>
  </GameLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import GameLayout from '@/components/layout/GameLayout.vue'
import RoundedPanel from '@/components/ui/RoundedPanel.vue'
import GameButton from '@/components/ui/GameButton.vue'
import { useGameStore } from '@/stores/game.store'
import { RECOVERY_TABS } from '@/domain/balance/recovery-tabs'
import type { RecoveryCard, RecoveryTab } from '@/domain/balance/types'

const store = useGameStore()
const activeTab = ref('home')
const lastResult = ref('')

const tabs = computed(() => RECOVERY_TABS as RecoveryTab[])

const currentTab = computed(() => {
  return tabs.value.find(t => t.id === activeTab.value) ?? null
})

const currentCards = computed(() => {
  return currentTab.value?.cards ?? []
})

function canAfford(card: RecoveryCard): boolean {
  return (store.money ?? 0) >= card.price
}

function handleCard(card: RecoveryCard): void {
  if (!canAfford(card)) {
    lastResult.value = 'Недостаточно денег!'
    return
  }

  // Применяем через store
  const result = store.applyRecoveryAction(card)
  if (result) {
    lastResult.value = result
  }
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value)
}
</script>

<style scoped>
.recovery-page{display:flex;flex-direction:column;gap:12px}
.tabs-row{display:flex;gap:6px;overflow-x:auto;padding-bottom:4px;-webkit-overflow-scrolling:touch}
.tab-btn{display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 12px;border-radius:14px;border:2px solid transparent;background:var(--color-panel);color:var(--color-text);font-size:12px;cursor:pointer;transition:all .2s;min-width:60px;font-family:inherit}
.tab-btn.active{border-color:var(--color-accent);background:rgba(232,180,160,.12)}
.tab-btn:hover{background:rgba(232,180,160,.08)}
.tab-icon{font-size:18px;font-weight:700}
.tab-label{font-size:10px;white-space:nowrap}
.tab-title{font-size:16px;font-weight:700;margin:0 0 4px}
.tab-subtitle{font-size:12px;color:var(--color-text);opacity:.7;margin:0}
.cards-grid{display:flex;flex-direction:column;gap:10px}
.recovery-card{cursor:pointer;transition:all .2s}
.recovery-card:hover{transform:translateY(-1px);box-shadow:0 4px 16px rgba(0,0,0,.08)}
.recovery-card.disabled{opacity:.5;cursor:not-allowed}
.card-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
.card-title{font-size:14px;font-weight:600}
.card-price{font-size:13px;font-weight:700;color:var(--color-accent)}
.card-effect{font-size:12px;color:var(--color-text);margin:4px 0;opacity:.85}
.card-mood{font-size:11px;color:var(--color-sage);font-style:italic;margin:2px 0}
.card-meta{display:flex;gap:8px;margin-top:6px}
.meta-tag{font-size:10px;background:rgba(0,0,0,.05);padding:2px 8px;border-radius:8px}
.result-panel{background:rgba(168,202,186,.12)}
.result-text{font-size:13px;white-space:pre-line;margin-bottom:8px}
.page-desc{font-size:14px;text-align:center;opacity:.6}
</style>

