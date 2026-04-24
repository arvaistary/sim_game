import { ROUTE_MAP } from '@/constants/navigation'
import { createLocalStorageSaveRepository } from '@/infrastructure/persistence/LocalStorageSaveRepository'

const saveRepository = createLocalStorageSaveRepository()

export default defineNuxtRouteMiddleware((to) => {
  if (!to.path.startsWith('/game')) {
    return
  }

  const playerStore = usePlayerStore()
  const timeStore = useTimeStore()
  const statsStore = useStatsStore()
  const walletStore = useWalletStore()
  const skillsStore = useSkillsStore()
  const careerStore = useCareerStore()
  const educationStore = useEducationStore()
  const housingStore = useHousingStore()
  const activityStore = useActivityStore()
  const gameStore = useGameStore()

  const { $autoSave } = useNuxtApp()

  if (!playerStore.isInitialized) {
    const savedData = saveRepository.load()
    if (savedData) {
      gameStore.load(savedData)
    } else {
      playerStore.initialize()
    }
    // Включаем автосохранение после первой инициализации
    $autoSave.enable()
  }

  const { isTabVisible } = useAgeRestrictions()

  const routeEntry = Object.entries(ROUTE_MAP).find(([_, path]) => path === to.path)

  if (routeEntry) {
    const [tabId] = routeEntry
    if (!isTabVisible(tabId)) {
      return navigateTo('/game')
    }
  }
})