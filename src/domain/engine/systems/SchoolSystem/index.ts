import { PLAYER_ENTITY, TIME_COMPONENT, SCHOOL_COMPONENT } from '../../components'
import type { GameWorld } from '../../world'
import { TimeSystem } from '../TimeSystem'

export interface SchoolComponent {
  enrolled: boolean
  grade: number
  attendance: number
  grades: Record<number, number>
  skippedDays: number
  lastAttendedDay: number
  enrolledAt: number
}

/**
 * Автоматическая система школы
 */
export class SchoolSystem {
  private world!: GameWorld
  private timeSystem!: TimeSystem | null

  init(world: GameWorld): void {
    this.world = world
    this._ensureSchoolComponent()
  }

  update(world: GameWorld, deltaHours: number): void {
    this.timeSystem = this._resolveTimeSystem()
    if (!this.timeSystem) return

    const time = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as Record<string, unknown> | null
    const school = world.getTypedComponent<SchoolComponent>(PLAYER_ENTITY, SCHOOL_COMPONENT)

    if (!time || !school) return

    const currentAge = (time.currentAge as number) ?? 0
    const currentDay = (time.gameDays as number) ?? 0

    // Автоматическое зачисление в школу с 7 лет
    if (currentAge >= 7 && !school.enrolled) {
      this.enrollInSchool(school, currentDay)
      return
    }

    if (!school.enrolled) return

    // Автоматическое посещение школы
    this._processSchoolDay(school, currentDay)
  }

  private enrollInSchool(school: SchoolComponent, currentDay: number): void {
    school.enrolled = true
    school.enrolledAt = currentDay
    school.grade = 1
    school.attendance = 0
    school.skippedDays = 0

    this.world.emitDomainEvent('school:enrolled', { grade: 1 })
  }

  private _processSchoolDay(school: SchoolComponent, currentDay: number): void {
    const dayOfWeek = currentDay % 7

    // Учебные дни понедельник-пятница (0-4)
    if (dayOfWeek > 4) return

    // Пропускаем уже обработанный день
    if (school.lastAttendedDay >= currentDay) return
    school.lastAttendedDay = currentDay

    // Шанс прогула зависит от черт характера
    const skipChance = this._calculateSkipChance()

    if (Math.random() < skipChance) {
      school.skippedDays++
      this.world.emitDomainEvent('school:skipped', { day: currentDay })
    } else {
      school.attendance++
      this._processSchoolClasses()
    }
  }

  private _calculateSkipChance(): number {
    // Базовый шанс прогула 5%
    let skipChance = 0.05

    // Дополнительные модификаторы от черт характера будут добавлены позже
    return Math.max(0.01, Math.min(0.9, skipChance))
  }

  private _resolveTimeSystem(): TimeSystem | null {
    return this.world.getSystem(TimeSystem) ?? null
  }

  private _processSchoolClasses(): void {
    // Уменьшаем доступное время на 6 часов
    if (this.timeSystem) {
      this.timeSystem.reserveHours(6)
    }

    // Добавляем стандартные эффекты школы
    this.world.emitDomainEvent('school:day_completed', {})
  }

  private _ensureSchoolComponent(): void {
    const existing = this.world.getComponent(PLAYER_ENTITY, SCHOOL_COMPONENT)

    if (!existing) {
      const defaultSchool: SchoolComponent = {
        enrolled: false,
        grade: 0,
        attendance: 0,
        grades: {},
        skippedDays: 0,
        lastAttendedDay: 0,
        enrolledAt: 0,
      }

      this.world.addTypedComponent(PLAYER_ENTITY, SCHOOL_COMPONENT, defaultSchool)
    }
  }
}
