<template>
  <RoundedPanel
    class="stats-card"
    padding="var(--space-card-padding)"
  >
    <div class="widget__header">
      <h3 class="widget__title">Состояние персонажа</h3>
    </div>
    <div class="stats-card__grid">
      <StatBar
        v-for="stat in statDefs"
        :key="stat.key"
        :label="stat.label"
        :value="getStatValue(stat.key)"
        :color="stat.endColor"
      />
    </div>
  </RoundedPanel>
</template>

<script setup lang="ts">
import './StatsCard.scss'
import { STAT_DEFS } from '@/domain/balance/constants/stat-defs'

const statsStore = useStatsStore()

const statDefs = STAT_DEFS

const statValues = computed<Record<string, number>>(() => ({
  hunger: statsStore.hunger,
  energy: statsStore.energy,
  stress: statsStore.stress,
  mood: statsStore.mood,
  health: statsStore.health,
  physical: statsStore.physical,
}))

const INVERTED_STATS: Set<string> = new Set(['hunger', 'stress'])

function getStatValue(key: string): number {
  const raw = statValues.value[key] ?? 50
  return INVERTED_STATS.has(key) ? 100 - raw : raw
}
</script>
