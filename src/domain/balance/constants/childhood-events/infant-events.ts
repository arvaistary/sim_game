import { AgeGroup } from '../../actions/types'
import type { ChildhoodEventDef } from '../../types/childhood-event'

/**
 * Детские события: 0-3 года (Младенчество)
 * Автоматические события, игрок только наблюдает.
 * 20 событий.
 */
export const INFANT_EVENTS: ChildhoodEventDef[] = [
  {
    id: 'infant_first_smile',
    title: 'Первая улыбка',
    description: 'Ты улыбнулся маме впервые. Она расплакалась от счастья.',
    ageGroup: AgeGroup.INFANT,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Улыбаться ещё шире',
        description: 'Мама смеётся и крепко обнимает тебя.',
        statChanges: { mood: 15, stress: -10 },
        skillChanges: { trustInPeople: 0.5, empathy: 0.3 },
        delayedConsequences: [
          { yearsLater: 25, description: 'Ты совсем не помнишь этот момент. Но он сформировал тебя.', statChanges: { mood: -3 }, memoryId: 'infant_first_smile_dc1' },
        ],
      },
      {
        label: 'Отвернуться',
        description: 'Ты отвернулся и уткнулся в подушку.',
        statChanges: { mood: -5 },
        delayedConsequences: [
          {
            yearsLater: 5,
            description: 'Мама часто вспоминает этот момент и грустит.',
            statChanges: { mood: -5 },
            memoryId: 'first_smile_turned_away',
          },
        ],
      },
    ],
  },
  {
    id: 'infant_hungry_cry',
    title: 'Голодный плач',
    description: 'Ты голоден и плачешь изо всех сил. Кто-то обязательно придёт.',
    ageGroup: AgeGroup.INFANT,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Плакать громче',
        description: 'Мама прибежала через минуту. Тебя покормили.',
        statChanges: { mood: 10, stress: -15 },
        skillChanges: { trustInPeople: 0.4 },
        delayedConsequences: [
          { yearsLater: 25, description: 'Ты совсем не помнишь этот момент. Но он сформировал тебя.', statChanges: { mood: -3 }, memoryId: 'infant_hungry_cry_dc3' },
        ],
      },
      {
        label: 'Замолчать и ждать',
        description: 'Прошло 20 минут прежде чем кто-то пришёл.',
        statChanges: { mood: -10, stress: 15 },
        delayedConsequences: [
          {
            yearsLater: 10,
            description: 'Ты до сих пор не любишь просить о помощи.',
            grantTrait: 'selfSufficient',
            memoryId: 'learned_not_to_ask',
          },
        ],
      },
    ],
  },
  {
    id: 'infant_stranger_fear',
    title: 'Незнакомец',
    description: 'К тебе подошёл незнакомый человек и потянул руки чтобы взять тебя.',
    ageGroup: AgeGroup.INFANT,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Заплакать',
        description: 'Мама сразу забрала тебя. Незнакомец оказался дядей.',
        statChanges: { stress: 10, mood: -5 },
        skillChanges: { attention: 0.3 },
        delayedConsequences: [
          { yearsLater: 25, description: 'Ты совсем не помнишь этот момент. Но он сформировал тебя.', statChanges: { mood: -3 }, memoryId: 'infant_stranger_fear_dc5' },
        ],
      },
      {
        label: 'Улыбнуться',
        description: 'Незнакомец оказался добрым. Он дал тебе конфету.',
        statChanges: { mood: 10 },
        skillChanges: { trustInPeople: 0.5 },
        delayedConsequences: [
          {
            yearsLater: 8,
            description: 'Ты по-прежнему доверяешь незнакомцам.',
            statChanges: { mood: 5 },
            memoryId: 'trusted_strangers',
          },
        ],
      },
    ],
  },
  {
    id: 'infant_first_steps',
    title: 'Первые шаги',
    description: 'Ты стоишь держась за диван. Мама зовёт тебя с другой стороны комнаты.',
    ageGroup: AgeGroup.INFANT,
    type: 'formative',
    probability: 0.25,
    repeatable: false,
    choices: [
      {
        label: 'Шагнуть к маме',
        description: 'Ты сделал три шага и упал прямо в мамины руки!',
        statChanges: { mood: 25, stress: -10 },
        skillChanges: { confidence: 0.5, physicalStrength: 0.3 },
        delayedConsequences: [
          {
            yearsLater: 15,
            description: 'Ты всегда помнишь что первый шаг был к маме.',
            statChanges: { mood: 10 },
            memoryId: 'first_steps_to_mom',
          },
        ],
      },
      {
        label: 'Остаться у дивана',
        description: 'Безопаснее здесь. Ты сел и продолжил играть.',
        statChanges: { mood: 5, stress: -5 },
        delayedConsequences: [
          { yearsLater: 18, description: 'Это раннее воспоминание до сих пор влияет на тебя.', statChanges: { mood: 5 }, memoryId: 'infant_first_steps_dc8' },
        ],
      },
    ],
  },
  {
    id: 'infant_first_word',
    title: 'Первое слово',
    description: 'Ты пытаешься что-то сказать. Все замерли и слушают.',
    ageGroup: AgeGroup.INFANT,
    type: 'formative',
    probability: 0.25,
    repeatable: false,
    choices: [
      {
        label: 'Сказать «мама»',
        description: 'Мама расплакалась от счастья. Все хлопают.',
        statChanges: { mood: 30, stress: -15 },
        skillChanges: { languageAptitude: 0.5, empathy: 0.3 },
        delayedConsequences: [
          { yearsLater: 25, description: 'Ты совсем не помнишь этот момент. Но он сформировал тебя.', statChanges: { mood: -3 }, memoryId: 'infant_first_word_dc9' },
        ],
      },
      {
        label: 'Сказать «дай»',
        description: 'Все засмеялись. Папа сказал «Вот это характер!».',
        statChanges: { mood: 20 },
        skillChanges: { confidence: 0.4 },
        delayedConsequences: [
          { yearsLater: 18, description: 'Это раннее воспоминание до сих пор влияет на тебя.', statChanges: { mood: 5 }, memoryId: 'infant_first_word_dc10' },
        ],
      },
      {
        label: 'Промолчать',
        description: 'Момент прошёл. Может быть в следующий раз.',
        statChanges: { mood: -5 },
        delayedConsequences: [
          { yearsLater: 25, description: 'Ты совсем не помнишь этот момент. Но он сформировал тебя.', statChanges: { mood: -3 }, memoryId: 'infant_first_word_dc11' },
        ],
      },
    ],
  },
  {
    id: 'infant_fall_from_sofa',
    title: 'Падение с дивана',
    description: 'Ты забрался на диван и теперь смотришь вниз. Пол очень далеко.',
    ageGroup: AgeGroup.INFANT,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Прыгнуть',
        description: 'Бум! Больно, но ты не плачешь. Ты гордо смотришь на маму.',
        statChanges: { mood: -5, stress: 10, health: -2 },
        skillChanges: { physicalStrength: 0.3, courage: 0.2 },
        delayedConsequences: [
          { yearsLater: 18, description: 'Это раннее воспоминание до сих пор влияет на тебя.', statChanges: { mood: 5 }, memoryId: 'infant_fall_from_sofa_dc12' },
        ],
      },
      {
        label: 'Позвать маму',
        description: 'Мама сняла тебя и поцеловала.',
        statChanges: { mood: 10, stress: -5 },
        skillChanges: { trustInPeople: 0.3 },
        delayedConsequences: [
          { yearsLater: 25, description: 'Ты совсем не помнишь этот момент. Но он сформировал тебя.', statChanges: { mood: -3 }, memoryId: 'infant_fall_from_sofa_dc13' },
        ],
      },
    ],
  },
  {
    id: 'infant_pet_encounter',
    title: 'Встреча с котом',
    description: 'К дому подошёл пушистый кот. Он смотрит на тебя.',
    ageGroup: AgeGroup.INFANT,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Потянуть руки',
        description: 'Кот подошёл и потёрся о твои пальцы. Мягкий!',
        statChanges: { mood: 20, stress: -10 },
        skillChanges: { empathy: 0.5, capacityToLove: 0.3 },
        delayedConsequences: [
          { yearsLater: 18, description: 'Это раннее воспоминание до сих пор влияет на тебя.', statChanges: { mood: 5 }, memoryId: 'infant_pet_encounter_dc14' },
        ],
      },
      {
        label: 'Испугаться',
        description: 'Ты заплакал и мама унесла тебя. Кот обиделся.',
        statChanges: { stress: 15, mood: -10 },
        delayedConsequences: [
          { yearsLater: 25, description: 'Ты совсем не помнишь этот момент. Но он сформировал тебя.', statChanges: { mood: -3 }, memoryId: 'infant_pet_encounter_dc15' },
        ],
      },
    ],
  },
  {
    id: 'infant_music_reaction',
    title: 'Музыка по радио',
    description: 'По радио заиграла красивая мелодия. Ты замираешь и слушаешь.',
    ageGroup: AgeGroup.INFANT,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Начать двигаться в такт',
        description: 'Ты качаешься из стороны в сторону. Мама снимает на видео.',
        statChanges: { mood: 20 },
        skillChanges: { musicalEar: 0.5, creativity: 0.3 },
        delayedConsequences: [
          { yearsLater: 18, description: 'Это раннее воспоминание до сих пор влияет на тебя.', statChanges: { mood: 5 }, memoryId: 'infant_music_reaction_dc16' },
        ],
      },
      {
        label: 'Просто слушать',
        description: 'Музыка заполняет всё вокруг. Тебе спокойно.',
        statChanges: { mood: 10, stress: -10 },
        skillChanges: { musicalEar: 0.3 },
        delayedConsequences: [
          { yearsLater: 25, description: 'Ты совсем не помнишь этот момент. Но он сформировал тебя.', statChanges: { mood: -3 }, memoryId: 'infant_music_reaction_dc17' },
        ],
      },
    ],
  },
  {
    id: 'infant_parent_fight',
    title: 'Родители ссорятся',
    description: 'Мама и папа кричат друг на друга. Ты не понимаешь слов, но чувствуешь что что-то не так.',
    ageGroup: AgeGroup.INFANT,
    type: 'formative',
    probability: 0.25,
    repeatable: false,
    choices: [
      {
        label: 'Заплакать',
        description: 'Ты заплакал и они замолчали. Мама взяла тебя на руки.',
        statChanges: { stress: 20, mood: -15 },
        delayedConsequences: [
          {
            yearsLater: 12,
            description: 'Ты до сих пор не переносишь когда люди кричат.',
            statChanges: { stress: 10 },
            memoryId: 'parents_fighting_baby',
          },
        ],
      },
      {
        label: 'Спрятаться',
        description: 'Ты уткнулся в подушку и закрыл уши.',
        statChanges: { stress: 25, mood: -20 },
        delayedConsequences: [
          {
            yearsLater: 15,
            description: 'Ты научился прятать эмоции глубоко внутри.',
            grantTrait: 'introvert',
            memoryId: 'learned_to_hide',
          },
        ],
      },
    ],
  },
  {
    id: 'infant_grandma_visit',
    title: 'Бабушка пришла',
    description: 'Бабушка принесла пирожки и крепко обнимает тебя.',
    ageGroup: AgeGroup.INFANT,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Обнять бабушку',
        description: 'Бабушка счастлива. Она рассказывает тебе сказку.',
        statChanges: { mood: 20, stress: -10 },
        skillChanges: { capacityToLove: 0.4, empathy: 0.3 },
        delayedConsequences: [
          { yearsLater: 18, description: 'Это раннее воспоминание до сих пор влияет на тебя.', statChanges: { mood: 5 }, memoryId: 'infant_grandma_visit_dc20' },
        ],
      },
      {
        label: 'Заплакать',
        description: 'Бабушка незнакомая и пахнет по-другому.',
        statChanges: { stress: 10, mood: -5 },
        delayedConsequences: [
          { yearsLater: 25, description: 'Ты совсем не помнишь этот момент. Но он сформировал тебя.', statChanges: { mood: -3 }, memoryId: 'infant_grandma_visit_dc21' },
        ],
      },
    ],
  },
  {
    id: 'infant_bath_time',
    title: 'Купание',
    description: 'Тебя опускают в тёплую воду. Вокруг много пузырей.',
    ageGroup: AgeGroup.INFANT,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Брызгаться',
        description: 'Ты брызгаешь водой и смеёшься. Папа мокрый с ног до головы.',
        statChanges: { mood: 25, stress: -15 },
        skillChanges: { curiosity: 0.3 },
        delayedConsequences: [
          { yearsLater: 18, description: 'Это раннее воспоминание до сих пор влияет на тебя.', statChanges: { mood: 5 }, memoryId: 'infant_bath_time_dc22' },
        ],
      },
      {
        label: 'Не хотеть из ванны',
        description: 'Вода тёплая и приятная. Ты не хочешь выходить.',
        statChanges: { mood: 15, stress: -5 },
        delayedConsequences: [
          { yearsLater: 25, description: 'Ты совсем не помнишь этот момент. Но он сформировал тебя.', statChanges: { mood: -3 }, memoryId: 'infant_bath_time_dc23' },
        ],
      },
    ],
  },
  {
    id: 'infant_thunder_storm',
    title: 'Гроза',
    description: 'За окном громко гремит. Стены дрожат. Темнота.',
    ageGroup: AgeGroup.INFANT,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Плакать от страха',
        description: 'Мама прибежала и укачивает тебя. Всё хорошо.',
        statChanges: { stress: 20, mood: -10 },
        skillChanges: { trustInPeople: 0.3 },
        delayedConsequences: [
          { yearsLater: 18, description: 'Это раннее воспоминание до сих пор влияет на тебя.', statChanges: { mood: 5 }, memoryId: 'infant_thunder_storm_dc24' },
        ],
      },
      {
        label: 'Смотреть на молнии',
        description: 'Яркие вспышки за окном. Красиво и страшно одновременно.',
        statChanges: { mood: 5, stress: 10 },
        skillChanges: { curiosity: 0.4, courage: 0.2 },
        delayedConsequences: [
          { yearsLater: 25, description: 'Ты совсем не помнишь этот момент. Но он сформировал тебя.', statChanges: { mood: -3 }, memoryId: 'infant_thunder_storm_dc25' },
        ],
      },
    ],
  },
  {
    id: 'infant_toy_sharing',
    title: 'Другой малыш',
    description: 'На площадке другой малыш тянется к твоей игрушке.',
    ageGroup: AgeGroup.INFANT,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Отдать игрушку',
        description: 'Малыш улыбнулся. Мама сказала «Какой добрый!».',
        statChanges: { mood: 15, stress: -5 },
        skillChanges: { empathy: 0.4, generosity: 0.3 },
        delayedConsequences: [
          { yearsLater: 18, description: 'Это раннее воспоминание до сих пор влияет на тебя.', statChanges: { mood: 5 }, memoryId: 'infant_toy_sharing_dc26' },
        ],
      },
      {
        label: 'Забрать и прижать',
        description: 'Моё! Ты крепко держишь игрушку.',
        statChanges: { mood: 5, stress: 5 },
        delayedConsequences: [
          { yearsLater: 25, description: 'Ты совсем не помнишь этот момент. Но он сформировал тебя.', statChanges: { mood: -3 }, memoryId: 'infant_toy_sharing_dc27' },
        ],
      },
    ],
  },
  {
    id: 'infant_mirror_discovery',
    title: 'Зеркало',
    description: 'Ты видишь себя в зеркале. Кто этот малыш?',
    ageGroup: AgeGroup.INFANT,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Улыбнуться',
        description: 'Малыш в зеркале тоже улыбается! Вы играете вместе.',
        statChanges: { mood: 20 },
        skillChanges: { curiosity: 0.3, selfEsteem: 0.2 },
        delayedConsequences: [
          { yearsLater: 18, description: 'Это раннее воспоминание до сих пор влияет на тебя.', statChanges: { mood: 5 }, memoryId: 'infant_mirror_discovery_dc28' },
        ],
      },
      {
        label: 'Трогать стекло',
        description: 'Ты пытаешься потрогать этого малыша. Холодное стекло.',
        statChanges: { mood: 10 },
        skillChanges: { curiosity: 0.5 },
        delayedConsequences: [
          { yearsLater: 25, description: 'Ты совсем не помнишь этот момент. Но он сформировал тебя.', statChanges: { mood: -3 }, memoryId: 'infant_mirror_discovery_dc29' },
        ],
      },
    ],
  },
  {
    id: 'infant_sick_night',
    title: 'Болезнь',
    description: 'У тебя температура. Ты весь горишь. Мама не спит всю ночь.',
    ageGroup: AgeGroup.INFANT,
    type: 'formative',
    probability: 0.25,
    repeatable: false,
    choices: [
      {
        label: 'Плакать и прижиматься',
        description: 'Мама держит тебя всю ночь. К утру температура спала.',
        statChanges: { health: -10, stress: 15, mood: -10 },
        skillChanges: { trustInPeople: 0.5, capacityToLove: 0.3 },
        delayedConsequences: [
          {
            yearsLater: 20,
            description: 'Когда ты болеешь, ты всегда вспоминаешь мамины руки.',
            statChanges: { mood: 5 },
            memoryId: 'sick_night_mom',
          },
        ],
      },
      {
        label: 'Молча терпеть',
        description: 'Ты тихо лежишь. Мама всё равно не отходит.',
        statChanges: { health: -10, stress: 20, mood: -15 },
        delayedConsequences: [
          {
            yearsLater: 15,
            description: 'Ты научился переносить боль молча.',
            grantTrait: 'tough',
            memoryId: 'learned_silence',
          },
        ],
      },
    ],
  },
  {
    id: 'infant_dad_plays',
    title: 'Папа подбрасывает',
    description: 'Папа подбрасывает тебя высоко вверх. Ты летишь!',
    ageGroup: AgeGroup.INFANT,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Смеяться',
        description: 'Ты хохочешь так громко что соседи слышат!',
        statChanges: { mood: 30, stress: -15 },
        skillChanges: { confidence: 0.3, trustInPeople: 0.3 },
        delayedConsequences: [
          { yearsLater: 18, description: 'Это раннее воспоминание до сих пор влияет на тебя.', statChanges: { mood: 5 }, memoryId: 'infant_dad_plays_dc32' },
        ],
      },
      {
        label: 'Испугаться',
        description: 'Слишком высоко! Ты вцепился в папу.',
        statChanges: { stress: 15, mood: -5 },
        delayedConsequences: [
          { yearsLater: 25, description: 'Ты совсем не помнишь этот момент. Но он сформировал тебя.', statChanges: { mood: -3 }, memoryId: 'infant_dad_plays_dc33' },
        ],
      },
    ],
  },
  {
    id: 'infant_building_blocks',
    title: 'Кубики',
    description: 'Ты строишь башню из кубиков. Она становится всё выше.',
    ageGroup: AgeGroup.INFANT,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Построить ещё выше',
        description: 'Башня упала! Но ты начинаешь заново.',
        statChanges: { mood: 15 },
        skillChanges: { persistence: 0.3, spatialThinking: 0.4 },
        delayedConsequences: [
          { yearsLater: 18, description: 'Это раннее воспоминание до сих пор влияет на тебя.', statChanges: { mood: 5 }, memoryId: 'infant_building_blocks_dc34' },
        ],
      },
      {
        label: 'Разбить!',
        description: 'Удар! Все кубики разлетелись. Весело!',
        statChanges: { mood: 20 },
        skillChanges: { curiosity: 0.3 },
        delayedConsequences: [
          { yearsLater: 25, description: 'Ты совсем не помнишь этот момент. Но он сформировал тебя.', statChanges: { mood: -3 }, memoryId: 'infant_building_blocks_dc35' },
        ],
      },
    ],
  },
  {
    id: 'infant_sleep_refusal',
    title: 'Не хочу спать',
    description: 'Ты совсем не хочешь спать. Вокруг столько интересного!',
    ageGroup: AgeGroup.INFANT,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Сопротивляться',
        description: 'Ты кричишь и вырываешься. В итоге засыпаешь от усталости.',
        statChanges: { energy: -20, stress: 15, mood: -10 },
        delayedConsequences: [
          { yearsLater: 18, description: 'Это раннее воспоминание до сих пор влияет на тебя.', statChanges: { mood: 5 }, memoryId: 'infant_sleep_refusal_dc36' },
        ],
      },
      {
        label: 'Уснуть',
        description: 'Тёплое молоко и колыбельная сделали своё дело.',
        statChanges: { energy: 25, stress: -10, mood: 5 },
        delayedConsequences: [
          { yearsLater: 25, description: 'Ты совсем не помнишь этот момент. Но он сформировал тебя.', statChanges: { mood: -3 }, memoryId: 'infant_sleep_refusal_dc37' },
        ],
      },
    ],
  },
  {
    id: 'infant_separation_anxiety',
    title: 'Мама уходит',
    description: 'Мама уходит на работу. Ты тянешь к ней руки.',
    ageGroup: AgeGroup.INFANT,
    type: 'formative',
    probability: 0.25,
    repeatable: false,
    choices: [
      {
        label: 'Плакать и звать',
        description: 'Мама вернулась чтобы обнять тебя. Потом всё равно ушла.',
        statChanges: { stress: 25, mood: -15 },
        delayedConsequences: [
          {
            yearsLater: 10,
            description: 'Ты до сих пор боишься что близкие уйдут.',
            statChanges: { stress: 5 },
            memoryId: 'mom_leaving',
          },
        ],
      },
      {
        label: 'Махать рукой',
        description: 'Ты помахал маме. Она помахала в ответ и улыбнулась.',
        statChanges: { mood: 5, stress: 10 },
        skillChanges: { selfControl: 0.2 },
        delayedConsequences: [
          {
            yearsLater: 8,
            description: 'Ты научился отпускать людей.',
            statChanges: { mood: 5 },
            memoryId: 'learned_to_let_go',
          },
        ],
      },
    ],
  },
  {
    id: 'infant_first_drawing',
    title: 'Первые каракули',
    description: 'Ты нашёл карандаш и тянешься к стене.',
    ageGroup: AgeGroup.INFANT,
    type: 'everyday',
    probability: 0.70,
    repeatable: true,
    choices: [
      {
        label: 'Нарисовать на стене',
        description: 'Яркие линии на белой стене! Красиво!',
        statChanges: { mood: 20 },
        skillChanges: { creativity: 0.5, curiosity: 0.3 },
        delayedConsequences: [
          { yearsLater: 18, description: 'Это раннее воспоминание до сих пор влияет на тебя.', statChanges: { mood: 5 }, memoryId: 'infant_first_drawing_dc40' },
        ],
      },
      {
        label: 'Нарисовать на бумаге',
        description: 'Мама дала тебе лист бумаги. Не так интересно, но мама довольна.',
        statChanges: { mood: 10 },
        skillChanges: { creativity: 0.3 },
        delayedConsequences: [
          { yearsLater: 25, description: 'Ты совсем не помнишь этот момент. Но он сформировал тебя.', statChanges: { mood: -3 }, memoryId: 'infant_first_drawing_dc41' },
        ],
      },
    ],
  },
]
