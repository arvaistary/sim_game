<template>
  <DashboardLayout>
    <!-- Desktop sidebar -->
    <template v-if="showNav" #sidebar>
      <GameNav mode="sidebar" />
    </template>

    <!-- Topbar with page title -->
    <template v-if="showHeader" #topbar>
      <Topbar :title="title" />
    </template>

    <!-- Page content -->
    <slot />

    <!-- Mobile bottom nav -->
    <template v-if="showNav" #bottomnav>
      <GameNav mode="bottom" />
    </template>
  </DashboardLayout>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  title?: string
  showHeader?: boolean
  showNav?: boolean
}>(), {
  title: '',
  showHeader: true,
  showNav: true,
})
</script>
