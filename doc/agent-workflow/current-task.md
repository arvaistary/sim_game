# Текущее состояние задачи

### TASK-20260827-002 — Добавить meta-progression модель

- Status: Active
- Phase: Manual QA
- Last updated: 2026-08-27
- Goal: Добавить отдельную domain-модель meta-progression для долговременной статистики игрока, количества завершённых жизней и данных New Game+.
- Acceptance criteria: `MetaProgression` имеет безопасные defaults/normalization/clone; состояние сериализуется в `GameWorld` и Pinia/server persistence; завершённая жизнь обновляет мета-статистику; New Game+ переносит заявленные мета-данные; полный reset очищает мета-состояние; тесты и проверки проходят.
- Non-goals: UI выбора достижений/навыков; runtime-производители достижений и knowledge; отдельная БД-схема.
- Baseline: `GameWorld` уже хранит `LifeState`; `endLife` строит итог жизни; New Game+ переносит только имя и tags; persistence сохраняет generic JSON aggregate. Проверки перед задачей: tests 478 passed, typecheck/lint/build/rules audit/validator passed.
- Decisions: Отдельный модуль `src/domain/meta-progression`; persisted как optional-compatible `GameWorld` slice. Текущий New Game+ transfer: 15% денег из итоговой жизни и до двух навыков на половине уровня; это тестовый временный baseline, не финальное продуктовое правило. Глобальные achievements/knowledge сохраняются. Нормальный reset создаёт initial meta state.
- Assumptions: Текущий baseline оставлен до отдельной проверки баланса; итоговая New Game+ не должна давать сильного преимущества и должна поддерживать реалистичный тон. Кандидат для будущей системы — место рождения/происхождение с умеренным влиянием на стартовые деньги, инвентарь и навыки.
- Changed files: `src/domain/meta-progression/*`; `src/domain/game-world/GameWorld.ts`; `src/domain/game-world/GameWorld.types.ts`; `src/domain/game-world/bridge.ts`; `src/domain/game-world/bridge.types.ts`; `src/domain/game-world/life/life-summary.ts`; `src/domain/game-world/commands/mutations.ts`; `src/domain/game-world/index.ts`; `src/domain/index.ts`; `src/stores/game.store.ts`; tests; GDD/status/roadmap docs.
- Checks completed: `npm test` — 93 files passed, 483 tests passed, 2 skipped, 5 todo; `npm run test:architecture` — passed; `npm run lint` — passed; `npm run lint:style` — passed; `npm run typecheck` — passed; `npm run rules:audit:changed` — 37/37 passed; `python agent-workflow/scripts/validate.py` — passed; `npm run build` — passed with known Nuxt sourcemap/chunk/deprecation warnings; `git diff --check` — passed.
- Known failures: `npm run audit:integrity:validate` is blocked by the repository baseline: `specs/003-project-integrity-audit` and its five required artifacts are absent; no fake baseline artifacts were added. Browser/manual QA was not executable because no browser adapter is available in this environment; life completion/reload, New Game+ transfer and full reset remain pending user verification.
- Manual QA: Pending user verification: life completion/reload, New Game+ transfer and counter, full reset, SPA/server persistence.
- Verification mode: native-shell-ok
- Next action: Выполнить ручную проверку завершения жизни/перезагрузки, New Game+ transfer и полного reset; затем закрыть задачу.
- Handoff notes: Code review чистый; текущая реализация зафиксирована commit `feat(game): add meta-progression lifecycle`. Сохранить `.codex/config.toml` вне git. Старые workflow-изменения относятся к закрытой `TASK-20260827-001`.
