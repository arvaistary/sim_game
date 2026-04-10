<template>
  <GameLayout title="Журнал">
    <div class="activity-page">
      <ActivityFilter v-model="activeFilter" />
      <ActivityLogList />
    </div>
  </GameLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { definePageMeta } from '#imports'
import GameLayout from '@/components/layout/GameLayout/GameLayout.vue'
import ActivityFilter from '@/components/pages/activity/ActivityFilter/ActivityFilter.vue'
import ActivityLogList from '@/components/pages/activity/ActivityLogList/ActivityLogList.vue'

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
