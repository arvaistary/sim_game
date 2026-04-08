# Game Life

Cozy turn-based life simulator on Phaser 3 with a warm minimal UI and a scene-based architecture.

## 📚 Documentation

For complete documentation, see the [`doc/`](doc/) folder:

- **📖 Quick Start** → [`doc/core/README.md`](doc/core/README.md)
- **📊 Implementation Status** → [`doc/core/IMPLEMENTATION_STATUS.md`](doc/core/IMPLEMENTATION_STATUS.md)
- **🛣️ Roadmap** → [`doc/core/ROADMAP.md`](doc/core/ROADMAP.md)
- **🧠 MemPalace Setup** → [`doc/core/MEMPALACE_SETUP.md`](doc/core/MEMPALACE_SETUP.md)
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

- `src/bootstrap.js` — entry point: Phaser game config, scene list, dev hook.
- `src/game-state.js` — save schema, constants, helpers shared with UI.
- `src/ui-kit.js` — shared panels, buttons, modals, toast, palette, text styles.
- `src/style.css` — fullscreen shell for the canvas.
- `src/scenes/` — Phaser scenes (see `doc/core/SCENES_REFERENCE.md`).
- `src/ecs/` — ECS world, components, systems, adapters.
- `doc/` — documentation: **core/**, **GDD/**, **ecs/**.

## Implemented Scenes (see `src/scenes/`)

- **StartScene** — character creation.
- **SchoolIntroScene** / **InstituteIntroScene** — intro mini-games.
- **MainGameScene** (`MainGameSceneECS.js`) — HUD, bottom navigation.
- **HomeScene**, **ShopScene**, **FunScene**, **SocialScene** — recovery actions per category (shared core; scrollable cards).
- **RecoveryScene** — optional multi-tab recovery via `initialTab`.
- **CareerScene** — jobs, income, requirements.
- **FinanceScene** — overview, expenses, actions, investments (scrollable block).
- **EducationScene** — programs and active courses (scrollable programs block).
- **EventQueueScene** — event queue and choices.
- **SkillsScene** — skills screen.

## Current Gameplay Systems

- Work phase and recovery integrated with ECS (`SceneAdapter`, relevant systems).
- Recovery, career, finance, education, events — see `doc/core/IMPLEMENTATION_STATUS.md`.
- Autosave after meaningful state changes (`PersistenceSystem`).

## UI Principles

- Fullscreen responsive canvas (`Phaser.Scale.RESIZE`).
- Palette and components from `ui-kit.js` and `doc/visual.txt`.
- Long lists: container + mask + scroll (wheel / touch) where implemented.

## Notes For Further Development

- Prefer **ECS systems** for new stateful logic; `game-state.js` as shared helpers/constants.
- New UI: extend `ui-kit.js`, follow patterns in `doc/core/SCENES_REFERENCE.md`.
- ECS docs: `doc/ecs/`.
