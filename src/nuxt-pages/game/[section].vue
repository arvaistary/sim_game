<template>
  <component :is="component" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { createError, definePageMeta, useRoute } from '#imports'
import RecoveryPage from '@/pages/RecoveryPage.vue'
import CareerPage from '@/pages/CareerPage.vue'
import FinancePage from '@/pages/FinancePage.vue'
import EducationPage from '@/pages/EducationPage.vue'
import EventQueuePage from '@/pages/EventQueuePage.vue'
import SkillsPage from '@/pages/SkillsPage.vue'
import HobbyPage from '@/pages/HobbyPage.vue'
import HealthPage from '@/pages/HealthPage.vue'
import SelfdevPage from '@/pages/SelfdevPage.vue'
import ShopPage from '@/pages/ShopPage.vue'
import SocialPage from '@/pages/SocialPage.vue'
import HomePage from '@/pages/HomePage.vue'
import ActivityLogPage from '@/pages/ActivityLogPage.vue'

definePageMeta({
  middleware: 'game-init',
})

const route = useRoute()

const componentMap: Record<string, unknown> = {
  recovery: RecoveryPage,
  career: CareerPage,
  finance: FinancePage,
  education: EducationPage,
  events: EventQueuePage,
  skills: SkillsPage,
  hobby: HobbyPage,
  health: HealthPage,
  selfdev: SelfdevPage,
  shop: ShopPage,
  social: SocialPage,
  home: HomePage,
  activity: ActivityLogPage,
}

const section = computed(() => String(route.params.section ?? ''))

const component = computed(() => componentMap[section.value])

if (!component.value) {
  throw createError({
    statusCode: 404,
    statusMessage: `Unknown game section: ${section.value}`,
  })
}
</script>
