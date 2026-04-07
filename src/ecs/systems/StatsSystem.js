import { STATS_COMPONENT, PLAYER_ENTITY } from '../components/index.js';

/**
 * Система управления статистикой
 * Применяет изменения к статам с clamp в пределах 0-100
 */
export class StatsSystem {
  constructor() {
    this.statDefs = [
      { key: 'hunger', label: 'Голод', startColor: '#FF9F6B', endColor: '#FF6B6B' },
      { key: 'energy', label: 'Энергия', startColor: '#6D9DC5', endColor: '#4A7C9E' },
      { key: 'stress', label: 'Стресс', startColor: '#E87D7D', endColor: '#D14D4D' },
      { key: 'mood', label: 'Настроение', startColor: '#F4D95F', endColor: '#E8B94A' },
      { key: 'health', label: 'Здоровье', startColor: '#7ED9A0', endColor: '#4EBF7A' },
      { key: 'physical', label: 'Форма', startColor: '#A8CABA', endColor: '#6FAE91' },
    ];
  }

  init(world) {
    this.world = world;
  }

  /**
   * Применить изменения статистики к игроку
   */
  applyStatChanges(statChanges = {}) {
    const playerId = PLAYER_ENTITY;
    const stats = this.world.getComponent(playerId, STATS_COMPONENT);
    if (!stats) return;

    for (const [key, value] of Object.entries(statChanges)) {
      stats[key] = this._clamp((stats[key] ?? 0) + value);
    }
  }

  /**
   * Получить текущую статистику
   */
  getStats() {
    const playerId = PLAYER_ENTITY;
    return this.world.getComponent(playerId, STATS_COMPONENT);
  }

  /**
   * Создать строку с описанием изменений
   */
  summarizeStatChanges(statChanges = {}) {
    return this.statDefs
      .filter(([key]) => statChanges?.[key])
      .map(([key, label]) => `${label} ${statChanges[key] > 0 ? '+' : ''}${statChanges[key]}`)
      .join(' • ');
  }

  /**
   * Объединить несколько наборов изменений
   */
  mergeStatChanges(...chunks) {
    return chunks.reduce((accumulator, chunk) => {
      Object.entries(chunk ?? {}).forEach(([key, value]) => {
        accumulator[key] = (accumulator[key] ?? 0) + value;
      });
      return accumulator;
    }, {});
  }

  /**
   * Ограничить значение в пределах min-max
   */
  _clamp(value, min = 0, max = 100) {
    return Math.max(min, Math.min(max, value));
  }
}
