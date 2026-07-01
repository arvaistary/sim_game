# Audit Analysis: Explicit Type Annotation Violations

> **Статус:** ⏸ Заморожено
> **Дата:** 2026-06-02
> **Примечание:** Документ перенесён в архив. Аудит нарушений типизации — для исторической справки.

## Summary

**Total violations:** 552 across all files  
**Rule:** `typing/explicit-variable-annotation` — local variables must have explicit type annotations

## Top 10 Files by Violation Count

### 1. `src/components/pages/education/EducationLevel/EducationLevel.vue` — 69 violations

**Pattern:** Vue `computed` property declarations missing return types, plus object destructuring and typecast assignments.

**Sample line numbers and code:**

- **Line 186**: `const currentAge = computed(() => store.age ?? 0)`
- **Line 187**: `const currentAgeGroup = computed(() => getAgeGroup(currentAge.value))`
- **Line 189**: `const showTimeHints = computed(() => true)`
- **Line 190**: `const showCognitiveHints = computed(() => currentAgeGroup.value >= AgeGroup.TEEN)`
- **Line 192**: `const educationLevel = computed(() => { ... })`
- **Line 193**: `const edu: boolean = store.education as unknown as Record<string, unknown> | null` ← **wrong type annotation** (boolean ≠ actual type)
- **Line 201**: `const courses = edu?.activeCourses as ActiveCourse[] | null`
- **Line 243**: `const type: string = activeCourse.value?.type?.toLowerCase() ?? ''`
- **Line 398**, **Line 401**, **Line 417**: Additional `computed` declarations (reading Ref<number> etc.)
- **Line 456-459**, **Line 462**, **Line 552**: More `computed` properties and destructured variables

**Common initializers:**
- `computed(() => ...)` — entire computed expression (object destructuring, refs, primitives)
- `as unknown as ...` typecast chains
- Object/array destructuring: `const { ... } = ...`
- Template literals with ternary operators

---

### 2. `src/domain/balance/utils/skill-ui-explainability.ts` — 37 violations

**Pattern:** Function-call results, object destructuring, and arithmetic/numeric literals without explicit types.

**Sample line numbers and code:**

- **Line 40**: `const effects = getSkillEffectsForUi(skill.key, level)`
- **Line 75**: `const skill = getSkillByKey(skillKey)`
- **Line 76**: `const config = getSkillProgressionConfig()`
- **Line 78**: `const factors: Array<FactorItem> = []` ← HAS annotation but line itself flagged (start of function/statement?)
- **Line 80**: `let totalMultiplier: number = 1.0`
- **Line 84**: `const ageMultiplier = getAgeLearningMultiplier(context.age)`
- **Line 98**: `const methodMultiplier = getLearningMethodMultiplier(context.method as any)`
- **Line 112**: `const comfortMultiplier = getComfortZoneMultiplier(context.consecutiveUses)`
- **Line 126**: `const burnoutMultiplier = getBurnoutMultiplier(context.weeklyLearningHours).multiplier`
- **Line 150**: `const difficultyMultiplier = getDifficultyMultiplier(baseXpGain, finalXpGain)`
- **Line 162**: `const levelChange = Math.floor(finalXpGain / 10) - Math.floor(baseXpGain / 10)`
- **Line 196**: `const effects = getSkillEffectsForUi(skill.key, level)`
- **Line 203**: `const category = getModifierCategory(effect.modifierKey)`
- **Line 271**: `const ageGroup = age <= 18 ? 'молодой возраст' : age <= 35 ? 'зрелый возраст' : 'старший возраст'`
- **Line 279**: `const multipliers = { work: 2.2, ... }` (object literal)
- **Line 300**: `const name: boolean = methodNames[method] || method` ← **wrong type** (string, not boolean)
- **Line 301**: `const percent = (multiplier - 1) * 100`
- **Line 308**: `const penalty = (consecutiveUses - 5) * 0.15`
- **Line 315**: `const penalty = (1 - multiplier) * 100`
- **Line 339**: `const penalty = (1 - multiplier) * 100`
- **Line 348**: `const baseLevel = Math.floor(baseXp / 10)`
- **Line 349**: `const finalLevel = Math.floor(finalXp / 10)`
- **Line 382-383**: More computed properties and destructuring

