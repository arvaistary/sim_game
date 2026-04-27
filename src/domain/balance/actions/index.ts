import type { BalanceAction } from './types'

import { SHOP_ACTIONS } from './shop-actions'
import { FUN_ACTIONS } from './fun-actions'
import { HOME_ACTIONS } from './home-actions'
import { SOCIAL_ACTIONS } from './social-actions'
import { EDUCATION_ACTIONS } from './education-actions'
import { FINANCE_ACTIONS } from './finance-actions'
import { CAREER_ACTIONS } from './career-actions'
import { HOBBY_ACTIONS } from './hobby-actions'
import { HEALTH_ACTIONS } from './health-actions'
import { SELFDEV_ACTIONS } from './selfdev-actions'
import { CHILD_ACTIONS_REGISTERED } from './child-actions-registered'

export { type BalanceAction } from './types'
export { SHOP_ACTIONS } from './shop-actions'
export { FUN_ACTIONS } from './fun-actions'
export { HOME_ACTIONS } from './home-actions'
export { SOCIAL_ACTIONS } from './social-actions'
export { EDUCATION_ACTIONS } from './education-actions'
export { FINANCE_ACTIONS } from './finance-actions'
export { CAREER_ACTIONS } from './career-actions'
export { HOBBY_ACTIONS } from './hobby-actions'
export { HEALTH_ACTIONS } from './health-actions'
export { SELFDEV_ACTIONS } from './selfdev-actions'
export { CHILD_ACTIONS_REGISTERED } from './child-actions-registered'
export { ACTION_CATEGORIES } from './constants'

const ALL_ACTIONS_MAP = new Map<string, BalanceAction>()

function registerActions(actions: BalanceAction[]): void {
  for (const action of actions) {
    const actionId = action.id
    if (ALL_ACTIONS_MAP.has(actionId)) {
      console.warn(`[Actions] Duplicate action id: ${actionId}`)
    }
    
    ALL_ACTIONS_MAP.set(actionId, action)
  }
}

registerActions(SHOP_ACTIONS)
registerActions(FUN_ACTIONS)
registerActions(HOME_ACTIONS)
registerActions(SOCIAL_ACTIONS)
registerActions(EDUCATION_ACTIONS)
registerActions(FINANCE_ACTIONS)
registerActions(CAREER_ACTIONS)
registerActions(HOBBY_ACTIONS)
registerActions(HEALTH_ACTIONS)
registerActions(SELFDEV_ACTIONS)
registerActions(CHILD_ACTIONS_REGISTERED)

export function getActionById(id: string): BalanceAction | null {
  return ALL_ACTIONS_MAP.get(id) ?? null
}

export function getActionsByCategory(categoryId: string): BalanceAction[] {
  const result: BalanceAction[] = []
  for (const [, action] of ALL_ACTIONS_MAP) {
    if (action.category === categoryId) {
      result.push(action)
    }
  }

  return result
}

export function getAllActions(): BalanceAction[] {
  return Array.from(ALL_ACTIONS_MAP.values())
}

export function getActionsCount(): number {
  return ALL_ACTIONS_MAP.size
}

