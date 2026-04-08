---
name: Адаптивные плашки StartScene
overview: "Рефакторинг структуры карточек в StartScene для адаптивной высоты по контенту и исправление UI-проблем: позиционирование имени, группировка возраста, контейнеризация кнопок образования, снижение минимального возраста до 14 лет."
todos:
  - id: fix_name_input
    content: "Исправить createNameInput: добавить setOrigin(0.5) для nameValueText и обновить позиционирование в handleResize"
    status: pending
  - id: fix_age_grouping
    content: "Переработать createAgeSelector: сгруппировать возраст и кнопки визуально, обновить handleResize"
    status: pending
  - id: fix_education_card
    content: "Переработать createEducationSelection: кнопки внутрь eduCard, адаптивная высота карточки"
    status: pending
  - id: change_min_age
    content: Изменить минимальный возраст с 18 на 14 лет в adjustAge()
    status: pending
isProject: false
---

## Проблемы

1. **Плашка образования** - кнопки добавляются в `scrollContainer`, а не внутрь `eduCard`, поэтому контент выходит за границы карточки
2. **Имя персонажа** - текст внутри `nameInputBackground` не имеет правильного `origin(0.5)` и не центрируется
3. **Группировка возраста** - элементы (значение и кнопки) визуально не сгруппированы в едином блоке
4. **Минимальный возраст** - ограничение 18 лет не позволяет начать с возраста для школы (14 лет)

## Решение

### Шаг 1: Исправить позиционирование имени (строки 61-87)

В `createNameInput()` текст `nameValueText` должен иметь `setOrigin(0.5)` и позиционироваться по центру контейнера `nameInputBackground`. При ресайзе в `handleResize()` текст остаётся в центре благодаря origin.

### Шаг 2: Добавить группировку возраста (строки 89-118)

Создать внутренний контейнер для группы "возраст + кнопки" внутри `ageCard`. Элементы:
- `ageLabel` (заголовок)
- `ageHint` (подсказка)  
- Контейнер с `ageValue` слева и кнопками справа

### Шаг 3: Исправить плашку образования (строки 120-141)

Кнопки образования должны добавляться внутрь `eduCard`, а не в `scrollContainer`. Высота карточки должна вычисляться динамически на основе количества кнопок.

### Шаг 4: Снизить минимальный возраста до 14 лет (строки 158-164)

В `adjustAge()` изменить условие с `newAge >= 18` на `newAge >= 14`.

## Структура после исправлений

```
scrollContainer
├── nameCard (контейнер)
│   ├── nameLabel
│   └── nameInputBackground (контейнер)
│       ├── nameValueText (origin 0.5)
│       └── hitArea
├── ageCard (контейнер)
│   ├── ageLabel
│   ├── ageHint
│   ├── ageValue
│   ├── decreaseBtn
│   └── increaseBtn
└── eduCard (контейнер)
    ├── eduLabel
    ├── eduHint
    └── [eduButton1, eduButton2, ...] (внутри eduCard!)
```

## Файлы для изменения

- [src/scenes/StartScene.js](src/scenes/StartScene.js) - основной файл с исправлениями