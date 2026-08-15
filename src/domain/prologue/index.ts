export type {
  ProloguePaceProfileId,
  ProloguePaceProfile,
  PrologueStatus,
  PrologueTrack,
  PrologueTagId,
  PrologueState,
  PrologueHandoffPatch,
  PrologueExamQuestion,
  PrologueSceneInstance,
  StartPrologueInput,
} from './prologue.types'

export { DEFAULT_PROLOGUE_PACE_ID, getProloguePaceProfile, PROLOGUE_PACE_PROFILES } from './prologue-pace'
export {
  applyPrologueChoice,
  computeExamMultiplier,
  computeFinalMultiplier,
  convertTagsToSkills,
  getStageTagBudget,
} from './prologue-budget'
export {
  startPrologue,
  choosePrologueOption,
  selectPrologueTrack,
  submitPrologueExam,
  completePrologue,
  resumePrologue,
} from './prologue-runner'
export { buildPrologueHandoffPatch } from './handoff'
export { drawExamQuestions, getPostsecExamBankId } from './exam-bank'
export { getMinigame } from './minigames/registry'
