// RecoverySystem types

/** Результат расчёта пассивных бонусов от жилья и мебели */
export interface PassiveBonuses {
  /** Множитель восстановления голода при приёме пищи */
  foodRecoveryMultiplier: number
  /** Множитель расхода энергии на работе */
  workEnergyMultiplier: number
  /** Бонус к настроению от жилья */
  homeMoodBonus: number
}
