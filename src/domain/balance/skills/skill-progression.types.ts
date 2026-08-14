/** Шаг таблицы прогрессии навыка: уровень, его цена и кумулятивный опыт. */
export interface SkillProgressionStep {
  level: number
  levelCost: number
  totalXp: number
}
