<template>
  <div
    @click="navigateTo('/game/activity')"
    class="log-card-wrapper"
    >
    <RoundedPanel
      class="card log-card"
      padding="14px"
      >
      <h3 class="card-title">
        📋 Последние события
      </h3>
      <div class="log-entries">
        <p
          v-if="logEntries.length === 0"
          class="log-empty"
          >
          Пока нет записей
        </p>
        <p
          v-for="(entry, i) in logEntries"
          :key="i"
          class="log-entry"
        >
          {{ entry.icon || '•' }} {{ entry.displayTitle }} · д{{ entry.day }}
        </p>
      </div>
      <p class="log-hint">
        Нажмите для подробностей →
      </p>
    </RoundedPanel>
  </div>
</template>

<script setup lang="ts">
import './ActivityLogCard.scss'

import type { LogEntryDisplay } from './ActivityLogCard.types'
import type { ActivityEntry } from '@stores/activity-store'

const activityStore = useActivityStore()

const logEntries = computed<LogEntryDisplay[]>(() => {
  const entries: ActivityEntry[] = activityStore.recentEntries

  if (!entries || entries.length === 0) return []

  return entries.slice(0, 8).map(entry => ({
    icon: '•',
    displayTitle: entry.title?.substring(0, 25) ?? entry.description?.substring(0, 25) ?? 'Событие',
    day: entry.day ?? '?',
  }))
})
</script>

