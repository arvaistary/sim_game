# Src Structure Migration Map

## Rules

- Use module-local folders: `types`, `constants`, `utils`.
- Keep `index.ts` as module public API.
- Prefer `export type *` for type-only exports.

## Mapping (Old -> New API)

- `src/application/game/dto.ts` -> `src/application/game/types.ts`
- `src/shared/constants.ts` -> `src/shared/constants/index.ts`
- `src/shared/activity-log-formatters.ts` -> `src/shared/utils/activity-log-formatters.ts`
- `src/shared/stat-changes-format.ts` -> `src/shared/utils/stat-changes-format.ts`
- `src/shared/skill-tooltip-content.ts` -> `src/shared/utils/skill-tooltip-content.ts`

- `src/domain/balance/*.ts` (catalog-like files) -> `src/domain/balance/constants/*`
- `src/domain/balance/education-ranks.ts` -> `src/domain/balance/utils/education-ranks.ts`
- `src/domain/balance/hourly-rates.ts` -> `src/domain/balance/utils/hourly-rates.ts`
- `src/domain/balance/work-economy.ts` -> `src/domain/balance/utils/work-economy.ts`
- `src/types/balance.ts` -> `src/domain/balance/types/index.ts` (barrel re-export)

- `src/domain/ecs/components/index.ts` -> `src/domain/ecs/constants/index.ts` (barrel re-export)
- `src/types/ecs.ts` -> `src/domain/ecs/types/index.ts` (barrel re-export)
- `src/domain/ecs/policies/*.ts` -> `src/domain/ecs/utils/*` (barrel re-export)

## Cutover policy

- First switch imports to new public barrel paths.
- Then remove direct deep imports where possible.
- Keep compatibility boundary only for serialization and legacy key mapping.