**Common initializers:**
- Utility function calls (getSkillEffectsForUi, getSkillByKey, getAgeLearningMultiplier, etc.)
- Math operations: `Math.floor(...)`, arithmetic expressions
- Object literals: `{ work: 2.2, practice: 1.5, ... }`
- String ternary expressions
- `Object.entries()` and destructuring: `const [category, effects] = ...`

---

### 3. `src/domain/balance/utils/skill-system.ts` — 30 violations

**Pattern:** Computed numeric values and destructured assignments from function returns.

**Sample line numbers and code:**

- **Line 59**: `const boundedXp = Math.max(0, Math.min(xp, MAX_XP))`
- **Line 82**: `const penalty = (consecutiveUses - 5) * 0.15`
- **Line 136**: `const ageMultiplier = getAgeLearningMultiplier(age)`
- **Line 137**: `const methodMultiplier = getLearningMethodMultiplier(method)`
- **Line 138**: `const consecutiveUses = updateConsecutiveUses(currentState, currentTimestamp)`
- **Line 139**: `const comfortZoneMultiplier = getComfortZoneMultiplier(consecutiveUses)`
- **Line 140**: `const { multiplier: burnoutMultiplier, stressBonus } = getBurnoutMultiplier(...)`
- **Line 145**: `const newXp = Math.min(MAX_XP, currentState.xp + gainedXp)`
- **Line 146**: `const newLevel = calculateLevelFromXp(newXp)`
- **Line 165**: `const daysSinceUsed: number = currentTimestamp - currentState.lastUsedAt` ← has annotation but flagged
- **Line 171**: `const decayDays: number = daysSinceUsed - 30`
- **Line 174**: `const maxAllowedXp: number = currentState.peakXp * 0.7`
- **Line 175**: `const theoreticalDecayedXp: number = currentState.xp * Math.pow(1 - decayRatePerDay, decayDays)`
- **Line 199**: Object literal `{ xp: 0, level: 0, ... }` in return

**Common initializers:**
- Math expressions with `Math.max/min/floor/round`
- Function return destructuring: `const { multiplier, stressBonus } = ...`
- Chained method calls and arithmetic
- Object literals for return values

---

### 4. `src/components/pages/education/ProgramList/ProgramList.vue` — 25 violations

**Pattern:** Computed properties, type assertions, destructuring arrays and objects.

**Sample line numbers and code:**

- **Line 97**: `const allPrograms = EDUCATION_PROGRAMS as unknown as EducationProgram[]`
- **Line 99**: `const currentAge = computed(() => timeStore.currentAge ?? store.age ?? 18)`
- **Line 100**: `const currentAgeGroup = computed(() => getAgeGroup(currentAge.value))`
- **Line 103**: `const minAgeGroup = program.minAgeGroup ?? AgeGroup.TEEN` (inside `isAgeOk`)
- **Line 138**: `const activeCourseId = computed(() => { ... const education: boolean = store.education as ... })`
- **Line 141**: `const activeCourses = education?.activeCourses as ActiveCourse[] | undefined`
- **Line 146-149**: `completedPrograms` computed with destructuring
- **Line 211**: `const aAvailable = isProgramAvailable(a) ? 0 : 1`
- **Line 212**: `const bAvailable = isProgramAvailable(b) ? 0 : 1`
- **Line 218**: `const coursePrograms = computed(() => allPrograms.filter(...))`
- **Line 224**: `const sortedCoursePrograms = computed(() => sortByAvailability(coursePrograms.value))`
- **Line 226**: `const sortedOwnedBooks = computed(() => { const ownedBooks: boolean = allPrograms.filter(...) })`
- **Line 254**: `const check = store.canStartEducationProgramWithReason(program.id)`
- **Line 261**: `const result = store.startEducationProgram(program.id)`

