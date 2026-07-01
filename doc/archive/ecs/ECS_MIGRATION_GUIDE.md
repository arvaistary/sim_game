# Руководство по миграции на ECS архитектуру

## Статус миграции

### Выполнено ✅
1. **Карта домена** (`doc/ECS_DOMAIN_MAP.md`) - полное соответствие функций game-state с ECS системами и компонентами
2. **ECS ядро** (`src/ecs/`) - реализация World, Components, Systems, Adapters
3. **SceneAdapter** (`src/ecs/adapters/SceneAdapter.js`) - интеграция Phaser сцен с ECS
4. **GameStateAdapter** (`src/ecs/adapters/GameStateAdapter.js`) - совместимость с существующим форматом saveData
5. **Основные системы P0**:
   - TimeSystem - управление временем
   - StatsSystem - статистика
   - SkillsSystem - навыки
   - WorkPeriodSystem - рабочие периоды
   - RecoverySystem - восстановление
   - PersistenceSystem - сохранение/загрузка
6. **Пример интеграции** (`src/main-ecs.js`) - MainGameScene с ECS
7. **RecoveryScene с ECS** (`src/scenes/RecoveryScene.js`) - сцена восстановления с ECS

### В процессе ⏳
- Разделение main.js на отдельные файлы сцен
- Перенос доменной логики срезами в systems с fallback через adapter

### Ожидается 📋
- Версионирование сохранений и миграции
- Smoke и unit-тесты для проверки паритета
- Удаление legacy зависимостей сцен от game-state

---

## Структура ECS ядра

```
src/ecs/
├── world.js                          # ECS World контейнер
├── components/
│   └── index.js                      # Константы имен компонентов
├── systems/
│   ├── index.js                      # Экспорт систем
│   ├── TimeSystem.js                 # Управление временем
│   ├── StatsSystem.js                # Статистика
│   ├── SkillsSystem.js               # Навыки
│   ├── WorkPeriodSystem.js           # Рабочие периоды
│   ├── RecoverySystem.js             # Восстановление
│   └── PersistenceSystem.js          # Сохранение/загрузка
├── adapters/
│   ├── SceneAdapter.js               # Адаптер Phaser сцен
│   └── GameStateAdapter.js           # Адаптер для saveData
└── index.js                          # Главный экспорт (если используется)

src/balance/                          # Данные баланса (отдельно от ecs/)
├── default-save.js                   # Демо-сейв для ECS и тестов
├── career-jobs.js                    # Список работ
├── housing-levels.js               # Уровни жилья
├── skills-constants.js
├── education-programs.js
├── monthly-expenses-defaults.js
└── index.js
```

---

## Быстрый старт с ECS

### 1. Создание сцены с SceneAdapter

```javascript
import { SceneAdapter } from './ecs/adapters/SceneAdapter.js';

export class MyScene extends Phaser.Scene {
  create() {
    // Загружаем сохранение
    this.saveData = loadSave();
    
    // Создаём адаптер
    this.sceneAdapter = new SceneAdapter(this, this.saveData);
    this.sceneAdapter.initialize();
    
    // Получаем системы
    const statsSystem = this.sceneAdapter.getSystem('stats');
    const timeSystem = this.sceneAdapter.getSystem('time');
    
    // Используем системы
    statsSystem.applyStatChanges({
      energy: -10,
      stress: 5,
    });
    
    timeSystem.advanceTime(1);
    
    // Синхронизируем изменения
    this.sceneAdapter.syncToSaveData();
    persistSave(this, this.saveData);
  }
}
```

### 2. Использование систем напрямую

```javascript
// Получаем систему
const statsSystem = this.sceneAdapter.getSystem('stats');

// Применяем изменения
statsSystem.applyStatChanges({
  energy: -20,
  stress: 10,
  mood: -5,
});

// Получаем текущую статистику
const stats = statsSystem.getStats();
console.log(stats.energy); // 30
```

---

## Feature Slices для поэтапного переноса

### Срез A: Work Period + Stat Changes + Time (P0) ✅
**Выполнено:**
- TimeSystem
- StatsSystem
- WorkPeriodSystem

**Следующие шаги:**
- Интегрировать WorkPeriodSystem во все рабочие сцены
- Заменить прямые вызовы `applyWorkPeriodResult` на `workPeriodSystem.applyWorkPeriodResult`

