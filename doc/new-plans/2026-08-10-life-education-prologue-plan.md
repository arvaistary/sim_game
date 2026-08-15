# Life Education Prologue — Implementation Plan

> **For agentic workers:** Implement task-by-task with checkbox tracking. Do **not** invent adult career/domain changes beyond the prologue → adult handoff. Follow `.cursor/rules/` and layering. Prefer reusing existing childhood event catalogs and `StartMode` rather than parallel one-off scripts.

**Goal:** Ship a playable **infancy → diploma prologue** (≈10–20 minutes real time) that awards a **varied but capped** adult starting loadout from choices; adult start remains a **clean slate**. Architecture must allow later **duration scaling** without rewriting systems.

**Architecture:** Scripted **Life Stage Runner** (config-driven acts) + **Budget/Tag economy (Model A)** + **random scene draws from period pools** + **easy graduation quizzes** + **reusable minigame primitives** embeddable in scenes and later world events.

**Tech Stack:** Nuxt 4 / Vue 3 / Pinia / TypeScript / existing `domain/balance` childhood content / `GameWorld` education fields / modal host patterns.

**Branch (suggested):** `feature/life-education-prologue`

**Related existing docs/code:**
- GDD sketch: `doc/GDD/modules/03_core_mechanics.md` §4.12
- Start UI: `src/pages/index.vue` (`StartMode`: `infancy` | `adult`)
- Paths (legacy adult presets): `src/domain/balance/constants/education-paths.ts`
- Childhood pools: `src/domain/balance/constants/childhood-events/**`
- Childhood skills: `src/domain/balance/constants/childhood-skills.ts`
- Types: `src/domain/balance/types/childhood-event.ts`

---

## Locked product decisions

| Topic | Decision |
|-------|----------|
| Time budget | Entire path **младенчество → диплом** ≈ **10–20 minutes**; scalable later via config |
| Adult start (`StartMode: adult`) | **Full skip** of prologue; **clean slate** baseline skills |
| Infancy start | Full prologue; rewards come **only** from prologue choices + exams (Model A) |
| Reward model | **A — budget + tags + random scene pools**; exam = conversion quality, not raw power |
| School / post-secondary UX | Web-novel scenes (text + choices) + short action beats + **easy** graduation quiz |
| Post-school fork | **Техникум (ССУЗ)** **или** **Университет** (simplified) |
| Anti-imba | Hard caps on starting adult skills; variety in *profile shape*, not total power |
| Minigames | Small reusable primitives (quiz, match-pairs, timed tap, order-steps) for prologue **and** later events |
| Preschool | Compressed **vignettes**, not year simulation |
| Post-school fork | **Mandatory** — player must pick Техникум or Университет (no “exit after school only” in MVP) |
| Exit age (MVP) | Always **18** after prologue; years of study are **compressed fiction** (see §7.4) |
| Exam → power | Two exams feed **one** final conversion multiplier (see §3.6); neither grants free skills |

### Explicitly superseded

| Source | Old idea | This plan |
|--------|----------|-----------|
| GDD §4.12 | Instant paths Б/В + per-round `+1 skill` mini-activities | Replaced by prologue runner + Model A caps |
| `EDUCATION_PATHS` school/institute on start | Instant skill grants | Not used for player start UX; prologue or clean slate only |
| `buildAdultGameSavePayload` | Test adult with mid skills + job + «Среднее» | **Do not** use as player “adult start”; keep for debug/tests only |
| Start page copy (current) | Adult = «с высшим образованием» | Must be rewritten to **чистый лист** (Task 9) |

---

## 1. Player-facing flow

```text
Start page
├─ adult  → build clean-slate save → /game (dashboard)
└─ infancy → Newborn welcome (existing) → Life Prologue Runner
              ├─ Act 0: Early childhood vignettes (infant + preschool)
              ├─ Act 1: School terms (VN turns) → School exam
              ├─ Act 2: Fork — Техникум | Университет
              │         terms (VN) → Final exam
              └─ Graduation summary → convert budget/tags → adult loadout → /game
```

**Real-time pacing target (MVP default profile `compact`):**

| Act | Real minutes | Content shape |
|-----|--------------|---------------|
| Early childhood | 2–4 | 3 drawn vignettes + 1 fixed school bridge |
| School | 5–8 | 4 terms (scene + optional microbeat) + exam (5 Q on compact) |
| Tech / Uni | 4–7 | 3 terms + exam (5 Q on compact) |
| Summary | ≤1 | Show gained tags/traits/skills; confirm enter adult life |
| **Total** | **≈12–18** | Tunable via `ProloguePaceProfile` |

