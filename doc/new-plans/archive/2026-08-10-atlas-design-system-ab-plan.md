# Atlas Design System — Implementation Plan (A/B vs Nexus)

> **For agentic workers:** Implement task-by-task. Use checkbox (`- [ ]`) tracking. Do **not** invent a second component tree (`AtlasButton` clones). Prefer skin packs over shared semantic tokens. Follow `.cursor/rules/` and existing layering (`utils → domain → application → stores/composables → components → pages`).

**Goal:** Ship a second visual system (**Atlas**, Hybrid Command / “life CMS”) that can be switched at runtime against existing **Nexus**, with light/dark themes, in-UI accent palettes, and an extensible skin registry — for a high-contrast A/B test of the life-management dashboard experience.

**Architecture:** One shared semantic CSS-variable contract. Skins are value packs + layout/component modifiers keyed by `data-skin`. Theme (`data-theme`) and accent palette (`data-palette`) are orthogonal axes. Game domain/store logic stays untouched; UI shell and page presentation diverge under Atlas.

**Tech Stack:** Nuxt 4 / Vue 3 / Pinia / TypeScript / SCSS (`src/assets/scss/*`) / `@nuxtjs/color-mode` / existing `useSettingsStore` + `settings-sync.client.ts`.

**Branch:** create and work on `feature/atlas-design-system` (do not merge until A/B checklist passes).

## Locked product decisions

| Decision | Choice |
|----------|--------|
| A/B delivery | Runtime switcher in one build: Skin `nexus` \| `atlas` |
| Scope | Full UI pass (all main game screens), max visual difference |
| Visual language | **Hybrid Command** — light content canvas + dark rail sidebar + bento modular grid + strong accent + metric-forward widgets (“content manager for a life”) |
| Theming model | Skin packs over shared semantic tokens (Approach A) |
| Themes | Light + Dark for both skins |
| Palettes | User-selectable accent palette in Settings; skins remain extensible |
| Plan location | `doc/new-plans/` (this file) |

## Non-goals (this branch)

- Domain rule changes, career/balance, calendar planner mechanics (see separate GDD docs).
- Parallel duplicate component trees (`NexusX` / `AtlasX` for every widget).
- Figma pipeline / Style Dictionary / Storybook (optional later).
- Replacing game content copy or adding new game features.
- Shipping neon/cyberpunk skins in MVP (palette slots only).

## Global constraints

- Styles for Vue components: separate `ComponentName.scss` imported from SFC (project code-style). No `<style>` blocks in `.vue`.
- Prefer CSS custom properties for anything theme/skin/palette-sensitive. Ban new hardcoded hex in component SCSS unless documented as skin-invariant.
- Keep imports layered; UI stays in `components/ui`, `components/layout`, `components/pages`, `components/game`.
- Types in `*.types.ts`. Explicit types on exported APIs + local vars per project typing rules.
- Persist appearance prefs in existing `game_life_settings` localStorage key (extend schema, keep backward compatible defaults).
- Russian UI copy in Settings (match existing drawer).
- Accessibility: contrast ≥ 4.5:1 for text; keyboard reach for new controls; do not break existing drawers/modals.

---

## 0. Context the implementer must read first

1. `doc/guides/DESIGN_SYSTEM.md` — current Nexus spec (tokens, themes).
2. `doc/GDD/modules/01_general.md` — what the game is (life-sim, hour budget, dashboard loop).
3. `doc/core/PAGES_REFERENCE.md` — route map.
4. `src/assets/scss/variables.scss`, `src/assets/scss/global.scss` — live token source.
5. `src/stores/settings-store/index.ts`, `src/plugins/settings-sync.client.ts`, `src/components/ui/SettingsDrawer/SettingsDrawer.vue`.
6. Layout: `src/components/layout/DashboardLayout/*`, `GameLayout/*`, `Topbar/*`, `src/components/global/GameNav/*`.
7. Local visual refs: `artifact/*.jpg`, `doc/new-plans/archive/*.jpg` (Hybrid Command anchors: MagicHeal, Intelly, dark-rail bento shots).

