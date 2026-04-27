import type { BalanceAction } from '@domain/balance/actions/types'
import type {
  ValidateActionWithErrorsReturn,
  ValidateActionArrayReturn,
  ValidateActionCatalogReturn,
  ErrorItem,
} from '@domain/balance/actions/action-schema.types'
import { validateUniqueIds, validateRequiredFields } from '@domain/balance/actions/action-schema'

const VALID_CATEGORIES: readonly string[] = [
  'shop', 'fun', 'home', 'social', 'education', 'finance', 'career', 'hobby', 'health', 'selfdev',
] as const

const REQUIRED_STRING_FIELDS: readonly string[] = [
  'id', 'category', 'title', 'actionType', 'effect',
] as const

const REQUIRED_NUMERIC_FIELDS: readonly string[] = [
  'hourCost', 'price',
] as const

/**
 * @description [Test] - Валидирует действие и возвращает список ошибок
 * @return { ValidateActionWithErrorsReturn } объект с результатом валидации и списком ошибок
 */
export function validateActionWithErrors(action: unknown): ValidateActionWithErrorsReturn {
  const errors: string[] = []

  if (typeof action !== 'object' || action === null) {
    errors.push('action: должен быть объектом')

    return { valid: false, errors }
  }

  const record: Record<string, unknown> = action as Record<string, unknown>

  for (const field of REQUIRED_STRING_FIELDS) {
    if (!(field in record) || record[field] === undefined || record[field] === null || record[field] === '') {
      errors.push(`${field}: обязательное поле отсутствует или пусто`)
    }
  }

  for (const field of REQUIRED_NUMERIC_FIELDS) {
    const value: unknown = record[field]

    if (value === undefined || value === null) {
      errors.push(`${field}: обязательное поле отсутствует`)
    } else if (typeof value !== 'number') {
      errors.push(`${field}: должен быть числом`)
    } else if (value < 0) {
      errors.push(`${field}: не может быть отрицательным`)
    }
  }

  if (typeof record.category === 'string' && record.category !== '' && !VALID_CATEGORIES.includes(record.category)) {
    errors.push('category: недопустимое значение категории')
  }

  return errors.length === 0 ? { valid: true, errors: [] } : { valid: false, errors }
}

/**
 * @description [Test] - Валидирует массив действий
 * @return { ValidateActionArrayReturn } объект с результатом валидации
 */
export function validateActionArray(actions: unknown[]): ValidateActionArrayReturn {
  const errors: Array<ErrorItem> = []

  actions.forEach((action, index) => {
    const result: ValidateActionWithErrorsReturn = validateActionWithErrors(action)

    if (!result.valid) {
      errors.push({
        index,
        errors: result.errors,
      })
    }
  })

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * @description [Test] - Полная валидация каталога действий
 * @return { ValidateActionCatalogReturn } объект с результатом полной валидации
 */
export function validateActionCatalog(actions: BalanceAction[]): ValidateActionCatalogReturn {
  const schemaResult: ValidateActionArrayReturn = validateActionArray(actions)
  const uniqueIdsResult = validateUniqueIds(actions)
  const requiredFieldsResult = validateRequiredFields(actions)

  return {
    valid: schemaResult.valid && uniqueIdsResult.valid && requiredFieldsResult.valid,
    schemaErrors: schemaResult.errors,
    duplicateIds: uniqueIdsResult.duplicates,
    missingFields: requiredFieldsResult.missing,
  }
}