---

## 2. Design proposal — Early childhood (дошкольные годы)

### Problem
Simulating years 0–7 with the adult day-planner would break the 10–20 minute promise and feel empty.

### Proposal: **Vignette Montage**
Player does **not** manage days. Time jumps between a few **memorable scenes**.

**Compact default composition** (`earlyVignettes = 3` **drawn** scenes + **1 fixed** bridge):

1. **Infant beat:** 1 drawn scene from mapped `INFANT_EVENTS` — emotional/attitude choices; tags from catalog only (`social`, `curiosity`, …); memories/traits; **no** adult hard skills.
2. **Preschool beats:** 2 drawn scenes from mapped `PRESCHOOL_EVENTS` — social/moral dilemmas.
3. **Fixed bridge card (not drawn from pool):** one-screen “Ты идёшь в школу” with 1 flavor choice (nervous / excited / curious) → small seed tag (`curiosity` or `social` or `discipline`) **inside** early-childhood remaining budget.

When scaling `earlyVignettes` upward, add more drawn infant/preschool scenes; bridge stays a single fixed beat after the drawn set.

**Presentation:** full-screen story card (reuse modal / dedicated `PrologueScene` layout), large text, 2–3 choices, soft transition + year label (`0 лет` → `5 лет` → `7 лет`).

**Why this works:** reuses rich existing event text; feels like a life, not a spreadsheet; leaves room to **scale up** later by raising `earlyVignettes` in pace profile.

**What preschool must NOT do:** grant career-ready skill levels; unlock jobs; spend money meaningfully.

**Childhood skill keys in event JSON** (`trustInPeople`, `empathy`, …): **ignored during prologue runtime**. Only `scene-pool-config` tag deltas apply. Long-form childhood skill progression remains a **future** system outside this MVP.

---

## 3. Model A — Budget, tags, conversion (anti-imba)

### 3.1 Core idea
Scenes do **not** freely `+skill`. They award:
- **Tag points** (directional identity)
- Sometimes **traits / memories** (flavor + soft future modifiers)
- Tiny immediate mood fantasy only inside prologue UI (optional; discarded or lightly mapped at handoff)

A stage has a **Budget** of tag points the player can accumulate (soft ceiling per stage). Random which dilemmas appear; **not** random how strong you become.

### 3.2 Tag catalog (MVP)

| Tag | Meaning | Typical adult skills favored |
|-----|---------|------------------------------|
| `stem` | Логика, точные науки | professionalism, (future analytics) |
| `lingua` | Язык, чтение | communication |
| `social` | Друзья, конфликты | communication, (future leadership soft) |
| `discipline` | Режим, старание | timeManagement |
| `body` | Спорт, здоровье | healthyLifestyle |
| `creative` | Творчество | (creative / soft until adult skill exists — map carefully) |
| `practical` | Руками / быт / техника | financialLiteracy light / professionalism light |
| `curiosity` | Вопросы «почему» | learning-speed **trait** candidate, not raw skill levels |

Do **not** invent ad-hoc tags like `trust` / `attachment` in copy — map those fantasies onto `social` / traits / memories.

Keep tag → skill mapping in one table: `src/domain/balance/constants/prologue/tag-to-adult-skills.ts`.

### 3.3 Budgets (MVP numbers — tune in balance pass)

| Stage | Tag-point budget soft-cap | Notes |
|-------|---------------------------|-------|
| Early childhood | 4 | Soft tags + traits; includes bridge spend |
| School | 8 | Main identity shaping |
| Post-secondary (tech **or** uni) | 6 | Only the chosen track; tech/uni are alternatives, not stacked |

**Important:** Tech and Uni budgets are **mutually exclusive** (one track). Max tag points before conversion ≈ `4 + 8 + 6 = 18` theoretical stage caps, but choices have opportunity cost so real totals are lower.

### 3.4 Adult handoff caps (hard anti-imba)

Clean slate (adult start) baseline — **source of truth for MVP**:

```text
timeManagement: 1, communication: 1, financialLiteracy: 1
educationLevel: 'Нет'
```

Implement adult start by applying this baseline explicitly (do **not** call `buildAdultGameSavePayload`, which is a buffed test fixture).

