export interface ValidationErrors {
  valid: boolean
  errors: string[]
}

export interface ActionArrayValidationResult {
  valid: boolean
  errors: Array<{ index: number; errors: string[] }>
}

export interface UniqueIdsValidationResult {
  valid: boolean
  duplicates: string[]
}

export interface RequiredFieldsValidationResult {
  valid: boolean
  missing: Array<{ id: string; missingFields: string[] }>
}

export interface CatalogValidationResult {
  valid: boolean
  schemaErrors: Array<{ index: number; errors: string[] }>
  duplicateIds: string[]
  missingFields: Array<{ id: string; missingFields: string[] }>
}
