import type { CareerTrackJobItem } from '@/domain/balance/types'

export type VacancyCardProps = {
  job: CareerTrackJobItem
  disabled?: boolean
  disabledReason?: string
}

export type VacancyCardEmits = {
  apply: [job: CareerTrackJobItem]
}