**Product metaphor:** the player manages a character’s life the way a content manager runs a site — modules, queues, metrics, schedules, statuses — not a cartoon toy UI.

---

## 1. Visual language — Atlas (Hybrid Command)

### 1.1 Signature differences vs Nexus (must be obvious in A/B)

| Axis | Nexus (today) | Atlas (target) |
|------|---------------|----------------|
| Shell | Light/light-ish sidebar, Linear/emerald soft admin | **Dark vertical rail** + light (or inverted) content canvas |
| Layout | Card stack / conventional dashboard rows | **Bento grid** with unequal tile spans (hero / metrics / planner / feed) |
| Density of meaning | Soft, comfortable cards | Metric-forward: larger numbers, status chips, sparklines where cheap |
| Radius | Soft 20–24px cards | Slightly tighter command radii on chrome (12–16px rail/controls), cards still rounded (~16–20px) — not pill-soft wellness |
| Accent | Emerald primary | Strong cobalt/indigo default palette (swappable) |
| Nav | Icon+label sidebar / bottom nav | Slim icon rail (expanded labels optional); active state as filled “inset” pill |
| Mood | Friendly SaaS | Technological life-ops console |

### 1.2 Reference map (inspiration only — adapt to Game Life domains)

- Dark rail + modular tiles: `doc/new-plans/archive/6473b6bc7612f04bbe491bcacbef380e.jpg`, `artifact/11.jpg`
- Metric / health-ops cards: `artifact/2.jpg`, `artifact/6.jpg`, `artifact/10.jpg`
- Soft bento / widget rhythm (structure, not pastel-wellness vibe): `doc/new-plans/archive/0a607f2d30fc04ac1352744f75a4a249.jpg`

### 1.3 Atlas token intent (directional — lock values in Task 2)

**Default palette `cobalt` (light):**

- Canvas: cool gray `#F4F6FA`
- Surface/card: `#FFFFFF`
- Rail/sidebar: `#0B1220` (near-navy), text on rail `#E5E7EB`
- Primary action: `#2B5AED`
- Secondary: `#7C3AED`
- Borders: `#E2E8F0`
- Success/warning/danger: keep semantic clarity (may reuse Nexus status hues)

**Dark theme:** deep navy canvas (`#070B14`), elevated surfaces `#121A2B`, rail slightly darker or equal, primary lifted for contrast (`#5B8CFF`).

**Palette packs (MVP):** `cobalt` | `emerald` | `sunset` | `violet` — each overrides brand/action/focus tokens only; surfaces stay skin+theme owned.

---

## 2. Theming architecture

### 2.1 Three orthogonal axes on `<html>`

```text
data-skin="nexus" | "atlas"
data-theme="light" | "dark"          # already used
data-palette="cobalt" | "emerald" | "sunset" | "violet"
data-density="comfortable" | "compact"   # already used
```

Selector precedence (implement consistently):

```scss
:root, html[data-skin="nexus"] { /* nexus defaults */ }
html[data-skin="atlas"] { /* atlas surfaces, radii, shadows, layout tokens */ }
html[data-theme="dark"] { /* theme overlays — must compose with skin */ }
html[data-skin="atlas"][data-theme="dark"] { /* atlas-dark specifics if needed */ }
html[data-palette="sunset"] { /* accent overrides only */ }
```

**Rule:** Components consume **semantic** vars (`--color-bg-card`, `--color-action-primary`, `--radius-card`, `--shadow-card`, `--size-sidebar`, …). Never branch on skin name inside every component SCSS except rare shell layout hooks (`DashboardLayout`, `GameNav`).

### 2.2 Skin pack module shape

```text
src/assets/scss/
  tokens/
    _semantic-contract.scss   # list of required CSS vars (documentation + :root fallbacks)
    skins/
      _nexus.scss
      _atlas.scss
    palettes/
      _cobalt.scss
      _emerald.scss
      _sunset.scss
      _violet.scss
  global.scss                 # imports contract + skins + palettes; keeps shared base
  variables.scss              # keep SCSS $vars for compile-time spacing where needed; migrate colors toward CSS vars
```

