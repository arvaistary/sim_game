import type { CareerJob } from '@/domain/balance/types'
import { getEducationLabelByRank, getEducationRank, storeLevelToCareerRank } from './education-ranks'
import type { CareerRequirementContext } from './career-requirements.types'

/**
 * @description [Domain] - первая причина, по которой персонаж не может занять должность.
 * @return { string | null }
 */
export function getCareerRequirementFailure(
  job: CareerJob,
  context: CareerRequirementContext,
): string | null {
  if (context.currentAge < job.minAge) return `Требуется возраст ${job.minAge}+`

  const educationRank: number = Math.max(
    getEducationRank(context.educationLevel),
    storeLevelToCareerRank(context.educationLevel),
  )

  if (educationRank < job.minEducationRank) {
    return `Требуется образование: ${getEducationLabelByRank(job.minEducationRank)}`
  }

  if (context.professionalism < job.minProfessionalism) {
    return `Требуется профессионализм ${job.minProfessionalism}+`
  }

  return null
}
