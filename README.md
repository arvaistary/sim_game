# Game Life

Cozy turn-based life simulator on Phaser 3 with a warm minimal UI and a scene-based architecture.

## 📚 Documentation

For complete documentation, see the [`doc/`](doc/) folder:

- **📖 Quick Start** → [`doc/core/README.md`](doc/core/README.md)
- **📊 Implementation Status** → [`doc/core/IMPLEMENTATION_STATUS.md`](doc/core/IMPLEMENTATION_STATUS.md)
- **🛣️ Roadmap** → [`doc/core/ROADMAP.md`](doc/core/ROADMAP.md)
- **🎮 Game Design** → [`doc/GDD/GDD.md`](doc/GDD/GDD.md)
- **⚙️ ECS Architecture** → [`doc/ecs/ECS_ARCHITECTURE.md`](doc/ecs/ECS_ARCHITECTURE.md)

## Tech Stack

- `Phaser 3.80+`
- `Vite`
- `localStorage` for save persistence
- Pure Phaser `GameObjects` for UI, no DOM overlays

## Run

```bash
npm install
npm run dev
```

## Current Project Structure

- `src/main.js`
  Main Phaser scenes, routing, layout, adaptive positioning, shared scroll helper.
- `src/game-state.js`
  Save schema, game loop logic, recovery/work/education/finance helpers, progression events.
- `src/ui-kit.js`
  Shared UI builders: panels, buttons, modals, toast, palette, text styles.
- `src/style.css`
  Fullscreen responsive shell for Phaser canvas.
- `src/ecs/`
  ECS architecture implementation with components, systems, and adapters.
- `doc/`
  Complete project documentation:
  - **core/** - Main documentation for developers
  - **GDD/** - Game Design Document
  - **ecs/** - ECS architecture and migration docs

## Implemented Scenes

- `MainGameScene`
  Main HUD, character panel, stats, CTA for work period, bottom navigation.
- `RecoveryScene`
  Recovery phase with card tabs and scrollable content.
- `HomeScene`
  Dedicated housing and comfort screen with home upgrades, housing tiers, manual downgrade choice and weekly passive recovery effects.
- `ShopScene`
  Dedicated shopping screen for fast everyday purchases and basic resource recovery.
- `SocialScene`
  Dedicated social screen for relationship-focused actions and stress relief.
- `FunScene`
  Dedicated relaxation screen for low-pressure recovery, leisure and physical reset actions.
- `WorkEventScene`
  10-second work mini-event with click loop and result handling.
- `EventQueueScene`
  Overlay scene for chained scripted events.
- `EducationScene`
  Education hub with active course progress and program selection.
- `SchoolScene`
  School-style learning mini-game for shorter courses.
- `InstituteScene`
  Institute-style mini-game for deeper educational tracks.
- `CareerScene`
  Career ladder, current role, unlock requirements and salary growth.
- `FinanceScene`
  Liquid money, reserve, monthly expenses, last settlement info, deposits, finance actions and emergency finance pressure events.

## Current Gameplay Systems

- Work phase with score-based payout and random work events
- Recovery phase with stat changes and purchases
- Dedicated home, shop, social and fun screens from bottom navigation
- Education programs with active course progress
- Career progression based on professionalism and education
- Finance layer with reserve fund, deposits and monthly calendar-based expense settlement
- Housing tiers that affect comfort, monthly housing cost and weekly passive recovery
- Emergency finance events when reserve gets too thin or month ends in a cash gap
- Global weekly and age-based scripted events
- Autosave after meaningful state changes

## UI Principles Already Applied

- Fullscreen responsive canvas with `Phaser.Scale.RESIZE`
- Warm Cozy Minimalism palette from `doc/visual.txt`
- Rounded cards and buttons, soft shadows, tween-based transitions
- Scrollable content zones where lists can overflow
- Shared `ui-kit` for consistent scene styling
- Bottom navigation now routes into a growing set of dedicated feature scenes

## Notes For Further Development

- Game logic is already split away from scenes into `game-state.js`
- New content-heavy screens should use the shared vertical scroll controller
- New stateful features should prefer pure helper functions in `game-state.js`
- Reusable UI should be added to `ui-kit.js`, not duplicated inside scenes
- ECS architecture is being migrated to - see `doc/ecs/` for details
