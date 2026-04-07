# Анализ архитектуры проекта Game Life

## Текущее состояние проекта

### Структура файлов

```
src/
├── main.js          (3589 строк) — все сцены игры
├── game-state.js    (~1666 строк) — логика состояния, данных, событий
├── ui-kit.js        (293 строки) — базовые UI компоненты
├── debug-panel.js   (~470 строк) — отладочная панель
└── style.css        — стили
```

### Проблемы текущей архитектуры

1. **Монолитный main.js** — 3589 строк в одном файле, содержит 10+ классов сцен
2. **Сильная связанность** — сцены напрямую импортируют функции из game-state.js
3. **Дублирование кода** — похожие паттерны в разных сценах (создание карточек, модалов)
4. **Смешение ответственности** — сцены содержат и UI-логику, и бизнес-логику
5. **Сложность навигации** — трудно найти нужный код среди тысяч строк

---

## Подходы к реорганизации

### Подход 1: Модульная архитектура (Разделение по слоям)

**Суть:** Разделение кода по слоям ответственности — данные, UI, сцены.

**Структура:**

```
src/
├── core/
│   ├── state/
│   │   ├── state-manager.js      # Управление состоянием
│   │   ├── player-state.js       # Состояние игрока
│   │   └── game-events.js        # События игры
│   ├── economy/
│   │   ├── finance.js            # Финансовые операции
│   │   ├── career.js             # Карьерная логика
│   │   └── housing.js            # Жильё
│   └── config/
│       ├── constants.js          # Константы
│       └── game-config.js        # Настройки игры
├── ui/
│   ├── components/
│   │   ├── stat-bar.js           # Шкала статистики
│   │   ├── modal.js              # Модальное окно
│   │   ├── button.js             # Кнопка
│   │   └── panel.js              # Панель
│   └── themes/
│       └── colors.js             # Цветовая схема
├── scenes/
│   ├── main-game.scene.js        # Главная сцена
│   ├── recovery.scene.js         # Сцена восстановления
│   ├── career.scene.js           # Сцена карьеры
│   ├── education.scene.js        # Сцена обучения
│   ├── finance.scene.js          # Сцена финансов
│   └── ...                       # Другие сцены
├── services/
│   ├── save.service.js           # Сохранение/загрузка
│   └── event.service.js          # Обработка событий
└── main.js                       # Точка входа
```

**Плюсы:**
- Чёткое разделение ответственности
- Легко тестировать отдельные модули
- Понятная структура для новых разработчиков
- Возможность переиспользовать логику в разных сценах
- Простая замена компонентов

**Минусы:**
- Может привести к чрезмерной абстракции
- Увеличивает количество файлов
- Требует продумывания интерфейсов между слоями
- Возможны проблемы с циклическими зависимостями

**Когда подходит:**
- Проект будет активно развиваться
- Планируется команда разработчиков
- Нужна высокая тестируемость

---

### Подход 2: Компонентная архитектура (Entity-Component)

**Суть:** Каждый элемент UI и логики — независимый компонент с собственным состоянием.

**Структура:**

```
src/
├── components/
│   ├── player/
│   │   ├── player.component.js      # Компонент игрока
│   │   ├── player-stats.component.js
│   │   └── player-avatar.component.js
│   ├── career/
│   │   ├── career-panel.component.js
│   │   ├── job-card.component.js
│   │   └── salary-display.component.js
│   ├── finance/
│   │   ├── wallet.component.js
│   │   ├── transaction-list.component.js
│   │   └── investment-card.component.js
│   ├── ui/
│   │   ├── button.component.js
│   │   ├── modal.component.js
│   │   ├── stat-bar.component.js
│   │   └── navigation.component.js
│   └── shared/
│       ├── card.component.js
│       └── toast.component.js
├── scenes/
│   ├── base.scene.js                # Базовый класс сцены
│   └── ...                          # Сцены используют компоненты
├── store/
│   ├── index.js                     # Центральное хранилище
│   ├── player.store.js
│   └── game.store.js
└── main.js
```

**Пример компонента:**

