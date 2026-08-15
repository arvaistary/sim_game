/** Идентификатор профиля длительности пролога. */
export type ProloguePaceProfileId = 'compact' | 'standard' | 'extended'

/** Статус машины состояний пролога. */
export type PrologueStatus =
  | 'early'
  | 'school'
  | 'school_exam'
  | 'fork'
  | 'postsec'
  | 'postsec_exam'
  | 'summary'
  | 'completed'

/** Треки после школы (обязательный fork). */
export type PrologueTrack = 'tech' | 'uni'

/** Мини-игра, которую можно встроить в ход пролога. */
export type PrologueMicrobeatMinigameId = 'match-pairs'

/** Каталог тегов Model A. */
export type PrologueTagId =
  | 'stem'
  | 'lingua'
  | 'social'
  | 'discipline'
  | 'body'
  | 'creative'
  | 'practical'
  | 'curiosity'

/** Стадия контентного пула. */
export type PrologueSceneStage = 'infant' | 'preschool' | 'school' | 'tech' | 'uni'

/** Бюджетная стадия (техникум и вуз делят один postsec-слот). */
export type PrologueBudgetStage = 'early' | 'school' | 'postsec'

/** Профиль длительности (числа — в конфиге, не в UI). */
export interface ProloguePaceProfile {
  id: ProloguePaceProfileId
  earlyVignettes: number
  schoolTerms: number
  postSecondaryTerms: number
  examQuestionCount: number
  microbeatChance: number
  allowMinigames: boolean
}

/** Очки тегов. */
export type PrologueTagPoints = Record<PrologueTagId, number>

/** Дельты тегов на выбор. */
export type PrologueTagDeltas = Partial<Record<PrologueTagId, number>>

/** Экземпляр сцены для UI. */
export interface PrologueSceneInstance {
  eventId: string
  stage: PrologueSceneStage
  title: string
  description: string
  yearLabel: string
  choices: PrologueSceneChoiceView[]
  isFixedBridge: boolean
}

/** Вариант выбора в сцене (presentation + mapping index). */
export interface PrologueSceneChoiceView {
  index: number
  label: string
  description: string
}

/** Короткое необязательное действие между сценами. */
export interface PrologueMicrobeat {
  id: string
  title: string
  description: string
  minigameId: PrologueMicrobeatMinigameId
  tagDeltas: PrologueTagDeltas
}

/** Снимок состояния runner. */
export interface PrologueState {
  status: PrologueStatus
  seed: number
  paceProfileId: ProloguePaceProfileId
  termIndex: number
  earlyDrawnCount: number
  tagPoints: PrologueTagPoints
  stageSpent: Record<PrologueBudgetStage, number>
  traits: string[]
  memories: string[]
  seenSceneIds: string[]
  track: PrologueTrack | null
  mSchool: number | null
  mPostsec: number | null
  pendingScene: PrologueSceneInstance | null
  pendingMicrobeat: PrologueMicrobeat | null
  playerName: string
  prologueCompleted: boolean
}

/** Результат конвертации тегов во взрослые навыки. */
export interface PrologueSkillConversionResult {
  skills: Record<string, number>
  traits: string[]
  memories: string[]
  mFinal: number
  fantasyLabel: string
}

/** Патч handoff во взрослый сейв. */
export interface PrologueHandoffPatch {
  startAge: number
  currentAge: number
  skills: Record<string, number>
  educationLevel: 'Среднее профессиональное' | 'Высшее'
  educationLevelKey: 'college' | 'bachelor'
  school: 'completed'
  institute: 'none' | 'completed'
  traits: string[]
  memories: string[]
  money: number
  prologueCompleted: true
  fantasyLabel: string
  mFinal: number
}

/** Вход applyChoice. */
export interface ApplyPrologueChoiceInput {
  tagPoints: PrologueTagPoints
  stageSpent: number
  stageBudget: number
  deltas: PrologueTagDeltas
  traits: string[]
  memories: string[]
  optionalTraitId?: string
  memoryId?: string
  maxTraits: number
}

/** Результат applyChoice. */
export interface ApplyPrologueChoiceResult {
  tagPoints: PrologueTagPoints
  stageSpent: number
  traits: string[]
  memories: string[]
}

/** Вход convertTagsToSkills. */
export interface ConvertTagsToSkillsInput {
  tags: PrologueTagPoints
  mFinal: number
  track: PrologueTrack
  candidateTraits: string[]
  memories: string[]
}

/** Вход computeExamMultiplier. */
export interface ComputeExamMultiplierInput {
  correct: number
  questionCount: number
}

/** Вход computeFinalMultiplier. */
export interface ComputeFinalMultiplierInput {
  mSchool: number
  mPostsec: number
}

/** Маппинг одного выбора сцены. */
export interface PrologueSceneChoiceMapping {
  tagDeltas: PrologueTagDeltas
  optionalTraitId?: string
  memoryId?: string
}

/** Запись пула сцен пролога. */
export interface PrologueScenePoolEntry {
  eventId: string
  stage: PrologueSceneStage
  weightType: 'everyday' | 'formative' | 'fateful'
  choices: PrologueSceneChoiceMapping[]
}


/** Вопрос экзамена пролога. */
export interface PrologueExamQuestion {
  id: string
  prompt: string
  options: [string, string, string]
  correctIndex: 0 | 1 | 2
}

/** Вход startPrologue. */
export interface StartPrologueInput {
  playerName: string
  seed?: number
  paceProfileId?: ProloguePaceProfileId
}

/** Банк экзамена. */
export type PrologueExamBankId = 'school' | 'tech' | 'uni'

/** Вход drawExamQuestions. */
export interface DrawExamQuestionsInput {
  bankId: PrologueExamBankId
  count: number
  seed: number
  salt: number
}

/** Seeded RNG. */
export interface SeededRng {
  next(): number
  nextInt(maxExclusive: number): number
}

/** Вход drawFromPool. */
export interface DrawFromPoolInput<T> {
  items: T[]
  rng: SeededRng
  excludeIds: string[]
  getId: (item: T) => string
}

/** Вход drawWeightedFromPool. */
export interface WeightedDrawInput<T> {
  items: T[]
  rng: SeededRng
  excludeIds: string[]
  getId: (item: T) => string
  getWeight: (item: T) => number
}
