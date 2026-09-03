import type { GameWorld } from '@/domain/game-world/GameWorld'
import type { DeathCause, EndingType, LifeScore, LifeScoreCriteria, LifeSkillSummary, LifeSummary } from './life.types'

const FAMILY_TYPES: ReadonlySet<string> = new Set<string>(['family', 'partner', 'spouse', 'child', 'children'])
const CHILD_TYPES: ReadonlySet<string> = new Set<string>(['child', 'children'])
const MARRIAGE_TYPES: ReadonlySet<string> = new Set<string>(['spouse', 'married'])

const DEATH_CAUSE_LABELS: Record<DeathCause, string> = {
  natural_old_age: 'Естественная смерть',
  illness: 'Болезнь',
  accident: 'Авария',
  depression: 'Депрессия',
  exhaustion: 'Истощение',
}

const ENDING_TITLES: Record<EndingType, string> = {
  unfulfilled_life: 'Жизнь, которую можно было бы прожить',
  ordinary_life: 'Обычная жизнь',
  successful_career: 'Успешная карьера',
  happy_family: 'Счастливая семья',
  legendary_life: 'Легендарная жизнь',
}

function scoreAge(age: number): number {
  if (age >= 70) return 3

  if (age >= 60) return 2

  if (age >= 50) return 1
  return 0
}

function scoreMoney(money: number): number {
  if (money > 1_000_000) return 3

  if (money >= 500_000) return 2

  if (money >= 100_000) return 1
  return 0
}

function scoreComfort(comfort: number): number {
  if (comfort > 70) return 3

  if (comfort >= 50) return 2

  if (comfort >= 30) return 1
  return 0
}

function scoreSkills(skills: LifeSkillSummary[]): number {
  const advancedCount: number = skills.filter(skill => skill.level >= 7).length

  if (advancedCount >= 5) return 3

  if (advancedCount >= 3) return 2

  if (advancedCount >= 1) return 1
  return 0
}

function scoreFamily(hasFamily: boolean, childrenCount: number, friendsCount: number): number {
  if (hasFamily && childrenCount > 0) return 3

  if (hasFamily) return 2

  if (friendsCount > 0) return 1
  return 0
}

function scoreAchievements(achievements: number): number {
  if (achievements > 30) return 3

  if (achievements >= 20) return 2

  if (achievements >= 10) return 1
  return 0
}

function buildScore(criteria: LifeScoreCriteria): LifeScore {
  const total: number = Object.values(criteria).reduce((sum: number, value: number) => sum + value, 0)
  const stars: number = Math.max(1, Math.min(5, Math.round((total / 18) * 4) + 1))
  return { total, stars, criteria }
}

function getEndingType(
  age: number,
  money: number,
  score: LifeScore,
  hasFamily: boolean,
  childrenCount: number,
  advancedSkillCount: number,
  careerLevel: number,
  promotions: number,
): EndingType {
  if (age < 40) return 'unfulfilled_life'

  if (age >= 75 && score.stars === 5 && money > 1_000_000 && hasFamily && childrenCount > 0 && advancedSkillCount >= 5) {
    return 'legendary_life'
  }

  if (hasFamily && childrenCount > 0) return 'happy_family'

  if (careerLevel >= 3 || promotions >= 3 || money > 1_000_000) return 'successful_career'
  return 'ordinary_life'
}

/**
 * Построить неизменяемый итоговый отчёт по завершённой жизни.
 * @description [Domain] - агрегирует доступные показатели GameWorld для финального экрана и экспорта.
 * @param world мир на момент Game Over
 * @param deathCause подтверждённая причина смерти
 * @return { LifeSummary } итоговый отчёт
 */
export function buildLifeSummary(world: GameWorld, deathCause: DeathCause): LifeSummary {
  const relationships: GameWorld['relationships'] = world.relationships
  const familyRelationships: GameWorld['relationships'] = relationships.filter(relationship => FAMILY_TYPES.has(relationship.type))
  const childrenCount: number = relationships.filter(relationship => CHILD_TYPES.has(relationship.type)).length
  const marriages: number = relationships.filter(relationship => MARRIAGE_TYPES.has(relationship.type)).length
  const friendsCount: number = relationships.filter(relationship => relationship.type === 'friend').length
  const maxRelationshipLevel: number = relationships.reduce(
    (maximum: number, relationship) => Math.max(maximum, relationship.level),
    0,
  )
  const topSkills: LifeSkillSummary[] = Object.entries(world.skills.levels).map(([id, entry]): LifeSkillSummary => ({ id, level: entry.level }))
    .sort((first, second) => second.level - first.level || first.id.localeCompare(second.id))
    .slice(0, 5)
  const advancedSkillCount: number = Object.values(world.skills.levels).filter(entry => entry.level >= 7).length
  const achievements: number = world.meta.unlockedAchievements.length
  const maxSalaryPerWeek: number = Math.max(
    world.career.currentJob.salaryPerWeek,
    ...world.career.jobHistory.map(job => job.salaryPerWeek),
    0,
  )
  const highestJob: string = world.career.jobHistory.length > 0
    ? world.career.jobHistory[world.career.jobHistory.length - 1]?.name ?? world.career.currentJob.name
    : world.career.currentJob.name
  const criteria: LifeScoreCriteria = {
    age: scoreAge(world.player.currentAge),
    money: scoreMoney(world.wallet.money),
    comfort: scoreComfort(world.housing.comfort),
    skills: scoreSkills(topSkills),
    family: scoreFamily(familyRelationships.length > 0, childrenCount, friendsCount),
    achievements: scoreAchievements(achievements),
  }
  const score: LifeScore = buildScore(criteria)
  const endingType: EndingType = getEndingType(
    world.player.currentAge,
    world.wallet.money,
    score,
    familyRelationships.length > 0,
    childrenCount,
    advancedSkillCount,
    world.career.careerLevel,
    world.career.promotions,
  )

  return {
    playerName: world.player.playerName,
    ageAtDeath: world.player.currentAge,
    gameDays: Math.floor(world.time.totalHours / 24),
    gameHours: world.time.totalHours,
    deathCause,
    deathCauseLabel: DEATH_CAUSE_LABELS[deathCause],
    endingType,
    endingTitle: ENDING_TITLES[endingType],
    score,
    finance: {
      moneyAtDeath: world.wallet.money,
      maxMoney: Math.max(world.wallet.money, world.activity.lifetime.maxMoney),
      totalEarnings: world.wallet.totalEarnings,
      totalSpent: world.wallet.totalSpent,
    },
    career: {
      highestJob,
      maxSalaryPerWeek,
      promotions: world.career.promotions,
      totalWorkDays: world.activity.lifetime.totalWorkDays,
      totalWorkHours: world.activity.lifetime.totalWorkHours,
      careerLevel: world.career.careerLevel,
    },
    topSkills,
    family: {
      relationshipCount: relationships.length,
      childrenCount,
      marriages,
      maxRelationshipLevel,
    },
    housing: { maxLevel: world.housing.level, comfortAtDeath: world.housing.comfort },
    possessions: 0,
    achievements,
    hobbies: { mastered: 0, maxLevel: 0, collections: 0 },
  }
}
