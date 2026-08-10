import type { Ref } from 'vue'

import type { DayPlanInput, DayPlanResult } from '@/domain/game-world/commands/commands.types'

export interface DayPlannerStoreState {
  plan: Ref<DayPlanInput>
  result: Ref<DayPlanResult | null>
}

export type { DayPlanInput, DayPlanResult }
