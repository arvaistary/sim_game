import type { GameIconName } from '@/components/ui/GameIcon/GameIcon.types'

export const DEFAULT_STAT_CHANGE_ICON: GameIconName = 'chart-square'

const STAT_CHANGE_ICON_ENTRIES: Array<[string, GameIconName]> = [
  ['финансовая грамотность', 'book'],
  ['аналитическое мышление', 'search'],
  ['эмоциональный интеллект', 'chat-round'],
  ['медицинские знания', 'hospital'],
  ['пассивный доход', 'graph-up'],
  ['социальность', 'users'],
  ['креативность', 'palette'],
  ['развлечения', 'masks'],
  ['образование', 'medal'],
  ['experience', 'star'],
  ['investment', 'chart-2'],
  ['analytical', 'search'],
  ['financial', 'book'],
  ['emotional', 'chat-round'],
  ['relationship', 'heart'],
  ['friendship', 'hand-shake'],
  ['reputation', 'star'],
  ['intelligence', 'lightbulb-bolt'],
  ['здоровье', 'heart'],
  ['настроение', 'smile-circle'],
  ['энергия', 'bolt'],
  ['голод', 'cup-hot'],
  ['интеллект', 'lightbulb-bolt'],
  ['репутация', 'star'],
  ['опыт', 'star'],
  ['деньги', 'dollar'],
  ['резерв', 'wallet'],
  ['инвестиции', 'chart-2'],
  ['работа', 'briefcase'],
  ['карьера', 'target'],
  ['навыки', 'settings'],
  ['отношения', 'heart'],
  ['дружба', 'hand-shake'],
  ['семья', 'users-group-rounded'],
  ['хобби', 'gamepad'],
  ['спорт', 'running'],
  ['время', 'stopwatch'],
  ['стресс', 'heart-pulse'],
  ['удача', 'star'],
  ['риск', 'danger-triangle'],
  ['сон', 'moon-sleep'],
  ['health', 'heart'],
  ['stress', 'heart-pulse'],
  ['mood', 'smile-circle'],
  ['energy', 'bolt'],
  ['hunger', 'cup-hot'],
  ['social', 'users'],
  ['creativity', 'palette'],
  ['luck', 'star'],
  ['xp', 'star'],
  ['money', 'dollar'],
  ['reserve', 'wallet'],
  ['income', 'graph-up'],
  ['medical', 'hospital'],
  ['work', 'briefcase'],
  ['career', 'target'],
  ['education', 'medal'],
  ['skill', 'settings'],
  ['family', 'users-group-rounded'],
  ['hobby', 'gamepad'],
  ['fun', 'masks'],
  ['sport', 'running'],
  ['sleep', 'moon-sleep'],
  ['physical', 'dumbbell'],
  ['time', 'stopwatch'],
  ['hour', 'stopwatch'],
]

/**
 * @description [UI] - подбирает Solar-иконку для строки изменения характеристики.
 * @return { GameIconName } имя иконки из GameIcon
 */
export function resolveStatChangeIcon(nameKey: string): GameIconName {
  const normalizedKey: string = nameKey.trim().toLowerCase()

  for (const [key, icon] of STAT_CHANGE_ICON_ENTRIES) {
    if (normalizedKey.includes(key) || key.includes(normalizedKey)) {
      return icon
    }
  }

  return DEFAULT_STAT_CHANGE_ICON
}
