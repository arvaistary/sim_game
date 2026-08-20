import { describe, expect, it } from 'vitest'
import { JOB_SEARCH_CHANNELS } from '@/config/job-search'
import type {
  ExecuteJobSearchParams,
  ExecuteJobSearchResult,
  JobSearchChannel,
  JobSearchPlayerContext,
  JobSearchVacancyCandidate,
} from '@/domain/balance/types/job-search.types'
import {
  canPerformJobSearchThisWeek,
  executeJobSearch,
  isJobSearchChannelAvailable,
} from '@/domain/balance/utils/job-search-pool'

describe('job search pool', () => {
  const candidates: JobSearchVacancyCandidate[] = [
    { id: 'office_employee', gradeLevel: 1, industryId: 'office' },
    { id: 'it_middle', gradeLevel: 4, industryId: 'analytics' },
    { id: 'it_senior', gradeLevel: 7, industryId: 'analytics' },
  ]

  it('enforces the weekly search limit', () => {
    expect(canPerformJobSearchThisWeek(null, 3)).toBe(true)
    expect(canPerformJobSearchThisWeek(3, 3)).toBe(false)
    expect(canPerformJobSearchThisWeek(3, 4)).toBe(true)
  })

  it('filters vacancies by channel grade and excludes the current job', () => {
    const result: ExecuteJobSearchResult = executeJobSearch({
      channels: JOB_SEARCH_CHANNELS,
      channelId: 'newspaper',
      candidates,
      seed: 7,
      excludeJobIds: ['office_employee'],
    })

    expect(result.vacancyIds).toEqual([])
    expect(result.emptyResult).toBe(true)
  })

  it('unlocks internet search only when the computer is owned', () => {
    const channel: JobSearchChannel = JOB_SEARCH_CHANNELS.find(
      (item) => item.id === 'internet',
    )!
    const context: JobSearchPlayerContext = {
      possessions: [],
      discoveredChannels: [],
      professionalismLevel: 0,
      isEmployed: false,
      charismaLevel: 0,
    }

    expect(isJobSearchChannelAvailable(channel, context)).toBe(false)
    expect(isJobSearchChannelAvailable(channel, { ...context, possessions: ['computer'] })).toBe(true)
  })

  it('returns a deterministic result for the same seed', () => {
    const params: ExecuteJobSearchParams = {
      channels: JOB_SEARCH_CHANNELS,
      channelId: 'newspaper' as const,
      candidates,
      seed: 42,
    }

    expect(executeJobSearch(params)).toEqual(executeJobSearch(params))
  })
})