**Common initializers:**
- `as unknown as` typecast chains
- `computed(() => ...)` expressions
- Ternary operators for sorting/comparison
- Store method calls: `store.canStartEducationProgramWithReason(...)`, `store.startEducationProgram(...)`
- Array methods: `.filter()`, `.map()`
- Object spread inside computed: `{ ...source, steps: ... }`

---

### 5. `src/composables/useActivityLog/utils/activity-log-formatters.ts` — 22 violations

**Pattern:** String manipulations, array operations, destructured object/array entries, type assertions.

**Sample line numbers and code:**

- **Line 9**: `const normalized = actionId.trim().toLowerCase()`
- **Line 16**: `const trimmed = title.trim()`
- **Line 22**: `const actionLogMatch = trimmed.match(/^📝\s+([a-z0-9]+(?:_[a-z0-9]+)+)$/i)`
- **Line 32**: `const rounded = Number(value.toFixed(fractionDigits))`
- **Line 44**: `const skill = getSkillByKey(key)`
- **Line 52**: `const sign = value > 0 ? '+' : ''`
- **Line 61**: `const statChanges = metadata.statChanges`
- **Line 62**: `const skillChanges = metadata.skillChanges`
- **Line 63**: `const moneyDelta = metadata.moneyDelta`
- **Line 64**: `const hoursSpent = metadata.hoursSpent`
- **Line 98**: `const chunks: boolean = raw.split(',').map(...)` ← **wrong type** (string[], not boolean)
- **Line 104**: `const match = chunk.match(/^([a-z0-9_]+)\s*:\s*([+-]?\d+(?:\.\d+)?)$/i)`
- **Line 109**: `const key: string = match[1] ?? ''`
- **Line 120**: `const rawTitle = entry?.title ? String(entry.title) : ''`
- **Line 126**: `const actionId: boolean = metadataActionId || extractedActionId` ← **wrong type** (string, not boolean)
- **Line 138**: `const rawDescription = entry?.description ? String(entry.description) : ''`

**Common initializers:**
- String method chains: `.trim()`, `.toLowerCase()`, `.match()`, `.split()`
- Type coercion: `Number(...)`, `String(...)`
- Object/array property access: `metadata.statChanges`, `entry?.title`
- Regex match results and array destructuring
- Ternary operators for nullish coalescing
- Function calls: `getSkillByKey(key)`

---

### 6. `src/stores/stats-store/index.ts` — 19 violations

**Pattern:** Pinia `ref()` and `computed()` declarations. Variables inside `computed` callbacks. Variables in loops.

**Sample line numbers and code:**

- **Line 16**: `const energy = ref(INITIAL_STATS.energy)`
- **Line 17**: `const health = ref(INITIAL_STATS.health)`
- **Line 18**: `const hunger = ref(INITIAL_STATS.hunger)`
- **Line 19**: `const stress = ref(INITIAL_STATS.stress)`
- **Line 20**: `const mood = ref(INITIAL_STATS.mood)`
- **Line 21**: `const physical = ref(INITIAL_STATS.physical)`
- **Line 23**: `const isFull = computed(() => energy.value >= 100 && health.value >= 100 && mood.value >= 100)`
- **Line 27**: `const isTired = computed(() => energy.value < 20)`
- **Line 28**: `const isStarving = computed(() => hunger.value > 80)`
- **Line 29**: `const isStressed = computed(() => stress.value > 80)`
- **Line 30**: `const isHappy = computed(() => mood.value > 70)`
- **Line 32**: `const totalNegative = computed(() => { const hungerPenalty = ... })`
- **Line 33**: `const hungerPenalty = hunger.value > 50 ? hunger.value - 50 : 0`
- **Line 34**: `const stressPenalty = stress.value > 50 ? stress.value - 50 : 0`
- **Line 43**: `const energy.value = clampStat(...)` (inside if block)
- **Line 46**: `const health.value = ...`
- **Line 49**: `const stress.value = ...`
- **Line 52**: `const mood.value = ...`
- **Line 55**: `const physical.value = ...`

