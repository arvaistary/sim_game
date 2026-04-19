<template>
  <GameLayout title="Навыки">
    <SkillList />
  </GameLayout>
</template>

<script setup lang="ts">
import { definePageMeta } from '#imports'
definePageMeta({ middleware: 'game-init' })
</script>
