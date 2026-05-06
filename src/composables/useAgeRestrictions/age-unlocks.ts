/**
 * @description age-unlocks - Утилита для отслеживания смены возрастных групп.
 * Вызывается при изменении возраста и показывает уведомления о разблокировке вкладок.
 *
 * Импортирует константы из age-constants.ts - единый источник истины.
 */
import { AGE_RULES, UNLOCK_MESSAGES, getAgeGroup } from './age-constants'
import type { AgeGroup } from './age-constants'
let lastKnownAge: number = 0
let unlockedTabsCache: Set<string> = new Set()

/**
 * @description age-unlocks - Проверить разблокировку вкладок при смене возраста. Вызывать при каждом изменении age.
 * @param {number} currentAge - Текущий возраст.
 * @return {void}
 */
export function checkAgeUnlocks(currentAge: number): void {
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

  const toast = useToast()
  
  justUnlocked.forEach((tabId: string) => {
    if (!unlockedTabsCache.has(tabId) && UNLOCK_MESSAGES[tabId]) {
      toast.showSuccess(UNLOCK_MESSAGES[tabId])
      unlockedTabsCache.add(tabId)
    }
  })

  lastKnownAge = currentAge
}

/**
 * @description age-unlocks - Сбросить состояние (для тестов или нового сохранения).
 * @return {void}
 */
export function resetAgeUnlocksState(): void {
  lastKnownAge = 0
  unlockedTabsCache = new Set()
}