**Common initializers:**
- `ref(INITIAL_STATS.xxx)` — ref initialization with object destructuring
- `computed(() => boolean)` — boolean expressions
- Ternary operators for stat calculations
- Assignment expressions inside conditionals
- `Object.entries()` loop destructuring: `for (const [key, delta] of Object.entries(changes))`

---

### 7. `src/domain/balance/utils/hourly-rates.ts` — 18 violations

**Pattern:** Function call results, numeric calculations, object destructuring, ternary assignments.

**Sample line numbers and code:**

- **Line 84**: `const baseFromAction: number = flatStatChanges[stat] ?? 0` ← has annotation but flagged
- **Line 91**: `const valueAfterPerStatModifier = value`
- **Line 93**: `let agingApplied: boolean = false`
- **Line 100**: `const valueAfterAging = value`
- **Line 101**: `const roundedBeforeSleepDebt = Math.round(value * 100) / 100`
- **Line 126**: `const agingMultiplier = getAgingPenalty(currentAge)`
- **Line 127**: `const sleepPenaltyRaw = getSleepDebtPenalty(sleepDebt)`
- **Line 128**: `const sleepPenalty = actionType === 'sleep' ? { ...sleepPenaltyRaw, energyPenalty: 0 } : sleepPenaltyRaw`
- **Line 136**: `const line = computeStatLine(stat, flatStatChanges, modifiers, agingMultiplier)`
- **Line 162**: `const agingMultiplier = getAgingPenalty(currentAge)` (in calculateStatChangesWithBreakdown)
- **Line 163**: `const sleepPenaltyRaw = getSleepDebtPenalty(sleepDebt)`
- **Line 164**: Multi-line ternary destructuring
- **Line 169**: `const statChanges = calculateStatChanges(...)`
- **Line 181**: `const line = computeStatLine(...)`
- **Line 182**: `let sleepDebtDelta: number = 0`
- **Line 189**: `const final = (statChanges[stat] ?? 0) as number`

**Common initializers:**
- Utility function calls: `getAgingPenalty()`, `getSleepDebtPenalty()`, `computeStatLine()`, `calculateStatChanges()`
- Math rounding: `Math.round(...)`
- Object spread with ternary: `actionType === 'sleep' ? { ...obj } : obj`
- Type assertions: `as number`
- Numeric default values with nullish coalescing

---

### 8. `src/pages/game/shop/index.vue` — 18 violations

**Pattern:** Array methods, computed properties, wrong type annotations on refs, ternary destructuring.

**Sample line numbers and code:**

- **Line 89**: `const tabs = [ { id: 'food', ... }, ... ] as const`
- **Line 97**: `const availableTabIds: boolean = tabs.map(tab => tab.id)` ← **wrong annotation** (should be array, not boolean)
- **Line 100**: `const value = typeof rawValue === 'string' ? rawValue : ''`
- **Line 105**: `const activeTab: boolean = ref<string>(normalizeTab(route.query.tab))` ← **wrong annotation** (ref<string>, not boolean)
- **Line 116**: `const allShopActions = getActionsByCategory('shop' as any)`
- **Line 119-120**: `function sortByAvailability(actions: any[]): any[] { return [...actions].sort(...) }`
- **Line 129**: `function getDisabledReason(action: any): string { ... }`
- **Line 142-145**: `const foodActions = computed(() => allShopActions.filter((a: any) => FOOD_ACTION_IDS.has(a.id)))`
- **Line 149-152**: `const learningActions = computed(() => ...)`
- **Line 156-159**: `const thingsActions = computed(() => ...)`
- **Line 163-166**: `const homeActions = computed(() => ...)`
- **Line 169-172**: `const sortedFoodActions = computed(() => sortByAvailability(foodActions.value))` etc.

