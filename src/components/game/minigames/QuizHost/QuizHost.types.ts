export interface QuizHostCompletePayload {
  correctCount: number
  selectedIndexes: number[]
}

export interface QuizHostProps {
  questions: Array<{
    id: string
    prompt: string
    options: [string, string, string]
    correctIndex: 0 | 1 | 2
  }>
  title: string
}

export interface QuizHostEmits {
  complete: [payload: QuizHostCompletePayload]
}
