export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export type MigrationFn = (saveData: Record<string, unknown>) => Record<string, unknown>
