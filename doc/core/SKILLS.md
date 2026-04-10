# Система навыков (Skills System)

**Последнее обновление:** 10 апреля 2026

---

## Обзор

Система навыков позволяет игроку просматривать свои способности и планировать развитие персонажа. Навыки разделены на базовые и профессиональные.

---

## Структура навыков

### Базовые навыки (Basic Skills) - 10 штук

Фундаментальные навыки, которые формируют основу развития персонажа:

| Ключ | Название | Описание |
|--------|----------|----------|
| timeManagement | Тайм-менеджмент | Умение планировать и распределять время |
| communication | Коммуникация | Способность общаться и договариваться |
| financialLiteracy | Финансовая грамотность | Понимание основ управления деньгами |
| healthyLifestyle | Здоровый образ жизни | Привычки, поддерживающие здоровье |
| adaptability | Адаптивность | Способность быстро адаптироваться к изменениям |
| discipline | Дисциплина | Способность следовать плану и правилам |
| physicalFitness | Физическая форма | Общая физическая подготовка |
| emotionalIntelligence | Эмоциональный интеллект | Понимание собственных и чужих эмоций |
| organization | Организованность | Умение поддерживать порядок в делах |
| basicCreativity | Базовая креативность | Способность мыслить нестандартно |

### Профессиональные навыки (Professional Skills) - 12 штук

Специализированные навыки для карьерного роста:

| Ключ | Название | Описание |
|--------|----------|----------|
| professionalism | Профессионализм | Качественное выполнение рабочих задач |
| leadership | Лидерство | Способность вести за собой других |
| negotiations | Переговоры | Умение договариваться |
| analyticalThinking | Аналитическое мышление | Способность анализировать информацию |
| specialization | Специализация | Глубокие знания в конкретной области |
| creativity | Креативность | Профессиональное творчество |
| stressResistance | Стрессоустойчивость | Способность работать под давлением |
| advancedHealth | Продвинутое здоровье | Специальные знания о здоровье |
| socialConnections | Социальные связи | Полезные знакомства и нетворкинг |
| flexibleThinking | Гибкое мышление | Способность быстро менять стратегию |
| generosity | Щедрость | Способность делиться с другими |
| selfDisciplineExtended | Расширенная самодисциплина | Дополнительная дисциплина |
| intuition | Интуиция | Понимание ситуации без логики |
| wisdom | Мудрость | Жизненный опыт и понимание |

### Творческие навыки (Artistic Skills) - 10 штук

Навыки для творческих профессий:

| Ключ | Название | Описание |
|--------|----------|----------|
| artisticMastery | Художественное мастерство | Мастерство в искусстве |
| musicalAbility | Музыкальные способности | Талант в музыке |
| writing | Письмо | Умение писать тексты |
| photography | Фотография | Навыки фотографа |
| gardening | Садоводство | Уход за растениями |
| handicraft | Ремесло | Ручное мастерство |
| dance | Танцы | Навыки танца |
| acting | Актёрское мастерство | Игра ролей |
| interiorDesign | Дизайн интерьера | Создание интерьера |
| culinaryArt | Кулинарное искусство | Приготовление еды |

---

## Влияние навыков на игру

### На механики игры

Навыки влияют на следующие механики:

1. **Работа**
   - Требования к должностям (минимальные уровни навыков)
   - Модификатор зарплаты (salaryMultiplier)
   - Вероятность успешных событий на работе

2. **Образование**
   - Скорость обучения в программах (educationSpeed)
   - Вероятность успешного завершения
   - Доступность к продвинутым программам

3. **События**
   - Дополнительные варианты решений
   - Успех в сложных ситуациях
   - Снижение негативных последствий

4. **Восстановление**
   - Снижение затрат времени на действия
   - Повышение эффективности отдыха
   - Дополнительные варианты восстановления

### Модификаторы

Навыки создают модификаторы, которые применяются в игре:

```typescript
// Пересчёт модификаторов
function recalculateSkillModifiers() {
  // Базовые модификаторы от навыков
  const modifiers = {
    energyDrainMultiplier: calculateEnergyDrain(),      // Множитель траты энергии
    stressGainMultiplier: calculateStressGain(),      // Множитель набора стресса
    moodRecoveryMultiplier: calculateMoodRecovery(),  // Множитель восстановления настроения
    salaryMultiplier: calculateSalary(),               // Множитель зарплаты
    educationSpeed: calculateEducationSpeed(),         // Скорость обучения
  }

  // Применение ограничений (функция clampSkillModifiers())
  return applyModifiersLimits(modifiers)
}
```

### Ограничения

Модификаторы имеют разумные пределы для баланса игры:

```typescript
function applyModifiersLimits(modifiers: SkillModifiers): SkillModifiers {
  return {
    energyDrainMultiplier: clamp(modifiers.energyDrainMultiplier, 0.5, 2.0),
    stressGainMultiplier: clamp(modifiers.stressGainMultiplier, 0.5, 2.0),
    moodRecoveryMultiplier: clamp(modifiers.moodRecoveryMultiplier, 0.5, 2.0),
    salaryMultiplier: clamp(modifiers.salaryMultiplier, 0.5, 2.0),
    educationSpeed: clamp(modifiers.educationSpeed, 0.5, 2.0),
  }
}
```

---

## Изменение навыков

### При выполнении действий

Некоторые действия в игре дают прирост навыков:

```typescript
interface SkillChange {
  category: 'basic' | 'professional' | 'artistic'
  key: string      // Ключ навыка (например, 'communication')
  value: number     // Изменение (+1–10)
}
```

### Примеры

- **Учебные курсы:** +2 к `timeManagement`
- **Работа над проектом:** +1 к `professionalism`
- **Семейные ужины:** +1 к `emotionalIntelligence`
- **Творческое хобби:** +1 к соответствующему художественному навыку

