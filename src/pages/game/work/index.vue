<template>
  <GameLayout title="Работа">
    <CurrentJobPanel />

    <CareerTrack />

    <SectionHeader title="Доступные вакансии" subtitle="Выберите подходящую ваканцию" />

    <div class="filter-bar">
      <div class="filter-bar__chips">
        <button
          v-for="type in types"
          :key="type.id"
          class="chip"
          :class="{ 'chip--active': activeWorkType === type.id }"
          @click="activeWorkType = type.id"
        >
          <span class="chip__icon">{{ type.icon }}</span>
          <span class="chip__label">{{ type.label }}</span>
        </button>
      </div>

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
            {{ industry.icon }} {{ industry.label }}
          </option>
        </select>
        <span class="filter-bar__arrow">
          <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
            <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
      </div>
    </div>

    <div class="action-card-list">
      <RoundedPanel
        v-for="job in filteredJobs"
        :key="job.id"
        class="action-card"
        :class="{ disabled: !job.unlocked }"
      >
        <div class="card-header">
          <span class="card-title">{{ job.name }}</span>
          <span class="card-price">{{ formatMoney((job as any).effectiveSalaryPerHour ?? (job as any).salaryPerHour) }} ₽/ч</span>
        </div>

        <p class="card-effect">{{ job.description }}</p>

        <div class="card-meta">
          <span class="meta-tag">Уровень {{ job.level }}</span>
          <span class="meta-tag">{{ job.schedule }}</span>
          <span v-if="job.current" class="meta-tag meta-tag--current">Текущая</span>
        </div>

        <div v-if="!job.unlocked" class="card-meta">
          <span v-if="(job as any).missingProfessionalism > 0" class="meta-tag meta-tag--req">
            Профессионализм: ещё {{ (job as any).missingProfessionalism }} ур.
          </span>
          <span class="meta-tag meta-tag--req">Образование: {{ (job as any).educationRequiredLabel }}</span>
        </div>

        <div class="card-footer">
          <GameButton
            v-if="job.unlocked && !job.current"
            label="Устроиться"
            color="var(--color-accent)"
            text-color="#fff"
            small
            @click="applyForJob(job)"
          />
        </div>
      </RoundedPanel>

      <EmptyState v-if="filteredJobs.length === 0" text="Нет доступных вакансий по выбранному фильтру" />
    </div>
  </GameLayout>
</template>

<script setup lang="ts">
import { formatMoney } from '@/utils/format'
import { WORK_TYPES, INDUSTRIES, JOB_INDUSTRY_MAP } from '@/constants/work-categories'
import CareerTrack from '@/components/pages/career/CareerTrack/CareerTrack.vue'

definePageMeta({ middleware: 'game-init' })

const store = useGameStore()

const toast = useToast()

const activeWorkType = ref('full-time')
const activeIndustry = ref('all')

const types = WORK_TYPES
const industries = INDUSTRIES

const careerTrack = computed(() => {
  void store.worldTick

  return store.getCareerTrack()
})

const currentWorkType = computed(() =>
  WORK_TYPES.find(t => t.id === activeWorkType.value) ?? WORK_TYPES[0]
)

const filteredJobs = computed(() => {
  const jobs = careerTrack.value as any[]

  return jobs.filter(job => {
    const scheduleMatches = currentWorkType.value.scheduleFilter.includes(job.schedule)
    const industryId = JOB_INDUSTRY_MAP[job.id] ?? 'all'
    const industryMatches = activeIndustry.value === 'all' || industryId === activeIndustry.value

    return scheduleMatches && industryMatches
  })
})

function applyForJob(job: any): void {
  const result = store.changeCareer(job.id)
  if (result.success) {
    toast.showSuccess(result.message)
  } else {
    toast.showWarning(result.message)
  }
}
</script>

<style scoped lang="scss">
@use '@/assets/scss/variables.scss' as *;
@use '@/assets/scss/mixins.scss' as *;

/* ───── Filter bar: chips + select ───── */
.filter-bar {
  display: flex;
  align-items: center;
  gap: $space-2;
  flex-wrap: wrap;
}

.filter-bar__chips {
  display: flex;
  gap: $space-1;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  padding: $space-1 $space-3;
  border: 1px solid var(--color-border);
  border-radius: 100px;
  background: var(--color-bg-card);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: $font-size-xs;
  color: var(--color-text-secondary);
  white-space: nowrap;

  &:hover {
    border-color: var(--color-accent);
    color: var(--color-text-primary);
  }

  &--active {
    background: var(--color-accent);
    border-color: var(--color-accent);
    color: var(--color-text-on-accent);
    font-weight: $font-weight-medium;

    &:hover {
      background: var(--color-accent);
      border-color: var(--color-accent);
    }
  }
}

.chip__icon {
  font-size: $font-size-sm;
  line-height: 1;
}

.chip__label {
  line-height: 1;
}

/* ───── Custom select ───── */
.filter-bar__select-wrap {
  position: relative;
  margin-left: auto;
}

.filter-bar__select {
  appearance: none;
  -webkit-appearance: none;
  padding: $space-1 $space-8 $space-1 $space-3;
  border: 1px solid var(--color-border);
  border-radius: 100px;
  background: var(--color-bg-card);
  color: var(--color-text-primary);
  font-size: $font-size-xs;
  cursor: pointer;
  transition: all var(--transition-fast);
  line-height: 1.4;

  &:hover {
    border-color: var(--color-accent);
  }

  &:focus {
    outline: none;
    border-color: var(--color-accent);
    box-shadow: 0 0 0 2px var(--color-accent-alpha);
  }
}

.filter-bar__arrow {
  position: absolute;
  right: $space-3;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  transition: transform var(--transition-fast);
}

/* ───── Card grid (same as ActionCardList) ───── */
.action-card-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: $space-3;

  @include respond-to('md') {
    grid-template-columns: repeat(2, 1fr);
  }

  @include respond-to('lg') {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* ───── Card (same as ActionCard) ───── */
.action-card {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: $space-1;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);

  &.disabled {
    opacity: 0.5;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
}

.card-price {
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: var(--color-brand-accent);
}

.card-effect {
  font-size: $font-size-xs;
  color: var(--color-text-secondary);
  margin: $space-1 0;
  white-space: pre-line;
  line-height: $line-height-base;
}

.card-meta {
  display: flex;
  gap: $space-2;
  margin-top: 2px;
}

.meta-tag {
  font-size: 10px;
  background: var(--color-bg-elevated);
  padding: 2px $space-2;
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);

  &--current {
    background: var(--color-success);
    color: white;
  }

  &--req {
    color: var(--color-warning);
  }
}

.card-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 6px;
}
</style>
