## 6. Система сохранения и прогресса

### 6.1. Механика сохранения

Все данные игры сохраняются локально в браузере через `localStorage` для обеспечения мгновенного доступа и оффлайн-работы.

**Точки автосохранения:**
- После завершения любого действия игрока (если списаны часы или деньги)
- После автоматического завершения дня (сон/закрытие суток)
- После завершения недели
- После завершения любого случайного события
- После завершения месячных и годовых событий

**Слоты сохранений:**
- **Основной слот** — автоматическое сохранение (перезаписывается)
- **Дополнительный слот 1** — ручное сохранение (через меню)
- **Дополнительный слот 2** — ручное сохранение (через меню)
- **Быстрое сохранение** — F5 или кнопка в меню (перезаписывает слот 1)

### 6.2. Структура сохраняемых данных

```javascript
{
  // Базовая информация
  version: "1.1.0",
  playerName: "Алексей",
  startAge: 25,
  currentAge: 27,
  
  // Игровое время (часовая модель)
  time: {
    totalHours: 12960,         // всего прожито игровых часов
    gameDays: 540,             // floor(totalHours / 24)
    gameWeeks: 77,             // всего недель
    gameMonths: 19,            // системные месяцы (4 недели)
    gameYears: 1.6,            // системные годы (12 месяцев)
    hourOfDay: 9,              // 0-23
    dayOfWeek: 3,              // 1-7
    weekHoursSpent: 62,        // потрачено в текущей неделе
    weekHoursRemaining: 106,   // осталось до конца недели
    dayHoursSpent: 5,          // потрачено в текущих сутках
    dayHoursRemaining: 19,     // осталось до конца суток
    sleepHoursToday: 0,        // сколько сна уже было за сутки
    sleepDebt: 6               // накопленный недосып
  },
  
  // Шкалы персонажа
  stats: {
    hunger: 75,
    energy: 60,
    stress: 30,
    mood: 80,
    health: 85,
    physical: 65
  },
  
  // Финансы
  money: 124500,
  totalEarnings: 4560000,
  totalSpent: 4435500,
  
  // Работа
  currentJob: {
    id: "office_manager",
    name: "Офисный менеджер",
    schedule: "5/2",
    employed: true,
    salaryPerWeek: 45000,
    salaryPerHour: 1125,
    requiredHoursPerWeek: 40,
    workedHoursCurrentWeek: 16,
    level: 2,
    daysAtWork: 45,
    totalWorkedHours: 1240
  },
  
  // Навыки
  skills: {
    // Базовые
    timeManagement: 3,
    communication: 2,
    financialLiteracy: 2,
    healthyLifestyle: 4,
    adaptability: 2,
    discipline: 3,
    physicalFitness: 3,
    emotionalIntelligence: 3,
    organization: 2,
    basicCreativity: 2,
    
    // Продвинутые
    professionalism: 4,
    leadership: 1,
    negotiations: 2,
    analyticalThinking: 1,
    specialization: 0,
    creativity: 2,
    stressResistance: 3,
    advancedHealth: 1,
    socialConnections: 2,
    technicalLiteracy: 0,
    cooking: 1,
    marketing: 0,
    
    // Экспертные
    masterLeadership: 0,
    strategicThinking: 0,
    charisma: 0,
    expertHealth: 0,
    innovation: 0,
    financialGenius: 0,
    masterCommunication: 0,
    creativeGenius: 0,
    emotionalStability: 0,
    mentoring: 0
  },
  
  // Образование
  education: {
    school: "completed",      // none, completed
    institute: "none",        // none, in_progress, completed
    educationLevel: "Среднее", // Среднее, Высшее, MBA
    
    activeCourses: [
      {
        id: "python_basic",
        name: "Python для начинающих",
        type: "online_course",
        progress: 0.45,       // 0.0 – 1.0
        skill: "technicalLiteracy",
        targetLevel: 3,
        hoursRequired: 28,
        hoursSpent: 12,
        costPaid: 5000
      }
    ]
  },
  
  // Дом и жильё
  housing: {
    level: 2,                 // 0: комната, 1: студия, 2: 1-комнатная, 3: 2-комнатная, 4: дом
    name: "Студия",
    comfort: 35,              // процент комфорта от мебели
    furniture: [
      { id: "good_bed", level: 1 },
      { id: "refrigerator", level: 1 },
      { id: "tv", level: 1 }
    ]
  },
  
  // Транспорт
  transport: {
    type: "public",           // none, public, bicycle, car_economy, car_medium, car_premium
    level: 0
  },
  
  // Отношения
  relationships: [
    {
      id: "friend_ivan",
      name: "Иван",
      type: "friend",
      level: 65,
      lastContact: 540
    },
    {
      id: "partner_anna",
      name: "Анна",
      type: "partner",
      level: 78,
      lastContact: 530,
      canMoveIn: false
    }
  ],
  
  // Инвестиции
  investments: [
    {
      id: "deposit_1",
      type: "deposit",
      amount: 100000,
      startDate: 480,
      expectedReturn: 0.10,
      totalEarned: 2500
    }
  ],
  
  // Хобби
  hobbies: [
    {
      id: "cooking",
      name: "Кулинария",
      level: 3,
      totalEarned: 45000
    }
  ],
  
  // Достижения
  achievements: [
    "first_week",
    "first_month",
    "millionaire"
  ],
  
  // Случайные события (история)
  eventHistory: [
    {
      eventId: "promotion_1",
      timestampHours: 8640,
      day: 360,
      week: 51,
      type: "weekly",          // micro, weekly, monthly, yearly, work, story
      title: "Повышение на работе",
      actionSource: "work_shift"
    },
    {
      eventId: "robbery_market_1",
      timestampHours: 8643,
      day: 360,
      week: 51,
      type: "micro",
      title: "Нападение грабителей у магазина",
      actionSource: "buy_groceries",
      chanceRoll: 0.0065,
      finalChance: 0.012,
      outcomeId: "escaped"
    }
  ],

  // Состояние системы событий
  eventState: {
    microEventChanceBaseByAction: {
      buy_groceries: 0.03,
      work_shift: 0.05,
      sport: 0.04
    },
    cooldownByEventId: {
      robbery_market_1: 48      // кулдаун в игровых часах
    },
    lastWeeklyEventWeek: 51,
    lastMonthlyEventMonth: 19,
    lastYearlyEventYear: 1
  },
  
  // Статистика для финального экрана
  lifetimeStats: {
    totalWorkDays: 77,
    totalWorkHours: 1240,
    totalEvents: 45,
    totalMicroEvents: 19,
    maxMoney: 250000,
    maxSkillLevel: 4,
    childrenBorn: 0,
    marriages: 0
  },
  
  // Настройки игры
  settings: {
    soundEnabled: true,
    musicEnabled: true,
    autoSave: true,
    difficulty: "normal",
    language: "ru"
  },
  
  // Метаданные
  saveTime: 1712437200000,
  playTimeMinutes: 245
}
```

### 6.3. Экспорт и импорт сохранений

**Экспорт:**
- Кнопка в меню «Экспортировать сохранение»
- Генерирует JSON-файл с расширением `.gamelife`
- Файл можно отправить друзьям или сохранить как бэкап

**Импорт:**
- Кнопка в меню «Импортировать сохранение»
- Загрузка `.gamelife` файла
- Проверка версии на совместимость
- Конвертация старых форматов при необходимости:
- `gameDays` старого формата конвертируется в `time.totalHours = gameDays * 24`
- `salaryPerDay` конвертируется в `salaryPerHour` с учётом графика
- события без `type` считаются `story` по умолчанию

### 6.4. Механика New Game+

После завершения игры (смерть персонажа) игрок может начать новую игру с переносом некоторых достижений:

**Что переносится:**
- 10–20% от накопленных денег (настраиваемый бафф)
- 1–2 навыка с половиной уровня (например, был 6 → переносится 3)
- 1 достижение (на выбор игрока)
- Раскрытые знания о механиках игры (события, работы)

**Что сбрасывается:**
- Возраст персонажа (новая жизнь = новые 18 лет)
- Все шкалы и прогресс в текущей игре
- Все отношения и события
- Жильё и мебель
---
