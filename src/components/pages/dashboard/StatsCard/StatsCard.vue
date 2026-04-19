<template>
  <RoundedPanel class="card scales-card" padding="16px">
    <h3 class="card-title">Состояние персонажа</h3>
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
import { computed } from 'vue'
import { useGameStore } from '@/stores/game.store'
import { STAT_DEFS } from '@/domain/balance/constants/stat-defs'

const store = useGameStore()
const statDefs = STAT_DEFS

const statValues = computed<Record<string, number>>(() => ({
  hunger: store.hunger,
  energy: store.energy,
  stress: store.stress,
  mood: store.mood,
  health: store.health,
  physical: store.physical,
}))

/** Статы с обратной семантикой: чем выше значение, тем хуже (инвертируем для отображения) */
const INVERTED_STATS = new Set(['hunger', 'stress'])

function getStatValue(key: string): number {
  const raw = statValues.value[key] ?? 50
  return INVERTED_STATS.has(key) ? 100 - raw : raw
}
</script>

<style scoped lang="scss" src="./StatsCard.scss"></style>
