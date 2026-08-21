import type { ActionImageCategory, GetActionImageUrlData } from './action-images.types'

const ACTION_IMAGE_BASE_PATH: string = '/image/actions'

/**
 * @description [Constants] - проверяет, что строка — категория с иллюстрациями в `public/image/actions/`.
 * @return { boolean } type guard для ActionImageCategory.
 */
export function isActionImageCategory(value: string): value is ActionImageCategory {
  return value === 'fun' || value === 'hobby' || value === 'health' || value === 'social'
}

/**
 * @description [Constants] - путь к иллюстрации действия для ActionDetailsModal.
 * @return { string | undefined } URL PNG или undefined, если категория не поддерживается.
 */
export function getActionImageUrl(data: GetActionImageUrlData): string | undefined {
  if (!isActionImageCategory(data.category)) return undefined

  const filename: string = `${data.actionId.replace(/_/g, '-')}.png`

  return `${ACTION_IMAGE_BASE_PATH}/${filename}`
}