Prologue graduate **hard caps**:

```text
maxDistinctAdultSkillsWithLevel > 0  = 5
maxSumOfAdultSkillLevels             = 8
maxSingleAdultSkillLevel             = 3
maxTraitsGranted                     = 2
```

University may bias conversion toward `professionalism` / `leadership` **inside the same sum cap** — not extra total power.

**Invariant:** Best prologue run ≈ “interesting specialist with a story”; worst prologue ≥ clean slate; **never** mid-game adult.

### 3.5 Exam multipliers (dual exams → one conversion)

There are **two** quizzes (school, then postsec). Power must not double-dip.

**MVP rule:**
1. Each exam produces `m_stage ∈ [0.7, 1.15]` from `correct / total`.
2. Final conversion multiplier:
   `m_final = clamp(0.7, 1.15, 0.5 * m_school + 0.5 * m_postsec)`
3. **Single** conversion pass at **summary → handoff** uses `m_final` on **all** accumulated tag points.
4. School exam may show certificate flavor UI, but does **not** grant skills early.
5. Fail / low score still graduates (`m_stage` floors at 0.7) — no softlock, no retry required in MVP.

Score map (lock in tests):

```text
ratio = correct / questionCount
m = 0.7 + ratio * 0.45    # 0 correct → 0.7; all correct → 1.15
```

### 3.6 Conversion sketch (do not invent another)

Pseudo-algorithm for `convertTagsToSkills(tags, m_final, track)`:

1. Weight each adult skill by mapped tag contributions (table) + light track bias.
2. Rank skill candidates by raw score.
3. Scale raw scores by `m_final`, then allocate integer levels greedily under §3.4 caps.
4. Floor: if result would be weaker than clean-slate baseline, raise to baseline.
5. Traits ≤ 2 from `prologue-traits.ts` allow-list; memories = IDs only.

### 3.7 Variety without power creep

1. **Large pools, small draws:** each term draws 1 scene from pool size ≥ 12 filtered by stage + not-recent IDs.
2. **Weighted types:** ~70% everyday, ~25% formative, ~5% fateful (mirror `EVENT_PROBABILITY`).
3. **Choice asymmetry:** choices redistribute tags (A: +2 stem − opportunity cost), rarely pure `+` without tradeoff.
4. **Memories:** store `memoryId`s for later adult events (reunion, etc.) — engagement over power.
5. **Run seed:** `prologueSeed` in save for reproducible debug; new run = new seed.
6. **Summary screen:** show “Кем ты вырос” as tag radar / chips — player feels uniqueness.
7. **School pools:** map from `SCHOOL_EVENTS` primarily; may include selected `TEEN_EVENTS` / `YOUNG_EVENTS` via config, never unmapped IDs.

---

## 4. School & post-secondary loop

### 4.1 Term structure (one “ход”)

```text
Term N:
  1. Flavor header (класс / курс, год)
  2. Drawn scene (VN choices) → apply tag deltas within remaining budget
  3. Optional microbeat (50%): study / friends / hobby — 1 click OR 1 minigame
  4. Advance term
After last term → Exam
```

**School subjects flavor (not hard gates):** math, language, history, biology — used for copy + quiz themes.

**Exam length:** always `pace.examQuestionCount` (compact = **5**). The “5–7” phrase elsewhere means future pace profiles may raise this — do not hardcode 7 in MVP UI.

### 4.2 Graduation exams (easy by design)

Content rules:
- Elementary recall a 40-year-old can reason out
- `examQuestionCount` questions (compact: 5), 3 options, one correct
- School examples: `2+2×2`, столица (well-known), “кто написал …” with very famous works, simple biology
- Postsec examples: simple logic, percentages, “что такое гипотеза”, reading a tiny table; tech bank skews practical, uni bank skews abstract — still easy

Scoring → `m_school` / `m_postsec` → `m_final` per §3.5 only.

**UI:** dedicated quiz view; keyboard accessible; no timer in MVP (timer optional later as minigame variant).

### 4.3 Fork: Техникум vs Университет

After school exam summary:

| Track | Fantasy | Tag bias | Duration | Outcome label |
|-------|---------|----------|----------|---------------|
| Техникум | Практика, быстрее к работе | `practical`, `discipline` | 3 terms | Среднее профессиональное |
| Университет | Шире теория / статус | `stem`/`lingua`/`social` | 3 terms | Высшее |

