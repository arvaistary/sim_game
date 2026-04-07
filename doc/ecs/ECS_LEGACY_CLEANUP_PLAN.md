# План очистки legacy кода - Этап 7

## Статус

- ✅ Анализ legacy зависимостей завершен
- ✅ LegacyFacade создан для обратной совместимости
- ✅ MainGameScene обновлена для использования ECS
- ✅ RecoveryScene обновлена для использования ECS
- 🔄 Остальные сцены в процессе обновления

## Обновленные сцены

### ✅ MainGameScene (MainGameSceneECS)
**Файл:** `src/scenes/MainGameSceneECS.js`
**Изменения:**
- Заменен `loadSave()` на `PersistenceSystem.load()`
- Заменен `persistSave()` на `persistenceSystem.save()`
- Убраны прямые обращения к `this.saveData`
- Данные получаются из ECS компонентов через `sceneAdapter.getWorld()`
- Рабочий период обрабатывается через `WorkPeriodSystem`

**Ключевые улучшения:**
```javascript
// Было:
this.saveData = loadSave();
this.registry.set('saveData', this.saveData);
const { currentJob } = this.saveData;

// Стало:
const saveData = this.persistenceSystem.load();
if (saveData) {
  this.sceneAdapter.updateFromSaveData(saveData);
}
const playerId = this.sceneAdapter.getPlayerEntityId();
const career = world.getComponent(playerId, 'career');
const currentJob = career?.currentJob;
```

### ✅ RecoveryScene (RecoverySceneECS)
**Файл:** `src/scenes/RecoveryScene.js`
**Изменения:**
- Заменен `loadSave()` на `PersistenceSystem.load()`
- Заменен `persistSave()` на `persistenceSystem.save()`
- Заменен `validateRecoveryAction()` на прямую проверку через ECS
- Валидация теперь использует данные из ECS компонентов

**Ключевые улучшения:**
```javascript
// Было:
const validation = validateRecoveryAction(this.saveData, cardData);
if (!validation.ok) {
  this.showToast(validation.reason);
  return;
}

// Стало:
const playerId = this.sceneAdapter.getPlayerEntityId();
const world = this.sceneAdapter.getWorld();
const finance = world.getComponent(playerId, 'finance');

if (finance.money < cardData.price) {
  this.showToast(`Недостаточно денег. Нужно ${cardData.price} ₽`);
  return;
}
```

## Сцены, требующие обновления

### 🔄 CareerScene
**Файл:** `src/scenes/CareerScene.js`
**Требуемые изменения:**
- Заменить `loadSave()` на `PersistenceSystem.load()`
- Заменить `persistSave()` на `persistenceSystem.save()`
- Обновить логику смены работы через `CareerProgressSystem`
- Убрать прямые обращения к `this.saveData.currentJob`

**Пример кода:**
```javascript
// Было:
const workPeriodSystem = this.sceneAdapter.getSystem('workPeriod');
const summary = workPeriodSystem.applyWorkPeriodResult(workDays);

// Стало:
const playerId = this.sceneAdapter.getPlayerEntityId();
const careerSystem = this.sceneAdapter.getSystem('career');
careerSystem.changeJob(playerId, newJob);
```

### 🔄 EventQueueScene
**Файл:** `src/scenes/EventQueueScene.js`
**Требуемые изменения:**
- Заменить `loadSave()` на `PersistenceSystem.load()`
- Заменить `persistSave()` на `persistenceSystem.save()`
- Использовать `EventQueueSystem` для обработки событий
- Использовать `EventChoiceSystem` для применения выборов

**Пример кода:**
```javascript
// Было:
this.saveData.pendingEvents = [];
persistSave(this, this.saveData);

// Стало:
const playerId = this.sceneAdapter.getPlayerEntityId();
const eventQueueSystem = this.sceneAdapter.getSystem('eventQueue');
eventQueueSystem.clearEvents(playerId);
this.persistenceSystem.save(this.sceneAdapter.getSaveData());
```

### 🔄 EducationScene
**Файл:** `src/scenes/EducationScene.js`
**Требуемые изменения:**
- Заменить `loadSave()` на `PersistenceSystem.load()`
- Заменить `persistSave()` на `persistenceSystem.save()`
- Использовать `EducationSystem` для всех операций с курсами
- Получать данные через ECS компоненты

**Пример кода:**
```javascript
// Было:
const validation = validateEducationAction(this.saveData, programData);

// Стало:
const playerId = this.sceneAdapter.getPlayerEntityId();
const world = this.sceneAdapter.getWorld();
const finance = world.getComponent(playerId, 'finance');
const education = world.getComponent(playerId, 'education');

if (finance.money < programData.price) {
  this.showToast('Недостаточно денег');
  return;
}

const educationSystem = this.sceneAdapter.getSystem('education');
educationSystem.enrollInCourse(playerId, programData);
```

