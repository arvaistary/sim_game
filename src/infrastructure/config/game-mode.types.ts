/**
 * Re-export из domain/game-mode для обратной совместимости.
 *
 * Реальные типы живут в src/domain/game-mode/ (нейтральный слой,
 * доступный и application, и infrastructure). Здесь оставлены только
 * runtime-хелперы, использующие Nuxt/browser API.
 */
export type {
  GameMode,
  GameModeConfig,
  OnlineStatus,
  SyncStatus,
} from '@/domain/game-mode'
export { DEFAULT_GAME_MODE, DEFAULT_GAME_MODE_CONFIG } from '@/domain/game-mode'