Same runner, different `stageId`, pools, quiz banks, bias weights. Both spend the **same** post-secondary budget slot (6). Fork is **mandatory** after school exam.

**Handoff `educationLevel` values (only these two after full MVP path):**

| Track | `educationLevel` | `school` / `institute` fields (suggested) |
|-------|------------------|----------------------------------------|
| Техникум | `Среднее профессиональное` | school=completed, institute=none (or `college=completed` if you extend schema) |
| Университет | `Высшее` | school=completed, institute=completed |

Do **not** hand off `Среднее` alone in MVP (no school-only exit). Intermediate UI may say “школа окончена” before fork.

---

## 5. Scalable duration (required)

Single config object (do not hardcode counts in components):

```ts
// directional shape — implement in prologue-pace.types.ts
export type ProloguePaceProfileId = 'compact' | 'standard' | 'extended'

export interface ProloguePaceProfile {
  id: ProloguePaceProfileId
  earlyVignettes: number          // compact: 3 drawn (1 infant + 2 preschool pattern by pool weights)
  schoolTerms: number             // compact: 4
  postSecondaryTerms: number      // compact: 3
  examQuestionCount: number       // compact: 5
  microbeatChance: number         // 0..1
  allowMinigames: boolean
  // fixedBridgeAfterEarly: always true in MVP — not configurable
}
```

MVP ships `compact` as default. Adding `standard` / `extended` later = raise counts + optionally deeper pools — **same systems**.

Suggested future counts (do not implement until asked):

| Profile | earlyVignettes | schoolTerms | postsecTerms | exam Q |
|---------|----------------|-------------|--------------|--------|
| compact | 3 | 4 | 3 | 5 |
| standard | 5 | 6 | 4 | 6 |
| extended | 8 | 8 | 5 | 7 |

Persist `paceProfileId` on prologue state for save/resume.

---

## 6. Reusable minigames (primitives)

Build as pure presentational+result modules under `src/components/game/minigames/` + domain result type in `src/domain/prologue/minigames/`.

| Id | Mechanic | ~seconds | Prologue use | Later reuse |
|----|----------|----------|--------------|-------------|
| `quiz` | MC questions | 30–60 | exams (primary) | interviews, certifications |
| `match-pairs` | 3–4 pairs | 20–40 | language/memory beat | party games, training |
| `timed-tap` | N taps in T sec | 10 | “сдать проект” micro | work interactive events (GDD clicker) |
| `order-steps` | sort 3–4 steps | 20–30 | lab / cooking / procedure | job SOPs |

**Contract:**

```ts
export interface MinigameResult {
  minigameId: string
  successTier: 'fail' | 'ok' | 'great'
  score01: number
}
```

Prologue maps `successTier` → small tag nudge **inside remaining budget** (never bypass caps). Adult events later map to money/stats independently.

MVP: implement `quiz` + `match-pairs`; stub registry for the other two.

---

## 7. Domain architecture

### 7.1 New module (suggested)

```text
src/domain/prologue/
  prologue.types.ts
  prologue-pace.ts
  prologue-budget.ts          # applyChoice, clampBudget, convertTagsToSkills
  prologue-runner.ts          # pure state machine: start → scene → term → exam → done
  scene-pool.ts               # seeded draw without replacement (session bag)
  exam-bank.ts                # selectors for school/tech/uni
  handoff.ts                  # → adult GameWorld patch / save fields
  minigames/minigame.types.ts

src/domain/balance/constants/prologue/
  tag-catalog.ts
  tag-to-adult-skills.ts
  anti-imba-caps.ts
  prologue-traits.ts          # allow-list of grantable traits (max 2)
  exam-questions-school.ts
  exam-questions-tech.ts
  exam-questions-uni.ts
  scene-pool-config.ts        # which childhood event IDs eligible per stage
```

### 7.2 State machine (pure)

```text
status:
  early | school | school_exam | fork | postsec | postsec_exam | summary | completed

fields:
  seed, paceProfileId, stageIndex, termIndex
  tagPoints: Record<TagId, number>
  traits: string[]
  memories: string[]
  seenSceneIds: string[]
  track: null | 'tech' | 'uni'
  mSchool: number | null
  mPostsec: number | null
  pendingScene: SceneInstance | null
  playerName: string
```

All transitions in domain; Vue only renders and dispatches intents (`choose`, `finishMinigame`, `submitExam`, `selectTrack`, `confirmHandoff`).

