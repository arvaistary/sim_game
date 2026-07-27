# Technology Stack

## Core Framework

### Nuxt 4
- **Version:** 4.4.2
- **Purpose:** Full-stack Vue framework
- **Configuration:** `nuxt.config.ts`
- **Rendering:** Client-only UI (`ssr: false`)
- **Runtime execution:** `server` by default; `spa` remains test/offline fallback and `hybrid` remains migration option
- **Compatibility Date:** 2026-04-10

**Key Features Used:**
- File-based routing
- Auto-import for components, composables, stores
- Module system for integrations
- Vite-based build tool

### Vue 3
- **Version:** 3.5.32
- **Purpose:** UI framework
- **Features:**
  - Composition API
  - Script setup syntax
  - Reactive state management
  - Teleport for modals
  - Suspense for async components

## State Management

### Pinia
- **Version:** 3.0.4
- **Integration:** `@pinia/nuxt` (0.11.3)
- **Purpose:** State management
- **Location:** `src/stores/`
- **Features:**
  - TypeScript support
  - Devtools integration
  - Auto-import by Nuxt

**Key Stores:**
- `game.store` - Main game state
- `time-store` - Time system
- `player-store` - Player data
- `wallet-store` - Financial state
- `career-store` - Career progression
- `education-store` - Education system
- `finance-store` - Financial management
- `housing-store` - Housing system
- `skills-store` - Skill system
- `events-store` - Event system
- `actions-store` - Action management
- `activity-store` - Activity logging
- `stats-store` - Character stats

## Language & Tooling

### TypeScript
- **Version:** 6.0.2
- **Mode:** Strict mode enabled
- **Compiler:** vue-tsc (3.2.6)
- **Purpose:** Type safety and developer experience

**Configuration:**
- Strict null checks enabled
- No unchecked indexed access
- Explicit typing required
- No `any` type allowed

### ESLint
- **Version:** 10.2.0
- **Integration:** @nuxt/eslint (1.15.2)
- **Plugins:**
  - @typescript-eslint/eslint-plugin (8.58.1)
  - @typescript-eslint/parser (8.58.1)
  - eslint-plugin-vue (10.8.0)
  - vue-eslint-parser (10.4.0)

**Custom Rules:** Located in `.cursor/rules/`
- Architecture rules
- Code style rules
- TypeScript rules

### Stylelint
- **Version:** 16.18.0
- **Configuration:** stylelint-config-standard-scss (14.0.0)
- **Plugin:** stylelint-scss (6.11.1)
- **Purpose:** SCSS linting

## Testing

### Vitest
- **Version:** 4.1.4
- **Purpose:** Unit testing
- **Coverage:** @vitest/coverage-v8 (4.1.4)
- **Browser:** @vitest/browser (4.1.4)
- **Test Utils:** @vue/test-utils (2.4.6)
- **Environment:** happy-dom (17.1.8)

### Playwright
- **Version:** 1.50.1
- **Purpose:** E2E testing
- **Features:** Browser automation, screenshot testing

## Styling

### SCSS
- **Version:** 1.85.1
- **Purpose:** Styling with variables and mixins
- **Integration:** Vite preprocessor
- **Global Variables:** Available in all components

**Structure:**
- `src/assets/scss/reset.scss` - CSS reset
- `src/assets/scss/variables.scss` - SCSS variables
- `src/assets/scss/mixins.scss` - SCSS mixins
- `src/assets/scss/global.scss` - Global styles
- `src/assets/scss/transitions.scss` - Transition animations

**Component Styles:** Separate `.scss` files next to components

## UI Libraries

### VueUse
- **Version:** 14.2.1
- **Integration:** @vueuse/nuxt
- **Purpose:** Vue composition utilities

### TanStack Virtual
- **Version:** 3.13.23
- **Purpose:** Virtual scrolling for lists

### Swiper
- **Version:** 12.1.3
- **Purpose:** Carousel/slider components
- **Types:** @types/swiper (5.4.3)

### Color Mode
- **Version:** 4.0.0
- **Integration:** @nuxtjs/color-mode
- **Purpose:** Dark/light mode support
- **Default:** Light mode

### Critters
- **Version:** 0.9.0
- **Integration:** @nuxtjs/critters
- **Purpose:** CSS critical path optimization

### i18n
- **Version:** 10.2.4
- **Integration:** @nuxtjs/i18n
- **Purpose:** Internationalization support

## Utilities

### Lodash
- **Version:** 4.0.8 (debounce), 4.1.1 (throttle)
- **Purpose:** Utility functions
- **Types:** @types/lodash.debounce, @types/lodash.throttle

### Cross-env
- **Version:** 7.0.3
- **Purpose:** Cross-platform environment variables

