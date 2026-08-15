/** Запись навыка: достигнутый уровень и накопленный опыт. */
export interface SkillEntry {
  level: number
  xp: number
}

/** Legacy numeric or normalized skill entry accepted at migration boundaries. */
export type SkillLevelInput = number | SkillEntry
