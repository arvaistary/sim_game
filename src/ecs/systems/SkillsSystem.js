import { SKILLS_COMPONENT, SKILL_MODIFIERS_COMPONENT, PLAYER_ENTITY } from '../components/index.js';
import { recalculateSkillModifiers, createBaseSkillModifiers } from '../../balance/skill-modifiers.js';

export class SkillsSystem {
  init(world) {
    this.world = world;
    this._ensureModifiersComponent();
    this.recalculateModifiers();
  }

  _ensureModifiersComponent() {
    const playerId = PLAYER_ENTITY;
    let modifiers = this.world.getComponent(playerId, SKILL_MODIFIERS_COMPONENT);
    if (!modifiers) {
      modifiers = createBaseSkillModifiers();
      this.world.addComponent(playerId, SKILL_MODIFIERS_COMPONENT, modifiers);
    }
  }

  applySkillChanges(skillChanges = {}, reason = 'unknown') {
    const playerId = PLAYER_ENTITY;
    const skills = this.world.getComponent(playerId, SKILLS_COMPONENT);
    if (!skills) return;

    const validChanges = {};
    for (const [key, value] of Object.entries(skillChanges)) {
      const oldValue = skills[key] ?? 0;
      const newValue = this._clamp(oldValue + value, 0, 10);
      if (newValue !== oldValue) {
        skills[key] = newValue;
        validChanges[key] = { from: oldValue, to: newValue, delta: value };
      }
    }

    if (Object.keys(validChanges).length > 0) {
      this.recalculateModifiers();
      return { changed: true, reason, changes: validChanges };
    }

    return { changed: false, reason, changes: {} };
  }

  setSkillLevel(skillKey, level, reason = 'unknown') {
    const playerId = PLAYER_ENTITY;
    const skills = this.world.getComponent(playerId, SKILLS_COMPONENT);
    if (!skills) return;

    const clampedLevel = this._clamp(level, 0, 10);
    const oldLevel = skills[skillKey] ?? 0;
    skills[skillKey] = clampedLevel;

    if (clampedLevel !== oldLevel) {
      this.recalculateModifiers();
    }
  }

  recalculateModifiers() {
    const playerId = PLAYER_ENTITY;
    const skills = this.world.getComponent(playerId, SKILLS_COMPONENT);
    let modifiers = this.world.getComponent(playerId, SKILL_MODIFIERS_COMPONENT);

    if (!modifiers) {
      modifiers = createBaseSkillModifiers();
      this.world.addComponent(playerId, SKILL_MODIFIERS_COMPONENT, modifiers);
    }

    const newModifiers = recalculateSkillModifiers(skills || {});

    for (const key of Object.keys(newModifiers)) {
      modifiers[key] = newModifiers[key];
    }
  }

  getModifiers() {
    const playerId = PLAYER_ENTITY;
    return this.world.getComponent(playerId, SKILL_MODIFIERS_COMPONENT) || createBaseSkillModifiers();
  }

  getSkills() {
    const playerId = PLAYER_ENTITY;
    return this.world.getComponent(playerId, SKILLS_COMPONENT);
  }

  hasSkillLevel(skillKey, requiredLevel) {
    const skills = this.getSkills();
    return (skills?.[skillKey] ?? 0) >= requiredLevel;
  }

  getSkillLevel(skillKey) {
    const skills = this.getSkills();
    return skills?.[skillKey] ?? 0;
  }

  _clamp(value, min = 0, max = 10) {
    return Math.max(min, Math.min(max, value));
  }
}
