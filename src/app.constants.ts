import type { AppMenuActionItem } from '@shared/types'
export const MENU_ITEMS: AppMenuActionItem[] = [
  {
    id: 'save',
    title: 'Сохранить',
    description: 'Скоро появится',
    disabled: true,
  },
  {
    id: 'load',
    title: 'Загрузить',
    description: 'Скоро появится',
    disabled: true,
  },
  {
    id: 'newGame',
    title: 'Новая игра',
    description: 'Сбросить текущее прохождение и вернуться на старт',
    disabled: false,
  },
]
