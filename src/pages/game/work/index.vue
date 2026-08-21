<template>
  <GameLayout title="Работа">
    <div class="work-page">
      <CurrentJobPanel @quit="resetJobSearch" />

      <CareerTrack v-if="isEmployed" />

      <template v-if="isSearching">
        <div class="work-page__vacancies-header section-header section-header--plain">
          <div class="work-page__vacancies-heading">
            <div class="work-page__vacancies-copy">
              <h3 class="section-header__title">{{ vacanciesTitle }}</h3>
              <p v-if="vacanciesSubtitle" class="section-header__subtitle">{{ vacanciesSubtitle }}</p>
            </div>

            <button
              v-if="shouldShowFilterToggle"
              type="button"
              class="work-page__filter-toggle"
              :class="{ 'work-page__filter-toggle--active': isFiltersPanelVisible }"
              :aria-label="filterToggleAriaLabel"
              :aria-expanded="isFiltersPanelVisible"
              @click="toggleFiltersPanel"
            >
              <GameIcon name="filter" :size="20" />
            </button>
          </div>
        </div>

        <RoundedPanel
          v-if="isFiltersPanelVisible"
          class="work-page__filters"
          padding="19px 15px"
        >
          <div class="filter-bar">
            <div class="filter-bar__chips">
              <button
                v-for="type in types"
                :key="type.id"
                class="chip"
                :class="{ 'chip--active': activeWorkType === type.id }"
                @click="activeWorkType = type.id"
              >
                <GameIcon class="chip__icon" :name="type.icon" :size="16" />
                <span class="chip__label">{{ type.label }}</span>
              </button>
            </div>

            <div class="filter-bar__actions">
              <button
                type="button"
                class="chip chip--accent"
                @click="openFindWorkModal"
              >
                {{ searchAgainButtonLabel }}
              </button>

              <div class="filter-bar__select-wrap">
                <select
                  class="filter-bar__select"
                  :value="activeIndustry"
                  @change="activeIndustry = ($event.target as HTMLSelectElement).value"
                >
                  <option
                    v-for="industry in industries"
                    :key="industry.id"
                    :value="industry.id"
                  >
                    {{ industry.label }}
                  </option>
                </select>
                <span class="filter-bar__arrow" aria-hidden="true">
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                    <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </RoundedPanel>

        <div class="work-page__vacancies">
          <VacancyCard
            v-for="job in filteredJobs"
            :key="job.id"
            :job="job"
            :disabled="!canApply(job)"
            :disabled-reason="getDisabledReason(job)"
            @apply="applyForJob"
          />

          <EmptyState
            v-if="filteredJobs.length === 0"
            :text="vacanciesEmptyText"
          />
        </div>
      </template>

      <RoundedPanel v-else class="work-page__empty" padding="var(--space-card-padding)">
        <EmptyState :text="emptyStateText" />
        <div class="work-page__empty-actions">
          <GameButton label="Найти работу" variant="primary" @click="openFindWorkModal" />
        </div>
      </RoundedPanel>

      <FindWorkModal
        :is-open="isFindWorkModalOpen"
        :intro="searchModalIntro"
        :channels="modalChannels"
        :can-search-this-week="canSearchThisWeek"
        :cooldown-hint="weeklyCooldownHint"
        @close="closeFindWorkModal"
        @select="handleSearchChannelSelect"
      />
    </div>
  </GameLayout>
</template>

<script setup lang="ts">
import './work.scss'
import type { ComputedRef } from 'vue'
import {
  INDUSTRIES,
  WORK_TYPES,
} from '@/config/work-categories'
import CareerTrack from '@/components/pages/career/CareerTrack/CareerTrack.vue'
import FindWorkModal from '@/components/pages/career/FindWorkModal/FindWorkModal.vue'
import VacancyCard from '@/components/game/VacancyCard/VacancyCard.vue'
import GameIcon from '@/components/ui/GameIcon/GameIcon.vue'
import { useJobSearch } from '@/composables/useJobSearch'
import { useWorkCareerItems } from '@/composables/useWorkCareerItems'
import type { CareerTrackJobItem } from '@/domain/balance/types'
import type { JobSearchChannelId } from '@/domain/balance/types/job-search.types'
import type { ChangeCareerResult } from '@/stores/game.store.types'

const VACANCY_FILTER_AUTO_SHOW_THRESHOLD: number = 7

definePageMeta({ middleware: 'game-init' })

const store = useGameStore()

const careerStore = useCareerStore()

const playerStateStore = usePlayerStateStore()

const toast = useToast()

const { items } = useWorkCareerItems()

const jobSearch = useJobSearch()
const {
  canSearchThisWeek,
  modalChannels,
  searchModalIntro,
  weeklyCooldownHint,
} = jobSearch

const activeWorkType = ref('full-time')
const activeIndustry = ref('all')
const isFindWorkModalOpen = ref(false)
const isFiltersPanelVisible = ref<boolean>(false)

const types: typeof WORK_TYPES = WORK_TYPES
const industries: typeof INDUSTRIES = INDUSTRIES

const isEmployed: ComputedRef<boolean> = computed(() => careerStore.isEmployed)

const isSearching: ComputedRef<boolean> = computed(() => {
  const search = playerStateStore.jobSearch

  return search.savedVacancyIds.length > 0 || search.savedSearchChannelId !== null
})

const searchAgainButtonLabel: ComputedRef<string> = computed(() => {
  const canSearch: boolean = jobSearch.canSearchThisWeek.value

  if (canSearch) return 'Искать снова'

  return 'Способы поиска'
})

