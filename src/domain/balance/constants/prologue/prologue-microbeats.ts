import type { PrologueMicrobeat } from '@/domain/prologue/prologue.types'

/** Небольшие действия между учебными сценами; награда проходит через stage budget. */
export const PROLOGUE_MICROBEATS: PrologueMicrobeat[] = [
  {
    id: 'remember-study-route',
    title: 'Запомнить маршрут',
    description: 'Перед следующим занятием ты быстро проверяешь, всё ли на своих местах.',
    minigameId: 'match-pairs',
    tagDeltas: { discipline: 1 },
  },
  {
    id: 'connect-useful-ideas',
    title: 'Соединить идеи',
    description: 'Пара знакомых фактов неожиданно складывается в новую подсказку.',
    minigameId: 'match-pairs',
    tagDeltas: { curiosity: 1 },
  },
]
