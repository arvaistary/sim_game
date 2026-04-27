import type { BalanceAction } from './types'

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
