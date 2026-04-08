import { 
  TIME_COMPONENT, 
  STATS_COMPONENT, 
  WORK_COMPONENT, 
  WALLET_COMPONENT, 
  CAREER_COMPONENT,
  PLAYER_ENTITY 
} from '../components/index.js';
import { CAREER_JOBS } from '../../balance/career-jobs.js';

/**
 * Система обработки рабочих периодов
 * Обрабатывает работу на несколько дней с расчётом зарплаты и изменений статов
 */
export class WorkPeriodSystem {
  constructor() {
    this.baseStatChangesPerDay = {
      hunger: -18,
      energy: -24,
      stress: 12,
      mood: -2,
    };
  }

  init(world) {
    this.world = world;
  }

  /**
   * Применить результат рабочего периода
   */
  applyWorkPeriodResult(workDays, eventChoice = null) {
    const playerId = PLAYER_ENTITY;
    
    const workComponent = this.world.getComponent(playerId, WORK_COMPONENT);
    const walletComponent = this.world.getComponent(playerId, WALLET_COMPONENT);
    const statsComponent = this.world.getComponent(playerId, STATS_COMPONENT);
    const timeComponent = this.world.getComponent(playerId, TIME_COMPONENT);

    if (!workComponent || !walletComponent || !statsComponent || !timeComponent) {
      console.error('Missing required components for work period');
      return '';
    }

    const baseSalaryPerDay = workComponent.salaryPerDay;
    const totalSalary = baseSalaryPerDay * workDays;

    // Расчёт изменений статов
    const totalBaseStatChanges = {};
    Object.entries(this.baseStatChangesPerDay).forEach(([key, value]) => {
      totalBaseStatChanges[key] = value * workDays;
    });

    const eventStatChanges = eventChoice?.statChanges ?? {};
    const combinedStatChanges = this._mergeStatChanges(totalBaseStatChanges, eventStatChanges);

    // Расчёт бонуса от события
    const eventSalaryBonus = Math.round(baseSalaryPerDay * workDays * (eventChoice?.salaryMultiplier ?? 0));
    const totalSalaryWithBonus = totalSalary + eventSalaryBonus;

    // Применение финансовых изменений
    walletComponent.money += totalSalaryWithBonus;
    walletComponent.totalEarnings += totalSalaryWithBonus;

    // Обновление статистики работы
    workComponent.daysAtWork = (workComponent.daysAtWork ?? 0) + workDays;
    
    // Обновление пожизненной статистики
    const lifetimeStats = this.world.getComponent(playerId, 'lifetime_stats');
    if (lifetimeStats) {
      lifetimeStats.totalWorkDays = (lifetimeStats.totalWorkDays ?? 0) + workDays;
    }

    // Применение изменений статов
    this._applyStatChanges(statsComponent, combinedStatChanges);

    // Постоянный бонус к зарплате
    if (eventChoice?.permanentSalaryMultiplier) {
      workComponent.salaryPerDay = Math.round(workComponent.salaryPerDay * (1 + eventChoice.permanentSalaryMultiplier));
      workComponent.salaryPerWeek = workComponent.salaryPerDay * 5;
    }

    // Продвижение времени
    timeComponent.gameDays += workDays;
    timeComponent.gameWeeks = Math.max(1, Math.floor(timeComponent.gameDays / 7));
    timeComponent.gameMonths = Math.max(1, Math.floor(timeComponent.gameDays / 30));
    timeComponent.gameYears = Number((timeComponent.gameDays / 360).toFixed(1));
    timeComponent.currentAge = timeComponent.startAge + Math.floor(timeComponent.gameDays / 360);

    // Синхронизация прогресса карьеры
    const careerUpdateSummary = this._syncCareerProgress();

    // Создание резюме
    return this._buildWorkPeriodSummary(workDays, totalSalaryWithBonus, combinedStatChanges, eventChoice, careerUpdateSummary);
  }

  /**
   * Построить резюме рабочего периода
   */
  _buildWorkPeriodSummary(workDays, salary, statChanges, eventChoice, careerUpdateSummary) {
    const lines = [
      `Рабочий период завершён: ${workDays} дн.`,
      `Выплата: ${this._formatMoney(salary)} ₽.`,
      this._summarizeStatChanges(statChanges),
    ];

    if (eventChoice) {
      lines.push(`Событие: ${eventChoice.label} — ${eventChoice.outcome}`);
    }

    if (careerUpdateSummary) {
      lines.push(careerUpdateSummary);
    }

    return lines.filter(Boolean).join('\n');
  }

  /**
   * Синхронизировать прогресс карьеры
   */
  _syncCareerProgress() {
    const playerId = PLAYER_ENTITY;
    const skillsComponent = this.world.getComponent(playerId, SKILLS_COMPONENT);
    const educationComponent = this.world.getComponent(playerId, EDUCATION_COMPONENT);
    const careerComponent = this.world.getComponent(playerId, CAREER_COMPONENT);

    if (!skillsComponent || !educationComponent || !careerComponent) {
      return '';
    }

    const professionalism = skillsComponent.professionalism ?? 0;
    const educationRank = this._getEducationRank(educationComponent.educationLevel);
    const currentLevel = careerComponent.level ?? 1;

    const unlockedJob = CAREER_JOBS
      .filter(job => professionalism >= job.minProfessionalism && educationRank >= job.minEducationRank)
      .at(-1);

    if (!unlockedJob || unlockedJob.level <= currentLevel) {
      return '';
    }

    // Обновляем карьерные данные
    Object.assign(careerComponent, {
      id: unlockedJob.id,
      name: unlockedJob.name,
      level: unlockedJob.level,
      salaryPerDay: unlockedJob.salaryPerDay,
      salaryPerWeek: unlockedJob.salaryPerWeek,
      daysAtWork: careerComponent.daysAtWork ?? 0,
    });

    return `Карьерный рост: новая должность «${unlockedJob.name}», ставка ${this._formatMoney(unlockedJob.salaryPerDay)} ₽ в день.`;
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
   * Объединить изменения статов
   */
  _mergeStatChanges(...chunks) {
    return chunks.reduce((accumulator, chunk) => {
      Object.entries(chunk ?? {}).forEach(([key, value]) => {
        accumulator[key] = (accumulator[key] ?? 0) + value;
      });
      return accumulator;
    }, {});
  }

  /**
   * Применить изменения статов
   */
  _applyStatChanges(stats, statChanges = {}) {
    for (const [key, value] of Object.entries(statChanges)) {
      stats[key] = this._clamp((stats[key] ?? 0) + value);
    }
  }

  /**
   * Суммировать изменения статов в строку
   */
  _summarizeStatChanges(statChanges = {}) {
    const defs = [
      ['hunger', 'Голод'],
      ['energy', 'Энергия'],
      ['stress', 'Стресс'],
      ['mood', 'Настроение'],
      ['health', 'Здоровье'],
      ['physical', 'Форма'],
    ];

    return defs
      .filter(([key]) => statChanges?.[key])
      .map(([key, label]) => `${label} ${statChanges[key] > 0 ? '+' : ''}${statChanges[key]}`)
      .join(' • ');
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
