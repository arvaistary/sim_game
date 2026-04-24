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
import './index.scss'

definePageMeta({ middleware: 'game-init' })
</script>
