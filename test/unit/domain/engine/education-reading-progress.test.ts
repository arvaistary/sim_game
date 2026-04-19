import { describe, expect, test } from 'vitest'
import { createWorldFromSave } from '@/domain/game-facade'
import { gameCommands } from '@/domain/game-facade/commands'
import { PLAYER_ENTITY, EDUCATION_COMPONENT, COGNITIVE_LOAD_COMPONENT } from '@/domain/engine/components'
import type { ActiveCourse } from '@/domain/engine/systems/EducationSystem/index.types'

describe('education reading progress after sleep', () => {
  test('book progress continues after sleeping', () => {
    const world = createWorldFromSave({ playerName: 'Reader' })

    gameCommands.executeAction(world, 'shop_time_management_book')
    const startResult = gameCommands.startEducationProgram(world, 'time_management_book')
    expect(startResult).toContain('начат')

    let education = world.getComponent<Record<string, unknown>>(PLAYER_ENTITY, EDUCATION_COMPONENT)
    let activeCourse = ((education?.activeCourses ?? []) as ActiveCourse[])[0]
    let safety = 0
    while (activeCourse.currentStepIndex === 0 && safety < 5) {
      gameCommands.advanceEducation(world)
      education = world.getComponent<Record<string, unknown>>(PLAYER_ENTITY, EDUCATION_COMPONENT)
      activeCourse = ((education?.activeCourses ?? []) as ActiveCourse[])[0]
      safety += 1
    }

    expect(activeCourse.currentStepIndex).toBe(1)

    const hoursSpentBeforeSleep = activeCourse.hoursSpent
    const currentStepProgressBeforeSleep = activeCourse.steps[activeCourse.currentStepIndex]?.progressPercent ?? 0

    const sleepResult = gameCommands.executeAction(world, 'fun_sleep_normal')
    const cognitiveAfterSleep = {
      ...(world.getComponent<Record<string, unknown>>(PLAYER_ENTITY, COGNITIVE_LOAD_COMPONENT) ?? {}),
    }
    const readAfterSleep = gameCommands.advanceEducation(world)

    education = world.getComponent<Record<string, unknown>>(PLAYER_ENTITY, EDUCATION_COMPONENT)
    activeCourse = ((education?.activeCourses ?? []) as ActiveCourse[])[0]
    const currentStepProgressAfterSleep = activeCourse.steps[activeCourse.currentStepIndex]?.progressPercent ?? 0

    expect(activeCourse.hoursSpent).toBeGreaterThan(hoursSpentBeforeSleep)
    expect(activeCourse.currentStepIndex).toBeGreaterThanOrEqual(1)
    expect(currentStepProgressAfterSleep).toBeGreaterThan(currentStepProgressBeforeSleep)
    expect(sleepResult.message.length).toBeGreaterThan(0)
    expect(cognitiveAfterSleep?.studyHoursSinceLastSleep).toBe(0)
    expect(readAfterSleep.includes('Невозможно продолжить обучение')).toBe(false)
  })
})
