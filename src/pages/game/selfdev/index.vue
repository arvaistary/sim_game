<script setup lang="ts">
import { definePageMeta, navigateTo } from '#imports'

definePageMeta({ middleware: 'game-init' })
await navigateTo('/game/education?tab=practice', { replace: true })
</script>
