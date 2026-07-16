# Audit Matrix

## Route coverage

| ID | Kind | Subject | Mode | Viewport | Expected source | Result | Evidence | Findings |
|---|---|---|---|---|---|---|---|---|
| R-001 | route | / | all | 390x844 | spec.md | pass | GR-007 | — |
| R-002 | route | / | all | 768x1024 | spec.md | pass | GR-007 | — |
| R-003 | route | / | all | 1440x900 | spec.md | pass | GR-007 | — |
| R-004 | route | /game | all | 390x844 | spec.md | pass | GR-007 | — |
| R-005 | route | /game | all | 768x1024 | spec.md | pass | GR-007 | — |
| R-006 | route | /game | all | 1440x900 | spec.md | pass | GR-007 | — |
| R-007 | route | /game/actions | all | 390x844 | spec.md | pass | GR-007 | — |
| R-008 | route | /game/actions | all | 768x1024 | spec.md | pass | GR-007 | — |
| R-009 | route | /game/actions | all | 1440x900 | spec.md | pass | GR-007 | — |
| R-010 | route | /game/activity | all | 390x844 | spec.md | pass | GR-007 | — |
| R-011 | route | /game/activity | all | 768x1024 | spec.md | pass | GR-007 | — |
| R-012 | route | /game/activity | all | 1440x900 | spec.md | pass | GR-007 | — |
| R-013 | route | /game/education | all | 390x844 | spec.md | pass | GR-007 | — |
| R-014 | route | /game/education | all | 768x1024 | spec.md | pass | GR-007 | — |
| R-015 | route | /game/education | all | 1440x900 | spec.md | pass | GR-007 | — |
| R-016 | route | /game/events | all | 390x844 | spec.md | pass | GR-007 | — |
| R-017 | route | /game/events | all | 768x1024 | spec.md | pass | GR-007 | — |
| R-018 | route | /game/events | all | 1440x900 | spec.md | pass | GR-007 | — |
| R-019 | route | /game/finance | all | 390x844 | spec.md | pass | GR-007 | — |
| R-020 | route | /game/finance | all | 768x1024 | spec.md | pass | GR-007 | — |
| R-021 | route | /game/finance | all | 1440x900 | spec.md | pass | GR-007 | — |
| R-022 | route | /game/home | all | 390x844 | spec.md | pass | GR-007 | — |
| R-023 | route | /game/home | all | 768x1024 | spec.md | pass | GR-007 | — |
| R-024 | route | /game/home | all | 1440x900 | spec.md | pass | GR-007 | — |
| R-025 | route | /game/selfdev | all | 390x844 | spec.md | pass | GR-007 | — |
| R-026 | route | /game/selfdev | all | 768x1024 | spec.md | pass | GR-007 | — |
| R-027 | route | /game/selfdev | all | 1440x900 | spec.md | pass | GR-007 | — |
| R-028 | route | /game/shop | all | 390x844 | spec.md | pass | GR-007 | — |
| R-029 | route | /game/shop | all | 768x1024 | spec.md | pass | GR-007 | — |
| R-030 | route | /game/shop | all | 1440x900 | spec.md | pass | GR-007 | — |
| R-031 | route | /game/skills | all | 390x844 | spec.md | pass | GR-007 | — |
| R-032 | route | /game/skills | all | 768x1024 | spec.md | pass | GR-007 | — |
| R-033 | route | /game/skills | all | 1440x900 | spec.md | pass | GR-007 | — |
| R-034 | route | /game/work | all | 390x844 | spec.md | pass | GR-007 | — |
| R-035 | route | /game/work | all | 768x1024 | spec.md | pass | GR-007 | — |
| R-036 | route | /game/work | all | 1440x900 | spec.md | pass | GR-007 | — |

## Scenario and quality coverage

