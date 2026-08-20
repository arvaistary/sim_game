import type { Ref } from 'vue'
import type { JobSearchChannelId } from '@/domain/balance/types/job-search.types'
import { canPerformJobSearchThisWeek } from '@/domain/balance/utils/job-search-pool'
import type {
  JobSearchPersistedState,
  PlayerStateSnapshot,
  RecordJobSearchPayload,
} from './player-state-store.types'

const EMPTY_JOB_SEARCH: JobSearchPersistedState = {
  lastJobSearchGameWeek: null,
  savedVacancyIds: [],
  savedSearchChannelId: null,
}

/**
 * @description [Store] - вещи персонажа, разблокировки и сохранённый результат поиска работы.
 */
export const usePlayerStateStore = defineStore('playerState', () => {
  const possessions: Ref<string[]> = ref<string[]>([])
  const discoveredJobSearchChannels: Ref<JobSearchChannelId[]> = ref<JobSearchChannelId[]>([])
  const jobSearch: Ref<JobSearchPersistedState> = ref<JobSearchPersistedState>({ ...EMPTY_JOB_SEARCH })

  function hasPossession(possessionId: string): boolean {
    return possessions.value.includes(possessionId)
  }

  /** Синхронизация из будущего инвентаря: заменяет список вещей целиком. */
  function setPossessions(possessionIds: string[]): void {
    possessions.value = [...possessionIds]
  }

  function addPossession(possessionId: string): void {
    if (hasPossession(possessionId)) return

    possessions.value = [...possessions.value, possessionId]
  }

  function discoverJobSearchChannel(channelId: JobSearchChannelId): void {
    if (discoveredJobSearchChannels.value.includes(channelId)) return

    discoveredJobSearchChannels.value = [...discoveredJobSearchChannels.value, channelId]
  }

  function canSearchJobsThisWeek(currentGameWeek: number): boolean {
    return canPerformJobSearchThisWeek(jobSearch.value.lastJobSearchGameWeek, currentGameWeek)
  }

  function recordJobSearch(payload: RecordJobSearchPayload): void {
    jobSearch.value = {
      lastJobSearchGameWeek: payload.gameWeek,
      savedVacancyIds: [...payload.vacancyIds],
      savedSearchChannelId: payload.channelId,
    }
  }

  function clearJobSearch(): void {
    const lastJobSearchGameWeek: number | null = jobSearch.value.lastJobSearchGameWeek

    jobSearch.value = {
      ...EMPTY_JOB_SEARCH,
      lastJobSearchGameWeek,
    }
  }

  function save(): PlayerStateSnapshot {
    return {
      possessions: [...possessions.value],
      discoveredJobSearchChannels: [...discoveredJobSearchChannels.value],
      jobSearch: { ...jobSearch.value, savedVacancyIds: [...jobSearch.value.savedVacancyIds] },
    }
  }

  function load(data?: Partial<PlayerStateSnapshot>): void {
    possessions.value = Array.isArray(data?.possessions) ? [...data.possessions] : []
    discoveredJobSearchChannels.value = Array.isArray(data?.discoveredJobSearchChannels)
      ? [...data.discoveredJobSearchChannels] as JobSearchChannelId[]
      : []

    const saved: Partial<JobSearchPersistedState> | undefined = data?.jobSearch

    jobSearch.value = {
      lastJobSearchGameWeek: typeof saved?.lastJobSearchGameWeek === 'number' ? saved.lastJobSearchGameWeek : null,
      savedVacancyIds: Array.isArray(saved?.savedVacancyIds) ? [...saved.savedVacancyIds] : [],
      savedSearchChannelId: saved?.savedSearchChannelId ?? null,
    }
  }

  function reset(): void {
    possessions.value = []
    discoveredJobSearchChannels.value = []
    jobSearch.value = { ...EMPTY_JOB_SEARCH }
  }

  return {
    possessions,
    discoveredJobSearchChannels,
    jobSearch,
    hasPossession,
    setPossessions,
    addPossession,
    discoverJobSearchChannel,
    canSearchJobsThisWeek,
    recordJobSearch,
    clearJobSearch,
    save,
    load,
    reset,
  }
})
