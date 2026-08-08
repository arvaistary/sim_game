<template>
  <DashboardLayout>
    <template #sidebar>
      <GameNav mode="sidebar" />
    </template>

    <template #topbar>
      <Topbar title="Главная" />
    </template>

    <template #bottomnav>
      <GameNav mode="bottom" />
    </template>

    <div class="main-page">
      <div class="top-row">
        <ProfileCard
          class="top-row__profile"
          data-tour="profile"
        />
        <StatsCard class="top-row__stats" />
        <ActivityLogCard class="top-row__log" />
      </div>
      <HomePreview />
      <DayPlannerPanel />
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import './index.scss'

definePageMeta({ middleware: 'game-init' })
</script>
