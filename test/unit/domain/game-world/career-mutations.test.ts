import { describe, expect, it } from 'vitest'
import { GameWorld } from '@/domain/game-world/GameWorld'
import {
  addCareerPendingSalary,
  addCareerWorkHours,
  collectCareerSalary,
  endCareerWork,
  promoteCareer,
  resetCareerWeek,
  startCareerWork,
} from '@/domain/game-world/commands'
import type { GameWorldSnapshot } from '@/domain/game-world/GameWorld.types'

const EMPLOYED_JOB: GameWorldSnapshot['career']['currentJob'] = {
  id: 'it_junior',
  name: 'Junior-разработчик',
  schedule: '5/2',
  employed: true,
  salaryPerHour: 625,
  salaryPerWeek: 25000,
  salaryPerDay: 5000,
  requiredHoursPerWeek: 40,
  workedHoursCurrentWeek: 0,
  pendingSalaryWeek: 0,
  totalWorkedHours: 0,
  level: 1,
  daysAtWork: 0,
}

describe('domain career mutations', () => {
  it('startCareerWork: устанавливает job, обнуляет недельные счётчики, добавляет в jobHistory', () => {
    const world: GameWorld = GameWorld.createEmpty()

    startCareerWork(world, EMPLOYED_JOB)

    expect(world.career.currentJob.id).toBe('it_junior')
    expect(world.career.currentJob.employed).toBe(true)
    expect(world.career.currentJob.workedHoursCurrentWeek).toBe(0)
    expect(world.career.currentJob.pendingSalaryWeek).toBe(0)
    expect(world.career.jobHistory.length).toBe(1)
    expect(world.career.jobHistory[0]?.id).toBe('it_junior')
  })

  it('endCareerWork: сбрасывает currentJob в UNEMPLOYED', () => {
    const world: GameWorld = GameWorld.createEmpty({ career: { currentJob: { ...EMPLOYED_JOB }, jobHistory: [{ ...EMPLOYED_JOB }], careerLevel: 1, promotions: 0 } })

    endCareerWork(world)

    expect(world.career.currentJob.employed).toBe(false)
    expect(world.career.currentJob.id).toBe('unemployed')
    expect(world.career.currentJob.salaryPerHour).toBe(0)
  })

  it('addCareerWorkHours: накапливает часы только если employed', () => {
    const world: GameWorld = GameWorld.createEmpty({ career: { currentJob: { ...EMPLOYED_JOB }, jobHistory: [], careerLevel: 0, promotions: 0 } })

    addCareerWorkHours(world, 8)
    addCareerWorkHours(world, 4)

    expect(world.career.currentJob.workedHoursCurrentWeek).toBe(12)
    expect(world.career.currentJob.totalWorkedHours).toBe(12)
    expect(world.career.currentJob.daysAtWork).toBe(2)
  })

  it('addCareerWorkHours: no-op для безработного', () => {
    const world: GameWorld = GameWorld.createEmpty()

    addCareerWorkHours(world, 8)

    expect(world.career.currentJob.workedHoursCurrentWeek).toBe(0)
  })

  it('addCareerPendingSalary: накапливает зарплату', () => {
    const world: GameWorld = GameWorld.createEmpty({ career: { currentJob: { ...EMPLOYED_JOB }, jobHistory: [], careerLevel: 0, promotions: 0 } })

    addCareerPendingSalary(world, 5000)
    addCareerPendingSalary(world, 3000)

    expect(world.career.currentJob.pendingSalaryWeek).toBe(8000)
  })

  it('collectCareerSalary: возвращает и обнуляет pending', () => {
    const world: GameWorld = GameWorld.createEmpty({ career: { currentJob: { ...EMPLOYED_JOB, pendingSalaryWeek: 10000 }, jobHistory: [], careerLevel: 0, promotions: 0 } })

    const salary: number = collectCareerSalary(world)

    expect(salary).toBe(10000)
    expect(world.career.currentJob.pendingSalaryWeek).toBe(0)
  })

  it('resetCareerWeek: обнуляет workedHoursCurrentWeek', () => {
    const world: GameWorld = GameWorld.createEmpty({ career: { currentJob: { ...EMPLOYED_JOB, workedHoursCurrentWeek: 40 }, jobHistory: [], careerLevel: 0, promotions: 0 } })

    resetCareerWeek(world)

    expect(world.career.currentJob.workedHoursCurrentWeek).toBe(0)
    expect(world.career.currentJob.totalWorkedHours).toBe(0) // не трогает totalWorkedHours
  })

  it('promoteCareer: увеличивает careerLevel/promotions и опционально обновляет job', () => {
    const world: GameWorld = GameWorld.createEmpty({ career: { currentJob: { ...EMPLOYED_JOB }, jobHistory: [], careerLevel: 0, promotions: 0 } })

    promoteCareer(world, { level: 2, salaryPerHour: 1000 })

    expect(world.career.careerLevel).toBe(1)
    expect(world.career.promotions).toBe(1)
    expect(world.career.currentJob.level).toBe(2)
    expect(world.career.currentJob.salaryPerHour).toBe(1000)
  })
})