### 7.3 Integration with existing content

- **Prefer wrapping** `ChildhoodEventDef` as scene source for early + school social scenes.
- Add prologue-only metadata via parallel config (do not bloat every event): `scene-pool-config.ts` maps `eventId → { stage, tagDeltasByChoiceIndex, optionalTraitByChoiceIndex }`.
- Where mapping is missing, skip event in pool (strict) — forces explicit balance.
- **Ignore** event-embedded `skillChanges` / childhood skill keys while applying prologue choices.
- School/postsec quizzes are **new** content files (not childhood events).
- Tech/uni VN scenes: MVP may **reuse** teen/young/school formative events via mapping **or** add a small set of prologue-only scene defs under `constants/prologue/scenes/` if existing copy does not fit — prefer reuse first.

### 7.4 Handoff into adult game

`handoff.ts` responsibilities:
1. Compute `m_final` (§3.5) and `convertTagsToSkills` (§3.6); clamp via §3.4.
2. Set `educationLevel` to **only** `Среднее профессиональное` or `Высшее` per track.
3. Set **`currentAge = 18`**, `startAge = 18` (or keep `startAge = 0` + `currentAge = 18` — pick one and document; **recommend both 18** for simplest adult systems). Fiction: учёба сжата. Do **not** implement 20/22 age exits in MVP.
4. Reset/set `totalHours` consistent with age-18 adult entry (follow existing adult-start time rules — see prior decisions about day-0 vs prefilled hours; **match whatever adult start uses after Task 9 alignment**).
5. Write skills, ≤2 traits, memories into `GameWorld` / save (`lifeMemory` if present, else staged field until wired).
6. Mark `prologueCompleted: true`; clear incomplete prologue cursor.
7. Wallet: apply adult starting money once at handoff (same as adult clean slate, e.g. from `INITIAL_SAVE`); do not accumulate parody money during vignettes.
8. Navigate to `/game` dashboard.

### 7.5 Adult clean slate & current start-flow gap

**Current code gap (must fix in Task 9):**
- `src/pages/index.vue` already offers infancy/adult, but infancy jumps to `/game` at age `0` with empty skills and **no** prologue runner.
- Adult copy claims higher education; age picker is 16–20; skills via `skillsStore.reset()` (empty `{}`) — **not** the clean-slate trio.
- `buildNewGameSavePayload` + `EDUCATION_PATHS` still encode instant school/institute grants.
- `buildAdultGameSavePayload` is a **test buff** (age 25, high skills, job) — unsafe for player adult start.

**Target:**
- `adult` → explicit clean-slate baseline (§3.4) + `educationLevel: 'Нет'` + age from picker (clamp to agreed adult range; recommend **18–30** to match GDD, or keep 16–20 if product prefers — **ask only if changing**; default in this plan: keep current 16–20 until product says otherwise, but fix skills/education).
- `infancy` → create save with `prologueCompleted: false`, show newborn welcome, then **only** `/game/prologue` (or equivalent) until handoff.
- During incomplete prologue: middleware blocks adult dashboard routes (`/game` index widgets, work, shop, …) except prologue + maybe settings.

### 7.6 Route & shell lock

| Condition | Allowed routes |
|-----------|----------------|
| Infancy + prologue incomplete | `/game/prologue` (+ welcome overlay) |
| Prologue completed or adult start | Normal `/game/**` |
| Adult start | Never mount prologue runner |

---

## 8. Application / store / UI

| Layer | Responsibility |
|-------|----------------|
| `application/prologue/*` | Commands: startPrologue, chooseOption, advance, submitExam, selectTrack, finalizeHandoff |
| `stores/prologue-store` | Hold runner snapshot; persist with save if mid-prologue refresh |
| `pages/game/prologue/index.vue` (or `/prologue`) | Host UI for acts |
| `components/game/prologue/*` | SceneCard, TermChrome, ExamView, ForkSelect, Summary, TagChips |
| `components/game/minigames/*` | QuizHost, MatchPairs, … |
| Middleware | If save has incomplete prologue, force resume route |

Persist prologue blob inside game save (not only `game_life_settings`).

---

## 9. Content MVP volumes