```javascript
// components/player-stats.component.js
export class PlayerStatsComponent {
  constructor(scene, x, y, config) {
    this.scene = scene;
    this.container = scene.add.container(x, y);
    this.statBars = [];
    this.init(config);
  }

  init(config) {
    config.stats.forEach((stat, index) => {
      const bar = new StatBarComponent(this.scene, 0, index * 58, stat);
      this.statBars.push(bar);
      this.container.add(bar.container);
    });
  }

  update(stats) {
    this.statBars.forEach(bar => bar.animateTo(stats[bar.key]));
  }

  destroy() {
    this.container.destroy();
  }
}
```

**Плюсы:**
- Высокая переиспользуемость компонентов
- Легко создавать новые комбинации UI
- Компоненты можно тестировать изолированно
- Позволяет создавать сложные интерфейсы из простых частей
- Соответствует современным практикам фронтенд-разработки

**Минусы:**
- Может усложнить простые задачи
- Требует дисциплины в управлении состоянием
- Возможны проблемы с производительностью при большом количестве компонентов
- Кривая обучения для новичков

**Когда подходит:**
- Сложный UI с множеством повторяющихся элементов
- Планируется много разнообразных экранов
- Важна консистентность интерфейса

---

### Подход 3: Feature-Based архитектура (По фичам)

**Суть:** Группировка кода по бизнес-фичам, каждая фича — самодостаточный модуль.

**Структура:**

```
src/
├── features/
│   ├── player/
│   │   ├── index.js                 # Экспорт фичи
│   │   ├── player.scene.js          # Сцена(ы) фичи
│   │   ├── player-state.js          # Состояние
│   │   ├── player-ui.js             # UI компоненты
│   │   └── player-events.js         # События
│   ├── career/
│   │   ├── index.js
│   │   ├── career.scene.js
│   │   ├── career-state.js
│   │   ├── jobs.data.js             # Данные о работах
│   │   └── career-ui.js
│   ├── finance/
│   │   ├── index.js
│   │   ├── finance.scene.js
│   │   ├── finance-state.js
│   │   └── finance-ui.js
│   ├── education/
│   │   ├── index.js
│   │   ├── education.scene.js
│   │   └── education.data.js
│   ├── housing/
│   │   └── ...
│   └── social/
│       └── ...
├── shared/
│   ├── ui/
│   │   ├── button.js
│   │   ├── modal.js
│   │   └── panel.js
│   ├── utils/
│   │   ├── format.js
│   │   └── animations.js
│   └── constants.js
├── core/
│   ├── game.js                      # Инициализация игры
│   ├── state-manager.js             # Глобальное состояние
│   └── router.js                    # Навигация между сценами
└── main.js
```

**Пример фичи:**

```javascript
// features/career/index.js
export { CareerScene } from './career.scene';
export { applyCareerChange, getCareerProgress } from './career-state';
export { CAREER_JOBS, CAREER_TRACKS } from './jobs.data';

// features/career/career.scene.js
import { createCareerPanel, createJobCard } from './career-ui';
import { getCareerProgress } from './career-state';

export class CareerScene extends Phaser.Scene {
  // ...
}
```

**Плюсы:**
- Высокая когезия — связанный код вместе
- Легко добавлять/удалять фичи
- Команды могут работать над разными фичами независимо
- Проще понимать бизнес-логику
- Легко масштабировать проект

**Минусы:**
- Возможное дублирование между фичами
- Сложнее управлять общим состоянием
- Требует чётких границ между фичами
- Может быть избыточным для маленьких проектов

**Когда подходит:**
- Проект с чётко выделенными бизнес-областями
- Параллельная разработка разными разработчиками
- Планируется масштабирование функционала

---

### Подход 4: Scene-Based (Минимальная реорганизация)

**Суть:** Просто вынести каждую сцену в отдельный файл, минимальные изменения архитектуры.

**Структура:**

```
src/
├── scenes/
│   ├── main-game.scene.js           # MainGameScene
│   ├── recovery.scene.js            # RecoveryScene
│   ├── career.scene.js              # CareerScene
│   ├── education.scene.js           # EducationScene
│   ├── finance.scene.js             # FinanceScene
│   ├── shop.scene.js                # ShopScene
│   ├── fun.scene.js                 # FunScene
│   ├── social.scene.js              # SocialScene
│   ├── home.scene.js                # HomeScene
│   └── work-event.scene.js          # WorkEventScene
├── game-state.js                    # Остаётся как есть
├── ui-kit.js                        # Остаётся как есть
└── main.js                          # Только регистрация сцен
```

**Пример main.js:**

