import { PLAYER_ENTITY, TIME_COMPONENT, SCHOOL_COMPONENT, EDUCATION_COMPONENT } from '../../components'
import type { GameWorld } from '../../world'
import type { SystemContext } from '@/domain/game-facade/index.types'
import { TimeSystem } from '../TimeSystem'
import { StatsSystem } from '../StatsSystem'
import { SkillsSystem } from '../SkillsSystem'
import type { RuntimeTimeComponent } from '../TimeSystem/index.types'
import { DAYS_IN_AGE_YEAR } from '../TimeSystem/index.constants'
import { telemetryInc } from '../../utils/telemetry'
import type { SchoolComponent, SchoolStatus } from './index.types'
import {
  SCHOOL_START_AGE,
  SCHOOL_END_AGE,
  SCHOOL_GRADUATION_AGE,
  SCHOOL_HOURS_PER_DAY,
  BASE_SKIP_CHANCE,
  MIN_SKIP_CHANCE,
  MAX_SKIP_CHANCE,
  MAX_GRADE,
  SCHOOL_STAT_CHANGES_PER_DAY,
  SCHOOL_SKILL_CHANGES_PER_DAY,
} from './index.constants'

export type { SchoolComponent, SchoolStatus } from './index.types'

/**
 * Школьный контур: зачисление, посещение, классы, выпуск, эффекты через Stats/Skills.
 */
export class SchoolSystem {
  private world!: GameWorld
  private ctx: SystemContext | null = null

  init(world: GameWorld): void {
    this.world = world
    this._ensureSchoolComponent()
  }

  /** Вызывается из getSystemContext после сборки контекста */
  wireFromContext(ctx: SystemContext): void {
    this.ctx = ctx
  }

  /**
   * Публичный API плана: синхронизация возраста / зачисления (например после загрузки).
   */
  checkSchoolAge(): void {
    const time = this.world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as RuntimeTimeComponent | null
    const timeSystem = this.world.getSystem(TimeSystem)
    if (!time || !timeSystem) return
    timeSystem.normalizeTimeComponent(time)
    this.processGameDay(time.gameDays)
  }

  /**
   * Обработка одного игрового дня (индекс gameDays), вызывается из TimeSystem.
   */
  processGameDay(gameDay: number): void {
    this._ensureSchoolComponent()
    const time = this.world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as RuntimeTimeComponent | null
    const school = this.world.getTypedComponent(PLAYER_ENTITY, SCHOOL_COMPONENT)
    if (!time || !school) return

    const startAge = Number(time.startAge ?? 18)
    const ageForDay = startAge + Math.floor(gameDay / DAYS_IN_AGE_YEAR)

    if (school.enrolled && ageForDay >= SCHOOL_GRADUATION_AGE) {
      this._graduate(school, ageForDay, gameDay)
      return
    }

    if (!school.enrolled && ageForDay >= SCHOOL_START_AGE && ageForDay < SCHOOL_GRADUATION_AGE) {
      this._enrollInSchool(school, gameDay, ageForDay)
      return
    }

    if (!school.enrolled) return

    this._syncGradesToAge(school, ageForDay)

    this._processSchoolDay(school, gameDay, ageForDay)
  }

  /**
   * Реакция на смену возраста (крупные скачки времени): догоняем классы.
   */
  onPlayerAgeChanged(_previousAge: number, currentAge: number): void {
    this._ensureSchoolComponent()
    const school = this.world.getTypedComponent(PLAYER_ENTITY, SCHOOL_COMPONENT)
    if (!school?.enrolled) return
    if (currentAge >= SCHOOL_GRADUATION_AGE) {
      const time = this.world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as RuntimeTimeComponent | null
      const gd = time?.gameDays ?? 0
      this._graduate(school, currentAge, gd)
      return
    }
    this._syncGradesToAge(school, currentAge)
  }

  getSchoolStatus(): SchoolStatus | null {
    const school = this.world.getTypedComponent(PLAYER_ENTITY, SCHOOL_COMPONENT)
    if (!school) return null
    const total = school.attendance + school.skippedDays
    return {
      enrolled: school.enrolled,
      grade: school.grade,
      attendance: school.attendance,
      totalDays: total,
      skippedDays: school.skippedDays,
      attendanceRate: total > 0 ? school.attendance / total : 0,
      grades: { ...school.grades },
    }
  }

  isEnrolled(): boolean {
    const school = this.world.getTypedComponent(PLAYER_ENTITY, SCHOOL_COMPONENT)
    return Boolean(school?.enrolled)
  }

  getCurrentGrade(): number {
    const school = this.world.getTypedComponent(PLAYER_ENTITY, SCHOOL_COMPONENT)
    return school?.grade ?? 0
  }

  getAttendanceRate(): number {
    const school = this.world.getTypedComponent(PLAYER_ENTITY, SCHOOL_COMPONENT)
    if (!school) return 0
    const total = school.attendance + school.skippedDays
    return total > 0 ? school.attendance / total : 0
  }

  /** @deprecated Оставлено для совместимости; предпочтительны хуки TimeSystem */
  update(world: GameWorld, _deltaHours?: number): void {
    this.world = world
    this.checkSchoolAge()
  }

  private _resolveStats(): StatsSystem | null {
    return this.ctx?.stats ?? this.world.getSystem(StatsSystem) ?? null
  }

