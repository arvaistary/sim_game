/**
 * Утилита для отслеживания смены возрастных групп.
 * Вызывается при изменении возраста и показывает уведомления о разблокировке вкладок.
 */
import { useToast } from '@/composables/useToast'

interface AgeGroupRule {
  hiddenTabs: string[]
  label: string
}

// Копия AGE_RULES — чтобы не импортировать из composable (избегаем circular)
const AGE_RULES: Record<number, AgeGroupRule> = {
  0: { hiddenTabs: ['finance', 'career', 'home', 'car', 'social', 'shop'], label: 'Младенец' },
  1: { hiddenTabs: ['finance', 'career', 'home', 'car', 'shop'], label: 'Дошкольник' },
  2: { hiddenTabs: ['finance', 'home', 'car'], label: 'Младший школьник' },
  3: { hiddenTabs: ['finance', 'home', 'car'], label: 'Школьник' },
  4: { hiddenTabs: ['home', 'mortgage'], label: 'Подросток' },
  5: { hiddenTabs: ['mortgage'], label: 'Молодёжь' },
  6: { hiddenTabs: [], label: 'Взрослый' },
}

const UNLOCK_MESSAGES: Record<string, string> = {
  finance: '🎉 Теперь вам доступны Финансы! Вы можете управлять своими деньгами, открывать счета и делать инвестиции.',
  career: '💼 Теперь вам доступна Работа! Вы можете искать вакансии и устраиваться на работу.',
  home: '🏠 Теперь вам доступна Недвижимость! Вы можете покупать и арендовать жильё.',
  car: '🚗 Теперь вам доступна Машина! Вы можете покупать и обслуживать автомобиль.',
  social: '❤️ Теперь вам доступны Отношения! Вы можете строить отношения с другими персонажами.',
  mortgage: '🏦 Теперь вам доступна Ипотека! Вы можете брать кредиты на покупку недвижимости.',
  shop: '🛒 Теперь вам доступен Магазин! Вы можете покупать товары и услуги.',
}

let lastKnownAge = 0
let unlockedTabsCache = new Set<string>()

function getAgeGroup(ageValue: number): number {
  if (ageValue <= 3) return 0  // INFANT
  if (ageValue <= 7) return 1  // TODDLER
  if (ageValue <= 12) return 2 // CHILD
  if (ageValue <= 15) return 3 // KID
  if (ageValue <= 18) return 5 // YOUNG (16-18)
  return 6 // ADULT (19+)
}

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

  const previousHidden = new Set(AGE_RULES[previousGroup].hiddenTabs)
  const newHidden = new Set(AGE_RULES[newGroup].hiddenTabs)

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
