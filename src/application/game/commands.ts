import type { ExecuteActionCommandResult, JobCatalogEntry, ProgramCatalogEntry } from './index.types'
import type { BalanceAction } from '@/domain/balance/actions'
import { getActionById } from '@/domain/balance/actions'
import { useTimeStore } from '@/stores/time-store'
import { useStatsStore } from '@/stores/stats-store'
import { useWalletStore } from '@/stores/wallet-store'
import { useSkillsStore } from '@/stores/skills-store'
import { useCareerStore } from '@/stores/career-store'
import { useEducationStore } from '@/stores/education-store'
import { useFinanceStore } from '@/stores/finance-store'
import { useActivityStore } from '@/stores/activity-store'
import type { EventChoice, GameEvent } from '@/stores/events-store'
import { useEventsStore } from '@/stores/events-store'

export const appGameCommands = {
  executeLifestyleAction(cardData: Record<string, unknown>): string {
    const financeStore = useFinanceStore()

    const statsStore = useStatsStore()

    const actionType: string = cardData.type as string

    if (actionType === 'invest') {
      const amount: number = cardData.amount as number
      const returnRate: number = (cardData.returnRate as number) ?? 5
      const type: 'deposit' | 'stocks' | 'business' = (cardData.investmentType as 'deposit' | 'stocks' | 'business') ?? 'deposit'
      const success: boolean = financeStore.invest(type, amount, returnRate)
      return success ? 'Инвестиция успешна' : 'Недостаточно средств'
    }

    if (actionType === 'sleep') {
      const hours: number = (cardData.hours as number) ?? 8
      const energy: number = Math.min(100, statsStore.energy + hours * 10)
      statsStore.setEnergy(energy)
      return 'Вы поспали'
    }
    return 'Неизвестное действие'
  },

  simulateWorkShift(hours: number): string {
    const careerStore = useCareerStore()

    const walletStore = useWalletStore()

    const statsStore = useStatsStore()

    const activityStore = useActivityStore()

    if (!careerStore.isEmployed) return 'Нет работы'

    const salary: number = hours * (careerStore.currentJob?.salaryPerHour ?? 0)
    careerStore.addWorkHours(hours)
    careerStore.addPendingSalary(salary)

    const actualSalary: number = careerStore.collectSalary()
    walletStore.earn(actualSalary)

    statsStore.applyStatChanges({
      energy: -(hours * 3),
      hunger: +(hours * 2),
    })

    activityStore.addWorkEntry('Работа', hours, actualSalary)

    return `Вы заработали ${actualSalary} ₽`
  },

  changeCareer(jobId: string): { success: boolean; message: string } {
    const careerStore = useCareerStore()

    const skillsStore = useSkillsStore()

    const JOBS: Record<string, JobCatalogEntry> = {
      'junior-dev': { name: 'Junior Developer', salaryPerHour: 500, requiredHoursPerWeek: 40 },
      'mid-dev': { name: 'Middle Developer', salaryPerHour: 1000, requiredHoursPerWeek: 40 },
      'senior-dev': { name: 'Senior Developer', salaryPerHour: 2000, requiredHoursPerWeek: 40 },
      'lead-dev': { name: 'Tech Lead', salaryPerHour: 3500, requiredHoursPerWeek: 40 },
    }

    const job: JobCatalogEntry | undefined = JOBS[jobId]

    if (!job) return { success: false, message: 'Вакансия не найдена' }

    if (jobId === 'mid-dev' && skillsStore.getSkillLevel('programming') < 5) {
      return { success: false, message: 'Требуется программирование 5+' }
    }

    if (jobId === 'senior-dev' && skillsStore.getSkillLevel('programming') < 10) {
      return { success: false, message: 'Требуется программирование 10+' }
    }

    if (jobId === 'lead-dev' && skillsStore.getSkillLevel('leadership') < 8) {
      return { success: false, message: 'Требуется лидерство 8+' }
    }

    careerStore.startWork({
      id: jobId,
      name: job.name,
      salaryPerHour: job.salaryPerHour,
      requiredHoursPerWeek: job.requiredHoursPerWeek,
      schedule: '5/2',
      employed: true,
    })

    return { success: true, message: `Вы устроились на ${job.name}` }
  },

  quitCareer(): { success: boolean; message: string } {
    const careerStore = useCareerStore()

    careerStore.endWork()
    return { success: true, message: 'Вы уволились' }
  },

  startEducationProgram(programId: string): string {
    const educationStore = useEducationStore()

    const PROGRAMS: Record<string, ProgramCatalogEntry> = {
      'high-school': { 
        name: 'Среднее образование', 
        duration: 1000, 
        cost: 0,
      },
      'university': { 
        name: 'Университет', 
        duration: 3000, 
        cost: 50000,
      },
      'courses': { 
        name: 'Курсы', 
        duration: 200, 
        cost: 10000,
      },
    }

    const program: ProgramCatalogEntry | undefined = PROGRAMS[programId]

    if (!program) return 'Программа не найдена'

    educationStore.startProgramById(programId, program.name, program.duration)
    return `Начато обучение: ${program.name}`
  },

  advanceEducation(): string {
    const educationStore = useEducationStore()

    const result: string | null = educationStore.advance()
    return result ? `Изучено: ${result}` : 'Нет активной программы'
  },

  executeFinanceDecision(actionId: string): string {
    const walletStore = useWalletStore()

    const action: BalanceAction | null = getActionById(actionId)

    if (!action) return 'Действие не найдено'

    if (action.price > walletStore.money) return 'Недостаточно средств'

    walletStore.spend(action.price)
    return action.effect || 'Выполнено'
  },

  executeAction(actionId: string): ExecuteActionCommandResult {
    const action: BalanceAction | null = getActionById(actionId)

    if (!action) return { success: false, message: 'Действие не найдено' }

    const walletStore = useWalletStore()

    const timeStore = useTimeStore()

    const statsStore = useStatsStore()

    const activityStore = useActivityStore()

    if (walletStore.money < action.price) return { success: false, message: 'Недостаточно денег' }

    if (timeStore.weekHoursRemaining < action.hourCost) return { success: false, message: 'Недостаточно времени' }

    walletStore.spend(action.price)
    timeStore.advanceHours(action.hourCost)

    if (action.statChanges) {
      statsStore.applyStatChanges(action.statChanges)
    }

    activityStore.addActionEntry(action.title, action.effect || 'Выполнено', { category: action.category })

    return { success: true, message: action.effect || 'Выполнено' }
  },

  resolveEventDecision(_eventId: string, choiceId: string): string {
    const eventsStore = useEventsStore()

    const statsStore = useStatsStore()

    const activityStore = useActivityStore()

    const current: GameEvent | null = eventsStore.currentEvent

    if (!current) return 'Нет события'

    const choice: EventChoice | undefined = current.choices?.find(
      (c: EventChoice) => c.id === choiceId,
    )

    if (!choice) return 'Выбор не найден'

    if (choice.effects) {
      statsStore.applyStatChanges(choice.effects)
    }

    eventsStore.resolveCurrentEvent(choiceId, choice.text, choice.effects)
    activityStore.addEventEntry(current.title, choice.text, choice.outcome)

    return choice.outcome || 'Выбор применён'
  },

  collectInvestment(investmentId: string): string {
    const financeStore = useFinanceStore()

    const amount: number = financeStore.divest(investmentId)
    return amount > 0 ? `Получено ${amount} ₽` : 'Инвестиция не найдена'
  },

  advanceTime(hours: number): void {
    const timeStore = useTimeStore()

    timeStore.advanceHours(hours)
  },

  applyMonthlySettlement(): string {
    const financeStore = useFinanceStore()

    const walletStore = useWalletStore()

    financeStore.processMonthlySettlement()

    return `Расчёт завершён. Баланс: ${walletStore.money} ₽`
  },
}
