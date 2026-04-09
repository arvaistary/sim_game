/**
 * Единая точка данных баланса: экономика, работы, жильё, навыки, образование, демо-сейв ECS.
 * Слияние при загрузке сохранений и legacy DEFAULT_SAVE — в `game-state.js`.
 */
export { DEFAULT_SAVE, defaultSaveData } from './default-save.js';
export { CAREER_JOBS } from './career-jobs.js';
export { HOUSING_LEVELS } from './housing-levels.js';
export { BASIC_SKILLS, PROFESSIONAL_SKILLS, SKILLS_TABS } from './skills-constants.js';
export { EDUCATION_PROGRAMS } from './education-programs.js';
export { MONTHLY_EXPENSES_DEFAULT } from './monthly-expenses-defaults.js';
export * from './actions/index.js';
export * from './hourly-rates.js';
