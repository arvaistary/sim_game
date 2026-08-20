<script setup lang="ts">
definePageMeta({
  middleware: [
    'game-init',
    () => navigateTo('/game/education?tab=practice', { replace: true }),
  ],
})
</script>

<template>
  <GameLayout title="Саморазвитие">
    <EmptyState text="Раздел саморазвития перенесён во вкладку «Практика» в образовании." />
  </GameLayout>
</template>
