import type { JobSearchModalChannel } from '@/composables/useJobSearch/useJobSearch.types'
import type { JobSearchChannelId } from '@/domain/balance/types/job-search.types'

export type FindWorkModalProps = {
  isOpen: boolean
  intro: string
  channels: JobSearchModalChannel[]
  canSearchThisWeek: boolean
  cooldownHint: string
}

export type FindWorkModalEmits = {
  close: []
  select: [channelId: JobSearchChannelId]
}
