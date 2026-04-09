/**
 * Единая точка данных баланса: экономика, работы, жильё, навыки, образование, демо-сейв ECS.
 * Legacy merge новой игры и функции сохранения — в `game-state.js`.
 */
export { DEFAULT_SAVE, defaultSaveData } from './default-save.js';
export { INITIAL_SAVE } from './initial-save.js';
export { CAREER_JOBS } from './career-jobs.js';
export { HOUSING_LEVELS } from './housing-levels.js';
export { BASIC_SKILLS, PROFESSIONAL_SKILLS, SKILLS_TABS } from './skills-constants.js';
export { EDUCATION_PROGRAMS } from './education-programs.js';
export { EDUCATION_PATHS } from './education-paths.js';
export { RECOVERY_TABS } from './recovery-tabs.js';
export { WORK_RESULT_TIERS } from './work-result-tiers.js';
export { LEGACY_FINANCE_SCENE_ACTIONS } from './legacy-finance-scene-actions.js';
export {
  LEGACY_WORK_PERIOD_RANDOM_EVENT_CHANCE,
  LEGACY_BASE_STAT_CHANGES_PER_WORK_DAY,
} from './work-economy.js';
export {
  EDUCATION_LEVEL_TO_RANK,
  EDUCATION_RANK_TO_LABEL,
  getEducationRank,
  getEducationLabelByRank,
} from './education-ranks.js';
export * from './game-events.js';
export { MONTHLY_EXPENSES_DEFAULT } from './monthly-expenses-defaults.js';
export * from './actions/index.js';
export * from './hourly-rates.js';
