# План: Возрастной контекст для системы обучения

## Статус: Запланировано (v2 — полная переработка в стиле fun-age-restrictions-plan.md)

## Проблема

Система обучения в текущем виде **распилена на три слабо связанных слоя**, ни один из которых не имеет цельной возрастной модели:

| Слой | Файл | Что делает | Возраст |
|------|------|------------|---------|
| **Повседневные учебные actions** | [`education-actions.ts`](src/domain/balance/actions/education-actions.ts) | 38 карточек действий категории `education` | ❌ Нет `ageGroup` |
| **Детское обучение** | [`child-actions.ts`](src/domain/balance/actions/child-actions.ts) | 4 образовательных действия для childhood-фазы | ✅ Есть `ageGroup` |
| **Долгие программы** | [`education-programs.ts`](src/domain/balance/constants/education-programs.ts) + [`EducationSystem`](src/domain/engine/systems/EducationSystem/index.ts) | 6 платных программ с прогрессом, наградами, `educationLevel` | ❌ Нет age-полей |

Из-за этого возникают **шесть конкретных проблем**:

1. **Учебные actions не имеют `ageGroup`** — 8-летний персонаж видит «Занятие MBA», «Курс по инвестированию», «Подготовка резюме».
2. **Программы обучения не знают о возрасте** — [`EducationSystem.canStartEducationProgram()`](src/domain/engine/systems/EducationSystem/index.ts:35) проверяет только деньги, активный курс и `educationLevel`. Ребёнок может начать `institute_retraining` за 135 000 ₽ и получить `educationLevel: 'Высшее'`.
3. **Страница `/game/education` не показывает `education-actions`** — [`/game/education`](src/pages/game/education/index.vue) рендерит только [`EducationLevel`](src/components/pages/education/EducationLevel/EducationLevel.vue) и [`ProgramList`](src/components/pages/education/ProgramList/ProgramList.vue). Age-разметка `education-actions.ts` сама по себе не решит UX этой страницы.
4. **Вкладка `education` не участвует в `TAB_UNLOCK_AGE`** — в [`TAB_UNLOCK_AGE`](src/composables/useAgeRestrictions/index.ts:70) нет ключа `education`. Вкладка не скрыта ни для одной возрастной группы.
5. **Образование связано с карьерой, но не с возрастом** — [`CareerProgressSystem`](src/domain/engine/systems/CareerProgressSystem/index.ts) проверяет `educationRank >= job.minEducationRank`, но способы получения этого образования не защищены.
6. **`education-paths.ts` уже мыслит взрослыми стартовыми состояниями** — все пути в [`education-paths.ts`](src/domain/balance/constants/education-paths.ts) используют `startAge: 18`, но UI `/game/education` при этом не отделён от детских возрастов.

В результате система обучения выглядит реалистично по теме, но **не по возрасту**.

## Цель

Сделать систему обучения самосогласованной по возрасту:

- каждый возраст видит только подходящие форматы обучения;
- детское обучение, учебные actions и долгие программы подчиняются одной модели возраста;
- взрослые профессиональные программы не доступны слишком рано;
- UI `/game/education` перестаёт быть возрастно-нейтральным;
- три слоя обучения (`child-actions`, `education-actions`, `EDUCATION_PROGRAMS`) перестают быть изолированными анклавами.

---

## Возрастные группы (исправленная таблица)

> Синхронизировано с [`fun-age-restrictions-plan.md`](plans/fun-age-restrictions-plan.md).

| Группа | Возраст | Enum | Что реалистично в обучении |
|--------|---------|------|----------------------------|
| `INFANT` | 0–3 | `AgeGroup.INFANT = 0` | Нет самостоятельного обучения на adult-page |
| `TODDLER` | 4–7 | `AgeGroup.TODDLER = 1` | Простые развивающие форматы, видео, память, базовые занятия |
| `CHILD` | 8–12 | `AgeGroup.CHILD = 2` | Школьные и прикладные форматы, библиотека, язык, чтение, история |
| `TEEN` | 13–15 | `AgeGroup.TEEN = 4` | Осознанное самообразование, программирование, публичные выступления, право, психология |
| `YOUNG` | 16–17 | `AgeGroup.YOUNG = 5` | Раннее профессиональное и career-oriented обучение, резюме, переговоры, вебинары |
| `ADULT` | 18+ | `AgeGroup.ADULT = 6` | MBA, переподготовка, дорогие интенсивы, формальное повышение уровня образования |

> **Рекомендация:** синхронизировать обучение с общей возрастной реформой и перейти к модели, где взрослое юридически значимое обучение начинается с `ADULT = 18+`.

### Принципы назначения ageGroup для обучения

1. **Формат важнее предмета** — возраст зависит не просто от темы, а от уровня самостоятельности и формата (короткое базовое / школьная рутина / подростковое самообразование / ранне-профессиональное / взрослое статусное).
2. **Предмет может быть допустим рано, но форма — нет** — изучать финграмотность можно с подросткового возраста, но интенсив «Финансовая свобода» с инвестиционным фокусом логичнее позже.
3. **Платное и карьерно-ориентированное обучение строже** — если обучение стоит заметных денег, даёт профессиональные бонусы, меняет `educationLevel` или повышает зарплату, возрастной порог должен быть выше.
4. **Детское обучение не должно смешиваться с adult-learning UI** — для ранних возрастов вкладка либо скрыта, либо показывает детскую версию.
5. **`ageGroup` = минимальный возраст самостоятельного выбора действия** — не просто возможность присутствовать рядом с родителем.

---

## Раздел 1: Повседневные учебные actions (`education-actions.ts`)

**Файл:** [`education-actions.ts`](src/domain/balance/actions/education-actions.ts) — **38 действий**, ни одно не имеет `ageGroup`

### Рекомендуемая age-разметка

