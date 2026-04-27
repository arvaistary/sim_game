<template>
  <GameLayout title="Работа">
    <CurrentJobPanel />    

    <CareerTrack @apply="applyForJob" />
  </GameLayout>
</template>

<script setup lang="ts">
import type { CareerTrackJob } from '@components/pages/career/CareerTrack'
import type { QuitCareerResult } from '@stores/game-store'

definePageMeta({ middleware: 'game-init' })

const store = useGameStore()

const toast = useToast()

function applyForJob(job: CareerTrackJob): void {
  const result: QuitCareerResult = store.changeCareer(job.id)

  if (result.success) {
    toast.showSuccess(result.message)
  } else {
    toast.showWarning(result.message)
  }
}
</script>
