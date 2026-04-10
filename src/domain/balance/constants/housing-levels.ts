import type { HousingLevel } from '@/domain/balance/types'

export const HOUSING_LEVELS: HousingLevel[] = [
  {
    level: 1,
    name: 'Студия',
    baseComfort: 35,
    monthlyHousingCost: 16000,
    upgradePrice: 0,
  },
  {
    level: 2,
    name: '1-комнатная квартира',
    baseComfort: 52,
    monthlyHousingCost: 26000,
    upgradePrice: 95000,
  },
  {
    level: 3,
    name: 'Уютная квартира',
    baseComfort: 72,
    monthlyHousingCost: 38000,
    upgradePrice: 210000,
  },
]

