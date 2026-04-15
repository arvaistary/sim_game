/**
 * Примеры использования новой системы навыков
 * 
 * Все функции полностью обратно совместимы со старым кодом
 */

import {
  addSkillXp,
  applySkillDecay,
  getAgeLearningMultiplier,
  getLearningMethodMultiplier,
  calculateLevelFromXp,
  convertLegacyLevelToSkillState,
  createEmptySkillState,
  getLevelProgressPercent,
} from './skill-system'

// 1. Пример получения опыта на работе
const timestamp = 1234
const skillState = createEmptySkillState(timestamp)

// Персонаж 22 года, работает с навыком 8 часов
const newState = addSkillXp(
  skillState,
  15,       // базовый XP за 8 часов работы
  22,       // возраст персонажа
  'work',   // способ обучения - практика на работе
  timestamp
)

console.log('XP получено:', newState.xp)
console.log('Уровень:', newState.level)
console.log('Прогресс:', getLevelProgressPercent(newState.xp) + '%')

// 2. Пример расчёта деградации после 60 дней без использования
const afterDecay = applySkillDecay(newState, timestamp + 60)
console.log('XP после деградации:', afterDecay.xp)

// 3. Конвертация старого формата (только уровень) в новую систему
const legacyLevel = 5
const convertedState = convertLegacyLevelToSkillState(legacyLevel, timestamp)

// 4. Таблица множителей возрастов:
console.table({
  '0-7 лет': getAgeLearningMultiplier(5),
  '13-18 лет': getAgeLearningMultiplier(16),
  '26-35 лет': getAgeLearningMultiplier(30),
  '60+ лет': getAgeLearningMultiplier(65),
})

// 5. Таблица эффективности обучения:
console.table({
  'Работа': getLearningMethodMultiplier('work'),
  'Упражнения': getLearningMethodMultiplier('practice'),
  'Курсы': getLearningMethodMultiplier('courses'),
  'Книги': getLearningMethodMultiplier('books'),
  'Видео': getLearningMethodMultiplier('videos'),
})
