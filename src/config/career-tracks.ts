/** Карьерные лестницы: от младшей к старшей роли внутри профессии. */
export const CAREER_TRACKS: Record<string, readonly string[]> = {
  it_development: ['it_junior', 'it_middle', 'it_senior', 'it_techlead'],
  medical: ['med_nurse', 'med_doctor_poly', 'med_doctor_spec', 'med_head'],
  education: ['edu_school', 'edu_school_senior', 'edu_university', 'edu_professor'],
  production: ['prod_worker', 'prod_operator', 'prod_master', 'prod_director'],
  retail: ['retail_seller', 'retail_shift', 'retail_manager', 'retail_director'],
  office: ['office_specialist', 'hr_specialist', 'accountant', 'finance_manager'],
  construction: ['build_worker', 'build_brigadir', 'build_pro', 'build_engineer'],
  logistics: ['driver_cargo', 'driver_ap', 'logistics_manager'],
  culinary: ['cook_line', 'cook_senior', 'chef'],
  government: ['gov_specialist', 'gov_inspector', 'gov_official'],
  media: ['media_copywriter', 'media_designer', 'media_photographer', 'media_content'],
  banking: ['bank_manager', 'bank_analyst', 'bank_director'],
  service: ['service_cosmetologist', 'service_fit', 'service_realtor'],
}

/**
 * @description [Config] - id карьерной лестницы для должности.
 * @return { string | null }
 */
export function getCareerTrackIdForJob(jobId: string): string | null {
  for (const [trackId, jobIds] of Object.entries(CAREER_TRACKS)) {
    if (jobIds.includes(jobId)) return trackId
  }

  return null
}

/**
 * @description [Config] - id должностей в карьерной лестнице текущей работы.
 * @return { string[] }
 */
export function getCareerTrackJobIds(jobId: string): string[] {
  const trackId: string | null = getCareerTrackIdForJob(jobId)

  if (!trackId) return [jobId]

  return [...CAREER_TRACKS[trackId]!]
}
