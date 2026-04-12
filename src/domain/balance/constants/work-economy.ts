import type { StatChanges } from '@/domain/balance/types'

export const LEGACY_WORK_PERIOD_RANDOM_EVENT_CHANCE = 0.15

export const LEGACY_BASE_STAT_CHANGES_PER_WORK_DAY: StatChanges = {
  hunger: 17.5,     // ты тратишь калории в течение рабочего дня
  energy: -26,      // ощутимая усталость к концу дня
  stress: 11.5,     // умеренное накопление напряжения
  mood: 2.5,        // лёгкий плюс от чувства выполненного долга (если день прошёл нормально)
  health: -1.2,     // небольшое влияние на здоровье от сидячей/однообразной работы
  physical: -2.8,   // снижение физической формы при отсутствии движения
}