import { z } from 'zod'
import type { BalanceAction } from './types'
import { AgeGroup } from './types'

/**
 * Zod схема для валидации BalanceAction
 * Проверяет структуру и типы полей действия
 */
export const BalanceActionSchema = z.object({
  id: z.string().min(1, 'ID действия не может быть пустым'),
  category: z.enum(['shop', 'fun', 'home', 'social', 'education', 'finance', 'career', 'hobby', 'health', 'selfdev']),
  title: z.string().min(1, 'Название действия не может быть пустым'),
  hourCost: z.number().min(0, 'Затрата времени не может быть отрицательной'),
  price: z.number().min(0, 'Цена не может быть отрицательной'),
  actionType: z.string().min(1, 'Тип действия не может быть пустым'),
  effect: z.string().min(1, 'Эффект действия не может быть пустым'),
  mood: z.string().optional(),
  statChanges: z.record(z.string(), z.number()).optional(),
  skillChanges: z.record(z.string(), z.number()).optional(),
  relationshipDelta: z.number().optional(),
  housingComfortDelta: z.number().optional(),
  oneTime: z.boolean().optional(),
  furnitureId: z.string().optional(),
  housingUpgradeLevel: z.number().optional(),
  requirements: z.object({
    minAge: z.number().min(0).optional(),
    minSkills: z.record(z.string(), z.number()).optional(),
    housingLevel: z.number().min(0).optional(),
    requiresItem: z.string().optional(),
    requiresRelationship: z.boolean().optional(),
    hasDebt: z.boolean().optional(),
    hasMortgage: z.boolean().optional(),
    hasRealty: z.boolean().optional(),
    minHousingLevel: z.number().min(0).optional(),
    minReserve: z.number().min(0).optional(),
  }).strict().optional(),
  cooldown: z.object({
    hours: z.number().min(0),
  }).optional(),
  subscription: z.object({
    monthlyCost: z.number().min(0),
    effectPerWeek: z.object({
      statChanges: z.record(z.string(), z.number()).optional(),
      skillChanges: z.record(z.string(), z.number()).optional(),
    }).optional(),
  }).optional(),
  grantsItem: z.string().optional(),
  reserveDelta: z.number().optional(),
  investmentReturn: z.number().optional(),
  investmentDurationDays: z.number().min(0).optional(),
  monthlyExpenseDelta: z.record(z.string(), z.number()).optional(),
  ageGroup: z.nativeEnum(AgeGroup).optional(),
  maxAgeGroup: z.nativeEnum(AgeGroup).optional(),
}).strict()

/**
 * Тип для валидированного действия
 */
export type ValidatedBalanceAction = z.infer<typeof BalanceActionSchema>

/**
 * Валидирует действие и возвращает список ошибок
 * @param action - Действие для валидации
 * @returns Объект с результатом валидации и списком ошибок
 */
export function validateActionWithErrors(action: unknown): {
  valid: boolean
  errors: string[]
} {
  const result = BalanceActionSchema.safeParse(action)

  if (!result.success) {
    const errors = result.error.issues.map(
      (issue) => `${issue.path.join('.')}: ${issue.message}`
    )
    return { valid: false, errors }
  }

  return { valid: true, errors: [] }
}

/**
 * Валидирует массив действий
 * @param actions - Массив действий для валидации
 * @returns Объект с результатом валидации
 */
export function validateActionArray(actions: unknown[]): {
  valid: boolean
  errors: Array<{ index: number; errors: string[] }>
} {
  const errors: Array<{ index: number; errors: string[] }> = []

  actions.forEach((action, index) => {
    const result = validateActionWithErrors(action)
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
 * Проверяет, что все действия имеют уникальные ID
 * @param actions - Массив действий
 * @returns Объект с результатом проверки
 */
export function validateUniqueIds(actions: BalanceAction[]): {
  valid: boolean
  duplicates: string[]
} {
  const idMap = new Map<string, number[]>()

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
 * Проверяет, что все обязательные поля присутствуют
 * @param actions - Массив действий
 * @returns Объект с результатом проверки
 */
export function validateRequiredFields(actions: BalanceAction[]): {
  valid: boolean
  missing: Array<{ id: string; missingFields: string[] }>
} {
  const missing: Array<{ id: string; missingFields: string[] }> = []
  const requiredFields: (keyof BalanceAction)[] = ['id', 'category', 'title', 'hourCost', 'price', 'actionType', 'effect']

  actions.forEach((action) => {
    const actionMissing: string[] = []

    requiredFields.forEach((field) => {
      if (action[field] === undefined || action[field] === null || action[field] === '') {
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
 * Полная валидация каталога действий
 * @param actions - Массив действий
 * @returns Объект с результатом полной валидации
 */
export function validateActionCatalog(actions: BalanceAction[]): {
  valid: boolean
  schemaErrors: Array<{ index: number; errors: string[] }>
  duplicateIds: string[]
  missingFields: Array<{ id: string; missingFields: string[] }>
} {
  const schemaResult = validateActionArray(actions)
  const uniqueIdsResult = validateUniqueIds(actions)
  const requiredFieldsResult = validateRequiredFields(actions)

  return {
    valid: schemaResult.valid && uniqueIdsResult.valid && requiredFieldsResult.valid,
    schemaErrors: schemaResult.errors,
    duplicateIds: uniqueIdsResult.duplicates,
    missingFields: requiredFieldsResult.missing,
  }
}

/**
 * Функция для валидации действия (удобная для использования)
 */
export function validateAction(action: unknown): action is ValidatedBalanceAction {
  return BalanceActionSchema.safeParse(action).success
}