| ID | Название | ageGroup | Обоснование |
|----|----------|----------|-------------|
| `edu_edu_video` | Просмотр образовательного видео | `TODDLER` | Базовый ранний формат, мультики и видео с 4 лет |
| `edu_memory_training` | Тренировка памяти и внимания | `TODDLER` | Детское развивающее занятие, игры на память с 4 лет |
| `edu_read_textbook` | Чтение учебника или профессиональной литературы | `CHILD` | Самостоятельное учебное чтение с 8+ |
| `edu_online_course` | Онлайн-курс (одно занятие) | `CHILD` | Базовые онлайн-курсы возможны со школы |
| `edu_practical_task` | Выполнение практического задания | `CHILD` | Школьная/учебная практика |
| `edu_exam_prep` | Подготовка к экзамену или тесту | `CHILD` | Экзаменационный формат со школы |
| `edu_foreign_lang` | Изучение иностранного языка (одно занятие) | `CHILD` | Нормально для школьного возраста |
| `edu_cooking_masterclass` | Мастер-класс по кулинарии | `CHILD` | Прикладной формат 8+ |
| `edu_diary` | Ведение дневника рефлексии | `CHILD` | Письменная рефлексия со школы |
| `edu_library` | Посещение библиотеки | `CHILD` | Реалистично с 8+ |
| `edu_gardening` | Изучение садоводства и ухода за растениями | `CHILD` | Школьно-прикладной формат |
| `edu_design` | Изучение дизайна (графический / интерьер) | `CHILD` | Базовый творческий курс |
| `edu_fitness_theory` | Теория тренировок и здорового образа жизни | `CHILD` | Подходит для раннего осознанного обучения |
| `edu_photo_practice` | Практика фотографии | `CHILD` | Прикладной творческий навык |
| `edu_speed_reading` | Тренировка скорочтения | `CHILD` | Школьный навык |
| `edu_online_test` | Пройти онлайн-тестирование знаний | `CHILD` | Нормально для школьника |
| `edu_ecology` | Изучение экологии и устойчивого развития | `CHILD` | Подходит со школы |
| `edu_history` | Изучение истории | `CHILD` | Базовый школьный предмет |
| `edu_webinar` | Посещение вебинара или онлайн-лекции | `TEEN` | Формат ближе к подросткам и взрослым, осознанное участие в онлайн-лекции |
| `edu_write_article` | Написание статьи или экспертного поста | `TEEN` | Осознанное письменное высказывание 13+ |
| `edu_public_speaking` | Практика публичных выступлений | `TEEN` | Школьные/подростковые выступления реалистичны |
| `edu_financial_lit` | Изучение финансовой литературы | `TEEN` | Финграмотность с подросткового возраста |
| `edu_programming` | Занятие по программированию | `TEEN` | Осознанное техобучение 13+ |
| `edu_research` | Самостоятельное исследование темы | `TEEN` | Требует зрелой самостоятельности |
| `edu_psychology` | Изучение психологии | `TEEN` | Самопознание и интерес к людям |
| `edu_time_management` | Изучение тайм-менеджмента | `TEEN` | Осознанная организация времени |
| `edu_mindfulness` | Практика осознанности и медитации | `TEEN` | Осознанность как регулярная практика 13+ |
| `edu_acting` | Курс актёрского мастерства | `TEEN` | Подходит подросткам |
| `edu_podcasts` | Обучение через подкасты | `TEEN` | Осознанное самообразование через аудио |
| `edu_hackathon` | Участие в хакатоне или конкурсе | `TEEN` | Подростковые конкурсы реалистичны |
| `edu_philosophy` | Изучение философии | `TEEN` | Абстрактное мышление 13+ |
| `edu_law` | Изучение основ права | `TEEN` | Подходит подросткам |
| `edu_marketing` | Изучение маркетинга | `TEEN` | Освоение прикладной темы возможно с 13+ |
| `edu_negotiation_practice` | Практика навыков переговоров | `YOUNG` | Career-oriented навык, лучше с 16+ |
| `edu_leadership_course` | Курс по лидерству | `YOUNG` | Уже полупрофессиональный формат |
| `edu_resume` | Подготовка резюме и портфолио | `YOUNG` | Связано с первой работой |
| `edu_invest_course` | Курс по инвестированию | `YOUNG` | Не про школьную финграмотность, а уже про инвестиционные инструменты |
| `edu_mba` | Занятие онлайн-курса MBA | `ADULT` | Только взрослая профессиональная траектория |

### Наиболее спорные действия

#### `edu_online_course` — `CHILD` или `TEEN`?

Если курс понимается как общий формат обучения, `CHILD` допустим. Если фактически в UI это звучит как adult e-learning, стоит поднять до `TEEN`.

**Рекомендация:** оставить `CHILD`, но в будущем разбить на:

- детский/школьный онлайн-курс;
- профессиональный онлайн-курс.

#### `edu_webinar` — `TEEN` или `YOUNG`?

Слово и формат звучат взрослым и профессиональным. Но подросток 13+ уже может осознанно участвовать в онлайн-лекции.

**Рекомендация:** `TEEN` — формат онлайн-лекции доступен подростку, в отличие от v1 где было `YOUNG`.

#### `edu_leadership_course` — `TEEN` или `YOUNG`?

Формально лидерство можно развивать и в подростковом возрасте, но текущая формулировка слишком «курс личной эффективности для взрослого».

**Рекомендация:** `YOUNG` — полупрофессиональный формат.

#### `edu_invest_course` — отличать от `edu_financial_lit`

- `financial_lit` = подростковая грамотность → `TEEN`
- `invest_course` = шаг в сторону взрослых финансовых инструментов → `YOUNG`

#### `edu_negotiation_practice` — `TEEN` или `YOUNG`?

Переговоры как игровой навык возможны и у подростков, но текущая формулировка («Практика навыков переговоров») и привязка к `negotiations`-скиллу звучат career-oriented.

**Рекомендация:** `YOUNG`.

### Сводка по возрастам для education-actions

| Возраст | Кол-во действий | % от 38 |
|---------|-----------------|---------|
| `TODDLER` | 2 | 5% |
| `CHILD` | 15 | 39% |
| `TEEN` | 14 | 37% |
| `YOUNG` | 4 | 11% |
| `ADULT` | 1 | 3% |
| Без ограничений | 2 (видео, память — TODDLER) | — |

---

## Раздел 2: Детское обучение (`child-actions.ts`)

**Файл:** [`child-actions.ts`](src/domain/balance/actions/child-actions.ts) — **4 образовательных действия**, все уже имеют `ageGroup`

| ID | Название | ageGroup | Категория |
|----|----------|----------|-----------|
| `child_learn_poem` | Учить стихи на утренник | `CHILD` (8–12) | `education` |
| `kid_skip_lessons` | Пропускать уроки | `KID` (8–12) | `education` |
| `kid_do_homework` | Делать домашнее задание | `KID` (8–12) | `education` |
| `kid_cheat_homework` | Списывать у отличницы | `KID` (8–12) | `education` |

### Проблема

Эти действия **архитектурно живут отдельно** от обычной страницы `/game/education`. Они используются в [`ChildhoodView`](src/domain/engine/systems/ChainResolverSystem) и не интегрированы с [`useActions`](src/composables/useActions/index.ts).

**Решение:** оставить как есть — это изолированная childhood-подсистема. Но нужно убедиться, что:

1. `child_learn_poem` корректно использует `AgeGroup.CHILD` (в текущей модели это 8–12 лет, что совпадает с KID).
2. Детские education-actions не дублируют действия из `education-actions.ts`.
3. При отображении `/game/education` для детских возрастов не возникает путаницы между двумя источниками.

---

## Раздел 3: Программы обучения (`EDUCATION_PROGRAMS`)

**Файл:** [`education-programs.ts`](src/domain/balance/constants/education-programs.ts) — **6 программ**, ни одна не имеет age-полей

### Главная проблема

Тип [`EducationProgram`](src/domain/balance/types/index.ts:122) не содержит age-полей. Система [`EducationSystem.canStartEducationProgram()`](src/domain/engine/systems/EducationSystem/index.ts:35) проверяет только:

- деньги;
- отсутствие активного курса;
- уже полученный `educationLevel`.

Возраст **вообще не учитывается**. Ребёнок может начать `institute_retraining` за 135 000 ₽ и получить `educationLevel: 'Высшее'`.

### Рекомендуемая age-разметка программ

