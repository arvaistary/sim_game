<template>
  <div class="programs-wrapper">
    <h3 class="section-title">Курсы и программы</h3>
    <div class="programs-list">
      <Tooltip
        v-for="program in sortedCoursePrograms"
        :key="program.id"
        :text="getLockReason(program)"
        :follow-cursor="true"
        multiline
      >
        <RoundedPanel
          :class="{
            disabled: !isProgramAvailable(program),
            'age-locked': !isAgeOk(program),
          }"
          @click="startProgram(program)"
          class="program-card"
          >
          <div class="program-header">
            <span class="program-title">
              {{ program.title }}
            </span>
            <span class="program-type">
              {{ program.typeLabel }}
            </span>
          </div>
          <p class="program-subtitle">
            {{ program.subtitle }}
          </p>
          <div class="program-meta">
            <span class="meta-tag">
              {{ formatMoney(program.cost) }} ₽
            </span>
            <span class="meta-tag">
              {{ program.daysRequired }} дн.

            </span>
            <span class="meta-tag">
              {{ program.hoursRequired }} ч

            </span>
            <span
              v-if="program.minAgeGroup"
              class="meta-tag age-tag"
              >
              {{ getAgeGroupLabel(program.minAgeGroup) }}+
            </span>
          </div>
          <p class="program-reward">
            {{ program.rewardText }}
          </p>
        </RoundedPanel>
      </Tooltip>
    </div>

    <div class="library-header">
      <h3 class="section-title">
        Библиотека
      </h3>
      <button
        @click="goToShopBooks"
        type="button"
        class="library-shop-button"
        >
        Купить книги в магазине
      </button>
    </div>
    <p class="library-hint">
      Книги запускаются из библиотеки только после покупки в магазине.
    </p>

    <div
      v-if="sortedOwnedBooks.length"
      class="programs-list"
      >
      <Tooltip
        v-for="program in sortedOwnedBooks"
        :key="program.id"
        :text="getLockReason(program)"
        :follow-cursor="true"
        multiline
      >
        <RoundedPanel
          :class="{
            disabled: !isProgramAvailable(program),
            'age-locked': !isAgeOk(program),
          }"
          @click="startProgram(program)"
          class="program-card"
          >
          <div class="program-header">
            <span class="program-title">{{ program.title }}</span>
            <span class="program-type">{{ program.typeLabel }}</span>
          </div>
          <p class="program-subtitle">{{ program.subtitle }}</p>
          <div class="program-meta">
            <span
              :class="getBookStatusClass(program)"
              class="meta-tag"
              >
              {{ getBookStatusLabel(program) }}
            </span>
            <span class="meta-tag">{{ program.daysRequired }} дн.</span>
            <span class="meta-tag">{{ program.hoursRequired }} ч</span>
            <span
              v-if="program.minAgeGroup"
              class="meta-tag age-tag"
              >
              {{ getAgeGroupLabel(program.minAgeGroup) }}+
            </span>
          </div>
          <p
            v-if="getBookStatusDescription(program)"
            class="program-status-note"
            >
            {{ getBookStatusDescription(program) }}
          </p>
          <p class="program-reward">{{ program.rewardText }}</p>
        </RoundedPanel>
      </Tooltip>
    </div>
    <RoundedPanel
      v-else
      class="library-empty"
      >
      <p class="library-empty__text">
        В библиотеке пока пусто. Купите книгу в магазине, чтобы запустить обучение по шагам.
      </p>
    </RoundedPanel>
  </div>
</template>

<script setup lang="ts">
import './ProgramList.scss'

import { EDUCATION_PROGRAMS } from '@domain/balance/constants/education-programs'

import type { EducationProgram } from '@domain/balance/types'
import type { ActiveCourse, CompletedProgramRecord } from '@stores/education-store'
import type { ProgramCheckResult } from './ProgramList.types'
import { formatMoney } from '@utils/format'
import { getAgeGroup, AgeGroup } from '@composables/useAgeRestrictions'

const store = useGameStore()
const timeStore = useTimeStore()
const housingStore = useHousingStore()

const toast = useToast()
const router = useRouter()

const allPrograms: EducationProgram[] = EDUCATION_PROGRAMS as unknown as EducationProgram[]

const currentAge = computed<number>(() => timeStore.currentAge ?? store.age ?? 18)
const currentAgeGroup = computed<AgeGroup>(() => getAgeGroup(currentAge.value))

function isAgeOk(program: EducationProgram): boolean {
  const minAgeGroup: AgeGroup = program.minAgeGroup ?? AgeGroup.TEEN

  return currentAgeGroup.value >= minAgeGroup
}

function getAgeGroupLabel(ageGroup: AgeGroup): string {
  const labels: Record<AgeGroup, string> = {
    [AgeGroup.INFANT]: '0–3',
    [AgeGroup.TODDLER]: '4–7',
    [AgeGroup.CHILD]: '8–12',
    [AgeGroup.KID]: '8–12',
    [AgeGroup.TEEN]: '13–15',
    [AgeGroup.YOUNG]: '16–18',
    [AgeGroup.ADULT]: '19+',
  }

  return labels[ageGroup]
}