## Build & Development

### Vite
- **Version:** 6.3.5
- **Purpose:** Build tool and dev server
- **Features:** Fast HMR, optimized builds

## Development Scripts

```json
{
  "dev": "node scripts/dev-stack.mjs",  // Server-first client/server development stack
  "dev:client": "cross-env NUXT_PUBLIC_GAME_MODE=server NUXT_PUBLIC_GAME_API_BASE_URL=http://127.0.0.1:3001 nuxt dev --port 3000",
  "dev:server": "cross-env NUXT_PUBLIC_GAME_MODE=server NUXT_GAME_CORS_ORIGIN=http://127.0.0.1:3000,http://localhost:3000 nuxt dev --port 3001",
  "dev:standalone-server": "tsx --tsconfig tsconfig.server.json apps/server/src/index.ts",
  "build": "nuxt build",                // Production build
  "typecheck": "nuxt typecheck",        // Type checking
  "test": "vitest run",                 // Run tests
  "test:watch": "vitest",               // Watch mode tests
  "test:coverage": "vitest --coverage", // Coverage report
  "rules:audit": "node scripts/rules-audit.mjs",  // Audit code rules
  "rules:fix": "node scripts/fix-code.mjs",      // Auto-fix code style
  "mem:init": "node scripts/mempalace.mjs init . --yes",  // MemPalace init
  "mem:mine": "node scripts/mempalace.mjs mine .",        // MemPalace mine
  "mem:status": "node scripts/mempalace.mjs status",      // MemPalace status
  "mem:wakeup": "node scripts/mempalace.mjs wake-up",     // MemPalace wakeup
  "mem:search": "node scripts/mempalace.mjs search"       // MemPalace search
}
```

## Persistence

### LocalStorage
- **Purpose:** Game save storage
- **Implementation:** `src/infrastructure/persistence/LocalStorageSaveRepository.ts`
- **Features:**
  - Auto-save on state changes
  - Load on game start
  - Migration support for schema changes

### Current Server Repository
- **Runtime:** Standalone Fastify API in `apps/server/` (M2); Nitro handlers remain compatibility layer
- **Adapter:** In-memory `GameStateRepository` with cookie-scoped identity and 24-hour TTL
- **Boundary:** Transitional development implementation; process restart loses sessions

### Target Persistence (M3)
- **PostgreSQL 16:** Authoritative game state and durable persistence
- **Redis 7:** Cache, locks, rate limits, and operational TTLs only
- **Status:** Planned; not yet connected to runtime

## Server API

### Standalone Fastify
- **Location:** `apps/server/src/`
- **Status:** Implemented M2; serves the same `/api/game` contract independently of Nitro
- **Transport:** Fastify with cookie identity and CORS for local client

### Nitro / H3 Compatibility
- **Location:** `server/api/game/`
- **Role:** Compatibility path during extraction; not target standalone server
- **Endpoints:** initialization, state, action execution, offline sync, investments, career track, finance overview
- **Session identity:** HTTP-only `gl_session` cookie with `SameSite=Lax`
- **Contracts:** `packages/contracts/` with legacy facades in `src/domain/api-contract/`

## Aliases

Configured in `nuxt.config.ts`:
- `@constants` → `src/constants/index.ts`
- `@utils` → `src/utils/index.ts`
- `@domain` → `src/domain/index.ts`
- `@composables` → `src/composables/index.ts`

## Auto-Import Directories

Nuxt auto-imports from:
- `stores/` - All Pinia stores
- `composables/*/index.{ts,js,mjs,mts}` - All composables
- `shared/types` - Shared types

## Component Auto-Import

Components are auto-imported from:
- `src/components/global/` - Global components (no prefix)
- `src/components/game/` - Game components (no prefix)
- `src/components/ui/` - UI components (no prefix)
- `src/components/layout/` - Layout components (no prefix)
- `src/components/pages/` - Page components (no prefix)

## Browser Support

- Modern browsers with ES6+ support
- No IE support
- Requires localStorage support

## Performance Optimizations

- Code splitting by routes
- Component lazy loading
- CSS critical path optimization (critters)
- Virtual scrolling for large lists (TanStack Virtual)
- Debounced input handlers (lodash)

## Security Considerations

- UI rendering remains client-side; standalone Fastify is authoritative runtime boundary for server mode
- SPA saves reside in browser LocalStorage
- Server sessions use HTTP-only cookie identifiers; current in-memory storage is process-local until M3 persistence
- API input validation and consistent error envelopes remain required at every endpoint
- CSP headers are recommended for production

## Future Considerations

- IndexedDB for larger save data
- Service worker for offline support
- Progressive Web App (PWA) capabilities
- Cloud save synchronization
- Backend API for multiplayer features
