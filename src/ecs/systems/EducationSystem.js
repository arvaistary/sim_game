import { 
  WALLET_COMPONENT,
  EDUCATION_COMPONENT,
  STATS_COMPONENT,
  SKILLS_COMPONENT,
  CAREER_COMPONENT,
  TIME_COMPONENT,
  PLAYER_ENTITY 
} from '../components/index.js';

const EDUCATION_PROGRAMS = [
  {
    id: 'time_management_book',
    title: 'Книга по тайм-менеджменту',
    subtitle: 'Короткий и дешёвый способ подтянуть базовую дисциплину.',
    typeLabel: 'Книга',
    cost: 900,
    daysRequired: 2,
    accentKey: 'accent',
    rewardText: 'Тайм-менеджмент +1 • Стресс -4',
    completionStatChanges: { stress: -4 },
    completionSkillChanges: { timeManagement: 1 },
  },
  {
    id: 'online_productivity_course',
    title: 'Онлайн-курс',
    subtitle: 'Несколько дней системного обучения с хорошей отдачей в работе.',
    typeLabel: 'Онлайн-курс',
    cost: 6500,
    daysRequired: 5,
    accentKey: 'blue',
    rewardText: 'Профессионализм +1 • Коммуникация +1 • Настроение +8',
    completionStatChanges: { mood: 8 },
    completionSkillChanges: { professionalism: 1, communication: 1 },
  },
  {
    id: 'institute_retraining',
    title: 'Институт / переподготовка',
    subtitle: 'Длинный маршрут к новой ступени карьеры и более сильной базовой ставке.',
    typeLabel: 'Институт',
    cost: 120000,
    daysRequired: 8,
    accentKey: 'sage',
    rewardText: 'Профессионализм +2 • ЗП за день +5% • Уровень образования: Высшее',
    completionSkillChanges: { professionalism: 2 },
    salaryMultiplierDelta: 0.05,
    educationLevel: 'Высшее',
  },
];

/**
 * Система управления образованием
 * Обрабатывает курсы, обучение и развитие навыков
 */
export class EducationSystem {
  constructor() {
    this.educationPrograms = EDUCATION_PROGRAMS;
  }

  init(world) {
    this.world = world;
  }

  /**
   * Проверить, можно ли начать образовательную программу
   */
  canStartEducationProgram(program) {
    const playerId = PLAYER_ENTITY;
    const wallet = this.world.getComponent(playerId, WALLET_COMPONENT);
    const education = this.world.getComponent(playerId, EDUCATION_COMPONENT);

    if (!wallet || !education) {
      return { ok: false, reason: 'Не удалось загрузить данные персонажа' };
    }

    if (wallet.money < program.cost) {
      return { ok: false, reason: `Недостаточно денег. Нужно ${this._formatMoney(program.cost)} ₽.` };
    }

    if (education.activeCourses && education.activeCourses.length > 0) {
      return { ok: false, reason: 'Сейчас уже идёт обучение. Сначала завершите активный курс.' };
    }

    if (program.educationLevel && education.educationLevel === program.educationLevel) {
      return { ok: false, reason: 'Этот уровень образования уже получен.' };
    }

    return { ok: true };
  }

  /**
   * Начать образовательную программу
   */
  startEducationProgram(program) {
    const playerId = PLAYER_ENTITY;
    const wallet = this.world.getComponent(playerId, WALLET_COMPONENT);
    const education = this.world.getComponent(playerId, EDUCATION_COMPONENT);

    if (!wallet || !education) {
      return { success: false, message: 'Не удалось загрузить данные персонажа' };
    }

    // Проверяем
    const validation = this.canStartEducationProgram(program);
    if (!validation.ok) {
      return { success: false, message: validation.reason };
    }

    // Списываем деньги
    wallet.money -= program.cost;
    wallet.totalSpent += program.cost;

    // Создаем активный курс
    const activeCourse = {
      id: program.id,
      name: program.title,
      type: program.typeLabel,
      progress: 0,
      daysRequired: program.daysRequired,
      daysSpent: 0,
      costPaid: program.cost,
    };

    if (!education.activeCourses) {
      education.activeCourses = [];
    }
    education.activeCourses = [activeCourse];

    return {
      success: true,
      message: [
        `${program.title} начат.`,
        `Стоимость: ${this._formatMoney(program.cost)} ₽.`,
        `Понадобится ${program.daysRequired} игровых дн.`,
      ].join('\n'),
    };
  }

