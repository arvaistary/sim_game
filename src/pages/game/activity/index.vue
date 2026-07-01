<template>
  <GameLayout title="Журнал">
    <div class="activity-page">
      <ActivityFilter v-model="activeFilter" />
      <ActivityLogList />
    </div>
  </GameLayout>
</template>

<script setup lang="ts">
import './activity.scss'

definePageMeta({ middleware: 'game-init' })

const activeFilter = ref('all')
</script>