### Формула изменения

```typescript
skills[key] = clamp(oldValue + value, 0, 10);

// Затем пересчитываются модификаторы
recalculateSkillModifiers();
```

---

## Реализация в коде

### ECS Компоненты

**SkillsComponent** (`src/domain/ecs/components/index.ts`):

```typescript
interface SkillsComponent {
  basicSkills: {
    timeManagement: number
    communication: number
    financialLiteracy: number
    healthyLifestyle: number
    adaptability: number
    discipline: number
    physicalFitness: number
    emotionalIntelligence: number
    organization: number
    basicCreativity: number
  }

  professionalSkills: {
    professionalism: number
    leadership: number
    negotiations: number
    analyticalThinking: number
    specialization: number
    creativity: number
    stressResistance: number
    advancedHealth: number
    socialConnections: number
    flexibleThinking: number
    generosity: number
    selfDisciplineExtended: number
    intuition: number
    wisdom: number
  }

  artisticSkills: {
    artisticMastery: number
    musicalAbility: number
    writing: number
    photography: number
    gardening: number
    handicraft: number
    dance: number
    acting: number
    interiorDesign: number
    culinaryArt: number
  }
}
```

### ECS Система

**SkillsSystem** (`src/domain/ecs/systems/SkillsSystem.ts`):

```typescript
export class SkillsSystem {
  init(world: ECSWorld, playerId: string) {
    // Инициализация системы
  }

  applySkillChanges(world: ECSWorld, playerId: string, changes: SkillChange[]) {
    const skills = world.getComponent<SkillsComponent>(playerId, 'skills')
    
    // Применение изменений с ограничениями (clamp)
    for (const change of changes) {
      skills[change.category][change.key] = clamp(
        skills[change.category][change.key] + change.value,
        0,
        10
      )
    }

    // Пересчёт модификаторов
    recalculateSkillModifiers()
  }
}
```

### Константы навыков

**skills-constants.ts** (`src/domain/balance/skills-constants.ts`):

Содержит константы для всех 32 навыков:

```typescript
export const BASIC_SKILLS = {
  TIME_MANAGEMENT: 'timeManagement',
  COMMUNICATION: 'communication',
  FINANCIAL_LITERACY: 'financialLiteracy',
  HEALTHY_LIFESTYLE: 'healthyLifestyle',
  ADAPTABILITY: 'adaptability',
  DISCIPLINE: 'discipline',
  PHYSICAL_FITNESS: 'physicalFitness',
  EMOTIONAL_INTELLIGENCE: 'emotionalIntelligence',
  ORGANIZATION: 'organization',
  BASIC_CREATIVITY: 'basicCreativity',
} as const

export const PROFESSIONAL_SKILLS = {
  PROFESSIONALISM: 'professionalism',
  LEADERSHIP: 'leadership',
  NEGOTIATIONS: 'negotiations',
  ANALYTICAL_THINKING: 'analyticalThinking',
  SPECIALIZATION: 'specialization',
  CREATIVITY: 'creativity',
  STRESS_RESISTANCE: 'stressResistance',
  ADVANCED_HEALTH: 'advancedHealth',
  SOCIAL_CONNECTIONS: 'socialConnections',
  FLEXIBLE_THINKING: 'flexibleThinking',
  GENEROSITY: 'generosity',
  SELF_DISCIPLINE_EXTENDED: 'selfDisciplineExtended',
  INTUITION: 'intuition',
  WISDOM: 'wisdom',
} as const

export const ARTISTIC_SKILLS = {
  ARTISTIC_MASTERY: 'artisticMastery',
  MUSICAL_ABILITY: 'musicalAbility',
  WRITING: 'writing',
  PHOTOGRAPHY: 'photography',
  GARDENING: 'gardening',
  HANDICRAFT: 'handicraft',
  DANCE: 'dance',
  ACTING: 'acting',
  INTERIOR_DESIGN: 'interiorDesign',
  CULINARY_ART: 'culinaryArt',
} as const
```

---

## Доступ к навыкам в UI

### Vue Components

**SkillsPage.vue** (`src/pages/SkillsPage.vue`):

Отображает все навыки с разделением на категории:

```vue
<template>
  <div class="skills-page">
    <h2>Базовые навыки</h2>
    <div class="skill-category">
      <ProgressBar
        v-for="skill in basicSkills"
        :key="skill.key"
        :label="skill.name"
        :value="skill.value"
        :max="10"
      />
    </div>

    <h2>Профессиональные навыки</h2>
    <div class="skill-category">
      <ProgressBar
        v-for="skill in professionalSkills"
        :key="skill.key"
        :label="skill.name"
        :value="skill.value"
        :max="10"
      />
    </div>

    <h2>Творческие навыки</h2>
    <div class="skill-category">
      <ProgressBar
        v-for="skill in artisticSkills"
        :key="skill.key"
        :label="skill.name"
        :value="skill.value"
        :max="10"
      />
    </div>
  </div>
</template>
```

### Composable

**useSkills.ts** (`src/composables/useSkills.ts`):

```typescript
export function useSkills() {
  const store = useGameStore()

  const skills = computed(() => {
    if (!store.world) return null
    return store.world.getComponent<SkillsComponent>(PLAYER_ENTITY, 'skills')
  })

  return { skills }
}
```

---

## Дополнительные ресурсы

- [Реализация в коде](../src/domain/ecs/systems/SkillsSystem.ts)
- [Константы навыков](../src/domain/balance/skills-constants.ts)
- [Компонент страницы](../src/pages/SkillsPage.vue)
- [Composable для работы](../src/composables/useSkills.ts)

---

**Последнее обновление:** 10 апреля 2026
**Версия:** 3.0
