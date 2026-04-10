<template>
  <div class="main-page">
    <div class="top-row">
      <ProfileCard class="top-row__profile" />
      <ActivityLogCard class="top-row__log" />
      <StatsCard class="top-row__stats" />
    </div>
    <HomePreview />
    <WorkButton />
    <GameNav />
  </div>
</template>

<script setup lang="ts">
import { definePageMeta } from '#imports'
import ProfileCard from '@/components/pages/dashboard/ProfileCard/ProfileCard.vue'
import ActivityLogCard from '@/components/pages/dashboard/ActivityLogCard/ActivityLogCard.vue'
import StatsCard from '@/components/pages/dashboard/StatsCard/StatsCard.vue'
import HomePreview from '@/components/pages/dashboard/HomePreview/HomePreview.vue'
import WorkButton from '@/components/pages/dashboard/WorkButton/WorkButton.vue'
import GameNav from '@/components/pages/dashboard/GameNav/GameNav.vue'

definePageMeta({ middleware: 'game-init' })
</script>

<style scoped lang="scss">
.main-page {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  max-width: $size-content-max-width;
  padding: $space-4;
  gap: $space-4;
  margin: 0 auto;
  overflow: hidden;
}

.top-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: $space-4;
  flex-shrink: 0;
}

@media (max-width: $breakpoint-lg) {
  .main-page {
    overflow-y: auto;
    padding: $space-3;
    gap: $space-3;
  }

  .top-row {
    display: flex;
    flex-wrap: wrap;
    gap: $space-3;
  }

  .top-row__profile {
    width: 100%;
  }

  .top-row__log {
    width: calc(50% - 6px);
  }

  .top-row__stats {
    width: calc(50% - 6px);
  }
}
</style>
