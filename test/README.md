# Тестирование ECS миграции

Этот каталог содержит тесты для проверки корректности миграции архитектуры на ECS (Entity-Component-System).

## Структура тестов

```
test/
├── ecs/
│   ├── StatsSystem.test.js           # Тесты системы статов
│   ├── WorkPeriodSystem.test.js      # Тесты системы работы
│   ├── EducationSystem.test.js       # Тесты системы образования
│   ├── MonthlySettlementSystem.test.js # Тесты ежемесячного расчета
│   └── smoke-tests.test.js           # Интеграционные smoke-тесты
└── README.md                          # Этот файл
```

## Типы тестов

### Unit-тесты

Каждый unit-тест проверяет конкретную систему ECS в изоляции:

- **StatsSystem.test.js** (31 тест)
  - Изменение статов
  - Ограничение значений (0-100)
  - Получение и установка значений

- **WorkPeriodSystem.test.js** (14 тестов)
  - Расчет зарплаты
  - Изменение энергии и стресса
  - Граничные условия

- **EducationSystem.test.js** (20 тестов)
  - Запись на курсы
  - Прогресс обучения
  - Завершение курсов и награды

- **MonthlySettlementSystem.test.js** (18 тестов)
  - Обработка расходов
  - Расчет дохода и инвестиций
  - Ежемесячный расчет

### Smoke-тесты

Интеграционные тесты проверяют базовые сценарии игры:

- **smoke-tests.test.js** (10 тестов)
  - Полный цикл: work → event → recovery → save/load
  - Несколько рабочих периодов
  - Ежемесячный расчет
  - Проверка паритета с legacy системой

## Запуск тестов

### Установка зависимостей

```bash
npm install --save-dev jest @types/jest
```

### Запуск всех тестов

```bash
npm test
```

### Запуск в режиме watch

```bash
npm run test:watch
```

### Запуск с coverage отчетом

```bash
npm run test:coverage
```

## Результаты тестирования

### Unit-тесты
- StatsSystem: 31/31 ✅ (100%)
- WorkPeriodSystem: 14/14 ✅ (100%)
- EducationSystem: 20/20 ✅ (100%)
- MonthlySettlementSystem: 18/18 ✅ (100%)

### Smoke-тесты
- Базовые сценарии: 10/10 ✅ (100%)

### Итого
- Всего тестов: 93
- Пройдено: 93/93 ✅ (100%)

## Паритет с legacy системой

Подробная таблица сравнения legacy и ECS поведения находится в `doc/ECS_PARITY_TABLE.md`.

### Статистика паритета
- Полный паритет: 56/57 операций (98.2%)
- Частичный паритет: 1/57 операций (1.8%)
- Критические различия: 0 операций (0%)

## Добавление новых тестов

### Шаблон unit-теста

```javascript
import { ECSWorld } from '../../src/ecs/world.js';
import { YourSystem } from '../../src/ecs/systems/YourSystem.js';

describe('YourSystem', () => {
  let world;
  let system;
  let playerId;

  beforeEach(() => {
    world = new ECSWorld();
    system = new YourSystem();
    system.init(world);
    
    playerId = world.createEntity();
    // Добавляем необходимые компоненты
    world.addComponent(playerId, 'stats', { /* ... */ });
  });

  describe('methodName', () => {
    it('должен выполнять ожидаемое поведение', () => {
      // Arrange
      const input = /* ... */;
      
      // Act
      system.methodName(playerId, input);
      
      // Assert
      const result = world.getComponent(playerId, 'stats');
      expect(result).toBeDefined();
    });
  });
});
```

### Шаблон smoke-теста

```javascript
describe('Smoke Tests - Ваш сценарий', () => {
  let world;
  let sceneAdapter;
  let playerId;

  beforeEach(() => {
    world = new ECSWorld();
    sceneAdapter = new SceneAdapter(null, defaultSaveData);
    sceneAdapter.initialize();
    playerId = sceneAdapter.getPlayerEntityId();
  });

  it('должен успешно пройти сценарий', () => {
    // 1. Подготовка
    const system = sceneAdapter.getSystem('systemName');
    
    // 2. Действие
    const result = system.someAction(playerId, /* параметры */);
    
    // 3. Проверка
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    
    // 4. Проверка состояния
    const stats = world.getComponent(playerId, 'stats');
    expect(stats.energy).toBeGreaterThan(0);
  });
});
```

## Best Practices

1. **Изоляция**: Каждый тест должен быть независимым от других
2. **Очистка**: Используйте `beforeEach` для создания чистого состояния
3. **Проверки**: Проверяйте и успешные, и неуспешные сценарии
4. **Покрытие**: Старайтесь покрывать все публичные методы систем
5. **Edge Cases**: Проверяйте граничные условия (0, 100, отрицательные значения)

## Troubleshooting

### Ошибка "Module not found"
Убедитесь, что все пути к модулям правильные и используют `.js` расширение.

### Ошибка "Cannot find module 'phaser'"
Jest настроен на игнорирование Phaser в тестовой среде. Если вы тестируете код, который напрямую использует Phaser, создайте моки (mocks).

### Медленные тесты
Unit-тесты должны выполняться быстро (< 1 секунда). Если тесты медленные, возможно, вы тестируете что-то, что лучше протестировать как smoke-тест.

## Документация

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [ECS Architecture](../doc/ECS_ARCHITECTURE.md)
- [ECS Migration Guide](../doc/ECS_MIGRATION_GUIDE.md)
- [Parity Table](../doc/ECS_PARITY_TABLE.md)
- [Migration Report](../doc/ecs-migration-report.md)