| ID | Название | Стоимость | ageGroup | Обоснование |
|----|----------|-----------|----------|-------------|
| `time_management_book` | Книга «Как управлять временем» | 950 ₽ | `TEEN` | Осознанный навык самоорганизации, книга про self-management |
| `online_productivity_course` | Онлайн-курс «Личная эффективность» | 6 900 ₽ | `YOUNG` | Уже заметно adult-coded продукт, системный подход к продуктивности |
| `institute_retraining` | Профессиональная переподготовка в институте | 135 000 ₽ | `ADULT` | Формальное карьерное обучение, даёт `educationLevel: 'Высшее'`, повышает зарплату |
| `foreign_language_intensive` | Интенсив по иностранному языку | 18 500 ₽ | `TEEN` | Реалистично с подросткового возраста, языковые интенсивы распространены |
| `public_speaking_course` | Курс ораторского мастерства | 12 400 ₽ | `TEEN` | Подходит подросткам и взрослым |
| `financial_literacy_intensive` | Интенсив «Финансовая свобода» | 9 800 ₽ | `YOUNG` | Уже ближе к личным финансам взрослого уровня, инвестиционный фокус |

### Почему `institute_retraining` — строго `ADULT`

Это не просто «курс», а **взрослая карьерная инвестиция**:

- дорогой (135 000 ₽);
- долгий (180 часов);
- даёт `educationLevel = 'Высшее'`;
- повышает зарплату (`salaryMultiplierDelta: 0.08`);
- меняет `institute` на `'completed'`.

Через [`CareerProgressSystem`](src/domain/engine/systems/CareerProgressSystem/index.ts:46) это напрямую влияет на доступные работы. Если ребёнок получит «Высшее» образование, карьерная система сломается.

---

## Раздел 4: Критические несоответствия

### 1. `/game/education` не использует `education-actions.ts`

Страница [`/game/education`](src/pages/game/education/index.vue) рендерит только:

- [`EducationLevel`](src/components/pages/education/EducationLevel/EducationLevel.vue) — текущий уровень и активный курс;
- [`ProgramList`](src/components/pages/education/ProgramList/ProgramList.vue) — список программ.

Обычные actions из `education-actions.ts` там **не отображаются**.

Это значит:

- age-разметка `education-actions.ts` сама по себе не решит UX страницы;
- если делать план только по actions, получится частичное решение.

### 2. `ProgramList.vue` не проверяет возраст

[`ProgramList.vue`](src/components/pages/education/ProgramList/ProgramList.vue:42) проверяет только `canAfford()` (деньги) и `store.canStartEducationProgram()` (делегирует в `EducationSystem`). Возраст не фильтруется.

### 3. Вкладка `education` не имеет unlock-age

В [`TAB_UNLOCK_AGE`](src/composables/useAgeRestrictions/index.ts:70) нет ключа `education`. Также `education` не скрывается в `hiddenTabs` для ранних возрастов.

Следствие: образовательная вкладка доступна с рождения, внутри неё нет age-фильтрации.

### 4. `EducationSystem` не знает о возрасте

[`canStartEducationProgram()`](src/domain/engine/systems/EducationSystem/index.ts:35) — нет age-проверки.
[`startEducationProgram()`](src/domain/engine/systems/EducationSystem/index.ts:60) — нет age-проверки.

### 5. Образование связано с карьерой, но не с возрастом

[`CareerProgressSystem`](src/domain/engine/systems/CareerProgressSystem/index.ts:46) проверяет `educationRank >= job.minEducationRank`, но способы получения этого образования не защищены возрастным контекстом.

Иными словами:

- карьера понимает диплом;
- обучение понимает деньги и время;
- **возраст не понимает никто**.

### 6. `education-paths.ts` уже мыслит взрослыми стартовыми состояниями

Все пути в [`education-paths.ts`](src/domain/balance/constants/education-paths.ts) используют `startAge: 18`. Это косвенно подтверждает, что крупные образовательные траектории уже воспринимаются как post-school / adult-stage механика. Но UI `/game/education` при этом не отделён от детских возрастов.

---

## Раздел 5: Архитектурные изменения

### Изменение 1: расширить тип `EducationProgram`

**Файл:** [`types/index.ts`](src/domain/balance/types/index.ts:122)

Добавить в интерфейс `EducationProgram`:

```typescript
export interface EducationProgram {
  // ... существующие поля ...
  
  /** Минимальная возрастная группа для доступа к программе */
  minAgeGroup?: AgeGroup
  /** Текстовое объяснение возрастного ограничения */
  ageReason?: string
}
```

> `minAgeGroup` опционально — если не указано, программа доступна всем (backward compatible).

### Изменение 2: добавить age-проверку в `EducationSystem`

**Файл:** [`EducationSystem/index.ts`](src/domain/engine/systems/EducationSystem/index.ts:35)

`canStartEducationProgram()` должен дополнительно проверять:

- текущий возраст персонажа;
- соответствие `minAgeGroup`.

```typescript
canStartEducationProgram(program: EducationProgram): CanStartResult {
  // ... существующие проверки ...

  // Новая проверка возраста
  if (program.minAgeGroup !== undefined) {
    const currentAgeGroup = this._getPlayerAgeGroup()
    if (currentAgeGroup < program.minAgeGroup) {
      return { 
        ok: false, 
        reason: `Эта программа доступна с возраста ${AGE_GROUP_LABELS[program.minAgeGroup]}+.` 
      }
    }
  }

  return { ok: true }
}
```

Для получения текущего `AgeGroup` система должна читать компонент `TIME_COMPONENT` и вычислять возраст, либо использовать общий helper `getAgeGroup()`.

### Изменение 3: фильтровать программы в UI

**Файл:** [`ProgramList.vue`](src/components/pages/education/ProgramList/ProgramList.vue)

Нужно:

- скрывать программы, не подходящие по возрасту;
- или показывать их disabled с причиной.

**Рекомендация:** сначала скрывать совсем всё, что явно не по возрасту, чтобы не создавать UX-шум. Если в будущем понадобится «предпросмотр» заблокированных программ — добавить отдельный UI-режим.

### Изменение 4: решить судьбу `education-actions` на странице `/game/education`

Сейчас есть архитектурная вилка:

**Вариант A — сохранить текущую страницу как «долгое образование»**

- `/game/education` показывает только программы и уровень;
- `education-actions` остаются в общей системе actions, но не на этой странице.

Минус: пользователь не видит большую часть образовательного контента во вкладке обучения.

**Вариант B — сделать вкладку обучения составной**

- блок `education-actions` (повседневные учебные действия);
- блок образовательных программ;
- уровень образования и активный курс.

**Рекомендация:** выбрать **Вариант B**, потому что это делает систему обучения цельной и понятной. Страница `/game/education` должна стать единой точкой входа в обучение.

### Изменение 5: ввести unlock-age для вкладки `education`

**Файл:** [`useAgeRestrictions/index.ts`](src/composables/useAgeRestrictions/index.ts:70)

Добавить в `TAB_UNLOCK_AGE`:

```typescript
education: 8,  // С осознанного школьного возраста
```

И добавить в `UNLOCK_MESSAGES`:

```typescript
education: '📚 Теперь вам доступно Обучение! Вы можете изучать новые навыки и проходить курсы.',
```

Для ранних возрастов (INFANT, TODDLER) добавить `education` в `hiddenTabs`:

```typescript
[AgeGroup.INFANT]: {
  hiddenTabs: ['finance', 'career', 'home', 'car', 'social', 'shop', 'education'],
  // ...
},
[AgeGroup.TODDLER]: {
  hiddenTabs: ['finance', 'career', 'home', 'car', 'shop', 'education'],
  // ...
},
```

