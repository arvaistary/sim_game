import type { StatsState } from '@stores/stats-store/index.types'

export interface StatDef {
  key: keyof StatsState
  label: string
  endColor: string
}
