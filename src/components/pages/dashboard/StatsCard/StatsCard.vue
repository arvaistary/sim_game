<template>
  <RoundedPanel
    class="card scales-card"
    padding="16px"
    >
    <h3 class="card-title">
      Состояние персонажа
    </h3>
    <div class="stat-bars">
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

import { INVERTED_STATS, statDefs } from './StatsCard.constants'

const statsStore = useStatsStore()

const statValues = computed<Record<string, number>>(() => ({
  hunger: statsStore.hunger,
  energy: statsStore.energy,
  stress: statsStore.stress,
  mood: statsStore.mood,
  health: statsStore.health,
  physical: statsStore.physical,
}))

function getStatValue(key: string): number {
  const raw: number = statValues.value[key] ?? 50

  return INVERTED_STATS.has(key) ? 100 - raw : raw
}
</script>

