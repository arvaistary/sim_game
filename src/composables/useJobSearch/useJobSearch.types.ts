import type { ComputedRef } from 'vue'
import type {
  ExecuteJobSearchResult,
  JobSearchChannel,
  JobSearchChannelId,
  JobSearchVacancyCandidate,
} from '@/domain/balance/types/job-search.types'

export type JobSearchModalChannel = JobSearchChannel & {
  isDisabled: boolean
  lockReason?: string
}

export type JobSearchCandidateInput = Pick<JobSearchVacancyCandidate, 'id' | 'gradeLevel'>

export type SearchJobsParams = {
  channelId: JobSearchChannelId
  candidates: JobSearchCandidateInput[]
}

export interface UseJobSearch {
  canSearchThisWeek: ComputedRef<boolean>
  modalChannels: ComputedRef<JobSearchModalChannel[]>
  searchModalIntro: ComputedRef<string>
  weeklyCooldownHint: string
  getChannel(channelId: JobSearchChannelId): JobSearchChannel | undefined
  getChannelLockReason(channelId: JobSearchChannelId): string
  getIndustryId(jobId: string): string
  isChannelAvailable(channelId: JobSearchChannelId): boolean
  searchJobs(params: SearchJobsParams): ExecuteJobSearchResult
}
