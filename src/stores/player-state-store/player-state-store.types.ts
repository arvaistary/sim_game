import type { JobSearchChannelId } from '@/domain/balance/types/job-search.types'

export type JobSearchPersistedState = {
  lastJobSearchGameWeek: number | null
  savedVacancyIds: string[]
  savedSearchChannelId: JobSearchChannelId | null
}

export type PlayerStateSnapshot = {
  possessions: string[]
  discoveredJobSearchChannels: JobSearchChannelId[]
  jobSearch: JobSearchPersistedState
}

export type RecordJobSearchPayload = {
  gameWeek: number
  channelId: JobSearchChannelId
  vacancyIds: string[]
}
