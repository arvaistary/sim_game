# Baseline: Project Integrity Audit

- ID: `AUD-20260716-01`
- Captured at: `2026-07-16T07:31:30.160Z`
- Repository revision: `aae7746062744ca6992d6b7ab208b49ee623e359`
- Status: `complete` (baseline failures remediated and closure gates verified)
- Dirty paths: pre-existing work-item, Spec Kit memory/script changes, audit tooling, and audit tests; preserved as required.
- Environment: Node `v24.13.0`; npm command unavailable through child-process probe; Windows; Nuxt `4.4.2`; Vitest `4.1.4`; Playwright `1.50.1`; Chromium installed.

## Route inventory

`/`, `/game`, `/game/actions`, `/game/activity`, `/game/education`, `/game/events`, `/game/finance`, `/game/home`, `/game/selfdev`, `/game/shop`, `/game/skills`, `/game/work`.

## Nitro endpoint inventory

`/api/game/actions/execute`, `/api/game/career/track`, `/api/game/finance/overview`, `/api/game/init`, `/api/game/investments`, `/api/game/state`, `/api/game/sync`.

## Layer inventory

`domain`, `application`, `infrastructure`, `server`, `store`, `composable`, `component`, `page`.

## Scenario inventory

`character-creation`, `core-loop-action`, `time-advance`, `stats-projection`, `recovery-home`, `work-shift`, `finance-overview`, `investment-collection`, `education-progress`, `skills-training`, `housing-shop`, `event-queue`, `save-load`, `offline-sync`.

## Reproduction

Run `npm run audit:integrity`; then run commands in `quickstart.md`. Audit command is non-mutating and reports repository identity, dirty paths, environment, and discovered inventories.
