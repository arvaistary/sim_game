import type { CognitiveLoadStatus } from '@stores/education-store/index.types'
import type { CognitiveLoadStatusObject } from './EducationLevel.types'

export const COGNITIVE_STATUS_MAP: Record<CognitiveLoadStatus, CognitiveLoadStatusObject> = {
  low: { label: 'Низкая', description: 'Когнитивная нагрузка в норме. Можно учиться без ограничений.' },
  medium: { label: 'Средняя', description: 'Умеренная когнитивная нагрузка. Длительность занятий снижена.' },
  high: { label: 'Высокая', description: 'Высокая когнитивная нагрузка. Учёба временно недоступна.' },
}
