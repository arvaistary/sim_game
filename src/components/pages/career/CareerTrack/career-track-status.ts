import type { CareerTrackJobItem } from '@/domain/balance/types'

import type { CareerTrackStatus } from './career-track-status.types'

/**
 * @description [UI] - статус строки карьерной лестницы.
 * @return { CareerTrackStatus }
 */
export function getCareerTrackStatus(job: CareerTrackJobItem): CareerTrackStatus {
  if (job.current) {
    return {
      label: 'Текущая',
      tone: 'current',
    }
  }

  if (job.unlocked) {
    return {
      label: 'Доступна',
      tone: 'available',
    }
  }

  if (job.missingAge > 0) {
    return {
      label: `Возраст: ещё ${job.missingAge} лет`,
      tone: 'requirement',
    }
  }

  if (job.missingProfessionalism > 0) {
    return {
      label: `Профессионализм: ещё ${job.missingProfessionalism} ур.`,
      tone: 'requirement',
    }
  }

  if (job.missingPossessionLabels.length > 0) {
    return {
      label: `Нужно: ${job.missingPossessionLabels.join(', ')}`,
      tone: 'requirement',
    }
  }

  return {
    label: `Образование: ${job.educationRequiredLabel}`,
    tone: 'education',
  }
}