**Common initializers:**
- Array literals: `tabs = [...]`
- `.map()` and `.filter()` calls
- `computed(() => ...)` with `any` type assertions
- Ternary (inline if) destructuring
- `useRouter()`, `useRoute()` composable results
- `ref<string>(...)` with generic type

---

### 9. `src/stores/education-store/index.ts` — 18 violations

**Pattern:** Pinia `ref()` and `computed()` declarations, some with incorrect `: boolean` annotation.

**Sample line numbers and code:**

- **Line 83**: `const school = ref('')`
- **Line 84**: `const institute = ref('')`
- **Line 85**: `const educationLevel: boolean = ref<EducationLevel>('none')` ← **annotation mismatch** (ref generic is correct, `: boolean` is wrong)
- **Line 86**: `const activeEducation: boolean = ref<ActiveEducation | null>(null)` ← same pattern
- **Line 87**: `const completedPrograms: boolean = ref<CompletedProgram[]>([])` ← same pattern
- **Line 88**: `const cognitiveLoad = ref(0)`
- **Line 89**: `const studyHoursSinceLastSleep = ref(0)`
- **Line 91**: `const educationRank = computed(() => EDUCATION_RANK[educationLevel.value])`
- **Line 92**: `const educationLabel = computed(() => RANK_LABELS[educationLevel.value])`
- **Line 94**: `const isStudying = computed(() => activeEducation.value !== null)`
- **Line 95**: `const hasEducation = computed(() => educationLevel.value !== 'none')`
- **Line 96**: `const completedCount = computed(() => completedPrograms.value.length)`
- **Line 149**: `const rank = educationRank.value`
- **Line 59**: `if (cognitive >= COGNITIVE_LOAD_CONSTANTS.HIGH) {` — this is an if-block, no variable; likely misreported line number
- **Line 70**: inside condition `if (cognitive < ...)` — seems like line numbers sometimes imprecise

**Common initializers:**
- `ref('')`, `ref(0)`, `ref<Type>(initial)` — Vue reactivity primitives
- `computed(() => ...)` returning values from store lookups
- Boolean expressions in computed
- Object property access via dot: `educationLevel.value`

---

### 10. `src/components/pages/dashboard/WorkButton/WorkButton.vue` — 17 violations

**Pattern:** Computed properties, type assertion chains, numeric calculations.

**Sample line numbers and code:**

- **Line 26**: `const isVisible = computed(() => isTabVisible('career'))`
- **Line 34-35**: `const isWorkInProgress: boolean = ref<boolean>(false)`, `const workSummary: boolean = ref<string>('')` ← wrong annotations (both are `: boolean` on ref values)
- **Line 51**: `const workOptions = computed<WorkOptions | null>(() => { ... })`
- **Line 52**: `const work = currentWork.value`
- **Line 56**: `const dailyHours = resolveDailyHours(work)`
- **Line 57**: `const requiredHoursPerWeek = Math.max(0, work.requiredHoursPerWeek)`
- **Line 58**: `const workedHoursCurrentWeek = Math.max(0, work.workedHoursCurrentWeek)`
- **Line 59**: `const remainingHoursCurrentWeek: boolean = requiredHoursPerWeek > 0 ? Math.max(...) : dailyHours` ← **wrong annotation** (number, not boolean)
- **Line 62**: `const oneDayHours = remainingHoursCurrentWeek > 0 ? Math.min(dailyHours, remainingHoursCurrentWeek) : 0`
- **Line 63**: `const fullShiftHours = remainingHoursCurrentWeek > 0 ? remainingHoursCurrentWeek : 0`
- **Line 77**: `const canStartOneDayShift = computed<boolean>(() => Boolean(workOptions.value && workOptions.value.oneDayHours > 0))`
- **Line 81**: `const canStartFullShift = computed<boolean>(() => ...)`
- **Line 145**: `const beforeSnapshot = createWorkStatSnapshot()`
- **Line 146**: `const summary = gameStore.applyWorkShift(hours)`
- **Line 164**: `const afterSnapshot = createWorkStatSnapshot()`

