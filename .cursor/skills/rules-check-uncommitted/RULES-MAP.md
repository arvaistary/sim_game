# Карта: `.cursor/rules` → проверки

Используй в **фазе B** навыка `rules-check-uncommitted`. Для каждого файла правил — прочитай `.mdc` и пройди пункты **только по незакоммиченным** путям (`git diff`, `git status`).

| Файл правил | Автоматика | Агент (обязательно сверить diff) |
|-------------|------------|----------------------------------|
| `00-local-only.mdc` | — | Только локальные правила/навыки проекта; не ссылаться на глобальные skills пользователя |
| `10-typing.mdc` | `typing/*`, eslint | Типы только в `*.types.ts`; `import type`; нет `any`; нет inline object в params/generics/переменных |
| `15-nuxt-typescript.mdc` | `typecheck` после `nuxt prepare` | `tsconfig.json` без `types`/`include`/`exclude`; явные импорты типов/const/helpers из stores/composables в `.vue`; `arr[i]!` / `??`; enum в generic с `import`; методы store существуют в facade |
| `20-code-style.mdc` | `style/*`, eslint | Порядок блоков `<script setup>`; TSDoc `@description`/`@return` на экспортах; `v-if` не `&&`; `:key` в `v-for`; без `void` fire-and-forget; цепочки `.map` «лесенкой» |
| `30-architecture.mdc` | `nuxt/server-client-boundary` | Импорты только вниз по слоям; `Ui*` только в `components/ui`; структура компонента; SSR/browser API по `nuxt.config` |
| `40-styles.mdc` | `styles/*` | Scoped в SFC; глобальные стили в `src/assets/scss/global.scss`; `@use`/`@forward`, не `@import` |

## Покрытие `rules-audit.mjs` (фаза A)

Правила с префиксами, которые скрипт уже ловит на изменённых `.ts`/`.vue`/`.scss`:

- `typing/types-location`, `typing/no-inline-object-*`, `typing/explicit-variable-annotation`, `typing/no-returntype-typeof-variable`, `typing/duplicate-function-typing`, `typing/no-duplicate-hook-generic-typing`
- `style/script-setup-block-order`, `style/script-setup-block-separation`, `style/blank-line-*`, `style/exported-function-tsdoc*`, `style/vue-prefer-v-if`, `style/v-for-requires-key`, `style/no-void-fire-and-forget`, `style/chain-*`, `style/if-guard-*`, и др.
- `nuxt/server-client-boundary`, `nuxt/use-async-data-key`, `nuxt/use-fetch-key`
- `styles/global-scss-location` (только лишние файлы в `src/assets/scss/` вне `global.scss`, `tokens/**` и partials), `styles/sass-import`
- `eslint`

**Не автоматизировано** (только фаза B по `.mdc`):

- Полная матрица импортов между слоями (`pages` → `domain` и т.д.)
- Все пункты `30-architecture` (нейминг папок, layout, `useAsyncData` error/pending UI)
- Часть `40-styles` (utility-first, `cn()`, не смешивать utility и тяжёлый SCSS)
- `00-local-only` (процесс агента)
- Точечные формулировки из `10-typing` / `20-code-style`, если нет matching `pushFinding`

## Выбор затронутых правил

По префиксу изменённого пути:

| Изменения в | Читать обязательно |
|-------------|-------------------|
| `src/pages/`, `src/middleware/` | 30, 20, 15, 10 |
| `src/components/` | 30, 20, 15, 10, 40 (если `<style>`/scss) |
| `src/composables/`, `src/stores/` | 30, 15, 10, 20 |
| `src/application/`, `src/domain/` | 30, 10, 20 |
| `src/infrastructure/`, `src/utils/`, `src/constants/` | 30, 10 |
| `tsconfig.json` | 15 |
| `*.scss` | 40 |
| `.cursor/rules/` | Все файлы (включая правку самих правил) |
| только `docs/`, `plans/` | 00 (кратко); кодовые правила skip |

Если сомневаешься — прочитай **все** шесть `.mdc` из `.cursor/rules/`.
