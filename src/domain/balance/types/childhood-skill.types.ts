export interface ChildhoodSkillDef {
  key: string
  label: string
  bestAgeStart: number
  bestAgeEnd: number
  maxPotential: 1.0
  adultBenefit: string
}

export interface ChildhoodSkillsComponent {
  caps: Record<string, number>
  touchedInWindow: Record<string, boolean>
  firstTouchAge: Record<string, number | null>
}