### 2.3 Settings store extensions

Extend `SettingsState`:

```ts
export type SkinId = 'nexus' | 'atlas'
export type PaletteId = 'cobalt' | 'emerald' | 'sunset' | 'violet'

// add:
skin: SkinId        // default 'nexus' for backward compat; A/B default on feature branch may be 'atlas'
palette: PaletteId  // default 'emerald' when skin=nexus (closest to current), 'cobalt' when skin=atlas
```

Actions: `setSkin`, `setPalette`. Persist with existing `persist()`. Migration: missing keys → defaults above.

### 2.4 Sync plugin

Update `src/plugins/settings-sync.client.ts` to also set:

- `document.documentElement.setAttribute('data-skin', skin)`
- `document.documentElement.setAttribute('data-palette', palette)`

Keep `data-theme` / `data-density`. Ensure theme still mirrors `@nuxtjs/color-mode` if Topbar writes there — do not leave two sources of truth; prefer settings store as SoT and sync color-mode preference when theme changes (document the chosen sync direction in a short comment).

### 2.5 Extending skins later

Document in `doc/guides/DESIGN_SYSTEM.md` (or new `doc/guides/ATLAS_SKINS.md`):

1. Add `SkinId` union member.
2. Add `_myskin.scss` pack implementing full semantic contract.
3. Register label in Settings UI.
4. Optional: skin-specific layout modifiers via `html[data-skin="myskin"] .dashboard-shell { … }` only.

---

## 3. File map (create / modify)

### Create

| Path | Responsibility |
|------|----------------|
| `src/assets/scss/tokens/_semantic-contract.scss` | Required CSS var names + safe fallbacks |
| `src/assets/scss/tokens/skins/_nexus.scss` | Extract current Nexus look as pack |
| `src/assets/scss/tokens/skins/_atlas.scss` | Atlas Hybrid Command pack |
| `src/assets/scss/tokens/palettes/_*.scss` | Accent packs |
| `src/stores/settings-store/settings-store.types.ts` | Move types out of `index.ts` (project rule) |
| `src/composables/useAppearance/index.ts` | Thin API: skin/theme/palette + setters (optional but recommended for UI) |
| `doc/guides/ATLAS_SKINS.md` | How to add skins/palettes |
| `test/unit/stores/settings-store.appearance.test.ts` | Persist/migrate skin+palette |
| `test/unit/composables/useAppearance.test.ts` | If composable added |

### Modify (core)

| Path | Change |
|------|--------|
| `src/stores/settings-store/index.ts` | skin/palette state + actions |
| `src/plugins/settings-sync.client.ts` | sync data-skin / data-palette |
| `src/components/ui/SettingsDrawer/*` | Skin + Palette pickers |
| `src/assets/scss/global.scss` | Import packs; compose selectors |
| `src/assets/scss/variables.scss` | Align with contract; avoid dual sources of color truth |
| `src/components/layout/DashboardLayout/*` | Atlas shell: dark rail metrics, content canvas, bento-friendly gaps |
| `src/components/layout/Topbar/*` | Atlas chrome |
| `src/components/global/GameNav/*` | Rail style under Atlas |
| `src/components/ui/RoundedPanel/*`, `GameButton/*`, `Tabs/*`, `ProgressBar/*`, `Modal/*`, `Toast*`, `SettingsDrawer/*`, `CommandPalette/*` | Consume tokens only; remove hardcoded theme colors where present |
| `src/pages/index.vue` + start page styles | Atlas-aware landing (still Game Life brand) |
| All `src/pages/game/**` + related `src/components/pages/**` | Full UI pass under shared tokens + Atlas layout patterns |
| `doc/guides/DESIGN_SYSTEM.md` | Point to dual-skin model; link Atlas guide |
| `.cursor/rules/40-styles.mdc` | If still says inline `<style scoped>`, align note with separate SCSS rule (fix inconsistency while touching styles docs) |

