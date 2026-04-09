import { 
  CAREER_COMPONENT,
  WORK_COMPONENT,
  SKILLS_COMPONENT,
  EDUCATION_COMPONENT,
  TIME_COMPONENT,
  PLAYER_ENTITY 
} from '../components/index.js';
import { CAREER_JOBS } from '../../balance/career-jobs.js';
import { SkillsSystem } from './SkillsSystem.js';

/**
 * Система управления карьерным прогрессом
 * Отслеживает требования и автоматически повышает при достижении условий
 */
export class CareerProgressSystem {
  constructor() {
    this.careerJobs = CAREER_JOBS;
  }

  init(world) {
    this.world = world;
    this.skillsSystem = new SkillsSystem();
    this.skillsSystem.init(world);
  }

  /**
   * Получить информацию о всех доступных работах
   */
  getCareerTrack() {
    const playerId = PLAYER_ENTITY;
    const skills = this.world.getComponent(playerId, SKILLS_COMPONENT);
    const education = this.world.getComponent(playerId, EDUCATION_COMPONENT);
    const career = this.world.getComponent(playerId, CAREER_COMPONENT);

    if (!skills || !education || !career) {
      return [];
    }

    const professionalism = skills.professionalism ?? 0;
    const modifiers = this.skillsSystem.getModifiers();
    const educationRank = this._getEducationRank(education.educationLevel);
    const currentJobId = career.id;

      return this.careerJobs.map(job => ({
        ...job,
      current: currentJobId === job.id,
      unlocked: professionalism >= job.minProfessionalism && educationRank >= job.minEducationRank,
      missingProfessionalism: Math.max(0, job.minProfessionalism - professionalism),
      educationRequiredLabel: this._getEducationLabelByRank(job.minEducationRank),
      effectiveSalaryPerHour: Math.round((job.salaryPerHour ?? Math.round((job.salaryPerDay ?? 0) / 8)) * (modifiers.salaryMultiplier ?? 1)),
      effectiveSalaryPerDay: Math.round((job.salaryPerDay ?? ((job.salaryPerHour ?? 0) * 8)) * (modifiers.salaryMultiplier ?? 1)),
    }));
  }

  /**
   * Проверить и применить карьерный рост
   * Возвращает строку с описанием изменений или пустую строку
   */
  syncCareerProgress() {
    const playerId = PLAYER_ENTITY;
    const skills = this.world.getComponent(playerId, SKILLS_COMPONENT);
    const education = this.world.getComponent(playerId, EDUCATION_COMPONENT);
    const career = this.world.getComponent(playerId, CAREER_COMPONENT);
    const work = this.world.getComponent(playerId, WORK_COMPONENT);

    if (!skills || !education || !career) {
      return '';
    }

    const professionalism = skills.professionalism ?? 0;
    const educationRank = this._getEducationRank(education.educationLevel);
    const currentLevel = career.level ?? 1;
    const oldPosition = career.name ?? 'Неизвестно';

    // Находим высшую доступную работу
    const unlockedJob = this.careerJobs
      .filter(job => professionalism >= job.minProfessionalism && educationRank >= job.minEducationRank)
      .at(-1);

    if (!unlockedJob || unlockedJob.level <= currentLevel) {
      return '';
    }

    // Логирование карьерного изменения
    if (this.world && this.world.eventBus) {
      this.world.eventBus.dispatchEvent(new CustomEvent('activity:career', {
        detail: {
          category: 'promotion',
          title: '📈 Повышение!',
          description: `${oldPosition} → ${unlockedJob.name}. Новая ставка: ${this._formatMoney(unlockedJob.salaryPerHour)} ₽/ч`,
          icon: null,
          metadata: {
            oldPosition,
            newPosition: unlockedJob.name,
            newSalary: unlockedJob.salaryPerHour,
          },
        },
      }));
    }

    // Обновляем карьерные данные
    Object.assign(career, {
      id: unlockedJob.id,
      name: unlockedJob.name,
      level: unlockedJob.level,
      salaryPerHour: unlockedJob.salaryPerHour,
      salaryPerDay: unlockedJob.salaryPerDay,
      salaryPerWeek: unlockedJob.salaryPerWeek,
      daysAtWork: career.daysAtWork ?? 0,
    });
    if (work) {
      Object.assign(work, {
        id: unlockedJob.id,
        name: unlockedJob.name,
        level: unlockedJob.level,
        salaryPerHour: unlockedJob.salaryPerHour,
        salaryPerDay: unlockedJob.salaryPerDay,
        salaryPerWeek: unlockedJob.salaryPerWeek,
        schedule: unlockedJob.schedule ?? work.schedule ?? '5/2',
      });
    }

    return `Карьерный рост: новая должность «${unlockedJob.name}», ставка ${this._formatMoney(unlockedJob.salaryPerHour)} ₽ в час.`;
  }

