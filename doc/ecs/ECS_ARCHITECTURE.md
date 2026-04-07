# ECS Архитектура проекта Game Life

## Обзор

ECS (Entity-Component-System) архитектура обеспечивает чистое разделение данных (Components), логики (Systems) и идентификаторов (Entities).

## Основные компоненты

### 1. ECS World (`src/ecs/world.js`)

Центральный контейнер для управления сущностями, компонентами и системами.

**Основные методы:**

- `createEntity()` - создать новую сущность
- `destroyEntity(entityId)` - удалить сущность
- `addComponent(entityId, componentKey, data)` - добавить компонент
- `getComponent(entityId, componentKey)` - получить компонент
- `updateComponent(entityId, componentKey, updates)` - обновить компонент
- `removeComponent(entityId, componentKey)` - удалить компонент
- `queryEntities(...componentKeys)` - найти сущности с компонентами
- `addSystem(system)` - добавить систему
- `update(deltaTime)` - обновить все системы
- `toJSON()` / `fromJSON(data)` - сериализация/десериализация

### 2. Components (`src/ecs/components/index.js`)

Константы для имен компонентов:

```javascript
PLAYER_ENTITY = 'player' - идентификатор сущности игрока

// Основные компоненты
TIME_COMPONENT = 'time'
STATS_COMPONENT = 'stats'
SKILLS_COMPONENT = 'skills'
WORK_COMPONENT = 'work'
RECOVERY_COMPONENT = 'recovery'
WALLET_COMPONENT = 'wallet'
CAREER_COMPONENT = 'career'

// Дополнительные компоненты
EDUCATION_COMPONENT = 'education'
HOUSING_COMPONENT = 'housing'
FURNITURE_COMPONENT = 'furniture'
FINANCE_COMPONENT = 'finance'
INVESTMENT_COMPONENT = 'investment'
EVENT_QUEUE_COMPONENT = 'event_queue'
EVENT_HISTORY_COMPONENT = 'event_history'
LIFETIME_STATS_COMPONENT = 'lifetime_stats'
RELATIONSHIPS_COMPONENT = 'relationships'
```

### 3. Systems (`src/ecs/systems/`)

#### TimeSystem

Управляет временем и генерирует события по расписанию.

**Методы:**

- `advanceTime(days)` - продвинуть время
- `onWeeklyEvent(callback)` - подписаться на недельные события
- `onMonthlyEvent(callback)` - подписаться на месячные события
- `onAgeEvent(callback)` - подписаться на события по возрасту

#### StatsSystem

Управляет статистикой игрока.

**Методы:**

- `applyStatChanges(statChanges)` - применить изменения
- `getStats()` - получить текущую статистику
- `summarizeStatChanges(statChanges)` - создать строку с описанием изменений
- `mergeStatChanges(...chunks)` - объединить несколько наборов изменений

#### SkillsSystem

Управляет навыками игрока.

**Методы:**

- `applySkillChanges(skillChanges)` - применить изменения
- `getSkills()` - получить текущие навыки
- `hasSkillLevel(skillKey, requiredLevel)` - проверить уровень навыка
- `getSkillLevel(skillKey)` - получить уровень навыка

#### WorkPeriodSystem

Обрабатывает рабочие периоды (несколько дней).

**Методы:**

- `applyWorkPeriodResult(workDays, eventChoice)` - применить результат рабочего периода

#### RecoverySystem

Обрабатывает действия восстановления (магазин, развлечения, дом и т.д.).

**Методы:**

- `applyRecoveryAction(cardData)` - применить действие восстановления

#### PersistenceSystem

Управляет сохранением и загрузкой игры.

**Методы:**

- `loadSave()` - загрузить сохранение
- `saveGame(saveData)` - сохранить игру
- `clearSave()` - удалить сохранение
- `hasSave()` - проверить наличие сохранения

### 4. Adapters (`src/ecs/adapters/`)

#### GameStateAdapter

Обеспечивает совместимость между ECS миром и существующим форматом saveData.

**Методы:**

- `initializeFromSaveData()` - инициализировать ECS компоненты из saveData
- `syncToSaveData()` - синхронизировать изменения в saveData
- `getSaveData()` - получить текущий saveData
- `setSaveData(newSaveData)` - обновить saveData

#### SceneAdapter

Базовый класс для адаптации Phaser сцен к ECS.

**Методы:**

