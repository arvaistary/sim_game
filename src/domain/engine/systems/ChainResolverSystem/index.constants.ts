import { AgeGroup } from '@/domain/balance/actions/types'

export const AGE_GROUP_RANGES: Record<AgeGroup, { min: number; max: number }> = {
  [AgeGroup.INFANT]:  { min: 0, max: 3 },
  [AgeGroup.TODDLER]: { min: 4, max: 7 },
  [AgeGroup.CHILD]:   { min: 8, max: 12 },
  [AgeGroup.KID]:     { min: 8, max: 12 },
  [AgeGroup.TEEN]:    { min: 13, max: 15 },
  [AgeGroup.YOUNG]:   { min: 16, max: 18 },
  [AgeGroup.ADULT]:   { min: 19, max: 100 },
}