export type JobSearchChannelId =
  | 'newspaper'
  | 'job_center'
  | 'internet'
  | 'friends_network'
  | 'colleague_referral'
  | 'recruitment_agency'

export type JobSearchChannelKind = 'standard' | 'colleague_referral' | 'friends_network'

export type JobSearchUnlockType =
  | 'always'
  | 'possession'
  | 'discovered'
  | 'employed_only'
  | 'relationships'

export type JobSearchChannelUnlock = {
  type: JobSearchUnlockType
  possessionId?: string
  channelId?: JobSearchChannelId
  minRelationships?: number
}

export type JobSearchChannelFilter = {
  maxGradeLevel?: number
  maxResults?: number
  randomPick?: boolean
}

export type JobSearchChannel = {
  id: JobSearchChannelId
  kind: JobSearchChannelKind
  label: string
  teaser: string
  modalDescription: string
  unlock: JobSearchChannelUnlock
  filter: JobSearchChannelFilter
}

export type JobSearchPlayerContext = {
  possessions: readonly string[]
  discoveredChannels: readonly JobSearchChannelId[]
  professionalismLevel: number
  isEmployed: boolean
  charismaLevel: number
}

export type JobSearchVacancyCandidate = {
  id: string
  gradeLevel: number
  industryId: string
}

export type ResolveVacancyPoolParams = {
  candidates: JobSearchVacancyCandidate[]
  channel: JobSearchChannel
  seed: number
  excludeJobIds?: readonly string[]
}

export type ColleagueReferralParams = {
  candidates: JobSearchVacancyCandidate[]
  currentIndustryId: string
  adjacentIndustryMap: Record<string, readonly string[]>
  seed: number
  probability: number
  maxExtraJobs: number
  excludeJobIds?: readonly string[]
}

export type ColleagueReferralResult = {
  success: boolean
  jobIds: string[]
}

export type ExecuteJobSearchParams = {
  channels: readonly JobSearchChannel[]
  channelId: JobSearchChannelId
  candidates: JobSearchVacancyCandidate[]
  seed: number
  excludeJobIds?: readonly string[]
  currentIndustryId?: string
  adjacentIndustryMap?: Record<string, readonly string[]>
}

export type ExecuteJobSearchResult = {
  vacancyIds: string[]
  emptyResult: boolean
  infoMessage?: string
  successMessage?: string
}
