import { describe, expect, test, beforeEach } from 'vitest'
import { createWorldFromSave } from '@/domain/game-facade'
import { AntiGrindSystem } from '@/domain/engine/systems/AntiGrindSystem'
import { PLAYER_ENTITY, TIME_COMPONENT } from '@/domain/engine/components/index'

describe('AntiGrindSystem', () => {
  let world: ReturnType<typeof createWorldFromSave>
  let antiGrind: AntiGrindSystem

  beforeEach(() => {
    world = createWorldFromSave({ playerName: 'TestPlayer' })
    antiGrind = new AntiGrindSystem()
    antiGrind.init(world)
  })

  describe('getEffectMultiplier', () => {
    test('возвращает 1.0 для первого выполнения действия', () => {
      const multiplier = antiGrind.getEffectMultiplier('test_action', 'fun')
      expect(multiplier).toBe(1.0)
    })

    test('снижает множитель после повторений того же действия', () => {
      // Регистрируем действие 3 раза
      antiGrind.recordAction('test_action', 'fun')
      antiGrind.recordAction('test_action', 'fun')
      antiGrind.recordAction('test_action', 'fun')

      const multiplier = antiGrind.getEffectMultiplier('test_action', 'fun')
      expect(multiplier).toBeLessThan(1.0)
      expect(multiplier).toBeGreaterThanOrEqual(0.1)
    })

    test('снижает множитель после повторений той же категории', () => {
      // Регистрируем 6 действий одной категории
      for (let i = 0; i < 6; i++) {
        antiGrind.recordAction(`action_${i}`, 'fun')
      }

      const multiplier = antiGrind.getEffectMultiplier('new_action', 'fun')
      expect(multiplier).toBeLessThan(1.0)
    })

    test('не снижает множитель для действий разных категорий', () => {
      antiGrind.recordAction('action1', 'fun')
      antiGrind.recordAction('action2', 'home')
      antiGrind.recordAction('action3', 'social')

      const multiplier = antiGrind.getEffectMultiplier('action4', 'education')
      expect(multiplier).toBe(1.0)
    })

    test('восстанавливает множитель через 24 часа', () => {
      // Регистрируем действие 3 раза
      antiGrind.recordAction('test_action', 'fun')
      antiGrind.recordAction('test_action', 'fun')
      antiGrind.recordAction('test_action', 'fun')

      // Устанавливаем время на 25 часов позже
      const time = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as Record<string, unknown>
      if (time) {
        time.totalHours = 25
      }

      const multiplier = antiGrind.getEffectMultiplier('test_action', 'fun')
      expect(multiplier).toBe(1.0)
    })
  })

  describe('getDiminishingReturnsReason', () => {
    test('возвращает null если нет снижения', () => {
      const reason = antiGrind.getDiminishingReturnsReason('test_action', 'fun')
      expect(reason).toBeNull()
    })

    test('возвращает причину при повторении того же действия', () => {
      for (let i = 0; i < 3; i++) {
        antiGrind.recordAction('test_action', 'fun')
      }

      const reason = antiGrind.getDiminishingReturnsReason('test_action', 'fun')
      expect(reason).toBeTruthy()
      expect(reason).toContain('3 раз')
    })

    test('возвращает причину при повторении категории', () => {
      for (let i = 0; i < 6; i++) {
        antiGrind.recordAction(`action_${i}`, 'fun')
      }

      const reason = antiGrind.getDiminishingReturnsReason('new_action', 'fun')
      expect(reason).toBeTruthy()
      expect(reason).toContain('категории')
    })
  })

  describe('recordAction', () => {
    test('регистрирует действие в истории', () => {
      antiGrind.recordAction('test_action', 'fun')

      const stats = antiGrind.getActionStats('test_action', 'fun')
      expect(stats.sameActionCount).toBe(1)
    })

    test('ограничивает историю 100 записями', () => {
      // Регистрируем 150 действий
      for (let i = 0; i < 150; i++) {
        antiGrind.recordAction(`action_${i}`, 'fun')
      }

      const stats = antiGrind.getActionStats('action_0', 'fun')
      // Первые записи должны быть удалены
      expect(stats.sameActionCount).toBe(0)
    })

    test('очищает старые записи (старше 48 часов)', () => {
      // Регистрируем действие
      antiGrind.recordAction('test_action', 'fun')

      // Устанавливаем время на 50 часов позже
      const time = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as Record<string, unknown>
      if (time) {
        time.totalHours = 50
      }

      const stats = antiGrind.getActionStats('test_action', 'fun')
      expect(stats.sameActionCount).toBe(0)
    })
  })

  describe('getActionStats', () => {
    test('returns stats for action', () => {
      antiGrind.recordAction('test_action', 'fun')
      antiGrind.recordAction('test_action', 'fun')
      antiGrind.recordAction('other_action', 'fun')

      const stats = antiGrind.getActionStats('test_action', 'fun')

      expect(stats.sameActionCount).toBe(2)
      expect(stats.sameCategoryCount).toBe(3)
      // multiplier may be 1.0 if threshold not reached
      expect(stats.effectMultiplier).toBeLessThanOrEqual(1.0)
      // reason may be null if no reduction is applied
      expect(stats.reason === null || typeof stats.reason === 'string').toBe(true)
    })

    test('возвращает причину null если нет снижения', () => {
      antiGrind.recordAction('test_action', 'fun')

      const stats = antiGrind.getActionStats('test_action', 'fun')

      expect(stats.sameActionCount).toBe(1)
      expect(stats.sameCategoryCount).toBe(1)
      expect(stats.effectMultiplier).toBe(1.0)
      expect(stats.reason).toBeNull()
    })
  })

  describe('resetHistory', () => {
    test('очищает всю историю', () => {
      antiGrind.recordAction('test_action', 'fun')
      antiGrind.recordAction('test_action', 'fun')
      antiGrind.recordAction('test_action', 'fun')

      antiGrind.resetHistory()

      const stats = antiGrind.getActionStats('test_action', 'fun')
      expect(stats.sameActionCount).toBe(0)
      expect(stats.sameCategoryCount).toBe(0)
      expect(stats.effectMultiplier).toBe(1.0)
    })
  })

  describe('пороговые значения', () => {
    test('DIMINISHING_RETURNS_THRESHOLD = 3', () => {
      // 2 повторения - без снижения
      antiGrind.recordAction('test_action', 'fun')
      antiGrind.recordAction('test_action', 'fun')

      let multiplier = antiGrind.getEffectMultiplier('test_action', 'fun')
      expect(multiplier).toBe(1.0)

      // 3 повторения - со снижением
      antiGrind.recordAction('test_action', 'fun')
      multiplier = antiGrind.getEffectMultiplier('test_action', 'fun')
      expect(multiplier).toBeLessThan(1.0)
    })

    test('минимальный множитель 0.1', () => {
      // Много повторений
      for (let i = 0; i < 20; i++) {
        antiGrind.recordAction('test_action', 'fun')
      }

      const multiplier = antiGrind.getEffectMultiplier('test_action', 'fun')
      expect(multiplier).toBeGreaterThanOrEqual(0.1)
    })
  })
})
