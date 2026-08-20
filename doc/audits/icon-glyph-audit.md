# Аудит иконок: emoji vs Solar/GameIcon

Дата: 2026-08-20
Политика Figma: Iconify `solar:*-linear` → `GameIcon` в коде (см. `.codex/figma-game-components-state.json` → `iconPolicy`).

## Исправлено

| Место | Было | Стало |
|-------|------|-------|
| `DayPlannerSummary` mood | ☀️😴🌥️… emoji | `GameIcon` по тону (`mood-funny` = Figma `solar:emoji-funny-square-linear`) |
| `Topbar` settings | generic cog | `solar:settings-linear` |
| `CareerTrack` lock badge | 🔒 | `GameIcon lock` |
| `EducationLevel` / `StudyModal` | 📖🎓⚠️🌙 | `book` / `medal` / `danger-triangle` / `moon-sleep` |
| `CommandPalette` | ⌕🏠☀⚙? | `search` + nav `GameIcon` + `sun`/`moon`/`settings`/`play` |
| `plan/index` категории | emoji в `useCalendarPlan` | `GameIconName` в `ACTION_CATEGORY_META` |
| `StatChange` | `ICON_MAP` ~40 emoji | `resolveStatChangeIcon` + `GameIcon` (16px) |
| `ToastHost` | `✓` `!` `⚠` `i` | `check-circle` / `close-circle` / `danger-triangle` / `info-circle` |
| `work-categories` + work page chips | 🏢⏰🎯… | `GameIconName` + `<GameIcon>` в чипах |
| `domain/balance/actions/constants.ts` | emoji в `icon` | строки `GameIconName` (`cart`, `gamepad`, …) |
| Toast-префиксы | 🔒💰 в `GameNav`, `ActionCard`, `ProgramList` | чистый текст |
| `useAgeRestrictions/age-constants` | emoji в unlock-тостах | чистый текст |
| `StudyModal` flip hint | 👆 | «Нажмите, чтобы перелистнуть» |
| `DropdownSelect` | ✓ | `check-circle` 14px |

## Намеренно оставлено (контент, не UI-глиф)

| Файл | Что |
|------|-----|
| `domain/balance/actions/*.ts` | emoji в полях `mood` — нарратив действий |
| `NewbornWelcomeScreen` | 👶 — декоративный welcome |

## Рекомендации

1. **UI-глифы** — только `GameIcon` + Solar linear 1.5px stroke.
2. **Новые иконки** — path из `https://api.iconify.design/solar/{name}-linear.json`.
3. **Native `<select>`** — без иконок в `<option>` (только label); иконки — в chip/button UI.

## Figma-референсы

- DayPlanner mood: `2088:141` → `solar:emoji-funny-square-linear` 20×20
- Topbar settings: `2073:11` → `solar:settings-linear` 18×18
