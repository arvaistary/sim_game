export const STAT_CHANGE_LINE_RE = /^([a-zA-Zа-яА-ЯёЁ\s]+?)\s*([+-]\d+(?:\.\d+)?)$/i

export const RUSSIAN_TO_KEY: Record<string, string> = {
  'голод': 'hunger',
  'энергия': 'energy',
  'стресс': 'stress',
  'настроение': 'mood',
  'здоровье': 'health',
  'физическая форма': 'physical',
  'память': 'memory',
  'концентрация': 'concentration',
  'креативность': 'creativity',
  'организация': 'organization',
  'профессионализм': 'professionalism',
}
