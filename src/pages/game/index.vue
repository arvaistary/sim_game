<template>
  <div class="main-page">
    <div class="top-row">
      <ProfileCard class="top-row__profile" />      
      <StatsCard class="top-row__stats" />
      <ActivityLogCard class="top-row__log" />
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
import GameNav from '@/components/global/GameNav/GameNav.vue'
import './index.scss'

definePageMeta({ middleware: 'game-init' })
</script>