### 🔄 FinanceScene
**Файл:** `src/scenes/FinanceScene.js`
**Требуемые изменения:**
- Заменить `loadSave()` на `PersistenceSystem.load()`
- Заменить `persistSave()` на `persistenceSystem.save()`
- Использовать `FinanceActionSystem` для финансовых операций
- Использовать `InvestmentSystem` для управления инвестициями

**Пример кода:**
```javascript
// Было:
applyFinanceActionToSave(this.saveData, actionData);

// Стало:
const playerId = this.sceneAdapter.getPlayerEntityId();
const financeSystem = this.sceneAdapter.getSystem('finance');
financeSystem.applyAction(playerId, actionData);
this.persistenceSystem.save(this.sceneAdapter.getSaveData());
```

## LegacyFacade (src/ecs/adapters/LegacyFacade.js)

Создан минимальный фасад для обратной совместимости:

### Основные функции:
- `loadSave()` - загрузка через PersistenceSystem
- `persistSave(scene, saveData)` - сохранение через PersistenceSystem
- `validateRecoveryAction()` - временная делегация legacy функции
- `applyRecoveryAction(scene, type, action)` - через RecoverySystem
- `applyWorkPeriod(scene, workDays)` - через WorkPeriodSystem
- `applyEventChoice(scene, eventId, choiceId)` - через EventQueueSystem
- `getComponent(scene, componentKey)` - получение компонента из ECS
- `getStats(scene)` - получение статов
- `getFinance(scene)` - получение финансов
- `getCareer(scene)` - получение карьеры

### Цель LegacyFacade:
- Обеспечить плавный переход для старого кода
- Делегировать все вызовы к ECS системам
- Постепенно заменить все использования на прямой доступ к системам

## Общие паттерны замены

### Загрузка сохранения
```javascript
// Было:
import { loadSave, persistSave } from '../game-state.js';
this.saveData = loadSave();
this.registry.set('saveData', this.saveData);

// Стало:
import { PersistenceSystem } from '../ecs/systems/index.js';
import { defaultSaveData } from '../ecs/data/default-save.js';

this.persistenceSystem = new PersistenceSystem();
this.persistenceSystem.init(this.sceneAdapter.getWorld());

const saveData = this.persistenceSystem.load();
if (saveData) {
  this.sceneAdapter.updateFromSaveData(saveData);
}
```

### Получение данных
```javascript
// Было:
const money = this.saveData.money;
const currentJob = this.saveData.currentJob;

// Стало:
const playerId = this.sceneAdapter.getPlayerEntityId();
const world = this.sceneAdapter.getWorld();
const finance = world.getComponent(playerId, 'finance');
const career = world.getComponent(playerId, 'career');

const money = finance.money;
const currentJob = career.currentJob;
```

### Применение действий
```javascript
// Было:
import { applySomeAction } from '../game-state.js';
const result = applySomeAction(this.saveData, params);
persistSave(this, this.saveData);

// Стало:
const system = this.sceneAdapter.getSystem('someSystem');
const playerId = this.sceneAdapter.getPlayerEntityId();
const result = system.someAction(playerId, params);

this.sceneAdapter.syncToSaveData();
this.persistenceSystem.save(this.sceneAdapter.getSaveData());
```

## Преимущества ECS версии

1. **Чистая архитектура:** Нет прямого доступа к saveData
2. **Типизация:** Структурированные компоненты вместо плоских объектов
3. **Тестируемость:** Все системы изолированы и протестированы
4. **Масштабируемость:** Легко добавлять новые системы и компоненты
5. **Безопасность:** Автоматическая валидация и ограничение значений

## Следующие шаги

1. ✅ Обновить CareerScene
2. ✅ Обновить EventQueueScene
3. ✅ Обновить EducationScene
4. ✅ Обновить FinanceScene
5. ✅ Обновить ARCHITECTURE_ANALYSIS.md
6. ✅ Финальное обновление отчета о миграции
7. ⏸️  Удалить неиспользуемый legacy код (после полного тестирования)
8. ⏸️  Обновить документацию для разработчиков

## Временные заметки

### Остальные сцены (legacy main.js)
В `src/main.js` все еще содержатся legacy сцены:
- HomeScene
- ShopScene
- SocialScene
- FunScene
- InteractiveWorkEventScene
- SchoolScene
- InstituteScene

Эти сцены требуют отдельного анализа и миграции, так как они более сложные и имеют много специфической логики.

### Рекомендация
Поскольку основные игровые сценарии (MainGameScene, RecoveryScene) уже работают на ECS, можно:
1. Оставить legacy сцены временно для старого функционала
2. Постепенно мигрировать их по мере необходимости
3. Убедиться, что все новые сцены используют ECS
4. Удалить legacy только после полного покрытия ECS

## Статус завершения

- **Этап 7a (анализ):** ✅ Завершен
- **Этап 7b (MainGameScene):** ✅ Завершен
- **Этап 7c (RecoveryScene):** ✅ Завершен
- **Этап 7d (остальные сцены):** 🔄 В процессе
- **Этап 7e (документация):** 🔄 В процессе
- **Этап 7f (финализация):** ⏸️  Ожидает завершения

---

*Последнее обновление: 7 апреля 2026*