| ID | Kind | Subject | Mode | Viewport | Expected source | Result | Evidence | Findings |
|---|---|---|---|---|---|---|---|---|
| S-001 | scenario | character-creation | spa | not-applicable | spec.md | pass | mode-parity.test.ts | — |
| S-002 | scenario | character-creation | server | not-applicable | spec.md | pass | mode-parity.test.ts | — |
| S-003 | scenario | character-creation | hybrid | not-applicable | spec.md | pass | mode-parity.test.ts | — |
| S-004 | scenario | core-loop-action | spa | not-applicable | spec.md | pass | mode-parity.test.ts | — |
| S-005 | scenario | core-loop-action | server | not-applicable | spec.md | pass | mode-parity.test.ts | — |
| S-006 | scenario | core-loop-action | hybrid | not-applicable | spec.md | pass | mode-parity.test.ts | — |
| S-007 | scenario | time-advance | spa | not-applicable | spec.md | pass | mode-parity.test.ts | — |
| S-008 | scenario | time-advance | server | not-applicable | spec.md | pass | mode-parity.test.ts | — |
| S-009 | scenario | time-advance | hybrid | not-applicable | spec.md | pass | mode-parity.test.ts | — |
| S-010 | scenario | stats-projection | spa | not-applicable | spec.md | pass | mode-parity.test.ts | — |
| S-011 | scenario | stats-projection | server | not-applicable | spec.md | pass | mode-parity.test.ts | — |
| S-012 | scenario | stats-projection | hybrid | not-applicable | spec.md | pass | mode-parity.test.ts | — |
| S-013 | scenario | recovery-home | spa | not-applicable | spec.md | pass | mode-parity.test.ts | — |
| S-014 | scenario | recovery-home | server | not-applicable | spec.md | pass | mode-parity.test.ts | — |
| S-015 | scenario | recovery-home | hybrid | not-applicable | spec.md | pass | mode-parity.test.ts | — |
| S-016 | scenario | work-shift | spa | not-applicable | spec.md | pass | mode-parity.test.ts | — |
| S-017 | scenario | work-shift | server | not-applicable | spec.md | pass | mode-parity.test.ts | — |
| S-018 | scenario | work-shift | hybrid | not-applicable | spec.md | pass | mode-parity.test.ts | — |
| S-019 | scenario | finance-overview | spa | not-applicable | spec.md | pass | mode-parity.test.ts | — |
| S-020 | scenario | finance-overview | server | not-applicable | spec.md | pass | mode-parity.test.ts | — |
| S-021 | scenario | finance-overview | hybrid | not-applicable | spec.md | pass | mode-parity.test.ts | — |
| S-022 | scenario | investment-collection | spa | not-applicable | spec.md | pass | mode-parity.test.ts | — |
| S-023 | scenario | investment-collection | server | not-applicable | spec.md | pass | mode-parity.test.ts | — |
| S-024 | scenario | investment-collection | hybrid | not-applicable | spec.md | pass | mode-parity.test.ts | — |
| S-025 | scenario | education-progress | spa | not-applicable | spec.md | pass | mode-parity.test.ts | — |
| S-026 | scenario | education-progress | server | not-applicable | spec.md | pass | mode-parity.test.ts | — |
| S-027 | scenario | education-progress | hybrid | not-applicable | spec.md | pass | mode-parity.test.ts | — |
| S-028 | scenario | skills-training | spa | not-applicable | spec.md | pass | mode-parity.test.ts | — |
| S-029 | scenario | skills-training | server | not-applicable | spec.md | pass | mode-parity.test.ts | — |
| S-030 | scenario | skills-training | hybrid | not-applicable | spec.md | pass | mode-parity.test.ts | — |
| S-031 | scenario | housing-shop | spa | not-applicable | spec.md | pass | mode-parity.test.ts | — |
| S-032 | scenario | housing-shop | server | not-applicable | spec.md | pass | mode-parity.test.ts | — |
| S-033 | scenario | housing-shop | hybrid | not-applicable | spec.md | pass | mode-parity.test.ts | — |
| S-034 | scenario | event-queue | spa | not-applicable | spec.md | pass | mode-parity.test.ts | — |
| S-035 | scenario | event-queue | server | not-applicable | spec.md | pass | mode-parity.test.ts | — |
| S-036 | scenario | event-queue | hybrid | not-applicable | spec.md | pass | mode-parity.test.ts | — |
| S-037 | scenario | save-load | spa | not-applicable | spec.md | pass | mode-parity.test.ts | — |
| S-038 | scenario | save-load | server | not-applicable | spec.md | pass | mode-parity.test.ts | — |
| S-039 | scenario | save-load | hybrid | not-applicable | spec.md | pass | mode-parity.test.ts | — |
| S-040 | scenario | offline-sync | spa | not-applicable | spec.md | pass | offline-sync-parity.test.ts | — |
| S-041 | scenario | offline-sync | server | not-applicable | spec.md | pass | offline-sync-parity.test.ts | — |
| S-042 | scenario | offline-sync | hybrid | not-applicable | spec.md | pass | offline-sync-parity.test.ts | — |
| A-001 | architecture | domain/application boundaries | not-applicable | not-applicable | constitution | pass | integrity-boundaries.test.ts | — |
| A-002 | api | Nitro game endpoints | not-applicable | not-applicable | spec.md | pass | game-api-contract.test.ts | — |
| Q-001 | quality-gate | ESLint | not-applicable | not-applicable | quickstart.md | fail | GR-002 | F-001 |
| Q-002 | quality-gate | Stylelint | not-applicable | not-applicable | quickstart.md | fail | GR-003 | F-002 |
| Q-003 | quality-gate | rules audit | not-applicable | not-applicable | quickstart.md | fail | GR-004 | F-003 |
