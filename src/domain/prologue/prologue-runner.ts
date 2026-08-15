import { PROLOGUE_ANTI_IMBA_CAPS } from '@/domain/balance/constants/prologue/anti-imba-caps'
import { createEmptyTagPoints } from '@/domain/balance/constants/prologue/tag-catalog'
import { getScenePoolEntriesForStage } from '@/domain/balance/constants/prologue/scene-pool-config'
import { PROLOGUE_MICROBEATS } from '@/domain/balance/constants/prologue/prologue-microbeats'
import { getChildhoodEventById } from '@/domain/balance/constants/childhood-events'
import type { ChildhoodEventDef } from '@/domain/balance/types/childhood-event'
import {
  applyPrologueChoice,
  computeExamMultiplier,
  getStageTagBudget,
} from './prologue-budget'
import { DEFAULT_PROLOGUE_PACE_ID, getProloguePaceProfile } from './prologue-pace'
import type {
  ApplyPrologueChoiceResult,
  PrologueBudgetStage,
  PrologueMicrobeat,
  ProloguePaceProfile,
  PrologueSceneChoiceMapping,
  PrologueSceneInstance,
  PrologueScenePoolEntry,
  PrologueSceneStage,
  PrologueState,
  PrologueStatus,
  PrologueTrack,
  StartPrologueInput,
  SeededRng,
} from './prologue.types'
import type { MinigameResult } from './minigames/minigame.types'
import { createSeededRng, drawWeightedFromPool } from './scene-pool'

const WEIGHT_BY_TYPE: Record<PrologueScenePoolEntry['weightType'], number> = {
  everyday: 70,
  formative: 25,
  fateful: 5,
}

const FIXED_BRIDGE_EVENT_ID: string = 'prologue_school_bridge'

/**
 * @description [Prologue] - Стартовое состояние runner.
 * @return { PrologueState } начальный снимок
 */
export function startPrologue(data: StartPrologueInput): PrologueState {
  const seed: number = data.seed ?? (Date.now() >>> 0)
  const state: PrologueState = {
    status: 'early',
    seed,
    paceProfileId: data.paceProfileId ?? DEFAULT_PROLOGUE_PACE_ID,
    termIndex: 0,
    earlyDrawnCount: 0,
    tagPoints: createEmptyTagPoints(),
    stageSpent: { early: 0, school: 0, postsec: 0 },
    traits: [],
    memories: [],
    seenSceneIds: [],
    track: null,
    mSchool: null,
    mPostsec: null,
    pendingScene: null,
    pendingMicrobeat: null,
    playerName: data.playerName.trim(),
    prologueCompleted: false,
  }

  return ensurePendingScene(state)
}

/**
 * @description [Prologue] - Выбор в текущей сцене.
 * @return { PrologueState } новый снимок
 */
export function choosePrologueOption(state: PrologueState, choiceIndex: number): PrologueState {
  if (!state.pendingScene) return state

  const scene: PrologueSceneInstance = state.pendingScene

  if (!Number.isInteger(choiceIndex) || choiceIndex < 0 || choiceIndex >= scene.choices.length) return state

  const mapping: PrologueSceneChoiceMapping | undefined = resolveChoiceMapping(scene, choiceIndex)
  const budgetStage: PrologueBudgetStage = statusToBudgetStage(state.status)
  const applied: ApplyPrologueChoiceResult = applyPrologueChoice({
    tagPoints: state.tagPoints,
    stageSpent: state.stageSpent[budgetStage],
    stageBudget: getStageTagBudget(budgetStage),
    deltas: mapping?.tagDeltas ?? {},
    traits: state.traits,
    memories: state.memories,
    optionalTraitId: mapping?.optionalTraitId,
    memoryId: mapping?.memoryId,
    maxTraits: PROLOGUE_ANTI_IMBA_CAPS.maxTraitsGranted,
  })

  const next: PrologueState = {
    ...state,
    tagPoints: applied.tagPoints,
    traits: applied.traits,
    memories: applied.memories,
    stageSpent: {
      ...state.stageSpent,
      [budgetStage]: applied.stageSpent,
    },
    seenSceneIds: scene.isFixedBridge
      ? state.seenSceneIds
      : [...state.seenSceneIds, scene.eventId],
    pendingScene: null,
  }

  return advanceAfterScene(next, scene)
}

/**
 * @description [Prologue] - Завершает необязательный microbeat и двигает ход дальше.
 * @return { PrologueState } следующий снимок
 */