**Common initializers:**
- `computed<Type>(() => ...)` — generic computed with explicit return type
- Store/composable function calls: `resolveDailyHours(work)`, `createWorkStatSnapshot()`, `gameStore.applyWorkShift()`
- `Math.max/min()` arithmetic
- Ternary expressions: `condition ? val1 : val2`
- `Boolean(...)` wrapper conversions
- `.value` access on refs

---

## Cross-Cutting Patterns Across All Top Files

### 1. **Vue `computed()` missing return type**
Most common pattern: `const X = computed(() => ...)` — should be `const X = computed<ReturnType>(() => ...)`

### 2. **Function-call results without type**
`const result = someFunction()` — inference relies on function signature; should add `: ReturnType`

### 3. **Destructuring without type**
  - Object destructuring from function return: `const { a, b } = func()`
  - Array destructuring: `const [first, second] = arr`

### 4. **Incorrect type annotations**
Several cases where a type annotation is present but wrong:
- `: boolean` on a `ref<SomeType>` — should be `ref<SomeType>` without `: boolean` since ref returns `Ref<SomeType>`
- `: boolean` on non-boolean values (strings, numbers, arrays)
- `: boolean` on computed properties that return primitives

### 5. **Math/numeric expressions**
Arithmetic without explicit `: number` annotation: `const x = a + b`, `const result = Math.max(...)`

### 6. **Object literal assignments**
`const obj = { key: value }` — missing `: SpecificType`

### 7. **Type assertions chains**
`const x = y as unknown as Z` — no explicit annotation on the const variable itself

### 8. **Ternary operator chains**
`const value = condition ? val1 : val2` — result type should be explicitly declared

### 9. **String operations**
`const str = value.trim().toLowerCase()` — no `: string`

### 10. **Refs without explicit type**
`ref(initialValue)` — should be `ref<Type>(initialValue)` or with `: Ref<Type>`

---

## Root Cause Analysis

The violations stem primarily from TypeScript's type inference. The rule enforces explicit annotations at declaration sites. Common offending patterns:

1. **JavaScript-first codebases** — developers rely on inference and gradual typing
2. **Complex Vue Composition API** — `computed()` return types are often inferred from inline arrow functions rather than explicitly typed
3. **Utility function compositions** — chained calls like `Math.max(min(...))` produce unannotated numeric results
4. **Dynamic object shapes** — objects built from destructuring or spreading have inferred structural types
5. **Incorrect mental model** — some developers mistakenly add `: boolean` to `ref()` declarations, not realizing ref returns `Ref<T>`
6. **Any-returning functions** — when upstream functions are `any`, downstream inferred types become `any`; should annotate anyway per rule

---

## Recommendations

1. **Add explicit return types to all `computed()`:**
   ```ts
   const currentAge = computed<number>(() => store.age ?? 0)
   ```

2. **Type computed arrow function body:**
   ```ts
   const showTimeHints = computed<boolean>(() => true)
   ```

3. **Fix incorrect `: boolean` on `ref()` declarations:**
   ```ts
   // Wrong:
   const educationLevel: boolean = ref<EducationLevel>('none')
   // Correct:
   const educationLevel = ref<EducationLevel>('none')
   // or:
   const educationLevel: Ref<EducationLevel> = ref('none')
   ```

4. **Explicit types on simple operations:**
   ```ts
   const penalty: number = (consecutiveUses - 5) * 0.15
   const name: string = methodNames[method] || method
   ```

5. **Destructured assignments with type annotations:**
   ```ts
   const { multiplier: burnoutMultiplier, stressBonus } = getBurnoutMultiplier(...)
   // should be:
   const { multiplier: burnoutMultiplier, stressBonus } = getBurnoutMultiplier(...) as { multiplier: number; stressBonus: number }
   // or annotate each:
   const burnoutMultiplier: number = getBurnoutMultiplier(...).multiplier
   const stressBonus: number = getBurnoutMultiplier(...).stressBonus
   ```

