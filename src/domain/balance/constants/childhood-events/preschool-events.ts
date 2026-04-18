import { AgeGroup } from '../../actions/types'
import type { ChildhoodEventDef } from '../../types/childhood-event'

/**
 * Детские события: 4-7 лет (Детский сад)
 * Первые осознанные выборы. Мир начинает открываться.
 * 25 событий.
 */
export const PRESCHOOL_EVENTS: ChildhoodEventDef[] = [
  {
    id: 'preschool_fight_for_toy',
    title: 'Драка за игрушку',
    description: 'Мальчик забрал твою любимую машинку. Он больше и сильнее.',
    ageGroup: AgeGroup.TODDLER,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Отобрать силой',
        description: 'Ты толкнул его и забрал машинку. Он заплакал.',
        statChanges: { mood: 10, stress: -5 },
        skillChanges: { confidence: 0.5 },
        delayedConsequences: [
          { yearsLater: 8, description: 'Ты научился брать что хочешь.', grantTrait: 'competitive', memoryId: 'took_by_force' },
        ],
      },
      {
        label: 'Попросить обратно',
        description: 'Ты попросил. Он отдал. Оказывается можно просто попросить.',
        statChanges: { mood: 15, stress: -10 },
        skillChanges: { charisma: 0.5, empathy: 0.3 },
        delayedConsequences: [
          { yearsLater: 12, description: 'Мама до сих пор рассказывает эту историю.', statChanges: { mood: 8 }, memoryId: 'preschool_fight_for_toy_dc2' },
        ],
      },
      {
        label: 'Плакать воспитателю',
        description: 'Воспитатель забрал машинку и отдал тебе. Но все смотрят.',
        statChanges: { mood: 5, stress: 5 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Ты иногда вспоминаешь этот день. Странное чувство.', statChanges: { mood: 5 }, memoryId: 'preschool_fight_for_toy_dc3' },
        ],
      },
    ],
  },
  {
    id: 'preschool_share_cookies',
    title: 'Печенье',
    description: 'У тебя пачка печенья. Рядом сидит девочка без ничего.',
    ageGroup: AgeGroup.TODDLER,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Поделиться',
        description: 'Девочка улыбнулась. Вы стали есть вместе.',
        statChanges: { mood: 20, stress: -10 },
        skillChanges: { empathy: 0.7, generosity: 0.5 },
        delayedConsequences: [
          { yearsLater: 20, description: 'Это воспоминание из другого мира. Ты был другим человеком.', statChanges: { mood: 3 }, memoryId: 'preschool_share_cookies_dc4' },
        ],
      },
      {
        label: 'Съесть самому',
        description: 'Вкусно! Но девочка смотрит на тебя грустными глазами.',
        statChanges: { mood: 5, stress: 5 },
        delayedConsequences: [
          { yearsLater: 12, description: 'Мама до сих пор рассказывает эту историю.', statChanges: { mood: 8 }, memoryId: 'preschool_share_cookies_dc5' },
        ],
      },
    ],
  },
  {
    id: 'preschool_hide_teacher',
    title: 'Прятки от воспитателя',
    description: 'Воспитательница считает до десяти. Где спрятаться?',
    ageGroup: AgeGroup.TODDLER,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Под стол',
        description: 'Она нашла тебя за 5 секунд. Но было весело!',
        statChanges: { mood: 20, stress: -10 },
        skillChanges: { curiosity: 0.3 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Ты иногда вспоминаешь этот день. Странное чувство.', statChanges: { mood: 5 }, memoryId: 'preschool_hide_teacher_dc6' },
        ],
      },
      {
        label: 'В шкаф',
        description: 'Темно и страшно, но она точно не найдёт! Нашла через минуту.',
        statChanges: { mood: 15, stress: 5 },
        skillChanges: { courage: 0.3 },
        delayedConsequences: [
          { yearsLater: 20, description: 'Это воспоминание из другого мира. Ты был другим человеком.', statChanges: { mood: 3 }, memoryId: 'preschool_hide_teacher_dc7' },
        ],
      },
    ],
  },
  {
    id: 'preschool_poem_concert',
    title: 'Утренник',
    description: 'Завтра утренник. Нужно выучить стишок. Длинный стишок.',
    ageGroup: AgeGroup.TODDLER,
    type: 'formative',
    probability: 0.25,
    repeatable: false,
    choices: [
      {
        label: 'Выучить идеально',
        description: 'Ты рассказал стишок без единой запинки. Все аплодировали!',
        statChanges: { mood: 25, stress: -15 },
        skillChanges: { memory: 0.8, confidence: 0.5 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Ты до сих пор помнишь этот стишок наизусть.', memoryId: 'poem_perfect' },
        ],
      },
      {
        label: 'Забить',
        description: 'Вместо стишка ты станцевал. Родители смеялись.',
        statChanges: { mood: 15 },
        skillChanges: { creativity: 0.5 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Ты иногда вспоминаешь этот день. Странное чувство.', statChanges: { mood: 5 }, memoryId: 'preschool_poem_concert_dc9' },
        ],
      },
    ],
  },
  {
    id: 'preschool_invisible_friend',
    title: 'Невидимый друг',
    description: 'Ты придумал друга которого никто не видит. Он говорит тебе интересные вещи.',
    ageGroup: AgeGroup.TODDLER,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Рассказывать всем',
        description: 'Взрослые переглядываются. Мама беспокоится.',
        statChanges: { mood: 10, stress: 5 },
        skillChanges: { creativity: 0.8, imagination: 0.6 },
        delayedConsequences: [
          { yearsLater: 20, description: 'Это воспоминание из другого мира. Ты был другим человеком.', statChanges: { mood: 3 }, memoryId: 'preschool_invisible_friend_dc10' },
        ],
      },
      {
        label: 'Держать в секрете',
        description: 'Это ваш секрет. Невидимый друг доволен.',
        statChanges: { mood: 15 },
        skillChanges: { creativity: 0.5, selfControl: 0.2 },
        delayedConsequences: [
          { yearsLater: 12, description: 'Мама до сих пор рассказывает эту историю.', statChanges: { mood: 8 }, memoryId: 'preschool_invisible_friend_dc11' },
        ],
      },
    ],
  },
  {
    id: 'preschool_sand_taste',
    title: 'Песок на вкус',
    description: 'Песочница. Все строят замки. А ты хочешь узнать — какой на вкус?',
    ageGroup: AgeGroup.TODDLER,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Попробовать',
        description: 'Хрустит. Невкусно. Но теперь ты знаешь!',
        statChanges: { mood: 5, health: -2 },
        skillChanges: { curiosity: 0.6 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Ты иногда вспоминаешь этот день. Странное чувство.', statChanges: { mood: 5 }, memoryId: 'preschool_sand_taste_dc12' },
        ],
      },
      {
        label: 'Не надо',
        description: 'Лучше строить замок. С мостом и рвом!',
        statChanges: { mood: 15 },
        skillChanges: { spatialThinking: 0.4, creativity: 0.3 },
        delayedConsequences: [
          { yearsLater: 20, description: 'Это воспоминание из другого мира. Ты был другим человеком.', statChanges: { mood: 3 }, memoryId: 'preschool_sand_taste_dc13' },
        ],
      },
    ],
  },
  {
    id: 'preschool_protect_small',
    title: 'Маленького обижают',
    description: 'Старшие мальчики отбирают у малыша игрушку. Он плачет.',
    ageGroup: AgeGroup.TODDLER,
    type: 'formative',
    probability: 0.25,
    repeatable: false,
    choices: [
      {
        label: 'Защитить',
        description: 'Ты встал между ними. Старшие ушли. Малыш обнял тебя.',
        statChanges: { mood: 25, stress: -10 },
        skillChanges: { courage: 0.8, empathy: 0.7, justice: 0.5 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Ты всегда встаёшь на защиту слабых.', grantTrait: 'compassionate', memoryId: 'protected_small' },
        ],
      },
      {
        label: 'Позвать взрослого',
        description: 'Воспитательница разобралась. Правильное решение.',
        statChanges: { mood: 10, stress: -5 },
        skillChanges: { responsibility: 0.4 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Ты иногда вспоминаешь этот день. Странное чувство.', statChanges: { mood: 5 }, memoryId: 'preschool_protect_small_dc15' },
        ],
      },
      {
        label: 'Пройти мимо',
        description: 'Не твоё дело. Но малыш смотрит тебе вслед.',
        statChanges: { mood: -10, stress: 10 },
        delayedConsequences: [
          { yearsLater: 12, description: 'Ты иногда вспоминаешь его глаза.', statChanges: { mood: -5 }, memoryId: 'walked_past' },
        ],
      },
    ],
  },
  {
    id: 'preschool_draw_walls',
    title: 'Рисунок на обоях',
    description: 'Ты нашёл фломастеры. Белая стена так и просит чтобы её разрисовали.',
    ageGroup: AgeGroup.TODDLER,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Нарисовать!',
        description: 'Солнце, домик, цветочки... Мама кричит. Но красиво же!',
        statChanges: { mood: 25, stress: 10 },
        skillChanges: { creativity: 1.0, art: 0.5 },
        delayedConsequences: [
          { yearsLater: 12, description: 'Мама до сих пор рассказывает эту историю.', statChanges: { mood: 8 }, memoryId: 'preschool_draw_walls_dc17' },
        ],
      },
      {
        label: 'Нарисовать на бумаге',
        description: 'Мама дала тебе альбом. Не так захватывающе, но мама не ругается.',
        statChanges: { mood: 15 },
        skillChanges: { creativity: 0.5, selfControl: 0.3 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Ты иногда вспоминаешь этот день. Странное чувство.', statChanges: { mood: 5 }, memoryId: 'preschool_draw_walls_dc18' },
        ],
      },
    ],
  },
  {
    id: 'preschool_eternal_question',
    title: 'Вечный вопрос',
    description: 'А почему небо синее? А почему трава зелёная? А откуда берутся дети?',
    ageGroup: AgeGroup.TODDLER,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Спрашивать пока не ответят',
        description: 'Мама устала отвечать. Но ты узнал много нового!',
        statChanges: { mood: 15 },
        skillChanges: { curiosity: 0.8, logic: 0.3 },
        delayedConsequences: [
          { yearsLater: 20, description: 'Это воспоминание из другого мира. Ты был другим человеком.', statChanges: { mood: 3 }, memoryId: 'preschool_eternal_question_dc19' },
        ],
      },
      {
        label: 'Придумать свой ответ',
        description: 'Небо синее потому что его покрасил великан. Точно!',
        statChanges: { mood: 20 },
        skillChanges: { creativity: 0.6, imagination: 0.5 },
        delayedConsequences: [
          { yearsLater: 12, description: 'Мама до сих пор рассказывает эту историю.', statChanges: { mood: 8 }, memoryId: 'preschool_eternal_question_dc20' },
        ],
      },
    ],
  },
  {
    id: 'preschool_fear_dark',
    title: 'Страх темноты',
    description: 'Ночь. В комнате темно. Под кроватью кто-то шуршит.',
    ageGroup: AgeGroup.TODDLER,
    type: 'formative',
    probability: 0.25,
    repeatable: false,
    choices: [
      {
        label: 'Посмотреть что там',
        description: 'Под кроватью оказался кот. Фух!',
        statChanges: { mood: 10, stress: -10 },
        skillChanges: { courage: 0.5, curiosity: 0.3 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Ты иногда вспоминаешь этот день. Странное чувство.', statChanges: { mood: 5 }, memoryId: 'preschool_fear_dark_dc21' },
        ],
      },
      {
        label: 'Звать маму',
        description: 'Мама включила свет. Никого нет. Но ты всё равно боишься.',
        statChanges: { stress: 15, mood: -5 },
        delayedConsequences: [
          { yearsLater: 8, description: 'Ты всё ещё спишь с включённым ночником.', statChanges: { stress: 5 }, memoryId: 'fear_of_dark' },
        ],
      },
      {
        label: 'Накрыться одеялом',
        description: 'Под одеялом безопасно. Монстры не пролезут.',
        statChanges: { stress: 10, mood: -5 },
        delayedConsequences: [
          { yearsLater: 12, description: 'Мама до сих пор рассказывает эту историю.', statChanges: { mood: 8 }, memoryId: 'preschool_fear_dark_dc23' },
        ],
      },
    ],
  },
  {
    id: 'preschool_superhero',
    title: 'Я супермен!',
    description: 'Ты надел плащ из полотенца и стоишь на табуретке. Можно летать!',
    ageGroup: AgeGroup.TODDLER,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Прыгнуть!',
        description: 'Ты полетел! На полсекунды. Потом приземлился на ковёр.',
        statChanges: { mood: 20, health: -3 },
        skillChanges: { confidence: 0.5, courage: 0.3 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Ты иногда вспоминаешь этот день. Странное чувство.', statChanges: { mood: 5 }, memoryId: 'preschool_superhero_dc24' },
        ],
      },
      {
        label: 'Спасать игрушки',
        description: 'Мишка попал в беду! Супермен спешит на помощь!',
        statChanges: { mood: 25 },
        skillChanges: { empathy: 0.4, imagination: 0.5 },
        delayedConsequences: [
          { yearsLater: 20, description: 'Это воспоминание из другого мира. Ты был другим человеком.', statChanges: { mood: 3 }, memoryId: 'preschool_superhero_dc25' },
        ],
      },
    ],
  },
  {
    id: 'preschool_lie_broken_vase',
    title: 'Разбитая ваза',
    description: 'Ты разбил мамину любимую вазу. Осколки на полу. Мама скоро придёт.',
    ageGroup: AgeGroup.TODDLER,
    type: 'formative',
    probability: 0.25,
    repeatable: false,
    choices: [
      {
        label: 'Сказать правду',
        description: 'Мама обняла тебя и сказала «Вазы бывают новые, а ты один».',
        statChanges: { stress: 10, mood: 5 },
        skillChanges: { honesty: 0.8 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Ты всегда говоришь правду даже когда страшно.', grantTrait: 'honestToBone', memoryId: 'told_truth_vase' },
        ],
      },
      {
        label: 'Свалить на кота',
        description: 'Мама не поверила. Ты получил двойную порцию наказания.',
        statChanges: { stress: 25, mood: -15 },
        delayedConsequences: [
          { yearsLater: 8, description: 'Ты научился врать убедительнее.', skillChanges: { charisma: 0.5 }, memoryId: 'learned_to_lie' },
        ],
      },
      {
        label: 'Спрятать осколки',
        description: 'Ты спрятал осколки под диван. Может она не заметит.',
        statChanges: { stress: 20, mood: -10 },
        delayedConsequences: [
          { yearsLater: 20, description: 'Это воспоминание из другого мира. Ты был другим человеком.', statChanges: { mood: 3 }, memoryId: 'preschool_lie_broken_vase_dc28' },
        ],
      },
    ],
  },
  {
    id: 'preschool_stray_cat',
    title: 'Бездомный котёнок',
    description: 'На улице мяукает маленький котёнок. Он грязный и голодный.',
    ageGroup: AgeGroup.TODDLER,
    type: 'formative',
    probability: 0.25,
    repeatable: false,
    choices: [
      {
        label: 'Принести домой',
        description: '«Мама, можно мы его оставим?» Мама вздыхает.',
        statChanges: { mood: 30, stress: 10 },
        skillChanges: { empathy: 1.0, responsibility: 0.5 },
        delayedConsequences: [
          { yearsLater: 12, description: 'Этот кот стал твоим лучшим другом на 15 лет.', statChanges: { mood: 20 }, memoryId: 'saved_cat' },
        ],
      },
      {
        label: 'Покормить и уйти',
        description: 'Ты дал ему хлеб. Котёнок съел и посмотрел тебе вслед.',
        statChanges: { mood: 10, stress: 5 },
        skillChanges: { empathy: 0.5 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Ты иногда вспоминаешь этот день. Странное чувство.', statChanges: { mood: 5 }, memoryId: 'preschool_stray_cat_dc30' },
        ],
      },
      {
        label: 'Пройти мимо',
        description: 'Мама сказала не трогать уличных животных.',
        statChanges: { mood: -5 },
        delayedConsequences: [
          { yearsLater: 20, description: 'Это воспоминание из другого мира. Ты был другим человеком.', statChanges: { mood: 3 }, memoryId: 'preschool_stray_cat_dc31' },
        ],
      },
    ],
  },
  {
    id: 'preschool_best_friend',
    title: 'Лучший друг',
    description: 'Мальчик из соседней группы делится с тобой конфетой. «Давай дружить!»',
    ageGroup: AgeGroup.TODDLER,
    type: 'formative',
    probability: 0.25,
    repeatable: false,
    choices: [
      {
        label: 'Давай!',
        description: 'Вы теперь неразлучны. Вместе на горке, вместе за столом.',
        statChanges: { mood: 25, stress: -15 },
        skillChanges: { empathy: 0.5, trustInPeople: 0.3 },
        delayedConsequences: [
          { yearsLater: 8, description: 'Этот мальчик останется твоим другом надолго.', statChanges: { mood: 10 }, memoryId: 'first_best_friend' },
        ],
      },
      {
        label: 'Я сам по себе',
        description: 'Конфету взял. Дружить не обязательно.',
        statChanges: { mood: 10 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Ты иногда вспоминаешь этот день. Странное чувство.', statChanges: { mood: 5 }, memoryId: 'preschool_best_friend_dc33' },
        ],
      },
    ],
  },
  {
    id: 'preschool_first_loss',
    title: 'Потерянная игрушка',
    description: 'Ты потерял любимую машинку на прогулке. Её нигде нет.',
    ageGroup: AgeGroup.TODDLER,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Искать пока не найдёшь',
        description: 'Ты обошёл всю площадку. Нашёл! Под скамейкой!',
        statChanges: { mood: 20, stress: -10 },
        skillChanges: { persistence: 0.5, attention: 0.4 },
        delayedConsequences: [
          { yearsLater: 20, description: 'Это воспоминание из другого мира. Ты был другим человеком.', statChanges: { mood: 3 }, memoryId: 'preschool_first_loss_dc34' },
        ],
      },
      {
        label: 'Плакать',
        description: 'Мама купит новую. Но это будет другая машинка.',
        statChanges: { mood: -15, stress: 15 },
        delayedConsequences: [
          { yearsLater: 12, description: 'Мама до сих пор рассказывает эту историю.', statChanges: { mood: 8 }, memoryId: 'preschool_first_loss_dc35' },
        ],
      },
    ],
  },
  {
    id: 'preschool_tall_slide',
    title: 'Высокая горка',
    description: 'Новая горка. Очень высокая. Все боятся, но делают вид что нет.',
    ageGroup: AgeGroup.TODDLER,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Скатиться!',
        description: 'Уууу! Ветер в лицо! Ещё раз!',
        statChanges: { mood: 30, stress: -15 },
        skillChanges: { courage: 0.5, confidence: 0.3 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Ты иногда вспоминаешь этот день. Странное чувство.', statChanges: { mood: 5 }, memoryId: 'preschool_tall_slide_dc36' },
        ],
      },
      {
        label: 'Страшно...',
        description: 'Ты постоял наверху и спустился по лесенке. Может в следующий раз.',
        statChanges: { mood: -5, stress: 5 },
        delayedConsequences: [
          { yearsLater: 20, description: 'Это воспоминание из другого мира. Ты был другим человеком.', statChanges: { mood: 3 }, memoryId: 'preschool_tall_slide_dc37' },
        ],
      },
    ],
  },
  {
    id: 'preschool_snow_winter',
    title: 'Первый снег',
    description: 'Выпал первый снег! Всё белое и красивое.',
    ageGroup: AgeGroup.TODDLER,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Снежки и снеговик',
        description: 'Ты промок до нитки но счастлив!',
        statChanges: { mood: 30, stress: -20, energy: -15 },
        skillChanges: { creativity: 0.3, physicalStrength: 0.2 },
        delayedConsequences: [
          { yearsLater: 12, description: 'Мама до сих пор рассказывает эту историю.', statChanges: { mood: 8 }, memoryId: 'preschool_snow_winter_dc38' },
        ],
      },
      {
        label: 'Смотреть из окна',
        description: 'Тёплое какао и снег за окном. Уютно.',
        statChanges: { mood: 15, stress: -10 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Ты иногда вспоминаешь этот день. Странное чувство.', statChanges: { mood: 5 }, memoryId: 'preschool_snow_winter_dc39' },
        ],
      },
    ],
  },
  {
    id: 'preschool_birthday_party',
    title: 'День рождения',
    description: 'Тебе исполнилось 5 лет! Торт, свечи, подарки.',
    ageGroup: AgeGroup.TODDLER,
    type: 'formative',
    probability: 0.25,
    repeatable: false,
    choices: [
      {
        label: 'Задуть свечи и загадать',
        description: 'Ты загадал самое заветное желание. Свечи задуты!',
        statChanges: { mood: 30, stress: -15 },
        skillChanges: { selfEsteem: 0.3 },
        delayedConsequences: [
          { yearsLater: 20, description: 'Это воспоминание из другого мира. Ты был другим человеком.', statChanges: { mood: 3 }, memoryId: 'preschool_birthday_party_dc40' },
        ],
      },
      {
        label: 'Поделиться тортом',
        description: 'Ты раздал всем по кусочку. Тебе достался самый маленький.',
        statChanges: { mood: 15, stress: 5 },
        skillChanges: { generosity: 0.5 },
        delayedConsequences: [
          { yearsLater: 12, description: 'Мама до сих пор рассказывает эту историю.', statChanges: { mood: 8 }, memoryId: 'preschool_birthday_party_dc41' },
        ],
      },
    ],
  },
  {
    id: 'preschool_drawing_contest',
    title: 'Конкурс рисунков',
    description: 'Воспитательница объявила конкурс. Лучший рисунок получит приз.',
    ageGroup: AgeGroup.TODDLER,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Нарисовать изо всех сил',
        description: 'Ты старался как никогда. Получилось криво, но с душой.',
        statChanges: { mood: 15, stress: 5 },
        skillChanges: { creativity: 0.6, persistence: 0.3 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Ты иногда вспоминаешь этот день. Странное чувство.', statChanges: { mood: 5 }, memoryId: 'preschool_drawing_contest_dc42' },
        ],
      },
      {
        label: 'Срисовать у соседа',
        description: 'Его рисунок лучше. Ты перерисовал. Приз получил он.',
        statChanges: { mood: -5, stress: 10 },
        delayedConsequences: [
          { yearsLater: 20, description: 'Это воспоминание из другого мира. Ты был другим человеком.', statChanges: { mood: 3 }, memoryId: 'preschool_drawing_contest_dc43' },
        ],
      },
    ],
  },
  {
    id: 'preschool_parent_praise',
    title: 'Похвала',
    description: 'Папа сказал «Я тобой горжусь!» Просто так, без причины.',
    ageGroup: AgeGroup.TODDLER,
    type: 'formative',
    probability: 0.25,
    repeatable: false,
    choices: [
      {
        label: 'Обнять папу',
        description: 'Ты крепко обнял папу. Он тоже обнял тебя.',
        statChanges: { mood: 25, stress: -15 },
        skillChanges: { selfEsteem: 0.5, capacityToLove: 0.3 },
        delayedConsequences: [
          { yearsLater: 20, description: 'Ты всегда помнишь что папа гордился тобой.', statChanges: { mood: 10 }, memoryId: 'papa_proud' },
        ],
      },
      {
        label: 'Не поверить',
        description: 'За что? Ты ничего не сделал. Наверное он просто так говорит.',
        statChanges: { mood: 5, stress: 5 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Тебе трудно принять похвалу.', statChanges: { mood: -5 }, memoryId: 'cant_accept_praise' },
        ],
      },
    ],
  },
  {
    id: 'preschool_bully',
    title: 'Хулиган',
    description: 'Старший мальчик отбирает у малышей конфеты. Твоя очередь.',
    ageGroup: AgeGroup.TODDLER,
    type: 'formative',
    probability: 0.25,
    repeatable: false,
    choices: [
      {
        label: 'Дать отпор',
        description: 'Ты стиснул зубы и не отдал. Он удивился и ушёл.',
        statChanges: { mood: 15, stress: 10 },
        skillChanges: { courage: 0.7, confidence: 0.5 },
        delayedConsequences: [
          { yearsLater: 20, description: 'Это воспоминание из другого мира. Ты был другим человеком.', statChanges: { mood: 3 }, memoryId: 'preschool_bully_dc46' },
        ],
      },
      {
        label: 'Отдать',
        description: 'Конфета не стоит драки. Но обидно.',
        statChanges: { mood: -10, stress: 15 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Ты научился избегать конфликтов.', grantTrait: 'cautious', memoryId: 'gave_up_candy' },
        ],
      },
    ],
  },
  {
    id: 'preschool_animal_dead',
    title: 'Мёртвая птица',
    description: 'На дорожке лежит птичка. Она не двигается.',
    ageGroup: AgeGroup.TODDLER,
    type: 'formative',
    probability: 0.25,
    repeatable: false,
    choices: [
      {
        label: 'Похоронить',
        description: 'Ты выкопал ямку и положил птичку. Положил цветок.',
        statChanges: { mood: -5, stress: 5 },
        skillChanges: { empathy: 0.8, responsibility: 0.3 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Ты помнишь эту птичку. Первая встреча со смертью.', memoryId: 'dead_bird' },
        ],
      },
      {
        label: 'Пройти мимо',
        description: 'Не смотреть. Не думать об этом.',
        statChanges: { mood: -5, stress: 10 },
        delayedConsequences: [
          { yearsLater: 20, description: 'Это воспоминание из другого мира. Ты был другим человеком.', statChanges: { mood: 3 }, memoryId: 'preschool_animal_dead_dc49' },
        ],
      },
    ],
  },
  {
    id: 'preschool_run_rain',
    title: 'Дождь',
    description: 'Начался сильный дождь. Ты далеко от дома.',
    ageGroup: AgeGroup.TODDLER,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Бежать под дождём',
        description: 'Лужи! Грязь! Мокрые ботинки! Лучшая прогулка!',
        statChanges: { mood: 25, stress: -15, health: -3 },
        skillChanges: { courage: 0.3 },
        delayedConsequences: [
          { yearsLater: 12, description: 'Мама до сих пор рассказывает эту историю.', statChanges: { mood: 8 }, memoryId: 'preschool_run_rain_dc50' },
        ],
      },
      {
        label: 'Спрятаться',
        description: 'Ты переждал под навесом. Сухо но скучно.',
        statChanges: { mood: 5, stress: 5 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Ты иногда вспоминаешь этот день. Странное чувство.', statChanges: { mood: 5 }, memoryId: 'preschool_run_rain_dc51' },
        ],
      },
    ],
  },
  {
    id: 'preschool_new_kid',
    title: 'Новенький',
    description: 'В группу пришёл новенький мальчик. Он стоит один и никого не знает.',
    ageGroup: AgeGroup.TODDLER,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Подойти и познакомиться',
        description: '«Привет! Хочешь играть?» Его зовут Миша.',
        statChanges: { mood: 20, stress: -10 },
        skillChanges: { charisma: 0.5, empathy: 0.4 },
        delayedConsequences: [
          { yearsLater: 20, description: 'Это воспоминание из другого мира. Ты был другим человеком.', statChanges: { mood: 3 }, memoryId: 'preschool_new_kid_dc52' },
        ],
      },
      {
        label: 'Наблюдать издалека',
        description: 'Интересно. Но подойти страшно.',
        statChanges: { mood: 5 },
        skillChanges: { attention: 0.3 },
        delayedConsequences: [
          { yearsLater: 12, description: 'Мама до сих пор рассказывает эту историю.', statChanges: { mood: 8 }, memoryId: 'preschool_new_kid_dc53' },
        ],
      },
    ],
  },
  {
    id: 'preschool_fairytale',
    title: 'Сказка на ночь',
    description: 'Мама читает сказку. Героиня должна сделать выбор. Мама спрашивает тебя.',
    ageGroup: AgeGroup.TODDLER,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Помочь',
        description: '«Она должна помочь!» Ты выбрал доброту.',
        statChanges: { mood: 10, stress: -5 },
        skillChanges: { empathy: 0.3, trustInPeople: 0.2 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Ты всегда выбирал помогать. Это стало частью тебя.', statChanges: { mood: 5 }, memoryId: 'fairytale_kindness' },
        ],
      },
      {
        label: 'Победить',
        description: '«Она должна победить!» Ты выбрал силу.',
        statChanges: { mood: 10 },
        skillChanges: { confidence: 0.3, persistence: 0.2 },
        delayedConsequences: [
          { yearsLater: 20, description: 'Это воспоминание из другого мира. Ты был другим человеком.', statChanges: { mood: 3 }, memoryId: 'preschool_fairytale_dc55' },
        ],
      },
    ],
  },
  {
    id: 'preschool_broken_toy',
    title: 'Сломанная игрушка',
    description: 'Ты сломал любимую игрушку. Мама не видела. Что делать?',
    ageGroup: AgeGroup.TODDLER,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Признаться',
        description: '«Мама, я сломал.» Она не ругалась. Обняла.',
        statChanges: { mood: -5, stress: -10 },
        skillChanges: { honesty: 0.4, trustInPeople: 0.2 },
        delayedConsequences: [
          { yearsLater: 12, description: 'Ты научился говорить правду даже когда страшно.', statChanges: { mood: 5 }, memoryId: 'honest_about_toy' },
        ],
      },
      {
        label: 'Спрятать',
        description: 'Ты засунул её под кровать. Может никто не заметит.',
        statChanges: { mood: -10, stress: 10 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Ты иногда вспоминаешь этот день. Странное чувство.', statChanges: { mood: 5 }, memoryId: 'preschool_broken_toy_dc57' },
        ],
      },
    ],
  },
]
