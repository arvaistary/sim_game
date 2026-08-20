import type { ComputedRef } from 'vue'
import {
  ADJACENT_INDUSTRIES,
  JOB_INDUSTRY_MAP,
} from '@/config/work-categories'
import {
  JOB_SEARCH_CHANNELS,
  JOB_SEARCH_MODAL_INTRO,
  JOB_SEARCH_MODAL_INTRO_EMPLOYED,
  JOB_SEARCH_WEEKLY_COOLDOWN_HINT,
  getJobSearchChannel,
} from '@/config/job-search'
import type {
  ExecuteJobSearchResult,
  JobSearchChannel,
  JobSearchChannelId,
  JobSearchPlayerContext,
  JobSearchVacancyCandidate,
} from '@/domain/balance/types/job-search.types'
import {
  executeJobSearch,
  getJobSearchChannelLockReason,
  isJobSearchChannelAvailable,
  mixJobSearchSeed,
} from '@/domain/balance/utils/job-search-pool'
import type {
  JobSearchModalChannel,
  SearchJobsParams,
  UseJobSearch,
} from './useJobSearch.types'

/**
 * @description [Composable] - каналы поиска, weekly limit и сохранение результата поиска.
 * @return { UseJobSearch }
 */
export function useJobSearch(): UseJobSearch {
  const store = useGameStore()
  const careerStore = useCareerStore()
  const skillsStore = useSkillsStore()
  const playerStateStore = usePlayerStateStore()

  const isEmployed: ComputedRef<boolean> = computed(() => careerStore.isEmployed)

  const canSearchThisWeek: ComputedRef<boolean> = computed(() => {
    void store.worldTick

    return playerStateStore.canSearchJobsThisWeek(store.gameWeeks)
  })

  const searchModalIntro: ComputedRef<string> = computed(() => {
    return isEmployed.value ? JOB_SEARCH_MODAL_INTRO_EMPLOYED : JOB_SEARCH_MODAL_INTRO
  })

  function getContext(): JobSearchPlayerContext {
    return {
      possessions: playerStateStore.possessions,
      discoveredChannels: playerStateStore.discoveredJobSearchChannels,
      professionalismLevel: skillsStore.skills?.professionalism?.level ?? 0,
      isEmployed: isEmployed.value,
      charismaLevel: skillsStore.skills?.charisma?.level ?? 0,
    }
  }

  const modalChannels: ComputedRef<JobSearchModalChannel[]> = computed(() => {
    const context: JobSearchPlayerContext = getContext()
    const weeklyBlocked: boolean = !canSearchThisWeek.value

    return JOB_SEARCH_CHANNELS
      .filter((channel: JobSearchChannel) => {
        return channel.unlock.type !== 'employed_only' || context.isEmployed
      })
      .map((channel: JobSearchChannel): JobSearchModalChannel => {
        const isAvailable: boolean = isJobSearchChannelAvailable(channel, context)
        const channelLockReason: string = getJobSearchChannelLockReason(channel, context)

        return {
          ...channel,
          isDisabled: weeklyBlocked || !isAvailable,
          lockReason: weeklyBlocked ? undefined : (channelLockReason || undefined),
        }
      })
  })

  function getChannel(channelId: JobSearchChannelId): JobSearchChannel | undefined {
    return getJobSearchChannel(channelId)
  }

  function getChannelLockReason(channelId: JobSearchChannelId): string {
    const channel: JobSearchChannel | undefined = getChannel(channelId)

    if (!channel) return 'Способ поиска недоступен'

    return getJobSearchChannelLockReason(channel, getContext())
  }

  function isChannelAvailable(channelId: JobSearchChannelId): boolean {
    const channel: JobSearchChannel | undefined = getChannel(channelId)

    return channel !== undefined && isJobSearchChannelAvailable(channel, getContext())
  }

  function getIndustryId(jobId: string): string {
    return JOB_INDUSTRY_MAP[jobId] ?? 'office'
  }

  function searchJobs(params: SearchJobsParams): ExecuteJobSearchResult {
    const currentJobId: string = careerStore.currentJob?.id ?? ''
    const seed: number = mixJobSearchSeed(store.worldTick, `${params.channelId}-${store.gameWeeks}`)
    const currentIndustryId: string = JOB_INDUSTRY_MAP[currentJobId] ?? 'office'
    const candidates: JobSearchVacancyCandidate[] = params.candidates.map(
      (candidate): JobSearchVacancyCandidate => ({
        ...candidate,
        industryId: JOB_INDUSTRY_MAP[candidate.id] ?? 'office',
      }),
    )
    const result: ExecuteJobSearchResult = executeJobSearch({
      channels: JOB_SEARCH_CHANNELS,
      channelId: params.channelId,
      candidates,
      seed,
      excludeJobIds: currentJobId ? [currentJobId] : [],
      currentIndustryId,
      adjacentIndustryMap: ADJACENT_INDUSTRIES,
    })

    playerStateStore.discoverJobSearchChannel(params.channelId)
    playerStateStore.recordJobSearch({
      gameWeek: store.gameWeeks,
      channelId: params.channelId,
      vacancyIds: result.vacancyIds,
    })

    return result
  }

  return {
    canSearchThisWeek,
    modalChannels,
    searchModalIntro,
    weeklyCooldownHint: JOB_SEARCH_WEEKLY_COOLDOWN_HINT,
    getChannel,
    getChannelLockReason,
    isChannelAvailable,
    getIndustryId,
    searchJobs,
  }
}
