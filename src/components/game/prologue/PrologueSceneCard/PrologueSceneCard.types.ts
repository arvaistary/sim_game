export interface PrologueSceneCardProps {
  title: string
  description: string
  yearLabel: string
  choices: Array<{ index: number; label: string; description: string }>
}

export interface PrologueSceneCardEmits {
  choose: [choiceIndex: number]
}
