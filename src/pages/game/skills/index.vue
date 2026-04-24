<template>
  <GameLayout title="Навыки">
    <SkillList />
  </GameLayout>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'game-init' })
</script>
