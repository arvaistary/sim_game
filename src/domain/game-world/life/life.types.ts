/** Типы жизненного цикла персонажа и финального отчёта. */

export type LifeStatus = 'active' | 'ended'

export type DeathCause = 'natural_old_age' | 'illness' | 'accident' | 'depression' | 'exhaustion'

export type EndingType = 'unfulfilled_life' | 'ordinary_life' | 'successful_career' | 'happy_family' | 'legendary_life'

export interface LifeDayContext {
  currentAge: number
  health: number
  mood: number
  energy: number
  stress: number
  lowMoodDays: number
  accidentTriggered?: boolean
}

export interface LifeScoreCriteria {
  age: number
  money: number
  comfort: number
  skills: number
  family: number
  achievements: number
}

export interface LifeScore {
  total: number
  stars: number
  criteria: LifeScoreCriteria
}

export interface LifeSkillSummary {
  id: string
  level: number
}

export interface LifeFamilySummary {
  relationshipCount: number
  childrenCount: number
  marriages: number
  maxRelationshipLevel: number
}

export interface LifeSummary {
  playerName: string
  ageAtDeath: number
  gameDays: number
  gameHours: number
  deathCause: DeathCause
  deathCauseLabel: string
  endingType: EndingType
  endingTitle: string
  score: LifeScore
  finance: {
    moneyAtDeath: number
    maxMoney: number
    totalEarnings: number
    totalSpent: number
  }
  career: {
    highestJob: string
    maxSalaryPerWeek: number
    promotions: number
    totalWorkDays: number
    totalWorkHours: number
    careerLevel: number
  }
  topSkills: LifeSkillSummary[]
  family: LifeFamilySummary
  housing: {
    maxLevel: number
    comfortAtDeath: number
  }
  possessions: number
  achievements: number
  hobbies: {
    mastered: number
    maxLevel: number
    collections: number
  }
}

export interface LifeState {
  status: LifeStatus
  lowMoodDays: number
  deathCause: DeathCause | null
  summary: LifeSummary | null
}
