
import type { CareerTrackEntry } from '@application/game'
import type { NewGameSeed, QuitCareerResult, TimeSnapshot, StatsSnapshot, WalletSnapshot, EducationSnapshot, HousingSnapshot, CanApplyWorkShiftResult, GameSessionSnapshot } from './index.types'
import { useCareerStore } from '../career-store'
import type { JobSnapshot } from '../career-store'
import { useSkillsStore } from '../skills-store'
import type { SkillEntry } from '../skills-store'
import { useEducationStore } from '../education-store'
import { useHousingStore } from '../housing-store'
import { useEventsStore } from '../events-store'
import { useFinanceStore } from '../finance-store'
import { useActivityStore } from '../activity-store'

import { useTimeStore } from '../time-store'
import { useStatsStore } from '../stats-store'
import { useWalletStore } from '../wallet-store'
import { usePlayerStore } from '../player-store'

import { changeCareer as resolveCareerChange, getCareerTrack as buildCareerTrack, startEducationProgram as beginEducation } from '@application/game'
import { buildSaveSnapshot as buildVersionedPayload, canStartEducationProgram as checkEducationAvailability, checkWorkShift as validateWorkShift, executeWorkShift as performWorkShift } from '@application/game'
export const useGameStore = defineStore('game', () => {
  const worldVersion = ref<number>(0)
  const isInitialized = ref<boolean>(true)

  const time = useTimeStore()
  const stats = useStatsStore()
  const wallet = useWalletStore()
  const skills = useSkillsStore()
  const career = useCareerStore()
  const education = useEducationStore()
  const housing = useHousingStore()
  const player = usePlayerStore()
  const events = useEventsStore()
  const finance = useFinanceStore()
  const activity = useActivityStore()

  const worldTick = computed<number>(() => worldVersion.value)

  watch(() => time.gameWeeks, (newWeek, oldWeek) => {
    if (newWeek !== oldWeek && oldWeek !== undefined) {
      career.resetWeek()
    }
  })

  function initWorld(): void { worldVersion.value++ }

  function collectSnapshot(): GameSessionSnapshot {
    return {
      player: player.save(),
      time: time.save(),
      stats: stats.save(),
      wallet: wallet.save(),
      skills: skills.save ? skills.save() : {},
      career: career.save ? career.save() : {},
      education: education.save ? education.save() : {},
      housing: housing.save ? housing.save() : {},
      events: events.save ? events.save() : {},
      finance: finance.save ? finance.save() : {},
      activity: activity.save ? activity.save() : {},
    }
  }

  function save(): Record<string, unknown> {
    const snapshot = collectSnapshot()
    const result = buildVersionedPayload(snapshot)

    return result.payload as unknown as Record<string, unknown>
  }

  function load(data?: Record<string, unknown>): boolean {
    if (data?.player) player.load(data.player as Record<string, unknown>)

    if (data?.time) time.load(data.time as Record<string, unknown>)

    if (data?.stats) stats.load(data.stats as Record<string, unknown>)

    if (data?.wallet) wallet.load(data.wallet as Record<string, unknown>)

    if (data?.skills) skills.load?.(data.skills as Record<string, unknown>)

    if (data?.career) career.load?.(data.career as Record<string, unknown>)

    if (data?.education) education.load?.(data.education as Record<string, unknown>)

    if (data?.housing) housing.load?.(data.housing as Record<string, unknown>)

    if (data?.events) events.load?.(data.events as Record<string, unknown>)

    if (data?.finance) finance.load?.(data.finance as Record<string, unknown>)

    if (data?.activity) activity.load?.(data.activity as Record<string, unknown>)
    isInitialized.value = true

    return true
  }

  function resetGame(): void {
    time.reset()
    stats.reset()
    wallet.reset()
    skills.reset()
    career.reset()
    education.reset()
    housing.reset()
    events.reset()
    finance.reset()
    activity.reset()
    player.reset()
    worldVersion.value++
  }

  function startNewGame(seed: NewGameSeed): void {
    const startAge: number = Number.isFinite(seed.startAge)
      ? seed.startAge
      : 0

    resetGame()
    player.setName(seed.playerName)
    player.showWelcomeScreen()
    time.setStartAge(startAge)
    time.setTotalHours(0)
  }

  function canApplyWorkShift(hours: number): CanApplyWorkShiftResult {
    const result = validateWorkShift(hours, {
      isEmployed: career.isEmployed,
      energy: stats.energy,
      weekHoursRemaining: time.weekHoursRemaining,
      salaryPerHour: career.currentJob?.salaryPerHour ?? 0,
    })

    return { canDo: result.canDo, reason: result.reason }
  }

  function applyWorkShift(hours: number): string {
    const result = performWorkShift(hours, {
      isEmployed: career.isEmployed,
      energy: stats.energy,
      weekHoursRemaining: time.weekHoursRemaining,
      salaryPerHour: career.currentJob?.salaryPerHour ?? 0,
    })

    if (!result.success) return result.message

    career.addWorkHours(hours)
    career.addPendingSalary(result.salary)
    const actualSalary = career.collectSalary()
    wallet.earn(actualSalary)

    stats.applyStatChanges(result.statChanges)
    time.advanceHours(result.hourCost)
    worldVersion.value++
    activity.addWorkEntry('Работа', hours, actualSalary)

    return result.message
  }

  function quitCareer(): QuitCareerResult {
    career.endWork()
    worldVersion.value++

    return { success: true, message: 'Вы уволились' }
  }

  function changeCareer(jobId: string): QuitCareerResult {
    const result = resolveCareerChange(jobId, (skill: string) => skills.getSkillLevel(skill))

    if (result.success && result.job) {
      career.startWork({
        id: result.job.id,
        name: result.job.name,
        salaryPerHour: result.job.salaryPerHour,
        requiredHoursPerWeek: result.job.requiredHoursPerWeek,
        schedule: result.job.schedule,
        employed: true,
      })

      worldVersion.value++
    }

    return { success: result.success, message: result.message }
  }

  function startEducationProgram(programId: string): string {
    const result = beginEducation(programId, {
      isEmployed: career.currentJob?.employed ?? false,
      hasActiveProgram: education.isStudying,
    })

    if (!result.success) {
      return result.message
    }

    if (result.programId && result.programName && result.hoursRequired !== undefined) {
      education.startProgramById(result.programId, result.programName, result.hoursRequired)
    }

    return result.message
  }

  function canStartEducationWithReason(): { ok: boolean; reason?: string } {
    const isEmployed= career.currentJob?.employed ?? false
    const hasActiveProgram = education.isStudying

    return checkEducationAvailability(isEmployed, hasActiveProgram)
  }

  function getCareerTrack(): CareerTrackEntry[] {
    const currentJobId: string = career.currentJob?.id ?? ''
    const professionalism: number = skills.getSkillLevel('professionalism')
    const educationRank: number = education.educationRank ?? 0

    return buildCareerTrack(currentJobId, professionalism, educationRank)
  }

  return {
    worldVersion, worldTick, isInitialized,
    playerName: computed<string>(() => player.name),
    welcomeScreenShown: computed<boolean>(() => player.welcomeScreenShown),
    money: computed<number>(() => wallet.money),
    energy: computed<number>(() => stats.energy),
    health: computed<number>(() => stats.health),
    hunger: computed<number>(() => stats.hunger),
    stress: computed<number>(() => stats.stress),
    mood: computed<number>(() => stats.mood),
    comfort: computed<number>(() => housing.comfort),
    age: computed<number>(() => time.currentAge),
    gameDays: computed<number>(() => time.gameDays),
    gameWeeks: computed<number>(() => time.gameWeeks),
    weekHoursRemaining: computed<number>(() => time.weekHoursRemaining),
    currentJobSnapshot: computed<JobSnapshot>(() => career.currentJob),
    time: computed<TimeSnapshot>(() => ({ totalHours: time.totalHours, gameDays: time.gameDays, gameWeeks: time.gameWeeks, currentAge: time.currentAge, sleepDebt: time.sleepDebt, weekHoursRemaining: time.weekHoursRemaining })),
    stats: computed<StatsSnapshot>(() => ({ energy: stats.energy, health: stats.health, hunger: stats.hunger, stress: stats.stress, mood: stats.mood, physical: stats.physical })),
    wallet: computed<WalletSnapshot>(() => ({ money: wallet.money, reserveFund: wallet.reserveFund, totalEarned: wallet.totalEarned, totalSpent: wallet.totalSpent })),
    skills: computed<Record<string, SkillEntry>>(() => skills.skills),
    career: computed<JobSnapshot>(() => career.currentJob),
    education: computed<EducationSnapshot>(() => ({ educationLevel: education.educationLevel, school: education.school, institute: education.institute, cognitiveLoad: education.cognitiveLoad, activeCourses: education.activeEducation ? [education.activeEducation] : [], completedPrograms: education.completedPrograms })),
    housing: computed<HousingSnapshot>(() => ({ level: housing.level, comfort: housing.comfort, furniture: housing.furniture })),
    getCareerTrack,
    initWorld, save, load, resetGame, startNewGame, collectSnapshot,
    canApplyWorkShift, applyWorkShift, quitCareer, changeCareer,
    startEducationProgram, canStartEducationWithReason,
  }
})

export type * from './index.types'
