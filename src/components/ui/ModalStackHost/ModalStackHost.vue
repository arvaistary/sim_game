<template>
  <template v-for="entry in stack" :key="entry.id">
    <component
      :is="entry.component"
      v-bind="entry.props"
      :z-index="entry.zIndex"
      @close="close(entry.id)"
    />
  </template>
</template>

<script setup lang="ts">
import { useModalStack } from '@/composables/useModalStack'

const { stack, close } = useModalStack()
</script>
