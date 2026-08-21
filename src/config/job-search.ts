import { POSSESSION_IDS } from '@/constants/possessions'
import type { JobSearchChannel, JobSearchChannelId } from '@/domain/balance/types/job-search.types'

export const JOB_SEARCH_MODAL_INTRO: string =
  'Вы без опыта, без связей и без понятия, куда смотреть. Хорошая новость: работа где-то точно есть. Плохая — искать её придётся по-разному, и не каждый способ вам пока доступен.'

export const JOB_SEARCH_MODAL_INTRO_EMPLOYED: string =
  'Сменить работу не менее нервно, чем найти первую. Те же инструменты — газета, биржа, интернет — плюс коллеги и знакомые, если повезёт с контактами.'

export const JOB_SEARCH_WEEKLY_COOLDOWN_HINT: string =
  'На этой неделе поиск уже был. Текущий список вакансий сохранён — новый поиск откроется со следующей недели.'

export const JOB_SEARCH_CHANNELS: JobSearchChannel[] = [
  {
    id: 'newspaper',
    kind: 'standard',
    label: 'Газетные объявления',
    teaser: 'Шесть случайных строк мелким шрифтом',
    modalDescription:
      'Развернуть «Работу и услуги» между рекламой окон и поиском кота. Шанс низкий, зато не надо ни с кем разговаривать.',
    unlock: { type: 'always' },
    filter: {
      maxGradeLevel: 2,
      maxResults: 6,
      randomPick: true,
    },
  },
  {
    id: 'job_center',
    kind: 'standard',
    label: 'Биржа труда',
    teaser: 'Скучно, официально, зато без сюрпризов',
    modalDescription:
      'Очередь, бахила и сотрудник, который произносит «вакансия» как приговор. Зато список честный — только самые простые должности.',
    unlock: { type: 'always' },
    filter: {
      maxGradeLevel: 2,
    },
  },
  {
    id: 'internet',
    kind: 'standard',
    label: 'Поиск в интернете',
    teaser: 'Сайты, агрегаторы и подозрительные «удалёнки»',
    modalDescription:
      'Открыть браузер, закрыть три вкладки с мемами и наконец зайти на сайты с вакансиями. Без компьютера этот путь закрыт — смартфон пока не считается.',
    unlock: {
      type: 'possession',
      possessionId: POSSESSION_IDS.computer,
    },
    filter: {
      maxGradeLevel: 6,
    },
  },
  {
    id: 'friends_network',
    kind: 'friends_network',
    label: 'Рекомендации знакомых',
    teaser: 'Кто-то из круга знает «того самого HR»',
    modalDescription:
      'Написать в чат «есть работа?», пережить три мема и получить пару контактов. Нужен хотя бы минимальный круг общения — или харизма, которая его заменяет.',
    unlock: {
      type: 'relationships',
      minRelationships: 2,
    },
    filter: {
      maxGradeLevel: 4,
      maxResults: 4,
      randomPick: true,
    },
  },
  {
    id: 'colleague_referral',
    kind: 'colleague_referral',
    label: 'Поспрашивать коллег',
    teaser: 'Смежные отрасли и слухи из курилки',
    modalDescription:
      'Один разговор у кофемашины — и вдруг всплывают вакансии из соседних сфер. Работает только пока вы уже где-то трудитесь; шанс не стопроцентный.',
    unlock: { type: 'employed_only' },
    filter: {},
  },
  {
    id: 'recruitment_agency',
    kind: 'standard',
    label: 'Кадровое агентство',
    teaser: 'Кто-то ищет за вас — за процент с зарплаты',
    modalDescription:
      'Улыбка до ушей, кофе из автомата и обещание «мы вас точно куда-нибудь устроим». Доступно, когда вы хотя бы раз доказали, что умеете держать дедлайн.',
    unlock: {
      type: 'discovered',
      channelId: 'recruitment_agency',
    },
    filter: {
      maxGradeLevel: 5,
    },
  },
]

/**
 * @description [Config] - канал поиска работы.
 * @return { JobSearchChannel | undefined }
 */
export function getJobSearchChannel(channelId: JobSearchChannelId): JobSearchChannel | undefined {
  return JOB_SEARCH_CHANNELS.find((channel) => channel.id === channelId)
}
