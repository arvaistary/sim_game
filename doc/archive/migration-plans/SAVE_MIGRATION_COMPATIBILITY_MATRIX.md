# Save Migration Compatibility Matrix

## Обзор

Документ описывает версии save-формата, стратегии миграций и совместимость между версиями.

---

## Версии Save-формата

### v1.0.0 (Initial)
- **Дата**: 2024-01-01
- **Описание**: Первая версия save-формата
- **Ключевые поля**:
  - `gameDays` - количество игровых дней (legacy)
  - `money` - количество денег
  - `stats` - характеристики персонажа
  - `skills` - навыки
  - `currentJob` - текущая работа (legacy)

### v1.1.0 (Time System Refactor)
- **Дата**: 2024-04-17
- **Описание**: Введение часовой модели времени
- **Изменения**:
  - Добавлено `totalHours` - общее количество часов
  - Добавлено `hourOfDay` - час текущих суток (0-23)
  - Добавлено `dayOfWeek` - день недели (1-7)
  - Добавлено `dayHoursRemaining` - остаток часов в сутках
  - Добавлено `weekHoursRemaining` - остаток часов в неделе
  - Добавлено `sleepHoursToday` - часов сна сегодня
  - Добавлено `sleepDebt` - долг сна
  - Добавлено `eventState` - состояние событий (cooldowns, last events)
- **Миграция**: Автоматическая конвертация `gameDays` → `totalHours` (×24)
- **Обратная совместимость**: Да, через миграцию

### v1.2.0 (Work Component Split)
- **Дата**: 2024-04-17
- **Описание**: Разделение работы на отдельный компонент
- **Изменения**:
  - Добавлен `work` компонент с полями:
    - `id` - ID работы
    - `name` - название
    - `schedule` - график (5/2, 2/2)
    - `employed` - статус трудоустройства
    - `level` - уровень
    - `salaryPerHour` - почасовая зарплата
    - `salaryPerDay` - дневная зарплата (legacy)
    - `salaryPerWeek` - недельная зарплата
    - `requiredHoursPerWeek` - требуемые часы в неделю
    - `workedHoursCurrentWeek` - отработанные часов этой неделе
    - `pendingSalaryWeek` - ожидаемая зарплата за неделю
    - `totalWorkedHours` - всего отработанных часов
    - `daysAtWork` - дней на работе
  - `career.currentJob` сохранён как readonly snapshot
- **Миграция**: Копирование данных из `career.currentJob` в `work`
- **Обратная совместимость**: Да, через миграцию

### v1.3.0 (Period Hooks Integration)
- **Дата**: 2024-04-17
- **Описание**: Интеграция периодических callbacks
- **Изменения**:
  - Добавлено `eventState.lastWeeklyEventWeek` - последняя неделя с weekly event
  - Добавлено `eventState.lastMonthlyEventMonth` - последний месяц с monthly event
  - Добавлено `eventState.lastYearlyEventYear` - последний год с yearly event
- **Миграция**: Инициализация значений на основе текущего времени
- **Обратная совместимость**: Да, через миграцию

### v1.4.0 (Action Availability Cache)
- **Дата**: 2024-04-17
- **Описание**: Добавление кэша доступности действий
- **Изменения**:
  - Нет изменений в save-формате (кэш runtime-only)
- **Миграция**: Не требуется
- **Обратная совместимость**: Полная

### v1.5.0 (Strict Period Processing)
- **Дата**: 2024-04-17
- **Описание**: Строгий режим обработки периодов
- **Изменения**:
  - Нет изменений в save-формате (runtime-only)
- **Миграция**: Не требуется
- **Обратная совместимость**: Полная

### v1.6.0 (Deterministic Replay)
- **Дата**: 2024-04-17
- **Описание**: Детерминированный replay для отладки
- **Изменения**:
  - Нет изменений в save-формате (replay runtime-only)
- **Миграция**: Не требуется
- **Обратная совместимость**: Полная

---

## Матрица совместимости