6. **Array.map destructuring:**
   ```ts
   const availableTabIds = tabs.map<typeof tabs[number]['id']>(tab => tab.id)
   ```

7. **Object property destructuring from complex types:**
   ```ts
   const { multiplier: burnoutMultiplier, stressBonus } = getBurnoutMultiplier(...)
   ```

8. **Numeric ternary chains:**
   ```ts
   const remainingHoursCurrentWeek: number = requiredHoursPerWeek > 0 ? Math.max(0, requiredHoursPerWeek - workedHoursCurrentWeek) : dailyHours
   ```

9. **String chains:**
   ```ts
   const normalized: string = actionId.trim().toLowerCase()
   ```

10. **Type assertions need outer variable annotation:**
    ```ts
    const type: EducationProgram['type'] = activeCourse.value?.type?.toLowerCase() ?? ''
    ```

---

## Files Sampled (with line numbers)

| File | Total Violations | Sampled Lines |
|------|-----------------|---------------|
| EducationLevel.vue | 69 | 186-193, 198-204, 214-224, 231-242, 248-256, 262-268, 275-285, 288-293, 304-313, 316-327, 336-339, 341-354, 369, 380-389, 408, 424-426, 433, 448-450, 463, 480-491, 498, 530-531, 542, 568, 582, 398, 401, 417, 456, 459, 462, 552 |
| skill-ui-explainability.ts | 37 | 40, 75-80, 84, 98, 112, 126, 150, 162, 196, 203, 271-273, 279, 300-301, 308, 315, 339, 348-349, 382-383, 387, 29, 63, 83, 97, 111, 125, 139, 149, 180 |
| skill-system.ts | 30 | 59, 82, 136-146, 165, 171, 174-175, 187, 22, 43, 58, 73, 80, 90, 127, 164, 199, 214, 230, 264 |
| ProgramList.vue | 25 | 97, 99-100, 103, 138-141, 146-149, 184, 192, 211-212, 218, 224, 226, 239, 254, 261, 265, 109, 174, 188, 191, 244, 249 |
| activity-log-formatters.ts | 22 | 9, 16, 22, 32, 44, 52, 61-64, 98, 104, 109, 120, 126, 138, 119, 137 |
| stats-store/index.ts | 19 | 16-21, 23, 27-30, 32-34, 43, 46, 49, 52, 55 |
| hourly-rates.ts | 18 | 84-85, 91, 93, 100-101, 126-128, 136, 162-164, 169, 181, 189 |
| shop/index.vue | 18 | 89, 97, 100, 105, 116, 119-120, 129, 142-145, 149-152, 156-159, 163-166, 169-172 |
| education-store/index.ts | 18 | 83-89, 91-96, 149, 34, 42, 59, 66-67, 108, 115 |
| WorkButton.vue | 17 | 26, 34-35, 51-52, 56-58, 62-63, 77, 81, 145-146, 164-166 |

---

## Additional Observations

- **Line number reporting imprecision**: Some violations lists include function declaration lines (e.g., line 56 for `getAgingPenalty`) where no local variable exists, likely due to linter reporting the enclosing block's start. The actual flagged variables are on subsequent lines.

- **Annotation presence but flagged**: Files like `hourly-rates.ts` line 84 (`const baseFromAction: number = ...`) have explicit annotation but still appear in violations. This suggests either:
  - The linter's check runs on a superset of line numbers
  - Or the annotation syntax variant is not accepted by the rule (e.g., using `: type` inline vs. `const x = ... as Type`)

- **Languages**: Audit output is in Russian ("локальная переменная должна иметь явную аннотацию типа") — the codebase is Russian-localized.

---

**Generated:** 2026-04-24  
**Workdir:** `E:\project\games\game_life`  
**Audit source:** `C:\Users\arvai\.local\share\kilo\tool-output\tool_dc0c5f259001CaCKpp28oWo6ZM`
