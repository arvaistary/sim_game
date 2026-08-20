import type { CareerJob } from '@/domain/balance/types'

export type CareerJobInput = Omit<CareerJob, 'gradeLevel'>