export function completePrologueMicrobeat(
  state: PrologueState,
  result: MinigameResult,
): PrologueState {
  const microbeat: PrologueMicrobeat | null = state.pendingMicrobeat

  if (!microbeat || microbeat.minigameId !== result.minigameId) return state

  const isSuccessful: boolean = result.successTier !== 'fail'
  const budgetStage: PrologueBudgetStage = statusToBudgetStage(state.status)
  const applied: ApplyPrologueChoiceResult = applyPrologueChoice({
    tagPoints: state.tagPoints,
    stageSpent: state.stageSpent[budgetStage],
    stageBudget: getStageTagBudget(budgetStage),
    deltas: isSuccessful ? microbeat.tagDeltas : {},
    traits: state.traits,
    memories: state.memories,
    maxTraits: PROLOGUE_ANTI_IMBA_CAPS.maxTraitsGranted,
  })
  const next: PrologueState = {
    ...state,
    tagPoints: applied.tagPoints,
    stageSpent: {
      ...state.stageSpent,
      [budgetStage]: applied.stageSpent,
    },
    pendingMicrobeat: null,
  }

  return advanceAfterTerm(next)
}

/**
 * @description [Prologue] - Обязательный fork после школы.
 * @return { PrologueState } состояние postsec
 */
export function selectPrologueTrack(state: PrologueState, track: PrologueTrack): PrologueState {
  if (state.status !== 'fork') return state

  const next: PrologueState = {
    ...state,
    track,
    status: 'postsec',
    termIndex: 0,
    pendingScene: null,
  }

  return ensurePendingScene(next)
}

/**
 * @description [Prologue] - Завершение экзамена → m_stage (без выдачи навыков).
 * @return { PrologueState } следующий статус
 */
export function submitPrologueExam(state: PrologueState, correctCount: number): PrologueState {
  const pace: ProloguePaceProfile = getProloguePaceProfile(state.paceProfileId)
  const multiplier: number = computeExamMultiplier({
    correct: correctCount,
    questionCount: pace.examQuestionCount,
  })

  if (state.status === 'school_exam') {
    return {
      ...state,
      mSchool: multiplier,
      status: 'fork',
      pendingScene: null,
    }
  }

  if (state.status === 'postsec_exam') {
    return {
      ...state,
      mPostsec: multiplier,
      status: 'summary',
      pendingScene: null,
    }
  }

  return state
}

/**
 * @description [Prologue] - Помечает пролог завершённым (после handoff UI).
 * @return { PrologueState } completed
 */
export function completePrologue(state: PrologueState): PrologueState {
  if (state.status !== 'summary' && state.status !== 'completed') return state

  return {
    ...state,
    status: 'completed',
    prologueCompleted: true,
    pendingScene: null,
    pendingMicrobeat: null,
  }
}

/**
 * @description [Prologue] - Восстанавливает pending scene при resume.
 * @return { PrologueState } снимок с pendingScene
 */
export function resumePrologue(state: PrologueState): PrologueState {
  if (state.pendingScene) return state

  if (state.pendingMicrobeat) return state

  if (state.status === 'school_exam' || state.status === 'postsec_exam' || state.status === 'fork' || state.status === 'summary' || state.status === 'completed') {
    return state
  }

  return ensurePendingScene(state)
}

function advanceAfterScene(state: PrologueState, scene: PrologueSceneInstance): PrologueState {
  const pace: ProloguePaceProfile = getProloguePaceProfile(state.paceProfileId)

  if (state.status === 'early') {
    if (scene.isFixedBridge) {
      return ensurePendingScene({
        ...state,
        status: 'school',
        termIndex: 0,
      })
    }

    const earlyDrawnCount: number = state.earlyDrawnCount + 1
    const withCount: PrologueState = { ...state, earlyDrawnCount }

    if (earlyDrawnCount >= pace.earlyVignettes) {
      return ensurePendingScene({
        ...withCount,
        pendingScene: buildFixedBridgeScene(),
      })
    }

    return ensurePendingScene(withCount)
  }

  if (state.status === 'school') {
    return offerMicrobeatOrAdvance(state, pace)
  }

  if (state.status === 'postsec') {
    return offerMicrobeatOrAdvance(state, pace)
  }

  return state
}

function offerMicrobeatOrAdvance(state: PrologueState, pace: ProloguePaceProfile): PrologueState {
  const microbeat: PrologueMicrobeat | null = drawMicrobeat(state, pace)

  if (microbeat) {
    return {
      ...state,
      pendingMicrobeat: microbeat,
      pendingScene: null,
    }
  }

  return advanceAfterTerm(state)
}

function advanceAfterTerm(state: PrologueState): PrologueState {
  if (state.status === 'school') {
    const nextTerm: number = state.termIndex + 1
    const pace: ProloguePaceProfile = getProloguePaceProfile(state.paceProfileId)

    if (nextTerm >= pace.schoolTerms) {
      return {
        ...state,
        termIndex: nextTerm,
        status: 'school_exam',
        pendingScene: null,
      }
    }

    return ensurePendingScene({ ...state, termIndex: nextTerm })
  }

  if (state.status === 'postsec') {
    const nextTerm: number = state.termIndex + 1
    const pace: ProloguePaceProfile = getProloguePaceProfile(state.paceProfileId)

    if (nextTerm >= pace.postSecondaryTerms) {
      return {
        ...state,
        termIndex: nextTerm,
        status: 'postsec_exam',
        pendingScene: null,
      }
    }

    return ensurePendingScene({ ...state, termIndex: nextTerm })
  }

  return state
}

