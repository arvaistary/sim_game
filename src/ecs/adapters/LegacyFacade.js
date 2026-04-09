/**
 * LegacyFacade - минимальный фасад для совместимости с legacy кодом
 * Делегирует все вызовы к ECS системам через PersistenceSystem
 * 
 * Это временный слой для плавной миграции.
 * Старый код может продолжать использовать эти функции, 
 * но они теперь используют ECS под капотом.
 */

import { PersistenceSystem } from '../systems/PersistenceSystem.js';
import { SceneAdapter } from './SceneAdapter.js';
import { validateRecoveryAction as legacyValidateRecoveryAction } from '../../game-state.js';

let persistenceSystem = null;

/**
 * Инициализация персистентной системы
 */
function initPersistence() {
  if (!persistenceSystem) {
    persistenceSystem = new PersistenceSystem();
  }
}

/**
 * Загрузка сохранения (совместимо с legacy)
 * @returns {Object} Данные сохранения
 */
export function loadSave() {
  initPersistence();
  return persistenceSystem.load();
}

/**
 * Сохранение данных (совместимо с legacy)
 * @param {Object} scene - Сцена Phaser для обновления registry
 * @param {Object} saveData - Данные сохранения
 */
export function persistSave(scene, saveData) {
  initPersistence();
  
  // Обновляем registry сцены если она передана
  if (scene) {
    scene.saveData = saveData;
    scene.registry.set('saveData', saveData);
  }
  
  persistenceSystem.save(saveData);
}

/**
 * Валидация действия восстановления
 * Делегирует legacy функцию для совместимости
 * TODO: Перенести логику в RecoverySystem
 */
export function validateRecoveryAction(saveData, cardData) {
  return legacyValidateRecoveryAction(saveData, cardData);
}

/**
 * Экспорт всех других legacy функций для совместимости
 * Эти функции будут постепенно заменены на ECS версии
 */

// Временные экспорты для обратной совместимости
// TODO: Удалить после полной миграции всех сцен
export { RECOVERY_TABS } from '../../balance/recovery-tabs.js';
export { formatMoney, parseSchedule } from '../../game-state.js';

// TODO: Эти функции должны быть заменены на ECS версии
// Они оставлены для временной совместимости
export const LEGACY_DEPRECATION_WARNING = 'Использование legacy функций. Рекомендуется мигрировать на ECS системы.';

/**
 * Получение адаптера сцены из реестра
 * @param {Object} scene - Сцена Phaser
 * @returns {SceneAdapter|null}
 */
export function getSceneAdapter(scene) {
  if (!scene || !scene.sceneAdapter) {
    console.warn('Scene adapter not found. Make sure scene is properly initialized with ECS.');
    return null;
  }
  return scene.sceneAdapter;
}

/**
 * Применение действия восстановления через ECS
 * @param {Object} scene - Сцена Phaser
 * @param {string} type - Тип восстановления (energy, stress, mood, health)
 * @param {string} action - Действие (energy_drink, rest, entertainment, shopping, etc.)
 * @returns {Object} Результат действия
 */
export function applyRecoveryAction(scene, type, action) {
  const adapter = getSceneAdapter(scene);
  if (!adapter) {
    console.error('Cannot apply recovery action: scene adapter not found');
    return { success: false };
  }
  
  const recoverySystem = adapter.getSystem('recovery');
  const playerId = adapter.getPlayerEntityId();
  
  return recoverySystem.recover(playerId, type, action);
}

/**
 * Применение рабочего периода через ECS
 * @param {Object} scene - Сцена Phaser
 * @param {number} workDays - Количество рабочих дней
 * @returns {string} Сводка результатов
 */
export function applyWorkPeriod(scene, workDays) {
  const adapter = getSceneAdapter(scene);
  if (!adapter) {
    console.error('Cannot apply work period: scene adapter not found');
    return '';
  }
  
  const workPeriodSystem = adapter.getSystem('workPeriod');
  const playerId = adapter.getPlayerEntityId();
  
  const summary = workPeriodSystem.applyWorkPeriodResult(workDays);
  
  // Синхронизируем с saveData для совместимости
  adapter.syncToSaveData();
  
  return summary;
}

/**
 * Применение выбора события через ECS
 * @param {Object} scene - Сцена Phaser
 * @param {string} eventId - ID события
 * @param {string} choiceId - ID выбора
 * @returns {Object} Результат выбора
 */
export function applyEventChoice(scene, eventId, choiceId) {
  const adapter = getSceneAdapter(scene);
  if (!adapter) {
    console.error('Cannot apply event choice: scene adapter not found');
    return { success: false };
  }
  
  const eventQueueSystem = adapter.getSystem('eventQueue');
  const playerId = adapter.getPlayerEntityId();
  
  return eventQueueSystem.applyEventChoice(playerId, eventId, choiceId);
}

/**
 * Получение компонентов сущности через ECS
 * @param {Object} scene - Сцена Phaser
 * @param {string} componentKey - Ключ компонента
 * @returns {Object|null} Данные компонента
 */
export function getComponent(scene, componentKey) {
  const adapter = getSceneAdapter(scene);
  if (!adapter) return null;
  
  const world = adapter.getWorld();
  const playerId = adapter.getPlayerEntityId();
  
  return world.getComponent(playerId, componentKey);
}

/**
 * Получение всех статистических данных
 * @param {Object} scene - Сцена Phaser
 * @returns {Object} Объект статов
 */
export function getStats(scene) {
  return getComponent(scene, 'stats') || {};
}

/**
 * Получение финансовых данных
 * @param {Object} scene - Сцена Phaser
 * @returns {Object} Финансовые данные
 */
export function getFinance(scene) {
  return getComponent(scene, 'finance') || {};
}

/**
 * Получение данных карьеры
 * @param {Object} scene - Сцена Phaser
 * @returns {Object} Данные карьеры
 */
export function getCareer(scene) {
  return getComponent(scene, 'career') || {};
}

/**
 * Применение изменений статов через ECS
 * @param {Object} scene - Сцена Phaser
 * @param {Object} changes - Изменения статов
 */
export function applyStatChanges(scene, changes) {
  const adapter = getSceneAdapter(scene);
  if (!adapter) return;
  
  const statsSystem = adapter.getSystem('stats');
  const playerId = adapter.getPlayerEntityId();
  
  statsSystem.applyStatChanges(playerId, changes);
  
  // Синхронизируем для совместимости
  adapter.syncToSaveData();
}
