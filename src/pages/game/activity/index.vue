<template>
  <GameLayout title="Журнал">
    <div class="activity-page">
      <ActivityFilter v-model="activeFilter" />
      <ActivityLogList />
    </div>
  </GameLayout>
</template>

<script setup lang="ts">
import './index.scss'

definePageMeta({ middleware: 'game-init' })

const activeFilter = ref<string>('all')
</script>
