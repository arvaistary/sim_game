import { computed } from 'vue'
import { useSkillsStore } from '@/stores'

export const useSkills = () => {
  const skillsStore = useSkillsStore()

  return {
    skills: computed(() => skillsStore.skills),
    skillList: computed(() => skillsStore.skillList),
    totalLevels: computed(() => skillsStore.totalLevels),
    hasSkill: skillsStore.hasSkill,
    getSkillLevel: skillsStore.getSkillLevel,
    getSkillXp: skillsStore.getSkillXp,
    setSkillLevel: skillsStore.setSkillLevel,
    addSkillXp: skillsStore.addSkillXp,
    applySkillChanges: skillsStore.applySkillChanges,
    hasSkillLevel: skillsStore.hasSkillLevel,
    initializeSkills: skillsStore.initializeSkills,
    reset: skillsStore.reset,
  }
}