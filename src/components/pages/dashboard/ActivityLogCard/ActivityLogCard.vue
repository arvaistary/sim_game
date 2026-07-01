<template>
  <RoundedPanel
    class="log-card"
    padding="var(--space-card-padding)"
  >
    <div class="widget__header">
      <h3 class="widget__title">Лента событий</h3>
    </div>

    <div class="log-card__entries">
      <p
        v-if="logEntries.length === 0"
        class="log-card__empty"
      >Пока нет записей</p>

      <div
        v-for="(entry, i) in logEntries"
        :key="i"
        class="log-card__entry"
      >
        <span class="log-card__day metric">Д{{ entry.day }}</span>
        <span class="log-card__text">{{ entry.displayTitle }}</span>
      </div>
    </div>

    <button
      class="log-card__link"
      type="button"
      @click="navigateTo('/game/activity')"
    >Все события →</button>
  </RoundedPanel>
</template>

<script setup lang="ts">
import './ActivityLogCard.scss'
import type { ActivityEntry } from '@/stores/activity-store'
import type { LogEntryDisplay } from './ActivityLogCard.types'

const activityStore = useActivityStore()

const logEntries = computed<LogEntryDisplay[]>(() => {
  const entries: ActivityEntry[] = activityStore.recentEntries

  if (!entries || entries.length === 0) return []

  return entries.slice(0, 6).map((entry: ActivityEntry) => ({
    icon: '•',
    displayTitle: entry.title?.substring(0, 28) ?? entry.description?.substring(0, 28) ?? 'Событие',
    day: entry.day ?? '?',
  }))
})
</script>
