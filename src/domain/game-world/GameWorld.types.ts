/**
 * Типы для GameWorld aggregate (ADR-0005, Strategy A).
 *
 * Shape состояния повторяет SaveData, но без служебных полей save-формата
 * (version) и без агрегатных подсчётов (gameDays/gameWeeks/etc — это projections
 * от totalHours). GameWorld хранит чистое game state.
 */
import type {
  EducationData,
  EventStateData,
  FinanceData,
  HousingData,
  JobData,
  LifetimeStatsData,
  RelationshipData,
  StatsData,
  TimeData,
} from '@/domain/balance/constants/default-save'
import type { CharacterTag, SkillModifiers } from '@/domain/balance/types'

/** Снимок навыков: key → level (число), либо { level, xp } для совместимости со store. */
export type SkillLevels = Record<string, number | { level: number; xp: number }>

/** Запись в activity log. */
export interface ActivityEntry {
  id: string
  type: string
  title: string
  description?: string
  amount?: number
  hours?: number
  gameDay?: number
  timestamp?: number
  category?: string
  outcome?: string
}

export interface ActionUsageEntry {
  count: number
  lastUsedAt: number
}

/** Снимок среза time/стартовых параметров персонажа. */
export interface PlayerSlice {
  playerName: string
  startAge: number
  currentAge: number
}

/**
 * Полный снимок состояния игры.
 * GameWorld.toJSON() возвращает этот объект; GameWorld.fromJSON() принимает его.
 * Формат совместим с SaveData (без поля version) — существующие сейвы грузятся без миграции.
 */
export interface GameWorldSnapshot {
  player: PlayerSlice
  time: TimeData
  stats: StatsData
  wallet: {
    money: number
    totalEarnings: number
    totalSpent: number
    reserveFund: number
  }
  career: {
    currentJob: JobData
    jobHistory: JobData[]
    careerLevel: number
    promotions: number
  }
  housing: HousingData
  skills: {
    levels: SkillLevels
    modifiers: SkillModifiers
  }
  education: EducationData
  relationships: RelationshipData[]
  finance: FinanceData
  events: {
    state: EventStateData
    history: unknown[]
    pending: unknown[]
  }
  activity: {
    entries: ActivityEntry[]
    lifetime: LifetimeStatsData
  }
  actionUsage?: Record<string, ActionUsageEntry>
  tags?: { items: CharacterTag[] }
}

/** JSON-форма для сериализации. Совпадает со snapshot + version для schema evolution. */
export interface GameWorldJSON extends GameWorldSnapshot {
  /** Версия формата JSON. При несовпадении — миграция через infrastructure/persistence. */
  version: string
}

/** Текущая версия формата GameWorld JSON. */
export const GAME_WORLD_VERSION: string = '1.1.0'
