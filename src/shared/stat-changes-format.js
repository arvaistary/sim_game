const STAT_LABELS_RU = {
  hunger: 'Голод',
  energy: 'Энергия',
  stress: 'Стресс',
  mood: 'Настроение',
  health: 'Здоровье',
  physical: 'Форма',
};

/** Порядок вывода шкал в сводках (остальные ключи — в конце по Object.entries). */
const STAT_KEY_ORDER = ['hunger', 'energy', 'stress', 'mood', 'health', 'physical'];

function formatStatLine(key, value) {
  const label = STAT_LABELS_RU[key] ?? key;
  return `${label} ${value > 0 ? '+' : ''}${value}`;
}

function collectStatParts(statChanges = {}) {
  const parts = [];
  const seen = new Set();
  for (const key of STAT_KEY_ORDER) {
    const value = statChanges[key];
    if (value === undefined || value === 0) continue;
    parts.push([key, value]);
    seen.add(key);
  }
  for (const [key, value] of Object.entries(statChanges)) {
    if (seen.has(key) || value === undefined || value === 0) continue;
    parts.push([key, value]);
  }
  return parts;
}

/**
 * Строка вида «Здоровье −1 • Стресс +2» для компактного UI в одну строку.
 */
export function summarizeStatChangesRu(statChanges = {}) {
  return collectStatParts(statChanges)
    .map(([key, value]) => formatStatLine(key, value))
    .join(' • ');
}

/**
 * Список строк с маркерами для модалок и многострочных подсказок.
 */
export function formatStatChangesBulletListRu(statChanges = {}) {
  return collectStatParts(statChanges)
    .map(([key, value]) => `• ${formatStatLine(key, value)}`)
    .join('\n');
}
