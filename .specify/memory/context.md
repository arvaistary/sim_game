# Game Life Repository Context

**Last Updated:** 2026-07-26

## Project Overview

Game Life is a cozy turn-based life simulator built with modern web technologies. It's a single-player game where players guide a character through life, making decisions about career, education, relationships, health, and personal development.

## Technology Stack

- **Framework:** Nuxt 4 with Vue 3 (`ssr: false` client UI), standalone Fastify API, and Nitro compatibility handlers during migration
- **Language:** TypeScript (strict mode)
- **State Management:** Pinia
- **Styling:** SCSS
- **Persistence:** LocalStorage for SPA saves; current server sessions use memory repository adapters; PostgreSQL 16 and Redis 7 are planned for M3
- **Testing:** Vitest + Playwright
- **Build Tool:** Vite

## Core Technical Decisions

1. **Runtime Modes:** Client UI uses `ssr: false`; game commands support `spa`, `server`, and `hybrid` execution modes through runtime configuration
2. **Layered Architecture:** Strict dependency flow: utils/constants → domain → application → infrastructure → stores/composables → components → pages
3. **Type Safety:** All code is TypeScript with strict mode enabled
4. **Component Auto-import:** Components from specific directories are auto-imported without prefixes
5. **Server-first runtime:** Browser/dev defaults to server execution through standalone Fastify on `:3001`; Nitro handlers remain compatibility layer
6. **Composable Auto-import:** All composables and stores are auto-imported by Nuxt

## Key Directories

```
src/
├── domain/              # Business logic and game balance
│   └── balance/         # ~222 game actions across 10 categories
├── application/         # Commands and queries (use cases)
├── stores/              # Pinia stores (state management)
├── composables/         # Vue composables (reusable logic)
├── components/          # UI components
│   ├── ui/              # Generic UI components (prefixed Ui*)
│   ├── pages/           # Page-specific components
│   ├── global/          # Global components (GameNav, Toast)
│   ├── game/            # Game-specific components
│   └── layout/          # Layout components
├── pages/               # Nuxt pages (routing)
├── infrastructure/      # Persistence adapters
├── utils/               # Utility functions
├── constants/           # Constants and navigation
└── assets/              # SCSS, images
server/
├── api/game/            # Nitro compatibility game endpoints
└── utils/               # Cookie session, storage, and API error helpers
apps/server/             # Standalone Fastify API (M2)
packages/                # Framework-free contracts, domain, and application packages
specs/                   # Durable Spec-kit work items and server-first plan
```

## Game Systems

**Implemented Pages:**
- Dashboard - character overview, stats, activity log, work choice
- Home - recovery actions (health, fun, social, self-dev, hobby)
- Actions - integrated recovery system with tabs
- Work - jobs, career, income, work shifts
- Finance - balance overview, expenses, financial actions
- Education - programs, courses, educational paths
- Skills - overview and skill progression
- Events - random events and choices
- Shop - purchases and housing upgrades

**Key Mechanics:**
- Time-based progression system
- Action execution with stat changes
- Career advancement with work shifts
- Education progression system
- Random events with choices
- Activity log for game history
- Auto-save system (LocalStorage)
- Server session API with cookie identity and 24-hour in-memory state TTL (transitional M2 implementation)
- Hybrid/offline execution contracts and queued-action synchronization

## Development Workflow

**Scripts:**
- `npm run dev` - Server-first client/server development stack
- `npm run dev:standalone-server` - Standalone Fastify API only
- `npm run build` - Production build
- `npm run typecheck` - Type checking
- `npm run test` - Run tests
- `npm run test:e2e:integrity` - Run 60 route/viewport checks with direct Nuxt lifecycle ownership and bounded cleanup
- `npm run test:e2e:integrity:regression` - Verify integrity-command exit code and bounded hanging-child cleanup
- `npm run rules:audit` - Audit code for rule violations
- `npm run audit:integrity:validate` - Validate integrity-audit evidence artifacts
- `npm run test:architecture` - Check extracted package boundaries
- `npm run test:standalone-server` - Check standalone Fastify API contract
- `npm run rules:fix` - Auto-fix code style issues

**Code Quality:**
- ESLint for linting
- Stylelint for SCSS linting
- TypeScript strict mode
- Custom rules in `.cursor/rules/` directory
- Auto-fix scripts for code style

## Documentation

**Primary Documentation Location:** `doc/`
- `core/` - Architecture, implementation status, roadmap
- `gdd/` - Game Design Document
- `adr/` - Architecture Decision Records
- `guides/` - Practical guides (design system, modals, etc.)
- `reference/` - API reference (composables, stores)
- `specs/` - Durable Spec-kit specifications, plans, tasks, and evidence

## Project Conventions

**Naming:**
- Boolean variables use prefixes: `is/has/can/should/was/are`
- Functions start with action verbs: `get/set/update/load/handle/create/remove/fetch/toggle`
- Components: `Ui*` prefix only for `src/components/ui/`

**Imports:**
- Use project aliases: `@/`, `@/components/*`, `@/stores/*`, `@/composables/*`, `@/domain/*`, `@/utils/*`, `@/constants/*`
- Type-only imports: `import type`
- Group and separate import groups with empty lines

**Vue SFC Structure:**
1. Imports (grouped and separated)
2. Props definition
3. Emits definition
4. Routing
5. Pinia stores
6. Components (if needed)
7. Derived constants/flags
8. Local state (ref, reactive)
9. Computed properties
10. Handlers/functions
11. Lifecycle hooks
12. Guard conditions

**Type Safety:**
- Types in separate `*.types.ts` files or `types.ts`
- Explicit typing at module boundaries
- Explicit typing for local variables
- No `any` type allowed
- No inline object types in function parameters

**Styles:**
- SCSS files in separate `*.scss` files next to components
- Import in `<script setup>`: `import './ComponentName.scss'`
- No `<style>` blocks in `.vue` files

## Important Notes

- The project migrated from Phaser.js to Nuxt 4; ADR-0001 is the only retained migration rationale
- Archived documentation is intentionally removed; completed or superseded Spec-kit work items remain under `specs/`
- ECS architecture was removed in favor of layered architecture
- All game balance data is in `src/domain/balance/constants/`
- Game actions are defined in `src/domain/balance/actions/`
- The project uses strict import direction rules between layers
- Browser execution defaults to `server`; `spa` remains test/offline fallback and `hybrid` remains migration/runtime option, not SSR rendering mode
- Auto-save is triggered after significant state changes
- Time system handles game progression with ages and seasons

## Current Status

The game is in active development with core systems implemented. M0-M2 of server-first extraction are complete; M3 durable PostgreSQL/Redis persistence remains in progress. See `doc/core/IMPLEMENTATION_STATUS.md` and `specs/server-first-arch/` for current status. The project follows Spec-kit with durable intermediate artifacts.