  /**
   * Сменить работу принудительно
   */
  changeCareer(jobId) {
    const playerId = PLAYER_ENTITY;
    const career = this.world.getComponent(playerId, CAREER_COMPONENT);
    const work = this.world.getComponent(playerId, WORK_COMPONENT);
    const skills = this.world.getComponent(playerId, SKILLS_COMPONENT);
    const education = this.world.getComponent(playerId, EDUCATION_COMPONENT);

    if (!career || !skills || !education) {
      return { success: false, reason: 'Не удалось загрузить данные персонажа' };
    }

    const job = this.careerJobs.find(j => j.id === jobId);
    if (!job) {
      return { success: false, reason: 'Работа не найдена' };
    }

    const time = this.world.getComponent(playerId, TIME_COMPONENT);
    const blockedUntil = time?.eventState?.jobRehireBlockedUntilWeekByJobId?.[jobId];
    if (typeof blockedUntil === 'number' && typeof time.gameWeeks === 'number' && time.gameWeeks < blockedUntil) {
      return {
        success: false,
        reason: `Эту должность пока нельзя взять снова: недоступна до начала ${blockedUntil}-й игровой недели (сейчас неделя ${time.gameWeeks}).`,
      };
    }

    // Проверяем требования
    const professionalism = skills.professionalism ?? 0;
    const educationRank = this._getEducationRank(education.educationLevel);

    if (professionalism < job.minProfessionalism) {
      return { 
        success: false, 
        reason: `Недостаточно профессионализма. Нужно ${job.minProfessionalism}, сейчас ${professionalism}.` 
      };
    }

    if (educationRank < job.minEducationRank) {
      return { 
        success: false, 
        reason: `Недостаточно образования. Нужно ${this._getEducationLabelByRank(job.minEducationRank)}.` 
      };
    }

    // Запоминаем старую должность
    const oldPosition = career.name ?? 'Неизвестно';
    const isDemotion = job.level < (career.level ?? 1);

    // Применяем изменение
    Object.assign(career, {
      id: job.id,
      name: job.name,
      level: job.level,
      salaryPerHour: job.salaryPerHour,
      salaryPerDay: job.salaryPerDay,
      salaryPerWeek: job.salaryPerWeek,
      daysAtWork: 0, // Сбрасываем счётчик дней при смене работы
      workedHoursCurrentWeek: 0,
    });
    if (work) {
      Object.assign(work, {
        id: job.id,
        name: job.name,
        level: job.level,
        salaryPerHour: job.salaryPerHour,
        salaryPerDay: job.salaryPerDay,
        salaryPerWeek: job.salaryPerWeek,
        schedule: job.schedule ?? '5/2',
        daysAtWork: 0,
        workedHoursCurrentWeek: 0,
      });
    }

    // Логирование смены работы
    if (this.world && this.world.eventBus) {
      this.world.eventBus.dispatchEvent(new CustomEvent('activity:career', {
        detail: {
          category: isDemotion ? 'demotion' : 'promotion',
          title: isDemotion ? '📉 Понижение' : '📈 Смена должности',
          description: `${oldPosition} → ${job.name}. Ставка: ${this._formatMoney(job.salaryPerHour)} ₽/ч`,
          icon: null,
          metadata: {
            oldPosition,
            newPosition: job.name,
            newSalary: job.salaryPerHour,
          },
        },
      }));
    }

    return {
      success: true,
      message: `Вы устроились на должность «${job.name}», ставка ${this._formatMoney(job.salaryPerHour)} ₽ в час.`
    };
  }

  /**
   * Получить текущую работу
   */
  getCurrentJob() {
    const playerId = PLAYER_ENTITY;
    const career = this.world.getComponent(playerId, CAREER_COMPONENT);
    return career || null;
  }

  /**
   * Получить ранг образования
   */
  _getEducationRank(level) {
    const map = {
      'Среднее': 0,
      'Высшее': 1,
      'MBA': 2,
    };
    return map[level] ?? 0;
  }

  /**
   * Получить метку образования по рангу
   */
  _getEducationLabelByRank(rank) {
    const map = {
      0: 'Среднее',
      1: 'Высшее',
      2: 'MBA',
    };
    return map[rank] ?? 'Среднее';
  }

  /**
   * Форматирование денег
   */
  _formatMoney(value) {
    return new Intl.NumberFormat('ru-RU').format(value);
  }
}