- `initialize()` - инициализировать ECS мир
- `addSystems()` - добавить системы в мир
- `update(deltaTime)` - обновить ECS мир
- `syncToSaveData()` - синхронизировать изменения в saveData
- `getSaveData()` - получить текущий saveData
- `getSystem(systemName)` - получить систему по имени
- `getWorld()` - получить ECS мир
- `destroy()` - уничтожить адаптер

### 5. Data (`src/ecs/data/`)

Конфигурационные данные:

- `default-save.js` - дефолтное сохранение
- `career-jobs.js` - список работ
- `housing-levels.js` - уровни жилья

## Пример использования

### Создание ECS мира

```javascript
import { ECSWorld } from './ecs/world.js';
import { TimeSystem, StatsSystem } from './ecs/systems/index.js';
import { TIME_COMPONENT, STATS_COMPONENT, PLAYER_ENTITY } from './ecs/components/index.js';

// Создаём мир
const world = new ECSWorld();

// Создаём сущность игрока
const playerId = PLAYER_ENTITY;
world.createEntity(playerId);

// Добавляем компоненты
world.addComponent(playerId, TIME_COMPONENT, {
  gameDays: 0,
  gameWeeks: 1,
  gameMonths: 1,
  gameYears: 0,
  currentAge: 23,
  startAge: 23,
});

world.addComponent(playerId, STATS_COMPONENT, {
  hunger: 50,
  energy: 50,
  stress: 30,
  mood: 70,
  health: 80,
  physical: 60,
});

// Добавляем системы
const timeSystem = new TimeSystem();
world.addSystem(timeSystem);

const statsSystem = new StatsSystem();
world.addSystem(statsSystem);

// Обновляем мир
world.update(16); // deltaTime в мс

// Применяем изменения через систему
statsSystem.applyStatChanges({
  energy: -10,
  stress: 5,
  mood: -5,
});

// Получаем данные
const stats = world.getComponent(playerId, STATS_COMPONENT);
console.log(stats.energy); // 40
```

### Использование SceneAdapter в Phaser сцене

```javascript
import { SceneAdapter } from './ecs/adapters/SceneAdapter.js';

export class MainGameScene extends Phaser.Scene {
  constructor() {
    super('MainGameScene');
  }

  create() {
    // Создаём адаптер
    this.sceneAdapter = new SceneAdapter(this, this.saveData);
    this.sceneAdapter.initialize();

    // Получаем системы
    const timeSystem = this.sceneAdapter.getSystem('time');
    const statsSystem = this.sceneAdapter.getSystem('stats');

    // Продвигаем время
    timeSystem.advanceTime(5);

    // Применяем изменения
    statsSystem.applyStatChanges({
      energy: -20,
      stress: 10,
    });

    // Синхронизируем с saveData
    this.sceneAdapter.syncToSaveData();
  }

  update(time, delta) {
    // Обновляем ECS мир
    this.sceneAdapter.update(delta);
  }
}
```

## Порядок инициализации

1. Создать `SceneAdapter` с `saveData`
2. Вызвать `initialize()` для создания ECS мира и инициализации компонентов
3. Получить необходимые системы через `getSystem()`
4. Использовать системы для изменения состояния
5. Вызывать `update(delta)` в каждом кадре
6. Синхронизировать изменения через `syncToSaveData()`

## Преимущества ECS архитектуры

1. **Чистое разделение ответственности:** Компоненты - только данные, системы - только логика
2. **Переиспользуемость:** Системы могут работать с любыми сущностями с нужными компонентами
3. **Тестируемость:** Системы легко тестируются изолированно
4. **Гибкость:** Легко добавлять новые компоненты и системы без изменения существующего кода
5. **Производительность:** Системы могут быть оптимизированы для работы с конкретными запросами

## Миграция с game-state на ECS

### Этап 1 (P0) - Core Loop

Перенести основные системы для MainGameScene и RecoveryScene:

- TimeSystem
- StatsSystem
- SkillsSystem
- WorkPeriodSystem
- RecoverySystem

### Этап 2 (P1) - Domain Logic

Перенести дополнительные системы:

- CareerProgressSystem
- FinanceActionSystem
- InvestmentSystem
- MonthlySettlementSystem
- EducationSystem
- EventGeneratorSystem

### Этап 3 (P2) - Events

Перенести системы событий:

- EventQueueSystem
- EventChoiceSystem
- EventHistorySystem

## Совместимость

Во время миграции `GameStateAdapter` обеспечивает двустороннюю синхронизацию между ECS миром и существующим `saveData`. Это позволяет:

- Загружать старые сохранения
- Использовать существующие функции из `game-state.js`
- Постепенно переносить логику в ECS системы
- Сохранять в том же формате без потери данных
