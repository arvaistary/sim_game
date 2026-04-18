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
    test('выполнение действия увеличивает время', () => {
      const timeBefore = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as Record<string, unknown>
      const hoursBefore = (timeBefore?.totalHours as number) ?? 0

      const action = getActionById('fun_cinema')
      if (!action) {
        throw new Error('Action not found')
      }

      const result = actionSystem.execute(action.id)
      expect(result.success).toBe(true)

      const timeAfter = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as Record<string, unknown>
      const hoursAfter = (timeAfter?.totalHours as number) ?? 0

      expect(hoursAfter).toBe(hoursBefore + action.hourCost)
    })

    test('выполнение действия обновляет статы', () => {
      const statsBefore = world.getComponent(PLAYER_ENTITY, STATS_COMPONENT) as Record<string, number>
      const moodBefore = statsBefore?.mood ?? 0

      const action = getActionById('fun_cinema')
      if (!action) {
        throw new Error('Action not found')
      }

      const result = actionSystem.execute(action.id)
      expect(result.success).toBe(true)

      const statsAfter = world.getComponent(PLAYER_ENTITY, STATS_COMPONENT) as Record<string, number>
      const moodAfter = statsAfter?.mood ?? 0

      // Mood должен измениться согласно statChanges действия
      expect(moodAfter).not.toBe(moodBefore)
    })

    test('сохранение и загрузка сохраняет состояние после действия', () => {
      const action = getActionById('fun_cinema')
      if (!action) {
        throw new Error('Action not found')
      }

      // Выполняем действие
      actionSystem.execute(action.id)

      // Сохраняем состояние
      const saveData = world.toJSON()

      // Создаём новый мир и загружаем сохранение
      const newWorld = createWorldFromSave(saveData)
      const newActionSystem = new ActionSystem()
      newActionSystem.init(newWorld)

      // Проверяем, что время совпадает
      const oldTime = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as Record<string, unknown>
      const newTime = newWorld.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as Record<string, unknown>
      expect((newTime?.totalHours as number) ?? 0).toBe((oldTime?.totalHours as number) ?? 0)
    })
  })

  describe('age restrictions', () => {
    test('действие с ageGroup недоступно для младшего возраста', () => {
      const action = getActionById('fin_deposit')
      if (!action) {
        throw new Error('Action not found')
      }

      // Устанавливаем возраст 15 лет (TEEN)
      const time = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as Record<string, unknown>
      if (time) {
        time.currentAge = 15
      }

      const check = actionSystem.canExecute(action.id)
      // fin_deposit требует ADULT (19+)
      expect(check.available).toBe(false)
      expect(check.reason).toContain('19')
    })

    test('действие с ageGroup доступно для подходящего возраста', () => {
      const action = getActionById('fin_deposit')
      if (!action) {
        throw new Error('Action not found')
      }

      // Устанавливаем возраст 20 лет (ADULT)
      const time = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as Record<string, unknown>
      if (time) {
        time.currentAge = 20
      }

      const check = actionSystem.canExecute(action.id)
      expect(check.available).toBe(true)
    })
  })

  describe('needs validation', () => {
    test('действие недоступно при низкой энергии', () => {
      const action = getActionById('fun_cinema')
      if (!action) {
        throw new Error('Action not found')
      }

      // Устанавливаем низкую энергию
      const stats = world.getComponent(PLAYER_ENTITY, STATS_COMPONENT) as Record<string, number>
      if (stats) {
        stats.energy = 5
      }

      const check = actionSystem.canExecute(action.id)
      expect(check.available).toBe(false)
      expect(check.reason).toContain('энергии')
    })

    test('действие доступно при низкой энергии если это sleep', () => {
      const action = getActionById('home_sleep')
      if (!action) {
        throw new Error('Action not found')
      }

      // Устанавливаем низкую энергию
      const stats = world.getComponent(PLAYER_ENTITY, STATS_COMPONENT) as Record<string, number>
      if (stats) {
        stats.energy = 5
      }

      const check = actionSystem.canExecute(action.id)
      // Sleep действие должно быть доступно даже при низкой энергии
      expect(check.available).toBe(true)
    })

    test('действие недоступно при высоком голоде', () => {
      const action = getActionById('fun_cinema')
      if (!action) {
        throw new Error('Action not found')
      }

      // Устанавливаем высокий голод
      const stats = world.getComponent(PLAYER_ENTITY, STATS_COMPONENT) as Record<string, number>
      if (stats) {
        stats.hunger = 85
      }

      const check = actionSystem.canExecute(action.id)
      expect(check.available).toBe(false)
      expect(check.reason).toContain('голод')
    })
  })

  describe('requirements validation', () => {
    test('действие недоступно без нужного навыка', () => {
      const action = getActionById('career_promotion')
      if (!action) {
        throw new Error('Action not found')
      }

      const check = actionSystem.canExecute(action.id)
      // Если действие требует навык, а его нет - должно быть недоступно
      if (action.requirements?.minSkills) {
        expect(check.available).toBe(false)
      }
    })

    test('действие недоступно без нужного уровня жилья', () => {
      const action = getActionById('home_upgrade')
      if (!action) {
        throw new Error('Action not found')
      }

      const check = actionSystem.canExecute(action.id)
      // Если действие требует уровень жилья, а его нет - должно быть недоступно
      if (action.requirements?.housingLevel) {
        expect(check.available).toBe(false)
      }
    })
  })

  describe('cooldown and one-time', () => {
    test('действие с cooldown недоступно во время кулдауна', () => {
      const action = getActionById('fun_cinema')
      if (!action) {
        throw new Error('Action not found')
      }

      // Добавляем cooldown вручную для теста
      const cooldowns = world.getComponent(PLAYER_ENTITY, 'cooldown') as Record<string, number> | null
      if (cooldowns) {
        cooldowns[action.id] = timeSystem.getTotalHours() - 1 // 1 час назад
      }

      const check = actionSystem.canExecute(action.id)
      // Если у действия есть cooldown и он ещё не прошёл
      if (action.cooldown) {
        expect(check.available).toBe(false)
        expect(check.reason).toContain('Кулдаун')
      }
    })

    test('one-time действие недоступно после выполнения', () => {
      const action = getActionById('shop_first_purchase')
      if (!action) {
        throw new Error('Action not found')
      }

      // Выполняем действие
      actionSystem.execute(action.id)

      // Проверяем, что оно больше недоступно
      const check = actionSystem.canExecute(action.id)
      if (action.oneTime) {
        expect(check.available).toBe(false)
        expect(check.reason).toBe('Уже выполнено')
      }
    })
  })

  describe('EventIngress integration', () => {
    test('выполнение действия публикует событие через EventIngress', () => {
      const action = getActionById('fun_cinema')
      if (!action) {
        throw new Error('Action not found')
      }

      // Получаем начальное количество событий
      const eventQueue = world.getComponent(PLAYER_ENTITY, 'eventQueue') as Record<string, unknown> | null
      const queueBefore = (eventQueue?.queue as Array<Record<string, unknown>>) || []
      const countBefore = queueBefore.length

      // Выполняем действие
      actionSystem.execute(action.id)

      // Проверяем, что событие добавлено
      const queueAfter = (eventQueue?.queue as Array<Record<string, unknown>>) || []
      const countAfter = queueAfter.length

      expect(countAfter).toBeGreaterThan(countBefore)
    })
  })
})