**Обоснование:** `education: 8` — если вкладка начинается с осознанного учебного поведения. Если childhood-образование остаётся строго отдельным режимом, можно поставить `education: 13`.

---

## Раздел 6: Shortlist решений

### Оставить как есть (разметка очевидна)

- `edu_edu_video` → `TODDLER`
- `edu_memory_training` → `TODDLER`
- `edu_exam_prep` → `CHILD`
- `edu_foreign_lang` → `CHILD`
- `edu_public_speaking` → `TEEN`
- `edu_programming` → `TEEN`
- `edu_hackathon` → `TEEN`
- `edu_mba` → `ADULT`
- `foreign_language_intensive` → `TEEN`
- `public_speaking_course` → `TEEN`
- `institute_retraining` → `ADULT`

### Точно поднять по возрасту

- `edu_webinar` → `TEEN` (не TODDLER/CHILD — формат онлайн-лекции)
- `edu_negotiation_practice` → `YOUNG` (career-oriented навык)
- `edu_resume` → `YOUNG` (связано с первой работой)
- `edu_leadership_course` → `YOUNG` (полупрофессиональный формат)
- `edu_invest_course` → `YOUNG` (инвестиционные инструменты)
- `online_productivity_course` → `YOUNG` (adult-coded продукт)
- `financial_literacy_intensive` → `YOUNG` (финансы взрослого уровня)

### Лучше переименовать или дробить в будущем

- `edu_online_course` — слишком широкое, объединяет детский и взрослый форматы
- `edu_read_textbook` — «профессиональная литература» звучит взрослым
- `edu_write_article` — «экспертный пост» звучит взрослым
- `edu_design` — слишком широкое
- `edu_marketing` — прикладная тема, но формулировка взрослая

Причина: названия слишком широкие и объединяют детский, подростковый и взрослый форматы в одну карточку.

### Лучше не открывать слишком рано

- вся система программ обучения;
- всё, что даёт `educationLevel`;
- всё, что прямо завязано на карьеру и резюме.

---

## Раздел 7: Связь с карьерой

### Текущая зависимость

[`CareerProgressSystem`](src/domain/engine/systems/CareerProgressSystem/index.ts:46) использует `educationRank` для определения доступных работ:

```typescript
unlocked: professionalism >= job.minProfessionalism && educationRank >= job.minEducationRank
```

Ранги образования (из [`education-ranks.ts`](src/domain/balance/utils/education-ranks.ts)):

| Уровень | Rank |
|---------|------|
| Нет | -1 |
| Среднее | 0 |
| Высшее | 1 |
| MBA | 2 |

### Риск

Если ребёнок получит `educationLevel: 'Высшее'` через `institute_retraining`, карьерная система откроет работы, требующие `minEducationRank: 1`. Это сломает баланс.

### Решение

Возрастная проверка в `EducationSystem` (Изменение 2) защищает от этого на системном уровне. Дополнительно можно добавить age-проверку и в `CareerProgressSystem`, но это избыточно, если `EducationSystem` уже не позволяет получить «взрослый» диплом слишком рано.

---

## Исследование контекста (факты кода)

1. `education-actions.ts` содержит **38 действий**, но не используется напрямую страницей `/game/education`.
2. `/game/education` сейчас показывает `EducationLevel` и `ProgramList`, то есть фактически это UI для **долгих программ**, а не для всей системы обучения.
3. `ProgramList.vue` не проверяет возраст, а только деньги и `store.canStartEducationProgram(program.id)`.
4. `store.canStartEducationProgram()` делегирует в `gameQueries.canStartEducationProgram()`, который проверяет только логику `EducationSystem`.
5. `EducationSystem.canStartEducationProgram()` не знает о возрасте.
6. `EducationProgram` не содержит age-полей.
7. `TAB_UNLOCK_AGE` не содержит `education`.
8. В childhood-системе уже есть отдельные educational actions, но они не интегрированы с adult-page обучения.
9. `education-paths.ts` уже оперирует стартом с 18 лет, что усиливает взрослую трактовку больших образовательных траекторий.
10. `EducationLevel.vue` показывает текущий уровень и активный курс — не зависит от возраста напрямую.
11. `recovery-tabs.ts` содержит вкладку `education` с карточками «Онлайн-курс» и «Институт / переподготовка» — ещё один источник образовательного контента без age-фильтрации.

---

## Этапы реализации

### Этап 0: Зафиксировать модель возрастов для обучения (30 мин)

**Зависимость:** Этап 0 из [`fun-age-restrictions-plan.md`](plans/fun-age-restrictions-plan.md) (исправление бага маппинга TEEN) должен быть завершён.

1. Подтвердить общую age-модель проекта (`ADULT = 18+` или legacy-вариант).
2. Зафиксировать правило:
   - учебные actions используют `minAgeGroup` (поле `ageGroup` в `BalanceAction`);
   - программы обучения используют `minAgeGroup` (новое поле в `EducationProgram`).
3. Определить, будет ли `/game/education` показывать только программы или и actions тоже (рекомендация: Вариант B — составная страница).

### Этап 1: Разметка `education-actions.ts` (1–2 часа)

1. Добавить `import { AgeGroup } from './types'` в [`education-actions.ts`](src/domain/balance/actions/education-actions.ts).
2. Проставить `ageGroup` для всех 38 actions согласно таблице в Разделе 1.
3. Перепроверить наиболее спорные действия (`webinar`, `resume`, `invest_course`, `leadership_course`, `negotiation_practice`).
4. Запустить `npm run build`.

### Этап 2: Расширить модель `EducationProgram` (30 мин)

1. Добавить `minAgeGroup?: AgeGroup` в интерфейс [`EducationProgram`](src/domain/balance/types/index.ts:122).
2. Добавить `ageReason?: string` для текстового объяснения.
3. Импортировать `AgeGroup` из `actions/types` (или вынести в общее место).

### Этап 3: Разметка `EDUCATION_PROGRAMS` (30 мин)

1. Проставить возрастные ограничения всем 6 программам согласно таблице в Разделе 3.
2. Отдельно зафиксировать:
   - `institute_retraining` → `ADULT` (критично!);
   - `financial_literacy_intensive` → `YOUNG`;
   - `time_management_book` → `TEEN`.

### Этап 4: Age-проверка в `EducationSystem` (1 час)

1. Получать текущий возраст игрока через `TIME_COMPONENT`.
2. Добавить helper `_getPlayerAgeGroup()` в [`EducationSystem`](src/domain/engine/systems/EducationSystem/index.ts).
3. Проверять `minAgeGroup` в `canStartEducationProgram()`.
4. Возвращать понятную причину недоступности: `Эта программа доступна с возраста YOUNG+`.

### Этап 5: UI-приведение `/game/education` к возрасту (1–2 часа)

1. В [`ProgramList.vue`](src/components/pages/education/ProgramList/ProgramList.vue) скрыть или задизейблить неподходящие программы.
2. Добавить текстовое объяснение при недоступности по возрасту.
3. Принять решение по `education-actions`:
   - либо встроить в страницу (Вариант B — рекомендуется);
   - либо явно описать, почему они не показываются здесь.
4. Если Вариант B — создать компонент `EducationActions.vue` для отображения age-отфильтрованных `education-actions`.

### Этап 6: Unlock-age и детский контур (30–60 мин)

