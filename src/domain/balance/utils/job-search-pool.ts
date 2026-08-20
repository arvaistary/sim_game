import {
  COLLEAGUE_REFERRAL_MAX_JOBS,
  COLLEAGUE_REFERRAL_PROBABILITY,
} from '@/domain/balance/constants/job-search'
import { getPossessionLabel } from '@/constants/possessions'
import type {
  ColleagueReferralParams,
  ColleagueReferralResult,
  ExecuteJobSearchParams,
  ExecuteJobSearchResult,
  JobSearchChannel,
  JobSearchChannelId,
  JobSearchPlayerContext,
  JobSearchVacancyCandidate,
  ResolveVacancyPoolParams,
} from '@/domain/balance/types/job-search.types'

/**
 * @description [Utils] - детерминированный seed для выборки вакансий.
 * @return { number }
 */
export function mixJobSearchSeed(baseSeed: number, salt: string): number {
  let hash: number = baseSeed

  for (let index = 0; index < salt.length; index += 1) {
    hash = ((hash << 5) - hash) + salt.charCodeAt(index)
    hash |= 0
  }

  return Math.abs(hash)
}

/**
 * @description [Utils] - псевдослучайное число 0..1 из seed.
 * @return { number }
 */
export function randomUnitFromSeed(seed: number): number {
  const value: number = Math.sin(seed) * 10000

  return value - Math.floor(value)
}

/**
 * @description [Domain] - можно ли начать новый поиск работы на текущей игровой неделе.
 * @return { boolean }
 */
export function canPerformJobSearchThisWeek(lastSearchWeek: number | null, currentGameWeek: number): boolean {
  if (lastSearchWeek === null) return true

  return currentGameWeek > lastSearchWeek
}

/**
 * @description [Domain] - доступен ли способ поиска работы.
 * @return { boolean }
 */
export function isJobSearchChannelAvailable(
  channel: JobSearchChannel,
  context: JobSearchPlayerContext,
): boolean {
  if (channel.unlock.type === 'employed_only') {
    return context.isEmployed
  }

  if (channel.unlock.type === 'always') return true

  if (channel.unlock.type === 'possession') {
    const possessionId: string = channel.unlock.possessionId ?? ''

    return context.possessions.includes(possessionId)
  }

  if (channel.unlock.type === 'relationships') {
    const minRelationships: number = channel.unlock.minRelationships ?? 1

    if (context.charismaLevel >= minRelationships) return true

    return context.professionalismLevel >= 3
  }

  const channelId: JobSearchChannelId = channel.unlock.channelId ?? channel.id

  if (context.discoveredChannels.includes(channelId)) return true

  return context.professionalismLevel >= 3
}

/**
 * @description [Domain] - причина блокировки способа поиска.
 * @return { string }
 */
export function getJobSearchChannelLockReason(
  channel: JobSearchChannel,
  context: JobSearchPlayerContext,
): string {
  if (isJobSearchChannelAvailable(channel, context)) return ''

  if (channel.unlock.type === 'employed_only') {
    return 'Доступно только при текущей работе'
  }

  if (channel.unlock.type === 'possession') {
    const possessionId: string = channel.unlock.possessionId ?? ''
    const label: string = getPossessionLabel(possessionId)

    return `Нужно: ${label}`
  }

  if (channel.unlock.type === 'relationships') {
    return 'Нужен более широкий круг знакомых или профессионализм от 3'
  }

  return 'Откроется с опытом или после других способов поиска'
}

/**
 * @description [Domain] - пул вакансий по выбранному способу поиска.
 * @return { string[] }
 */
export function resolveVacancyPoolByChannel(params: ResolveVacancyPoolParams): string[] {
  const channel: JobSearchChannel = params.channel

  const excluded: Set<string> = new Set(params.excludeJobIds ?? [])
  let pool: JobSearchVacancyCandidate[] = params.candidates.filter(
    (job) => {
      if (excluded.has(job.id)) return false

      if (channel.filter.maxGradeLevel !== undefined && job.gradeLevel > channel.filter.maxGradeLevel) {
        return false
      }

      return true
    },
  )

  if (channel.filter.randomPick) {
    pool = shuffleWithSeed(pool, params.seed)
  } else {
    pool = [...pool].sort((left, right) => left.gradeLevel - right.gradeLevel || left.id.localeCompare(right.id))
  }

  if (channel.filter.maxResults !== undefined) {
    pool = pool.slice(0, channel.filter.maxResults)
  }

  return pool.map((job) => job.id)
}

