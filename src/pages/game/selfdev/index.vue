<script setup lang="ts">
definePageMeta({ middleware: 'game-init' })
await navigateTo('/game/education?tab=practice', { replace: true })
</script>