| Исходная версия | Целевая версия | Совместимость | Требует миграции | Потеря данных |
|-----------------|-----------------|---------------|------------------|---------------|
| v1.0.0 | v1.0.0 | ✅ Полная | ❌ Нет | ❌ Нет |
| v1.0.0 | v1.1.0 | ✅ Полная | ✅ Да | ❌ Нет |
| v1.0.0 | v1.2.0 | ✅ Полная | ✅ Да | ❌ Нет |
| v1.0.0 | v1.3.0 | ✅ Полная | ✅ Да | ❌ Нет |
| v1.0.0 | v1.4.0 | ✅ Полная | ✅ Да | ❌ Нет |
| v1.0.0 | v1.5.0 | ✅ Полная | ✅ Да | ❌ Нет |
| v1.0.0 | v1.6.0 | ✅ Полная | ✅ Да | ❌ Нет |
| v1.1.0 | v1.1.0 | ✅ Полная | ❌ Нет | ❌ Нет |
| v1.1.0 | v1.2.0 | ✅ Полная | ✅ Да | ❌ Нет |
| v1.1.0 | v1.3.0 | ✅ Полная | ✅ Да | ❌ Нет |
| v1.1.0 | v1.4.0 | ✅ Полная | ✅ Да | ❌ Нет |
| v1.1.0 | v1.5.0 | ✅ Полная | ✅ Да | ❌ Нет |
| v1.1.0 | v1.6.0 | ✅ Полная | ✅ Да | ❌ Нет |
| v1.2.0 | v1.2.0 | ✅ Полная | ❌ Нет | ❌ Нет |
| v1.2.0 | v1.3.0 | ✅ Полная | ✅ Да | ❌ Нет |
| v1.2.0 | v1.4.0 | ✅ Полная | ✅ Да | ❌ Нет |
| v1.2.0 | v1.5.0 | ✅ Полная | ✅ Да | ❌ Нет |
| v1.2.0 | v1.6.0 | ✅ Полная | ✅ Да | ❌ Нет |
| v1.3.0 | v1.3.0 | ✅ Полная | ❌ Нет | ❌ Нет |
| v1.3.0 | v1.4.0 | ✅ Полная | ❌ Нет | ❌ Нет |
| v1.3.0 | v1.5.0 | ✅ Полная | ❌ Нет | ❌ Нет |
| v1.3.0 | v1.6.0 | ✅ Полная | ❌ Нет | ❌ Нет |
| v1.4.0 | v1.4.0 | ✅ Полная | ❌ Нет | ❌ Нет |
| v1.4.0 | v1.5.0 | ✅ Полная | ❌ Нет | ❌ Нет |
| v1.4.0 | v1.6.0 | ✅ Полная | ❌ Нет | ❌ Нет |
| v1.5.0 | v1.5.0 | ✅ Полная | ❌ Нет | ❌ Нет |
| v1.5.0 | v1.6.0 | ✅ Полная | ❌ Нет | ❌ Нет |
| v1.6.0 | v1.6.0 | ✅ Полная | ❌ Нет | ❌ Нет |

---

## Стратегии миграции

### Миграция v1.0.0 → v1.1.0 (Time System)

```typescript
function migrate_v1_0_0_to_v1_1_0(save: any): any {
  // Конвертируем gameDays в totalHours
  if (save.time && typeof save.time.gameDays === 'number') {
    save.time.totalHours = save.time.gameDays * 24
  }
  
  // Инициализируем новые поля времени
  if (save.time) {
    save.time.hourOfDay = 0
    save.time.dayOfWeek = 1
    save.time.dayHoursRemaining = 24
    save.time.weekHoursRemaining = 168
    save.time.sleepHoursToday = 0
    save.time.sleepDebt = 0
    save.time.eventState = {
      cooldownByEventId: {},
      lastWeeklyEventWeek: 0,
      lastMonthlyEventMonth: 0,
      lastYearlyEventYear: 0,
    }
  }
  
  return save
}
```

### Миграция v1.1.0 → v1.2.0 (Work Component)

```typescript
function migrate_v1_1_0_to_v1_2_0(save: any): any {
  // Копируем данные из career.currentJob в work
  if (save.career && save.career.currentJob) {
    const job = save.career.currentJob
    save.work = {
      id: job.id || null,
      name: job.name || 'Безработный',
      schedule: job.schedule || '—',
      employed: job.employed !== false,
      level: job.level || 0,
      salaryPerHour: job.salaryPerHour || 0,
      salaryPerDay: job.salaryPerDay || 0,
      salaryPerWeek: job.salaryPerWeek || 0,
      requiredHoursPerWeek: job.requiredHoursPerWeek || 0,
      workedHoursCurrentWeek: job.workedHoursCurrentWeek || 0,
      pendingSalaryWeek: job.pendingSalaryWeek || 0,
      totalWorkedHours: job.totalWorkedHours || 0,
      daysAtWork: job.daysAtWork || 0,
    }
  } else {
    // Создаём пустой work компонент
    save.work = {
      id: null,
      name: 'Безработный',
      schedule: '—',
      employed: false,
      level: 0,
      salaryPerHour: 0,
      salaryPerDay: 0,
      salaryPerWeek: 0,
      requiredHoursPerWeek: 0,
      workedHoursCurrentWeek: 0,
      pendingSalaryWeek: 0,
      totalWorkedHours: 0,
      daysAtWork: 0,
    }
  }
  
  return save
}
```

### Миграция v1.2.0 → v1.3.0 (Period Hooks)

```typescript
function migrate_v1_2_0_to_v1_3_0(save: any): any {
  // Инициализируем eventState поля
  if (save.time && save.time.eventState) {
    const time = save.time
    const totalHours = time.totalHours || 0
    const weekIndex = Math.floor(totalHours / 168)
    const monthIndex = Math.floor(weekIndex / 4)
    
    save.time.eventState.lastWeeklyEventWeek = weekIndex
    save.time.eventState.lastMonthlyEventMonth = monthIndex
    save.time.eventState.lastYearlyEventYear = Math.floor(monthIndex / 12)
  }
  
  return save
}
```

