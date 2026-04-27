import type { BalanceAction } from '@domain/balance/actions/types'
import {
  AgeGroup,
  AGE_RULES,
  TAB_UNLOCK_AGE,
  UNLOCK_MESSAGES,
  getAgeGroup,
} from './age-constants'
import type { AgeRestrictions } from './age-constants.types'

export { AgeGroup, TAB_UNLOCK_AGE, getAgeGroup }

let lastKnownAge: number = 0
let unlockedTabsCache: Set<string> = new Set()

/**
 * @description useAgeRestrictions - Composable для работы с возрастными ограничениями.
 * @return {object} Объект с вычисляемыми свойствами и методами для проверки доступности.
 */
export const useAgeRestrictions = () => {
  const timeStore = useTimeStore()

  const toast = useToast()

  const age = computed<number>(() => timeStore.currentAge)

  const ageGroup = computed<AgeGroup>(() => {
    return getAgeGroup(age.value)
  })

  const restrictions = computed<AgeRestrictions>(() => AGE_RULES[ageGroup.value])

  const availableTabs = computed<string[]>(() => {
    return restrictions.value.hiddenTabs
  })

  const hiddenStats = computed<string[]>(() => {
    return restrictions.value.hiddenStats
  })

  const ageGroupLabel = computed<string>(() => restrictions.value.label)
  const timeSpeedMultiplier = computed<number>(() => restrictions.value.timeSpeed)

  function checkUnlocks(currentAge: number): void {
    if (currentAge <= lastKnownAge) return

    const previousGroup: AgeGroup = getAgeGroup(lastKnownAge)
    const newGroup: AgeGroup = getAgeGroup(currentAge)

    if (previousGroup === newGroup) {
      lastKnownAge = currentAge

      return
    }

    const previousHidden: Set<string> = new Set(AGE_RULES[previousGroup].hiddenTabs)
    const newHidden: Set<string> = new Set(AGE_RULES[newGroup].hiddenTabs)

    const justUnlocked: string[] = [...previousHidden].filter((tab: string) => !newHidden.has(tab))

    justUnlocked.forEach((tabId: string) => {
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
    return actions.filter((action: BalanceAction) => isActionAvailable(action))
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