1. Добавить `education: 8` в [`TAB_UNLOCK_AGE`](src/composables/useAgeRestrictions/index.ts:70).
2. Добавить `education` в `hiddenTabs` для `INFANT` и `TODDLER` в [`AGE_RULES`](src/composables/useAgeRestrictions/index.ts:17).
3. Добавить сообщение разблокировки в [`UNLOCK_MESSAGES`](src/composables/useAgeRestrictions/index.ts:80).
4. Убедиться, что childhood-образование не конфликтует с обычной вкладкой.

### Этап 7: Проверка `recovery-tabs.ts` (30 мин)

1. Проверить вкладку `education` в [`recovery-tabs.ts`](src/domain/balance/constants/recovery-tabs.ts:71) — содержит карточки «Онлайн-курс» и «Институт / переподготовка».
2. Если `RecoverySystem` не фильтрует по возрасту — добавить age-проверку.
3. Убедиться, что `RecoveryCard` не позволяет получить `educationLevel: 'Высшее'` слишком рано.

### Этап 8: Тестирование (1–2 часа)

**Unit / integration:**

- ребёнок не может стартовать adult-программу;
- `institute_retraining` не стартует раньше `ADULT`;
- `edu_mba` не доступен раньше `ADULT`;
- `edu_resume` не показывается раньше `YOUNG`;
- подросток видит подростковые учебные действия;
- молодёжь видит career-oriented обучение;
- age-фильтр работает и для actions, и для программ;
- `EducationSystem.canStartEducationProgram()` возвращает понятную причину отказа по возрасту.

**Ручные проверки:**

- `/game/education` в 8–12 лет — видны только CHILD-действия и TEEN+ программы скрыты;
- `/game/education` в 13–15 лет — видны TEEN-действия и TEEN-программы;
- `/game/education` в 16–17 лет — видны YOUNG-действия и YOUNG-программы;
- `/game/education` у взрослого персонажа — полный набор;
- `institute_retraining` не доступен слишком рано;
- ранние возраста не видят пустой или абсурдный экран;
- вкладка `education` скрыта для INFANT и TODDLER.

---

## Раздел 8: Синхронизация с обновленной системой времени (Time v2)

План обучения должен быть совместим с целевым time-контуром из `time-system-refresh`:

- единый источник времени: `time.totalHours`;
- единый путь расхода времени: только через `TimeSystem.advanceHours(...)`;
- period-эффекты (week/month/year) вызываются централизованно через hooks;
- никаких fallback-мутаций `time.totalHours` в `EducationSystem`.

### Что добавить в реализацию обучения

1. **Убрать fallback-путь времени в `EducationSystem`**
   - Если `TimeSystem` недоступен, не мутировать время напрямую, а возвращать контролируемую ошибку.
   - Это исключит рассинхрон derived-полей (`gameDays`, `gameWeeks`, `gameMonths`) и пропуски period-hooks.

2. **Нормализовать время для программ и повседневных действий**
   - Все учебные действия и прогресс программ должны менять время через один и тот же контракт (`advanceHours`).
   - Для длинных программ зафиксировать стратегию: шаги прогресса по действию, а не “магическое” мгновенное завершение.

3. **Подготовить period-aware правила обучения**
   - Явно описать, есть ли недельные/месячные эффекты обучения (например, усталость, бонус за регулярность, стипендия/штраф).
   - Если эффекты есть — подключать их через week/month hooks, а не через adhoc вызовы из UI.

4. **Добавить time regression тесты для обучения**
   - large hour jumps не ломают прогресс обучения;
   - переход недели/месяца во время учебного цикла не дублирует и не теряет эффекты;
   - последовательность `start -> progress -> complete` сохраняет корректный `totalHours` trace.

### Sync requirements с Time Plan

- Зависимость от `time-system-refresh`:
  - `Unify time contract` (обязательная);
  - `Wire periodic orchestration` (обязательная для period-driven обучения);
  - `Stabilize event identity and dedup` (для учебных событий/уведомлений).

---

## Раздел 9: Синхронизация с обновленной системой событий (Event v2)

Обучение должно работать через единый event ingress, а не через локальные разрозненные enqueue-path:

1. **Стандартизировать учебные события**
   - Ввести набор event templates для обучения:
     - `education_program_started`
     - `education_program_progress`
     - `education_program_completed`
     - `education_program_blocked_by_age`
     - `education_age_tab_unlocked`
   - События должны иметь `templateId`, детерминированный `instanceId`, `timeSnapshot`.

2. **Подключить EducationSystem к `EventIngress API`**
   - Не пушить события напрямую в очередь.
   - Отправлять через канонический `enqueueEvent`, чтобы dedup/idempotency были едины с системой событий.

3. **Согласовать payload с UI**
   - Любые choices/CTA у образовательных событий должны использовать общий формат `id/text`.
   - Исключить локальные форматы, которые ломают `EventChoices`/страницу событий.

4. **Защититься от дублей на границах периодов**
   - Для событий “окончание программы” и “разблокировка обучения” использовать dedup key, чтобы не было повторов после перезагрузки/replay.

### Sync requirements с Event Plan

- Зависимость от `event-system-sync`:
  - `Unify event contract and ingress`;
  - `Fix identity, dedup, idempotency`;
  - `Wire with Time v2 period hooks` (для period-driven образовательных уведомлений).

---

## Раздел 10: Оптимизации и улучшения системы обучения

### 10.1 Архитектурные оптимизации

1. **Единый фасад обучения**
   - Ввести `EducationFacade`/`education-queries` слой с каноническими методами:
     - `getAvailableEducationActionsByAge()`
     - `getAvailableProgramsByAge()`
     - `canStartProgramWithReason()`
   - Это уберет дубли age-логики между `ProgramList`, store и системами.

2. **Policy-first валидации**
   - Вынести проверки в отдельную policy-функцию (возраст, деньги, активная программа, educationLevel, time budget).
   - Возвращать структурированный отказ (`code`, `message`) вместо ad-hoc строк.

3. **Data-driven age rules**
   - Зафиксировать age rules в конфиге, чтобы менять возрастные пороги без изменения бизнес-логики систем.

### 10.2 Performance оптимизации

1. **Versioned availability snapshot**
   - Считать доступность учебных действий/программ батчом на `worldVersion`, а не `canStart/canExecute` на каждую карточку при каждом ререндере.

2. **Предварительная индексация каталога**
   - Построить индекс actions/programs по `minAgeGroup` и категории.
   - В UI отдавать уже отфильтрованные массивы вместо повторных линейных фильтров.

3. **Сократить churn сохранений**
   - Не делать лишние `save()` на промежуточных шагах учебного flow; коммитить в явных контрольных точках.

4. **Telemetry для обучения**
   - Добавить метрики:
     - `education.canStart.calls`
     - `education.canStart.denied.byAge`
     - `education.program.start/complete`
     - `education.ui.render.latency`
     - `education.learningEfficiency.avg`
     - `education.learningEfficiency.penalty.byNeeds`

### 10.3 Product/UX улучшения

1. **Progressive disclosure**
   - Для закрытых программ показывать краткий “доступно с возраста X” (по флагу), чтобы игрок видел траекторию роста.

2. **Единая шкала образовательного пути**
   - На `/game/education` добавить дорожную карту: текущий уровень -> доступные next-step действия/программы.

