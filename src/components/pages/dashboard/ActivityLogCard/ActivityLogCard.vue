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
import { ref, onMounted } from 'vue'
import { navigateTo } from '#imports'
import { useGameStore } from '@/stores/game.store'
import RoundedPanel from '@/components/ui/RoundedPanel.vue'
import { resolveActivityLogTitle } from '@/composables/useActivityLog/utils/activity-log-formatters'

const store = useGameStore()

interface LogEntryDisplay {
  icon: string
  displayTitle: string
  day: string | number
}

const logEntries = ref<LogEntryDisplay[]>([])

function refreshActivityLog() {
  const entries = store.getActivityLogEntries(8)
  if (!entries || entries.length === 0) {
    logEntries.value = []
    return
  }
  logEntries.value = entries.map((entry: any) => {
    const displayTitle = resolveActivityLogTitle(entry)
    const title = displayTitle.length > 28
      ? displayTitle.substring(0, 25) + '…'
      : displayTitle
    return {
      icon: entry.icon || '•',
      displayTitle: title,
      day: entry.timestamp?.day ?? '?',
    }
  })
}

onMounted(() => {
  refreshActivityLog()
})
</script>

<style scoped lang="scss" src="./ActivityLogCard.scss"></style>
