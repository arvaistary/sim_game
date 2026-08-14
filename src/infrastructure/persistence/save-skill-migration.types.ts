/** Результат миграции навыков в сохранении. */
export interface SkillMigrationResult {
  success: boolean
  migratedSkills: number
  errors: string[]
}
