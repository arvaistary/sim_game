import type { HousingLevel } from '@domain/balance/types'

export const HOUSING_LEVELS: HousingLevel[] = [
  {
    level: 1,
    name: 'Студия',
    baseComfort: 38,
    monthlyHousingCost: 15500,
    upgradePrice: 0,
    description: 'Маленькая студия в спальном районе. Минимум пространства, но своё собственное жильё.',
  },
  {
    level: 2,
    name: '1-комнатная квартира',
    baseComfort: 55,
    monthlyHousingCost: 25500,
    upgradePrice: 95000,
    description: 'Отдельная однокомнатная квартира. Уже можно принимать гостей и чувствовать себя комфортнее.',
  },
  {
    level: 3,
    name: 'Уютная 2-комнатная квартира',
    baseComfort: 78,
    monthlyHousingCost: 36500,
    upgradePrice: 215000,
    description: 'Просторная и уютная двухкомнатная квартира. Хороший район, есть место для жизни и отдыха.',
  },
  {
    level: 4,
    name: 'Просторная 3-комнатная квартира',
    baseComfort: 105,
    monthlyHousingCost: 48000,
    upgradePrice: 480000,
    description: 'Большая трёхкомнатная квартира с хорошим ремонтом. Много пространства и возможностей для уюта.',
  },
  {
    level: 5,
    name: 'Собственный дом',
    baseComfort: 145,
    monthlyHousingCost: 32000, // ниже, чем квартира, за счёт отсутствия коммунальных платежей в большом объёме
    upgradePrice: 1250000,
    description: 'Собственный дом с участком. Максимальный уровень комфорта и независимости.',
  },
]