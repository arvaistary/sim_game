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
import { useGameStore } from '@/stores/game.store'
import RoundedPanel from '@/components/ui/RoundedPanel.vue'
import StatBar from '@/components/game/StatBar.vue'
import { STAT_DEFS } from '@/domain/balance/constants/stat-defs'

const store = useGameStore()
const statDefs = STAT_DEFS

function getStatValue(key: string): number {
  if (!store.stats) return 50
  return (store.stats as any)[key] ?? 50
}
</script>

<style scoped lang="scss" src="./StatsCard.scss"></style>
