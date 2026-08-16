# Life Education Prologue

> Суперседит интерактивный старт GDD §4.12 (instant paths Б/В и per-round `+1 skill`) для старта игрока.

## Цель

Играбельный пролог **младенчество → диплом** (~10–20 минут real time) с наградой **Model A**: теги + бюджеты + пулы сцен; экзамены только через `m_final`; anti-imba caps; worst ≥ clean slate.

## Поток

```text
Start
├─ adult  → clean slate → /game
└─ infancy → welcome → /game/prologue
              early → school → school_exam → fork(tech|uni)
              → postsec → postsec_exam → summary → handoff age=18 → /game
```

## Locked

| Тема | Решение |
|------|---------|
| Pace default | `compact` |
| Fork | обязателен (техникум \| вуз) |
| Exit age | всегда 18 |
| Exams | `m_final = clamp(0.7..1.15, avg(m_school, m_postsec))` |
| Childhood `skillChanges` | игнорируются в prologue runtime |
| `buildAdultGameSavePayload` | только debug/tests |
| `EDUCATION_PATHS` instant grants | не для player start UX |

## Caps

- max distinct skills > 0: 5
- max sum levels: 8
- max single level: 3
- max traits: 2
- clean slate: `timeManagement/communication/financialLiteracy = 1`, education `Нет`

## Код

- Domain: `src/domain/prologue/`
- Balance content: `src/domain/balance/constants/prologue/`
- Store: `src/stores/prologue-store/`
- UI: `src/pages/game/prologue/`, `src/components/game/prologue/`, minigames
- Microbeats: `prologue-microbeats.ts` → `match-pairs` → `MinigameResult` → stage budget
- Authoring: `doc/guides/PROLOGUE_CONTENT_AUTHORING.md`
