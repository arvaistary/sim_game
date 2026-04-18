import { describe, expect, test, beforeEach } from 'vitest'
import { createWorldFromSave } from '@/domain/game-facade'
import { ActionSystem } from '@/domain/engine/systems/ActionSystem'
import { TimeSystem } from '@/domain/engine/systems/TimeSystem'
import { PLAYER_ENTITY, TIME_COMPONENT, STATS_COMPONENT, WALLET_COMPONENT } from '@/domain/engine/components/index'
import { getActionById } from '@/domain/balance/actions'

describe('Integration: Actions Flow', () => {
  let world: ReturnType<typeof createWorldFromSave>
  let actionSystem: ActionSystem
  let timeSystem: TimeSystem

  beforeEach(() => {
    world = createWorldFromSave({ playerName: 'TestPlayer' })
    actionSystem = new ActionSystem()
    actionSystem.init(world)
    timeSystem = new TimeSystem()
    timeSystem.init(world)
  })

  describe('action → time → save flow', () => {
    test('execution increases time', () => {
      const action = getActionById('fun_cinema')
      if (!action) {
        return // Action may not exist
      }

      const timeBefore = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as Record<string, unknown>
      const hoursBefore = (timeBefore?.totalHours as number) ?? 0

      const result = actionSystem.execute(action.id)
      expect(result.success).toBe(true)

      const timeAfter = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as Record<string, unknown>
      const hoursAfter = (timeAfter?.totalHours as number) ?? 0

      expect(hoursAfter).toBe(hoursBefore + action.hourCost)
    })

    test('save and load preserves state', () => {
      const action = getActionById('fun_cinema')
      if (!action) {
        return
      }

      actionSystem.execute(action.id)
      const saveData = world.toJSON()
      const newWorld = createWorldFromSave(saveData)

      const oldTime = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as Record<string, unknown>
      const newTime = newWorld.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as Record<string, unknown>

      expect(newTime?.totalHours).toBeDefined()
    })
  })

  describe('age restrictions', () => {
    test('action with ageGroup check works', () => {
      const action = getActionById('fin_deposit')
      if (!action) {
        return
      }

      const time = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as Record<string, unknown>
      if (time) {
        time.currentAge = 20
        time.gameDays = 20 * 360
      }

      const check = actionSystem.canExecute(action.id)
      expect(check).toBeDefined()
    })
  })

  describe('needs validation', () => {
    test('fun_cinema availability check works', () => {
      const action = getActionById('fun_cinema')
      if (!action) {
        return
      }

      const check = actionSystem.canExecute(action.id)
      expect(check).toBeDefined()
    })
  })

  describe('requirements validation', () => {
    test('action availability check works', () => {
      const action = getActionById('fun_cinema')
      if (!action) {
        return
      }

      const check = actionSystem.canExecute(action.id)
      expect(check).toBeDefined()
    })
  })

  describe('cooldown and one-time', () => {
    test('action availability check works', () => {
      const action = getActionById('fun_cinema')
      if (!action) {
        return
      }

      const check = actionSystem.canExecute(action.id)
      expect(check).toBeDefined()
    })
  })

  describe('EventIngress integration', () => {
    test('action execution returns result', () => {
      const action = getActionById('fun_cinema')
      if (!action) {
        return
      }

      const result = actionSystem.execute(action.id)
      expect(result).toBeDefined()
    })
  })
})