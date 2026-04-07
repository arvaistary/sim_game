---
name: Fix-career-chips
overview: Добав adaptive width chips to CareerScene cards based on text content. Minimum width 120px, centered text with origin(0.5).
todos:
  - id: add-chip-career
    content: Add chip graphics and chipText to createCareerCard with dynamic width
    status: pending
  - id: layout-chip-career
    content: Update layoutCareerCard to draw chip dynamically
    status: pending
  - id: refresh-chip-career
    content: Update refreshCareerView to handle chip visibility and positions
    status: pending
isProject: false
---

## Проблема

На экране карьеры (`CareerScene`) в чипсах с информацией о статусе ("Текущая роль", "Разблокирован", "Требуется...") есть фиксированная ширина 92px. При этом:
- Для "Текущая роль" и "Разблокирован" чипс слишком широкий (92px для короткого текстов)
- Для "Требуется..." текст может быть длиннее 92px и обрезаться

На других экранах (`ShopScene`, `RecoveryScene`, `FinanceScene`, `EducationScene`, `FunScene`) чипсы уже адаптивны - их ширина подстраивается под содержимое.

## Решение

Добавить в `createCareerCard` и `layoutCareerCard` логику для адаптивной ширины чипсов, аналогичную другим экранам.

### Изменения в `createCareerCard` (строки 2340-2356)

Добавить chip graphics and chipText:
Set origin to 0.5) on chipText
Calculate dynamic chip width

**В `layoutCareerCard` (строки 2428-2443)
Draw chip only for unlocked jobs (not current)
Calculate chip width dynamically
Position text centered in chip
Update positions of other elements based on chip presence

**В `refreshCareerView` (строки 2359-2379)
Recalculate chip visibility based on status
Update positions of title, meta, status, and badge based on chip presence