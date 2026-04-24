<template>
  <GameLayout title="Журнал">
    <div class="activity-page">
      <ActivityFilter v-model="activeFilter" />
      <ActivityLogList />
    </div>
  </GameLayout>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'game-init' })

const activeFilter = ref('all')
</script>

<style scoped lang="scss">
.activity-page {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
}
</style>