### Pages in full UI pass (must each look intentionally Atlas when skin=atlas)

| Route | Page file | Primary page components |
|-------|-----------|-------------------------|
| `/` | `src/pages/index.vue` | start screen |
| `/game` | `src/pages/game/index.vue` | dashboard: Profile/Stats/DayPlanner/ActivityLog/HomePreview |
| `/game/actions` | `…/actions/index.vue` | ActionCard / ActionTabs |
| `/game/activity` | `…/activity/index.vue` | activity list/filter |
| `/game/education` | `…/education/index.vue` | education modules |
| `/game/events` | `…/events/index.vue` | events |
| `/game/finance` | `…/finance/index.vue` | finance panels |
| `/game/home` | `…/home/index.vue` | home |
| `/game/selfdev` | `…/selfdev/index.vue` | selfdev |
| `/game/shop` | `…/shop/index.vue` | shop |
| `/game/skills` | `…/skills/index.vue` | skills |
| `/game/work` | `…/work/index.vue` | work/career |

---

## 4. Implementation units (ordered)

### Task 1: Branch + appearance state foundation

**Files:** settings store, types, settings-sync plugin, unit tests.

- [ ] Create branch `feature/atlas-design-system` from current working base.
- [ ] Extract settings types into `settings-store.types.ts`; re-export from store.
- [ ] Add `skin`, `palette` with defaults + localStorage merge migration.
- [ ] Add `setSkin` / `setPalette`; when skin switches, optionally auto-suggest default palette (`nexus→emerald`, `atlas→cobalt`) **only if** user has not explicitly chosen a palette flag — simplest MVP: always set recommended default on skin change (document in Settings hint).
- [ ] Sync `data-skin` / `data-palette` in `settings-sync.client.ts` (`immediate: true`).
- [ ] Tests: load legacy settings without skin → defaults; setSkin persists; setPalette persists.

**Done when:** toggling store attributes changes `<html>` attributes in manual browser check.

---

### Task 2: Semantic contract + Nexus extraction + Atlas pack + palettes

**Files:** `src/assets/scss/tokens/**`, wire into `global.scss` / `nuxt.config.ts` if needed.

- [ ] Define the semantic contract (minimum set):

```text
--color-bg-app, --color-bg-page, --color-bg-surface, --color-bg-surface-2,
--color-bg-card, --color-bg-sidebar, --color-bg-header, --color-bg-elevated,
--color-text-primary, --color-text-secondary, --color-text-tertiary,
--color-text-on-primary, --color-text-on-sidebar,
--color-border, --color-border-subtle,
--color-action-primary, --color-action-primary-hover, --color-action-primary-active,
--color-action-secondary, --color-action-danger,
--color-status-success, --color-status-warning, --color-status-danger, --color-status-info,
--shadow-card, --shadow-popover, --shadow-button-hover,
--radius-sm, --radius-md, --radius-lg, --radius-card, --radius-rail,
--size-sidebar, --size-sidebar-collapsed, --size-header-height,
--space-card-padding, --space-section-gap, --font-family-ui, --font-family-metric
```

- [ ] Move current look into `_nexus.scss` (behavior must match today’s Nexus when `data-skin=nexus`).
- [ ] Implement `_atlas.scss` Hybrid Command surfaces/radii/shadows/sidebar tokens.
- [ ] Implement four palette files overriding action/brand/focus only.
- [ ] Ensure `html[data-theme=dark]` continues to work for both skins (write explicit atlas-dark block if cascade is insufficient).
- [ ] Manual check: flash-free theme/skin switch on `/game`.

**Done when:** Nexus visually unchanged at default settings; Atlas + cobalt visibly different on blank shell backgrounds.

---

### Task 3: Settings UI — Skin / Theme / Palette

**Files:** `SettingsDrawer.vue` + `.scss`.

- [ ] Section **Дизайн-система**: segmented `Nexus` / `Atlas`.
- [ ] Keep Theme light/dark.
- [ ] Section **Палитра**: 4 swatch buttons (color dots + name); `aria-pressed`.
- [ ] Short hints: skin = layout/chrome language; palette = accent only.
- [ ] Update “О программе” line (remove stale “Linear-эстетика only”; mention dual DS).

