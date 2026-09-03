/**
 * GameWorld — aggregate root, единый source of truth состояния игры.
 *
 * Реализация ADR-0005 (Strategy A): state-container + command-handler pattern
 * (НЕ ECS, см. ADR-0002). Состояние хранится в plain объектах без Vue reactive.
 * Мутируется только через command-methods (будут добавлены в Фазе 2).
 *
 * Domain-only: без импортов Vue/Nuxt/Pinia. Bridge к Pinia — в bridge.ts.
 */
import type {
  ActivityEntry,
  GameWorldJSON,
  GameWorldSnapshot,
  PlayerSlice,
  SkillLevels,
} from './GameWorld.types'
import { GAME_WORLD_VERSION } from './GameWorld.types'
import type {
  EducationData,
  FinanceData,
  HousingData,
  LifetimeStatsData,
  RelationshipData,
  StatsData,
  TimeData,
} from '@/domain/balance/constants/default-save'
import { createBaseSkillModifiers } from '@/domain/balance/constants/skill-modifiers'
import { INITIAL_STATS } from '@/domain/balance/constants/initial-stats'
import { normalizeSkillLevels } from '@/domain/balance/skills'
import type { CharacterTag, SkillModifiers } from '@/domain/balance/types'
import { cloneLifeState, createInitialLifeState, normalizeLifeState } from './life'
import type { LifeState } from './life'
import {
  cloneMetaProgression,
  createInitialMetaProgression,
  normalizeMetaProgression,
} from '@/domain/meta-progression'
import type { MetaProgression } from '@/domain/meta-progression'

export class GameWorld {
  private readonly _player: PlayerSlice
  private readonly _time: TimeData
  private readonly _stats: StatsData
  private readonly _wallet: GameWorldSnapshot['wallet']
  private readonly _career: GameWorldSnapshot['career']
  private readonly _housing: HousingData
  private readonly _skills: { levels: SkillLevels; modifiers: SkillModifiers }
  private readonly _education: EducationData
  private readonly _relationships: RelationshipData[]
  private readonly _finance: FinanceData
  private readonly _events: GameWorldSnapshot['events']
  private readonly _activity: { entries: ActivityEntry[]; lifetime: LifetimeStatsData }
  private readonly _actionUsage: NonNullable<GameWorldSnapshot['actionUsage']>
  private readonly _tags: { items: CharacterTag[] }
  private readonly _meta: MetaProgression
  private readonly _life: LifeState

  constructor(snapshot: GameWorldSnapshot) {
    this._player = { ...snapshot.player }
    this._time = { ...snapshot.time }
    this._stats = { ...snapshot.stats }
    this._wallet = { ...snapshot.wallet }
    this._career = {
      currentJob: { ...snapshot.career.currentJob },
      jobHistory: snapshot.career.jobHistory.map((job) => ({ ...job })),
      careerLevel: snapshot.career.careerLevel,
      promotions: snapshot.career.promotions,
    }
    this._housing = { ...snapshot.housing }
    this._skills = {
      levels: { ...snapshot.skills.levels },
      modifiers: { ...snapshot.skills.modifiers },
    }
    this._education = { ...snapshot.education }
    this._relationships = snapshot.relationships.map((rel: RelationshipData) => ({ ...rel }))
    this._finance = {
      ...snapshot.finance,
      investments: snapshot.finance.investments.map((inv) => ({ ...inv })),
      expenseList: snapshot.finance.expenseList.map((exp) => ({ ...exp })),
    }
    this._events = {
      state: { ...snapshot.events.state },
      history: [...snapshot.events.history],
      pending: [...snapshot.events.pending],
    }
    this._activity = {
      entries: [...snapshot.activity.entries],
      lifetime: { ...snapshot.activity.lifetime },
    }
    this._actionUsage = Object.fromEntries(
      Object.entries(snapshot.actionUsage ?? {}).map(([actionId, usage]) => [actionId, { ...usage }]),
    )
    this._tags = {
      items: snapshot.tags ? snapshot.tags.items.map((tag: CharacterTag) => ({ ...tag })) : [],
    }
    this._meta = cloneMetaProgression(normalizeMetaProgression(snapshot.meta))
    this._life = cloneLifeState(normalizeLifeState(snapshot.life))
  }

  get player(): PlayerSlice {
    return this._player
  }

  get time(): TimeData {
    return this._time
  }

  get stats(): StatsData {
    return this._stats
  }

  get wallet(): GameWorldSnapshot['wallet'] {
    return this._wallet
  }

  get career(): GameWorldSnapshot['career'] {
    return this._career
  }

  get housing(): HousingData {
    return this._housing
  }

  get skills(): GameWorldSnapshot['skills'] {
    return this._skills
  }

  get education(): EducationData {
    return this._education
  }

  get relationships(): RelationshipData[] {
    return this._relationships
  }

  get finance(): FinanceData {
    return this._finance
  }

  get events(): GameWorldSnapshot['events'] {
    return this._events
  }

  get activity(): GameWorldSnapshot['activity'] {
    return this._activity
  }

  get actionUsage(): NonNullable<GameWorldSnapshot['actionUsage']> {
    return this._actionUsage
  }

  get tags(): { items: CharacterTag[] } {
    return this._tags
  }

  get meta(): MetaProgression {
    return this._meta
  }

  get life(): LifeState {
    return this._life
  }

