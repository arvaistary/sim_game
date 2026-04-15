import { AgeGroup } from '../../actions/types'
import type { ChildhoodEventDef } from '../../types/childhood-event'

/**
 * Детские события: 8-12 лет (Младшая школа)
 * Пик любознательности. Самый важный возраст для формирования навыков.
 * 30 событий.
 */
export const SCHOOL_EVENTS: ChildhoodEventDef[] = [
  {
    id: 'school_math_teacher',
    title: 'Учительница математики',
    description: 'Учительница позволила тебе остаться после урока и объяснила материал который никто не понял.',
    ageGroup: AgeGroup.KID,
    type: 'fateful',
    probability: 0.05,
    repeatable: false,
    chainTag: 'math_teacher',
    choices: [
      {
        label: 'Приходить к ней после уроков',
        description: 'Ты решил что этот человек заслуживает твоего времени.',
        statChanges: { stress: -5 },
        skillChanges: { logic: 15, persistence: 10 },
        delayedConsequences: [
          { yearsLater: 25, description: 'Она напишет тебе и скажет что ты всегда был её любимым учеником.', statChanges: { mood: 30 }, memoryId: 'math_teacher_letter' },
        ],
      },
      {
        label: 'Смеяться над ней вместе со всеми',
        description: 'Все одноклассники начали тебя уважать.',
        statChanges: { mood: 10 },
        skillChanges: { charisma: 10 },
        delayedConsequences: [
          { yearsLater: 30, description: 'Ты встретишь её в больнице и поймёшь что единственный человек который верил в тебя ты унизил.', statChanges: { mood: -40, stress: 30 }, memoryId: 'math_teacher_regret' },
        ],
      },
      {
        label: 'Просто уйти',
        description: 'Никаких немедленных эффектов.',
        delayedConsequences: [
          { yearsLater: 17, description: 'Ты будешь жалеть об этом абсолютно случайно в один обычный вечер.', statChanges: { mood: -10 }, memoryId: 'math_teacher_missed' },
        ],
      },
    ],
  },
  {
    id: 'school_best_friend_stolen',
    title: 'Лучший друг',
    description: 'Друг украл пачку жвачек и вас поймали. Охранник смотрит на вас обоих.',
    ageGroup: AgeGroup.KID,
    type: 'fateful',
    probability: 0.05,
    repeatable: false,
    chainTag: 'best_friend',
    choices: [
      {
        label: 'Сказать что это он',
        description: 'Тебя отпустят. Он больше никогда не будет твоим другом.',
        statChanges: { stress: 10 },
        delayedConsequences: [
          { yearsLater: 30, description: 'На протяжении всей жизни ты будешь знать что ты предал его.', statChanges: { mood: -15 }, grantTrait: 'selfSufficient', memoryId: 'betrayed_best_friend' },
        ],
      },
      {
        label: 'Сказать что это ты',
        description: 'Тебя накажут очень сильно. Но он будет твоим лучшим другом ещё 30 лет.',
        statChanges: { stress: 30, mood: -20 },
        delayedConsequences: [
          { yearsLater: 31, description: 'Когда тебе будет 42 и у тебя будет всё очень плохо — он единственный кто придёт.', statChanges: { mood: 50, stress: -30 }, memoryId: 'best_friend_saved_me' },
        ],
      },
      {
        label: 'Молчать',
        description: 'Оба получите по полной.',
        statChanges: { stress: 25, mood: -10 },
        skillChanges: { endurance: 10, resilience: 10 },
        delayedConsequences: [
          { yearsLater: 5, description: 'Вы больше никогда не будете друзьями, но оба станете очень сильными людьми.', statChanges: { mood: -5 }, memoryId: 'best_friend_silence' },
        ],
      },
    ],
  },
  {
    id: 'school_skip_classes',
    title: 'Прогул',
    description: 'День прекрасный. Уроки скучные. Можно сбежать.',
    ageGroup: AgeGroup.KID,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Сбежать!',
        description: 'Свобода! Ты провёл лучший день в своей жизни.',
        statChanges: { mood: 30, stress: -20 },
        skillChanges: { riskTolerance: 0.5 },
        delayedConsequences: [
          { yearsLater: 20, description: 'Этот выбор научил тебя чему-то. Ты не помнишь чему именно.', statChanges: { mood: -3 }, memoryId: 'school_skip_classes_dc7' },
        ],
      },
      {
        label: 'Остаться',
        description: 'Скучно, но правильно. Учительница похвалила.',
        statChanges: { mood: -5, stress: 5 },
        skillChanges: { responsibility: 0.4, selfControl: 0.3 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Ты встретил одноклассника. Вспомнили этот случай.', statChanges: { mood: 10 }, memoryId: 'school_skip_classes_dc8' },
        ],
      },
    ],
  },
  {
    id: 'school_homework',
    title: 'Домашнее задание',
    description: 'Гора домашки. Можно сделать, можно списать, можно забить.',
    ageGroup: AgeGroup.KID,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Сделать самому',
        description: 'Два часа работы. Но ты всё понимаешь.',
        statChanges: { stress: 10, energy: -15, mood: -5 },
        skillChanges: { logic: 0.5, memory: 0.5, responsibility: 0.4 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Школьные годы... Иногда ты скучаешь по ним.', statChanges: { mood: 5 }, memoryId: 'school_homework_dc9' },
        ],
      },
      {
        label: 'Списать у отличницы',
        description: 'Быстро и эффективно. Но если поймают...',
        statChanges: { mood: 10, stress: 10 },
        skillChanges: { charisma: 0.3 },
        delayedConsequences: [
          { yearsLater: 20, description: 'Этот выбор научил тебя чему-то. Ты не помнишь чему именно.', statChanges: { mood: -3 }, memoryId: 'school_homework_dc10' },
        ],
      },
    ],
  },
  {
    id: 'school_bike',
    title: 'Велосипед',
    description: 'Папа принёс велосипед! Двухколёсный! Надо научиться.',
    ageGroup: AgeGroup.KID,
    type: 'formative',
    probability: 0.25,
    repeatable: false,
    choices: [
      {
        label: 'Учиться пока не получится',
        description: '100 раз упал. На 101-й поехал! Папа бежит рядом и кричит «Молодец!»',
        statChanges: { mood: 35, stress: -20, energy: -30 },
        skillChanges: { persistence: 1.0, physicalStrength: 0.5, confidence: 0.5 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Ты встретил одноклассника. Вспомнили этот случай.', statChanges: { mood: 10 }, memoryId: 'school_bike_dc11' },
        ],
      },
      {
        label: 'Слишком страшно',
        description: 'Ты попробовал один раз, упал и больше не хочешь.',
        statChanges: { mood: -10, stress: 15 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Школьные годы... Иногда ты скучаешь по ним.', statChanges: { mood: 5 }, memoryId: 'school_bike_dc12' },
        ],
      },
    ],
  },
  {
    id: 'school_read_book',
    title: 'Первая книга',
    description: 'Ты случайно взял в библиотеке книгу. И не можешь оторваться.',
    ageGroup: AgeGroup.KID,
    type: 'formative',
    probability: 0.25,
    repeatable: false,
    choices: [
      {
        label: 'Читать запоем',
        description: 'Ты прочитал за ночь. Глаза горят. Хочется ещё!',
        statChanges: { mood: 20, stress: -10, energy: -15 },
        skillChanges: { curiosity: 0.8, memory: 0.5, learningAbility: 0.4 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Книги стали твоей страстью на всю жизнь.', statChanges: { mood: 10 }, memoryId: 'first_book' },
        ],
      },
      {
        label: 'Скучно',
        description: 'Ну его. Лучше мультики.',
        statChanges: { mood: 5 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Ты встретил одноклассника. Вспомнили этот случай.', statChanges: { mood: 10 }, memoryId: 'school_read_book_dc14' },
        ],
      },
    ],
  },
  {
    id: 'school_steal_shop',
    title: 'Магазин',
    description: 'Друзья спорят — украдешь или нет. Жвачка стоит 10 рублей.',
    ageGroup: AgeGroup.KID,
    type: 'formative',
    probability: 0.25,
    repeatable: false,
    choices: [
      {
        label: 'Украсть',
        description: 'Адреналин! Получилось! Но внутри что-то сжалось.',
        statChanges: { mood: 15, stress: 25 },
        skillChanges: { riskTolerance: 0.8 },
        delayedConsequences: [
          { yearsLater: 5, description: 'Ты никогда больше не крал. Но помнишь это чувство.', memoryId: 'stole_once' },
        ],
      },
      {
        label: 'Не надо',
        description: 'Друзья засмеяли. Но ты знаешь что прав.',
        statChanges: { mood: -5, stress: 5 },
        skillChanges: { selfControl: 0.5, honesty: 0.3 },
        delayedConsequences: [
          { yearsLater: 20, description: 'Этот выбор научил тебя чему-то. Ты не помнишь чему именно.', statChanges: { mood: -3 }, memoryId: 'school_steal_shop_dc16' },
        ],
      },
    ],
  },
  {
    id: 'school_fight_bully',
    title: 'Драка',
    description: 'Хулиган толкнул тебя. Все смотрят.',
    ageGroup: AgeGroup.KID,
    type: 'formative',
    probability: 0.25,
    repeatable: false,
    choices: [
      {
        label: 'Драться',
        description: 'Ты ударил первым. Драка! Учительница разняла.',
        statChanges: { mood: 10, stress: 15 },
        skillChanges: { courage: 0.7, confidence: 0.5 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Ты встретил одноклассника. Вспомнили этот случай.', statChanges: { mood: 10 }, memoryId: 'school_fight_bully_dc17' },
        ],
      },
      {
        label: 'Уйти',
        description: 'Ты развернулся и ушёл. Кто-то засмеялся.',
        statChanges: { mood: -15, stress: 20 },
        delayedConsequences: [
          { yearsLater: 8, description: 'Ты научился выбирать свои битвы.', statChanges: { mood: 5 }, memoryId: 'chose_battles' },
        ],
      },
    ],
  },
  {
    id: 'school_club_join',
    title: 'Кружок',
    description: 'Учитель предлагает записаться в кружок. Рисование? Спорт? Музыка?',
    ageGroup: AgeGroup.KID,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Записаться в спортивный',
        description: 'Тренер строгий но справедливый. Ты в поту но счастлив.',
        statChanges: { mood: 15, energy: -20 },
        skillChanges: { physicalStrength: 0.5, endurance: 0.4, discipline: 0.3 },
        delayedConsequences: [
          { yearsLater: 20, description: 'Этот выбор научил тебя чему-то. Ты не помнишь чему именно.', statChanges: { mood: -3 }, memoryId: 'school_club_join_dc19' },
        ],
      },
      {
        label: 'Записаться в художественный',
        description: 'Краски, кисти, холст. Ты создаёшь мир!',
        statChanges: { mood: 20, stress: -10 },
        skillChanges: { creativity: 0.7, attention: 0.3 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Ты встретил одноклассника. Вспомнили этот случай.', statChanges: { mood: 10 }, memoryId: 'school_club_join_dc20' },
        ],
      },
      {
        label: 'Не надо',
        description: 'Свободное время! Никаких кружков.',
        statChanges: { mood: 10 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Школьные годы... Иногда ты скучаешь по ним.', statChanges: { mood: 5 }, memoryId: 'school_club_join_dc21' },
        ],
      },
    ],
  },
  {
    id: 'school_bad_grade_cry',
    title: 'Двойка',
    description: 'Ты получил двойку за контрольную. Мама убьёт.',
    ageGroup: AgeGroup.KID,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Расплакаться',
        description: 'Слёзы сами текут. Учительница дала ещё один шанс.',
        statChanges: { mood: -25, stress: 35 },
        skillChanges: { responsibility: 0.5 },
        delayedConsequences: [
          { yearsLater: 20, description: 'Этот выбор научил тебя чему-то. Ты не помнишь чему именно.', statChanges: { mood: -3 }, memoryId: 'school_bad_grade_cry_dc22' },
        ],
      },
      {
        label: 'Спрятать дневник',
        description: 'Подумаешь, двойка. Никто не узнает.',
        statChanges: { mood: -5, stress: 15 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Ты встретил одноклассника. Вспомнили этот случай.', statChanges: { mood: 10 }, memoryId: 'school_bad_grade_cry_dc23' },
        ],
      },
    ],
  },
  {
    id: 'school_gum_chair',
    title: 'Жвачка на стул',
    description: 'Идеальная идея. Жвачка на стул учителя. Класс будет смеяться.',
    ageGroup: AgeGroup.KID,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Сделать!',
        description: 'Учитель сел на жвачку. Класс взорвался от смеха. Ты герой.',
        statChanges: { mood: 25, stress: 15 },
        skillChanges: { humor: 0.5 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Школьные годы... Иногда ты скучаешь по ним.', statChanges: { mood: 5 }, memoryId: 'school_gum_chair_dc24' },
        ],
      },
      {
        label: 'Передумать',
        description: 'Слишком опасно. Лучше не надо.',
        statChanges: { mood: 5 },
        skillChanges: { selfControl: 0.3 },
        delayedConsequences: [
          { yearsLater: 20, description: 'Этот выбор научил тебя чему-то. Ты не помнишь чему именно.', statChanges: { mood: -3 }, memoryId: 'school_gum_chair_dc25' },
        ],
      },
    ],
  },
  {
    id: 'school_collection',
    title: 'Коллекция',
    description: 'Все в классе собирают наклейки/карточки/монетки. Ты тоже хочешь.',
    ageGroup: AgeGroup.KID,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Собирать серьёзно',
        description: 'Ты стал лучшим коллекционером в классе. Полная коллекция!',
        statChanges: { mood: 20, stress: -10 },
        skillChanges: { persistence: 0.5, attention: 0.4 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Ты встретил одноклассника. Вспомнили этот случай.', statChanges: { mood: 10 }, memoryId: 'school_collection_dc26' },
        ],
      },
      {
        label: 'Надоест через неделю',
        description: 'Было интересно, но не твоё.',
        statChanges: { mood: 5 },
        skillChanges: { curiosity: 0.3 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Школьные годы... Иногда ты скучаешь по ним.', statChanges: { mood: 5 }, memoryId: 'school_collection_dc27' },
        ],
      },
    ],
  },
  {
    id: 'school_conspire_teacher',
    title: 'Сговор против учителя',
    description: 'Весь класс договорился не делать домашку. Все за?',
    ageGroup: AgeGroup.KID,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Вместе со всеми!',
        description: 'Учитель в ярости. Но класс объединился как никогда.',
        statChanges: { mood: 20, stress: 15 },
        skillChanges: { charisma: 0.4 },
        delayedConsequences: [
          { yearsLater: 20, description: 'Этот выбор научил тебя чему-то. Ты не помнишь чему именно.', statChanges: { mood: -3 }, memoryId: 'school_conspire_teacher_dc28' },
        ],
      },
      {
        label: 'Всё равно сделать',
        description: 'Ты один сделал домашку. Учитель доволен. Класс не очень.',
        statChanges: { mood: -5, stress: 5 },
        skillChanges: { responsibility: 0.5, selfControl: 0.3 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Ты встретил одноклассника. Вспомнили этот случай.', statChanges: { mood: 10 }, memoryId: 'school_conspire_teacher_dc29' },
        ],
      },
    ],
  },
  {
    id: 'school_try_cigarette',
    title: 'Сигарета',
    description: 'Старшеклассник предлагает попробовать. «Будешь взрослым».',
    ageGroup: AgeGroup.KID,
    type: 'formative',
    probability: 0.25,
    repeatable: false,
    choices: [
      {
        label: 'Попробовать',
        description: 'Кашель, слёзы, головокружение. Фу!',
        statChanges: { mood: -5, stress: 20, health: -5 },
        skillChanges: { riskTolerance: 0.5 },
        delayedConsequences: [
          { yearsLater: 5, description: 'Ты никогда не начал курить. Но помнишь тот день.', memoryId: 'tried_cigarette' },
        ],
      },
      {
        label: 'Нет!',
        description: 'Ты сказал нет. Старшеклассник усмехнулся.',
        statChanges: { mood: 5, stress: 10 },
        skillChanges: { selfControl: 0.5 },
        delayedConsequences: [
          { yearsLater: 20, description: 'Этот выбор научил тебя чему-то. Ты не помнишь чему именно.', statChanges: { mood: -3 }, memoryId: 'school_try_cigarette_dc31' },
        ],
      },
    ],
  },
  {
    id: 'school_make_sling',
    title: 'Рогатка',
    description: 'Ты нашёл резинку и ветку. Можно сделать рогатку!',
    ageGroup: AgeGroup.KID,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Сделать и стрелять',
        description: 'Попал в банку! Попал в окно... Ой.',
        statChanges: { mood: 20, stress: 10 },
        skillChanges: { creativity: 0.4, spatialThinking: 0.3 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Ты встретил одноклассника. Вспомнили этот случай.', statChanges: { mood: 10 }, memoryId: 'school_make_sling_dc32' },
        ],
      },
      {
        label: 'Просто сделать',
        description: 'Классная рогатка. На полку.',
        statChanges: { mood: 10 },
        skillChanges: { creativity: 0.3 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Школьные годы... Иногда ты скучаешь по ним.', statChanges: { mood: 5 }, memoryId: 'school_make_sling_dc33' },
        ],
      },
    ],
  },
  {
    id: 'school_learn_lie',
    title: 'Искусство лжи',
    description: 'Ты заметил что тебе верят. Даже когда ты врёшь.',
    ageGroup: AgeGroup.KID,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Использовать',
        description: 'Тебе верят. Это власть.',
        statChanges: { mood: 10 },
        skillChanges: { charisma: 0.5 },
        delayedConsequences: [
          { yearsLater: 8, description: 'Ты научился врать так что сам веришь.', grantTrait: 'liar', memoryId: 'master_lie' },
        ],
      },
      {
        label: 'Не врать',
        description: 'Правда лучше. Даже когда она неудобна.',
        statChanges: { mood: 5 },
        skillChanges: { honesty: 0.5 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Ты встретил одноклассника. Вспомнили этот случай.', statChanges: { mood: 10 }, memoryId: 'school_learn_lie_dc35' },
        ],
      },
    ],
  },
  {
    id: 'school_friend_neighbor',
    title: 'Соседский мальчик',
    description: 'В соседнем дворе живёт мальчик вашего возраста. Он один.',
    ageGroup: AgeGroup.KID,
    type: 'formative',
    probability: 0.25,
    repeatable: false,
    choices: [
      {
        label: 'Подойти',
        description: '«Привет! Хочешь играть в футбол?» Он улыбнулся.',
        statChanges: { mood: 20, stress: -10 },
        skillChanges: { empathy: 0.5, charisma: 0.3 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Он стал твоим лучшим другом.', statChanges: { mood: 15 }, memoryId: 'neighbor_friend' },
        ],
      },
      {
        label: 'Не надо',
        description: 'У тебя есть свои друзья.',
        statChanges: { mood: 5 },
        delayedConsequences: [
          { yearsLater: 20, description: 'Этот выбор научил тебя чему-то. Ты не помнишь чему именно.', statChanges: { mood: -3 }, memoryId: 'school_friend_neighbor_dc37' },
        ],
      },
    ],
  },
  {
    id: 'school_break_hide',
    title: 'Сломал и скрыл',
    description: 'Ты случайно сломал чужую вещь. Никто не видел.',
    ageGroup: AgeGroup.KID,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Признаться',
        description: 'Владелец расстроился, но сказал «Ничего, бывает».',
        statChanges: { stress: 10, mood: -5 },
        skillChanges: { honesty: 0.5, responsibility: 0.3 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Ты встретил одноклассника. Вспомнили этот случай.', statChanges: { mood: 10 }, memoryId: 'school_break_hide_dc38' },
        ],
      },
      {
        label: 'Скрыть',
        description: 'Никто не узнает. Наверное.',
        statChanges: { stress: 20, mood: -5 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Школьные годы... Иногда ты скучаешь по ним.', statChanges: { mood: 5 }, memoryId: 'school_break_hide_dc39' },
        ],
      },
    ],
  },
  {
    id: 'school_play_dark',
    title: 'До темноты',
    description: 'Мама зовёт домой. Но игра в самом разгаре!',
    ageGroup: AgeGroup.KID,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Ещё один раунд!',
        description: 'Темно. Холодно. Но это лучший день.',
        statChanges: { mood: 30, stress: -20, energy: -25 },
        skillChanges: { persistence: 0.3 },
        delayedConsequences: [
          { yearsLater: 20, description: 'Этот выбор научил тебя чему-то. Ты не помнишь чему именно.', statChanges: { mood: -3 }, memoryId: 'school_play_dark_dc40' },
        ],
      },
      {
        label: 'Пойти домой',
        description: 'Мама будет довольна. Горячий ужин.',
        statChanges: { mood: 10, stress: -5 },
        skillChanges: { responsibility: 0.3 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Ты встретил одноклассника. Вспомнили этот случай.', statChanges: { mood: 10 }, memoryId: 'school_play_dark_dc41' },
        ],
      },
    ],
  },
  {
    id: 'school_curse_words',
    title: 'Ругательства',
    description: 'Старшеклассник научил тебя новому слову. Очень плохому.',
    ageGroup: AgeGroup.KID,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Говорить всем',
        description: 'Дети хихикают. Взрослые в шоке.',
        statChanges: { mood: 15 },
        skillChanges: { charisma: 0.3 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Школьные годы... Иногда ты скучаешь по ним.', statChanges: { mood: 5 }, memoryId: 'school_curse_words_dc42' },
        ],
      },
      {
        label: 'Забыть',
        description: 'Зачем оно нужно? Лучше нормальные слова.',
        statChanges: { mood: 5 },
        skillChanges: { selfControl: 0.2 },
        delayedConsequences: [
          { yearsLater: 20, description: 'Этот выбор научил тебя чему-то. Ты не помнишь чему именно.', statChanges: { mood: -3 }, memoryId: 'school_curse_words_dc43' },
        ],
      },
    ],
  },
  {
    id: 'school_pet_dies',
    title: 'Хомяк',
    description: 'Твой хомяк умер. Ты нашёл его утром.',
    ageGroup: AgeGroup.KID,
    type: 'formative',
    probability: 0.25,
    repeatable: false,
    choices: [
      {
        label: 'Плакать',
        description: 'Ты плакал весь день. Мама обнимала тебя.',
        statChanges: { mood: -25, stress: 20 },
        skillChanges: { empathy: 0.8, capacityToLove: 0.3 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Ты встретил одноклассника. Вспомнили этот случай.', statChanges: { mood: 10 }, memoryId: 'school_pet_dies_dc44' },
        ],
      },
      {
        label: 'Не показывать эмоции',
        description: 'Ты похоронил его за гаражами. Один.',
        statChanges: { mood: -10, stress: 15 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Ты научился прятать горе глубоко внутри.', grantTrait: 'tough', memoryId: 'hamster_alone' },
        ],
      },
    ],
  },
  {
    id: 'school_win_competition',
    title: 'Олимпиада',
    description: 'Учительница выбрала тебя для участия в олимпиаде по математике.',
    ageGroup: AgeGroup.KID,
    type: 'formative',
    probability: 0.25,
    repeatable: false,
    choices: [
      {
        label: 'Готовиться серьёзно',
        description: 'Ты занял третье место! Учительница гордится.',
        statChanges: { mood: 30, stress: -10 },
        skillChanges: { logic: 1.0, confidence: 0.5, persistence: 0.5 },
        delayedConsequences: [
          { yearsLater: 20, description: 'Этот выбор научил тебя чему-то. Ты не помнишь чему именно.', statChanges: { mood: -3 }, memoryId: 'school_win_competition_dc46' },
        ],
      },
      {
        label: 'Забить',
        description: 'Олимпиада? Скучно. Ты провалил.',
        statChanges: { mood: -5, stress: 5 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Ты встретил одноклассника. Вспомнили этот случай.', statChanges: { mood: 10 }, memoryId: 'school_win_competition_dc47' },
        ],
      },
    ],
  },
  {
    id: 'school_music_lesson',
    title: 'Музыкальная школа',
    description: 'Мама хочет отдать тебя в музыкальную школу. Ты не хочешь.',
    ageGroup: AgeGroup.KID,
    type: 'formative',
    probability: 0.25,
    repeatable: false,
    choices: [
      {
        label: 'Пойти',
        description: 'Скучно. Но через год ты играешь «Собачий вальс»!',
        statChanges: { mood: -5, stress: 10 },
        skillChanges: { musicalEar: 0.8, discipline: 0.5 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Ты благодарен маме что она заставила.', statChanges: { mood: 15 }, memoryId: 'music_school_thanks' },
        ],
      },
      {
        label: 'Отказаться',
        description: 'Мама вздохнула. «Ну ладно.»',
        statChanges: { mood: 10 },
        delayedConsequences: [
          { yearsLater: 20, description: 'Этот выбор научил тебя чему-то. Ты не помнишь чему именно.', statChanges: { mood: -3 }, memoryId: 'school_music_lesson_dc49' },
        ],
      },
    ],
  },
  {
    id: 'school_lost_in_city',
    title: 'Потерялся',
    description: 'Ты отстал от мамы в магазине. Один в большом магазине.',
    ageGroup: AgeGroup.KID,
    type: 'formative',
    probability: 0.25,
    repeatable: false,
    choices: [
      {
        label: 'Искать маму',
        description: 'Ты нашёл её через 10 минут. Она тоже искала тебя.',
        statChanges: { stress: 20, mood: -10 },
        skillChanges: { attention: 0.5, spatialThinking: 0.3 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Ты встретил одноклассника. Вспомнили этот случай.', statChanges: { mood: 10 }, memoryId: 'school_lost_in_city_dc50' },
        ],
      },
      {
        label: 'Плакать',
        description: 'Охранник помог. Мама прибежала через минуту.',
        statChanges: { stress: 25, mood: -15 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Школьные годы... Иногда ты скучаешь по ним.', statChanges: { mood: 5 }, memoryId: 'school_lost_in_city_dc51' },
        ],
      },
    ],
  },
  {
    id: 'school_first_money',
    title: 'Первые деньги',
    description: 'Бабушка дала тебе 100 рублей. Твои первые деньги!',
    ageGroup: AgeGroup.KID,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Копить',
        description: 'Ты положил в копилку. Когда-нибудь будет много!',
        statChanges: { mood: 10 },
        skillChanges: { responsibility: 0.3 },
        delayedConsequences: [
          { yearsLater: 20, description: 'Этот выбор научил тебя чему-то. Ты не помнишь чему именно.', statChanges: { mood: -3 }, memoryId: 'school_first_money_dc52' },
        ],
      },
      {
        label: 'Потратить на сладости',
        description: 'Мороженое! Чипсы! Жвачка! Лучший день!',
        statChanges: { mood: 25 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Ты встретил одноклассника. Вспомнили этот случай.', statChanges: { mood: 10 }, memoryId: 'school_first_money_dc53' },
        ],
      },
    ],
  },
  {
    id: 'school_snowball_fight',
    title: 'Снежки',
    description: 'Зима. Дворовая война. Твоя команда против их.',
    ageGroup: AgeGroup.KID,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Атаковать!',
        description: 'Ты попал прямо в лицо! Победа!',
        statChanges: { mood: 25, stress: -15 },
        skillChanges: { courage: 0.3, physicalStrength: 0.2 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Школьные годы... Иногда ты скучаешь по ним.', statChanges: { mood: 5 }, memoryId: 'school_snowball_fight_dc54' },
        ],
      },
      {
        label: 'Строить крепость',
        description: 'Лучшая защита — хорошая крепость. Инженерный подход!',
        statChanges: { mood: 20 },
        skillChanges: { spatialThinking: 0.4, creativity: 0.3 },
        delayedConsequences: [
          { yearsLater: 20, description: 'Этот выбор научил тебя чему-то. Ты не помнишь чему именно.', statChanges: { mood: -3 }, memoryId: 'school_snowball_fight_dc55' },
        ],
      },
    ],
  },
  {
    id: 'school_report_card',
    title: 'Табель',
    description: 'Конец четверти. Табель с оценками. Мама будет смотреть.',
    ageGroup: AgeGroup.KID,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Показать честно',
        description: 'Мама посмотрела. Вздохнула. «Будешь стараться?»',
        statChanges: { stress: 10, mood: -5 },
        skillChanges: { honesty: 0.4, responsibility: 0.3 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Ты встретил одноклассника. Вспомнили этот случай.', statChanges: { mood: 10 }, memoryId: 'school_report_card_dc56' },
        ],
      },
      {
        label: 'Подделать подпись',
        description: 'Ты подделал подпись мамы. Учительница не заметила.',
        statChanges: { stress: 15, mood: 5 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Школьные годы... Иногда ты скучаешь по ним.', statChanges: { mood: 5 }, memoryId: 'school_report_card_dc57' },
        ],
      },
    ],
  },
  {
    id: 'school_summer_camp',
    title: 'Лагерь',
    description: 'Лето. Ты в лагере. Новые дети, новые правила.',
    ageGroup: AgeGroup.KID,
    type: 'formative',
    probability: 0.25,
    repeatable: false,
    choices: [
      {
        label: 'Быть активным',
        description: 'Ты стал лидером отряда! Костёр, песни, друзья.',
        statChanges: { mood: 30, stress: -15 },
        skillChanges: { charisma: 0.7, confidence: 0.5 },
        delayedConsequences: [
          { yearsLater: 20, description: 'Этот выбор научил тебя чему-то. Ты не помнишь чему именно.', statChanges: { mood: -3 }, memoryId: 'school_summer_camp_dc58' },
        ],
      },
      {
        label: 'Держаться в стороне',
        description: 'Ты читал книгу в палате пока все играли.',
        statChanges: { mood: 10 },
        skillChanges: { curiosity: 0.3 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Ты встретил одноклассника. Вспомнили этот случай.', statChanges: { mood: 10 }, memoryId: 'school_summer_camp_dc59' },
        ],
      },
    ],
  },
  {
    id: 'school_science_fair',
    title: 'Научная ярмарка',
    description: 'Школьная ярмарка проектов. Ты можешь сделать проект про вулкан или про космос.',
    ageGroup: AgeGroup.KID,
    type: 'formative',
    probability: 0.25,
    repeatable: false,
    choices: [
      {
        label: 'Космос',
        description: 'Ты сделал модель солнечной системы. Все были впечатлены.',
        statChanges: { mood: 20, stress: 5 },
        skillChanges: { curiosity: 0.5, spatialThinking: 0.4, logic: 0.3 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Тот проект разжёг в тебе любовь к науке.', statChanges: { mood: 10 }, memoryId: 'science_fair_space' },
        ],
      },
      {
        label: 'Вулкан',
        description: 'Вулкан из папье-маше! С пищевой содой! Все ахнули!',
        statChanges: { mood: 25 },
        skillChanges: { creativity: 0.4 },
        delayedConsequences: [
          { yearsLater: 20, description: 'Этот выбор научил тебя чему-то. Ты не помнишь чему именно.', statChanges: { mood: -3 }, memoryId: 'school_science_fair_dc61' },
        ],
      },
      {
        label: 'Не участвовать',
        description: 'Ты забыл. Или не захотел. Никто не заметил.',
        statChanges: { mood: -5 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Ты встретил одноклассника. Вспомнили этот случай.', statChanges: { mood: 10 }, memoryId: 'school_science_fair_dc62' },
        ],
      },
    ],
  },
  {
    id: 'school_bully_witness',
    title: 'Свидетель',
    description: 'Старшеклассники издеваются над малышом. Никто не вмешивается.',
    ageGroup: AgeGroup.KID,
    type: 'formative',
    probability: 0.25,
    repeatable: false,
    choices: [
      {
        label: 'Заступиться',
        description: '«Оставьте его!» Тебя тоже толкнули. Но малыш убежал.',
        statChanges: { mood: -10, stress: 15 },
        skillChanges: { courage: 0.5, empathy: 0.4 },
        delayedConsequences: [
          { yearsLater: 20, description: 'Тот малыш нашёл тебя и сказал «спасибо». Ты не помнил его лица.', statChanges: { mood: 15 }, memoryId: 'stood_up_for_kid' },
        ],
      },
      {
        label: 'Позвать взрослого',
        description: 'Ты побежал за учителем. Это было правильно.',
        statChanges: { mood: -5, stress: 5 },
        skillChanges: { responsibility: 0.3 },
        delayedConsequences: [
          { yearsLater: 20, description: 'Этот выбор научил тебя чему-то. Ты не помнишь чему именно.', statChanges: { mood: -3 }, memoryId: 'school_bully_witness_dc64' },
        ],
      },
      {
        label: 'Пройти мимо',
        description: 'Не твоё дело. Так все говорят.',
        statChanges: { mood: -15, stress: 10 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Ты часто вспоминаешь его лицо. И свой выбор.', statChanges: { mood: -5 }, memoryId: 'walked_past_bully' },
        ],
      },
    ],
  },
  // ─── Цепочка «Сигарета у старшеклассника» (12 лет, 2 шага) ───
  {
    id: 'chain_cigarette_offer',
    title: 'Сигарета',
    description: 'Старшеклассник протягивает тебе сигарету. «Попробуй, не бойся.» Все смотрят.',
    ageGroup: AgeGroup.KID,
    type: 'fateful',
    probability: 0.05,
    repeatable: false,
    chainTag: 'cigarette',
    choices: [
      {
        label: 'Затянуться',
        description: 'Кашель. Головокружение. Но теперь ты «свой».',
        statChanges: { mood: 5, stress: 10, health: -5 },
        skillChanges: { riskTolerance: 0.5 },
        delayedConsequences: [
          { yearsLater: 20, description: 'Ты куришь 20 лет. Всё началось с той сигареты.', statChanges: { health: -10 }, memoryId: 'first_cigarette' },
        ],
      },
      {
        label: 'Отказаться',
        description: '«Нет.» Все засмеялись. Но ты не стал.',
        statChanges: { mood: -10, stress: 5 },
        skillChanges: { selfControl: 0.5 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Ты никогда не курил. Тот отказ был правильным.', statChanges: { mood: 10 }, memoryId: 'refused_cigarette' },
        ],
      },
    ],
  },
  {
    id: 'chain_cigarette_consequence',
    title: 'Последствие сигареты',
    description: 'Прошёл год. Ты видишь того старшеклассника снова. Он изменился.',
    ageGroup: AgeGroup.KID,
    type: 'formative',
    probability: 0.25,
    repeatable: false,
    chainTag: 'cigarette',
    condition: 'chain_cigarette_offer',
    choices: [
      {
        label: 'Поговорить',
        description: 'Он бросил курить. Говорит что зря начинал. Ты слушаешь.',
        statChanges: { mood: 10, stress: -5 },
        skillChanges: { empathy: 0.3, learningAbility: 0.2 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Ты встретил одноклассника. Вспомнили этот случай.', statChanges: { mood: 10 }, memoryId: 'chain_cigarette_consequence_dc68' },
        ],
      },
      {
        label: 'Пройти мимо',
        description: 'Вы не узнали друг друга. Или сделали вид.',
        statChanges: { mood: -5 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Школьные годы... Иногда ты скучаешь по ним.', statChanges: { mood: 5 }, memoryId: 'chain_cigarette_consequence_dc69' },
        ],
      },
    ],
  },
]