**Done when:** user can switch all three axes without reload; prefs survive refresh.

---

### Task 4: Shell redesign under Atlas (highest A/B signal)

**Files:** `DashboardLayout`, `GameLayout`, `Topbar`, `GameNav`, shared page SCSS tokens.

- [ ] Atlas: dark rail sidebar (`--color-bg-sidebar`), content area uses `--color-bg-page`.
- [ ] Active nav: filled rounded rect / inset highlight (not Nexus soft emerald chip clone).
- [ ] Topbar: Atlas spacing, optional metric strip slot later; keep title + settings entry points.
- [ ] Mobile: bottom nav must adopt Atlas tokens (do not leave Nexus-colored bar).
- [ ] Introduce layout helper classes if useful, e.g. `.bento-grid`, `.bento-tile`, `.bento-tile--hero`, `.bento-tile--metrics` in global or layout SCSS — **only token-driven**.

**Done when:** side-by-side Nexus vs Atlas shell feels like two products sharing routes.

---

### Task 5: UI primitives token hygiene

**Files:** all `src/components/ui/**` SCSS/Vue listed in file map.

- [ ] Replace remaining raw hex / slate literals with semantic vars (especially overlays — may use `color-mix` / alpha on `--color-neutral` if introduced, or keep rgba derived from tokens).
- [ ] Buttons, panels, tabs, progress, modals, toasts, tooltips, selects: verify both skins × both themes × at least two palettes.
- [ ] Do **not** rename `GameButton` → `UiButton` in this branch unless trivial; naming migration is optional and must not block A/B.

**Done when:** no primitive “breaks” (white-on-white / invisible borders) in Atlas dark/light.

---

### Task 6: Home dashboard Full UI pass (`/game`)

**Files:** `src/pages/game/index.vue`, `src/pages/game/index.scss` (if any), dashboard components under `src/components/pages/dashboard/**`.

Target Atlas composition (adapt to existing widgets, do not invent domain features):

1. **Hero / identity tile** — ProfileCard (name, job, age/time).
2. **Vitals row** — StatsCard as metric tiles (hunger/energy/stress/health) with strong numbers.
3. **Ops planner** — DayPlannerPanel as primary work surface (CMS “queue”).
4. **Activity feed** — ActivityLogCard as stream.
5. **Context tile** — HomePreview / secondary info.

- [ ] Re-grid with bento spans; avoid uniform 1×1 boredom.
- [ ] Tighten visual hierarchy: one primary CTA (“Прожить день” / plan confirm) visually dominant.
- [ ] Ensure Nexus path still usable (skin switch should not remove widgets).

**Done when:** `/game` is the poster child for A/B screenshots.

---

### Task 7: Remaining game pages Full UI pass

For each route in the table above:

- [ ] Apply Atlas spacing, card chrome, page headers, empty states, lists.
- [ ] Prefer shared patterns: page title block, filter chips, metric header, primary list/grid.
- [ ] Career/work and finance should feel “ops panels”; education/skills like “catalog modules”; events like “inbox/queue”.
- [ ] Start page `/` redesigned enough that first paint also differs under Atlas.

**Suggested order:** work → finance → actions → education → skills → events → activity → shop → home → selfdev → start page.

**Done when:** every listed route has an intentional Atlas presentation (not merely recolored Nexus).

---

### Task 8: Motion + polish (Atlas only where helpful)

- [ ] 200–300ms transitions on skin/theme/palette changes for background/color where cheap (`transition: background-color, color, border-color`).
- [ ] Avoid gratuitous animation noise; 2–3 intentional motions max on dashboard (hover elevation, active nav, plan confirm feedback).
- [ ] Check focus rings use `--color-action-primary`.

---

### Task 9: Docs + A/B checklist

