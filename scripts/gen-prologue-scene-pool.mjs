import fs from 'node:fs'

function countChoices(src) {
  const re = /id: '([^']+)'[\s\S]*?choices: \[([\s\S]*?)\n {4}\],/g
  const map = {}
  let match
  while ((match = re.exec(src))) {
    map[match[1]] = (match[2].match(/label:/g) || []).length
  }
  return map
}

const all = {}
for (const fileName of ['infant', 'preschool', 'school', 'teen', 'young']) {
  Object.assign(
    all,
    countChoices(fs.readFileSync(`src/domain/balance/constants/childhood-events/${fileName}-events.ts`, 'utf8')),
  )
}

const infant = [
  'infant_first_smile', 'infant_hungry_cry', 'infant_stranger_fear', 'infant_first_steps',
  'infant_first_word', 'infant_music_reaction', 'infant_building_blocks', 'infant_first_drawing',
]
const preschool = [
  'preschool_fight_for_toy', 'preschool_share_cookies', 'preschool_poem_concert', 'preschool_protect_small',
  'preschool_eternal_question', 'preschool_fear_dark', 'preschool_lie_broken_vase', 'preschool_best_friend',
  'preschool_drawing_contest', 'preschool_parent_praise', 'preschool_new_kid', 'preschool_fairytale',
]
const school = [
  'school_math_teacher', 'school_homework', 'school_read_book', 'school_club_join',
  'school_science_fair', 'school_win_competition', 'school_music_lesson', 'school_report_card',
  'school_summer_camp', 'school_friend_neighbor', 'school_bad_grade_cry', 'school_first_money',
  'school_bike', 'school_collection', 'school_skip_classes', 'school_bully_witness',
]
const tech = [
  'teen_start_sport', 'teen_new_hobby', 'teen_exam_stress', 'young_first_job',
  'young_mentor', 'young_volunteer', 'young_career_choice', 'young_exam_cheating',
  'young_first_salary', 'young_driving_license', 'young_move_out', 'young_party_mistake',
]
const uni = [
  'young_university_decision', 'young_dream_job', 'young_existential', 'young_best_teachers_word',
  'teen_diary', 'teen_parent_conflict', 'teen_social_media', 'teen_bully_witness',
  'young_meet_important_person', 'young_adults_idiots', 'young_big_mistake', 'young_secret_relationship',
]

for (const eventId of [...infant, ...preschool, ...school, ...tech, ...uni]) {
  if (!all[eventId]) throw new Error(`missing ${eventId}`)
}

const tagSets = {
  infant: [['social', 'curiosity'], ['curiosity', 'discipline'], ['social', 'body']],
  preschool: [['social', 'discipline'], ['creative', 'curiosity'], ['social', 'body']],
  school: [['stem', 'discipline'], ['lingua', 'curiosity'], ['social', 'discipline'], ['creative', 'social'], ['practical', 'discipline']],
  tech: [['practical', 'discipline'], ['practical', 'stem'], ['body', 'discipline']],
  uni: [['stem', 'curiosity'], ['lingua', 'social'], ['stem', 'discipline']],
}

const weightCycle = {
  infant: ['everyday', 'everyday', 'formative'],
  preschool: ['everyday', 'formative', 'everyday'],
  school: ['everyday', 'everyday', 'formative', 'fateful'],
  tech: ['everyday', 'formative', 'everyday'],
  uni: ['everyday', 'formative', 'everyday'],
}

function makeChoices(choiceCount, stage, index) {
  const pair = tagSets[stage][index % tagSets[stage].length]
  const choices = []

  for (let choiceIndex = 0; choiceIndex < choiceCount; choiceIndex += 1) {
    const tag = pair[choiceIndex % pair.length]
    const choice = {
      tagDeltas: { [tag]: choiceIndex === 0 ? 2 : 1 },
    }

    if (stage === 'preschool' && choiceIndex === 0 && index % 5 === 0) choice.optionalTraitId = 'curious'
    if (stage === 'school' && choiceIndex === 0 && index % 7 === 0) choice.optionalTraitId = 'disciplined'
    if (stage === 'tech' && choiceIndex === 0 && index % 4 === 0) choice.optionalTraitId = 'organized'
    if (stage === 'uni' && choiceIndex === 0 && index % 4 === 0) choice.optionalTraitId = 'curious'
    if (choiceIndex === 0 && index % 6 === 0) choice.memoryId = `${stage}_mem_${index}`

    choices.push(choice)
  }

  return choices
}

function entries(ids, stage) {
  return ids.map((eventId, index) => ({
    eventId,
    stage,
    weightType: weightCycle[stage][index % weightCycle[stage].length],
    choices: makeChoices(all[eventId], stage, index),
  }))
}

const pool = [
  ...entries(infant, 'infant'),
  ...entries(preschool, 'preschool'),
  ...entries(school, 'school'),
  ...entries(tech, 'tech'),
  ...entries(uni, 'uni'),
]

for (const entry of pool) {
  if (entry.choices.length !== all[entry.eventId]) {
    throw new Error(`choice mismatch ${entry.eventId}`)
  }
}

const typesPath = 'src/domain/prologue/prologue.types.ts'
let typesSource = fs.readFileSync(typesPath, 'utf8')
if (!typesSource.includes('PrologueScenePoolEntry')) {
  typesSource += `

/** Маппинг одного выбора сцены. */
export interface PrologueSceneChoiceMapping {
  tagDeltas: PrologueTagDeltas
  optionalTraitId?: string
  memoryId?: string
}

/** Запись пула сцен пролога. */
export interface PrologueScenePoolEntry {
  eventId: string
  stage: PrologueSceneStage
  weightType: 'everyday' | 'formative' | 'fateful'
  choices: PrologueSceneChoiceMapping[]
}
`
  fs.writeFileSync(typesPath, typesSource)
}

const serialized = JSON.stringify(pool, null, 2)
const body = `import type { PrologueScenePoolEntry, PrologueSceneStage } from '@/domain/prologue/prologue.types'

/** Маппинг childhood eventId → tag deltas (skillChanges игнорируются runner'ом). */
export const PROLOGUE_SCENE_POOL: PrologueScenePoolEntry[] = ${serialized}

/**
 * @description [Prologue] - Пул сцен для стадии.
 * @return { PrologueScenePoolEntry[] } записи пула
 */
export function getScenePoolEntriesForStage(stage: PrologueSceneStage): PrologueScenePoolEntry[] {
  return PROLOGUE_SCENE_POOL.filter((entry: PrologueScenePoolEntry) => entry.stage === stage)
}
`

fs.writeFileSync('src/domain/balance/constants/prologue/scene-pool-config.ts', body)
console.log('wrote scene-pool-config', pool.length)
