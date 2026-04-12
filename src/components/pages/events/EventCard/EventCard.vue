<template>
  <RoundedPanel class="event-card">
    <h3 class="event-title">{{ event.title }}</h3>
    <p class="event-desc">{{ event.description }}</p>

    <div v-if="impactText" class="event-impact">
      <p class="impact-label">Последствия:</p>
      <p class="impact-text">{{ impactText }}</p>
    </div>

    <div class="event-day">День {{ event.day }}</div>
  </RoundedPanel>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import RoundedPanel from '@/components/ui/RoundedPanel/index.vue'
import { formatStatChangesBulletListRu } from '@/domain/balance/utils/stat-changes-format'

const props = defineProps<{
  event: {
    title: string
    description: string
    day: number
    data?: { statImpact?: unknown }
    choices: Array<{ id: string; text: string }>
  }
}>()

const impactText = computed(() => {
  if (!props.event?.data?.statImpact) return ''
  return formatStatChangesBulletListRu(props.event.data.statImpact as any)
})
</script>

<style scoped lang="scss" src="./EventCard.scss"></style>