- [ ] Write `doc/guides/ATLAS_SKINS.md` (axes, how to add skin/palette, screenshot checklist).
- [ ] Update `doc/guides/DESIGN_SYSTEM.md` intro: Nexus + Atlas coexistence.
- [ ] Add short note to `doc/README.md` guides list if needed.
- [ ] Fill A/B verification section below and attach screenshots in PR description (not necessarily committed binaries).

---

## 5. Testing strategy

### Automated

- Unit: settings migration + setters (`test/unit/stores/settings-store.appearance.test.ts`).
- Optional: composable tests.
- Do not add flaky visual snapshot suite in MVP.
- Run existing unit tests touched by imports; `npm run typecheck` before calling done.

### Manual A/B matrix (required)

For **Nexus** and **Atlas** × **light/dark** × palettes `emerald` & `cobalt` at minimum:

| Check | Pass criteria |
|-------|---------------|
| Settings switch | Instant, persists after reload |
| `/game` | Clear structural difference Atlas vs Nexus |
| Rail/nav | Atlas dark rail readable; active state obvious |
| Day planner | Usable; primary action visible |
| Modals/toasts | Readable, correct surfaces |
| Mobile width &lt; 768 | Bottom nav + stacked bento usable |
| No game logic regressions | Plan day / work / education still function |

### Regression guard

- Default for existing players: `skin=nexus` unless product decides feature-branch default `atlas` for testers — **on feature branch default `atlas` is OK**; before merge to main, confirm default strategy with owner (recommend: default `nexus`, testers switch to `atlas`).

---

## 6. Suggested commit slices (for the implementing agent)

1. `feat(settings): add skin and palette appearance axes`
2. `feat(styles): add semantic skin packs for nexus and atlas`
3. `feat(settings-ui): expose skin and palette controls`
4. `feat(layout): atlas hybrid-command shell and navigation`
5. `refactor(ui): drive primitives with semantic tokens`
6. `feat(dashboard): atlas bento home layout`
7. `feat(ui): atlas pass for remaining game pages`
8. `docs: atlas skins guide and design system notes`

Do not commit unless the user asks; if they ask, follow repo commit rules.

---

## 7. Risks and mitigations

| Risk | Mitigation |
|------|------------|
| Scope explosion on “full UI pass” | Follow page order; each page must ship usable Atlas, polish later |
| Hardcoded colors left behind | Grep hex in `src/components` / `src/pages` before finish; fix stragglers |
| Dark rail + dark theme contrast fail | Explicit `atlas+dark` token block; manual contrast check |
| Settings desync with color-mode | Single SoT + sync plugin comment + test manually via Topbar & Drawer |
| Nexus regressions | Task 2 acceptance: Nexus default must match pre-branch look |

---

## 8. Definition of Done

- [ ] Feature branch exists with runtime Skin/Theme/Palette controls.
- [ ] Atlas Hybrid Command is unmistakably different from Nexus on shell + `/game` + all game routes.
- [ ] Light/dark work for both skins; ≥4 palettes selectable.
- [ ] Adding a fifth palette requires only a SCSS pack + union type + Settings swatch (proven by docs).
- [ ] Unit tests for appearance persistence pass; typecheck passes.
- [ ] Docs updated; this plan’s checkboxes can be marked by implementer as they go.

---

## 9. Handoff notes for a simpler agent

1. Start at **Task 1**, do not jump to page restyles before tokens/skin attributes exist.
2. When unsure visually, prefer **more structural difference** (grid, rail, hierarchy) over more decoration.
3. Do not change domain commands/stores for gameplay.
4. Keep Russian labels consistent with existing Settings tone.
5. If blocked by a huge page, finish shell + dashboard first — they carry most A/B signal — then continue page queue.
6. Ask the user before merging to `main` or changing production default skin.

---

## 10. Open execution-time choices (do not block start)

- Exact hex values inside Atlas pack may be tuned ± during Task 2/4 while preserving Hybrid Command character.
- Whether feature-branch **defaults** to `atlas` for internal testers vs `nexus` — confirm once before wide A/B.
- Optional later skins (`midnight-ops`, `soft-wellness`) are out of MVP but architecture must allow them.