const emptyStateText: ComputedRef<string> = computed(() => {
  const employed: boolean = isEmployed.value

  if (employed) {
    return 'Хотите сменить работу? Выберите способ поиска в модальном окне — газета, биржа, коллеги или знакомые.'
  }

  return 'Вы пока не ищете работу. Нажмите кнопку — и мир предложит вам хоть что-нибудь.'
})

const vacanciesTitle: ComputedRef<string> = computed(() => 'Найденные вакансии')

const vacanciesSubtitle: ComputedRef<string> = computed(() => {
  const channelId: JobSearchChannelId | null = playerStateStore.jobSearch.savedSearchChannelId

  if (channelId) {
    const channel = jobSearch.getChannel(channelId)

    return channel ? `Способ поиска: ${channel.label}` : 'Выберите подходящую вакансию'
  }

  return 'Выберите подходящую вакансию'
})

const currentWorkType: ComputedRef<typeof WORK_TYPES[number]> = computed(() =>
  WORK_TYPES.find((type) => type.id === activeWorkType.value) ?? WORK_TYPES[0]!,
)

const sourceVacancyJobs: ComputedRef<CareerTrackJobItem[]> = computed(() => {
  const allVacancies: CareerTrackJobItem[] = items.value.vacancyJobs
  const jobsById: Map<string, CareerTrackJobItem> = new Map(
    allVacancies.map((job) => [job.id, job]),
  )

  return playerStateStore.jobSearch.savedVacancyIds
    .map((jobId: string) => jobsById.get(jobId))
    .filter((job): job is CareerTrackJobItem => job !== undefined)
})

const filteredJobs = computed<CareerTrackJobItem[]>(() => {
  return sourceVacancyJobs.value.filter((job: CareerTrackJobItem) => {
    const scheduleMatches: boolean = currentWorkType.value.scheduleFilter.includes(job.schedule)
    const industryId: string = jobSearch.getIndustryId(job.id)
    const industryMatches: boolean = activeIndustry.value === 'all' || industryId === activeIndustry.value

    return scheduleMatches && industryMatches
  })
})

const totalVacancyCount: ComputedRef<number> = computed(() => sourceVacancyJobs.value.length)

const shouldShowFilterToggle: ComputedRef<boolean> = computed(() => {
  return totalVacancyCount.value < VACANCY_FILTER_AUTO_SHOW_THRESHOLD
})

const filterToggleAriaLabel: ComputedRef<string> = computed(() => {
  return isFiltersPanelVisible.value ? 'Скрыть фильтры' : 'Показать фильтры'
})

const vacanciesEmptyText: ComputedRef<string> = computed(() => {
  const hasNoSavedVacancies: boolean = sourceVacancyJobs.value.length === 0

  if (hasNoSavedVacancies) {
    return 'Поиск не дал результатов — попробуйте другой способ на следующей неделе.'
  }

  return 'Нет доступных вакансий по выбранному фильтру'
})

watch(totalVacancyCount, (count: number) => {
  isFiltersPanelVisible.value = count >= VACANCY_FILTER_AUTO_SHOW_THRESHOLD
}, { immediate: true })

function toggleFiltersPanel(): void {
  isFiltersPanelVisible.value = !isFiltersPanelVisible.value
}

function resetJobSearch(): void {
  playerStateStore.clearJobSearch()
  activeWorkType.value = 'full-time'
  activeIndustry.value = 'all'
}

function openFindWorkModal(): void {
  isFindWorkModalOpen.value = true
}

function closeFindWorkModal(): void {
  isFindWorkModalOpen.value = false
}

function handleSearchChannelSelect(channelId: JobSearchChannelId): void {
  if (!jobSearch.canSearchThisWeek.value) {
    toast.showInfo(jobSearch.weeklyCooldownHint)
    closeFindWorkModal()

    return
  }

  const channel = jobSearch.getChannel(channelId)

  if (!channel || !jobSearch.isChannelAvailable(channelId)) {
    const reason: string = channel
      ? jobSearch.getChannelLockReason(channelId)
      : 'Способ поиска недоступен'

    toast.showWarning(reason)

    return
  }

  const candidates = items.value.vacancyJobs.map(
    (job) => ({
      id: job.id,
      gradeLevel: job.gradeLevel,
    }),
  )

  const result = jobSearch.searchJobs({ channelId, candidates })

  if (result.successMessage) {
    toast.showSuccess(result.successMessage)
  } else if (result.infoMessage) {
    toast.showInfo(result.infoMessage)
  }

  closeFindWorkModal()
}

function canApply(job: CareerTrackJobItem): boolean {
  return job.unlocked && !job.current
}

function getDisabledReason(job: CareerTrackJobItem): string {
  if (job.current) return 'Это ваша текущая должность'

  if (job.missingAge > 0) {
    return `Требуется возраст ${job.minAge}+`
  }

  if (job.missingPossessionLabels.length > 0) {
    return `Нужно: ${job.missingPossessionLabels.join(', ')}`
  }

  if (!job.unlocked) return 'Требования не выполнены'

  return ''
}

async function applyForJob(job: CareerTrackJobItem): Promise<void> {
  const result: ChangeCareerResult = await store.changeCareerAsync(job.id)

  if (result.success) {
    toast.showSuccess(result.message)
    resetJobSearch()
  } else {
    toast.showWarning(result.message)
  }
}
</script>
