import { 
  TIME_COMPONENT, 
  STATS_COMPONENT, 
  WORK_COMPONENT, 
  WALLET_COMPONENT, 
  CAREER_COMPONENT,
  SKILLS_COMPONENT,
  EDUCATION_COMPONENT,
  PLAYER_ENTITY 
} from '../components/index.js';
import { CAREER_JOBS } from '../../balance/career-jobs.js';
import { SkillsSystem } from './SkillsSystem.js';

/**
 * Система обработки рабочих периодов
 * Обрабатывает работу на несколько дней с расчётом зарплаты и изменений статов
 */
export class WorkPeriodSystem {
  constructor() {
    this.baseStatChangesPerHour = {
      hunger: -2.2,
      energy: -2.7,
      stress: 1.9,
      mood: -1.0,
    };
  }

  init(world) {
    this.world = world;
    this.skillsSystem = new SkillsSystem();
    this.skillsSystem.init(world);
  }

  /**
   * Применить рабочую смену в часовой модели.
   */
  applyWorkShift(workHours = 8, eventChoice = null) {
    const playerId = PLAYER_ENTITY;
    
    const workComponent = this.world.getComponent(playerId, WORK_COMPONENT);
    const walletComponent = this.world.getComponent(playerId, WALLET_COMPONENT);
    const statsComponent = this.world.getComponent(playerId, STATS_COMPONENT);
    const timeComponent = this.world.getComponent(playerId, TIME_COMPONENT);

    if (!workComponent || !walletComponent || !statsComponent || !timeComponent) {
      console.error('Missing required components for work period');
      return '';
    }

    const modifiers = this.skillsSystem.getModifiers();
    const baseSalaryPerHour = this._resolveSalaryPerHour(workComponent);
    const effectiveSalaryPerHour = Math.round(baseSalaryPerHour * (modifiers.salaryMultiplier ?? 1) * (modifiers.workEfficiencyMultiplier ?? 1));
    const totalSalary = Math.round(effectiveSalaryPerHour * workHours);

    // Расчёт изменений статов
    const totalBaseStatChanges = {};
    Object.entries(this.baseStatChangesPerHour).forEach(([key, value]) => {
      totalBaseStatChanges[key] = Math.round(value * workHours);
    });
    totalBaseStatChanges.hunger = Math.round(totalBaseStatChanges.hunger * (modifiers.hungerDrainMultiplier ?? 1));
    totalBaseStatChanges.energy = Math.round(totalBaseStatChanges.energy * (modifiers.energyDrainMultiplier ?? 1));
    totalBaseStatChanges.stress = Math.round(totalBaseStatChanges.stress * (modifiers.stressGainMultiplier ?? 1));

    const eventStatChanges = eventChoice?.statChanges ?? {};
    const combinedStatChanges = this._mergeStatChanges(totalBaseStatChanges, eventStatChanges);

    // Расчёт бонуса от события
    const eventSalaryBonus = Math.round(effectiveSalaryPerHour * workHours * (eventChoice?.salaryMultiplier ?? 0));
    const totalSalaryWithBonus = totalSalary + eventSalaryBonus;

    // Применение финансовых изменений
    walletComponent.money += totalSalaryWithBonus;
    walletComponent.totalEarnings += totalSalaryWithBonus;

    // Обновление статистики работы
    workComponent.daysAtWork = (workComponent.daysAtWork ?? 0) + Math.max(1, Math.round(workHours / 8));
    workComponent.workedHoursCurrentWeek = (workComponent.workedHoursCurrentWeek ?? 0) + workHours;
    workComponent.totalWorkedHours = (workComponent.totalWorkedHours ?? 0) + workHours;
    
    // Обновление пожизненной статистики
    const lifetimeStats = this.world.getComponent(playerId, 'lifetime_stats');
    if (lifetimeStats) {
      lifetimeStats.totalWorkDays = (lifetimeStats.totalWorkDays ?? 0) + Math.max(1, Math.round(workHours / 8));
      lifetimeStats.totalWorkHours = (lifetimeStats.totalWorkHours ?? 0) + workHours;
    }

    // Применение изменений статов
    this._applyStatChanges(statsComponent, combinedStatChanges);

    // Постоянный бонус к зарплате
    if (eventChoice?.permanentSalaryMultiplier) {
      workComponent.salaryPerHour = Math.round(baseSalaryPerHour * (1 + eventChoice.permanentSalaryMultiplier));
      workComponent.salaryPerDay = Math.round(workComponent.salaryPerHour * 8);
      workComponent.salaryPerWeek = Math.round(workComponent.salaryPerHour * 40);
    }

    // Продвижение времени
    const timeSystem = this.world.systems.find((system) => typeof system.advanceHours === 'function');
    if (timeSystem) {
      timeSystem.advanceHours(workHours, { actionType: 'work_shift' });
    } else {
      timeComponent.totalHours = (timeComponent.totalHours ?? (timeComponent.gameDays ?? 0) * 24) + workHours;
    }

    // Синхронизация прогресса карьеры
    const careerUpdateSummary = this._syncCareerProgress();

    // Логирование активности
    if (this.world && this.world.eventBus) {
      this.world.eventBus.dispatchEvent(new CustomEvent('activity:action', {
        detail: {
          category: 'work',
          title: '💼 Отработана смена',
          description: `Отработано ${workHours}ч. Заработано $${this._formatMoney(totalSalaryWithBonus)}`,
          icon: null,
          metadata: {
            hoursWorked: workHours,
            earned: totalSalaryWithBonus,
            jobId: workComponent.id,
            jobName: workComponent.name,
          },
        },
      }));
    }

    // Создание резюме
    return this._buildWorkPeriodSummary(workHours, totalSalaryWithBonus, combinedStatChanges, eventChoice, careerUpdateSummary);
  }

