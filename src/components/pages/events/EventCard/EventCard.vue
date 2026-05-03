<template>
  <RoundedPanel class="event-card">
    <h3 class="event-title">
      {{ event.title }}
    </h3>
    <p class="event-desc">
      {{ event.description }}
    </p>

    <div
      v-if="impactText"
      class="event-impact"
      >
      <p class="impact-label">
        Последствия:
      </p>
      <p class="impact-text">
        {{ impactText }}
      </p>
    </div>

    <div class="event-day">
      День {{ event.day }}
    </div>
  </RoundedPanel>
</template>

<script setup lang="ts">

import './EventCard.scss'

import { formatStatChangesBulletListRu } from '@domain/balance/utils/stat-changes-format'

import type { EventQueueItem } from '@stores/events-store'

/**
 * @prop {EventQueueItem} event - Данные события для отображения
 */
const props: boolean = defineProps<{
  event: EventQueueItem
}>()

const impactText = computed<string>(() => {

  if (!props.event?.data?.statImpact) return ''

  return formatStatChangesBulletListRu(props.event.data.statImpact as any)
})
</script>

