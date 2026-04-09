# Development Roadmap

## Current State

The project already has the main game loop skeleton:

- `MainGameScene -> WorkEventScene -> RecoveryScene -> MainGameScene`
- overlay events through `EventQueueScene`
- dedicated verticals for home, shop, social, fun, education, career and finance
- save persistence and progression logic in `src/game-state.js`

## What Is Already Done

- Main HUD and character status screen
- Recovery tab system with actionable cards
- Dedicated `HomeScene`, `ShopScene`, `SocialScene` and `FunScene` from bottom navigation
- Work mini-game and work result calculation
- Education hub plus two education mini-games
- Career ladder and automatic promotions
- Finance overview with reserve, monthly settlement, deposit actions and emergency pressure events
- Housing tiers with passive weekly recovery effects and manual downgrade decision
- Scroll support for long panels and lists
- Reusable UI kit and fullscreen responsive layout
- **ActionSystem** — ECS-система обработки действий (~222 действия в 10 категориях: shop, fun, social, home, education, finance, career, hobby, health, selfdev)
- **Hourly rates** — почасовые ставки work/neutral/sleep из GDD 5.2
- **3 новых сцены:** `HobbyScene`, `HealthScene`, `SelfdevScene`
- **Новые ECS-компоненты:** SUBSCRIPTION_COMPONENT, COOLDOWN_COMPONENT, COMPLETED_ACTIONS_COMPONENT, CREDIT_COMPONENT
- **39 тестов:** 25 ActionSystem + 14 hourly-rates

## Next High-Priority Steps

1. Deepen the finance system.
   Add multiple investment products, savings goals, debt/credit pressure and clearer cashflow history.

2. Add real housing progression.
   Expand existing housing tiers with more upgrades, visuals, rent contracts and stronger long-term comfort interactions.

3. Expand social systems.
   Relationship arcs, contact frequency, support bonuses, conflict events, romance branch.

4. Add event content volume.
   More weekly, age, work and lifestyle events from GDD with branching consequences.

5. Build a proper jobs/career meta-loop.
   Manual job switching, applications, unlock requirements, failure states, special work events per profession tier.

## Mid-Priority Steps

1. Add a dedicated `ModalManager` or overlay orchestration layer.
   This will simplify stacking notifications, decisions and follow-up events across scenes.

2. Add scene-level sound hooks.
   Ambient loops, click feedback, result jingles, quiet transitions.

3. Add a proper asset pipeline.
   Character sprites, room backgrounds, icons and scene illustrations instead of placeholder graphics-only visuals.

4. Add analytics/debug tools.
   Reset save, quick progression buttons, event forcing, economy debug panel.

5. Add balancing passes.
   Salary curve, recovery costs, education length, investment returns, stress growth, comfort effects.

## Long-Term Product Goals

- Full cozy life-sim progression from early adulthood into later milestones
- A meaningful loop between work, rest, growth, money and relationships
- Multiple viable player strategies:
  steady saver, education-first, career climber, comfort-focused, socially driven
- More authored scenes and less placeholder text

## Recommended Build Order

1. Finance expansion
2. Housing progression
3. Social system expansion
4. Job application / career branching
5. Event volume pass
6. Art and audio pass

## Technical Cleanup Still Worth Doing

- Split large scene classes from `src/main.js` into separate files
- Move shared card builders into dedicated component modules
- Add lightweight test coverage for `game-state.js`
- Add explicit save migrations for future schema versions
- Normalize modal/event summary text formatting
