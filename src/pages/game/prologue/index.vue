<template>
  <div class="prologue-page">
    <NewbornWelcomeScreen
      v-if="showWelcome"
      :player-name="playerStore.name"
      class="prologue-page__welcome"
      @start="onWelcomeStart"
    />

    <div
      v-show="!showWelcome"
      class="prologue-page__shell"
    >
      <header class="prologue-page__header">
        <h1 class="prologue-page__heading">
          Пролог жизни
        </h1>
        <PrologueProgress
          v-if="status"
          :status="status"
        />
        <PrologueTagChips
          v-if="tagPoints"
          :tag-points="tagPoints"
        />
      </header>

      <PrologueSceneCard
        v-if="pendingScene && isSceneStatus"
        :title="pendingScene.title"
        :description="pendingScene.description"
        :year-label="pendingScene.yearLabel"
        :choices="pendingScene.choices"
        @choose="onChoose"
      />

      <section
        v-else-if="pendingMicrobeat"
        class="prologue-page__microbeat"
        aria-live="polite"
      >
        <h2 class="prologue-page__microbeat-title">
          {{ pendingMicrobeat.title }}
        </h2>
        <p class="prologue-page__microbeat-description">
          {{ pendingMicrobeat.description }}
        </p>
        <MatchPairs
          @complete="onMicrobeatComplete"
        />
      </section>

      <PrologueForkSelect
        v-else-if="status === 'fork'"
        @select="onSelectTrack"
      />

      <QuizHost
        v-else-if="isExamStatus && examQuestions.length > 0"
        :title="examTitle"
        :questions="examQuestions"
        @complete="onExamComplete"
      />

      <PrologueSummary
        v-else-if="status === 'summary' && handoffPreview && tagPoints"
        :fantasy-label="handoffPreview.fantasyLabel"
        :education-label="handoffPreview.educationLevel"
        :tag-points="tagPoints"
        :traits="traits"
        @confirm="onConfirmHandoff"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import './index.scss'
import type { ComputedRef, Ref } from 'vue'
import NewbornWelcomeScreen from '@/components/game/NewbornWelcomeScreen/NewbornWelcomeScreen.vue'
import PrologueSceneCard from '@/components/game/prologue/PrologueSceneCard/PrologueSceneCard.vue'
import PrologueTagChips from '@/components/game/prologue/PrologueTagChips/PrologueTagChips.vue'
import PrologueForkSelect from '@/components/game/prologue/PrologueForkSelect/PrologueForkSelect.vue'
import PrologueProgress from '@/components/game/prologue/PrologueProgress/PrologueProgress.vue'
import PrologueSummary from '@/components/game/prologue/PrologueSummary/PrologueSummary.vue'
import QuizHost from '@/components/game/minigames/QuizHost/QuizHost.vue'
import MatchPairs from '@/components/game/minigames/MatchPairs/MatchPairs.vue'
import type { QuizHostCompletePayload } from '@/components/game/minigames/QuizHost/QuizHost.types'
import type { MinigameResult } from '@/domain/prologue/minigames/minigame.types'
import {
  drawExamQuestions,
  getPostsecExamBankId,
} from '@/domain/prologue'
import type {
  PrologueExamQuestion,
  PrologueHandoffPatch,
  PrologueMicrobeat,
  PrologueStatus,
  PrologueTrack,
} from '@/domain/prologue/prologue.types'
import { getProloguePaceProfile } from '@/domain/prologue/prologue-pace'
import { normalizeSkillLevels } from '@/domain/balance/skills'

definePageMeta({ middleware: ['game-init'] })

const playerStore = usePlayerStore()

const timeStore = useTimeStore()

const skillsStore = useSkillsStore()

const educationStore = useEducationStore()

const walletStore = useWalletStore()

const prologueStore = usePrologueStore()