  private _resolveSkills(): SkillsSystem | null {
    return this.ctx?.skills ?? this.world.getSystem(SkillsSystem) ?? null
  }

  private _enrollInSchool(school: SchoolComponent, currentDay: number, currentAge: number): void {
    school.enrolled = true
    school.enrolledAt = currentDay
    school.grade = Math.min(MAX_GRADE, Math.max(1, currentAge - SCHOOL_START_AGE + 1))
    school.attendance = 0
    school.skippedDays = 0
    school.lastAttendedDay = 0

    telemetryInc('school_enrolled')
    this.world.emitDomainEvent('school:enrolled', { grade: school.grade, day: currentDay, age: currentAge })
    this._emitActivityEducation('school_enrolled', '🎒 Зачисление в школу', `Класс: ${school.grade}.`, {
      grade: school.grade,
      gameDay: currentDay,
      age: currentAge,
    })
  }

  private _graduate(school: SchoolComponent, age: number, gameDay: number): void {
    if (!school.enrolled) return

    this._syncGradesToAge(school, Math.min(age, SCHOOL_END_AGE))

    const education = this.world.getComponent(PLAYER_ENTITY, EDUCATION_COMPONENT) as Record<string, unknown> | null
    if (education) {
      education.educationLevel = 'Среднее'
      education.school = 'completed'
    }

    school.enrolled = false
    school.grade = 0

    telemetryInc('school_graduated')
    this.world.emitDomainEvent('school:graduated', { age, day: gameDay, grades: { ...school.grades } })
    this._emitActivityEducation('school_graduated', '🎓 Выпуск из школы', 'Получено среднее образование.', {
      age,
      gameDay,
      attendance: school.attendance,
      skippedDays: school.skippedDays,
      grades: { ...school.grades },
    })
  }

  private _processSchoolDay(school: SchoolComponent, currentDay: number, currentAge: number): void {
    const dayOfWeek = currentDay % 7
    if (dayOfWeek > 4) return

    if (school.lastAttendedDay >= currentDay) return
    school.lastAttendedDay = currentDay

    const skipChance = this._calculateSkipChance()

    if (Math.random() < skipChance) {
      school.skippedDays++
      telemetryInc('school_day_skipped')
      this.world.emitDomainEvent('school:skipped', { day: currentDay, age: currentAge })
      this._emitActivityEducation('school_day_skipped', '🚫 Прогул', `Школьный день ${currentDay} пропущен.`, {
        gameDay: currentDay,
        age: currentAge,
        grade: school.grade,
        skippedDays: school.skippedDays,
      })
    } else {
      school.attendance++
      this._applySchoolDayEffects()
      telemetryInc('school_day_attended')
      this.world.emitDomainEvent('school:day_completed', {
        grade: school.grade,
        day: currentDay,
        hours: SCHOOL_HOURS_PER_DAY,
        age: currentAge,
      })
      this._emitActivityEducation('school_day_attended', '📚 Школьный день', 'Посещение занятий.', {
        gameDay: currentDay,
        age: currentAge,
        grade: school.grade,
        attendance: school.attendance,
        hours: SCHOOL_HOURS_PER_DAY,
      })
    }
  }

  private _calculateSkipChance(): number {
    return Math.max(MIN_SKIP_CHANCE, Math.min(MAX_SKIP_CHANCE, BASE_SKIP_CHANCE))
  }

  private _applySchoolDayEffects(): void {
    const stats = this._resolveStats()
    const skills = this._resolveSkills()
    stats?.applyStatChanges({ ...SCHOOL_STAT_CHANGES_PER_DAY })
    skills?.applySkillChanges({ ...SCHOOL_SKILL_CHANGES_PER_DAY }, 'school_day')
  }

  private _syncGradesToAge(school: SchoolComponent, age: number): void {
    if (!school.enrolled || age < SCHOOL_START_AGE || age >= SCHOOL_GRADUATION_AGE) return

    const target = Math.min(MAX_GRADE, Math.max(1, age - SCHOOL_START_AGE + 1))
    while (school.grade < target) {
      this._recordCompletedGradeScore(school, school.grade)
      const from = school.grade
      school.grade += 1
      telemetryInc('school_grade_up')
      this.world.emitDomainEvent('school:grade_up', { from, to: school.grade, age })
      this._emitActivityEducation('school_grade_up', '⬆️ Перевод в следующий класс', `С ${from} в ${school.grade} класс.`, {
        fromGrade: from,
        toGrade: school.grade,
        age,
        attendance: school.attendance,
        skippedDays: school.skippedDays,
      })
    }
  }

  /** Упрощённая оценка за завершённый класс: средний балл 3.0–5.0 */
  private _recordCompletedGradeScore(school: SchoolComponent, completedGrade: number): void {
    if (completedGrade < 1 || completedGrade > MAX_GRADE) return
    const score = Math.round((3 + Math.random() * 2) * 10) / 10
    school.grades[completedGrade] = score
  }

  private _emitActivityEducation(
    category: string,
    title: string,
    description: string,
    metadata: Record<string, unknown>,
  ): void {
    if (!this.world.eventBus) return
    this.world.eventBus.dispatchEvent(
      new CustomEvent('activity:education', {
        detail: {
          category,
          title,
          description,
          icon: null,
          metadata,
        },
      }),
    )
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
