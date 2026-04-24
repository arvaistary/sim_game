import type { BalanceAction } from '@/domain/balance/actions/types'
import {
  AgeGroup,
  AGE_RULES,
  TAB_UNLOCK_AGE,
  UNLOCK_MESSAGES,
  getAgeGroup,
} from './age-constants'
import type { AgeRestrictions } from './age-constants'

export { AgeGroup, TAB_UNLOCK_AGE }
export type { AgeRestrictions }

let lastKnownAge: number = 0
let unlockedTabsCache: Set<string> = new Set()

export const useAgeRestrictions = () => {
  const timeStore = useTimeStore()

  const toast = useToast()

  const age = computed(() => timeStore.currentAge)

  const ageGroup = computed<AgeGroup>(() => {
    return getAgeGroup(age.value)
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
    if (action.ageGroup !== undefined && action.ageGroup > ageGroup.value) return false

    if (action.maxAgeGroup !== undefined && ageGroup.value > action.maxAgeGroup) return false

    return true
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