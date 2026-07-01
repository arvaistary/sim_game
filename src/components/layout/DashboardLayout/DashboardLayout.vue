<template>
  <div class="dashboard-shell">
    <!-- Desktop sidebar -->
    <aside
      v-if="$slots.sidebar"
      class="dashboard-shell__sidebar"
      data-tour="sidebar"
    >
      <slot name="sidebar" />
    </aside>

    <div class="dashboard-shell__main">
      <!-- Topbar -->
      <header
        v-if="$slots.topbar"
        class="dashboard-shell__topbar"
        data-tour="topbar"
      >
        <slot name="topbar" />
      </header>

      <!-- Page content -->
      <main class="dashboard-shell__content">
        <slot />
      </main>
    </div>

    <!-- Mobile bottom nav -->
    <nav
      v-if="$slots.bottomnav"
      class="dashboard-shell__bottomnav"
    >
      <slot name="bottomnav" />
    </nav>
  </div>
</template>

<script setup lang="ts">
import './DashboardLayout.scss'
</script>
