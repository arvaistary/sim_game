<template>
  <RoundedPanel class="event-card">
    <h3 class="event-title">{{ event.title }}</h3>
    <p class="event-desc">{{ event.description }}</p>

    <div v-if="impactText" class="event-impact">
      <p class="impact-label">Последствия:</p>
      <p class="impact-text">{{ impactText }}</p>
    </div>

    <div class="event-day">День события</div>
  </RoundedPanel>
</template>

<script setup lang="ts">
import type { ComputedRef } from 'vue'
import { formatStatChangesBulletListRu } from '@/domain/balance/utils/stat-changes-format'
import type { GameEvent } from '@/stores/events-store'

const props = defineProps<{
  event: GameEvent
}>()

const impactText: ComputedRef<string> = computed(() => {
  if (!props.event?.data?.statImpact) return ''

  return formatStatChangesBulletListRu(props.event.data.statImpact as Record<string, number>)
})
</script>

<style scoped lang="scss" src="./EventCard.scss"></style>