function canAfford(program: EducationProgram): boolean {
  return (store.money ?? 0) >= program.cost
}

function hasFurnitureItem(itemId: string): boolean {
  return housingStore.hasFurniture(itemId)
}

function isProgramOwned(program: EducationProgram): boolean {
  if (program.acquisition !== 'shop_only') return true

  if (!program.requiresItemId) return true

  return hasFurnitureItem(program.requiresItemId)
}

const activeCourseId = computed<string | null>(() => {
  const education: Record<string, unknown> | null = store.education as unknown as Record<string, unknown> | null
  const activeCourses: ActiveCourse[] | undefined = education?.activeCourses as ActiveCourse[] | undefined

  return activeCourses?.[0]?.id ?? null
})

const completedProgramIds = computed<Set<string>>(() => {
  const education: Record<string, unknown> | null = store.education as unknown as Record<string, unknown> | null
  const completedPrograms: CompletedProgramRecord[] = (education?.completedPrograms ?? []) as CompletedProgramRecord[]

  return new Set(completedPrograms.map(program => program.id))
})

function getBookStatusLabel(program: EducationProgram): string {
  if (activeCourseId.value === program.id) return 'Читаю'

  if (completedProgramIds.value.has(program.id)) return 'Прочитано'

  return 'Куплено'
}

function getBookStatusClass(program: EducationProgram): string {
  if (activeCourseId.value === program.id) return 'meta-tag--active'

  if (completedProgramIds.value.has(program.id)) return 'meta-tag--done'

  return 'meta-tag--owned'
}

function getBookStatusDescription(program: EducationProgram): string {
  if (activeCourseId.value === program.id) {
    return 'Книга остаётся в библиотеке, пока вы читаете её по модулям.'
  }

  if (completedProgramIds.value.has(program.id)) {
    return 'Книга уже прочитана и остаётся в библиотеке как завершённая.'
  }

  return 'Книга куплена и доступна для запуска из библиотеки.'
}

/** Получить причину блокировки программы (для tooltip) */
function getLockReason(program: EducationProgram): string {
  if (!isAgeOk(program)) {
    const minAgeGroup: AgeGroup = program.minAgeGroup ?? AgeGroup.TEEN

    return `🔒 ${program.ageReason || `Доступно с ${getAgeGroupLabel(minAgeGroup)}+`}. Вам ${currentAge.value} лет.`
  }

  if (!canAfford(program)) {
    return `💰 Недостаточно денег. Нужно ${formatMoney(program.cost)} ₽, у вас ${formatMoney(store.money ?? 0)} ₽`
  }

  if (store.isInitialized) {
    const check: ProgramCheckResult = store.canStartEducationProgramWithReason(program.id)

    if (!check.ok) {
      return `🔒 ${check.reason ?? 'Программа недоступна'}`
    }
  }

  return ''
}

function isProgramAvailable(program: EducationProgram): boolean {
  return getLockReason(program) === ''
}

/** Программы отсортированы: доступные первыми */
function sortByAvailability(programs: EducationProgram[]): EducationProgram[] {
  return [...programs].sort((a, b) => {
    const aAvailable: number = isProgramAvailable(a) ? 0 : 1
    const bAvailable: number = isProgramAvailable(b) ? 0 : 1

    return aAvailable - bAvailable
  })
}

const coursePrograms = computed<EducationProgram[]>(() => {
  return allPrograms.filter(program => program.track !== 'book')
})

const sortedCoursePrograms = computed<EducationProgram[]>(() => sortByAvailability(coursePrograms.value))

const sortedOwnedBooks = computed<EducationProgram[]>(() => {
  const ownedBooks: EducationProgram[] = allPrograms.filter(program => program.track === 'book' && isProgramOwned(program))

  return sortByAvailability(ownedBooks)
})

function goToShopBooks(): void {
  router.push('/game/shop?tab=learning')
}

function startProgram(program: EducationProgram): void {
  if (!isAgeOk(program)) {
    const minAgeGroup: AgeGroup = program.minAgeGroup ?? AgeGroup.TEEN
    toast.showWarning(`${program.ageReason || `Эта программа доступна с ${getAgeGroupLabel(minAgeGroup)}+`}. Сейчас вам ${currentAge.value} лет.`)

    return
  }

  if (!canAfford(program)) {
    toast.showWarning('Недостаточно денег')

    return
  }

  if (!store.isInitialized) {
    toast.showError('Мир не инициализирован')

    return
  }

  const check: ProgramCheckResult = store.canStartEducationProgramWithReason(program.id)

  if (!check.ok) {
    toast.showWarning(check.reason ?? 'Нельзя начать эту программу')

    return
  }

  const result: string = store.startEducationProgram(program.id)

  if (result && !result.startsWith('Мир не')) {
    // Передаём базовый эффект для расчёта модификаторов
    const baseEffect: string | undefined = (program as unknown as { effect?: string }).effect
    showGameResultModal(program.title, result, { baseEffect })
  } else {
    toast.showError(result || 'Не удалось начать обучение')
  }
}
</script>

