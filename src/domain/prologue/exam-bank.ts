import { SCHOOL_EXAM_QUESTIONS } from '@/domain/balance/constants/prologue/exam-questions-school'
import { TECH_EXAM_QUESTIONS } from '@/domain/balance/constants/prologue/exam-questions-tech'
import { UNI_EXAM_QUESTIONS } from '@/domain/balance/constants/prologue/exam-questions-uni'
import type { DrawExamQuestionsInput, PrologueExamBankId, PrologueExamQuestion, PrologueTrack, SeededRng } from './prologue.types'
import { createSeededRng, drawFromPool } from './scene-pool'

/**
 * @description [Prologue] - Возвращает банк вопросов по id.
 * @return { PrologueExamQuestion[] } банк
 */
export function getExamBank(bankId: PrologueExamBankId): PrologueExamQuestion[] {
  switch (bankId) {
    case 'school':
      return SCHOOL_EXAM_QUESTIONS
    case 'tech':
      return TECH_EXAM_QUESTIONS
    case 'uni':
      return UNI_EXAM_QUESTIONS
    default: {
      const _exhaustive: never = bankId
      return _exhaustive
    }
  }
}

/**
 * @description [Prologue] - Банк postsec по треку.
 * @return { PrologueExamBankId } id банка
 */
export function getPostsecExamBankId(track: PrologueTrack): PrologueExamBankId {
  return track === 'tech' ? 'tech' : 'uni'
}

/**
 * @description [Prologue] - Достаёт N вопросов без повторов из банка.
 * @return { PrologueExamQuestion[] } выбранные вопросы
 */
export function drawExamQuestions(data: DrawExamQuestionsInput): PrologueExamQuestion[] {
  const bank: PrologueExamQuestion[] = getExamBank(data.bankId)
  const rng: SeededRng = createSeededRng((data.seed ^ (data.salt * 2654435761)) >>> 0)
  const picked: PrologueExamQuestion[] = []
  const excludeIds: string[] = []

  for (let index = 0; index < data.count; index += 1) {
    const question: PrologueExamQuestion | null = drawFromPool({
      items: bank,
      rng,
      excludeIds,
      getId: (item: PrologueExamQuestion) => item.id,
    })

    if (!question) break
    picked.push(question)
    excludeIds.push(question.id)
  }

  return picked
}
