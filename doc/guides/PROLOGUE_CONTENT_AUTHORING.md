# Prologue content authoring

## Scene pool

Файл: `src/domain/balance/constants/prologue/scene-pool-config.ts`

1. Выбери `ChildhoodEventDef` из infant/preschool/school/teen/young.
2. Добавь запись с `stage`, `weightType`, `choices[]`.
3. Длина `choices` **должна** совпадать с `event.choices.length`.
4. Пиши только `tagDeltas` / optional trait / memory — **не** childhood `skillChanges`.
5. Теги только из каталога: `stem|lingua|social|discipline|body|creative|practical|curiosity`.
6. Traits только из `prologue-traits.ts` allow-list.

Генератор (опционально): `node scripts/gen-prologue-scene-pool.mjs`

## Exam banks

- `exam-questions-school.ts` ≥ 20
- `exam-questions-tech.ts` ≥ 16
- `exam-questions-uni.ts` ≥ 16

Правила: 3 варианта, один верный; «забыл школу, но могу рассудить»; без таймера в MVP.

Генератор: `node scripts/gen-prologue-exams.mjs`

## Pace

Не хардкодь counts в UI. Меняй `PROLOGUE_PACE_PROFILES` (`compact` default).

## Microbeats

Короткие действия между школьными и post-secondary сценами задаются в
`src/domain/balance/constants/prologue/prologue-microbeats.ts`.

- Награда использует только `tagDeltas` и проходит через stage budget.
- `fail` не выдаёт очки; `ok` и `great` применяют дельты один раз.
- Не добавляй сюда childhood `skillChanges`, взрослые навыки или обход caps.
- `microbeatChance` и `allowMinigames` настраиваются только в pace-профиле.

### Minigame UX

- `match-pairs` оставляет все найденные карточки открытыми на 2 секунды перед
  переходом к следующему этапу, чтобы игрок успел увидеть последнюю пару.
- Карточки используют переворот с 3D-анимацией; при
  `prefers-reduced-motion: reduce` анимация отключается.
- Внутренние отступы и минимальная высота контента являются частью примитивов
  миниигр — не компенсируй их дополнительными отрицательными margin в сценах.

## Нельзя без спроса

- Менять anti-imba caps, default pace, mandatory fork, exit age 18.
