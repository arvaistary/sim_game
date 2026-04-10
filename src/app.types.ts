export type AppMenuActionId = 'save' | 'load' | 'newGame'

export interface AppMenuActionItem {
  id: AppMenuActionId
  title: string
  description: string
  disabled: boolean
}
