export interface CanApplyWorkShiftResult {
  canDo: boolean
  reason?: string
}

export interface CanExecuteActionResult {
  canDo: boolean
  canExecute: boolean
  reason?: string
}

export interface ExecuteActionResult {
  success: boolean
  message: string
}

export interface QuitCareerResult {
  success: boolean
  message: string
}

export interface ChangeCareerResult {
  success: boolean
  message: string
}

export interface CanStartEducationResult {
  ok: boolean
  reason?: string
}

export interface FinanceOverview {
  balance: number
  expenses: number
  income: number
}

export interface FinanceSnapshot {
  monthlyExpenses: import('./finance-store').MonthlyExpense[]
}

export interface GameActionItemCooldown {
  hours: number
}

export interface GameActionItemRequirements {
  minAge?: number
  minSkills?: Record<string, number>
  requiresCompletedProgramId?: string
}

export interface ServerSessionErrorCandidate {
  code?: string
  statusCode?: number
  data?: {
    code?: string
  }
}

export interface ServerConflictErrorCandidate extends ServerSessionErrorCandidate {
  code?: string
  details?: Record<string, unknown>
}

export interface GameActionItem {
  id: string
  title: string
  category: string
  actionType: string
  hourCost: number
  price: number
  statChanges: Record<string, number> | undefined
  skillChanges: Record<string, number> | undefined
  cooldown: GameActionItemCooldown | undefined
  requirements: GameActionItemRequirements | undefined
  oneTime: boolean | undefined
  grantsItem: string | undefined
}