| Pool | Minimum IDs mapped | Draw per compact run |
|------|--------------------|----------------------|
| Infant | 8 | 1 |
| Preschool | 12 | 2 |
| School scenes | 16 | 4 |
| Tech scenes | 12 | 3 |
| Uni scenes | 12 | 3 |
| School quiz | 20 Q bank / draw 5 | |
| Tech quiz | 16 / draw 5 | |
| Uni quiz | 16 / draw 5 | |

Authoring guideline: questions must pass the “forgot school but can reason” bar; avoid trivia traps.

---

## 10. Engagement ideas (within Model A)

1. **Visible tag chips** during prologue (“дисциплина ●●○”) so choices feel meaningful.
2. **Rival / classmate recurring** optional chainTag across 2 school scenes (if both drawn — nice; if not — fine).
3. **One fateful scene max** per run (romance-of-youth / big failure / teacher belief) → memory for age-30 reunion event.
4. **Exam as ceremony:** short VN intro + quiz + results diploma stamp animation.
5. **Summary fantasy names:** “Практик-технарь”, “Гуманитарий-общительный” derived from top tags — cosmetic only.
6. **New Game+ later:** remember last tags; not in MVP.

---

## 11. Implementation tasks

### Task 1: Types, pace profiles, anti-imba constants

- [ ] Create `src/domain/prologue/prologue.types.ts` + pace profiles + caps + `prologue-traits.ts` allow-list.
- [ ] Unit tests for clamp helpers and `m_final` averaging.

### Task 2: Budget engine + tag conversion

- [ ] `prologue-budget.ts`: apply choice deltas, enforce stage soft-cap, `convertTagsToSkills` with `m_final` and hard caps + clean-slate floor.
- [ ] Table `tag-to-adult-skills.ts` (only real adult skill keys from `skills-constants.ts`).
- [ ] Tests: never exceed caps; worst ≥ clean slate; best ≤ caps; tech vs uni bias differs shape not total power.

### Task 3: Scene pool + seeded RNG

- [ ] `scene-pool.ts` bag draw; exclude `seenSceneIds`.
- [ ] `scene-pool-config.ts` mappings for infant/preschool/school (+ optional teen) minimum volumes §9.
- [ ] Fixed bridge beat as runner step, not pool draw.

### Task 4: Runner state machine

- [ ] Pure `prologue-runner.ts` transitions for all statuses including mandatory fork.
- [ ] Store `mSchool` / `mPostsec`; conversion only at summary.
- [ ] Tests for school→uni and school→tech; resume mid-run snapshot.

### Task 5: Exam banks + quiz minigame

- [ ] Content files + `exam-bank.ts` draw of `examQuestionCount`.
- [ ] `QuizHost` UI + result contract.
- [ ] Wire school/postsec exams to multipliers only.

### Task 6: Match-pairs minigame + registry

- [ ] Implement second primitive; registry `getMinigame(id)`.
- [ ] Optional microbeat wiring behind `allowMinigames`.

### Task 7: Application + store + persistence

- [ ] Commands/queries; `prologue-store`; save integration; middleware resume + route lock (§7.6).

### Task 8: Prologue UI shell

- [ ] Routes/pages; SceneCard; ForkSelect; Summary; progress act indicator; tag chips.
- [ ] Reuse newborn welcome then enter runner (never adult dashboard until handoff).

### Task 9: Start flow alignment (critical — current code diverges)

- [ ] Fix adult start: apply clean-slate skills + `educationLevel: 'Нет'`; rewrite UI copy (no false «высшее»).
- [ ] Fix infancy: do not dump age-0 into full dashboard; start prologue flags + route.
- [ ] Stop using `EDUCATION_PATHS` instant grants / `buildAdultGameSavePayload` for player start.
- [ ] Align time/hours at handoff with adult-entry conventions.

### Task 10: Handoff + adult verification

- [ ] Age 18 compressed fiction; education level by track; traits/memories; money baseline.
- [ ] Smoke: finish prologue → dashboard playable; adult start → no prologue.

### Task 11: Docs

- [ ] `doc/GDD/modules/17_life_education_prologue.md` superseding §4.12 interactive start for this feature.
- [ ] `doc/guides/PROLOGUE_CONTENT_AUTHORING.md`.
- [ ] Link from `doc/README.md` / GDD TOC; note §4.12 superseded parts.

### Task 12: Balance pass + timing playtest

- [ ] Play 5 seeded runs; measure real minutes; adjust pace profile counts.
- [ ] Verify no imba vs adult clean slate in early career (same first job week).
- [ ] Verify exam difficulty with a non-specialist playtester.

