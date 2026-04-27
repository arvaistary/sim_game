import type { StatsState } from '@stores/stats-store'

export interface StatDef {
  key: keyof StatsState
  label: string
  endColor: string
}
