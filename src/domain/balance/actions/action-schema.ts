import type { BalanceAction } from './types'
import type {
  ActionArrayValidationResult,
  CatalogValidationResult,
  RequiredFieldsValidationResult,
  UniqueIdsValidationResult,
  ValidationErrors,
} from './action-schema.types'

export type {
  ActionArrayValidationResult,
  CatalogValidationResult,
  RequiredFieldsValidationResult,
  UniqueIdsValidationResult,
  ValidationErrors,
} from './action-schema.types'

const REQUIRED_FIELDS: (keyof BalanceAction)[] = [
  'id',
  'category',
  'title',
  'hourCost',
  'price',
  'actionType',
  'effect',
]

const VALID_CATEGORIES: readonly string[] = [
  'shop',
  'fun',
  'home',
  'social',
  'education',
  'finance',
  'career',
  'hobby',
  'health',
  'selfdev',
] as const

/**
 * Валидирует структуру и типы полей действия.
 * @description [Domain] - проверяет обязательные поля, типы и ограничения BalanceAction.
 * @return { ValidationErrors } результат валидации и список ошибок
 */
export function validateActionWithErrors(action: unknown): ValidationErrors {
  const errors: string[] = []

  if (typeof action !== 'object' || action === null) {
    return { valid: false, errors: ['Действие должно быть объектом'] }
  }

  const record: Record<string, unknown> = action as Record<string, unknown>

  for (const field of REQUIRED_FIELDS) {
    if (
      record[field] === undefined ||
      record[field] === null ||
      record[field] === ''
    ) {
      errors.push(`${field}: Поле обязательно и не может быть пустым`)
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors }
  }

  if (typeof record.id !== 'string' || record.id.length === 0) {
    errors.push('id: Должен быть непустой строкой')
  }

  if (!VALID_CATEGORIES.includes(record.category as (typeof VALID_CATEGORIES)[number])) {
    errors.push(
      `category: Должен быть одним из: ${VALID_CATEGORIES.join(', ')}`
    )
  }

  if (typeof record.hourCost !== 'number' || record.hourCost < 0) {
    errors.push('hourCost: Должен быть числом >= 0')
  }

  if (typeof record.price !== 'number' || record.price < 0) {
    errors.push('price: Должен быть числом >= 0')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Валидирует массив действий.
 * @description [Domain] - проверяет каждое действие в массиве.
 * @return { ActionArrayValidationResult } результат валидации
 */
export function validateActionArray(actions: unknown[]): ActionArrayValidationResult {
  const errors: Array<{ index: number; errors: string[] }> = []

  actions.forEach((action: unknown, index: number) => {
    const result: ValidationErrors = validateActionWithErrors(action)

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
 * Проверяет, что все действия имеют уникальные ID.
 * @description [Domain] - ищет дубликаты ID в каталоге.
 * @return { UniqueIdsValidationResult } результат проверки
 */
export function validateUniqueIds(actions: BalanceAction[]): UniqueIdsValidationResult {
  const idMap: Map<string, number[]> = new Map<string, number[]>()

  actions.forEach((action, index) => {
    if (!idMap.has(action.id)) {
      idMap.set(action.id, [])
    }
    idMap.get(action.id)!.push(index)
  })

  const duplicates: string[] = []
  idMap.forEach((indices, id) => {
    if (indices.length > 1) {
      duplicates.push(id)
    }
  })

  return {
    valid: duplicates.length === 0,
    duplicates,
  }
}

/**
 * Проверяет, что все обязательные поля присутствуют.
 * @description [Domain] - проверяет наличие обязательных полей в каждом действии.
 * @return { RequiredFieldsValidationResult } результат проверки
 */
export function validateRequiredFields(actions: BalanceAction[]): RequiredFieldsValidationResult {
  const missing: Array<{ id: string; missingFields: string[] }> = []

  actions.forEach((action) => {
    const actionMissing: string[] = []

    REQUIRED_FIELDS.forEach((field) => {
      if (
        action[field] === undefined ||
        action[field] === null ||
        action[field] === ''
      ) {
        actionMissing.push(field)
      }
    })

    if (actionMissing.length > 0) {
      missing.push({
        id: action.id,
        missingFields: actionMissing,
      })
    }
  })

  return {
    valid: missing.length === 0,
    missing,
  }
}

/**
 * Полная валидация каталога действий.
 * @description [Domain] - объединяет все проверки: схема, уникальность ID, обязательные поля.
 * @return { CatalogValidationResult } результат полной валидации
 */
export function validateActionCatalog(actions: BalanceAction[]): CatalogValidationResult {
  const schemaResult: ActionArrayValidationResult = validateActionArray(actions)
  const uniqueIdsResult: UniqueIdsValidationResult = validateUniqueIds(actions)
  const requiredFieldsResult: RequiredFieldsValidationResult = validateRequiredFields(actions)

  return {
    valid:
      schemaResult.valid && uniqueIdsResult.valid && requiredFieldsResult.valid,
    schemaErrors: schemaResult.errors,
    duplicateIds: uniqueIdsResult.duplicates,
    missingFields: requiredFieldsResult.missing,
  }
}

/**
 * Проверяет, что значение соответствует структуре BalanceAction.
 * @description [Domain] - type guard для валидации действия.
 * @return {boolean} true если действие валидно
 */
export function validateAction(action: unknown): action is BalanceAction {
  return validateActionWithErrors(action).valid
}
