<template>
  <MainPage />
</template>

<script setup lang="ts">
import { definePageMeta } from '#imports'
import MainPage from '@/pages/MainPage.vue'

definePageMeta({
  middleware: 'game-init',
})
</script>

