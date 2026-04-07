import { SKILLS_COMPONENT, PLAYER_ENTITY } from '../components/index.js';

/**
 * Система управления навыками
 * Применяет изменения к навыкам с clamp в пределах 0-10
 */
export class SkillsSystem {
  init(world) {
    this.world = world;
  }

  /**
   * Применить изменения навыков к игроку
   */
  applySkillChanges(skillChanges = {}) {
    const playerId = PLAYER_ENTITY;
    const skills = this.world.getComponent(playerId, SKILLS_COMPONENT);
    if (!skills) return;

    for (const [key, value] of Object.entries(skillChanges)) {
      skills[key] = this._clamp((skills[key] ?? 0) + value, 0, 10);
    }
  }

  /**
   * Получить текущие навыки
   */
  getSkills() {
    const playerId = PLAYER_ENTITY;
    return this.world.getComponent(playerId, SKILLS_COMPONENT);
  }

  /**
   * Проверить, соответствует ли навык требуемому уровню
   */
  hasSkillLevel(skillKey, requiredLevel) {
    const skills = this.getSkills();
    return (skills?.[skillKey] ?? 0) >= requiredLevel;
  }

  /**
   * Получить уровень навыка
   */
  getSkillLevel(skillKey) {
    const skills = this.getSkills();
    return skills?.[skillKey] ?? 0;
  }

  /**
   * Ограничить значение в пределах min-max
   */
  _clamp(value, min = 0, max = 10) {
    return Math.max(min, Math.min(max, value));
  }
}