const showWelcome: Ref<boolean> = ref(false)
const examSessionStatus: Ref<PrologueStatus | null> = ref(null)
const examQuestions: Ref<PrologueExamQuestion[]> = ref<PrologueExamQuestion[]>([])

const status = computed(() => prologueStore.status)
const pendingScene = computed(() => prologueStore.pendingScene)
const pendingMicrobeat: ComputedRef<PrologueMicrobeat | null> = computed(() => prologueStore.pendingMicrobeat)
const tagPoints = computed(() => prologueStore.tagPoints)
const traits = computed(() => prologueStore.traits)
const isSceneStatus: ComputedRef<boolean> = computed(() => {
  const current: PrologueStatus | null = status.value

  return current === 'early' || current === 'school' || current === 'postsec'
})

const isExamStatus: ComputedRef<boolean> = computed(() => {
  return status.value === 'school_exam' || status.value === 'postsec_exam'
})

const examTitle: ComputedRef<string> = computed(() => {

  if (status.value === 'school_exam') return 'Выпускной экзамен школы'

  return 'Итоговый экзамен'
})

const handoffPreview: ComputedRef<PrologueHandoffPatch | null> = computed(() => {

  if (status.value !== 'summary' || !prologueStore.state) return null

  try {
    return prologueStore.buildHandoff()
  } catch {
    return null
  }
})

watch(status, (nextStatus: PrologueStatus | null) => {
  if (nextStatus !== 'school_exam' && nextStatus !== 'postsec_exam') {
    examQuestions.value = []
    examSessionStatus.value = null
    return
  }

  if (!prologueStore.state) return

  if (examSessionStatus.value === nextStatus && examQuestions.value.length > 0) return

  const pace = getProloguePaceProfile(prologueStore.state.paceProfileId)
  const bankId = nextStatus === 'school_exam'
    ? 'school'
    : getPostsecExamBankId(prologueStore.state.track ?? 'tech')

  examQuestions.value = drawExamQuestions({
    bankId,
    count: pace.examQuestionCount,
    seed: prologueStore.state.seed,
    salt: nextStatus === 'school_exam' ? 11 : 29,
  })
  examSessionStatus.value = nextStatus
}, { immediate: true })

onMounted(() => {
  if (!prologueStore.isActive) {
    return
  }

  prologueStore.resume()

  const isFreshEarly: boolean = prologueStore.state?.status === 'early'
    && (prologueStore.state?.earlyDrawnCount ?? 0) === 0
    && (prologueStore.state?.seenSceneIds.length ?? 0) === 0

  showWelcome.value = isFreshEarly && playerStore.welcomeScreenShown
})

function onWelcomeStart(): void {
  showWelcome.value = false
  playerStore.hideWelcomeScreen()
}

function onChoose(choiceIndex: number): void {
  prologueStore.choose(choiceIndex)
}

function onMicrobeatComplete(result: MinigameResult): void {
  prologueStore.finishMicrobeat(result)
}

function onSelectTrack(track: PrologueTrack): void {
  prologueStore.selectTrack(track)
}

function onExamComplete(payload: QuizHostCompletePayload): void {
  prologueStore.submitExam(payload.correctCount)
}

async function onConfirmHandoff(): Promise<void> {
  const { $autoSave } = useNuxtApp()

  const patch: PrologueHandoffPatch = prologueStore.buildHandoff()

  timeStore.setStartAge(patch.startAge)
  timeStore.setTotalHours(0)

  skillsStore.reset()
  skillsStore.load({ skills: normalizeSkillLevels(patch.skills) })

  educationStore.setEducationLevel(patch.educationLevelKey)
  educationStore.setSchool(patch.school)
  educationStore.setInstitute(patch.institute)

  walletStore.setMoney(patch.money)
  playerStore.setLifeBackground({
    traits: patch.traits,
    memories: patch.memories,
  })

  prologueStore.markCompleted()
  playerStore.hideWelcomeScreen()

  $autoSave.enable()
  $autoSave.flush()

  await navigateTo('/game')
}
</script>
