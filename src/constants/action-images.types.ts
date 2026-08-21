/** Категории действий, для которых в `public/image/actions/` есть полный набор иллюстраций. */
export type ActionImageCategory = 'fun' | 'hobby' | 'health' | 'social'

export interface GetActionImageUrlData {
  actionId: string
  category: string
}