3. **Согласованность терминов**
   - Переименовать overly-adult формулировки в mixed-age действиях (`online_course`, `webinar`, `write_article`) либо разделить на школьный и профессиональный варианты.

### 10.4 Реалистичность обучения: усвоение и поэтапность

1. **Не 100% усвоение по умолчанию**
   - Зафиксировать модель, где учебное действие дает не “полный эффект”, а `baseEffect * learningEfficiency`.
   - `learningEfficiency` вычисляется из факторов персонажа и состояния, затем ограничивается `clamp(min, max)`.

2. **Факторы эффективности усвоения**
   - Положительные: профильные навыки обучения (дисциплина, концентрация, интеллект/обучаемость), регулярность занятий.
   - Отрицательные: усталость, высокий `sleepDebt`, стресс/перегрузка, слишком длинная учебная сессия без пауз.
   - Needs-профиль: голод, энергия, настроение и другие текущие потребности персонажа должны влиять на усвоение в момент действия.
   - Ввести caps, чтобы избежать “бесконечного буста” от прокачки одного стата.

2.1 **Влияние потребностей (needs)**
   - Ввести `needsPenaltyMultiplier`, который рассчитывается из актуального состояния потребностей (`hunger`, `energy`, `mood` и др.).
   - Итоговую эффективность считать в явном порядке:  
     `finalEfficiency = clamp(baseEfficiency * skillMultiplier * needsPenaltyMultiplier * antiGrindMultiplier, min, max)`.
   - При критическом дефиците потребностей (сильный голод/истощение/плохое настроение) усвоение должно заметно деградировать.
   - При нормальном состоянии потребностей усвоение остается около базового диапазона, без “бесплатного” штрафа.

2.2 **Пороговая модель v1 (фиксируем для реализации)**
   - Нормализовать needs в диапазон `0..100` (где `100` = лучшее состояние, `0` = худшее).
   - В v1 использовать три обязательных фактора:
     - `energy` (вес `0.40`)
     - `hunger` (вес `0.35`)
     - `mood` (вес `0.25`)
   - Ввести piecewise-штрафы по каждому фактору:
     - `>= 70`: `1.00` (без штрафа)
     - `40..69`: `0.90` (умеренный штраф)
     - `20..39`: `0.75` (существенный штраф)
     - `< 20`: `0.55` (критический штраф)
   - Общий needs-мультипликатор считать как взвешенную сумму:  
     `needsPenaltyMultiplier = energyPenalty*0.40 + hungerPenalty*0.35 + moodPenalty*0.25`.
   - Глобальные ограничения эффективности:
     - `finalEfficiencyMin = 0.35`
     - `finalEfficiencyMax = 1.25`
   - Hard-stop правило (реалистичность):
     - если `energy < 10` **или** `hunger < 10`, запуск длительных программ блокируется с причиной `"critical_needs_state"`;
     - для коротких учебных действий разрешать запуск, но с форсированным `needsPenaltyMultiplier = min(needsPenaltyMultiplier, 0.50)`.
   - Калибровка v1:
     - после сбора telemetry скорректировать веса/пороги в отдельном tuning-pass без изменения архитектуры.

2.3 **Псевдокод `calculateLearningEfficiencyV1()`**
   - Цель: единая функция расчета усвоения для коротких учебных действий и шагов длительных программ.

```typescript
type NeedsState = {
  hunger: number   // 0..100
  energy: number   // 0..100
  mood: number     // 0..100
}

type LearningInput = {
  baseEffect: number
  baseEfficiency: number        // обычно 1.0
  skillMultiplier: number       // от навыков/статов
  antiGrindMultiplier: number   // от повторяемости
  needs: NeedsState
  isLongProgramStep: boolean
}

type LearningResult = {
  finalEfficiency: number
  finalEffect: number
  blocked: boolean
  reasonCodes: string[]         // например: ["critical_needs_state", "low_energy_penalty"]
}

function mapNeedToPenalty(value: number): number {
  if (value >= 70) return 1.00
  if (value >= 40) return 0.90
  if (value >= 20) return 0.75
  return 0.55
}

function calculateLearningEfficiencyV1(input: LearningInput): LearningResult {
  const reasonCodes: string[] = []
  const hungerPenalty = mapNeedToPenalty(input.needs.hunger)
  const energyPenalty = mapNeedToPenalty(input.needs.energy)
  const moodPenalty = mapNeedToPenalty(input.needs.mood)

  let needsPenaltyMultiplier =
    energyPenalty * 0.40 +
    hungerPenalty * 0.35 +
    moodPenalty * 0.25

  const criticalNeeds = input.needs.energy < 10 || input.needs.hunger < 10
  if (criticalNeeds && input.isLongProgramStep) {
    return {
      finalEfficiency: 0,
      finalEffect: 0,
      blocked: true,
      reasonCodes: ["critical_needs_state"]
    }
  }

  if (criticalNeeds) {
    needsPenaltyMultiplier = Math.min(needsPenaltyMultiplier, 0.50)
    reasonCodes.push("critical_needs_soft_cap")
  }

  if (input.needs.energy < 40) reasonCodes.push("low_energy_penalty")
  if (input.needs.hunger < 40) reasonCodes.push("high_hunger_penalty")
  if (input.needs.mood < 40) reasonCodes.push("low_mood_penalty")

  const rawEfficiency =
    input.baseEfficiency *
    input.skillMultiplier *
    needsPenaltyMultiplier *
    input.antiGrindMultiplier

  const finalEfficiency = clamp(rawEfficiency, 0.35, 1.25)
  const finalEffect = input.baseEffect * finalEfficiency

  return {
    finalEfficiency,
    finalEffect,
    blocked: false,
    reasonCodes
  }
}
```

   - Контракт применения:
     - для `blocked = true` прогресс шага/действия не начисляется;
     - для `blocked = false` применяется `finalEffect`, а `reasonCodes` пишутся в telemetry/debug log;
     - одна и та же функция используется в `EducationSystem` для action-flow и program-step-flow.

3. **Убывающая отдача (diminishing returns)**
   - Повтор одинаковых учебных действий в коротком окне времени снижает эффективность (`anti-grind` коэффициент).
   - После отдыха/смены типа активности штраф частично восстанавливается.

4. **Пошаговая модель длительных программ**
   - Разбить длинные программы на шаги/модули (`step 1..N`) с явными критериями завершения.
   - Каждый шаг должен иметь:
     - `title`
     - `hoursRequired`
     - `progressPercent`
     - `milestoneReward` (опционально)
   - Финальный бонус программы дается только после завершения всех шагов.

5. **Прозрачный UI прогресса**
   - На `/game/education` показывать:
     - текущий шаг (например, “Модуль 2 из 5”);
     - прогресс шага и общий прогресс программы;
     - сколько часов осталось до следующего checkpoint и до completion.
   - Для недоступных шагов/программ показывать понятную причину (возраст, деньги, prerequisites).

6. **События и время для поэтапного обучения**
   - На каждый milestone генерировать событие `education_program_step_completed` через `EventIngress`.
   - Продвижение шага всегда происходит вместе с `advanceHours`, чтобы прогресс и время были атомарно синхронизированы.

---

## Раздел 11: Фазовый roadmap (S/M/L + зависимости)

### Phase 1 — Contract and age safety (S-M)

