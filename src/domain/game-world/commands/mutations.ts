/**
 * Pure functions для мутаций GameWorld (ADR-0005, Фаза 2).
 *
 * Заменяют store-методы (applyStatChangesRaw, spend, earn, advanceHours, etc)
 * при работе с GameWorld напрямую. Не импортируют Pinia — только GameWorld.
 */
import type { GameWorld } from '@/domain/game-world/GameWorld'
import type { ActivityEntry, GameWorldSnapshot, SkillLevels } from '@/domain/game-world/GameWorld.types'
import { recalculateSkillModifiers, createBaseSkillModifiers } from '@/domain/balance/constants/skill-modifiers'
import type { SkillModifiers } from '@/domain/balance/types'
import type { LifetimeStatsData, StatsData, TimeData, Investment } from '@/domain/balance/constants/default-save'

const STAT_MIN: number = 0
const STAT_MAX: number = 100

function clampStat(value: number): number {
  return Math.max(STAT_MIN, Math.min(STAT_MAX, value))
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

const MAX_SKILL_LEVEL: number = 10

function xpForLevel(level: number): number {
  return level * 100
}

function levelFromXp(xp: number): number {
  return clamp(xp / xpForLevel(1), 0, MAX_SKILL_LEVEL)
}

/**
 * Применить дельты к статам (с clamp 0..100).
 * @description [Domain] - мутирует world.stats на месте.
 * @param world цель
 * @param changes map stat key → delta
 * @return { void }
 */
export function applyStatChangesRaw(world: GameWorld, changes: Record<string, number>): void {
  const stats: StatsData = world.stats
  for (const [key, delta] of Object.entries(changes)) {
    switch (key) {
      case 'energy':
        stats.energy = clampStat(stats.energy + delta)
        break
      case 'health':
        stats.health = clampStat(stats.health + delta)
        break
      case 'hunger':
        stats.hunger = clampStat(stats.hunger + delta)
        break
      case 'stress':
        stats.stress = clampStat(stats.stress + delta)
        break
      case 'mood':
        stats.mood = clampStat(stats.mood + delta)
        break
      case 'physical':
        stats.physical = clampStat(stats.physical + delta)
        break
    }
  }
}

/**
 * Списать деньги из кошелька.
 * @description [Domain] - мутирует world.wallet.money и totalSpent.
 * @return { boolean } true если хватило денег
 */
export function spendMoney(world: GameWorld, amount: number): boolean {
  if (amount <= 0) return true

  if (world.wallet.money < amount) return false
  world.wallet.money -= amount
  world.wallet.totalSpent += amount
  return true
}

/**
 * Сохранить купленный предмет в общем инвентаре мира.
 * @description [Domain] - добавляет предмет только если он ещё не куплен.
 * @return { void }
 */
export function grantItem(world: GameWorld, itemId: string): void {
  if (!itemId) return

  const furniture: Array<Record<string, unknown>> = world.housing.furniture as Array<Record<string, unknown>>

  if (furniture.some((item: Record<string, unknown>) => item.id === itemId && item.purchased === true)) return

  furniture.push({ id: itemId, name: itemId, comfortBonus: 0, purchased: true })
}

/**
 * Записать использование действия в агрегате мира.
 * @description [Domain] - увеличивает count и обновляет монотонный маркер последнего использования.
 * @return { void }
 */
export function recordActionUsage(world: GameWorld, actionId: string): void {
  const current: GameWorld['actionUsage'][string] = world.actionUsage[actionId] ?? { count: 0, lastUsedAt: 0 }
  const lastUsedAt: number = Object.values(world.actionUsage).reduce(
    (latest, usage) => Math.max(latest, usage.lastUsedAt),
    0,
  ) + 1
  world.actionUsage[actionId] = {
    count: current.count + 1,
    lastUsedAt,
  }
}

/**
 * Начислить деньги в кошелёк.
 * @description [Domain] - мутирует world.wallet.money и totalEarnings.
 * @return { void }
 */
export function earnMoney(world: GameWorld, amount: number): void {
  if (amount <= 0) return
  world.wallet.money += amount
  world.wallet.totalEarnings += amount
  const lifetime: LifetimeStatsData = world.activity.lifetime

  if (world.wallet.money > lifetime.maxMoney) {
    lifetime.maxMoney = world.wallet.money
  }
}

/**
 * Продвинуть время в мире.
 * @description [Domain] - мутирует world.time, обновляет totalHours/sleepDebt и т.д.
 * @return { void }
 */
export function advanceHours(world: GameWorld, hours: number, actionType: 'sleep' | 'work' | 'idle' | 'default' = 'default'): void {
  if (hours <= 0) return
  const time: TimeData = world.time
  time.totalHours += hours
  time.weekHoursSpent = time.totalHours % 168
  time.weekHoursRemaining = time.weekHoursSpent === 0
    ? 168
    : 168 - time.weekHoursSpent
  time.dayHoursSpent = time.totalHours % 24
  time.dayHoursRemaining = time.dayHoursSpent === 0
    ? 24
    : 24 - time.dayHoursSpent
  time.hourOfDay = time.totalHours % 24

  if (actionType !== 'sleep' && actionType !== 'idle') {
    const debtGain: number = hours * 0.5
    time.sleepDebt = clamp(time.sleepDebt + debtGain, 0, 100)
  }
}

/**
 * Применить изменения навыков (XP-based).
 * @description [Domain] - мутирует world.skills.levels, пересчитывает modifiers.
 * @return { void }
 */
export function applySkillChanges(world: GameWorld, changes: Record<string, number>): void {
  const levels: SkillLevels = world.skills.levels
  for (const [key, delta] of Object.entries(changes)) {
    const current: SkillLevels[string] | undefined = levels[key]
    const currentXp: number = typeof current === 'number'
      ? xpForLevel(current)
      : (current?.xp ?? 0)

    if (delta > 0) {
      const newXp: number = currentXp + delta * 100
      const newLevel: number = levelFromXp(newXp)
      levels[key] = { level: newLevel, xp: newXp }
    } else {
      const newXp: number = Math.max(0, currentXp + delta * 100)
      const newLevel: number = levelFromXp(newXp)

      if (current === undefined) continue
      levels[key] = { level: newLevel, xp: newXp }
    }
  }
  world.skills.modifiers = recalculateSkillModifiers(levels as Record<string, number | { level?: number; xp?: number }>)
}

/**
 * Установить уровень навыка напрямую (с пересчётом XP).
 * @description [Domain] - мутирует world.skills.levels, пересчитывает modifiers.
 * @return { void }
 */
export function setSkillLevel(world: GameWorld, key: string, level: number): void {
  const clampedLevel: number = clamp(level, 0, MAX_SKILL_LEVEL)
  world.skills.levels[key] = { level: clampedLevel, xp: xpForLevel(clampedLevel) }
  world.skills.modifiers = recalculateSkillModifiers(world.skills.levels as Record<string, number | { level?: number; xp?: number }>)
}

/**
 * Добавить XP к навыку.
 * @description [Domain] - мутирует world.skills.levels, пересчитывает modifiers.
 * @return { void }
 */
export function addSkillXp(world: GameWorld, key: string, xp: number): void {
  const current: SkillLevels[string] | undefined = world.skills.levels[key]
  const currentXp: number = typeof current === 'number'
    ? xpForLevel(current)
    : (current?.xp ?? 0)
  const newXp: number = currentXp + xp
  world.skills.levels[key] = { level: levelFromXp(newXp), xp: newXp }
  world.skills.modifiers = recalculateSkillModifiers(world.skills.levels as Record<string, number | { level?: number; xp?: number }>)
}

/**
 * Инициализировать несколько навыков по уровням (для new game).
 * @description [Domain] - мутирует world.skills.levels через setSkillLevel.
 * @return { void }
 */
export function initializeSkills(world: GameWorld, initialSkills: Record<string, number>): void {
  for (const [key, level] of Object.entries(initialSkills)) {
    setSkillLevel(world, key, level)
  }
}

/**
 * Получить уровень навыка из мира.
 * @description [Domain] - query для command checks и projections.
 * @return { number } уровень (0 если навык не существует)
 */
export function getSkillLevel(world: GameWorld, key: string): number {
  const entry: SkillLevels[string] | undefined = world.skills.levels[key]

  if (entry === undefined) return 0
  return typeof entry === 'number' ? entry : (entry.level ?? 0)
}

/**
 * Получить XP навыка из мира.
 * @description [Domain] - query для UI/projections.
 * @return { number } XP (0 если навык не существует)
 */
export function getSkillXp(world: GameWorld, key: string): number {
  const entry: SkillLevels[string] | undefined = world.skills.levels[key]

  if (entry === undefined) return 0
  return typeof entry === 'number' ? xpForLevel(entry) : (entry.xp ?? 0)
}

/**
 * Проверить наличие навыка в мире.
 * @description [Domain] - query для UI/projections.
 * @return { boolean }
 */
export function hasSkill(world: GameWorld, key: string): boolean {
  return key in world.skills.levels
}

/**
 * Проверить, имеет ли мир навык нужного уровня.
 * @description [Domain] - query для command checks.
 * @return { boolean }
 */
export function hasSkillLevel(world: GameWorld, skillKey: string, requiredLevel: number): boolean {
  const entry: SkillLevels[string] | undefined = world.skills.levels[skillKey]

  if (entry === undefined) return requiredLevel <= 0
  const level: number = typeof entry === 'number' ? entry : (entry.level ?? 0)
  return level >= requiredLevel
}

/**
 * Получить базовые модификаторы (для createEmpty / сброса).
 * @description [Domain] - helper для инициализации.
 * @return { SkillModifiers }
 */
export function getBaseModifiers(): SkillModifiers {
  return createBaseSkillModifiers()
}

/**
 * Добавить запись в activity log мира.
 * @description [Domain] - мутирует world.activity.entries.
 * @return { void }
 */
export function addActivityEntry(
  world: GameWorld,
  type: string,
  title: string,
  description: string,
  options: { amount?: number; hours?: number; category?: string; outcome?: string } = {},
): void {
  const entry: ActivityEntry = {
    id: `act_${world.activity.entries.length + 1}_${Date.now()}`,
    type,
    title,
    description,
    amount: options.amount,
    hours: options.hours,
    gameDay: Math.floor(world.time.totalHours / 24),
    timestamp: world.time.totalHours,
    category: options.category,
    outcome: options.outcome,
  }
  world.activity.entries.unshift(entry)
}

/**
 * Добавить запись о работе в activity log.
 * @description [Domain] - мутирует world.activity.entries и lifetime.totalWorkHours.
 * @return { void }
 */
export function addWorkActivityEntry(world: GameWorld, title: string, hours: number, amount: number): void {
  addActivityEntry(world, 'work', title, `Отработано ${hours}ч, заработано ${amount} ₽`, {
    amount,
    hours,
    category: 'work',
  })
  world.activity.lifetime.totalWorkHours += hours
}

/**
 * Добавить запись о событии в activity log.
 * @description [Domain] - мутирует world.activity.entries и lifetime.totalEvents.
 * @return { void }
 */
export function addEventActivityEntry(world: GameWorld, title: string, description: string, outcome?: string): void {
  addActivityEntry(world, 'event', title, description, { category: 'event', outcome })
  world.activity.lifetime.totalEvents += 1
}

/**
 * Начать работу: установить currentJob, обнулить счётчики недели, добавить в jobHistory.
 * @description [Domain] - мутирует world.career.
 * @return { void }
 */
export function startCareerWork(world: GameWorld, jobData: Partial<GameWorldSnapshot['career']['currentJob']>): void {
  world.career.currentJob = {
    ...world.career.currentJob,
    ...jobData,
    employed: true,
    workedHoursCurrentWeek: 0,
    pendingSalaryWeek: 0,
  }

  if (jobData.id) {
    world.career.jobHistory.push({ ...world.career.currentJob })
  }
}

/**
 * Завершить работу: сброс currentJob в UNEMPLOYED.
 * @description [Domain] - мутирует world.career.currentJob.
 * @return { void }
 */
export function endCareerWork(world: GameWorld): void {
  world.career.currentJob = {
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
  }
}

/**
 * Добавить отработанные часы в текущую работу.
 * @description [Domain] - мутирует world.career.currentJob.
 * @return { void }
 */
export function addCareerWorkHours(world: GameWorld, hours: number): void {
  if (!world.career.currentJob.employed) return
  world.career.currentJob.workedHoursCurrentWeek += hours
  world.career.currentJob.totalWorkedHours += hours
  world.career.currentJob.daysAtWork += 1
}

/**
 * Добавить отложенную зарплату за смену.
 * @description [Domain] - мутирует world.career.currentJob.pendingSalaryWeek.
 * @return { void }
 */
export function addCareerPendingSalary(world: GameWorld, amount: number): void {
  if (!world.career.currentJob.employed) return
  world.career.currentJob.pendingSalaryWeek += amount
}

/**
 * Собрать накопленную за неделю зарплату (обнуляет pendingSalaryWeek).
 * @description [Domain] - читает и мутирует world.career.currentJob.pendingSalaryWeek.
 * @return { number } выплаченная сумма
 */
export function collectCareerSalary(world: GameWorld): number {
  const salary: number = world.career.currentJob.pendingSalaryWeek
  world.career.currentJob.pendingSalaryWeek = 0
  return salary
}

/**
 * Применить постоянный множитель к текущей почасовой ставке.
 * @description [Domain] - мутирует world.career.currentJob.salaryPerHour для трудоустроенного персонажа.
 * @return { void }
 */
export function applyPermanentSalaryMultiplier(world: GameWorld, multiplier: number): void {
  if (!world.career.currentJob.employed) return

  world.career.currentJob.salaryPerHour *= (1 + multiplier)
}

/**
 * Сбросить недельные счётчики работы.
 * @description [Domain] - мутирует world.career.currentJob.workedHoursCurrentWeek.
 * @return { void }
 */
export function resetCareerWeek(world: GameWorld): void {
  world.career.currentJob.workedHoursCurrentWeek = 0
}

/**
 * Повысить игрока: увеличить careerLevel/promotions и опционально обновить job.
 * @description [Domain] - мутирует world.career.
 * @return { void }
 */
export function promoteCareer(world: GameWorld, newJob?: Partial<GameWorldSnapshot['career']['currentJob']>): void {
  world.career.careerLevel += 1
  world.career.promotions += 1

  if (newJob) {
    world.career.currentJob = { ...world.career.currentJob, ...newJob }
  }
}

/**
 * Инвестировать сумму: списать деньги, добавить Investment в массив.
 * @description [Domain] - мутирует world.wallet и world.finance.investments.
 * @return { boolean } true если хватило денег и инвестиция создана
 */
export function investInWorld(
  world: GameWorld,
  type: Investment['type'],
  amount: number,
  returnRate: number,
): boolean {
  if (!spendMoney(world, amount)) return false

  const investment: Investment = {
    id: `inv_${Date.now()}`,
    type,
    amount,
    returnRate,
    startDate: Date.now(),
  }
  world.finance.investments.push(investment)

  return true
}

/**
 * Снять инвестицию по id: вернуть деньги, удалить из массива.
 * @description [Domain] - мутирует world.wallet и world.finance.investments.
 * @return { number } возвращённая сумма (0 если инвестиция не найдена)
 */
export function divestFromWorld(world: GameWorld, investmentId: string): number {
  let foundIndex: number = -1

  for (let i = 0; i < world.finance.investments.length; i++) {
    if (world.finance.investments[i]?.id === investmentId) {
      foundIndex = i
      break
    }
  }

  if (foundIndex === -1) return 0

  const investment: Investment | undefined = world.finance.investments[foundIndex]

  if (!investment) return 0

  world.finance.investments.splice(foundIndex, 1)
  earnMoney(world, investment.amount)

  return investment.amount
}

/**
 * Посчитать суммарный месячный возврат от инвестиций.
 * @description [Domain] - query для UI/projections.
 * @return { number } суммарный месячный доход
 */
export function calculateMonthlyReturnForWorld(world: GameWorld): number {
  let sum: number = 0

  for (const inv of world.finance.investments) {
    sum += inv.amount * (inv.returnRate / 100 / 12)
  }

  return sum
}

/**
 * Обработать месячный расчёт: начислить investment returns, списать expenses.
 * @description [Domain] - мутирует world.wallet и world.finance.lastMonthlySettlement.
 * @return { void }
 */
export function processMonthlySettlementForWorld(world: GameWorld): void {
  const investmentReturns: number = calculateMonthlyReturnForWorld(world)

  if (investmentReturns > 0) {
    earnMoney(world, Math.round(investmentReturns))
  }

  for (const expense of world.finance.expenseList) {
    spendMoney(world, expense.amount)
  }

  world.finance.lastMonthlySettlement = Date.now()
}

/**
 * Установить/обновить месячный расход по категории.
 * @description [Domain] - мутирует world.finance.expenseList и monthlyExpenses.
 * @return { void }
 */
export function setExpenseInWorld(world: GameWorld, category: string, amount: number): void {
  let found: boolean = false

  for (const expense of world.finance.expenseList) {
    if (expense.category === category) {
      expense.amount = amount
      found = true
      break
    }
  }

  if (!found) {
    world.finance.expenseList.push({ category, amount })
  }
  world.finance.monthlyExpenses[category] = amount
}

/**
 * Взять долг: увеличить debt, начислить деньги в кошелёк.
 * @description [Domain] - мутирует world.wallet и world.finance.debt.
 * @return { void }
 */
export function takeDebtInWorld(world: GameWorld, amount: number): void {
  world.finance.debt += amount
  earnMoney(world, amount)
}

/**
 * Погасить долг: списать деньги, уменьшить debt.
 * @description [Domain] - мутирует world.wallet и world.finance.debt.
 * @return { void }
 */
export function repayDebtInWorld(world: GameWorld, amount: number): void {
  const repay: number = Math.min(amount, world.finance.debt)

  spendMoney(world, repay)
  world.finance.debt = Math.max(0, world.finance.debt - repay)
}

const MAX_MONEY: number = 999_999_999

/**
 * Перевести деньги из кошелька в резервный фонд.
 * @description [Domain] - мутирует world.wallet.money и reserveFund.
 * @return { void }
 */
export function transferToReserveInWorld(world: GameWorld, amount: number): void {
  const transfer: number = Math.min(amount, world.wallet.money)
  world.wallet.money -= transfer
  world.wallet.reserveFund += transfer
}

/**
 * Перевести деньги из резервного фонда в кошелёк.
 * @description [Domain] - мутирует world.wallet.money и reserveFund.
 * @return { void }
 */
export function transferFromReserveInWorld(world: GameWorld, amount: number): void {
  const transfer: number = Math.min(amount, world.wallet.reserveFund)
  world.wallet.reserveFund -= transfer
  world.wallet.money += transfer
}

/**
 * Установить money напрямую (с clamp).
 * @description [Domain] - мутирует world.wallet.money.
 * @return { void }
 */
export function setMoneyInWorld(world: GameWorld, amount: number): void {
  world.wallet.money = Math.max(0, Math.min(MAX_MONEY, amount))
}

/**
 * Добавить money к текущему балансу (с clamp).
 * @description [Domain] - мутирует world.wallet.money.
 * @return { void }
 */
export function addMoneyInWorld(world: GameWorld, amount: number): void {
  world.wallet.money = Math.max(0, Math.min(MAX_MONEY, world.wallet.money + amount))
}

/**
 * Применить Partial изменения статов (с clamp 0..100).
 * @description [Domain] - мутирует world.stats.
 * @return { void }
 */
export function applyStatChanges(world: GameWorld, changes: Partial<StatsData>): void {
  const rawChanges: Record<string, number> = {}
  for (const [key, value] of Object.entries(changes)) {
    if (value !== undefined) {
      rawChanges[key] = value
    }
  }
  applyStatChangesRaw(world, rawChanges)
}

/**
 * Установить статы напрямую (с clamp).
 * @description [Domain] - мутирует world.stats.
 * @return { void }
 */
export function setStatsInWorld(world: GameWorld, newStats: Partial<StatsData>): void {
  if (newStats.energy !== undefined) world.stats.energy = clampStat(newStats.energy)

  if (newStats.health !== undefined) world.stats.health = clampStat(newStats.health)

  if (newStats.hunger !== undefined) world.stats.hunger = clampStat(newStats.hunger)

  if (newStats.stress !== undefined) world.stats.stress = clampStat(newStats.stress)

  if (newStats.mood !== undefined) world.stats.mood = clampStat(newStats.mood)

  if (newStats.physical !== undefined) world.stats.physical = clampStat(newStats.physical)
}

/**
 * Установить energy напрямую (с clamp).
 * @description [Domain] - мутирует world.stats.energy.
 * @return { void }
 */
export function setEnergyInWorld(world: GameWorld, value: number): void {
  world.stats.energy = clampStat(value)
}

/**
 * Восстановить статы к полным (energy/health/mood=100, hunger/stress=0).
 * @description [Domain] - мутирует world.stats.
 * @return { void }
 */
export function restoreAllStatsInWorld(world: GameWorld): void {
  world.stats.energy = 100
  world.stats.health = 100
  world.stats.mood = 100
  world.stats.hunger = 0
  world.stats.stress = 0
}

/**
 * Продвинуть время с учётом сна: списывает sleep debt.
 * @description [Domain] - мутирует world.time.totalHours и sleepDebt.
 * @return { void }
 */
export function advanceHoursWithSleepInWorld(world: GameWorld, hours: number, sleepHours: number): void {
  if (hours <= 0) return
  world.time.totalHours += hours
  world.time.sleepDebt = clamp(world.time.sleepDebt - sleepHours * 2, 0, 100)
}

/**
 * Уменьшить sleep debt.
 * @description [Domain] - мутирует world.time.sleepDebt.
 * @return { void }
 */
export function reduceSleepDebtInWorld(world: GameWorld, amount: number): void {
  world.time.sleepDebt = clamp(world.time.sleepDebt - amount, 0, 100)
}

/**
 * Установить totalHours напрямую.
 * @description [Domain] - мутирует world.time.totalHours.
 * @return { void }
 */
export function setTotalHoursInWorld(world: GameWorld, hours: number): void {
  world.time.totalHours = hours
}

const MAX_EVENT_QUEUE: number = 10
const MAX_EVENT_HISTORY: number = 50

function isInstanceIdInPendingQueue(world: GameWorld, instanceId: string): boolean {
  return world.events.pending.some((queuedEvent: unknown) => {
    if (typeof queuedEvent !== 'object' || queuedEvent === null) return false

    const record: { instanceId?: string } = queuedEvent as { instanceId?: string }

    return record.instanceId === instanceId
  })
}

/**
 * Добавить событие в очередь (если не seen и есть место).
 * @description [Domain] - мутирует world.events.pending и state.seenEventIds.
 * @return { boolean } true если событие добавлено
 */
export function addEventToQueue(world: GameWorld, instanceId: string, event: unknown): boolean {
  if (world.events.state.seenEventIds.includes(instanceId)) return false

  if (isInstanceIdInPendingQueue(world, instanceId)) return false

  if (world.events.pending.length >= MAX_EVENT_QUEUE) return false

  world.events.pending.push(event)
  return true
}

/**
 * Отметить событие как показанное (добавить instanceId в seenEventIds).
 * @description [Domain] - мутирует world.events.state.seenEventIds.
 * @return { void }
 */
export function markEventSeen(world: GameWorld, instanceId: string): void {
  if (!world.events.state.seenEventIds.includes(instanceId)) {
    world.events.state.seenEventIds.push(instanceId)
  }
}

/**
 * Извлечь следующее событие из очереди (FIFO).
 * @description [Domain] - мутирует world.events.pending.
 * @return { unknown } следующее событие или null если очередь пуста
 */
export function shiftNextEvent(world: GameWorld): unknown {
  return world.events.pending.shift() ?? null
}

/**
 * Записать разрешение события в history (с choice или без).
 * @description [Domain] - мутирует world.events.history (с обрезкой до MAX_EVENT_HISTORY).
 * @return { void }
 */
export function pushEventHistoryEntry(
  world: GameWorld,
  entry: { instanceId: string; templateId: string; day?: number; choiceId?: string; choiceText?: string; effects?: Record<string, number> },
): void {
  world.events.history.push(entry)

  if (world.events.history.length > MAX_EVENT_HISTORY) {
    world.events.history = world.events.history.slice(-MAX_EVENT_HISTORY)
  }
}

/**
 * Очистить очередь событий.
 * @description [Domain] - мутирует world.events.pending.
 * @return { void }
 */
export function clearEventQueue(world: GameWorld): void {
  world.events.pending = []
}

/**
 * Проверить, было ли событие показано.
 * @description [Domain] - query для UI/projections.
 * @return { boolean }
 */
export function hasSeenEvent(world: GameWorld, eventId: string): boolean {
  return world.events.state.seenEventIds.includes(eventId)
}

/**
 * Сбросить все события (queue, history, seen, cooldowns).
 * @description [Domain] - мутирует world.events полностью.
 * @return { void }
 */
export function resetEvents(world: GameWorld): void {
  world.events.pending = []
  world.events.history = []
  world.events.state.seenEventIds = []
  world.events.state.cooldownByEventId = {}
  world.events.state.lastWeeklyEventWeek = 0
  world.events.state.lastMonthlyEventMonth = 0
  world.events.state.lastYearlyEventYear = 0
}