  /**
   * Продвинуть учебный день курса
   */
  advanceEducationCourseDay(courseId) {
    const playerId = PLAYER_ENTITY;
    const education = this.world.getComponent(playerId, EDUCATION_COMPONENT);
    const stats = this.world.getComponent(playerId, STATS_COMPONENT);
    const time = this.world.getComponent(playerId, TIME_COMPONENT);

    if (!education || !time) {
      return { completed: false, summary: 'Не удалось загрузить данные' };
    }

    const course = education.activeCourses?.find(item => item.id === courseId);
    const program = this.educationPrograms.find(item => item.id === courseId);

    if (!course || !program) {
      return { completed: false, summary: 'Активный курс не найден.' };
    }

    // Продвигаем время
    time.gameDays += 1;
    time.gameWeeks = Math.max(1, Math.floor(time.gameDays / 7));
    time.gameMonths = Math.max(1, Math.floor(time.gameDays / 30));
    time.gameYears = Number((time.gameDays / 360).toFixed(1));
    time.currentAge = time.startAge + Math.floor(time.gameDays / 360);

    // Обновляем прогресс курса
    course.daysSpent += 1;
    course.progress = this._clamp(course.daysSpent / course.daysRequired, 0, 1);

    // Применяем изменения статы
    if (stats) {
      this._applyStatChanges(stats, {
        energy: -10,
        stress: 8,
        mood: -3,
      });
    }

    // Проверяем завершение
    if (course.daysSpent < course.daysRequired) {
      return {
        completed: false,
        summary: [
          `Учебный день завершён: ${course.name}.`,
          `Прогресс: ${Math.round(course.progress * 100)}%.`,
          'Энергия -10 • Стресс +8 • Настроение -3',
        ].join('\n'),
      };
    }

    // Курс завершён - применяем награды
    this._applyCompletionRewards(program);

    const careerSummary = this._syncCareerProgress();

    // Удаляем курс из активных
    education.activeCourses = education.activeCourses.filter(item => item.id !== courseId);

    return {
      completed: true,
      summary: [
        `${program.title} завершён.`,
        program.rewardText,
        careerSummary || '',
        'Последний учебный день тоже повлиял на ресурсы: Энергия -10 • Стресс +8 • Настроение -3',
      ].filter(Boolean).join('\n'),
    };
  }

  /**
   * Получить все доступные программы
   */
  getEducationPrograms() {
    return this.educationPrograms;
  }

  /**
   * Получить активные курсы
   */
  getActiveCourses() {
    const playerId = PLAYER_ENTITY;
    const education = this.world.getComponent(playerId, EDUCATION_COMPONENT);

    if (!education) {
      return [];
    }

    return education.activeCourses || [];
  }

  /**
   * Получить текущий уровень образования
   */
  getEducationLevel() {
    const playerId = PLAYER_ENTITY;
    const education = this.world.getComponent(playerId, EDUCATION_COMPONENT);

    if (!education) {
      return null;
    }

    return education.educationLevel;
  }

  /**
   * Применить награды за завершение курса
   */
  _applyCompletionRewards(program) {
    const playerId = PLAYER_ENTITY;
    const stats = this.world.getComponent(playerId, STATS_COMPONENT);
    const skills = this.world.getComponent(playerId, SKILLS_COMPONENT);
    const education = this.world.getComponent(playerId, EDUCATION_COMPONENT);
    const career = this.world.getComponent(playerId, CAREER_COMPONENT);

    // Навыки
    if (program.completionSkillChanges && skills) {
      this._applySkillChanges(skills, program.completionSkillChanges);
    }

    // Статы
    if (program.completionStatChanges && stats) {
      this._applyStatChanges(stats, program.completionStatChanges);
    }

    // Уровень образования
    if (program.educationLevel && education) {
      education.educationLevel = program.educationLevel;
      education.institute = 'completed';
    }

    // Множитель зарплаты
    if (program.salaryMultiplierDelta && career) {
      career.salaryPerDay = Math.round(career.salaryPerDay * (1 + program.salaryMultiplierDelta));
      career.salaryPerWeek = career.salaryPerDay * 5;
    }
  }

  /**
   * Синхронизировать карьерный прогресс
   */
  _syncCareerProgress() {
    // Это будет реализовано через CareerProgressSystem
    return '';
  }

  /**
   * Применить изменения статы
   */
  _applyStatChanges(stats, statChanges = {}) {
    for (const [key, value] of Object.entries(statChanges)) {
      stats[key] = this._clamp((stats[key] ?? 0) + value);
    }
  }

  /**
   * Применить изменения навыков
   */
  _applySkillChanges(skills, skillChanges = {}) {
    for (const [key, value] of Object.entries(skillChanges)) {
      skills[key] = this._clamp((skills[key] ?? 0) + value, 0, 10);
    }
  }

  /**
   * Ограничить значение
   */
  _clamp(value, min = 0, max = 100) {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Форматирование денег
   */
  _formatMoney(value) {
    return new Intl.NumberFormat('ru-RU').format(value);
  }
}
