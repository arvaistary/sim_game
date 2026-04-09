import { SHOP_ACTIONS } from './shop-actions.js';
import { FUN_ACTIONS } from './fun-actions.js';
import { HOME_ACTIONS } from './home-actions.js';
import { SOCIAL_ACTIONS } from './social-actions.js';
import { EDUCATION_ACTIONS } from './education-actions.js';
import { FINANCE_ACTIONS } from './finance-actions.js';
import { CAREER_ACTIONS } from './career-actions.js';
import { HOBBY_ACTIONS } from './hobby-actions.js';
import { HEALTH_ACTIONS } from './health-actions.js';
import { SELFDEV_ACTIONS } from './selfdev-actions.js';

export const ACTION_CATEGORIES = [
  { id: 'shop', label: 'Магазин', icon: '🛒' },
  { id: 'fun', label: 'Отдых', icon: '🎮' },
  { id: 'home', label: 'Дом', icon: '🏠' },
  { id: 'social', label: 'Социальное', icon: '👥' },
  { id: 'education', label: 'Образование', icon: '📚' },
  { id: 'finance', label: 'Финансы', icon: '💰' },
  { id: 'career', label: 'Карьера', icon: '💼' },
  { id: 'hobby', label: 'Хобби', icon: '🎨' },
  { id: 'health', label: 'Здоровье', icon: '🏥' },
  { id: 'selfdev', label: 'Саморазвитие', icon: '🧠' },
];

const ALL_ACTIONS_MAP = new Map();

function registerActions(actions) {
  for (const action of actions) {
    if (ALL_ACTIONS_MAP.has(action.id)) {
      console.warn(`[Actions] Duplicate action id: ${action.id}`);
    }
    ALL_ACTIONS_MAP.set(action.id, action);
  }
}

registerActions(SHOP_ACTIONS);
registerActions(FUN_ACTIONS);
registerActions(HOME_ACTIONS);
registerActions(SOCIAL_ACTIONS);
registerActions(EDUCATION_ACTIONS);
registerActions(FINANCE_ACTIONS);
registerActions(CAREER_ACTIONS);
registerActions(HOBBY_ACTIONS);
registerActions(HEALTH_ACTIONS);
registerActions(SELFDEV_ACTIONS);

export function getActionById(id) {
  return ALL_ACTIONS_MAP.get(id) ?? null;
}

export function getActionsByCategory(categoryId) {
  const result = [];
  for (const [, action] of ALL_ACTIONS_MAP) {
    if (action.category === categoryId) {
      result.push(action);
    }
  }
  return result;
}

export function getAllActions() {
  return Array.from(ALL_ACTIONS_MAP.values());
}

export function getActionsCount() {
  return ALL_ACTIONS_MAP.size;
}
