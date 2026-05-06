import { describe, expect, test } from 'vitest'
import {
  validateUniqueIds,
  validateRequiredFields,
} from '@domain/balance/actions/action-schema'
import {
  validateActionWithErrors,
  validateActionArray,
  validateActionCatalog,
} from './action-schema-helpers'

function validateAction(action: unknown): boolean {
  return validateActionWithErrors(action).valid
}
import { AgeGroup } from '@domain/balance/actions/types'
import type { BalanceAction } from '@domain/balance/actions'

describe('Action Schema Validation', () => {
  describe('validateAction', () => {
    test('валидное действие проходит валидацию', () => {
      const validAction = {
        id: 'test_action',
        category: 'fun' as const,
        title: 'Тестовое действие',
        hourCost: 1,
        price: 0,
        actionType: 'neutral',
        effect: 'Тестовый эффект',
      }

      expect(validateAction(validAction)).toBe(true)
    })

    test('действие без ID не проходит валидацию', () => {
      const invalidAction = {
        category: 'fun' as const,
        title: 'Тестовое действие',
        hourCost: 1,
        price: 0,
        actionType: 'neutral',
        effect: 'Тестовый эффект',
      }

      expect(validateAction(invalidAction)).toBe(false)
    })

    test('действие с ageGroup проходит валидацию', () => {
      const validAction = {
        id: 'test_action',
        category: 'fun' as const,
        title: 'Тестовое действие',
        hourCost: 1,
        price: 0,
        actionType: 'neutral',
        effect: 'Тестовый эффект',
        ageGroup: AgeGroup.ADULT,
      }

      expect(validateAction(validAction)).toBe(true)
    })

    test('действие с requirements проходит валидацию', () => {
      const validAction = {
        id: 'test_action',
        category: 'fun' as const,
        title: 'Тестовое действие',
        hourCost: 1,
        price: 0,
        actionType: 'neutral',
        effect: 'Тестовый эффект',
        requirements: {
          minAge: 18,
          minSkills: { strength: 5 },
        },
      }

      expect(validateAction(validAction)).toBe(true)
    })

    test('null не проходит валидацию', () => {
      expect(validateAction(null)).toBe(false)
    })

    test('undefined не проходит валидацию', () => {
      expect(validateAction(undefined)).toBe(false)
    })

    test('пустая строка в обязательном поле не проходит валидацию', () => {
      const invalidAction = {
        id: '',
        category: 'fun' as const,
        title: 'Тестовое действие',
        hourCost: 1,
        price: 0,
        actionType: 'neutral',
        effect: 'Тестовый эффект',
      }

      expect(validateAction(invalidAction)).toBe(false)
    })
  })

  describe('validateActionWithErrors', () => {
    test('getErrors возвращает список ошибок', () => {
      const invalidAction = {
        id: '',
        category: 'invalid' as any,
        title: '',
        hourCost: -1,
        price: -1,
        actionType: '',
        effect: '',
      }

      const result = validateActionWithErrors(invalidAction)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    test('getFirstError возвращает первую ошибку', () => {
      const invalidAction = {
        id: '',
        category: 'invalid' as any,
        title: '',
        hourCost: -1,
        price: -1,
        actionType: '',
        effect: '',
      }

      const result = validateActionWithErrors(invalidAction)

      expect(result.valid).toBe(false)
      expect(result.errors[0]).toBeTruthy()
      expect(typeof result.errors[0]).toBe('string')
    })
  })

  describe('validateActionArray', () => {
    test('валидирует массив действий', () => {
      const actions = [
        {
          id: 'action1',
          category: 'fun' as const,
          title: 'Действие 1',
          hourCost: 1,
          price: 0,
          actionType: 'neutral',
          effect: 'Эффект 1',
        },
        {
          id: 'action2',
          category: 'home' as const,
          title: 'Действие 2',
          hourCost: 2,
          price: 100,
          actionType: 'neutral',
          effect: 'Эффект 2',
        },
      ]

      const result = validateActionArray(actions)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('находит ошибки в массиве', () => {
      const actions = [
        {
          id: 'action1',
          category: 'fun' as const,
          title: 'Действие 1',
          hourCost: 1,
          price: 0,
          actionType: 'neutral',
          effect: 'Эффект 1',
        },
        {
          id: '', // Неверный ID
          category: 'home' as const,
          title: 'Действие 2',
          hourCost: 2,
          price: 100,
          actionType: 'neutral',
          effect: 'Эффект 2',
        },
      ]

      const result = validateActionArray(actions)

      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]!.index).toBe(1)
    })
  })

  describe('validateUniqueIds', () => {
    test('находит дубликаты ID', () => {
      const actions: BalanceAction[] = [
        {
          id: 'duplicate',
          category: 'fun' as const,
          title: 'Действие 1',
          hourCost: 1,
          price: 0,
          actionType: 'neutral',
          effect: 'Эффект 1',
        },
        {
          id: 'duplicate',
          category: 'home' as const,
          title: 'Действие 2',
          hourCost: 2,
          price: 100,
          actionType: 'neutral',
          effect: 'Эффект 2',
        },
      ]

      const result = validateUniqueIds(actions)

      expect(result.valid).toBe(false)
      expect(result.duplicates).toContain('duplicate')
    })

    test('проходит если все ID уникальны', () => {
      const actions: BalanceAction[] = [
        {
          id: 'action1',
          category: 'fun' as const,
          title: 'Действие 1',
          hourCost: 1,
          price: 0,
          actionType: 'neutral',
          effect: 'Эффект 1',
        },
        {
          id: 'action2',
          category: 'home' as const,
          title: 'Действие 2',
          hourCost: 2,
          price: 100,
          actionType: 'neutral',
          effect: 'Эффект 2',
        },
      ]

      const result = validateUniqueIds(actions)

      expect(result.valid).toBe(true)
      expect(result.duplicates).toHaveLength(0)
    })
  })

  describe('validateRequiredFields', () => {
    test('находит отсутствующие обязательные поля', () => {
      const actions: BalanceAction[] = [
        {
          id: 'action1',
          category: 'fun' as const,
          title: '', // Пустое поле
          hourCost: 1,
          price: 0,
          actionType: 'neutral',
          effect: 'Эффект 1',
        },
      ]

      const result = validateRequiredFields(actions)

      expect(result.valid).toBe(false)
      expect(result.missing).toHaveLength(1)
      expect(result.missing[0]!.id).toBe('action1')
      expect(result.missing[0]!.missingFields).toContain('title')
    })

    test('проходит если все обязательные поля присутствуют', () => {
      const actions: BalanceAction[] = [
        {
          id: 'action1',
          category: 'fun' as const,
          title: 'Действие 1',
          hourCost: 1,
          price: 0,
          actionType: 'neutral',
          effect: 'Эффект 1',
        },
      ]

      const result = validateRequiredFields(actions)

      expect(result.valid).toBe(true)
      expect(result.missing).toHaveLength(0)
    })
  })

  describe('validateCatalog', () => {
    test('полная валидация каталога', () => {
      const actions: BalanceAction[] = [
        {
          id: 'action1',
          category: 'fun' as const,
          title: 'Действие 1',
          hourCost: 1,
          price: 0,
          actionType: 'neutral',
          effect: 'Эффект 1',
        },
        {
          id: 'action2',
          category: 'home' as const,
          title: 'Действие 2',
          hourCost: 2,
          price: 100,
          actionType: 'neutral',
          effect: 'Эффект 2',
        },
      ]

      const result = validateActionCatalog(actions)

      expect(result.valid).toBe(true)
      expect(result.schemaErrors).toHaveLength(0)
      expect(result.duplicateIds).toHaveLength(0)
      expect(result.missingFields).toHaveLength(0)
    })

    test('находит все типы ошибок в каталоге', () => {
      const actions: BalanceAction[] = [
        {
          id: 'duplicate',
          category: 'fun' as const,
          title: 'Действие 1',
          hourCost: 1,
          price: 0,
          actionType: 'neutral',
          effect: 'Эффект 1',
        },
        {
          id: 'duplicate',
          category: 'home' as const,
          title: '', // Пустое поле
          hourCost: 2,
          price: 100,
          actionType: 'neutral',
          effect: 'Эффект 2',
        },
        {
          id: '', // Неверный ID
          category: 'invalid' as any,
          title: 'Действие 3',
          hourCost: -1, // Неверное значение
          price: 0,
          actionType: 'neutral',
          effect: 'Эффект 3',
        },
      ]

      const result = validateActionCatalog(actions)

      expect(result.valid).toBe(false)
      expect(result.duplicateIds).toContain('duplicate')
      expect(result.missingFields.length).toBeGreaterThan(0)
      expect(result.schemaErrors.length).toBeGreaterThan(0)
    })
  })
})
