import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCareerStore } from '@stores/career-store'

describe('career-store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('должен инициализироваться как безработный', () => {
    const career = useCareerStore()
    expect(career.isEmployed).toBe(false)
    expect(career.hasJob).toBe(false)
    expect(career.currentJob.name).toBe('Безработный')
  })

  it('должен правильно устраиваться на работу', () => {
    const career = useCareerStore()
    career.startWork({
      id: 'job_it',
      name: 'IT Specialist',
      schedule: '5/2',
      employed: true,
      level: 1,
      salaryPerHour: 500,
      salaryPerDay: 4000,
      salaryPerWeek: 20000,
      requiredHoursPerWeek: 40,
      workedHoursCurrentWeek: 0,
      pendingSalaryWeek: 0,
      totalWorkedHours: 0,
      daysAtWork: 0,
    })
    expect(career.isEmployed).toBe(true)
    expect(career.hasJob).toBe(true)
    expect(career.currentJob.name).toBe('IT Specialist')
  })

  it('должен правильно увольняться', () => {
    const career = useCareerStore()
    career.startWork({ id: 'job_it', name: 'IT', schedule: '5/2', employed: true, level: 1, salaryPerHour: 500, salaryPerDay: 4000, salaryPerWeek: 20000, requiredHoursPerWeek: 40, workedHoursCurrentWeek: 0, pendingSalaryWeek: 0, totalWorkedHours: 0, daysAtWork: 0 })
    career.endWork()
    expect(career.isEmployed).toBe(false)
    expect(career.hasJob).toBe(false)
  })

  it('должен правильно добавлять рабочие часы', () => {
    const career = useCareerStore()
    career.startWork({ id: 'job_it', name: 'IT', schedule: '5/2', employed: true, level: 1, salaryPerHour: 500, salaryPerDay: 4000, salaryPerWeek: 20000, requiredHoursPerWeek: 40, workedHoursCurrentWeek: 0, pendingSalaryWeek: 0, totalWorkedHours: 0, daysAtWork: 0 })
    career.addWorkHours(8)
    expect(career.currentJob.workedHoursCurrentWeek).toBe(8)
    expect(career.totalWorkedHours).toBe(8)
  })

  it('должен правильно начислять зарплату', () => {
    const career = useCareerStore()
    career.startWork({ id: 'job_it', name: 'IT', schedule: '5/2', employed: true, level: 1, salaryPerHour: 500, salaryPerDay: 4000, salaryPerWeek: 20000, requiredHoursPerWeek: 40, workedHoursCurrentWeek: 0, pendingSalaryWeek: 0, totalWorkedHours: 0, daysAtWork: 0 })
    career.addPendingSalary(10000)
    expect(career.pendingSalary).toBe(10000)
  })

  it('должен правильно выдавать зарплату', () => {
    const career = useCareerStore()
    career.startWork({ id: 'job_it', name: 'IT', schedule: '5/2', employed: true, level: 1, salaryPerHour: 500, salaryPerDay: 4000, salaryPerWeek: 20000, requiredHoursPerWeek: 40, workedHoursCurrentWeek: 0, pendingSalaryWeek: 0, totalWorkedHours: 0, daysAtWork: 0 })
    career.addPendingSalary(15000)
    const salary = career.collectSalary()
    expect(salary).toBe(15000)
    expect(career.pendingSalary).toBe(0)
  })

  it('weeklyHoursRemaining должен вычисляться правильно', () => {
    const career = useCareerStore()
    career.startWork({ id: 'job_it', name: 'IT', schedule: '5/2', employed: true, level: 1, salaryPerHour: 500, salaryPerDay: 4000, salaryPerWeek: 20000, requiredHoursPerWeek: 40, workedHoursCurrentWeek: 0, pendingSalaryWeek: 0, totalWorkedHours: 0, daysAtWork: 0 })
    career.addWorkHours(30)
    expect(career.weeklyHoursRemaining).toBe(10) // 40 - 30
  })

  it('promote должен повышать уровень', () => {
    const career = useCareerStore()
    career.startWork({ id: 'job_it', name: 'IT', schedule: '5/2', employed: true, level: 1, salaryPerHour: 500, salaryPerDay: 4000, salaryPerWeek: 20000, requiredHoursPerWeek: 40, workedHoursCurrentWeek: 0, pendingSalaryWeek: 0, totalWorkedHours: 0, daysAtWork: 0 })
    career.promote()
    expect(career.careerLevel).toBe(1)
    expect(career.promotions).toBe(1)
  })

  it('resetWeek должен сбрасывать часы', () => {
    const career = useCareerStore()
    career.startWork({ id: 'job_it', name: 'IT', schedule: '5/2', employed: true, level: 1, salaryPerHour: 500, salaryPerDay: 4000, salaryPerWeek: 20000, requiredHoursPerWeek: 40, workedHoursCurrentWeek: 0, pendingSalaryWeek: 0, totalWorkedHours: 0, daysAtWork: 0 })
    career.addWorkHours(35)
    career.resetWeek()
    expect(career.currentJob.workedHoursCurrentWeek).toBe(0)
  })

  it('reset должен сбрасывать состояние', () => {
    const career = useCareerStore()
    career.startWork({ id: 'job_it', name: 'IT', schedule: '5/2', employed: true, level: 1, salaryPerHour: 500, salaryPerDay: 4000, salaryPerWeek: 20000, requiredHoursPerWeek: 40, workedHoursCurrentWeek: 0, pendingSalaryWeek: 0, totalWorkedHours: 0, daysAtWork: 0 })
    career.reset()
    expect(career.isEmployed).toBe(false)
  })
})