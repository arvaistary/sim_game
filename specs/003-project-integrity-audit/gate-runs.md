# Gate Runs

| Run ID | Gate | Command | Exit | Result | Evidence | Findings |
|---|---|---|---:|---|---|---|
| GR-001 | typecheck | `npm run typecheck` | 0 | pass | terminal output 2026-07-16 | — |
| GR-002 | eslint | `npm run lint` | 0 | pass | RC-001; 3 non-blocking Vue warnings | F-001 |
| GR-003 | stylelint | `npm run lint:style` | 0 | pass | RC-002; zero Stylelint errors | F-002 |
| GR-004 | rules-audit | `npm run rules:audit` | 0 | pass | RC-003; baseline-delta policy, zero new rule/file violations | F-003 |
| GR-005 | vitest | `npm test` | 0 | pass | 34 files, 224 passed, 5 todo | — |
| GR-006 | build | `npm run build` | 0 | pass | Nuxt production build complete | — |
| GR-007 | browser (superseded baseline) | `npm run test:e2e:integrity` | timeout | blocked | Historical run reported 60 completed test cases but did not return exit code 0; user-recorded timeout at 132.5s | F-004 |
| GR-008 | browser lifecycle closure A | `npm run test:e2e:integrity` | 0 | pass | 2026-07-16T10:35:18.4859382Z to 2026-07-16T10:35:45.1305667Z; 26,590ms; 60 passed; 390x844, 768x1024, 1440x900; runner cleanup complete | F-004 |
| GR-009 | browser lifecycle closure B | `npm run test:e2e:integrity` | 0 | pass | 2026-07-16T10:36:08.4667144Z to 2026-07-16T10:36:34.6660003Z; 26,147ms; 60 passed; 390x844, 768x1024, 1440x900; runner cleanup complete | F-004 |
| GR-010 | browser lifecycle regression | `npm run test:e2e:integrity:regression` | 0 | pass | Vitest 4.1.4: 2 tests passed in 23.48s; real command exit/summary case and bounded hanging-child case | F-004 |

GR-001 through GR-006 remain 003 audit evidence. GR-007 is retained as superseded historical evidence and is not a passing closure claim. GR-008 through GR-010 are 004 revalidation facts. Build output generated during revalidation is classified separately in closure-report.md.