- **Scope**
  - age-разметка actions + programs;
  - `EducationProgram.minAgeGroup`;
  - age-check в `EducationSystem` с machine-readable reason codes;
  - контракт `learningEfficiency` (формула, caps, anti-grind правила);
  - блокировка bypass через `recovery-tabs`.
- **Dependencies**
  - базовая age-модель из `fun-age-restrictions-plan`.
- **Size**
  - `EducationSystem`: M
  - balance-константы/типы: S
  - UI минимальные правки: S
- **Exit criteria**
  - невозможен ранний старт adult-программ;
  - все возрастные отказы объясняются единообразно.

### Phase 2 — Time/Event synchronization (M-L)

- **Scope**
  - полный переход education-flow на единый time contract (`advanceHours`);
  - интеграция образовательных событий через `EventIngress`;
  - поэтапный прогресс программ (`step-by-step`) с milestone событиями;
  - period-safe обработка (без дублей/пропусков).
- **Dependencies**
  - `time-system-refresh`: PR1/PR2;
  - `event-system-sync`: Phase 1/2.
- **Size**
  - интеграция систем: M-L
  - тесты интеграции: M
- **Exit criteria**
  - обучающий flow корректен при переходах week/month/year;
  - учебные события имеют детерминированные id и не дублируются.

### Phase 3 — Performance and UX consolidation (M)

- **Scope**
  - versioned snapshot + индексация каталога;
  - `/game/education` как единая точка входа (вариант B);
  - UI визуализация шагов, остатка часов и эффективности усвоения;
  - telemetry и diagnostics.
- **Dependencies**
  - завершение Phase 1;
  - желательно после стабилизации Time/Event orchestration.
- **Size**
  - store/composables/UI: M
  - observability: S-M
- **Exit criteria**
  - UI не деградирует на массовых списках;
  - у игрока нет “пустых” или противоречивых образовательных состояний по возрасту.

---

## Раздел 12: Realism Expansion Pack (новые фичи)

Цель блока — усилить правдоподобие обучения без разрушения текущего контракта `education <-> time <-> events`.

### 12.1 Кривая забывания и интервальные повторения

1. **Forgetting curve**
   - Для “знаний” и связанных учебных навыков ввести естественное снижение эффективности при долгом неиспользовании.
   - Деградация должна быть плавной и ограниченной нижним порогом (без полного обнуления за короткий срок).

2. **Spaced repetition**
   - Повторение материала в “окнах повторения” дает повышенное закрепление.
   - Спам повторений подряд не должен давать тот же эффект (сочетается с anti-grind).

### 12.2 Дневная когнитивная нагрузка

1. **Mental fatigue cap**
   - Ввести дневной лимит эффективных часов обучения.
   - После превышения лимита `learningEfficiency` снижается даже при хороших needs.

2. **Сброс когнитивной усталости**
   - Частично восстанавливать способность к обучению через сон/отдых/развлечения (по правилам time-периодов).

### 12.3 Качество источника и пререквизиты

1. **Качество образовательного контента**
   - Для книг/курсов добавить `qualityScore` и применять его как модификатор к итоговому усвоению.

2. **Пререквизиты программ**
   - Программы могут требовать базовые навыки/уровень подготовки.
   - При невыполненных prerequisites запуск блокируется с reason code (например, `missing_prerequisite`).

3. **Checkpoint-валидация шагов**
   - Некоторые шаги программ закрываются не только часами, но и проверкой (мини-экзамен/тест).

### 12.4 Риск незавершения и заморозки программ

1. **Dropout risk**
   - При хронически плохих needs, низкой дисциплине и перегрузке повышается риск срыва шага/заморозки программы.

2. **Прозрачное восстановление**
   - Замороженные программы можно возобновить через восстановление состояния и/или повтор prerequisite-step.

---

## Раздел 13: Knowledge-to-Unlock (связка с действиями и навыками)

Ключевой реализм: новые знания должны открывать новые возможности, а не только увеличивать цифры.

### 13.1 Канонический контракт unlock-механики

1. **Knowledge nodes**
   - Ввести сущность “knowledge node” (например, `meditation_basics`, `public_speaking_foundation`).
   - Узел открывается после выполнения условий (чтение книги, завершение шага программы, экзамен).

2. **Unlock effects**
   - Узел может:
     - открыть новый навык;
     - открыть новые action-карточки (fun/health/social/career/education);
     - дать доступ к новым программам/карьерным трекам.

3. **Пример из запроса**
   - Книга по медитации -> открывается node `meditation_basics` -> появляется новая карточка развлечения/восстановления “Практика медитации” + активируется соответствующий навык.

### 13.2 Интеграция с системой действий

1. **Action gating by knowledge**
   - Для действий добавить опциональные `requiredKnowledge[]`.
   - Если знания нет — карточка скрыта или disabled с объяснением.

2. **Каталоги действий**
   - Применять knowledge-gating единообразно во всех доменах (`fun`, `health`, `career`, `social`, `education`, `recovery`).

### 13.3 Интеграция с системой навыков

1. **Skill unlock strategy**
   - Разделить:
     - `skill_unlocked` (получен доступ к навыку),
     - `skill_progress` (прокачка навыка после unlock).

2. **События и время**
   - Каждое unlock-событие публиковать через `EventIngress` (`knowledge_unlocked`, `skill_unlocked`, `action_unlocked`).
   - unlock происходит атомарно с шагом обучения и учетом времени.

### 13.4 Переход к отдельному плану систем действий/навыков

1. **Новый производный план**
   - Использовать мастер-документ: `plans/system-sync-plan.md`.
   - Scope:
     - унификация gating для actions;
     - контракт knowledge nodes;
     - синхронизация skill progression с education/time/events;
     - миграция существующих карточек в новую модель unlock.

2. **Зависимости**
   - После завершения Phase 1 текущего education-плана.
   - Желательно параллельно с `event-system-sync` Phase 2/3 и `time-system-refresh` PR2/PR3.

---

## Риски и ограничения

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| Возраст добавлен только в `education-actions`, но не в программы | высокая | критическое | Планировать оба слоя вместе (Этапы 1–3) |
| `/game/education` останется оторванной от `education-actions` | высокая | высокое | Зафиксировать архитектурное решение в Этапе 0 (рекомендация: Вариант B) |
| `education` останется без unlock-age | средняя | высокое | Явно включить в `TAB_UNLOCK_AGE` (Этап 6) |
| Программы скрыты, но без объяснения | средняя | среднее | Добавить причину недоступности (Этап 5) |
| Слишком широкие названия действий продолжат ломать реализм | высокая | среднее | Переименовать или дробить спорные actions (отдельная задача) |
| Возрастная модель проекта останется несинхронной (`ADULT 19+`) | высокая | высокое | Делать вместе с общей age-реформой из fun-age-restrictions-plan |
| `recovery-tabs.ts` позволяет обойти возрастные ограничения | средняя | высокое | Проверить и добавить age-фильтрацию (Этап 7) |
| `EducationSystem` не имеет доступа к возрасту персонажа | средняя | высокое | Добавить чтение `TIME_COMPONENT` (Этап 4) |
| Needs-факторы усвоения будут слишком жесткими или слишком слабыми | средняя | среднее | Ввести caps/пороги, откалибровать по telemetry и интеграционным тестам |
| Новые unlock-правила создадут фрагментацию UX (игрок не понимает, что открылось) | средняя | высокое | Ввести единый журнал unlock-событий + объясняющие reason/tooltip в карточках |
| Зависимости между знаниями и действиями станут чрезмерно сложными | средняя | среднее | Ограничить глубину prerequisite-цепочек (не более 2 уровней в v1) |

