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
import RoundedPanel from '@/components/ui/RoundedPanel/index.vue'
import StatBar from '@/components/game/StatBar.vue'
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

function getStatValue(key: string): number {
  return statValues.value[key] ?? 50
}
</script>

<style scoped lang="scss" src="./StatsCard.scss"></style>
