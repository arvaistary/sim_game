import { 
  WALLET_COMPONENT,
  EDUCATION_COMPONENT,
  STATS_COMPONENT,
  SKILLS_COMPONENT,
  CAREER_COMPONENT,
  TIME_COMPONENT,
  PLAYER_ENTITY 
} from '../components/index.js';
import { EDUCATION_PROGRAMS } from '../../balance/education-programs.js';
import { SkillsSystem } from './SkillsSystem.js';

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
    this.skillsSystem = new SkillsSystem();
    this.skillsSystem.init(world);
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
    const resolvedProgram = typeof program === 'string'
      ? this.educationPrograms.find((item) => item.id === program)
      : program;
    if (!resolvedProgram) {
      return { success: false, message: 'Образовательная программа не найдена' };
    }

    const playerId = PLAYER_ENTITY;
    const wallet = this.world.getComponent(playerId, WALLET_COMPONENT);
    const education = this.world.getComponent(playerId, EDUCATION_COMPONENT);

    if (!wallet || !education) {
      return { success: false, message: 'Не удалось загрузить данные персонажа' };
    }

    // Проверяем
    const validation = this.canStartEducationProgram(resolvedProgram);
    if (!validation.ok) {
      return { success: false, message: validation.reason };
    }

    // Списываем деньги
    wallet.money -= resolvedProgram.cost;
    wallet.totalSpent += resolvedProgram.cost;

    // Создаем активный курс
    const activeCourse = {
      id: resolvedProgram.id,
      name: resolvedProgram.title,
      type: resolvedProgram.typeLabel,
      progress: 0,
      daysRequired: resolvedProgram.daysRequired,
      daysSpent: 0,
      hoursRequired: this._resolveCourseHours(resolvedProgram),
      hoursSpent: 0,
      costPaid: resolvedProgram.cost,
    };

    if (!education.activeCourses) {
      education.activeCourses = [];
    }
    education.activeCourses = [activeCourse];

      return {
        success: true,
        message: [
          `${resolvedProgram.title} начат.`,
          `Стоимость: ${this._formatMoney(resolvedProgram.cost)} ₽.`,
          `Понадобится ${this._resolveCourseHours(resolvedProgram)} игровых ч.`,
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
    const modifiers = this.skillsSystem.getModifiers();

    if (!course || !program) {
      return { completed: false, summary: 'Активный курс не найден.' };
    }

    const studyHours = 4;
    const timeSystem = this.world.systems.find((system) => typeof system.advanceHours === 'function');
    if (timeSystem) {
      timeSystem.advanceHours(studyHours, { actionType: 'education' });
    } else {
      time.totalHours = (time.totalHours ?? (time.gameDays ?? 0) * 24) + studyHours;
    }

    // Обновляем прогресс курса
    course.daysSpent += 1;
    course.hoursSpent = (course.hoursSpent ?? 0) + studyHours;
    const courseHoursRequired = course.hoursRequired ?? this._resolveCourseHours(program);
    const effectiveStudyHours = (course.hoursSpent ?? 0) * (modifiers.learningSpeedMultiplier ?? 1);
    course.progress = this._clamp(effectiveStudyHours / courseHoursRequired, 0, 1);

    // Применяем изменения статы
    if (stats) {
      this._applyStatChanges(stats, {
        energy: -10,
        stress: 8,
        mood: -3,
      });
    }

    // Проверяем завершение
    if (effectiveStudyHours < courseHoursRequired) {
      return {
        completed: false,
        summary: [
          `Учебный блок завершён: ${course.name}.`,
          `Прогресс: ${Math.round(course.progress * 100)}%.`,
          `Время: ${studyHours} ч. • Энергия -10 • Стресс +8 • Настроение -3`,
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
        `Последний учебный блок тоже повлиял на ресурсы: ${studyHours} ч. • Энергия -10 • Стресс +8 • Настроение -3`,
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
    const education = this.world.getComponent(playerId, EDUCATION_COMPONENT);
    const career = this.world.getComponent(playerId, CAREER_COMPONENT);

    // Навыки - через единый шлюз SkillsSystem
    if (program.completionSkillChanges) {
      this._applySkillChanges(program.completionSkillChanges);
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
      const basePerHour = this._resolveSalaryPerHour(career);
      career.salaryPerHour = Math.round(basePerHour * (1 + program.salaryMultiplierDelta));
      career.salaryPerDay = Math.round(career.salaryPerHour * 8);
      career.salaryPerWeek = Math.round(career.salaryPerHour * 40);
    }
  }

  /**
   * Синхронизировать карьерный прогресс
   */
  _syncCareerProgress() {
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
   * Применить изменения навыков через SkillsSystem
   */
  _applySkillChanges(skillChanges = {}) {
    this.skillsSystem.applySkillChanges(skillChanges, 'education');
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

  _resolveCourseHours(program = {}) {
    if (typeof program.hoursRequired === 'number' && program.hoursRequired > 0) {
      return program.hoursRequired;
    }
    const legacyDays = Math.max(1, Number(program.daysRequired) || 1);
    return legacyDays * 4;
  }

  _resolveSalaryPerHour(career = {}) {
    if (typeof career.salaryPerHour === 'number' && career.salaryPerHour > 0) {
      return career.salaryPerHour;
    }
    if (typeof career.salaryPerDay === 'number' && career.salaryPerDay > 0) {
      return Math.round(career.salaryPerDay / 8);
    }
    if (typeof career.salaryPerWeek === 'number' && career.salaryPerWeek > 0) {
      return Math.round(career.salaryPerWeek / 40);
    }
    return 0;
  }
}
