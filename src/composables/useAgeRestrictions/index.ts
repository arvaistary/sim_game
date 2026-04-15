import type { BalanceAction } from '@/domain/balance/actions/types'
import { computed } from 'vue'
import { useGameStore } from '@/stores/game.store'
import { useToast } from '@/composables/useToast'
import { AgeGroup } from '@/domain/balance/actions/types'

export { AgeGroup }

export interface AgeRestrictions {
  hiddenTabs: string[]
  hiddenStats: string[]
  label: string
  timeSpeed: number
  minAgeGroup: AgeGroup
}

const AGE_RULES: Record<AgeGroup, AgeRestrictions> = {
  [AgeGroup.INFANT]: {
    hiddenTabs: ['finance', 'career', 'home', 'car', 'social'],
    hiddenStats: ['money', 'salary', 'debt', 'investments'],
    label: 'Младенец',
    timeSpeed: 4,
    minAgeGroup: AgeGroup.INFANT
  },
  [AgeGroup.TODDLER]: {
    hiddenTabs: ['finance', 'career', 'home', 'car'],
    hiddenStats: ['money', 'salary', 'debt', 'investments'],
    label: 'Дошкольник',
    timeSpeed: 3,
    minAgeGroup: AgeGroup.TODDLER
  },
  [AgeGroup.CHILD]: {
    hiddenTabs: ['finance', 'home', 'car'],
    hiddenStats: ['money', 'salary', 'debt'],
    label: 'Младший школьник',
    timeSpeed: 2,
    minAgeGroup: AgeGroup.CHILD
  },
  [AgeGroup.KID]: {
    hiddenTabs: ['finance', 'home', 'car'],
    hiddenStats: ['money', 'salary', 'debt'],
    label: 'Школьник',
    timeSpeed: 1.75,
    minAgeGroup: AgeGroup.KID
  },
  [AgeGroup.TEEN]: {
    hiddenTabs: ['home', 'mortgage'],
    hiddenStats: ['debt', 'investments'],
    label: 'Подросток',
    timeSpeed: 1.5,
    minAgeGroup: AgeGroup.TEEN
  },
  [AgeGroup.YOUNG]: {
    hiddenTabs: [],
    hiddenStats: [],
    label: 'Молодёжь',
    timeSpeed: 1.25,
    minAgeGroup: AgeGroup.YOUNG
  },
  [AgeGroup.ADULT]: {
    hiddenTabs: [],
    hiddenStats: [],
    label: 'Взрослый',
    timeSpeed: 1,
    minAgeGroup: AgeGroup.ADULT
  }
}

const UNLOCK_MESSAGES: Record<string, string> = {
  finance: '🎉 Теперь вам доступны Финансы! Вы можете управлять своими деньгами, открывать счета и делать инвестиции.',
  career: '💼 Теперь вам доступна Работа! Вы можете искать вакансии и устраиваться на работу.',
  home: '🏠 Теперь вам доступна Недвижимость! Вы можете покупать и арендовать жильё.',
  car: '🚗 Теперь вам доступна Машина! Вы можете покупать и обслуживать автомобиль.',
  social: '❤️ Теперь вам доступны Отношения! Вы можете строить отношения с другими персонажами.',
  mortgage: '🏦 Теперь вам доступна Ипотека! Вы можете брать кредиты на покупку недвижимости.'
}

let lastKnownAge: number = 0
let unlockedTabsCache: Set<string> = new Set()

export function useAgeRestrictions() {
  const store = useGameStore()
  const toast = useToast()

  const age = computed(() => store.age)

  const ageGroup = computed<AgeGroup>(() => {
    const currentAge = age.value
    if (currentAge <= 3) return AgeGroup.INFANT
    if (currentAge <= 7) return AgeGroup.TODDLER
    if (currentAge <= 12) return AgeGroup.CHILD
    if (currentAge <= 15) return AgeGroup.KID
    if (currentAge <= 18) return AgeGroup.TEEN
    if (currentAge <= 25) return AgeGroup.YOUNG
    return AgeGroup.ADULT
  })

  const restrictions = computed<AgeRestrictions>(() => AGE_RULES[ageGroup.value])

  const availableTabs = computed(() => {
    return restrictions.value.hiddenTabs
  })

  const hiddenStats = computed(() => {
    return restrictions.value.hiddenStats
  })

  const ageGroupLabel = computed(() => restrictions.value.label)
  const timeSpeedMultiplier = computed(() => restrictions.value.timeSpeed)

  function checkUnlocks(currentAge: number): void {
    if (currentAge <= lastKnownAge) return

    const previousGroup = getAgeGroup(lastKnownAge)
    const newGroup = getAgeGroup(currentAge)

    if (previousGroup === newGroup) {
      lastKnownAge = currentAge
      return
    }

    const previousHidden = new Set(AGE_RULES[previousGroup].hiddenTabs)
    const newHidden = new Set(AGE_RULES[newGroup].hiddenTabs)

    const justUnlocked = [...previousHidden].filter(tab => !newHidden.has(tab))

    justUnlocked.forEach(tabId => {
      if (!unlockedTabsCache.has(tabId) && UNLOCK_MESSAGES[tabId]) {
        toast.showSuccess(UNLOCK_MESSAGES[tabId])
        unlockedTabsCache.add(tabId)
      }
    })

    lastKnownAge = currentAge
  }

  function isTabVisible(tabId: string): boolean {
    return !restrictions.value.hiddenTabs.includes(tabId)
  }

  function isStatVisible(statKey: string): boolean {
    return !restrictions.value.hiddenStats.includes(statKey)
  }

  function isActionAvailable(action: BalanceAction): boolean {
    if (action.ageGroup === undefined) return true
    return action.ageGroup <= ageGroup.value
  }

  function filterActionsByAge(actions: BalanceAction[]): BalanceAction[] {
    return actions.filter(action => isActionAvailable(action))
  }

  return {
    age,
    ageGroup,
    ageGroupLabel,
    timeSpeedMultiplier,
    isTabVisible,
    isStatVisible,
    isActionAvailable,
    filterActionsByAge,
    checkUnlocks,
    availableTabs
  }
}

function getAgeGroup(ageValue: number): AgeGroup {
  if (ageValue <= 3) return AgeGroup.INFANT
  if (ageValue <= 7) return AgeGroup.TODDLER
  if (ageValue <= 12) return AgeGroup.CHILD
  if (ageValue <= 15) return AgeGroup.KID
  if (ageValue <= 18) return AgeGroup.TEEN
  if (ageValue <= 25) return AgeGroup.YOUNG
  return AgeGroup.ADULT
}
