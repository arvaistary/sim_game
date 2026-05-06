import { AgeGroup } from '../../actions/types'
import type { ChildhoodEventDef } from '../../types/childhood-event'
/**
 * Детские события: 16-18 лет (Старшая школа)
 * Последний шаг во взрослую жизнь. Все выборы имеют постоянные последствия.
 * 25 событий.
 */
export const YOUNG_EVENTS: ChildhoodEventDef[] = [
  {
    id: 'young_skip_graduation',
    title: 'Выпускной',
    description: 'Выпускной вечер. Все идут. А ты не хочешь.',
    ageGroup: AgeGroup.YOUNG,
    type: 'fateful',
    probability: 0.05,
    repeatable: false,
    choices: [
      {
        label: 'Пойти',
        description: 'Танцы, слёзы, обещания. Ты никогда не увидишь большинство из них снова.',
        statChanges: { mood: 20, stress: -10 },
        delayedConsequences: [
          { yearsLater: 20, description: 'Ты нашёл фото с выпускного. Ностальгия.', statChanges: { mood: 10 }, memoryId: 'graduation_night' },
        ],
      },
      {
        label: 'Не пойти',
        description: 'Ты остался дома. Тихий вечер. Никаких фальшивых улыбок.',
        statChanges: { mood: -5, stress: -15 },
        skillChanges: { independence: 0.5 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Ты иногда жалеешь что не пошёл на выпускной.', statChanges: { mood: -5 }, memoryId: 'skipped_graduation' },
        ],
      },
    ],
  },
  {
    id: 'young_university_decision',
    title: 'Институт',
    description: 'Поступать в институт или нет? Самое важное решение пока.',
    ageGroup: AgeGroup.YOUNG,
    type: 'fateful',
    probability: 0.05,
    repeatable: false,
    choices: [
      {
        label: 'Поступать',
        description: 'Ты подал документы. Теперь ждёшь. Страшно и интересно.',
        statChanges: { stress: 30, mood: -5 },
        skillChanges: { responsibility: 0.8, logic: 0.3 },
        delayedConsequences: [
          { yearsLater: 5, description: 'Институт открыл тебе целый мир.', statChanges: { mood: 20 }, memoryId: 'university_choice' },
        ],
      },
      {
        label: 'Не надо',
        description: 'Институт — не для тебя. Ты пойдёшь работать.',
        statChanges: { mood: 10, stress: 10 },
        skillChanges: { independence: 0.5 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Ты иногда думаешь — что если бы поступил?', statChanges: { mood: -5 }, memoryId: 'no_university' },
        ],
      },
    ],
  },
  {
    id: 'young_move_out',
    title: 'Выехать из дома',
    description: 'Ты хочешь жить отдельно. Свобода! Но и ответственность.',
    ageGroup: AgeGroup.YOUNG,
    type: 'fateful',
    probability: 0.05,
    repeatable: false,
    choices: [
      {
        label: 'Съехать',
        description: 'Своя квартира! Маленькая. Дорогая. Но твоя!',
        statChanges: { mood: 30, stress: 35 },
        skillChanges: { independence: 1.0, responsibility: 0.8 },
        delayedConsequences: [
          { yearsLater: 3, description: 'Ты научился готовить, стирать и платить счета.', statChanges: { mood: 10 }, memoryId: 'first_own_place' },
        ],
      },
      {
        label: 'Остаться с родителями',
        description: 'Бесплатная еда и стирка. Но мама опять спрашивает когда ляжешь спать.',
        statChanges: { mood: 5, stress: 5 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Последние годы школы. Ты стал взрослее. Или нет?', statChanges: { mood: 5 }, memoryId: 'young_move_out_dc6' },
        ],
      },
    ],
  },
  {
    id: 'young_first_job',
    title: 'Первая работа',
    description: 'Ты нашёл первую настоящую работу. Теперь ты взрослый.',
    ageGroup: AgeGroup.YOUNG,
    type: 'formative',
    probability: 0.25,
    repeatable: false,
    choices: [
      {
        label: 'Работать серьёзно',
        description: 'Ты приходишь первым, уходишь последним. Начальник доволен.',
        statChanges: { mood: 15, stress: 20, energy: -25 },
        skillChanges: { responsibility: 0.8, discipline: 0.5 },
        delayedConsequences: [
          { yearsLater: 5, description: 'Первая работа научила тебя труду.', statChanges: { mood: 5 }, memoryId: 'first_real_job' },
        ],
      },
      {
        label: 'Для галочки',
        description: 'Ты работаешь чтобы были деньги. Не больше.',
        statChanges: { mood: 5, stress: 10 },
        delayedConsequences: [
          { yearsLater: 5, description: 'Прошло всего 5 лет. А кажется — целая жизнь.', statChanges: { mood: 3 }, memoryId: 'young_first_job_dc8' },
        ],
      },
    ],
  },
  {
    id: 'young_first_breakup',
    title: 'Первая расставание',
    description: 'Ты думал это навсегда. Оказалось — нет.',
    ageGroup: AgeGroup.YOUNG,
    type: 'fateful',
    probability: 0.05,
    repeatable: false,
    choices: [
      {
        label: 'Отпустить',
        description: 'Больно. Но ты отпускаешь. Время лечит.',
        statChanges: { mood: -45, stress: 40 },
        skillChanges: { resilience: 1.0, selfControl: 0.5 },
        delayedConsequences: [
          { yearsLater: 5, description: 'Ты стал сильнее после этого.', statChanges: { mood: 10 }, memoryId: 'first_breakup_stronger' },
        ],
      },
      {
        label: 'Держаться',
        description: 'Ты пишешь, звонишь, умоляешь. Бесполезно.',
        statChanges: { mood: -50, stress: 50 },
        delayedConsequences: [
          { yearsLater: 3, description: 'Ты научился отпускать. Ценой.', statChanges: { mood: -5 }, memoryId: 'learned_to_let_go_hard' },
        ],
      },
    ],
  },
  {
    id: 'young_meet_important_person',
    title: 'Важный человек',
    description: 'Ты встретил человека. Пока не знаешь, но это самый важный день.',
    ageGroup: AgeGroup.YOUNG,
    type: 'fateful',
    probability: 0.05,
    repeatable: false,
    choices: [
      {
        label: 'Познакомиться',
        description: 'Разговор за разговором. Вы не можете остановиться.',
        statChanges: { mood: 35, stress: -10 },
        skillChanges: { empathy: 1.0, charisma: 0.5 },
        delayedConsequences: [
          { yearsLater: 25, description: 'Этот человек изменил всю твою жизнь.', statChanges: { mood: 30 }, memoryId: 'met_important_person' },
        ],
      },
      {
        label: 'Пройти мимо',
        description: 'Просто ещё один человек. Ты не остановился.',
        statChanges: { mood: 5 },
        delayedConsequences: [
          { yearsLater: 20, description: 'Ты иногда думаешь — что если бы остановился?', statChanges: { mood: -5 }, memoryId: 'walked_past_important' },
        ],
      },
    ],
  },
  {
    id: 'young_adults_idiots',
    title: 'Все взрослые идиоты',
    description: 'Ты точно знаешь лучше всех. Особенно лучше родителей.',
    ageGroup: AgeGroup.YOUNG,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Доказать всем',
        description: 'Ты покажешь им! Ты докажешь что прав!',
        statChanges: { mood: 15, stress: 5 },
        skillChanges: { confidence: 0.5, independence: 0.3 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Этот момент определил твою жизнь. Ты знаешь это теперь.', statChanges: { mood: -5 }, memoryId: 'young_adults_idiots_dc13' },
        ],
      },
      {
        label: 'Может они правы?',
        description: 'Может быть... Нет. Точно идиоты.',
        statChanges: { mood: 10 },
        delayedConsequences: [
          { yearsLater: 5, description: 'Прошло всего 5 лет. А кажется — целая жизнь.', statChanges: { mood: 3 }, memoryId: 'young_adults_idiots_dc14' },
        ],
      },
    ],
  },
  {
    id: 'young_driving_license',
    title: 'Водительские права',
    description: 'Ты хочешь получить права. Это свобода!',
    ageGroup: AgeGroup.YOUNG,
    type: 'formative',
    probability: 0.25,
    repeatable: false,
    choices: [
      {
        label: 'Учиться и сдать',
        description: 'Ты сдал с первого раза! Машина — это свобода!',
        statChanges: { mood: 30, stress: -10 },
        skillChanges: { attention: 0.5, spatialThinking: 0.3 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Последние годы школы. Ты стал взрослее. Или нет?', statChanges: { mood: 5 }, memoryId: 'young_driving_license_dc15' },
        ],
      },
      {
        label: 'Не сейчас',
        description: 'Дорого и страшно. Потом.',
        statChanges: { mood: -5 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Этот момент определил твою жизнь. Ты знаешь это теперь.', statChanges: { mood: -5 }, memoryId: 'young_driving_license_dc16' },
        ],
      },
    ],
  },
  {
    id: 'young_friend_goes_away',
    title: 'Друг уезжает',
    description: 'Твой лучший друг уезжает в другой город. Может быть навсегда.',
    ageGroup: AgeGroup.YOUNG,
    type: 'formative',
    probability: 0.25,
    repeatable: false,
    choices: [
      {
        label: 'Обещать писать',
        description: '«Мы будем дружить на расстоянии!» Вы обнялись.',
        statChanges: { mood: -15, stress: 15 },
        skillChanges: { empathy: 0.5, loyalty: 0.3 },
        delayedConsequences: [
          { yearsLater: 5, description: 'Вы всё ещё дружите. Расстояние не помеха.', statChanges: { mood: 15 }, memoryId: 'friend_moved_away' },
        ],
      },
      {
        label: 'Принять',
        description: 'Люди уходят. Это нормально.',
        statChanges: { mood: -10, stress: 10 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Последние годы школы. Ты стал взрослее. Или нет?', statChanges: { mood: 5 }, memoryId: 'young_friend_goes_away_dc18' },
        ],
      },
    ],
  },
  {
    id: 'young_big_mistake',
    title: 'Большая ошибка',
    description: 'Ты сделал что-то что нельзя исправить. Родители в ярости.',
    ageGroup: AgeGroup.YOUNG,
    type: 'formative',
    probability: 0.25,
    repeatable: false,
    choices: [
      {
        label: 'Признать ошибку',
        description: 'Ты признал. Наказание. Но ты стал взрослее.',
        statChanges: { mood: -20, stress: 25 },
        skillChanges: { responsibility: 0.8, honesty: 0.5 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Этот момент определил твою жизнь. Ты знаешь это теперь.', statChanges: { mood: -5 }, memoryId: 'young_big_mistake_dc19' },
        ],
      },
      {
        label: 'Отрицать',
        description: 'Это не я. Это обстоятельства. Все виноваты кроме тебя.',
        statChanges: { mood: -5, stress: 20 },
        delayedConsequences: [
          { yearsLater: 5, description: 'Прошло всего 5 лет. А кажется — целая жизнь.', statChanges: { mood: 3 }, memoryId: 'young_big_mistake_dc20' },
        ],
      },
    ],
  },
  {
    id: 'young_dream_job',
    title: 'Мечта',
    description: 'Ты понял кем хочешь быть. Это ясно как день.',
    ageGroup: AgeGroup.YOUNG,
    type: 'formative',
    probability: 0.25,
    repeatable: false,
    choices: [
      {
        label: 'Гнаться за мечтой',
        description: 'Ты знаешь чего хочешь. И ты пойдёшь за этим.',
        statChanges: { mood: 25, stress: 10 },
        skillChanges: { persistence: 0.5, confidence: 0.5 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Ты на пути к мечте. Не всегда легко, но всегда интересно.', statChanges: { mood: 15 }, memoryId: 'chased_dream' },
        ],
      },
      {
        label: 'Быть реалистом',
        description: 'Мечты — это хорошо, но надо зарабатывать на жизнь.',
        statChanges: { mood: 5, stress: 5 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Этот момент определил твою жизнь. Ты знаешь это теперь.', statChanges: { mood: -5 }, memoryId: 'young_dream_job_dc22' },
        ],
      },
    ],
  },
  {
    id: 'young_party_mistake',
    title: 'Вечеринка',
    description: 'Ты перебрал на вечеринке. Утром не помнишь половину.',
    ageGroup: AgeGroup.YOUNG,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Никогда больше',
        description: 'Ты решил что это было в последний раз.',
        statChanges: { mood: -10, stress: 10, health: -5 },
        skillChanges: { selfControl: 0.5 },
        delayedConsequences: [
          { yearsLater: 5, description: 'Прошло всего 5 лет. А кажется — целая жизнь.', statChanges: { mood: 3 }, memoryId: 'young_party_mistake_dc23' },
        ],
      },
      {
        label: 'Бывает',
        description: 'Все так делают. Ничего страшного.',
        statChanges: { mood: -5, health: -3 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Последние годы школы. Ты стал взрослее. Или нет?', statChanges: { mood: 5 }, memoryId: 'young_party_mistake_dc24' },
        ],
      },
    ],
  },
  {
    id: 'young_mentor',
    title: 'Наставник',
    description: 'Ты встретил взрослого который верит в тебя. Он говорит «У тебя талант».',
    ageGroup: AgeGroup.YOUNG,
    type: 'fateful',
    probability: 0.05,
    repeatable: false,
    choices: [
      {
        label: 'Слушать его',
        description: 'Он научил тебя большему чем все учителя вместе взятые.',
        statChanges: { mood: 25, stress: -10 },
        skillChanges: { learningAbility: 0.8, confidence: 0.5 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Ты стал наставником для кого-то другого.', statChanges: { mood: 20 }, memoryId: 'became_mentor' },
        ],
      },
      {
        label: 'Что он знает?',
        description: 'Взрослые всегда говорят красивые слова. Ты не веришь.',
        statChanges: { mood: 5, stress: 5 },
        delayedConsequences: [
          { yearsLater: 5, description: 'Прошло всего 5 лет. А кажется — целая жизнь.', statChanges: { mood: 3 }, memoryId: 'young_mentor_dc26' },
        ],
      },
    ],
  },
  {
    id: 'young_first_salary',
    title: 'Первая зарплата',
    description: 'Ты получил свою первую зарплату. Твои деньги!',
    ageGroup: AgeGroup.YOUNG,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Копить',
        description: 'Ты положил на счёт. Когда-нибудь это пригодится.',
        statChanges: { mood: 15 },
        skillChanges: { responsibility: 0.3 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Последние годы школы. Ты стал взрослее. Или нет?', statChanges: { mood: 5 }, memoryId: 'young_first_salary_dc27' },
        ],
      },
      {
        label: 'Потратить!',
        description: 'Новые кроссовки! Пицца! Кино! Ты заслужил!',
        statChanges: { mood: 30 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Этот момент определил твою жизнь. Ты знаешь это теперь.', statChanges: { mood: -5 }, memoryId: 'young_first_salary_dc28' },
        ],
      },
    ],
  },
  {
    id: 'young_existential',
    title: 'Смысл жизни',
    description: '3 часа ночи. Ты думаешь о смысле жизни. Кто ты? Зачем?',
    ageGroup: AgeGroup.YOUNG,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Искать ответ',
        description: 'Ты начал читать философию. Стало ещё непонятнее.',
        statChanges: { mood: -5, stress: 5 },
        skillChanges: { curiosity: 0.5, logic: 0.3 },
        delayedConsequences: [
          { yearsLater: 5, description: 'Прошло всего 5 лет. А кажется — целая жизнь.', statChanges: { mood: 3 }, memoryId: 'young_existential_dc29' },
        ],
      },
      {
        label: 'Забить и спать',
        description: 'Утро вечера мудренее. Завтра всё будет ясно.',
        statChanges: { mood: 5, stress: -5 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Последние годы школы. Ты стал взрослее. Или нет?', statChanges: { mood: 5 }, memoryId: 'young_existential_dc30' },
        ],
      },
    ],
  },
  {
    id: 'young_career_choice',
    title: 'Выбор профессии',
    description: 'Школьный психолог дал тебе тест на профориентацию. Результаты странные.',
    ageGroup: AgeGroup.YOUNG,
    type: 'formative',
    probability: 0.25,
    repeatable: false,
    choices: [
      {
        label: 'Следовать результатам',
        description: 'Ты выбрал путь который предложил тест. Прагматично.',
        statChanges: { mood: 10, stress: 5 },
        skillChanges: { logic: 0.5, responsibility: 0.3 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Тест был прав. Ты нашёл своё призвание.', statChanges: { mood: 15 }, memoryId: 'career_test_right' },
        ],
      },
      {
        label: 'Выбрать своё',
        description: 'Ты знаешь лучше какого-то теста. Свой путь.',
        statChanges: { mood: 15, stress: 15 },
        skillChanges: { confidence: 0.5, persistence: 0.3 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Твой путь оказался сложнее. Но интереснее.', statChanges: { mood: 5 }, memoryId: 'own_career_path' },
        ],
      },
      {
        label: 'Забить',
        description: 'Какая разница? Разберёмся потом.',
        statChanges: { mood: -5, stress: -5 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Последние годы школы. Ты стал взрослее. Или нет?', statChanges: { mood: 5 }, memoryId: 'young_career_choice_dc33' },
        ],
      },
    ],
  },
  {
    id: 'young_parent_conflict',
    title: 'Конфликт с родителями',
    description: 'Очередной спор перерос в настоящий конфликт. Мама плачет. Папа молчит.',
    ageGroup: AgeGroup.YOUNG,
    type: 'formative',
    probability: 0.25,
    repeatable: false,
    choices: [
      {
        label: 'Извиниться',
        description: 'Ты подошёл первым. «Прости. Я был неправ.»',
        statChanges: { mood: -10, stress: -15 },
        skillChanges: { empathy: 0.5, selfControl: 0.3 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Ты научился просить прощения. Это редкий навык.', statChanges: { mood: 10 }, memoryId: 'learned_to_apologize' },
        ],
      },
      {
        label: 'Хлопнуть дверью',
        description: 'Ты ушёл из дома. На час. Потом вернулся. Никто не говорил об этом.',
        statChanges: { mood: -20, stress: 25 },
        delayedConsequences: [
          { yearsLater: 20, description: 'Ты так и не извинился. Они помнят.', statChanges: { mood: -10 }, memoryId: 'never_apologized' },
        ],
      },
      {
        label: 'Молчать и терпеть',
        description: 'Ты замолчал. Пусть думают что хотят.',
        statChanges: { mood: -15, stress: 20 },
        skillChanges: { endurance: 0.3 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Последние годы школы. Ты стал взрослее. Или нет?', statChanges: { mood: 5 }, memoryId: 'young_parent_conflict_dc36' },
        ],
      },
    ],
  },
  {
    id: 'young_exam_cheating',
    title: 'Шпаргалка',
    description: 'Экзамен. У тебя в кармане шпаргалка. Преподаватель отвернулся.',
    ageGroup: AgeGroup.YOUNG,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Использовать',
        description: 'Ты списал. Пятёрка. Но внутри пустота.',
        statChanges: { mood: 10, stress: 15 },
        delayedConsequences: [
          { yearsLater: 12, description: 'Ты не знаешь того чего должен. Это аукнулось.', statChanges: { mood: -5 }, memoryId: 'cheated_exam' },
        ],
      },
      {
        label: 'Не рискнуть',
        description: 'Ты решил положиться на себя. Результат не идеален, но честный.',
        statChanges: { mood: -5, stress: 5 },
        skillChanges: { honesty: 0.3, selfControl: 0.3 },
        delayedConsequences: [
          { yearsLater: 5, description: 'Прошло всего 5 лет. А кажется — целая жизнь.', statChanges: { mood: 3 }, memoryId: 'young_exam_cheating_dc38' },
        ],
      },
    ],
  },
  {
    id: 'young_military_office',
    title: 'Повестка',
    description: 'Пришла повестка из военкомата. Армия или... что вместо?',
    ageGroup: AgeGroup.YOUNG,
    type: 'fateful',
    probability: 0.05,
    repeatable: false,
    choices: [
      {
        label: 'Пойти служить',
        description: 'Год армии. Тяжело, но ты стал сильнее.',
        statChanges: { mood: -15, stress: 30 },
        skillChanges: { physicalStrength: 1.0, endurance: 0.8, discipline: 0.5 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Армия научила тебя дисциплине. Это пригодилось.', statChanges: { mood: 10 }, memoryId: 'army_discipline' },
        ],
      },
      {
        label: 'Поступать в вуз',
        description: 'Учёба вместо службы. Отсрочка.',
        statChanges: { mood: 10, stress: 20 },
        skillChanges: { smartness: 0.5 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Этот момент определил твою жизнь. Ты знаешь это теперь.', statChanges: { mood: -5 }, memoryId: 'young_military_office_dc40' },
        ],
      },
      {
        label: 'Найти способ не пойти',
        description: 'Ты нашёл «способ». Не совсем честный.',
        statChanges: { mood: 5, stress: 10 },
        delayedConsequences: [
          { yearsLater: 5, description: 'Прошло всего 5 лет. А кажется — целая жизнь.', statChanges: { mood: 3 }, memoryId: 'young_military_office_dc41' },
        ],
      },
    ],
  },
  {
    id: 'young_secret_relationship',
    title: 'Секретные отношения',
    description: 'Ты встречаешься с кем-то кого родители не одобрят. Пока не знают.',
    ageGroup: AgeGroup.YOUNG,
    type: 'formative',
    probability: 0.25,
    repeatable: false,
    choices: [
      {
        label: 'Рассказать родителям',
        description: 'Скандал. Крики. Но ты честен.',
        statChanges: { mood: -25, stress: 30 },
        skillChanges: { honesty: 0.5, courage: 0.3 },
        delayedConsequences: [
          { yearsLater: 8, description: 'Родители приняли твой выбор. Не сразу, но приняли.', statChanges: { mood: 15 }, memoryId: 'parents_accepted' },
        ],
      },
      {
        label: 'Прятаться',
        description: 'Тайные встречи, ложь о том где ты. Тревожно.',
        statChanges: { mood: 10, stress: 20 },
        delayedConsequences: [
          { yearsLater: 5, description: 'Всё раскрылось. Доверие разрушено.', statChanges: { mood: -20, stress: 15 }, memoryId: 'secret_revealed' },
        ],
      },
      {
        label: 'Разорвать',
        description: 'Ты выбрал мир в семье. Ценой сердца.',
        statChanges: { mood: -30, stress: 15 },
        skillChanges: { selfControl: 0.5 },
        delayedConsequences: [
          { yearsLater: 20, description: 'Ты иногда думаешь — что если бы боролся?', statChanges: { mood: -5 }, memoryId: 'gave_up_love' },
        ],
      },
    ],
  },
  {
    id: 'young_best_teachers_word',
    title: 'Слово учителя',
    description: 'Учитель сказал тебе при всех: «Ты никогда ничего не добьёшься с таким отношением».',
    ageGroup: AgeGroup.YOUNG,
    type: 'formative',
    probability: 0.25,
    repeatable: false,
    choices: [
      {
        label: 'Доказать обратное',
        description: 'Ты ушёл и начал работать как никогда. Назло.',
        statChanges: { mood: -10, stress: 20 },
        skillChanges: { persistence: 0.8, confidence: 0.5 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Ты добился всего. Учитель был неправ. Или прав?', statChanges: { mood: 15 }, memoryId: 'proved_teacher_wrong' },
        ],
      },
      {
        label: 'Поверить',
        description: 'Может он прав. Ты действительно ленивый.',
        statChanges: { mood: -30, stress: 10 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Его слова стали самосбывающимся пророчеством.', statChanges: { mood: -10 }, memoryId: 'believed_teacher' },
        ],
      },
    ],
  },
  {
    id: 'young_volunteer',
    title: 'Волонтёрство',
    description: 'Друг позвал в волонтёрский проект. Помогать другим. Бесплатно.',
    ageGroup: AgeGroup.YOUNG,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Пойти',
        description: 'Ты помог. Странное чувство — делать что-то без выгоды.',
        statChanges: { mood: 20, stress: -10 },
        skillChanges: { empathy: 0.5, responsibility: 0.3 },
        delayedConsequences: [
          { yearsLater: 8, description: 'Волонтёрство научило тебя ценить то что имеешь.', statChanges: { mood: 10 }, memoryId: 'volunteer_lesson' },
        ],
      },
      {
        label: 'Нет времени',
        description: 'У тебя и так полно дел. Себе бы помочь.',
        statChanges: { mood: -5 },
        delayedConsequences: [
          { yearsLater: 10, description: 'Последние годы школы. Ты стал взрослее. Или нет?', statChanges: { mood: 5 }, memoryId: 'young_volunteer_dc48' },
        ],
      },
    ],
  },
  {
    id: 'young_stolen_car',
    title: 'Дорога',
    description: 'Друг предлагает поехать «покататься» на машине его старшего брата. Без прав.',
    ageGroup: AgeGroup.YOUNG,
    type: 'fateful',
    probability: 0.05,
    repeatable: false,
    choices: [
      {
        label: 'Поехать',
        description: 'Адреналин! Свобода! Ветер в волосах! Ты никогда не забудешь эту ночь.',
        statChanges: { mood: 35, stress: 15 },
        skillChanges: { riskTolerance: 0.8 },
        delayedConsequences: [
          { yearsLater: 3, description: 'ДТП. Еле выжили. Машина в тотал.', statChanges: { mood: -30, stress: 40, health: -15 }, memoryId: 'car_crash_night' },
        ],
      },
      {
        label: 'Отказаться',
        description: '«Нет, ребят, я пас.» Они уехали без тебя.',
        statChanges: { mood: -10, stress: -5 },
        skillChanges: { selfControl: 0.5 },
        delayedConsequences: [
          { yearsLater: 1, description: 'Они попали в аварию. Ты был прав.', statChanges: { mood: -10 }, memoryId: 'dodged_bullet' },
        ],
      },
    ],
  },
  {
    id: 'young_tattoo',
    title: 'Татуировка',
    description: 'Ты хочешь татуировку. Родители будут против. Но тебе 17.',
    ageGroup: AgeGroup.YOUNG,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Сделать',
        description: 'Больно. Но теперь на тебе что-то постоянное. Как взрослая жизнь.',
        statChanges: { mood: 15, stress: 5 },
        skillChanges: { riskTolerance: 0.3 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Ты смотришь на тату и вспоминаешь кто ты был тогда.', statChanges: { mood: 5 }, memoryId: 'first_tattoo' },
        ],
      },
      {
        label: 'Подождать',
        description: 'Может потом. Когда точно будешь знать что хочешь.',
        statChanges: { mood: -5 },
        skillChanges: { selfControl: 0.3 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Этот момент определил твою жизнь. Ты знаешь это теперь.', statChanges: { mood: -5 }, memoryId: 'young_tattoo_dc52' },
        ],
      },
    ],
  },
  {
    id: 'young_last_school_day',
    title: 'Последний звонок',
    description: 'Последний день школы. Друзья. Учителя. Коридоры где ты провёл годы.',
    ageGroup: AgeGroup.YOUNG,
    type: 'fateful',
    probability: 0.05,
    repeatable: false,
    choices: [
      {
        label: 'Попрощаться со всеми',
        description: 'Ты обошёл каждого. Сказал спасибо. Это было правильно.',
        statChanges: { mood: 15, stress: -5 },
        skillChanges: { empathy: 0.5, gratitude: 0.3 },
        delayedConsequences: [
          { yearsLater: 25, description: 'Ты рад что попрощался. Некоторые из них ушли навсегда.', statChanges: { mood: 10 }, memoryId: 'said_goodbye' },
        ],
      },
      {
        label: 'Уйти тихо',
        description: 'Ты просто ушёл. Без прощаний. Без слёз.',
        statChanges: { mood: -5, stress: -10 },
        delayedConsequences: [
          { yearsLater: 20, description: 'Ты жалеешь что не попрощался. Особенно с теми кого больше не увидишь.', statChanges: { mood: -10 }, memoryId: 'no_goodbye' },
        ],
      },
      {
        label: 'Обещать вернуться',
        description: '«Мы ещё увидимся!» Все знают что это неправда.',
        statChanges: { mood: 5, stress: 5 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Этот момент определил твою жизнь. Ты знаешь это теперь.', statChanges: { mood: -5 }, memoryId: 'young_last_school_day_dc55' },
        ],
      },
    ],
  },
  // ─── Цепочка «Выпускной» (17 лет, 3 шага) ───
  {
    id: 'chain_graduation_prep',
    title: 'Подготовка к выпускному',
    description: 'Выпускной через неделю. Нужно решить — с кем идти и в чём.',
    ageGroup: AgeGroup.YOUNG,
    type: 'formative',
    probability: 0.25,
    repeatable: false,
    chainTag: 'graduation',
    choices: [
      {
        label: 'С лучшим другом',
        description: 'Вы договорились идти вместе. Как всегда. Как в первый класс.',
        statChanges: { mood: 15, stress: -5 },
        skillChanges: { empathy: 0.3 },
        delayedConsequences: [
          { yearsLater: 25, description: 'Тот друг — единственный с кем ты до сих пор общаешься из школы.', statChanges: { mood: 15 }, memoryId: 'graduation_with_friend' },
        ],
      },
      {
        label: 'С кем-то особенным',
        description: 'Ты пригласил ту самую. Она сказала «да».',
        statChanges: { mood: 25, stress: 10 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Вы расстались через год. Но тот вечер был волшебным.', statChanges: { mood: 5 }, memoryId: 'graduation_date' },
        ],
      },
      {
        label: 'Один',
        description: 'Ты идёшь один. Нормально. Ты сам по себе.',
        statChanges: { mood: -5, stress: 5 },
        skillChanges: { independence: 0.3 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Этот момент определил твою жизнь. Ты знаешь это теперь.', statChanges: { mood: -5 }, memoryId: 'chain_graduation_prep_dc58' },
        ],
      },
    ],
  },
  {
    id: 'chain_graduation_night',
    title: 'Ночь выпускного',
    description: 'Выпускной вечер. Музыка. Смех. Слёзы. Ты стоишь посреди зала.',
    ageGroup: AgeGroup.YOUNG,
    type: 'fateful',
    probability: 0.05,
    repeatable: false,
    chainTag: 'graduation',
    condition: 'chain_graduation_prep',
    choices: [
      {
        label: 'Танцевать до утра',
        description: 'Ты танцевал. Пел. Смеялся. Это был лучший вечер.',
        statChanges: { mood: 35, stress: -20 },
        skillChanges: { charisma: 0.3, selfEsteem: 0.3 },
        delayedConsequences: [
          { yearsLater: 30, description: 'Тот вечер — одно из лучших воспоминаний.', statChanges: { mood: 20 }, memoryId: 'graduation_danced' },
        ],
      },
      {
        label: 'Тихий уголок',
        description: 'Ты сидел в углу с двумя друзьями. Говорили о будущем.',
        statChanges: { mood: 15, stress: -10 },
        delayedConsequences: [
          { yearsLater: 20, description: 'Тот разговор в углу оказался важнее всех танцев.', statChanges: { mood: 10 }, memoryId: 'graduation_corner_talk' },
        ],
      },
      {
        label: 'Уйти пораньше',
        description: 'Ты ушёл когда все ещё веселились. Зачем?',
        statChanges: { mood: -10, stress: -5 },
        delayedConsequences: [
          { yearsLater: 15, description: 'Ты жалеешь что ушёл. Это был последний раз когда все были вместе.', statChanges: { mood: -10 }, memoryId: 'left_graduation_early' },
        ],
      },
    ],
  },
  {
    id: 'chain_graduation_morning',
    title: 'Утро после',
    description: 'Утро. Выпускной позади. Ты стоишь у школы. Впереди — жизнь.',
    ageGroup: AgeGroup.YOUNG,
    type: 'fateful',
    probability: 0.05,
    repeatable: false,
    chainTag: 'graduation',
    condition: 'chain_graduation_night',
    choices: [
      {
        label: 'Обнять школу',
        description: 'Ты подошёл и обнял стену. Глупо. Но правильно.',
        statChanges: { mood: 10, stress: -5 },
        delayedConsequences: [
          { yearsLater: 30, description: 'Школу снесли. Но ты помнишь каждый кирпич.', statChanges: { mood: -5 }, memoryId: 'hugged_school' },
        ],
      },
      {
        label: 'Не оглядываться',
        description: 'Ты пошёл вперёд. Детство кончилось. Привет, взрослая жизнь.',
        statChanges: { mood: -5, stress: 10 },
        skillChanges: { independence: 0.5 },
        delayedConsequences: [
          { yearsLater: 25, description: 'Ты никогда не оглядывался. Это и сила, и слабость.', statChanges: { mood: 5 }, memoryId: 'never_looked_back' },
        ],
      },
    ],
  },
]