  toJSON(): GameWorldJSON {
    return {
      version: GAME_WORLD_VERSION,
      player: { ...this._player },
      time: { ...this._time },
      stats: { ...this._stats },
      wallet: { ...this._wallet },
      career: {
        currentJob: { ...this._career.currentJob },
        jobHistory: this._career.jobHistory.map((job) => ({ ...job })),
        careerLevel: this._career.careerLevel,
        promotions: this._career.promotions,
      },
      housing: { ...this._housing },
      skills: {
        levels: { ...this._skills.levels },
        modifiers: { ...this._skills.modifiers },
      },
      education: { ...this._education },
      relationships: this._relationships.map((rel: RelationshipData) => ({ ...rel })),
      finance: {
        ...this._finance,
        investments: this._finance.investments.map((inv) => ({ ...inv })),
        expenseList: this._finance.expenseList.map((exp) => ({ ...exp })),
      },
      events: {
        state: { ...this._events.state },
        history: [...this._events.history],
        pending: [...this._events.pending],
      },
      activity: {
        entries: [...this._activity.entries],
        lifetime: { ...this._activity.lifetime },
      },
      actionUsage: Object.fromEntries(
        Object.entries(this._actionUsage).map(([actionId, usage]) => [actionId, { ...usage }]),
      ),
      tags: { items: this._tags.items.map((tag: CharacterTag) => ({ ...tag })) },
      meta: cloneMetaProgression(this._meta),
      life: cloneLifeState(this._life),
    }
  }

  static fromJSON(json: GameWorldJSON): GameWorld {
    const snapshot: GameWorldSnapshot = {
      player: { ...json.player },
      time: { ...json.time },
      stats: { ...json.stats },
      wallet: { ...json.wallet },
      career: {
        currentJob: { ...json.career.currentJob },
        jobHistory: json.career.jobHistory.map((job) => ({ ...job })),
        careerLevel: json.career.careerLevel,
        promotions: json.career.promotions,
      },
      housing: { ...json.housing },
      skills: {
        levels: normalizeSkillLevels(json.skills.levels),
        modifiers: { ...json.skills.modifiers },
      },
      education: { ...json.education },
      relationships: json.relationships.map((rel: RelationshipData) => ({ ...rel })),
      finance: {
        ...json.finance,
        investments: json.finance.investments.map((inv) => ({ ...inv })),
        expenseList: json.finance.expenseList.map((exp) => ({ ...exp })),
      },
      events: {
        state: { ...json.events.state },
        history: [...json.events.history],
        pending: [...json.events.pending],
      },
      activity: {
        entries: [...json.activity.entries],
        lifetime: { ...json.activity.lifetime },
      },
      actionUsage: json.actionUsage ?? {},
      tags: json.tags ? { items: json.tags.items.map((tag: CharacterTag) => ({ ...tag })) } : undefined,
      meta: json.meta,
      life: json.life,
    }
    return new GameWorld(snapshot)
  }

  toSnapshot(): GameWorldSnapshot {
    const json: GameWorldJSON = this.toJSON()
    const { version: _version, ...snapshot }: GameWorldJSON = json
    void _version
    return snapshot
  }

  static createEmpty(initial?: Partial<GameWorldSnapshot>): GameWorld {
    const base: GameWorldSnapshot = {
      player: { playerName: '', startAge: 18, currentAge: 18 },
      time: {
        totalHours: 0,
        hourOfDay: 0,
        dayOfWeek: 1,
        weekHoursSpent: 0,
        weekHoursRemaining: 168,
        dayHoursSpent: 0,
        dayHoursRemaining: 24,
        sleepHoursToday: 0,
        sleepDebt: 0,
      },
      stats: { ...INITIAL_STATS },
      wallet: { money: 0, totalEarnings: 0, totalSpent: 0, reserveFund: 0 },
      career: {
        currentJob: {
          id: 'unemployed',
          name: 'Безработный',
          schedule: '0/0',
          employed: false,
          salaryPerHour: 0,
          salaryPerWeek: 0,
          salaryPerDay: 0,
          requiredHoursPerWeek: 0,
          workedHoursCurrentWeek: 0,
          pendingSalaryWeek: 0,
          totalWorkedHours: 0,
          level: 0,
          daysAtWork: 0,
        },
        jobHistory: [],
        careerLevel: 0,
        promotions: 0,
      },
      housing: {
        level: 0,
        name: 'Нет жилья',
        comfort: 0,
        furniture: [],
        lastWeeklyBonus: null,
      },
      skills: { levels: {}, modifiers: createBaseSkillModifiers() },
      education: {
        school: 'none',
        institute: 'none',
        educationLevel: 'Нет',
        activeCourses: [],
        cognitiveLoad: 0,
        studyHoursSinceLastSleep: 0,
        completedPrograms: [],
      },
      relationships: [],
      finance: {
        reserveFund: 0,
        monthlyExpenses: {},
        lastMonthlySettlement: null,
        debt: 0,
        investments: [],
        expenseList: [],
      },
      events: {
        state: {
          cooldownByEventId: {},
          lastWeeklyEventWeek: 0,
          lastMonthlyEventMonth: 0,
          lastYearlyEventYear: 0,
          seenEventIds: [],
        },
        history: [],
        pending: [],
      },
      activity: {
        entries: [],
        lifetime: {
          totalWorkDays: 0,
          totalWorkHours: 0,
          totalEvents: 0,
          totalMicroEvents: 0,
          maxMoney: 0,
        },
      },
      actionUsage: {},
      tags: { items: [] },
      meta: createInitialMetaProgression(),
      life: createInitialLifeState(),
    }

    const merged: GameWorldSnapshot = { ...base, ...initial }
    return new GameWorld(merged)
  }
}

export type { GameWorldSnapshot, GameWorldJSON } from './GameWorld.types'
export { GAME_WORLD_VERSION } from './GameWorld.types'