```javascript
import Phaser from "phaser";
import "./style.css";
import { MainGameScene } from "./scenes/main-game.scene";
import { RecoveryScene } from "./scenes/recovery.scene";
import { CareerScene } from "./scenes/career.scene";
// ... другие импорты

const config = {
  type: Phaser.AUTO,
  // ... конфигурация
  scene: [
    MainGameScene,
    RecoveryScene,
    CareerScene,
    // ... другие сцены
  ],
};

new Phaser.Game(config);
```

**Плюсы:**
- Минимальные изменения
- Быстрое внедрение
- Легко найти код конкретной сцены
- Низкий риск сломать существующий функционал
- Можно делать постепенно

**Минусы:**
- Не решает проблему связанности
- Дублирование кода между сценами сохраняется
- Нет структурирования бизнес-логики
- Только косметическое улучшение

**Когда подходит:**
- Нужно быстро улучшить организацию кода
- Ограниченное время на рефакторинг
- Проект в стадии активной разработки

---

## Сравнительная таблица

| Критерий | Модульная | Компонентная | Feature-Based | Scene-Based |
|----------|-----------|--------------|---------------|-------------|
| Сложность внедрения | Средняя | Высокая | Средняя | Низкая |
| Улучшение читаемости | Высокое | Высокое | Высокое | Среднее |
| Переиспользование | Среднее | Высокое | Среднее | Низкое |
| Тестируемость | Высокая | Высокая | Высокая | Средняя |
| Масштабируемость | Высокая | Высокая | Очень высокая | Низкая |
| Риск регрессии | Средний | Высокий | Средний | Низкий |
| Время внедрения | 2-3 дня | 3-5 дней | 2-4 дня | 1 день |

---

## Рекомендация для проекта Game Life

### Предлагаемый гибридный подход

С учётом текущего состояния проекта и его назначения (игра-симулятор), рекомендую **гибрид Feature-Based + Scene-Based**:

```
src/
├── features/
│   ├── player/
│   │   ├── player-stats.js          # Логика статистики
│   │   └── player-ui.js             # UI для игрока
│   ├── career/
│   │   ├── career-data.js           # Данные о работах
│   │   └── career-logic.js          # Логика карьеры
│   ├── finance/
│   │   ├── finance-logic.js
│   │   └── finance-data.js
│   ├── education/
│   │   └── education-data.js
│   └── housing/
│       └── housing-data.js
├── scenes/
│   ├── main-game.scene.js
│   ├── recovery.scene.js
│   ├── career.scene.js
│   ├── education.scene.js
│   ├── finance.scene.js
│   ├── shop.scene.js
│   ├── fun.scene.js
│   ├── social.scene.js
│   ├── home.scene.js
│   └── work-event.scene.js
├── shared/
│   ├── ui/
│   │   ├── stat-bar.js              # Класс StatBar
│   │   ├── modal.js                 # Модальные окна
│   │   ├── button.js                # Кнопки
│   │   └── panel.js                 # Панели
│   ├── constants.js                 # STAT_DEFS, NAV_ITEMS, etc.
│   └── utils.js                     # Вспомогательные функции
├── core/
│   ├── state.js                     # Управление состоянием (loadSave, persistSave)
│   ├── events.js                    # События (WORK_RANDOM_EVENTS, etc.)
│   └── game-config.js               # Конфигурация Phaser
├── ui-kit.js                        # Базовые UI примитивы (как сейчас)
└── main.js                          # Точка входа
```

### План миграции

1. **Этап 1 (1 день):** Вынести сцены в отдельные файлы (Scene-Based)
2. **Этап 2 (1 день):** Вынести данные в feature-модули
3. **Этап 3 (1 день):** Вынести UI компоненты в shared/ui
4. **Этап 4 (1 день):** Рефакторинг game-state.js на модули

### Преимущества выбранного подхода

- Позволяет начать с минимальных изменений
- Постепенное улучшение без остановки разработки
- Чёткая структура для будущих фич
- Легко найти нужный код
- Возможность работать параллельно над разными частями

---

## Итоговые рекомендации

1. **Начать с Scene-Based** — вынести сцены из main.js
2. **Постепенно внедрять Feature-Based** — группировать логику по фичам
3. **Создать shared/ui** — переиспользуемые UI компоненты
4. **Оставить ui-kit.js** — как базовый слой для примитивов

Это даст баланс между скоростью внедрения и долгосрочной поддерживаемостью кода.
