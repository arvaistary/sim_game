import type { ComputedRef } from 'vue'
import { getPossessionLabel } from '@/constants/possessions'
import { CAREER_JOBS } from '@/domain/balance/constants/career-jobs'
import type { CareerJob, CareerTrackJobItem } from '@/domain/balance/types'
import { EDUCATION_RANK_TO_LABEL, storeLevelToCareerRank } from '@/domain/balance/utils/education-ranks'
import { getCareerTrackJobIds } from '@/config/career-tracks'
import type { WorkCareerItems } from './useWorkCareerItems.types'

/**
 * @description [Composable] - карьерная лестница и вакансии для страницы работы.
 * @return { ComputedRef<WorkCareerItems> }
 */
export function useWorkCareerItems(): { items: ComputedRef<WorkCareerItems> } {
  const store = useGameStore()
  const careerStore = useCareerStore()
  const skillsStore = useSkillsStore()
  const educationStore = useEducationStore()
  const playerStateStore = usePlayerStateStore()

  const items: ComputedRef<WorkCareerItems> = computed(() => {
    void store.worldTick
    void skillsStore.totalLevels
    void educationStore.educationLevel
    void playerStateStore.possessions

    const currentJobId: string = careerStore.currentJob?.id ?? ''
    const currentAge: number = store.age
    const educationRank: number = storeLevelToCareerRank(educationStore.educationLevel)
    const professionalism: number = skillsStore.skills?.professionalism?.level ?? 0

    const allJobs: CareerTrackJobItem[] = CAREER_JOBS.map(
      (job: CareerJob) => {
        const educationRequiredLabel: string = job.minEducationRank === -1
          ? 'Любое'
          : EDUCATION_RANK_TO_LABEL[job.minEducationRank] ?? 'Неизвестно'

        const missingProfessionalism: number = Math.max(0, job.minProfessionalism - professionalism)
        const missingAge: number = Math.max(0, job.minAge - currentAge)
        const missingPossessionLabels: string[] = (job.requiredPossessions ?? [])
          .filter((possessionId: string) => !playerStateStore.hasPossession(possessionId))
          .map((possessionId: string) => getPossessionLabel(possessionId))

        const hasPossessions: boolean = missingPossessionLabels.length === 0
        const unlocked: boolean = professionalism >= job.minProfessionalism
          && educationRank >= job.minEducationRank
          && missingAge === 0
          && hasPossessions

        return {
          id: job.id,
          name: job.name,
          level: job.level,
          gradeLevel: job.gradeLevel,
          minAge: job.minAge,
          schedule: job.schedule,
          salaryPerHour: job.salaryPerHour,
          description: job.description,
          current: job.id === currentJobId,
          unlocked,
          missingProfessionalism,
          missingAge,
          educationRequiredLabel,
          missingPossessionLabels,
          effectiveSalaryPerHour: job.salaryPerHour,
        }
      },
    )

    if (!careerStore.isEmployed || !currentJobId) {
      return {
        trackJobs: [],
        vacancyJobs: allJobs,
      }
    }

    const trackJobIds: string[] = getCareerTrackJobIds(currentJobId)
    const trackJobs: CareerTrackJobItem[] = trackJobIds.map(
      (jobId: string) => allJobs.find(
        (job) => job.id === jobId,
      ),
    ).filter((job): job is CareerTrackJobItem => job !== undefined)

    const vacancyJobs: CareerTrackJobItem[] = allJobs.filter(
      (job: CareerTrackJobItem) => job.id !== currentJobId,
    )

    return {
      trackJobs,
      vacancyJobs,
    }
  })

  return { items }
}
