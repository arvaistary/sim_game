export type NewGamePathId = 'none' | 'school' | 'institute'

export interface BuildNewGameSaveInput {
  playerName: string
  startAge: number
  pathId: NewGamePathId
}