  /**
   * Legacy API: поддержка старых вызовов "workDays".
   */
  applyWorkPeriodResult(workDays, eventChoice = null) {
    const days = Math.max(1, Number(workDays) || 1);
    return this.applyWorkShift(days * 8, eventChoice);
  }

  /**
   * Построить резюме рабочего периода
   */
  _buildWorkPeriodSummary(workHours, salary, statChanges, eventChoice, careerUpdateSummary) {
    const lines = [
      `Рабочая смена завершена: ${workHours} ч.`,
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
      salaryPerHour: unlockedJob.salaryPerHour,
      salaryPerDay: unlockedJob.salaryPerDay,
      salaryPerWeek: unlockedJob.salaryPerWeek,
      daysAtWork: careerComponent.daysAtWork ?? 0,
      workedHoursCurrentWeek: careerComponent.workedHoursCurrentWeek ?? 0,
    });

    const workComponent = this.world.getComponent(PLAYER_ENTITY, WORK_COMPONENT);
    if (workComponent) {
      Object.assign(workComponent, {
        id: unlockedJob.id,
        name: unlockedJob.name,
        level: unlockedJob.level,
        salaryPerHour: unlockedJob.salaryPerHour,
        salaryPerDay: unlockedJob.salaryPerDay,
        salaryPerWeek: unlockedJob.salaryPerWeek,
        schedule: unlockedJob.schedule ?? workComponent.schedule ?? '5/2',
      });
    }

    return `Карьерный рост: новая должность «${unlockedJob.name}», ставка ${this._formatMoney(unlockedJob.salaryPerHour)} ₽ в час.`;
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

  _resolveSalaryPerHour(workComponent) {
    if (typeof workComponent.salaryPerHour === 'number' && workComponent.salaryPerHour > 0) {
      return workComponent.salaryPerHour;
    }
    if (typeof workComponent.salaryPerDay === 'number' && workComponent.salaryPerDay > 0) {
      return Math.round(workComponent.salaryPerDay / 8);
    }
    if (typeof workComponent.salaryPerWeek === 'number' && workComponent.salaryPerWeek > 0) {
      return Math.round(workComponent.salaryPerWeek / 40);
    }
    return 0;
  }
}
