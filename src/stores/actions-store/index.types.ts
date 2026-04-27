export interface GameAction {
  id: string
  title: string
  category: string
  actionType: string
  hourCost: number
  price: number
  statChanges?: Record<string, number>
  skillChanges?: Record<string, number>
  cooldown?: { hours: number }
  requirements?: {
    minAge?: number
    minSkills?: Record<string, number>
  }
}

export interface ActionResult {
  success: boolean
  error?: string
  summary?: string
}

export interface CanExecuteResult {
  canDo: boolean
  reason?: string
}