---

## 12. Test plan

### Automated
- Budget clamp / conversion caps
- Runner transitions + fork
- Scene pool no-repeat within run
- Exam multiplier bounds
- Handoff patch shape
- Adult start skips prologue

### Manual
- Infancy full run tech & uni (~15 min)
- Refresh mid-school resumes
- Adult start clean slate
- Quiz answerable without special knowledge
- Tag summary matches felt choices

---

## 13. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Existing childhood events grant raw `skillChanges` too strong | Ignore raw skillChanges; only config tag deltas |
| Scope: mapping all events | MVP maps minimum volumes in §9; rest later |
| Players bored by vignettes | Keep text short; show tags; one minigame spice |
| Players frustrated by exam | Easy bank; no fail-lock; no timer in MVP |
| Duration creep | Pace profiles; default compact |
| Adult systems assume age/education combos | Single handoff; age always 18; integration tests |
| Infancy currently enters age-0 dashboard | Route lock §7.6 + Task 9 before polishing scenes |
| Accidental use of test adult save builder | Ban `buildAdultGameSavePayload` for player start |
| Dual exams double-granting power | Single `m_final` conversion §3.5–3.6 |
| Tech+uni budgets stacked | Mutually exclusive postsec budget |

---

## 14. Definition of Done

- [ ] Infancy path plays early → school → **mandatory** fork → exams → summary → adult dashboard at 18
- [ ] Adult path never enters prologue; clean-slate baseline skills + `educationLevel: 'Нет'`
- [ ] Model A caps + clean-slate floor enforced by tests; `m_final` averaging tested
- [ ] At least `quiz` + `match-pairs` registered for reuse
- [ ] Pace profile allows increasing terms/vignettes without rewriting runner
- [ ] Incomplete prologue cannot use adult dashboard
- [ ] Docs + authoring guide landed; §4.12 start-path noted superseded
- [ ] Playtest within 10–20 minutes on `compact`

---

## 15. Suggested commit slices

1. `feat(prologue): types, pace profiles, anti-imba caps`
2. `feat(prologue): budget tags conversion engine`
3. `feat(prologue): scene pool and runner state machine`
4. `feat(prologue): exam banks and quiz minigame`
5. `feat(prologue): match-pairs and minigame registry`
6. `feat(prologue): store persistence and application API`
7. `feat(prologue): UI flow and start-mode handoff`
8. `fix(start): clean-slate adult and infancy prologue gate`
9. `docs(prologue): GDD module and authoring guide`

---

## 16. Open tuning knobs (execution-time, not blockers)

- Exact tag→skill weights and track bias magnitudes
- Adult age picker range (keep 16–20 vs expand to 18–30) — **do not change unless asked**
- Whether microbeats default on in `standard` profile
- Visual skin (Atlas later); MVP uses current UI primitives
- Whether `startAge` stays 0 historically or is rewritten to 18 at handoff — pick one in Task 10 and test time systems

**Closed (do not reopen in MVP without user):** exit age always 18; fork mandatory; Model A; dual-exam → one `m_final`; ignore childhood `skillChanges` in prologue.

---

## 17. Handoff for implementing agent

1. Start Tasks 1–4 (pure domain) before UI; treat Task 9 as parallel-critical before exposing infancy to players.
2. Do not grant adult skills from childhood event `skillChanges` during prologue.
3. Do not use `buildAdultGameSavePayload` for player-facing adult start.
4. Keep copy Russian; exams friendly; no softlock on fail.
5. Extend pools/config to add content — do not fork the runner.
6. Ask user before changing anti-imba caps, default pace, mandatory fork, or exit age.

---

## 18. Review changelog (2026-08-10)

Plan self-review fixes applied:

1. Locked exit age **18** (removed 20/22 hedge).
2. Clarified **dual exams → single `m_final`** and conversion algorithm.
3. Tech/uni budgets **mutually exclusive**; removed stacked double postsec budget.
4. Removed school-only handoff `Среднее` from MVP outcomes.
5. Fixed preschool tag drift (`trust`/`attachment` → catalog tags).
6. Split **drawn vignettes vs fixed bridge**; documented childhood skills ignored.
7. Documented **current start-flow gaps** vs target; banned test adult builder.
8. Added route lock, trait allow-list, money/time handoff notes, pace profile future table.
9. Aligned exam count to pace profile; expanded risks/DoD/tasks.