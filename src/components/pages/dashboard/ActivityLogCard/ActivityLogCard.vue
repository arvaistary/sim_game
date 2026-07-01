<template>
  <div class="log-card-wrapper" @click="navigateTo('/game/activity')">
    <RoundedPanel class="card log-card" padding="14px">
      <h3 class="card-title">📋 Последние события</h3>
      <div class="log-entries">
        <p v-if="logEntries.length === 0" class="log-empty">Пока нет записей</p>
        <p
          v-for="(entry, i) in logEntries"
          :key="i"
          class="log-entry"
        >
          {{ entry.icon || '•' }} {{ entry.displayTitle }} · д{{ entry.day }}
        </p>
      </div>
      <p class="log-hint">Нажмите для подробностей →</p>
    </RoundedPanel>
  </div>
</template>

<script setup lang="ts">
import type { ActivityEntry } from '@/stores/activity-store'
import type { LogEntryDisplay } from './ActivityLogCard.types'

const activityStore = useActivityStore()

const logEntries = computed<LogEntryDisplay[]>(() => {
  const entries: ActivityEntry[] = activityStore.recentEntries

  if (!entries || entries.length === 0) return []

  return entries.slice(0, 8).map((entry: ActivityEntry) => ({
    icon: '•',
    displayTitle: entry.title?.substring(0, 25) ?? entry.description?.substring(0, 25) ?? 'Событие',
    day: entry.day ?? '?',
  }))
})
</script>

<style scoped lang="scss" src="./ActivityLogCard.scss"></style>
