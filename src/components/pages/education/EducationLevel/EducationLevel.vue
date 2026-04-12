<template>
  <RoundedPanel>
    <h3 class="section-title">Текущий уровень</h3>
    <div class="edu-level">
      <span class="edu-label">{{ educationLevel }}</span>
      <span v-if="activeCourse" class="edu-active">📚 {{ activeCourse.name }}</span>
    </div>
  </RoundedPanel>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import RoundedPanel from '@/components/ui/RoundedPanel/index.vue'
import { useGameStore } from '@/stores/game.store'

const store = useGameStore()

const educationLevel = computed(() => {
  const edu = store.education as unknown as Record<string, unknown> | null
  return (edu?.educationLevel as string) ?? 'Нет'
})

const activeCourse = computed(() => {
  const edu = store.education as unknown as Record<string, unknown> | null
  const courses = edu?.activeCourses as Array<Record<string, unknown>> | null
  return courses && courses.length > 0 ? courses[0] : null
})
</script>

<style scoped lang="scss" src="./EducationLevel.scss"></style>
