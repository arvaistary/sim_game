import { 
  CAREER_COMPONENT,
  SKILLS_COMPONENT,
  EDUCATION_COMPONENT,
  PLAYER_ENTITY 
} from '../components/index.js';
import { CAREER_JOBS } from '../../balance/career-jobs.js';

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
    const educationRank = this._getEducationRank(education.educationLevel);
    const currentJobId = career.id;

    return this.careerJobs.map(job => ({
      ...job,
      current: currentJobId === job.id,
      unlocked: professionalism >= job.minProfessionalism && educationRank >= job.minEducationRank,
      missingProfessionalism: Math.max(0, job.minProfessionalism - professionalism),
      educationRequiredLabel: this._getEducationLabelByRank(job.minEducationRank),
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

    if (!skills || !education || !career) {
      return '';
    }

    const professionalism = skills.professionalism ?? 0;
    const educationRank = this._getEducationRank(education.educationLevel);
    const currentLevel = career.level ?? 1;

    // Находим высшую доступную работу
    const unlockedJob = this.careerJobs
      .filter(job => professionalism >= job.minProfessionalism && educationRank >= job.minEducationRank)
      .at(-1);

    if (!unlockedJob || unlockedJob.level <= currentLevel) {
      return '';
    }

    // Обновляем карьерные данные
    Object.assign(career, {
      id: unlockedJob.id,
      name: unlockedJob.name,
      level: unlockedJob.level,
      salaryPerDay: unlockedJob.salaryPerDay,
      salaryPerWeek: unlockedJob.salaryPerWeek,
      daysAtWork: career.daysAtWork ?? 0,
    });

    return `Карьерный рост: новая должность «${unlockedJob.name}», ставка ${this._formatMoney(unlockedJob.salaryPerDay)} ₽ в день.`;
  }

  /**
   * Сменить работу принудительно
   */
  changeCareer(jobId) {
    const playerId = PLAYER_ENTITY;
    const career = this.world.getComponent(playerId, CAREER_COMPONENT);
    const skills = this.world.getComponent(playerId, SKILLS_COMPONENT);
    const education = this.world.getComponent(playerId, EDUCATION_COMPONENT);

    if (!career || !skills || !education) {
      return { success: false, reason: 'Не удалось загрузить данные персонажа' };
    }

    const job = this.careerJobs.find(j => j.id === jobId);
    if (!job) {
      return { success: false, reason: 'Работа не найдена' };
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

    // Применяем изменение
    Object.assign(career, {
      id: job.id,
      name: job.name,
      level: job.level,
      salaryPerDay: job.salaryPerDay,
      salaryPerWeek: job.salaryPerWeek,
      daysAtWork: 0, // Сбрасываем счётчик дней при смене работы
    });

    return { 
      success: true, 
      message: `Вы устроились на должность «${job.name}», ставка ${this._formatMoney(job.salaryPerDay)} ₽ в день.` 
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
