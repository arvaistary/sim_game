<template>
  <Modal
    :is-open="isOpen"
    title="Как будем искать работу?"
    max-width="520px"
    @close="emit('close')"
  >
    <p class="find-work-modal__intro">{{ intro }}</p>

    <p
      v-if="!canSearchThisWeek"
      class="find-work-modal__cooldown"
      role="status"
    >
      {{ cooldownHint }}
    </p>

    <div class="find-work-modal__channels">
      <button
        v-for="channel in channels"
        :key="channel.id"
        type="button"
        class="find-work-modal__channel"
        :class="{ 'find-work-modal__channel--disabled': channel.isDisabled }"
        :disabled="channel.isDisabled"
        @click="handleSelect(channel.id)"
      >
        <span class="find-work-modal__channel-title">{{ channel.label }}</span>
        <span class="find-work-modal__channel-text">{{ channel.modalDescription }}</span>
        <span
          v-if="channel.lockReason"
          class="find-work-modal__channel-lock"
        >
          {{ channel.lockReason }}
        </span>
      </button>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import './FindWorkModal.scss'
import type { JobSearchChannelId } from '@/domain/balance/types/job-search.types'
import type { FindWorkModalEmits, FindWorkModalProps } from './FindWorkModal.types'

const props = defineProps<FindWorkModalProps>()

const emit = defineEmits<FindWorkModalEmits>()

function handleSelect(channelId: JobSearchChannelId): void {
  const channel = props.channels.find(
    (item) => item.id === channelId,
  )

  if (!channel || channel.isDisabled) return

  emit('select', channelId)
}
</script>
