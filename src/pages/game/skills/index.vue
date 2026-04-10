<template>
  <GameLayout title="Навыки">
    <SkillList />
  </GameLayout>
</template>

<script setup lang="ts">
import { definePageMeta } from '#imports'
import GameLayout from '@/components/layout/GameLayout/GameLayout.vue'
import SkillList from '@/components/pages/skills/SkillList/SkillList.vue'

definePageMeta({ middleware: 'game-init' })
</script>
