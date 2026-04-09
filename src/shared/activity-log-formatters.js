import { getActionById } from '../balance/actions/index.js';
import { getSkillByKey } from '../balance/skills-constants.js';

const ACTION_ID_PATTERN = /^[a-z0-9]+(?:_[a-z0-9]+)+$/i;

const ACTION_ID_ALIASES = {
  shop_full_lanch: 'shop_full_lunch',
};

const METRIC_LABELS = {
  hunger: 'Голод',
  energy: 'Энергия',
  stress: 'Стресс',
  mood: 'Настроение',
  health: 'Здоровье',
  physical: 'Физическая форма',
  memory: 'Память',
  concentration: 'Концентрация',
  creativity: 'Креативность',
  organization: 'Организация',
  professionalism: 'Профессионализм',
};

function normalizeActionId(actionId) {
  if (typeof actionId !== 'string' || actionId.length === 0) return null;
  const normalized = actionId.trim().toLowerCase();
  return ACTION_ID_ALIASES[normalized] || normalized;
}

function extractActionIdFromTitle(title) {
  if (typeof title !== 'string' || title.length === 0) return null;
  const trimmed = title.trim();

  if (ACTION_ID_PATTERN.test(trimmed)) {
    return normalizeActionId(trimmed);
  }

  const actionLogMatch = trimmed.match(/^📝\s+([a-z0-9]+(?:_[a-z0-9]+)+)$/i);
  if (actionLogMatch) {
    return normalizeActionId(actionLogMatch[1]);
  }

  return null;
}

function formatNumber(value, fractionDigits = 1) {
  const rounded = Number(value.toFixed(fractionDigits));
  return `${rounded}`;
}

function resolveMetricLabel(metricKey) {
  const key = String(metricKey || '').trim();
  if (!key) return '';
  if (METRIC_LABELS[key]) return METRIC_LABELS[key];

  const skill = getSkillByKey(key);
  if (skill?.label) return skill.label;

  return key;
}

function formatSignedValue(value, fractionDigits = 1) {
  const sign = value > 0 ? '+' : '';
  return `${sign}${formatNumber(value, fractionDigits)}`;
}

function buildActionEffectsFromMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') return '';

  const parts = [];
  const statChanges = metadata.statChanges;
  const skillChanges = metadata.skillChanges;
  const moneyDelta = metadata.moneyDelta;
  const hoursSpent = metadata.hoursSpent;

  if (statChanges && typeof statChanges === 'object') {
    for (const [key, value] of Object.entries(statChanges)) {
      if (typeof value !== 'number' || value === 0) continue;
      parts.push(`${resolveMetricLabel(key)}: ${formatSignedValue(value, 1)}`);
    }
  }

  if (skillChanges && typeof skillChanges === 'object') {
    for (const [key, value] of Object.entries(skillChanges)) {
      if (typeof value !== 'number' || value === 0) continue;
      parts.push(`${resolveMetricLabel(key)}: ${formatSignedValue(value, 1)}`);
    }
  }

  if (typeof moneyDelta === 'number' && moneyDelta !== 0) {
    parts.push(`Деньги: ${formatSignedValue(moneyDelta, 0)} ₽`);
  }

  if (typeof hoursSpent === 'number' && hoursSpent > 0) {
    parts.push(`Время: ${formatNumber(hoursSpent, 1)} ч`);
  }

  if (parts.length === 0) return '';
  return parts.map((line) => `• ${line}`).join('\n');
}

function translateRawEffectsText(rawText) {
  const raw = typeof rawText === 'string' ? rawText.trim() : '';
  if (!raw) return '';

  const chunks = raw.split(',').map((chunk) => chunk.trim()).filter(Boolean);
  if (chunks.length === 0) return raw;

  const translated = chunks.map((chunk) => {
    const match = chunk.match(/^([a-z0-9_]+)\s*:\s*([+-]?\d+(?:\.\d+)?)$/i);
    if (!match) return chunk;

    const key = match[1];
    const value = Number(match[2]);
    if (!Number.isFinite(value)) return chunk;

    return `${resolveMetricLabel(key)}: ${formatSignedValue(value, 1)}`;
  });

  return translated.map((line) => `• ${line}`).join('\n');
}

export function resolveActivityLogTitle(entry) {
  const rawTitle = entry?.title ? String(entry.title) : '';
  if (!rawTitle) return 'Без заголовка';

  const metadataActionId = normalizeActionId(entry?.metadata?.actionId);
  const extractedActionId = extractActionIdFromTitle(rawTitle);
  const actionId = metadataActionId || extractedActionId;

  if (!actionId) return rawTitle;

  const action = getActionById(actionId);
  if (!action?.title) return rawTitle;

  return rawTitle.startsWith('📝') ? `📝 ${action.title}` : action.title;
}

export function resolveActivityLogDescription(entry) {
  const rawDescription = entry?.description ? String(entry.description) : '';
  if (entry?.type !== 'action') return rawDescription;

  const fromMetadata = buildActionEffectsFromMetadata(entry?.metadata);
  if (fromMetadata) return fromMetadata;

  return translateRawEffectsText(rawDescription);
}