function drawMicrobeat(state: PrologueState, pace: ProloguePaceProfile): PrologueMicrobeat | null {
  if (!pace.allowMinigames || pace.microbeatChance <= 0) return null

  const salt: number = state.status === 'school' ? 503 : 907
  const rng: SeededRng = createSeededRng((state.seed + state.termIndex * 173 + salt) >>> 0)

  if (rng.next() >= pace.microbeatChance) return null

  const index: number = (state.termIndex + (state.status === 'school' ? 0 : 1)) % PROLOGUE_MICROBEATS.length
  return PROLOGUE_MICROBEATS[index] ?? null
}

function ensurePendingScene(state: PrologueState): PrologueState {
  if (state.pendingScene) return state

  if (state.pendingMicrobeat) return state

  if (state.status === 'school_exam' || state.status === 'postsec_exam' || state.status === 'fork' || state.status === 'summary' || state.status === 'completed') {
    return state
  }

  const scene: PrologueSceneInstance | null = drawSceneForStatus(state)
  return {
    ...state,
    pendingScene: scene,
  }
}

function drawSceneForStatus(state: PrologueState): PrologueSceneInstance | null {
  const stage: PrologueSceneStage | null = resolveDrawStage(state)

  if (!stage) return null

  const pool: PrologueScenePoolEntry[] = getScenePoolEntriesForStage(stage)
  const rng: SeededRng = createSeededRng((state.seed + state.seenSceneIds.length * 997 + state.termIndex * 131) >>> 0)
  const entry: PrologueScenePoolEntry | null = drawWeightedFromPool({
    items: pool,
    rng,
    excludeIds: state.seenSceneIds,
    getId: (item: PrologueScenePoolEntry) => item.eventId,
    getWeight: (item: PrologueScenePoolEntry) => WEIGHT_BY_TYPE[item.weightType],
  })

  if (!entry) return null

  return buildSceneInstance(entry, state)
}

function resolveDrawStage(state: PrologueState): PrologueSceneStage | null {
  if (state.status === 'early') {
    if (state.earlyDrawnCount === 0) return 'infant'

    return 'preschool'
  }

  if (state.status === 'school') return 'school'

  if (state.status === 'postsec') {
    if (state.track === 'tech') return 'tech'

    if (state.track === 'uni') return 'uni'
  }

  return null
}

function buildSceneInstance(entry: PrologueScenePoolEntry, state: PrologueState): PrologueSceneInstance | null {
  const event: ChildhoodEventDef | undefined = getChildhoodEventById(entry.eventId)

  if (!event) return null

  return {
    eventId: entry.eventId,
    stage: entry.stage,
    title: event.title,
    description: event.description,
    yearLabel: yearLabelFor(state),
    isFixedBridge: false,
    choices: event.choices.map((choice, index: number) => ({
      index,
      label: choice.label,
      description: choice.description,
    })),
  }
}

function buildFixedBridgeScene(): PrologueSceneInstance {
  return {
    eventId: FIXED_BRIDGE_EVENT_ID,
    stage: 'preschool',
    title: 'Ты идёшь в школу',
    description: 'Лето кончилось. Завтра первый класс. Как ты себя чувствуешь?',
    yearLabel: '7 лет',
    isFixedBridge: true,
    choices: [
      { index: 0, label: 'Нервничаю', description: 'Руки холодные, но ты всё равно пойдёшь.' },
      { index: 1, label: 'Взволнован', description: 'Хочется скорее увидеть класс и новую жизнь.' },
      { index: 2, label: 'Любопытно', description: 'Сколько всего можно узнать за партой?' },
    ],
  }
}

function resolveChoiceMapping(
  scene: PrologueSceneInstance,
  choiceIndex: number,
): PrologueSceneChoiceMapping | undefined {
  if (scene.isFixedBridge) {
    const bridgeTags: PrologueSceneChoiceMapping[] = [
      { tagDeltas: { discipline: 1 } },
      { tagDeltas: { social: 1 } },
      { tagDeltas: { curiosity: 1 } },
    ]

    return bridgeTags[choiceIndex]
  }

  const poolEntry: PrologueScenePoolEntry | undefined = getScenePoolEntriesForStage(scene.stage).find(
    (entry: PrologueScenePoolEntry) => entry.eventId === scene.eventId,
  )

  return poolEntry?.choices[choiceIndex]
}

function yearLabelFor(state: PrologueState): string {
  if (state.status === 'early') {
    if (state.earlyDrawnCount === 0) return '0 лет'

    if (state.earlyDrawnCount === 1) return '5 лет'

    return '6 лет'
  }

  if (state.status === 'school') {
    const grade: number = Math.min(11, 1 + state.termIndex * 2)
    return `${grade} класс`
  }

  if (state.status === 'postsec') {
    return `${state.termIndex + 1} курс`
  }

  return ''
}

function statusToBudgetStage(status: PrologueStatus): PrologueBudgetStage {
  if (status === 'early') return 'early'

  if (status === 'school' || status === 'school_exam') return 'school'

  return 'postsec'
}
