import type { RecoveryTab, RecoveryCard } from '@/domain/balance/types'

interface ExtendedRecoveryCard extends RecoveryCard {
  reserveDelta?: number
  investmentReturn?: number
  investmentDurationDays?: number
}

interface ExtendedRecoveryTab extends Omit<RecoveryTab, 'cards'> {
  cards: ExtendedRecoveryCard[]
}

export const RECOVERY_TABS: ExtendedRecoveryTab[] = [
  {
    id: 'home',
    label: 'Дом',
    icon: 'Д',
    accentKey: 'sage',
    title: 'Комфорт и жильё',
    subtitle: 'Уют комнаты влияет на эффективность восстановления и будущий прогресс.',
    cards: [
      { title: 'Хорошая кровать', price: 18000, dayCost: 1, hourCost: 1, effect: 'Энергия +18 • Здоровье +8 • Комфорт дома +10', mood: 'Лучшее вложение в ежедневный цикл', statChanges: { energy: 18, health: 8 }, housingComfortDelta: 10, furnitureId: 'good_bed' },
      { title: 'Холодильник', price: 24000, dayCost: 1, hourCost: 1, effect: 'Голод +12 • Комфорт дома +12', mood: 'Работает каждый ход', statChanges: { hunger: 12 }, housingComfortDelta: 12, furnitureId: 'refrigerator' },
      { title: 'Декор и свет', price: 9500, dayCost: 1, hourCost: 1, effect: 'Комфорт дома +8 • Настроение +5', mood: 'Уют без лишней сложности', statChanges: { mood: 5 }, housingComfortDelta: 8, furnitureId: 'decor_light' },
      {
        title: 'Переехать в 1-комнатную квартиру',
        price: 95000,
        dayCost: 2,
        hourCost: 6,
        effect: 'Уровень жилья 2 • Комфорт до 52 • Домашние бонусы сильнее',
        mood: 'Следующий шаг к более устойчивому циклу',
        housingUpgradeLevel: 2,
      },
      {
        title: 'Переехать в уютную квартиру',
        price: 210000,
        dayCost: 3,
        hourCost: 10,
        effect: 'Уровень жилья 3 • Комфорт до 72 • Больше пассивного восстановления',
        mood: 'Дорогой, но очень сильный апгрейд качества жизни',
        housingUpgradeLevel: 3,
      },
    ],
  },
  {
    id: 'shop',
    label: 'Магазин',
    icon: 'М',
    accentKey: 'accent',
    title: 'Быстрое восстановление',
    subtitle: 'Еда, бытовые мелочи и базовые покупки после рабочей смены.',
    cards: [
      { title: 'Быстрый перекус', price: 150, dayCost: 1, hourCost: 0.5, effect: 'Голод +35 • Энергия +10 • Стресс -5', mood: 'На 5 минут и снова в ритм', statChanges: { hunger: 22, energy: 4, stress: -2 } },
      { title: 'Полноценный обед', price: 450, dayCost: 1, hourCost: 1, effect: 'Голод +65 • Энергия +25 • Настроение +15', mood: 'Самый стабильный вариант', statChanges: { hunger: 40, energy: 10, mood: 4 } },
      { title: 'Запас продуктов домой', price: 1200, dayCost: 1, hourCost: 1.5, effect: 'Голод +25 • Настроение +8 • Комфорт дома +2', mood: 'Небольшой буфер комфорта', statChanges: { hunger: 18, mood: 4 }, housingComfortDelta: 2 },
    ],
  },
  {
    id: 'fun',
    label: 'Развлечения',
    icon: 'Р',
    accentKey: 'blue',
    title: 'Сбросить напряжение',
    subtitle: 'Сцены отдыха помогают стабилизировать стресс и настроение.',
    cards: [
      { title: 'Вечер дома', price: 0, dayCost: 1, hourCost: 8, effect: 'Энергия +55 • Настроение +20 • Стресс -25', mood: 'Самый бережный отдых', statChanges: { energy: 30, mood: 10, stress: -12 } },
      { title: 'Кино или прогулка', price: 800, dayCost: 1, hourCost: 3, effect: 'Энергия +30 • Настроение +45 • Стресс -30', mood: 'Мягкий городской уют', statChanges: { energy: 8, mood: 18, stress: -10 } },
      { title: 'Спортзал', price: 1200, dayCost: 1, hourCost: 2, effect: 'Энергия +40 • Настроение +35 • Стресс -35 • Форма +10', mood: 'Хорошо для длинной дистанции', statChanges: { energy: -8, mood: 10, stress: -14, physical: 5, health: 2 } },
    ],
  },
  {
    id: 'social',
    label: 'Соц. жизнь',
    icon: 'С',
    accentKey: 'blue',
    title: 'Отношения и поддержка',
    subtitle: 'Связи снижают стресс, повышают настроение и создают долгосрочные бонусы.',
    cards: [
      { title: 'Встретиться с другом', price: 500, dayCost: 1, hourCost: 3, effect: 'Настроение +18 • Стресс -12 • Отношения +8', mood: 'Надёжный способ перевести дух', statChanges: { mood: 14, stress: -8 } },
      { title: 'Позвонить родителям', price: 0, dayCost: 1, hourCost: 0.5, effect: 'Настроение +10 • Стресс -8', mood: 'Небольшой, но частый буст', statChanges: { mood: 6, stress: -4 } },
      { title: 'Свидание', price: 1800, dayCost: 1, hourCost: 4, effect: 'Настроение +22 • Отношения +12', mood: 'Для длинной эмоциональной линии', statChanges: { mood: 18, stress: -6 } },
    ],
  },
  {
    id: 'finance',
    label: 'Финансы',
    icon: 'Ф',
    accentKey: 'sage',
    title: 'Деньги и планирование',
    subtitle: 'Финансовые решения влияют на стабильность, риски и будущий доход.',
    cards: [
      { title: 'Отложить в резерв', price: 5000, dayCost: 1, hourCost: 1, effect: 'Резерв +5 000 • Стресс -10 • Настроение +6', mood: 'Снижает тревожность перед расходами', statChanges: { stress: -6, mood: 3 }, reserveDelta: 5000 },
      { title: 'Открыть депозит', price: 50000, dayCost: 1, hourCost: 2, effect: 'Инвестиция +4 000 • Финансовая грамотность +1', mood: 'Низкий риск, спокойный рост', skillChanges: { financialLiteracy: 1 } },
      { title: 'Пересмотреть бюджет', price: 0, dayCost: 1, hourCost: 1, effect: 'Стресс -8 • Финансовая грамотность +1', mood: 'Хорошая рутина перед крупными целями', statChanges: { stress: -5, mood: 2 }, skillChanges: { financialLiteracy: 1 } },
    ],
  },
]

