import type { PrologueExamQuestion } from '@/domain/prologue/prologue.types'

/** Банк вопросов экзамена. */
export const TECH_EXAM_QUESTIONS: PrologueExamQuestion[] = [
  {
    "id": "tech_01",
    "prompt": "20% от 50?",
    "options": [
      "5",
      "10",
      "15"
    ],
    "correctIndex": 1
  },
  {
    "id": "tech_02",
    "prompt": "Если болт крутить по часовой — обычно…",
    "options": [
      "Затягиваешь",
      "Ослабляешь",
      "Ломаешь"
    ],
    "correctIndex": 0
  },
  {
    "id": "tech_03",
    "prompt": "Что безопаснее у розетки с водой рядом?",
    "options": [
      "Сухие руки",
      "Мокрые руки",
      "Босые ноги"
    ],
    "correctIndex": 0
  },
  {
    "id": "tech_04",
    "prompt": "3 часа работы по 200 ₽/час — сколько?",
    "options": [
      "400",
      "600",
      "800"
    ],
    "correctIndex": 1
  },
  {
    "id": "tech_05",
    "prompt": "Какой инструмент для измерения длины?",
    "options": [
      "Молоток",
      "Рулетка",
      "Отвёртка"
    ],
    "correctIndex": 1
  },
  {
    "id": "tech_06",
    "prompt": "Если скидка 10% на 1000 ₽, цена?",
    "options": [
      "900",
      "990",
      "1100"
    ],
    "correctIndex": 0
  },
  {
    "id": "tech_07",
    "prompt": "Что логичнее проверить первым при поломке лампы?",
    "options": [
      "Розетку/патрон",
      "Фундамент",
      "Крышу"
    ],
    "correctIndex": 0
  },
  {
    "id": "tech_08",
    "prompt": "Площадь квадрата со стороной 4?",
    "options": [
      "8",
      "12",
      "16"
    ],
    "correctIndex": 2
  },
  {
    "id": "tech_09",
    "prompt": "Какой материал обычно режет ножовка по металлу?",
    "options": [
      "Металл",
      "Только бумагу",
      "Стекло"
    ],
    "correctIndex": 0
  },
  {
    "id": "tech_10",
    "prompt": "Если 1/2 детали готова, сколько процентов?",
    "options": [
      "25%",
      "50%",
      "75%"
    ],
    "correctIndex": 1
  },
  {
    "id": "tech_11",
    "prompt": "Что важнее для техники безопасности?",
    "options": [
      "Инструкция и СИЗ",
      "Громкая музыка",
      "Спешка"
    ],
    "correctIndex": 0
  },
  {
    "id": "tech_12",
    "prompt": "2 × 15 + 10?",
    "options": [
      "40",
      "35",
      "30"
    ],
    "correctIndex": 0
  },
  {
    "id": "tech_13",
    "prompt": "Какой файл обычно чертёж?",
    "options": [
      ".dwg / чертёж",
      ".mp3",
      ".jpg мем"
    ],
    "correctIndex": 0
  },
  {
    "id": "tech_14",
    "prompt": "Если срок 5 дней, прошло 2 — осталось?",
    "options": [
      "2",
      "3",
      "5"
    ],
    "correctIndex": 1
  },
  {
    "id": "tech_15",
    "prompt": "Что означает «черновик» сметы?",
    "options": [
      "Предварительный расчёт",
      "Финал без правок",
      "Счёт в банке"
    ],
    "correctIndex": 0
  },
  {
    "id": "tech_16",
    "prompt": "Логика: все винты затянуты, один люфт — что делать?",
    "options": [
      "Проверить этот узел",
      "Сломать всё",
      "Игнорировать"
    ],
    "correctIndex": 0
  }
]
