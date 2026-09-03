# Технологический адаптер Game Life

## Stack

- Nuxt 4 + Vue 3, client UI с `ssr: false`;
- TypeScript в strict mode;
- Pinia;
- SCSS;
- Vitest + Playwright;
- standalone Fastify API, Nitro compatibility handlers, путь persistence в PostgreSQL;
- npm workspaces в `packages/`.

## Архитектура

```text
utils/constants → domain → application → infrastructure → stores/composables → components → pages
```

Domain содержит business logic без привязки к framework. Application координирует use cases. Infrastructure владеет внешними системами. Stores, composables, components и pages отвечают за presentation и interaction.

Прочитайте подходящие общие правила в `.cursor/rules/10-typing.mdc`, `15-nuxt-typescript.mdc`, `20-code-style.mdc`, `30-architecture.mdc` и `40-styles.mdc`.

## Команды проверки

| Назначение | Команда | Когда требуется |
|---|---|---|
| Unit/integration tests | `npm run test` или целевая команда Vitest | изменения поведения |
| Architecture tests | `npm run test:architecture` | изменения границ |
| Type check | `npx nuxt prepare`, затем `npm run typecheck` | изменения типизированного кода |
| Rule audit | `npm run rules:audit:changed` | незакоммиченные изменения |
| Lint | `npm run lint` | изменения исходного кода |
| Style lint | `npm run lint:style` | изменения SCSS/CSS |
| Build | `npm run build` | изменения build/config/deployment |

## Browser QA

Для изменений, видимых в браузере, проверяйте boot, основные действия, переходы состояния, читаемость HUD/menu, ввод с клавиатуры и указателя, responsive behavior, accessibility и скриншоты, если важна визуальная часть состояния.
