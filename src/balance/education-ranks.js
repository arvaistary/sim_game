/** Соответствие уровня образования (лейбл) и числового ранга для требований работ. */
export const EDUCATION_LEVEL_TO_RANK = {
  Нет: -1,
  Среднее: 0,
  Высшее: 1,
  MBA: 2,
};

export const EDUCATION_RANK_TO_LABEL = {
  [-1]: 'Нет',
  0: 'Среднее',
  1: 'Высшее',
  2: 'MBA',
};

export function getEducationRank(level) {
  return EDUCATION_LEVEL_TO_RANK[level] ?? -1;
}

export function getEducationLabelByRank(rank) {
  return EDUCATION_RANK_TO_LABEL[rank] ?? 'Нет';
}