/**
 * @description [Domain] - вакансии из смежных отраслей по рекомендации коллег.
 * @return { ColleagueReferralResult }
 */
export function resolveColleagueReferralJobs(params: ColleagueReferralParams): ColleagueReferralResult {
  const roll: number = randomUnitFromSeed(params.seed)

  if (roll > params.probability) {
    return {
      success: false,
      jobIds: [],
    }
  }

  const adjacentIndustries: readonly string[] = params.adjacentIndustryMap[params.currentIndustryId] ?? []
  const excluded: Set<string> = new Set(params.excludeJobIds ?? [])

  const adjacentPool: JobSearchVacancyCandidate[] = params.candidates.filter(
    (job) => {
      if (excluded.has(job.id)) return false

      return adjacentIndustries.includes(job.industryId)
    },
  )

  const picked: JobSearchVacancyCandidate[] = shuffleWithSeed(adjacentPool, params.seed + 17)
    .slice(0, params.maxExtraJobs)

  return {
    success: picked.length > 0,
    jobIds: picked.map((job) => job.id),
  }
}

/**
 * @description [Domain] - выполнить поиск работы выбранным способом.
 * @return { ExecuteJobSearchResult }
 */
export function executeJobSearch(params: ExecuteJobSearchParams): ExecuteJobSearchResult {
  const channel: JobSearchChannel | undefined = params.channels.find(
    (item) => item.id === params.channelId,
  )

  if (!channel) {
    return {
      vacancyIds: [],
      emptyResult: true,
      infoMessage: 'Способ поиска не найден.',
    }
  }

  if (channel.kind === 'colleague_referral') {
    const currentIndustryId: string = params.currentIndustryId ?? 'office'
    const adjacentIndustryMap: Record<string, readonly string[]> = params.adjacentIndustryMap ?? {}

    const referralResult: ColleagueReferralResult = resolveColleagueReferralJobs({
      candidates: params.candidates,
      currentIndustryId,
      adjacentIndustryMap,
      seed: params.seed,
      probability: COLLEAGUE_REFERRAL_PROBABILITY,
      maxExtraJobs: COLLEAGUE_REFERRAL_MAX_JOBS,
      excludeJobIds: params.excludeJobIds,
    })

    if (!referralResult.success) {
      return {
        vacancyIds: [],
        emptyResult: true,
        infoMessage: 'Сегодня коллеги только пожимают плечами. Попробуйте на следующей неделе.',
      }
    }

    return {
      vacancyIds: referralResult.jobIds,
      emptyResult: referralResult.jobIds.length === 0,
      successMessage: 'Кто-то из отдела скинул пару контактов — смотрите новые вакансии.',
    }
  }

  const vacancyIds: string[] = resolveVacancyPoolByChannel({
    candidates: params.candidates,
    channel,
    seed: params.seed,
    excludeJobIds: params.excludeJobIds,
  })

  if (channel.kind === 'friends_network') {
    if (vacancyIds.length === 0) {
      return {
        vacancyIds: [],
        emptyResult: true,
        infoMessage: 'Знакомые пока ничего внятного не прислали. Может, на следующей неделе повезёт.',
      }
    }

    return {
      vacancyIds,
      emptyResult: false,
      successMessage: 'Кто-то из круга переслал пару вакансий — проверьте список.',
    }
  }

  if (vacancyIds.length === 0) {
    return {
      vacancyIds: [],
      emptyResult: true,
      infoMessage: 'По этому способу ничего подходящего не нашлось.',
    }
  }

  return {
    vacancyIds,
    emptyResult: false,
  }
}

function shuffleWithSeed<T>(items: T[], seed: number): T[] {
  const copy: T[] = [...items]

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex: number = Math.floor(randomUnitFromSeed(seed + index) * (index + 1))
    const current: T = copy[index]!
    const swapValue: T = copy[swapIndex]!
    copy[index] = swapValue
    copy[swapIndex] = current
  }

  return copy
}
