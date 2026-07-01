# Technology Stack

## Core Framework

### Nuxt 4
- **Version:** 4.4.2
- **Purpose:** Full-stack Vue framework
- **Configuration:** `nuxt.config.ts`
- **Mode:** SPA only (`ssr: false`)
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

### Toastify
- **Version:** 0.2.8
- **Purpose:** Toast notifications

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
  "dev": "nuxt dev",                    // Development server
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

- No server-side rendering (reduces XSS surface)
- LocalStorage for data (requires client-side storage)
- No external API calls currently
- CSP headers recommended for production

## Future Considerations

- IndexedDB for larger save data
- Service worker for offline support
- Progressive Web App (PWA) capabilities
- Cloud save synchronization
- Backend API for multiplayer features