---

## Regression-набор тестовых сейвов

### Test Save 1: v1.0.0 (Legacy)
```json
{
  "version": "1.0.0",
  "gameDays": 10,
  "money": 5000,
  "stats": {
    "energy": 80,
    "hunger": 30,
    "stress": 20,
    "mood": 70,
    "health": 90
  },
  "skills": {
    "programming": 0.5
  },
  "currentJob": {
    "id": "junior_developer",
    "name": "Junior Developer",
    "salaryPerDay": 2000
  }
}
```

### Test Save 2: v1.1.0 (Time System)
```json
{
  "version": "1.1.0",
  "time": {
    "totalHours": 240,
    "hourOfDay": 0,
    "dayOfWeek": 1,
    "dayHoursRemaining": 24,
    "weekHoursRemaining": 168,
    "sleepHoursToday": 0,
    "sleepDebt": 0,
    "eventState": {
      "cooldownByEventId": {},
      "lastWeeklyEventWeek": 1,
      "lastMonthlyEventMonth": 0,
      "lastYearlyEventYear": 0
    }
  },
  "money": 5000,
  "stats": {
    "energy": 80,
    "hunger": 30,
    "stress": 20,
    "mood": 70,
    "health": 90
  }
}
```

### Test Save 3: v1.2.0 (Work Component)
```json
{
  "version": "1.2.0",
  "time": {
    "totalHours": 500,
    "hourOfDay": 8,
    "dayOfWeek": 3,
    "dayHoursRemaining": 16,
    "weekHoursRemaining": 100,
    "sleepHoursToday": 7,
    "sleepDebt": 0,
    "eventState": {
      "cooldownByEventId": {},
      "lastWeeklyEventWeek": 2,
      "lastMonthlyEventMonth": 0,
      "lastYearlyEventYear": 0
    }
  },
  "work": {
    "id": "middle_developer",
    "name": "Middle Developer",
    "schedule": "5/2",
    "employed": true,
    "level": 2,
    "salaryPerHour": 150,
    "salaryPerDay": 1200,
    "salaryPerWeek": 6000,
    "requiredHoursPerWeek": 40,
    "workedHoursCurrentWeek": 32,
    "pendingSalaryWeek": 4800,
    "totalWorkedHours": 800,
    "daysAtWork": 20
  },
  "career": {
    "currentJob": {
      "id": "middle_developer",
      "name": "Middle Developer",
      "salaryPerDay": 1200
    }
  }
}
```

---

## Процедура проверки миграций

1. **Подготовка тестовых сейвов**:
   - Создать сейвы для каждой версии
   - Сохранить в `test/fixtures/saves/`

2. **Автоматические тесты**:
   ```typescript
   describe('Save Migration', () => {
     test('migrates v1.0.0 to v1.6.0', () => {
       const oldSave = loadTestSave('v1.0.0.json')
       const newSave = migrateSave(oldSave)
       
       expect(newSave.time.totalHours).toBe(oldSave.gameDays * 24)
       expect(newSave.work).toBeDefined()
       expect(newSave.time.eventState.lastWeeklyEventWeek).toBeDefined()
     })
   })
   ```

3. **Ручное тестирование**:
   - Загрузить старый сейв в игре
   - Проверить корректность отображения
   - Выполнить несколько действий
   - Сохранить и загрузить снова
   - Проверить отсутствие потерь данных

---

## Rollback-процедуры

### Rollback v1.6.0 → v1.5.0
- Удалить replay-сессии (runtime-only, не влияет на save)
- Никаких изменений в save-формате

### Rollback v1.5.0 → v1.4.0
- Отключить strict period processing (runtime-only)
- Никаких изменений в save-формате

### Rollback v1.4.0 → v1.3.0
- Отключить кэш доступности (runtime-only)
- Никаких изменений в save-формате

### Rollback v1.3.0 → v1.2.0
- Удалить `eventState.lastWeeklyEventWeek`, `lastMonthlyEventMonth`, `lastYearlyEventYear`
- Потеря данных: история периодических событий

### Rollback v1.2.0 → v1.1.0
- Удалить `work` компонент
- Потеря данных: детальная информация о работе

### Rollback v1.1.0 → v1.0.0
- Удалить `totalHours`, `hourOfDay`, `dayOfWeek`, `dayHoursRemaining`, `weekHoursRemaining`
- Удалить `sleepHoursToday`, `sleepDebt`, `eventState`
- Потеря данных: точное время, сон, события

---

## Рекомендации

1. **Всегда сохранять версию** в save-файле
2. **Тестировать миграции** на реальных пользовательских сейвах
3. **Сохранять бэкапы** перед миграцией
4. **Логировать миграции** для отладки
5. **Предоставлять пользователю** информацию о миграции
6. **Позволять отклонить** миграцию с предупреждением о потере функциональности
