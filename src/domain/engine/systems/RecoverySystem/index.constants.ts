// RecoverySystem constants

/** Базовый шанс пропуска (не используется напрямую, но зарезервирован) */
export const BASE_SKIP_CHANCE = 0

/** Множитель восстановления голода при наличии холодильника */
export const FOOD_RECOVERY_FRIDGE_BONUS = 1.2

/** Базовый множитель восстановления голода (без холодильника) */
export const FOOD_RECOVERY_BASE = 1

/** Вклад комфорта в множитель восстановления еды (на единицу comfortRatio) */
export const FOOD_COMFORT_RATIO_FACTOR = 0.08

/** Минимальный множитель расхода энергии на работе */
export const WORK_ENERGY_MIN = 0.78

/** Базовый множитель расхода энергии (без хорошей кровати) */
export const WORK_ENERGY_BASE = 1

/** Множитель расхода энергии при наличии хорошей кровати */
export const WORK_ENERGY_GOOD_BED = 0.9

/** Вклад комфорта в расход энергии (на единицу comfortRatio) */
export const WORK_ENERGY_COMFORT_RATIO_FACTOR = 0.08

/** Штраф за уровень жилья в расходе энергии (за каждый уровень выше 1) */
export const WORK_ENERGY_HOUSING_LEVEL_PENALTY = 0.02

/** Бонус к настроению от декоративного освещения */
export const HOME_MOOD_DECOR_BONUS = 6

/** Базовый бонус к настроению от дома (без декора) */
export const HOME_MOOD_BASE = 1

/** Вклад комфорта в бонус настроения (comfortRatio * factor) */
export const HOME_MOOD_COMFORT_RATIO_FACTOR = 4

/** Бонус к настроению за каждый уровень жилья выше 1 */
export const HOME_MOOD_HOUSING_LEVEL_BONUS = 2
