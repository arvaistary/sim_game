/**
 * Утилита для отслеживания смены возрастных групп.
 * Вызывается при изменении возраста и показывает уведомления о разблокировке вкладок.
 *
 * Импортирует константы из age-constants.ts - единый источник истины.
 */
import {
  AgeGroup,
  AGE_RULES,
  UNLOCK_MESSAGES,
  getAgeGroup,
} from './age-constants'
import type { AgeRestrictions } from './age-constants'

// Используем AgeGroup enum вместо числовых литералов
const RULES = AGE_RULES as Record<AgeGroup, AgeRestrictions>

let lastKnownAge = 0
let unlockedTabsCache = new Set<string>()

/**
 * Проверить разблокировку вкладок при смене возраста.
 * Вызывать при каждом изменении age.
 */
export function checkAgeUnlocks(currentAge: number): void {
  if (currentAge <= lastKnownAge) return

  const previousGroup = getAgeGroup(lastKnownAge)
  const newGroup = getAgeGroup(currentAge)

  if (previousGroup === newGroup) {
    lastKnownAge = currentAge
    return
  }

  const previousHidden = new Set(RULES[previousGroup].hiddenTabs)
  const newHidden = new Set(RULES[newGroup].hiddenTabs)

  const justUnlocked = [...previousHidden].filter(tab => !newHidden.has(tab))

  const toast = useToast()
  justUnlocked.forEach(tabId => {
    if (!unlockedTabsCache.has(tabId) && UNLOCK_MESSAGES[tabId]) {
      toast.showSuccess(UNLOCK_MESSAGES[tabId])
      unlockedTabsCache.add(tabId)
    }
  })

  lastKnownAge = currentAge
}

/**
 * Сбросить состояние (для тестов или нового сохранения).
 */
export function resetAgeUnlocksState(): void {
  lastKnownAge = 0
  unlockedTabsCache = new Set()
}
