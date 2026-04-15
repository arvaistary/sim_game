import { AgeGroup } from '../../actions/types'
import type { ChildhoodEventDef } from '../../types/childhood-event'

/**
 * Детские события: 13-15 лет (Средняя школа)
 * Гормональный взрыв. Формируется характер и социальный статус.
 * 27 событий.
 */
export const TEEN_EVENTS: ChildhoodEventDef[] = [
  {
    id: 'teen_first_love',
    title: 'Первая любовь',
    description: 'Ты увидел её/его и мир перевернулся. Все песни теперь об этом.',
    ageGroup: AgeGroup.TEEN,
    type: 'fateful',
    probability: 0.05,
    repeatable: false,
    choices: [
      {
        label: 'Признаться',
        description: 'Ты покраснел до ушей. Она/он улыбнулась.',
        statChanges: { mood: 40, stress: 25 },
        skillChanges: { empathy: 1.0, courage: 0.5 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Ты всегда будешь помнить это чувство.', statChanges: { mood: 10 }, memoryId: 'first_love_confession' },
        ],
      },
      {
        label: 'Молчать',
        description: 'Ты так и не сказал. Она/он ушла с другим.',
        statChanges: { mood: -20, stress: 20 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Ты иногда думаешь — что если бы сказал?', statChanges: { mood: -5 }, memoryId: 'first_love_silence' },
        ],
      },
    ],
  },
  {
    id: 'teen_first_rejection',
    title: 'Первый отказ',
    description: 'Ты набрался смелости и... получил отказ. Мир рухнул.',
    ageGroup: AgeGroup.TEEN,
    type: 'formative',
    probability: 0.25,
    repeatable: false,
    choices: [
      {
        label: 'Принять',
        description: 'Больно. Но ты выдержал. Ты стал сильнее.',
        statChanges: { mood: -35, stress: 40 },
        skillChanges: { resilience: 1.0, selfEsteem: 0.5 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Отказы больше не пугают тебя.', statChanges: { mood: 5 }, memoryId: 'learned_rejection' },
        ],
      },
      {
        label: 'Обидеться',
        description: 'Ты перестал с ней/ним разговаривать. Навсегда.',
        statChanges: { mood: -25, stress: 30 },
        delayedConsequences: [
          { yearsLater: 8, description: 'Ты научился строить стены.', grantTrait: 'tough', memoryId: 'built_walls' },
        ],
      },
    ],
  },
  {
    id: 'teen_phone_hiding',
    title: 'Телефон',
    description: 'Родители опять спрашивают с кем ты переписываешься.',
    ageGroup: AgeGroup.TEEN,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Показать',
        description: 'Мама прочитала и расстроилась. Конфликт.',
        statChanges: { stress: 20, mood: -15 },
        delayedConsequences: [
          { yearsLater: 8, description: 'Ты иногда думаешь — что если бы выбрал иначе?', statChanges: { mood: -3 }, memoryId: 'teen_phone_hiding_dc5' },
        ],
      },
      {
        label: 'Спрятать',
        description: 'Моя личная жизнь — моё дело!',
        statChanges: { mood: 5, stress: 10 },
        skillChanges: { selfControl: 0.3 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Подростковые годы... Ты был таким другим.', statChanges: { mood: 3 }, memoryId: 'teen_phone_hiding_dc6' },
        ],
      },
    ],
  },
  {
    id: 'teen_alcohol_party',
    title: 'Вечеринка',
    description: 'Старшеклассники позвали на вечеринку. Будет алкоголь.',
    ageGroup: AgeGroup.TEEN,
    type: 'formative',
    probability: 0.25,
    repeatable: false,
    choices: [
      {
        label: 'Попробовать',
        description: 'Голова кружится. Смешно. Утром будет плохо.',
        statChanges: { mood: 20, stress: 15, health: -10 },
        skillChanges: { riskTolerance: 0.5 },
        delayedConsequences: [
          { yearsLater: 5, description: 'Ты помнишь эту вечеринку. И то что было после.', memoryId: 'first_alcohol' },
        ],
      },
      {
        label: 'Отказаться',
        description: 'Ты ушёл. Дома скучно, но голова не болит.',
        statChanges: { mood: -5, stress: 5 },
        skillChanges: { selfControl: 0.5 },
        delayedConsequences: [
          { yearsLater: 8, description: 'Ты иногда думаешь — что если бы выбрал иначе?', statChanges: { mood: -3 }, memoryId: 'teen_alcohol_party_dc8' },
        ],
      },
    ],
  },
  {
    id: 'teen_fight_lose',
    title: 'Драка — проигрыш',
    description: 'Ты подрался и проиграл. Тебя унизили перед всеми.',
    ageGroup: AgeGroup.TEEN,
    type: 'formative',
    probability: 0.25,
    repeatable: false,
    choices: [
      {
        label: 'Принять поражение',
        description: 'Больно. Но ты встал. Это тоже сила.',
        statChanges: { mood: -30, stress: 35 },
        skillChanges: { resilience: 1.0, humility: 0.5 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Подростковые годы... Ты был таким другим.', statChanges: { mood: 3 }, memoryId: 'teen_fight_lose_dc9' },
        ],
      },
      {
        label: 'Планировать реванш',
        description: 'Ты запомнил. Когда-нибудь...',
        statChanges: { mood: -20, stress: 25 },
        delayedConsequences: [
          { yearsLater: 5, description: 'Ты так и не отомстил. Но не забыл.', grantTrait: 'vengeful', memoryId: 'revenge_planned' },
        ],
      },
    ],
  },
  {
    id: 'teen_fight_win',
    title: 'Драка — победа',
    description: 'Ты подрался и выиграл! Все смотрят с уважением.',
    ageGroup: AgeGroup.TEEN,
    type: 'formative',
    probability: 0.25,
    repeatable: false,
    choices: [
      {
        label: 'Гордиться',
        description: 'Теперь тебя боятся. Это власть.',
        statChanges: { mood: 30, stress: -10 },
        skillChanges: { confidence: 0.8 },
        delayedConsequences: [
          { yearsLater: 8, description: 'Ты иногда думаешь — что если бы выбрал иначе?', statChanges: { mood: -3 }, memoryId: 'teen_fight_win_dc11' },
        ],
      },
      {
        label: 'Пожалеть',
        description: 'Он лежит на земле. Ты не ожидал что будет так.',
        statChanges: { mood: 10, stress: 10 },
        skillChanges: { empathy: 0.5 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Подростковые годы... Ты был таким другим.', statChanges: { mood: 3 }, memoryId: 'teen_fight_win_dc12' },
        ],
      },
    ],
  },
  {
    id: 'teen_skip_school',
    title: 'Сбежать с уроков',
    description: 'Весна. Солнце. Уроки подождут.',
    ageGroup: AgeGroup.TEEN,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Гулять!',
        description: 'Лучший день. Ты гулял по городу один.',
        statChanges: { mood: 35, stress: -20 },
        skillChanges: { independence: 0.3 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Этот выбор до сих пор определяет кто ты.', statChanges: { mood: -5 }, memoryId: 'teen_skip_school_dc13' },
        ],
      },
      {
        label: 'Остаться',
        description: 'Правильное решение. Скучное решение.',
        statChanges: { mood: -5, stress: 5 },
        skillChanges: { discipline: 0.3 },
        delayedConsequences: [
          { yearsLater: 8, description: 'Ты иногда думаешь — что если бы выбрал иначе?', statChanges: { mood: -3 }, memoryId: 'teen_skip_school_dc14' },
        ],
      },
    ],
  },
  {
    id: 'teen_start_sport',
    title: 'Спорт серьёзно',
    description: 'Тренер говорит что у тебя талант. Можно заниматься серьёзно.',
    ageGroup: AgeGroup.TEEN,
    type: 'formative',
    probability: 0.25,
    repeatable: false,
    choices: [
      {
        label: 'Тренироваться!',
        description: 'Каждый день. Боль. Пот. Но ты становишься сильнее.',
        statChanges: { mood: 15, stress: -10, energy: -30 },
        skillChanges: { physicalStrength: 1.0, endurance: 0.8, discipline: 0.5 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Спорт стал частью твоей жизни навсегда.', statChanges: { health: 10 }, memoryId: 'sport_for_life' },
        ],
      },
      {
        label: 'Не надо',
        description: 'Слишком много усилий. Лучше поиграть в приставку.',
        statChanges: { mood: 10 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Этот выбор до сих пор определяет кто ты.', statChanges: { mood: -5 }, memoryId: 'teen_start_sport_dc16' },
        ],
      },
    ],
  },
  {
    id: 'teen_drop_interests',
    title: 'Всё надоело',
    description: 'То что ты любил раньше кажется детским. Ты другой человек.',
    ageGroup: AgeGroup.TEEN,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Отказаться от всего',
        description: 'Новая музыка. Новая одежда. Новый ты.',
        statChanges: { mood: 10, stress: 10 },
        skillChanges: { selfEsteem: 0.5 },
        delayedConsequences: [
          { yearsLater: 8, description: 'Ты иногда думаешь — что если бы выбрал иначе?', statChanges: { mood: -3 }, memoryId: 'teen_drop_interests_dc17' },
        ],
      },
      {
        label: 'Оставить что-то',
        description: 'Некоторые вещи всё ещё важны. Не всё нужно менять.',
        statChanges: { mood: 5 },
        skillChanges: { selfControl: 0.3 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Подростковые годы... Ты был таким другим.', statChanges: { mood: 3 }, memoryId: 'teen_drop_interests_dc18' },
        ],
      },
    ],
  },
  {
    id: 'teen_diary',
    title: 'Дневник',
    description: 'Ты начал записывать свои мысли. На бумаге они выглядят иначе.',
    ageGroup: AgeGroup.TEEN,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Писать каждый день',
        description: 'Ты выливаешь всё на бумагу. Становится легче.',
        statChanges: { mood: 10, stress: -15 },
        skillChanges: { selfEsteem: 0.5, creativity: 0.3 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Этот выбор до сих пор определяет кто ты.', statChanges: { mood: -5 }, memoryId: 'teen_diary_dc19' },
        ],
      },
      {
        label: 'Забросить через неделю',
        description: 'Идея была хорошая. Но лень.',
        statChanges: { mood: 5 },
        delayedConsequences: [
          { yearsLater: 8, description: 'Ты иногда думаешь — что если бы выбрал иначе?', statChanges: { mood: -3 }, memoryId: 'teen_diary_dc20' },
        ],
      },
    ],
  },
  {
    id: 'teen_feel_unwanted',
    title: 'Никому не нужен',
    description: 'Всего один плохой день. Но мир рушится.',
    ageGroup: AgeGroup.TEEN,
    type: 'formative',
    probability: 0.25,
    repeatable: false,
    choices: [
      {
        label: 'Поговорить с кем-то',
        description: 'Мама обняла тебя. «Я всегда рядом.»',
        statChanges: { mood: -20, stress: 25 },
        skillChanges: { trustInPeople: 0.5 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Ты знаешь что всегда есть к кому обратиться.', statChanges: { mood: 10 }, memoryId: 'asked_for_help' },
        ],
      },
      {
        label: 'Замкнуться',
        description: 'Никто не поймёт. Ты один.',
        statChanges: { mood: -35, stress: 40 },
        delayedConsequences: [
          { yearsLater: 8, description: 'Ты научился справляться один.', grantTrait: 'selfSufficient', memoryId: 'alone_with_pain' },
        ],
      },
    ],
  },
  {
    id: 'teen_betray_friend',
    title: 'Предательство друга',
    description: 'Ты рассказал секрет лучшего друга другим. Он узнал.',
    ageGroup: AgeGroup.TEEN,
    type: 'fateful',
    probability: 0.05,
    repeatable: false,
    choices: [
      {
        label: 'Извиниться',
        description: 'Ты извинился. Он простил. Но что-то сломалось.',
        statChanges: { mood: -10, stress: 20 },
        skillChanges: { empathy: 0.5 },
        delayedConsequences: [
          { yearsLater: 8, description: 'Ты иногда думаешь — что если бы выбрал иначе?', statChanges: { mood: -3 }, memoryId: 'teen_betray_friend_dc23' },
        ],
      },
      {
        label: 'Не признавать',
        description: 'Это не я. Ты сам кому-то рассказал.',
        statChanges: { mood: 5, stress: 25 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Ты потерял лучшего друга навсегда.', statChanges: { mood: -15 }, memoryId: 'lost_best_friend' },
        ],
      },
    ],
  },
  {
    id: 'teen_get_betrayed',
    title: 'Тебя предали',
    description: 'Лучший друг рассказал всем твой самый большой секрет.',
    ageGroup: AgeGroup.TEEN,
    type: 'fateful',
    probability: 0.05,
    repeatable: false,
    choices: [
      {
        label: 'Простить',
        description: 'Ты простил. Но доверять уже не сможешь.',
        statChanges: { mood: -25, stress: 35 },
        skillChanges: { empathy: 0.8, forgiveness: 0.5 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Ты научился прощать. Но не забывать.', grantTrait: 'forgiving', memoryId: 'forgave_betrayal' },
        ],
      },
      {
        label: 'Никогда не простить',
        description: 'Ты вычеркнул его из своей жизни.',
        statChanges: { mood: -40, stress: 45 },
        delayedConsequences: [
          { yearsLater: 8, description: 'Ты запоминаешь всех кто тебя предал.', grantTrait: 'vengeful', memoryId: 'never_forgive' },
        ],
      },
    ],
  },
  {
    id: 'teen_download_music',
    title: 'Торренты',
    description: 'Весь мир музыки — бесплатно. Надо только скачать.',
    ageGroup: AgeGroup.TEEN,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Качать!',
        description: 'Новая музыка каждый день. Ты открыл для себя столько групп!',
        statChanges: { mood: 20, stress: -10 },
        skillChanges: { curiosity: 0.3 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Подростковые годы... Ты был таким другим.', statChanges: { mood: 3 }, memoryId: 'teen_download_music_dc27' },
        ],
      },
      {
        label: 'Не надо',
        description: 'Вирусы. И вообще, это воровство.',
        statChanges: { mood: 5 },
        skillChanges: { honesty: 0.2 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Этот выбор до сих пор определяет кто ты.', statChanges: { mood: -5 }, memoryId: 'teen_download_music_dc28' },
        ],
      },
    ],
  },
  {
    id: 'teen_first_kiss',
    title: 'Первый поцелуй',
    description: 'Дискотека. Медленный танец. Она/он смотрит на тебя.',
    ageGroup: AgeGroup.TEEN,
    type: 'fateful',
    probability: 0.05,
    repeatable: false,
    chainTag: 'first_kiss',
    choices: [
      {
        label: 'Поцеловать',
        description: 'Неловко. Мокро. Но это самый лучший момент в жизни.',
        statChanges: { mood: 45, stress: 20 },
        skillChanges: { empathy: 0.8, confidence: 0.5 },
        delayedConsequences: [
          { yearsLater: 20, description: 'Ты всегда будешь улыбаться вспоминая этот момент.', statChanges: { mood: 15 }, memoryId: 'first_kiss' },
        ],
      },
      {
        label: 'Сбежать',
        description: 'Ты убежал. Струсил. Она/он стояла одна.',
        statChanges: { mood: -15, stress: 25 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Ты до сих пор жалеешь что струсил.', statChanges: { mood: -10 }, memoryId: 'first_kiss_chicken' },
        ],
      },
    ],
  },
  {
    id: 'teen_parent_conflict',
    title: 'Конфликт с родителями',
    description: '«Ты ничего не понимаешь!» — кричишь ты. Дверь хлопает.',
    ageGroup: AgeGroup.TEEN,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Уйти из дома',
        description: 'Ты ушёл гулять. Вернулся через 2 часа. Никто не заметил.',
        statChanges: { mood: -10, stress: 20 },
        skillChanges: { independence: 0.3 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Этот выбор до сих пор определяет кто ты.', statChanges: { mood: -5 }, memoryId: 'teen_parent_conflict_dc31' },
        ],
      },
      {
        label: 'Извиниться',
        description: 'Ты извинился. Мама обняла тебя. «Я тоже была неправа.»',
        statChanges: { mood: 10, stress: -10 },
        skillChanges: { empathy: 0.3, selfControl: 0.2 },
        delayedConsequences: [
          { yearsLater: 8, description: 'Ты иногда думаешь — что если бы выбрал иначе?', statChanges: { mood: -3 }, memoryId: 'teen_parent_conflict_dc32' },
        ],
      },
    ],
  },
  {
    id: 'teen_social_media',
    title: 'Соцсети',
    description: 'Все сидят в соцсетях. Тебя пригласили в группу.',
    ageGroup: AgeGroup.TEEN,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Активно участвовать',
        description: 'Лайки, комментарии, друзья. Ты популярен!',
        statChanges: { mood: 15 },
        skillChanges: { charisma: 0.3 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Подростковые годы... Ты был таким другим.', statChanges: { mood: 3 }, memoryId: 'teen_social_media_dc33' },
        ],
      },
      {
        label: 'Не интересно',
        description: 'Реальная жизнь интереснее.',
        statChanges: { mood: 5 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Этот выбор до сих пор определяет кто ты.', statChanges: { mood: -5 }, memoryId: 'teen_social_media_dc34' },
        ],
      },
    ],
  },
  {
    id: 'teen_exam_stress',
    title: 'Контрольная',
    description: 'Важная контрольная. От неё зависит четверть.',
    ageGroup: AgeGroup.TEEN,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Готовиться',
        description: 'Ты готовился всю ночь. Написал на 4. Неплохо.',
        statChanges: { stress: 15, mood: 5, energy: -20 },
        skillChanges: { logic: 0.3, memory: 0.3, persistence: 0.2 },
        delayedConsequences: [
          { yearsLater: 8, description: 'Ты иногда думаешь — что если бы выбрал иначе?', statChanges: { mood: -3 }, memoryId: 'teen_exam_stress_dc35' },
        ],
      },
      {
        label: 'Шпаргалка',
        description: 'Ты написал шпаргалку. Не поймали. Тройка.',
        statChanges: { mood: 5, stress: 10 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Подростковые годы... Ты был таким другим.', statChanges: { mood: 3 }, memoryId: 'teen_exam_stress_dc36' },
        ],
      },
    ],
  },
  {
    id: 'teen_new_hobby',
    title: 'Новое хобби',
    description: 'Ты увидел гитару в магазине. Хочется научиться.',
    ageGroup: AgeGroup.TEEN,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Купить и учиться',
        description: 'Пальцы болят. Но ты играешь «Ветер с моря дул»!',
        statChanges: { mood: 20, stress: -10 },
        skillChanges: { musicalEar: 0.5, persistence: 0.3 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Этот выбор до сих пор определяет кто ты.', statChanges: { mood: -5 }, memoryId: 'teen_new_hobby_dc37' },
        ],
      },
      {
        label: 'Дорого',
        description: 'Может потом. Когда-нибудь.',
        statChanges: { mood: -5 },
        delayedConsequences: [
          { yearsLater: 8, description: 'Ты иногда думаешь — что если бы выбрал иначе?', statChanges: { mood: -3 }, memoryId: 'teen_new_hobby_dc38' },
        ],
      },
    ],
  },
  {
    id: 'teen_bully_witness',
    title: 'Хулиганы',
    description: 'Хулиганы избивают младшеклассника. Никто не вмешивается.',
    ageGroup: AgeGroup.TEEN,
    type: 'formative',
    probability: 0.25,
    repeatable: false,
    choices: [
      {
        label: 'Вмешаться',
        description: 'Ты встал между ними. Хулиганы ушли. Мальчик благодарит.',
        statChanges: { mood: 15, stress: 10 },
        skillChanges: { courage: 0.8, empathy: 0.5 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Ты всегда заступаешься за слабых.', grantTrait: 'compassionate', memoryId: 'stood_up_to_bullies' },
        ],
      },
      {
        label: 'Пройти мимо',
        description: 'Не твоё дело. Но внутри что-то сжалось.',
        statChanges: { mood: -15, stress: 15 },
        delayedConsequences: [
          { yearsLater: 5, description: 'Ты иногда вспоминаешь тот день.', statChanges: { mood: -5 }, memoryId: 'walked_past_bully' },
        ],
      },
    ],
  },
  {
    id: 'teen_secret_relationship',
    title: 'Секретные отношения',
    description: 'Ты встречаешься с кем-то но родители не знают.',
    ageGroup: AgeGroup.TEEN,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Рассказать родителям',
        description: 'Мама сказала «Я рада за тебя.» Всё хорошо.',
        statChanges: { mood: 10, stress: -10 },
        skillChanges: { honesty: 0.3, trustInPeople: 0.2 },
        delayedConsequences: [
          { yearsLater: 8, description: 'Ты иногда думаешь — что если бы выбрал иначе?', statChanges: { mood: -3 }, memoryId: 'teen_secret_relationship_dc41' },
        ],
      },
      {
        label: 'Держать в секрете',
        description: 'Это ваше тайное место. Никто не должен знать.',
        statChanges: { mood: 15, stress: 5 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Подростковые годы... Ты был таким другим.', statChanges: { mood: 3 }, memoryId: 'teen_secret_relationship_dc42' },
        ],
      },
    ],
  },
  {
    id: 'teen_bad_company',
    title: 'Плохая компания',
    description: 'Новые «друзья» предлагают пойти в сомнительное место.',
    ageGroup: AgeGroup.TEEN,
    type: 'formative',
    probability: 0.25,
    repeatable: false,
    choices: [
      {
        label: 'Пойти',
        description: 'Ты пошёл. Было страшно и интересно одновременно.',
        statChanges: { mood: 10, stress: 20 },
        skillChanges: { riskTolerance: 0.5 },
        delayedConsequences: [
          { yearsLater: 5, description: 'Этот вечер изменил твоё отношение к риску.', memoryId: 'bad_company' },
        ],
      },
      {
        label: 'Отказаться',
        description: 'Ты сказал нет. Они засмеяли. Но ты знаешь что прав.',
        statChanges: { mood: -5, stress: 5 },
        skillChanges: { selfControl: 0.5 },
        delayedConsequences: [
          { yearsLater: 8, description: 'Ты иногда думаешь — что если бы выбрал иначе?', statChanges: { mood: -3 }, memoryId: 'teen_bad_company_dc44' },
        ],
      },
    ],
  },
  {
    id: 'teen_talent_show',
    title: 'Школьный концерт',
    description: 'Тебя пригласили выступить на школьном концерте.',
    ageGroup: AgeGroup.TEEN,
    type: 'formative',
    probability: 0.25,
    repeatable: false,
    choices: [
      {
        label: 'Выступить!',
        description: 'Страшно. Но ты вышел на сцену. Аплодисменты!',
        statChanges: { mood: 30, stress: 15 },
        skillChanges: { confidence: 0.8, charisma: 0.5 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Подростковые годы... Ты был таким другим.', statChanges: { mood: 3 }, memoryId: 'teen_talent_show_dc45' },
        ],
      },
      {
        label: 'Отказаться',
        description: 'Сцена не для тебя. Пусть выступают другие.',
        statChanges: { mood: -5 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Этот выбор до сих пор определяет кто ты.', statChanges: { mood: -5 }, memoryId: 'teen_talent_show_dc46' },
        ],
      },
    ],
  },
  {
    id: 'teen_grandparent_death',
    title: 'Бабушка умерла',
    description: 'Мама плачет. Бабушка больше не придёт.',
    ageGroup: AgeGroup.TEEN,
    type: 'fateful',
    probability: 0.05,
    repeatable: false,
    choices: [
      {
        label: 'Плакать с мамой',
        description: 'Вы плакали вместе. Это сблизило вас.',
        statChanges: { mood: -30, stress: 25 },
        skillChanges: { empathy: 0.8, capacityToLove: 0.5 },
        delayedConsequences: [
          { yearsLater: 20, description: 'Ты до сих пор скучаешь по её пирожкам.', statChanges: { mood: -5 }, memoryId: 'grandma_gone' },
        ],
      },
      {
        label: 'Быть сильным для мамы',
        description: 'Ты не плачешь. Ты держишь маму за руку.',
        statChanges: { mood: -20, stress: 30 },
        skillChanges: { responsibility: 0.5 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Подростковые годы... Ты был таким другим.', statChanges: { mood: 3 }, memoryId: 'teen_grandparent_death_dc48' },
        ],
      },
    ],
  },
  {
    id: 'teen_summer_job',
    title: 'Летняя подработка',
    description: 'Можно заработать свои первые деньги. Но придётся работать.',
    ageGroup: AgeGroup.TEEN,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Пойти работать',
        description: 'Тяжело. Но ты получил свои первые 5000 рублей!',
        statChanges: { mood: 15, stress: 10, energy: -20 },
        skillChanges: { responsibility: 0.5, discipline: 0.3 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Этот выбор до сих пор определяет кто ты.', statChanges: { mood: -5 }, memoryId: 'teen_summer_job_dc49' },
        ],
      },
      {
        label: 'Отдохнуть летом',
        description: 'Каникулы для того чтобы отдыхать!',
        statChanges: { mood: 20, stress: -10 },
        delayedConsequences: [
          { yearsLater: 8, description: 'Ты иногда думаешь — что если бы выбрал иначе?', statChanges: { mood: -3 }, memoryId: 'teen_summer_job_dc50' },
        ],
      },
    ],
  },
  {
    id: 'teen_social_media_2',
    title: 'Соцсети',
    description: 'Все в соцсетях. Тебя тоже зовут. Но родители говорят «подожди».',
    ageGroup: AgeGroup.TEEN,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Создать профиль',
        description: 'Новый мир! Лайки, друзья, комментарии. Ты в игре.',
        statChanges: { mood: 15, stress: 5 },
        skillChanges: { charisma: 0.3, attention: 0.2 },
        delayedConsequences: [
          { yearsLater: 8, description: 'Соцсети стали частью твоей жизни. Не всегда хорошей.', statChanges: { mood: -5 }, memoryId: 'first_social_media' },
        ],
      },
      {
        label: 'Подождать',
        description: 'Ты подождал. Может родители и правы.',
        statChanges: { mood: -5 },
        skillChanges: { selfControl: 0.3 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Этот выбор до сих пор определяет кто ты.', statChanges: { mood: -5 }, memoryId: 'teen_social_media_dc52' },
        ],
      },
    ],
  },
  {
    id: 'teen_pet_death',
    title: 'Питомец',
    description: 'Твой хомячок умер. Ты нашёл его утром. Тихо и неподвижно.',
    ageGroup: AgeGroup.TEEN,
    type: 'formative',
    probability: 0.25,
    repeatable: false,
    choices: [
      {
        label: 'Похоронить',
        description: 'Ты выкопал ямку под деревом. Положил цветок. Попрощался.',
        statChanges: { mood: -20, stress: 10 },
        skillChanges: { empathy: 0.5, forgiveness: 0.3 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Ты научился прощаться. Это пригодилось.', statChanges: { mood: 5 }, memoryId: 'first_goodbye' },
        ],
      },
      {
        label: 'Не смотреть',
        description: 'Ты попросил маму убрать. Не можешь.',
        statChanges: { mood: -25, stress: 15 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Подростковые годы... Ты был таким другим.', statChanges: { mood: 3 }, memoryId: 'teen_pet_death_dc54' },
        ],
      },
    ],
  },
  // ─── Цепочка «Дневник» (13 лет, 3 шага) ───
  {
    id: 'chain_diary_start',
    title: 'Дневник',
    description: 'Ты нашёл красивую тетрадь. Решил вести дневник. Первая запись.',
    ageGroup: AgeGroup.TEEN,
    type: 'formative',
    probability: 0.25,
    repeatable: false,
    chainTag: 'diary',
    choices: [
      {
        label: 'Писать честно',
        description: 'Ты написал всё как есть. Страшно и освобождающе.',
        statChanges: { mood: 5, stress: -10 },
        skillChanges: { selfEsteem: 0.3, honesty: 0.3 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Дневник стал твоим лучшим собеседником.', statChanges: { mood: 10 }, memoryId: 'diary_honest' },
        ],
      },
      {
        label: 'Писать красиво',
        description: 'Ты пишешь для того чтобы кто-то потом прочитал. Аккуратный почерк.',
        statChanges: { mood: 10 },
        skillChanges: { creativity: 0.3 },
        delayedConsequences: [
          { yearsLater: 8, description: 'Ты иногда думаешь — что если бы выбрал иначе?', statChanges: { mood: -3 }, memoryId: 'chain_diary_start_dc56' },
        ],
      },
    ],
  },
  {
    id: 'chain_diary_secret',
    title: 'Кто-то прочитал',
    description: 'Твой дневник кто-то читал. Страницы перелистнуты. Ты знаешь кто.',
    ageGroup: AgeGroup.TEEN,
    type: 'fateful',
    probability: 0.05,
    repeatable: false,
    chainTag: 'diary',
    condition: 'chain_diary_start',
    choices: [
      {
        label: 'Конфронтация',
        description: '«Ты читал мой дневник?!» Скандал. Доверие разрушено.',
        statChanges: { mood: -25, stress: 30 },
        skillChanges: { confidence: 0.3 },
        delayedConsequences: [
          { yearsLater: 8, description: 'Ты научился защищать свои границы.', statChanges: { mood: 5 }, memoryId: 'diary_confrontation' },
        ],
      },
      {
        label: 'Простить',
        description: 'Ты ничего не сказал. Но стал прятать дневник.',
        statChanges: { mood: -15, stress: 15 },
        skillChanges: { forgiveness: 0.3 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Этот выбор до сих пор определяет кто ты.', statChanges: { mood: -5 }, memoryId: 'chain_diary_secret_dc58' },
        ],
      },
      {
        label: 'Больше не писать',
        description: 'Ты порвал тетрадь. Больше никаких секретов на бумаге.',
        statChanges: { mood: -20, stress: 10 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Ты жалеешь что перестал писать. Там было столько мыслей.', statChanges: { mood: -5 }, memoryId: 'stopped_writing' },
        ],
      },
    ],
  },
  {
    id: 'chain_diary_reflection',
    title: 'Перечитывая себя',
    description: 'Год спустя ты нашёл старый дневник. Перечитал. Кто этот наивный человек?',
    ageGroup: AgeGroup.TEEN,
    type: 'formative',
    probability: 0.25,
    repeatable: false,
    chainTag: 'diary',
    condition: 'chain_diary_secret',
    choices: [
      {
        label: 'Продолжить писать',
        description: 'Ты купил новый дневник. Начал с чистого листа. Но уже мудрее.',
        statChanges: { mood: 15, stress: -5 },
        skillChanges: { selfEsteem: 0.5, learningAbility: 0.3 },
        delayedConsequences: [
          { yearsLater: 20, description: 'Дневники — летопись твоей жизни. Ты рад что продолжил.', statChanges: { mood: 15 }, memoryId: 'diary_continued' },
        ],
      },
      {
        label: 'Улыбнуться и забыть',
        description: 'Какой смешной ты был. Но это в прошлом.',
        statChanges: { mood: 10 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Этот выбор до сих пор определяет кто ты.', statChanges: { mood: -5 }, memoryId: 'chain_diary_reflection_dc61' },
        ],
      },
    ],
  },
  // ─── Цепочка «Спорт или улица» (14 лет, 2 шага) ───
  {
    id: 'chain_sport_choice',
    title: 'Спорт или улица',
    description: 'Тренер приглашает в секцию. Но друзья зовут «тусоваться» после школы.',
    ageGroup: AgeGroup.TEEN,
    type: 'fateful',
    probability: 0.05,
    repeatable: false,
    chainTag: 'sport_or_street',
    choices: [
      {
        label: 'Спорт',
        description: 'Тренировки каждый день. Больно. Тяжело. Но ты становишься сильнее.',
        statChanges: { mood: 5, stress: 15, energy: -15 },
        skillChanges: { physicalStrength: 0.8, endurance: 0.5, discipline: 0.5 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Спорт сформировал твой характер. Дисциплина на всю жизнь.', statChanges: { mood: 15 }, memoryId: 'chose_sport' },
        ],
      },
      {
        label: 'Улица',
        description: 'Друзья, приключения, свобода. Школьные годы — лучшие!',
        statChanges: { mood: 20, stress: 5 },
        skillChanges: { charisma: 0.5, riskTolerance: 0.3 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Улица научила тебя разбираться в людях. По-своему ценно.', statChanges: { mood: 5 }, memoryId: 'chose_street' },
        ],
      },
    ],
  },
  {
    id: 'chain_sport_result',
    title: 'Результат выбора',
    description: 'Прошёл год. Ты видишь результат своего выбора.',
    ageGroup: AgeGroup.TEEN,
    type: 'formative',
    probability: 0.25,
    repeatable: false,
    chainTag: 'sport_or_street',
    condition: 'chain_sport_choice',
    choices: [
      {
        label: 'Не жалеешь',
        description: 'Ты доволен. Каждый день был правильным.',
        statChanges: { mood: 15, stress: -5 },
        skillChanges: { selfEsteem: 0.3 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Этот выбор до сих пор определяет кто ты.', statChanges: { mood: -5 }, memoryId: 'chain_sport_result_dc64' },
        ],
      },
      {
        label: 'А что если...',
        description: 'Ты иногда думаешь — что если бы выбрал иначе?',
        statChanges: { mood: -5, stress: 5 },
        delayedConsequences: [
          { yearsLater: 8, description: 'Ты иногда думаешь — что если бы выбрал иначе?', statChanges: { mood: -3 }, memoryId: 'chain_sport_result_dc65' },
        ],
      },
    ],
  },
  // ─── Цепочка «Предательство друга» (15 лет, 2 шага) ───
  {
    id: 'chain_friend_betrayal',
    title: 'Предательство',
    description: 'Твой лучший друг рассказал всем твой секрет. Тот самый. Самый важный.',
    ageGroup: AgeGroup.TEEN,
    type: 'fateful',
    probability: 0.05,
    repeatable: false,
    chainTag: 'friend_betrayal',
    choices: [
      {
        label: 'Простить',
        description: '«Я прощаю тебя.» Он не заслуживает. Но ты не хочешь носить это.',
        statChanges: { mood: -15, stress: 10 },
        skillChanges: { forgiveness: 0.8, empathy: 0.3 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Прощение далось тяжело. Но ты стал свободнее.', statChanges: { mood: 10 }, memoryId: 'forgave_betrayal' },
        ],
      },
      {
        label: 'Отомстить',
        description: 'Улыбка. План. Он пожалеет. Ты подставил его через месяц.',
        statChanges: { mood: -10, stress: 20 },
        skillChanges: { grudge: 0.8 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Месть не принесла удовлетворения. Только пустоту.', statChanges: { mood: -10 }, memoryId: 'revenged_betrayal' },
        ],
      },
      {
        label: 'Исчезнуть',
        description: 'Ты просто перестал с ним общаться. Без объяснений.',
        statChanges: { mood: -20, stress: 5 },
        delayedConsequences: [
          { yearsLater: 20, description: 'Ты так и не узнал почему он это сделал.', statChanges: { mood: -5 }, memoryId: 'ghosted_friend' },
        ],
      },
    ],
  },
  {
    id: 'chain_friend_betrayal_aftermath',
    title: 'После предательства',
    description: 'Прошло полгода. Ты встретил его в коридоре. Он смотрит в пол.',
    ageGroup: AgeGroup.TEEN,
    type: 'formative',
    probability: 0.25,
    repeatable: false,
    chainTag: 'friend_betrayal',
    condition: 'chain_friend_betrayal',
    choices: [
      {
        label: 'Поговорить',
        description: '«Почему?» Он рассказал. У него были свои причины. Не оправдание, но объяснение.',
        statChanges: { mood: 5, stress: -10 },
        skillChanges: { empathy: 0.5, forgiveness: 0.3 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Подростковые годы... Ты был таким другим.', statChanges: { mood: 3 }, memoryId: 'chain_friend_betrayal_aftermath_dc69' },
        ],
      },
      {
        label: 'Пройти мимо',
        description: 'Вы разминулись. Как чужие.',
        statChanges: { mood: -5, stress: 5 },
        skillChanges: { grudge: 0.3 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Этот выбор до сих пор определяет кто ты.', statChanges: { mood: -5 }, memoryId: 'chain_friend_betrayal_aftermath_dc70' },
        ],
      },
    ],
  },
]
