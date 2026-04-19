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
          class="program-card"
          :class="{
            disabled: !isProgramAvailable(program),
            'age-locked': !isAgeOk(program),
          }"
          @click="startProgram(program)"
        >
          <div class="program-header">
            <span class="program-title">{{ program.title }}</span>
            <span class="program-type">{{ program.typeLabel }}</span>
          </div>
          <p class="program-subtitle">{{ program.subtitle }}</p>
          <div class="program-meta">
            <span class="meta-tag">{{ formatMoney(program.cost) }} ₽</span>
            <span class="meta-tag">{{ program.daysRequired }} дн.</span>
            <span class="meta-tag">{{ program.hoursRequired }} ч</span>
            <span v-if="program.minAgeGroup" class="meta-tag age-tag">{{ getAgeGroupLabel(program.minAgeGroup) }}+</span>
          </div>
          <p class="program-reward">{{ program.rewardText }}</p>
        </RoundedPanel>
      </Tooltip>
    </div>

    <div class="library-header">
      <h3 class="section-title">Библиотека</h3>
      <button type="button" class="library-shop-button" @click="goToShopBooks">Купить книги в магазине</button>
    </div>
    <p class="library-hint">Книги запускаются из библиотеки только после покупки в магазине.</p>

    <div v-if="sortedOwnedBooks.length" class="programs-list">
      <Tooltip
        v-for="program in sortedOwnedBooks"
        :key="program.id"
        :text="getLockReason(program)"
        :follow-cursor="true"
        multiline
      >
        <RoundedPanel
          class="program-card"
          :class="{
            disabled: !isProgramAvailable(program),
            'age-locked': !isAgeOk(program),
          }"
          @click="startProgram(program)"
        >
          <div class="program-header">
            <span class="program-title">{{ program.title }}</span>
            <span class="program-type">{{ program.typeLabel }}</span>
          </div>
          <p class="program-subtitle">{{ program.subtitle }}</p>
          <div class="program-meta">
            <span class="meta-tag">Куплено</span>
            <span class="meta-tag">{{ program.daysRequired }} дн.</span>
            <span class="meta-tag">{{ program.hoursRequired }} ч</span>
            <span v-if="program.minAgeGroup" class="meta-tag age-tag">{{ getAgeGroupLabel(program.minAgeGroup) }}+</span>
          </div>
          <p class="program-reward">{{ program.rewardText }}</p>
        </RoundedPanel>
      </Tooltip>
    </div>
    <RoundedPanel v-else class="library-empty">
      <p class="library-empty__text">В библиотеке пока пусто. Купите книгу в магазине, чтобы запустить обучение по шагам.</p>
    </RoundedPanel>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from '#imports'
import { useGameStore } from '@/stores/game.store'
import { showGameResultModal } from '@/composables/useGameModal'
import { useToast } from '@/composables/useToast'
import { EDUCATION_PROGRAMS } from '@/domain/balance/constants/education-programs'
import type { EducationProgram } from '@/domain/balance/types'
import { formatMoney } from '@/utils/format'
import { AgeGroup, getAgeGroup } from '@/composables/useAgeRestrictions/age-constants'

const store = useGameStore()
const toast = useToast()
const router = useRouter()

const allPrograms = EDUCATION_PROGRAMS as unknown as EducationProgram[]

const currentAge = computed(() => store.age ?? 0)
const currentAgeGroup = computed(() => getAgeGroup(currentAge.value))

function isAgeOk(program: EducationProgram): boolean {
  const minAgeGroup = program.minAgeGroup ?? AgeGroup.TEEN
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
  const world = store.getWorld()
  if (!world) return false
  const furniture = world.getComponent<Array<Record<string, unknown>>>('player', 'furniture')
  if (!Array.isArray(furniture)) return false
  return furniture.some(item => item?.id === itemId)
}

function isProgramOwned(program: EducationProgram): boolean {
  if (program.acquisition !== 'shop_only') return true
  if (!program.requiresItemId) return true
  return hasFurnitureItem(program.requiresItemId)
}

/** Получить причину блокировки программы (для tooltip) */
function getLockReason(program: EducationProgram): string {
  if (!isAgeOk(program)) {
    const minAgeGroup = program.minAgeGroup ?? AgeGroup.TEEN
    return `🔒 ${program.ageReason || `Доступно с ${getAgeGroupLabel(minAgeGroup)}+`}. Вам ${currentAge.value} лет.`
  }
  if (!canAfford(program)) {
    return `💰 Недостаточно денег. Нужно ${formatMoney(program.cost)} ₽, у вас ${formatMoney(store.money ?? 0)} ₽`
  }
  if (store.isInitialized) {
    const check = store.canStartEducationProgramWithReason(program.id)
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
  void store.worldTick
  return [...programs].sort((a, b) => {
    const aAvailable = isProgramAvailable(a) ? 0 : 1
    const bAvailable = isProgramAvailable(b) ? 0 : 1
    return aAvailable - bAvailable
  })
}

const coursePrograms = computed(() => {
  void store.worldTick
  return allPrograms.filter(program => program.track !== 'book')
})

const sortedCoursePrograms = computed(() => sortByAvailability(coursePrograms.value))

const sortedOwnedBooks = computed(() => {
  void store.worldTick
  const ownedBooks = allPrograms.filter(program => program.track === 'book' && isProgramOwned(program))
  return sortByAvailability(ownedBooks)
})

function goToShopBooks(): void {
  void router.push('/game/shop')
}

function startProgram(program: EducationProgram): void {
  if (!isAgeOk(program)) {
    const minAgeGroup = program.minAgeGroup ?? AgeGroup.TEEN
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
  const check = store.canStartEducationProgramWithReason(program.id)
  if (!check.ok) {
    toast.showWarning(check.reason ?? 'Нельзя начать эту программу')
    return
  }
  const result = store.startEducationProgram(program.id)
  if (result && !result.startsWith('Мир не')) {
    // Передаём базовый эффект для расчёта модификаторов
    const baseEffect = (program as unknown as { effect?: string }).effect
    showGameResultModal(program.title, result, { baseEffect })
  } else {
    toast.showError(result || 'Не удалось начать обучение')
  }
}
</script>

<style scoped lang="scss" src="./ProgramList.scss"></style>
