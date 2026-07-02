# Карта миграции структуры src

## Правила

- Используйте локальные папки модулей: `types`, `constants`, `utils`.
- Держите `index.ts` как публичный API модуля.
- Предпочитайте `export type *` для экспортов, содержащих только типы.

## Маппинг (старый -> новый API)

- `src/application/game/dto.ts` -> `src/application/game/types.ts`
- `src/shared/constants.ts` -> `src/shared/constants/index.ts`
- `src/shared/activity-log-formatters.ts` -> `src/shared/utils/activity-log-formatters.ts`
- `src/shared/stat-changes-format.ts` -> `src/shared/utils/stat-changes-format.ts`
- `src/shared/skill-tooltip-content.ts` -> `src/shared/utils/skill-tooltip-content.ts`

- `src/domain/balance/*.ts` (каталожные файлы) -> `src/domain/balance/constants/*`
- `src/domain/balance/education-ranks.ts` -> `src/domain/balance/utils/education-ranks.ts`
- `src/domain/balance/hourly-rates.ts` -> `src/domain/balance/utils/hourly-rates.ts`
- `src/domain/balance/work-economy.ts` -> `src/domain/balance/utils/work-economy.ts`
- `src/types/balance.ts` -> `src/domain/balance/types/index.ts` (barrel реэкспорт)

- `src/domain/ecs/components/index.ts` -> `src/domain/ecs/constants/index.ts` (barrel реэкспорт)
- `src/types/ecs.ts` -> `src/domain/ecs/types/index.ts` (barrel реэкспорт)
- `src/domain/ecs/policies/*.ts` -> `src/domain/ecs/utils/*` (barrel реэкспорт)

## Политика перехода

- Сначала переключить импорты на новые публичные barrel-пути.
- Затем убрать прямые глубокие импорты где возможно.
- Сохранять границу совместимости только для сериализации и маппинга legacy-ключей.