### Срез B: Recovery Actions + Validation (P0) ✅
**Выполнено:**
- RecoverySystem
- RecoveryScene с ECS

**Следующие шаги:**
- Интегрировать RecoverySystem во все категории восстановления
- Заменить прямые вызовы `applyRecoveryActionToSave` на `recoverySystem.applyRecoveryAction`

### Срез C: Career Progression (P0) ✅ (частично)
**Выполнено:**
- CareerComponent
- Базовая логика в WorkPeriodSystem

**Следующие шаги:**
- Создать CareerProgressSystem
- Интегрировать в CareerScene
- Заменить `getCareerTrack` и `syncCareerProgress` на вызовы системы

### Срез D: Finance Settlements/Investments (P1)
**Планируется:**
- FinanceActionSystem
- InvestmentSystem
- MonthlySettlementSystem
- Интеграция в FinanceScene

---

## Проверка паритета поведения

### Тестовый сценарий: Core Loop
1. Запустить игру → проверить начальную статистику
2. Пойти на работу на 5 дней → проверить зарплату и статы
3. Перейти в восстановление → купить еду → проверить восстановление голода
4. Сохранить игру → обновить страницу → загрузить сохранение
5. Проверить все значения совпадают

### Smoke тест (ручной)
```javascript
// В консоли браузера
const scene = game.scene.getScene('MainGameScene');
const saveData = scene.saveData;
console.log('Старт:', saveData.stats);

// Имитация работы через ECS
const workSystem = scene.sceneAdapter.getSystem('workPeriod');
const summary = workSystem.applyWorkPeriodResult(5);
console.log('Результат:', summary);
console.log('Финиш:', scene.saveData.stats);
```

---

## Обратная совместимость

### GameStateAdapter
Обеспечивает двустороннюю синхронизацию между ECS миром и существующим форматом saveData:

```javascript
// Инициализация из saveData
const adapter = new GameStateAdapter(world, saveData);
adapter.initializeFromSaveData();

// Изменения через ECS
const statsSystem = world.getSystem(StatsSystem);
statsSystem.applyStatChanges({ energy: -10 });

// Синхронизация обратно в saveData
adapter.syncToSaveData();
// saveData теперь содержит актуальные данные
```

### Плавная миграция
1. Создаём SceneAdapter для сцены
2. Получаем нужные системы
3. Заменяем прямые вызовы функций game-state на вызовы систем
4. Синхронизируем изменения через `sceneAdapter.syncToSaveData()`
5. Тестируем и проверяем паритет поведения
6. Повторяем для следующей сцены

---

## Документация

- **Карта домена**: `doc/ECS_DOMAIN_MAP.md` - полное соответствие функций game-state с ECS
- **Архитектура ECS**: `doc/ECS_ARCHITECTURE.md` - описание компонентов, систем, адаптеров
- **Руководство**: этот файл - инструкция по миграции

---

## Частые вопросы

### Q: Нужно ли переписывать весь код сразу?
A: Нет, миграция поэтапная. Можно работать с одной сценой за раз, постепенно перенося логику в ECS системы.

### Q: Что делать с существующими функциями из game-state.js?
A: Они остаются как fallback во время миграции. После полного переноса можно удалить legacy-код.

### Q: Как тестировать изменения?
A: Сравнивайте поведение старой и новой реализации на одних и тех же входных данных. Используйте smoke тесты для проверки core loop.

### Q: Можно ли смешивать старый и новый подходы?
A: Да, в течение миграции вы можете использовать как старые функции из game-state.js, так и новые ECS системы. SceneAdapter обеспечит синхронизацию.

---

## Следующие шаги

1. ✅ Создать карту домена
2. ✅ Реализовать ECS ядро
3. ✅ Создать SceneAdapter и GameStateAdapter
4. ✅ Реализовать основные системы P0
5. ⏳ Разделить main.js на отдельные файлы сцен
6. 📋 Перенести логику срезами в systems
7. 📋 Внедрить версионирование сохранений
8. 📋 Добавить smoke и unit-тесты
9. 📋 Удалить legacy зависимости

---

## Поддержка

При возникновении вопросов или проблем:
1. Проверьте `doc/ECS_ARCHITECTURE.md` - там описаны все системы и компоненты
2. Посмотрите примеры в `src/main-ecs.js` и `src/scenes/RecoveryScene.js`
3. Используйте карту домена `doc/ECS_DOMAIN_MAP.md` для поиска нужной системы