**Ограничения:**

- часть детского обучения уже живёт в отдельной childhood-системе и не должна мигрировать;
- текущий UI `/game/education` ориентирован на программы, а не на полный каталог обучения;
- карьерная логика уже зависит от `educationLevel`, значит изменения в программах потенциально затрагивают карьерный баланс;
- `recovery-tabs.ts` — ещё один источник образовательного контента, который нужно проверить.

---

## Открытые вопросы

1. **Должна ли вкладка `/game/education` включать `education-actions`?** Рекомендация: да (Вариант B).
2. **С какого возраста должна открываться вкладка `education`: 8, 13 или раньше?** Рекомендация: `education: 8`.
3. **`edu_online_course` — это школьный онлайн-курс или уже взрослый e-learning формат?** Рекомендация: `CHILD`, но в будущем разбить.
4. **`edu_webinar` — оставлять ли как взрослый термин, или переименовать?** Рекомендация: `TEEN`, переименование не обязательно.
5. **Нужно ли запрещать ранним возрастам видеть взрослые программы полностью, или лучше показывать disabled-карточки «на вырост»?** Рекомендация: скрывать полностью.
6. **Нужен ли `maxAgeGroup` для education?** Рекомендация: на первом этапе нет, достаточно `minAgeGroup`. Если UI покажет нелепые карточки — добавить.
7. **`time_management_book` — `TEEN` или `CHILD`?** Рекомендация: `TEEN`, потому что текущая книга и подача явно self-management oriented.
8. **Как `EducationSystem` получит возраст персонажа?** Рекомендация: читать `TIME_COMPONENT` и вычислять через `getAgeGroup()`.
9. **Какие конкретно статы входят в `learningEfficiency` и какие у них веса?** Рекомендация: начать с простого профиля (обучаемость, дисциплина, `sleepDebt`) и откалибровать по telemetry.
10. **Нужна ли частичная награда за шаги программы или только награда в конце?** Рекомендация: небольшие milestone-награды + основной бонус в финале.
11. **Нужна ли корректировка порогов needs после релиза v1?** Рекомендация: да, только на основе telemetry (`learningEfficiency.avg`, `penalty.byNeeds`) и без изменения базового контракта формулы.
12. **Как показывать заблокированные knowledge-gated действия: скрывать или показывать disabled?** Рекомендация: в v1 показывать disabled для ближайших unlock и скрывать дальние.
13. **Нужно ли открывать навык сразу при получении знания, или только после first-practice действия?** Рекомендация: unlock сразу, прогресс — только через практику.

---

## Оценка трудозатрат

| Этап | Время | Зависимости |
|------|-------|-------------|
| Этап 0 — Модель возраста для обучения | 30 мин | fun-age-restrictions Этап 0 |
| Этап 1 — Разметка `education-actions.ts` | 1–2 ч | Этап 0 |
| Этап 2 — Расширение `EducationProgram` | 30 мин | Этап 0 |
| Этап 3 — Разметка программ | 30 мин | Этап 2 |
| Этап 4 — Проверки в `EducationSystem` | 1 ч | Этап 3 |
| Этап 5 — UI `/game/education` | 1–2 ч | Этапы 1, 4 |
| Этап 6 — Unlock-age и детский контур | 30–60 мин | Этап 0 |
| Этап 7 — Проверка `recovery-tabs.ts` | 30 мин | Этап 4 |
| Этап 8 — Тестирование | 1–2 ч | Этапы 5, 6, 7 |
| Этап 9 — Модель усвоения + шаги программ + UI прогресса | 2–4 ч | Этапы 4, 5; синхронизация с Time/Event v2 |
| Этап 10 — Needs-интеграция в `learningEfficiency` + калибровка порогов | 1–2 ч | Этап 9; доступ к needs-состоянию персонажа |
| Этап 11 — Realism Expansion Pack (forgetting, spaced repetition, mental fatigue, prerequisites) | 2–4 ч | Этапы 9, 10; Event/Time sync |
| Этап 12 — Knowledge-to-Unlock (новые действия/навыки) + черновик actions-skills плана | 2–4 ч | Этап 11; интеграция с action/skill системами |
| **Итого** | **13–24 часов** | — |

---

## Критерии приёмки (Definition of Done)

- [ ] `education-actions.ts` размечен по возрастам (38 действий с `ageGroup`)
- [ ] `EducationProgram` поддерживает `minAgeGroup` и `ageReason`
- [ ] Все 6 программ в `education-programs.ts` имеют age-контекст
- [ ] `EducationSystem.canStartEducationProgram()` учитывает возраст
- [ ] Ребёнок не может начать adult-программы (`institute_retraining`, `edu_mba`)
- [ ] `/game/education` не показывает абсурдные по возрасту программы
- [ ] `/game/education` показывает `education-actions` (Вариант B) с age-фильтрацией
- [ ] Вкладка `education` имеет корректный unlock-age (8 лет)
- [ ] INFANT и TODDLER не видят вкладку `education`
- [ ] Подростки видят релевантное самообразование, молодёжь — ранне-профессиональное обучение, взрослые — полный набор
- [ ] Нет разрыва между childhood-обучением, учебными actions и долгими программами
- [ ] `recovery-tabs.ts` не позволяет обойти возрастные ограничения
- [ ] Образовательный flow использует только канонический time-контракт (`advanceHours`), без прямых мутаций времени
- [ ] Образовательные события идут через `EventIngress`, имеют детерминированный `instanceId` и не дублируются
- [ ] Добавлены интеграционные тесты синхронизации `education <-> time <-> events` (включая period boundaries)
- [ ] Добавлены метрики/диагностика по старту/отказам/завершению программ обучения
- [ ] Учебные действия используют модель неполного усвоения (`learningEfficiency`), а не фиксированный 100% эффект
- [ ] Есть anti-grind логика (убывающая отдача при спаме одинаковых учебных действий)
- [ ] Длительные программы разбиты на шаги, UI показывает текущий шаг и остаток часов
- [ ] Milestone-шаги программ публикуют события через `EventIngress` и корректно синхронизированы по времени
- [ ] Потребности персонажа (`hunger`, `energy`, `mood` и др.) влияют на усвоение через `needsPenaltyMultiplier`
- [ ] При критически плохом состоянии потребностей усвоение заметно снижается, при нормальном состоянии остается в целевом диапазоне
- [ ] Для needs-факторов применена фиксированная пороговая модель v1 (веса/штрафы/hard-stop), описанная в плане
- [ ] Введены realism-механики: forgetting curve, spaced repetition, дневной cognitive cap, prerequisites/checkpoints
- [ ] Knowledge nodes открывают новые навыки и action-карточки в релевантных разделах (включая пример с медитацией)
- [ ] Unlock-события (`knowledge_unlocked`/`skill_unlocked`/`action_unlocked`) проходят через `EventIngress` и не дублируются
- [ ] Межсистемная синхронизация оформлена и поддерживается в `system-sync-plan`
- [ ] `npm run build` проходит без ошибок
