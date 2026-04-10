import type { EducationPath } from '@/domain/balance/types'

export const EDUCATION_PATHS: EducationPath[] = [
  {
    id: 'none',
    label: 'Сразу в жизнь',
    description: 'Пропустить образование и начать работать',
    result: {
      educationLevel: 'Нет',
      skills: {
        timeManagement: 1,
        communication: 1,
        financialLiteracy: 1,
      },
      startAge: 18,
    },
  },
  {
    id: 'school',
    label: 'Пройти школу',
    description: 'Мини-игра на 10-12 минут для получения базовых навыков',
    result: {
      educationLevel: 'Среднее',
      skills: {
        timeManagement: 1,
        communication: 1,
        financialLiteracy: 1,
        healthyLifestyle: 1,
      },
      startAge: 18,
    },
  },
  {
    id: 'institute',
    label: 'Пройти школу + Институт',
    description: 'Полный путь образования с получением продвинутого навыка',
    result: {
      educationLevel: 'Высшее',
      skills: {
        timeManagement: 1,
        communication: 1,
        financialLiteracy: 1,
        healthyLifestyle: 1,
        professionalism: 1,
      },
      startAge: 18,
    },
  },
]

