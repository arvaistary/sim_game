import {
  WORK_RANDOM_EVENTS,
  GLOBAL_PROGRESS_EVENTS,
  FINANCE_EMERGENCY_EVENTS,
} from "./balance/game-events.js";
import { INITIAL_SAVE } from "./balance/initial-save.js";
import { RECOVERY_TABS } from "./balance/recovery-tabs.js";
import { EDUCATION_PROGRAMS } from "./balance/education-programs.js";
import { CAREER_JOBS } from "./balance/career-jobs.js";
import { EDUCATION_PATHS } from "./balance/education-paths.js";
import { HOUSING_LEVELS } from "./balance/housing-levels.js";
import { LEGACY_FINANCE_SCENE_ACTIONS } from "./balance/legacy-finance-scene-actions.js";
import { WORK_RESULT_TIERS } from "./balance/work-result-tiers.js";
import {
  LEGACY_WORK_PERIOD_RANDOM_EVENT_CHANCE,
  LEGACY_BASE_STAT_CHANGES_PER_WORK_DAY,
} from "./balance/work-economy.js";
import { getEducationRank, getEducationLabelByRank } from "./balance/education-ranks.js";
import { formatStatChangesBulletListRu } from "./shared/stat-changes-format.js";

const DEFAULT_SAVE = INITIAL_SAVE;

export { INITIAL_SAVE as DEFAULT_SAVE };
export {
  WORK_RANDOM_EVENTS,
  GLOBAL_PROGRESS_EVENTS,
  FINANCE_EMERGENCY_EVENTS,
  RECOVERY_TABS,
  EDUCATION_PROGRAMS,
  CAREER_JOBS,
  EDUCATION_PATHS,
  HOUSING_LEVELS,
};

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export function parseSchedule(schedule) {
  if (typeof schedule !== "string") {
    return { workDays: 5, restDays: 2 };
  }
  const parts = schedule.split("/");
  if (parts.length === 2) {
    const workDays = parseInt(parts[0], 10);
    const restDays = parseInt(parts[1], 10);
    if (workDays > 0 && restDays >= 0) {
      return { workDays, restDays };
    }
  }
  return { workDays: 5, restDays: 2 };
}

export function pickWorkPeriodEvent(saveData) {
  const hasEvent = Math.random() < LEGACY_WORK_PERIOD_RANDOM_EVENT_CHANCE;
  if (!hasEvent) {
    return null;
  }

  const availableEvents = WORK_RANDOM_EVENTS.filter((event) => {
    if (event.requiresSkill) {
      const [skillKey, skillValue] = Object.entries(event.requiresSkill)[0];
      if ((saveData.skills?.[skillKey] ?? 0) < skillValue) {
        return false;
      }
    }

    if (typeof event.requiresEducationRank === "number" && getEducationRank(saveData.education?.educationLevel) < event.requiresEducationRank) {
      return false;
    }

    const lastOccurrence = [...(saveData.eventHistory ?? [])]
      .reverse()
      .find((item) => item.eventId === event.id);

    if (lastOccurrence && saveData.gameDays - lastOccurrence.day < event.cooldownDays) {
      return false;
    }

    return true;
  });

  if (availableEvents.length === 0) {
    return null;
  }

  const selectedEvent = availableEvents[Math.floor(Math.random() * availableEvents.length)];
  return clone(selectedEvent);
}

export function applyWorkPeriodResult(saveData, workDays, eventChoice = null) {
  const baseSalaryPerDay = saveData.currentJob.salaryPerDay;
  const totalSalary = baseSalaryPerDay * workDays;

  const totalBaseStatChanges = {};
  Object.entries(LEGACY_BASE_STAT_CHANGES_PER_WORK_DAY).forEach(([key, value]) => {
    totalBaseStatChanges[key] = value * workDays;
  });

  const combinedStatChanges = mergeStatChanges(
    totalBaseStatChanges,
    eventChoice?.statChanges ?? {},
  );

  const eventSalaryBonus = Math.round(baseSalaryPerDay * workDays * (eventChoice?.salaryMultiplier ?? 0));
  const totalSalaryWithBonus = totalSalary + eventSalaryBonus;

  saveData.money += totalSalaryWithBonus;
  saveData.totalEarnings += totalSalaryWithBonus;
  saveData.currentJob.daysAtWork = (saveData.currentJob.daysAtWork ?? 0) + workDays;
  saveData.lifetimeStats.totalWorkDays = (saveData.lifetimeStats.totalWorkDays ?? 0) + workDays;

  applyStatChanges(saveData.stats, combinedStatChanges);

  if (eventChoice?.permanentSalaryMultiplier) {
    saveData.currentJob.salaryPerDay = Math.round(saveData.currentJob.salaryPerDay * (1 + eventChoice.permanentSalaryMultiplier));
    saveData.currentJob.salaryPerWeek = saveData.currentJob.salaryPerDay * 5;
  }

  advanceGameTime(saveData, workDays);

  const careerUpdateSummary = syncCareerProgress(saveData);

  return buildWorkPeriodSummary(workDays, totalSalaryWithBonus, combinedStatChanges, eventChoice, careerUpdateSummary);
}

export function applyPeriodEventChoiceToSave(saveData, event, eventChoice, workDays) {
  const baseSalaryPerDay = saveData.currentJob.salaryPerDay;
  const totalSalary = baseSalaryPerDay * workDays;

  const totalBaseStatChanges = {};
  Object.entries(LEGACY_BASE_STAT_CHANGES_PER_WORK_DAY).forEach(([key, value]) => {
    totalBaseStatChanges[key] = value * workDays;
  });

  const combinedStatChanges = mergeStatChanges(
    totalBaseStatChanges,
    eventChoice?.statChanges ?? {},
  );

  const eventSalaryBonus = Math.round(baseSalaryPerDay * workDays * (eventChoice?.salaryMultiplier ?? 0));
  const totalSalaryWithBonus = totalSalary + eventSalaryBonus;

  saveData.money += totalSalaryWithBonus;
  saveData.totalEarnings += totalSalaryWithBonus;
  saveData.currentJob.daysAtWork = (saveData.currentJob.daysAtWork ?? 0) + workDays;
  saveData.lifetimeStats.totalWorkDays = (saveData.lifetimeStats.totalWorkDays ?? 0) + workDays;

  applyStatChanges(saveData.stats, combinedStatChanges);
  applySkillChanges(saveData.skills, eventChoice?.skillChanges);

  if (eventChoice?.permanentSalaryMultiplier) {
    saveData.currentJob.salaryPerDay = Math.round(saveData.currentJob.salaryPerDay * (1 + eventChoice.permanentSalaryMultiplier));
    saveData.currentJob.salaryPerWeek = saveData.currentJob.salaryPerDay * 5;
  }

  recordEvent(saveData, event.id, event.title);
  advanceGameTime(saveData, workDays);

  const careerUpdateSummary = syncCareerProgress(saveData);

  return buildWorkPeriodSummary(workDays, totalSalaryWithBonus, combinedStatChanges, eventChoice, careerUpdateSummary);
}

export function buildWorkPeriodSummary(workDays, salary, statChanges, eventChoice, careerUpdateSummary) {
  const lines = [
    `Рабочий период завершён: ${workDays} дн.`,
    `Выплата: ${formatMoney(salary)} ₽.`,
    summarizeStatChanges(statChanges),
  ];

  if (eventChoice) {
    lines.push(`Событие: ${eventChoice.label} — ${eventChoice.outcome}`);
  }

  if (careerUpdateSummary) {
    lines.push(careerUpdateSummary);
  }

  return lines.filter(Boolean).join("\n");
}

export function clone(value) {
  return structuredClone(value);
}

export function loadSave() {
  const stored = window.localStorage.getItem("game-life-save");

  if (!stored) {
    return clone(DEFAULT_SAVE);
  }

  try {
    const parsed = JSON.parse(stored);
    const defaultCurrentJob = DEFAULT_SAVE.currentJob ?? {};
    const parsedCurrentJob = parsed.currentJob ?? {};
    return {
      ...clone(DEFAULT_SAVE),
      ...parsed,
      stats: {
        ...DEFAULT_SAVE.stats,
        ...(parsed.stats ?? {}),
      },
      currentJob: {
        ...defaultCurrentJob,
        ...parsedCurrentJob,
      },
      housing: {
        ...DEFAULT_SAVE.housing,
        ...(parsed.housing ?? {}),
        furniture: parsed.housing?.furniture ?? DEFAULT_SAVE.housing.furniture,
      },
      skills: {
        ...DEFAULT_SAVE.skills,
        ...(parsed.skills ?? {}),
      },
      education: {
        ...DEFAULT_SAVE.education,
        ...(parsed.education ?? {}),
        activeCourses: parsed.education?.activeCourses ?? DEFAULT_SAVE.education.activeCourses,
      },
      finance: {
        ...DEFAULT_SAVE.finance,
        ...(parsed.finance ?? {}),
        monthlyExpenses: {
          ...DEFAULT_SAVE.finance.monthlyExpenses,
          ...(parsed.finance?.monthlyExpenses ?? {}),
        },
      },
      relationships: parsed.relationships ?? DEFAULT_SAVE.relationships,
      investments: parsed.investments ?? DEFAULT_SAVE.investments,
      eventHistory: parsed.eventHistory ?? DEFAULT_SAVE.eventHistory,
      pendingEvents: parsed.pendingEvents ?? DEFAULT_SAVE.pendingEvents,
      lifetimeStats: {
        ...DEFAULT_SAVE.lifetimeStats,
        ...(parsed.lifetimeStats ?? {}),
      },
    };
  } catch (error) {
    console.warn("Не удалось прочитать сохранение, использую демо-данные.", error);
    return clone(DEFAULT_SAVE);
  }
}

export function saveGame(saveData) {
  saveData.saveTime = Date.now();
  window.localStorage.setItem("game-life-save", JSON.stringify(saveData));
}

export function resetGame() {
  localStorage.removeItem("game-life-save");
  return clone(DEFAULT_SAVE);
}

export function persistSave(scene, saveData) {
  saveData.lifetimeStats.maxMoney = Math.max(saveData.lifetimeStats.maxMoney ?? 0, saveData.money);
  scene.saveData = saveData;
  scene.registry.set("saveData", saveData);
  saveGame(saveData);
}

export function formatMoney(value) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

export function validateRecoveryAction(saveData, cardData) {
  if (saveData.money < cardData.price) {
    return { ok: false, reason: `Недостаточно денег. Нужно ${formatMoney(cardData.price)} ₽, а сейчас доступно ${formatMoney(saveData.money)} ₽.` };
  }

  if (cardData.furnitureId && hasFurniture(saveData, cardData.furnitureId)) {
    return { ok: false, reason: "Это улучшение уже куплено. Лучше выбрать другой шаг восстановления." };
  }

  if (cardData.educationLevel === "Высшее" && saveData.education.educationLevel === "Высшее") {
    return { ok: false, reason: "Этот образовательный шаг уже закрыт. Можно сосредоточиться на курсах или следующей карьерной цели." };
  }

  if (cardData.housingUpgradeLevel) {
    const currentLevel = saveData.housing?.level ?? 1;
    if (cardData.housingUpgradeLevel <= currentLevel) {
      return { ok: false, reason: "Этот уровень жилья уже открыт. Лучше выбрать другое улучшение дома." };
    }

    if (cardData.housingUpgradeLevel > currentLevel + 1) {
      return { ok: false, reason: "Нельзя перепрыгнуть через уровень жилья. Сначала открой следующий доступный вариант." };
    }
  }

  if (cardData.housingSetLevel) {
    const currentLevel = saveData.housing?.level ?? 1;
    if (cardData.housingSetLevel === currentLevel) {
      return { ok: false, reason: "Этот уровень жилья уже активен." };
    }
  }

  return { ok: true };
}

export function applyRecoveryActionToSave(saveData, cardData) {
  const passive = getPassiveBonuses(saveData);
  const statChanges = { ...(cardData.statChanges ?? {}) };
  const isAssetTransfer = Boolean(cardData.reserveDelta || cardData.investmentReturn);

  if (cardData.title.includes("перекус") || cardData.title.includes("обед")) {
    statChanges.hunger = Math.round((statChanges.hunger ?? 0) * passive.foodRecoveryMultiplier);
  }

  if (cardData.title === "Вечер дома") {
    statChanges.mood = (statChanges.mood ?? 0) + passive.homeMoodBonus;
  }

  saveData.money -= cardData.price;
  if (!isAssetTransfer) {
    saveData.totalSpent += cardData.price;
  }
  applyStatChanges(saveData.stats, statChanges);
  applySkillChanges(saveData.skills, cardData.skillChanges);

  if (cardData.housingComfortDelta) {
    saveData.housing.comfort = clamp(saveData.housing.comfort + cardData.housingComfortDelta);
  }

  if (cardData.housingUpgradeLevel) {
    const housingTier = HOUSING_LEVELS.find((item) => item.level === cardData.housingUpgradeLevel);
    if (housingTier) {
      saveData.housing.level = housingTier.level;
      saveData.housing.name = housingTier.name;
      saveData.housing.comfort = Math.max(saveData.housing.comfort, housingTier.baseComfort);
      saveData.finance.monthlyExpenses.housing = housingTier.monthlyHousingCost;
    }
  }

  if (cardData.housingSetLevel) {
    const housingTier = HOUSING_LEVELS.find((item) => item.level === cardData.housingSetLevel);
    if (housingTier) {
      saveData.housing.level = housingTier.level;
      saveData.housing.name = housingTier.name;
      saveData.housing.comfort = Math.min(saveData.housing.comfort, housingTier.baseComfort + 12);
      saveData.finance.monthlyExpenses.housing = housingTier.monthlyHousingCost;
    }
  }

  if (cardData.furnitureId) {
    saveData.housing.furniture.push({ id: cardData.furnitureId, level: 1 });
  }

  applyRelationshipDelta(saveData, cardData.relationshipDelta);

  if (cardData.reserveDelta) {
    saveData.finance.reserveFund = Math.max(0, (saveData.finance?.reserveFund ?? 0) + cardData.reserveDelta);
  }

  if (cardData.investmentReturn) {
    openInvestment(saveData, {
      type: "deposit",
      label: cardData.title,
      amount: cardData.price,
      expectedReturn: cardData.investmentReturn,
      durationDays: cardData.investmentDurationDays ?? 28,
    });
  }

  if (cardData.salaryMultiplierDelta) {
    saveData.currentJob.salaryPerDay = Math.round(saveData.currentJob.salaryPerDay * (1 + cardData.salaryMultiplierDelta));
    saveData.currentJob.salaryPerWeek = saveData.currentJob.salaryPerDay * 5;
  }

  if (cardData.educationLevel) {
    saveData.education.educationLevel = cardData.educationLevel;
    saveData.education.institute = "completed";
  }

  const hourCost = typeof cardData.hourCost === "number" && cardData.hourCost > 0
    ? cardData.hourCost
    : Math.max(1, Number(cardData.dayCost ?? 1)) * 2;
  advanceGameTime(saveData, hourCost / 24);

  return buildRecoverySummary(cardData, statChanges);
}

export function buildWorkOutcome(saveData, clickCount) {
  const tier = WORK_RESULT_TIERS.find((item) => clickCount >= item.minClicks) ?? WORK_RESULT_TIERS.at(-1);
  const workEvent = pickWorkEvent(saveData, clickCount);
  const baseSalary = calculateWorkDaySalary(saveData.currentJob.salaryPerDay, tier.salaryMultiplier);

  return {
    ...tier,
    baseSalary,
    workEvent,
    clickCount,
    previewText: [
      tier.description,
      `${clickCount} кликов за 10 секунд`,
      `Базовая выплата: ${formatMoney(baseSalary)} ₽`,
      workEvent ? `Сценарное событие: ${workEvent.title}` : "Сценарное событие не сработало",
    ].join("\n"),
  };
}

export function applyWorkOutcomeToSave(saveData, outcome, eventChoice) {
  const passive = getPassiveBonuses(saveData);
  const combinedStatChanges = mergeStatChanges(
    outcome.statChanges,
    eventChoice?.statChanges,
    {
      energy: Math.round(((outcome.statChanges.energy ?? 0) + (eventChoice?.statChanges?.energy ?? 0)) * (passive.workEnergyMultiplier - 1)),
    },
  );
  const salary = calculateWorkDaySalary(outcome.baseSalary, eventChoice?.salaryMultiplier ?? 0);

  saveData.money += salary;
  saveData.totalEarnings += salary;
  saveData.currentJob.daysAtWork = (saveData.currentJob.daysAtWork ?? 0) + 1;
  saveData.lifetimeStats.totalWorkDays = (saveData.lifetimeStats.totalWorkDays ?? 0) + 1;

  applyStatChanges(saveData.stats, combinedStatChanges);

  if (eventChoice?.permanentSalaryMultiplier) {
    saveData.currentJob.salaryPerDay = Math.round(saveData.currentJob.salaryPerDay * (1 + eventChoice.permanentSalaryMultiplier));
    saveData.currentJob.salaryPerWeek = saveData.currentJob.salaryPerDay * 5;
  }

  if (outcome.workEvent) {
    recordEvent(saveData, outcome.workEvent.id, outcome.workEvent.title);
  }

  advanceGameTime(saveData, 1);

  const careerUpdateSummary = syncCareerProgress(saveData);

  return buildWorkSummary(outcome, salary, combinedStatChanges, eventChoice, careerUpdateSummary);
}

export function consumePendingEvent(saveData) {
  if (!saveData.pendingEvents?.length) {
    return null;
  }

  return saveData.pendingEvents.shift() ?? null;
}

export function applyQueuedEventChoice(saveData, queuedEvent, choiceIndex) {
  const choice = queuedEvent?.choices?.[choiceIndex];
  if (!queuedEvent || !choice) {
    return "";
  }

  saveData.money += choice.moneyDelta ?? 0;
  saveData.totalEarnings += Math.max(0, choice.moneyDelta ?? 0);
  saveData.totalSpent += Math.max(0, -(choice.moneyDelta ?? 0));
  applyStatChanges(saveData.stats, choice.statChanges);
  applySkillChanges(saveData.skills, choice.skillChanges);
  applyRelationshipDelta(saveData, choice.relationshipDelta);
  applyMonthlyExpenseDelta(saveData, choice.monthlyExpenseDelta);

  if (choice.housingLevelDelta) {
    shiftHousingLevel(saveData, choice.housingLevelDelta);
  }

  recordEvent(saveData, queuedEvent.id, queuedEvent.title);

  return [
    `${queuedEvent.title}`,
    choice.outcome,
    summarizeStatChanges(choice.statChanges),
    typeof choice.moneyDelta === "number" && choice.moneyDelta !== 0
      ? `Деньги ${choice.moneyDelta > 0 ? "+" : ""}${formatMoney(choice.moneyDelta)} ₽`
      : "",
    choice.housingLevelDelta
      ? `Жильё: ${saveData.housing.name}`
      : "",
  ].filter(Boolean).join("\n");
}

export function canStartEducationProgram(saveData, program) {
  if (saveData.money < program.cost) {
    return { ok: false, reason: `Недостаточно денег. Нужно ${formatMoney(program.cost)} ₽.` };
  }

  if (saveData.education.activeCourses?.length) {
    return { ok: false, reason: "Сейчас уже идёт обучение. Сначала заверши активный курс." };
  }

  if (program.educationLevel && saveData.education.educationLevel === program.educationLevel) {
    return { ok: false, reason: "Этот уровень образования уже получен." };
  }

  return { ok: true };
}

export function getCareerTrack(saveData) {
  const professionalism = saveData.skills?.professionalism ?? 0;
  const educationRank = getEducationRank(saveData.education?.educationLevel);
  const currentAge = saveData.currentAge ?? saveData.startAge ?? 18;
  const currentJobId = saveData.currentJob?.id;

  return CAREER_JOBS.map((job) => ({
    ...job,
    current: currentJobId === job.id,
    unlocked: professionalism >= job.minProfessionalism && educationRank >= job.minEducationRank && currentAge >= (job.minAge ?? 16),
    missingProfessionalism: Math.max(0, job.minProfessionalism - professionalism),
    missingAge: Math.max(0, (job.minAge ?? 16) - currentAge),
    educationRequiredLabel: getEducationLabelByRank(job.minEducationRank),
  }));
}

export function changeCareerToSave(saveData, jobId) {
  const careerTrack = getCareerTrack(saveData);
  const targetJob = careerTrack.find((job) => job.id === jobId);
  if (!targetJob) {
    return { ok: false, reason: "Такой должности нет в карьерном треке." };
  }

  if (targetJob.current) {
    return { ok: false, reason: "Эта должность уже выбрана." };
  }

  if (!targetJob.unlocked) {
    const missingParts = [];
    if ((targetJob.missingProfessionalism ?? 0) > 0) {
      missingParts.push(`проф. +${targetJob.missingProfessionalism}`);
    }
    if ((targetJob.missingAge ?? 0) > 0) {
      missingParts.push(`возраст +${targetJob.missingAge} лет`);
    }
    const requiredEducation = targetJob.educationRequiredLabel;
    const currentEducation = saveData.education?.educationLevel ?? "Нет";
    if (requiredEducation && requiredEducation !== "Нет" && requiredEducation !== currentEducation) {
      missingParts.push(`образование ${requiredEducation}`);
    }
    const reasonText = missingParts.length > 0 ? missingParts.join(", ") : "требования пока не выполнены";
    return { ok: false, reason: `Пока нельзя выбрать эту работу: ${reasonText}.` };
  }

  const currentJob = saveData.currentJob ?? {};
  saveData.currentJob = {
    ...currentJob,
    ...targetJob,
    daysAtWork: 0,
  };

  return {
    ok: true,
    summary: `Новая работа: «${targetJob.name}». Ставка ${formatMoney(targetJob.salaryPerDay)} ₽ в день.`,
  };
}

export function getFinanceOverview(saveData) {
  const monthlyExpenses = saveData.finance?.monthlyExpenses ?? DEFAULT_SAVE.finance.monthlyExpenses;
  const expenseLines = [
    { id: "housing", label: "Жильё", amount: monthlyExpenses.housing ?? 0 },
    { id: "food", label: "Еда", amount: monthlyExpenses.food ?? 0 },
    { id: "transport", label: "Транспорт", amount: monthlyExpenses.transport ?? 0 },
    { id: "leisure", label: "Досуг", amount: monthlyExpenses.leisure ?? 0 },
    { id: "education", label: "Обучение", amount: monthlyExpenses.education ?? 0 },
  ];
  const monthlyExpensesTotal = expenseLines.reduce((sum, item) => sum + item.amount, 0);
  const monthlyIncome = (saveData.currentJob?.salaryPerWeek ?? 0) * 4;
  const reserveFund = saveData.finance?.reserveFund ?? 0;
  const activeInvestments = (saveData.investments ?? []).map((investment) => {
    const state = getInvestmentState(investment, saveData.gameDays);
    return {
      ...investment,
      state,
      maturityDay: investment.maturityDay ?? ((investment.startDate ?? 0) + (investment.durationDays ?? 28)),
      daysLeft: Math.max(0, (investment.maturityDay ?? ((investment.startDate ?? 0) + (investment.durationDays ?? 28))) - saveData.gameDays),
      payoutAmount: (investment.amount ?? 0) + (investment.expectedReturn ?? 0),
    };
  });
  const investedTotal = activeInvestments
    .filter((item) => item.state !== "closed")
    .reduce((sum, item) => sum + (item.amount ?? 0), 0);
  const expectedReturnTotal = activeInvestments
    .filter((item) => item.state !== "closed")
    .reduce((sum, item) => sum + (item.expectedReturn ?? 0), 0);

  return {
    liquidMoney: saveData.money,
    reserveFund,
    investedTotal,
    expectedReturnTotal,
    monthlyIncome,
    monthlyExpensesTotal,
    monthlyBalance: monthlyIncome - monthlyExpensesTotal,
    expenseLines,
    investments: activeInvestments.filter((item) => item.state !== "closed"),
    lastMonthlySettlement: saveData.finance?.lastMonthlySettlement ?? null,
  };
}

export function getHousingOverview(saveData) {
  const currentLevel = saveData.housing?.level ?? 1;
  const currentTier = HOUSING_LEVELS.find((item) => item.level === currentLevel) ?? HOUSING_LEVELS[0];
  const nextTier = HOUSING_LEVELS.find((item) => item.level === currentLevel + 1) ?? null;
  const passive = getPassiveBonuses(saveData);
  const weeklyBonus = buildWeeklyHousingBonus(saveData);

  return {
    currentTier,
    nextTier,
    comfort: saveData.housing?.comfort ?? currentTier.baseComfort,
    furnitureCount: saveData.housing?.furniture?.length ?? 0,
    passive,
    weeklyBonus: {
      ...weeklyBonus,
      summary: summarizeStatChanges(weeklyBonus),
    },
    lastWeeklyBonus: saveData.housing?.lastWeeklyBonus ?? null,
  };
}

export function getFinanceActions(saveData) {
  const overview = getFinanceOverview(saveData);
  return LEGACY_FINANCE_SCENE_ACTIONS.map((action) => ({
    ...action,
    available: overview.liquidMoney >= action.amount,
    reason: overview.liquidMoney >= action.amount ? "" : `Нужно ${formatMoney(action.amount)} ₽ свободных денег.`,
  }));
}

export function applyFinanceActionToSave(saveData, actionId) {
  const action = LEGACY_FINANCE_SCENE_ACTIONS.find((item) => item.id === actionId);
  if (!action) {
    return "Финансовое действие не найдено.";
  }

  if (saveData.money < action.amount) {
    return `Недостаточно свободных денег. Нужно ${formatMoney(action.amount)} ₽.`;
  }

  if (action.id === "reserve_transfer") {
    saveData.money -= action.amount;
    saveData.finance.reserveFund = Math.max(0, (saveData.finance?.reserveFund ?? 0) + action.reserveDelta);
  }

  if (action.id === "open_deposit") {
    saveData.money -= action.amount;
    openInvestment(saveData, {
      type: "deposit",
      label: action.title,
      amount: action.amount,
      expectedReturn: action.expectedReturn,
      durationDays: action.durationDays,
    });
  }

  if (action.id === "budget_review") {
    Object.entries(action.monthlyExpenseDelta ?? {}).forEach(([key, value]) => {
      const currentValue = saveData.finance.monthlyExpenses[key] ?? 0;
      saveData.finance.monthlyExpenses[key] = Math.max(0, currentValue + value);
    });
  }

  applyStatChanges(saveData.stats, action.statChanges);
  applySkillChanges(saveData.skills, action.skillChanges);
  const hourCost = typeof action.hourCost === "number" && action.hourCost > 0
    ? action.hourCost
    : Math.max(1, Number(action.dayCost ?? 1)) * 2;
  advanceGameTime(saveData, hourCost / 24);

  return [
    `${action.title} выполнено.`,
    action.description,
    summarizeStatChanges(action.statChanges),
  ].filter(Boolean).join("\n");
}

export function collectInvestmentToSave(saveData, investmentId) {
  const investment = saveData.investments?.find((item) => item.id === investmentId);
  if (!investment) {
    return "Инвестиция не найдена.";
  }

  const state = getInvestmentState(investment, saveData.gameDays);
  if (state === "closed") {
    return "Эта инвестиция уже закрыта.";
  }

  if (state !== "matured") {
    const maturityDay = investment.maturityDay ?? ((investment.startDate ?? 0) + (investment.durationDays ?? 28));
    return `Пока рано. До закрытия вклада осталось ${Math.max(0, maturityDay - saveData.gameDays)} д.`;
  }

  const payoutAmount = (investment.amount ?? 0) + (investment.expectedReturn ?? 0);
  saveData.money += payoutAmount;
  saveData.totalEarnings += investment.expectedReturn ?? 0;
  investment.totalEarned = (investment.totalEarned ?? 0) + (investment.expectedReturn ?? 0);
  investment.closedAt = saveData.gameDays;
  investment.status = "closed";

  return [
    `${investment.label ?? "Инвестиция"} закрыта.`,
    `Возвращено ${formatMoney(payoutAmount)} ₽, из них доход ${formatMoney(investment.expectedReturn ?? 0)} ₽.`,
  ].join("\n");
}

export function startEducationProgram(saveData, program) {
  saveData.money -= program.cost;
  saveData.totalSpent += program.cost;

  const activeCourse = {
    id: program.id,
    name: program.title,
    type: program.typeLabel,
    progress: 0,
    daysRequired: program.daysRequired,
    daysSpent: 0,
    hoursRequired: typeof program.hoursRequired === "number" && program.hoursRequired > 0
      ? program.hoursRequired
      : Math.max(1, Number(program.daysRequired ?? 1)) * 4,
    hoursSpent: 0,
    costPaid: program.cost,
  };

  saveData.education.activeCourses = [activeCourse];

  return [
    `${program.title} начат.`,
    `Стоимость: ${formatMoney(program.cost)} ₽.`,
    `Понадобится ${activeCourse.hoursRequired} ч. обучения.`,
  ].join("\n");
}

export function advanceEducationCourseDay(saveData, courseId) {
  const course = saveData.education.activeCourses?.find((item) => item.id === courseId);
  const program = EDUCATION_PROGRAMS.find((item) => item.id === courseId);

  if (!course || !program) {
    return { completed: false, summary: "Активный курс не найден." };
  }

  const studyHoursPerStep = 4;
  const hoursRequired = typeof course.hoursRequired === "number" && course.hoursRequired > 0
    ? course.hoursRequired
    : Math.max(1, Number(course.daysRequired ?? 1)) * studyHoursPerStep;
  advanceGameTime(saveData, studyHoursPerStep / 24);
  course.daysSpent += 1;
  course.hoursSpent = (course.hoursSpent ?? (course.daysSpent - 1) * studyHoursPerStep) + studyHoursPerStep;
  course.hoursRequired = hoursRequired;
  course.progress = clamp(course.hoursSpent / hoursRequired, 0, 1);

  applyStatChanges(saveData.stats, {
    energy: -10,
    stress: 8,
    mood: -3,
  });

  if (course.hoursSpent < hoursRequired) {
    return {
      completed: false,
      summary: [
        `Учебная сессия завершена: ${course.name}.`,
        `Прогресс: ${Math.round(course.progress * 100)}% (${course.hoursSpent}/${hoursRequired} ч.).`,
        "Энергия -10 • Стресс +8 • Настроение -3",
      ].join("\n"),
    };
  }

  applySkillChanges(saveData.skills, program.completionSkillChanges);
  applyStatChanges(saveData.stats, program.completionStatChanges);

  if (program.salaryMultiplierDelta) {
    saveData.currentJob.salaryPerDay = Math.round(saveData.currentJob.salaryPerDay * (1 + program.salaryMultiplierDelta));
    saveData.currentJob.salaryPerWeek = saveData.currentJob.salaryPerDay * 5;
  }

  if (program.educationLevel) {
    saveData.education.educationLevel = program.educationLevel;
    saveData.education.institute = "completed";
  }

  const careerUpdateSummary = syncCareerProgress(saveData);
  saveData.education.activeCourses = saveData.education.activeCourses.filter((item) => item.id !== courseId);

  return {
    completed: true,
    summary: [
      `${program.title} завершён.`,
      program.rewardText,
      careerUpdateSummary,
      "Последний учебный день тоже повлиял на ресурсы: Энергия -10 • Стресс +8 • Настроение -3",
    ].join("\n"),
  };
}

function buildRecoverySummary(cardData, statChanges) {
  const changes = summarizeStatChanges(statChanges);
  const hourCost = typeof cardData.hourCost === "number" && cardData.hourCost > 0
    ? cardData.hourCost
    : Math.max(1, Number(cardData.dayCost ?? 1)) * 2;
  return [
    `${cardData.title} завершено.`,
    `Потрачено: ${formatMoney(cardData.price)} ₽`,
    `Время: ${hourCost} ч.`,
    changes || "Шкалы без заметных изменений.",
  ].join("\n");
}

function buildWorkSummary(outcome, salary, statChanges, eventChoice, careerUpdateSummary) {
  const lines = [
    `${outcome.grade}. Выплата за день: ${formatMoney(salary)} ₽.`,
    summarizeStatChanges(statChanges),
  ];

  if (eventChoice && outcome.workEvent) {
    lines.push(`Событие: ${outcome.workEvent.title} — ${eventChoice.outcome}`);
  }

  if (careerUpdateSummary) {
    lines.push(careerUpdateSummary);
  }

  return lines.filter(Boolean).join("\n");
}

function summarizeStatChanges(statChanges = {}) {
  return formatStatChangesBulletListRu(statChanges);
}

function pickWorkEvent(saveData, clickCount) {
  const availableEvents = WORK_RANDOM_EVENTS.filter((event) => {
    if (typeof event.minClicks === "number" && clickCount < event.minClicks) {
      return false;
    }

    if (event.requiresSkill) {
      const [skillKey, skillValue] = Object.entries(event.requiresSkill)[0];
      if ((saveData.skills?.[skillKey] ?? 0) < skillValue) {
        return false;
      }
    }

    if (typeof event.requiresEducationRank === "number" && getEducationRank(saveData.education?.educationLevel) < event.requiresEducationRank) {
      return false;
    }

    const lastOccurrence = [...(saveData.eventHistory ?? [])]
      .reverse()
      .find((item) => item.eventId === event.id);

    if (lastOccurrence && saveData.gameDays - lastOccurrence.day < event.cooldownDays) {
      return false;
    }

    return Math.random() < event.probability;
  });

  if (availableEvents.length === 0) {
    return null;
  }

  return availableEvents[Math.floor(Math.random() * availableEvents.length)];
}

function calculateWorkDaySalary(baseSalary, multiplierDelta = 0) {
  return Math.max(0, Math.round(baseSalary * (1 + multiplierDelta)));
}

function mergeStatChanges(...chunks) {
  return chunks.reduce((accumulator, chunk) => {
    Object.entries(chunk ?? {}).forEach(([key, value]) => {
      accumulator[key] = (accumulator[key] ?? 0) + value;
    });
    return accumulator;
  }, {});
}

export function applyStatChanges(stats, statChanges = {}) {
  Object.entries(statChanges ?? {}).forEach(([key, value]) => {
    stats[key] = clamp((stats[key] ?? 0) + value);
  });
}

export function applySkillChanges(skills, skillChanges = {}) {
  Object.entries(skillChanges ?? {}).forEach(([key, value]) => {
    skills[key] = clamp((skills[key] ?? 0) + value, 0, 10);
  });
}

function getPassiveBonuses(saveData) {
  const comfortRatio = clamp((saveData.housing?.comfort ?? 0) / 100, 0, 1);
  const housingLevel = saveData.housing?.level ?? 1;

  return {
    foodRecoveryMultiplier: (hasFurniture(saveData, "refrigerator") ? 1.2 : 1) + comfortRatio * 0.08,
    workEnergyMultiplier: Math.max(0.78, (hasFurniture(saveData, "good_bed") ? 0.9 : 1) - comfortRatio * 0.08 - (housingLevel - 1) * 0.02),
    homeMoodBonus: (hasFurniture(saveData, "decor_light") ? 6 : 0) + Math.round(comfortRatio * 4) + (housingLevel - 1) * 2,
  };
}

function hasFurniture(saveData, furnitureId) {
  return Boolean(saveData.housing?.furniture?.some((item) => item.id === furnitureId));
}

function openInvestment(saveData, config) {
  const durationDays = config.durationDays ?? 28;
  saveData.investments.push({
    id: `${config.type}_${saveData.investments.length + 1}`,
    type: config.type,
    label: config.label,
    amount: config.amount,
    startDate: saveData.gameDays,
    durationDays,
    maturityDay: saveData.gameDays + durationDays,
    expectedReturn: config.expectedReturn ?? 0,
    totalEarned: 0,
    status: "active",
  });
}

function getInvestmentState(investment, currentDay) {
  if (investment.status === "closed") {
    return "closed";
  }

  const maturityDay = investment.maturityDay ?? ((investment.startDate ?? 0) + (investment.durationDays ?? 28));
  if (currentDay >= maturityDay) {
    return "matured";
  }

  return "active";
}

function applyMonthlyExpenseDelta(saveData, expenseDelta = {}) {
  Object.entries(expenseDelta ?? {}).forEach(([key, value]) => {
    const currentValue = saveData.finance.monthlyExpenses[key] ?? 0;
    saveData.finance.monthlyExpenses[key] = Math.max(0, currentValue + value);
  });
}

export function shiftHousingLevel(saveData, delta) {
  const currentLevel = saveData.housing?.level ?? 1;
  const nextLevel = currentLevel + delta;
  const clampedLevel = Math.max(1, Math.min(HOUSING_LEVELS.length, nextLevel));
  const tier = HOUSING_LEVELS.find((item) => item.level === clampedLevel) ?? HOUSING_LEVELS[0];
  saveData.housing.level = tier.level;
  saveData.housing.name = tier.name;
  saveData.housing.comfort = Math.max(tier.baseComfort, Math.min(saveData.housing.comfort, tier.baseComfort + 18));
  saveData.finance.monthlyExpenses.housing = tier.monthlyHousingCost;
}

function applyRelationshipDelta(saveData, relationshipDelta) {
  if (!relationshipDelta) {
    return;
  }

  const firstRelationship = saveData.relationships?.[0];
  if (!firstRelationship) {
    return;
  }

  firstRelationship.level = clamp(firstRelationship.level + relationshipDelta);
  firstRelationship.lastContact = saveData.gameDays;
}

function buildWeeklyHousingBonus(saveData) {
  const comfortRatio = clamp((saveData.housing?.comfort ?? 0) / 100, 0, 1);
  const housingLevel = saveData.housing?.level ?? 1;
  const passive = getPassiveBonuses(saveData);

  return {
    energy: Math.round(2 + comfortRatio * 5 + (housingLevel - 1) * 2),
    mood: Math.round(2 + passive.homeMoodBonus * 0.4),
    stress: -Math.round(1 + comfortRatio * 3 + (housingLevel - 1)),
    health: hasFurniture(saveData, "good_bed") ? 2 : 1,
  };
}

export function applyWeeklyHousingPassive(saveData, weekNumber) {
  const weeklyBonus = buildWeeklyHousingBonus(saveData);
  applyStatChanges(saveData.stats, weeklyBonus);
  saveData.housing.lastWeeklyBonus = {
    week: weekNumber,
    summary: summarizeStatChanges(weeklyBonus),
  };
}

export function applyMonthlyFinanceSettlement(saveData, monthNumber) {
  const monthlyExpenses = saveData.finance?.monthlyExpenses ?? DEFAULT_SAVE.finance.monthlyExpenses;
  const monthlyTotal = Object.values(monthlyExpenses).reduce((sum, value) => sum + value, 0);
  const liquidPaid = Math.min(saveData.money, monthlyTotal);
  saveData.money -= liquidPaid;

  const remaining = monthlyTotal - liquidPaid;
  const reservePaid = Math.min(saveData.finance.reserveFund ?? 0, remaining);
  saveData.finance.reserveFund = Math.max(0, (saveData.finance.reserveFund ?? 0) - reservePaid);

  const shortage = Math.max(0, remaining - reservePaid);
  saveData.totalSpent += monthlyTotal - shortage;

  if (shortage > 0) {
    applyStatChanges(saveData.stats, {
      stress: Math.min(18, 8 + Math.round(shortage / 10000)),
      mood: -Math.min(16, 6 + Math.round(shortage / 12000)),
      health: -Math.min(10, 3 + Math.round(shortage / 18000)),
    });
  } else if (reservePaid > 0) {
    applyStatChanges(saveData.stats, {
      stress: -3,
      mood: 2,
    });
  }

  saveData.finance.lastMonthlySettlement = {
    month: monthNumber,
    totalCharged: monthlyTotal,
    liquidPaid,
    reservePaid,
    shortage,
    liquidAfter: saveData.money,
    reserveAfter: saveData.finance.reserveFund,
  };

  if (shortage > 0) {
    const cashGapEvent = clone(FINANCE_EMERGENCY_EVENTS.find((item) => item.id === "finance_cash_gap"));
    queuePendingEvent(saveData, {
      ...cashGapEvent,
      instanceId: `${cashGapEvent.id}_${monthNumber}`,
    });
  } else if ((saveData.finance.reserveFund ?? 0) < monthlyTotal * 0.35) {
    const reserveWarningEvent = clone(FINANCE_EMERGENCY_EVENTS.find((item) => item.id === "finance_reserve_warning"));
    queuePendingEvent(saveData, {
      ...reserveWarningEvent,
      instanceId: `${reserveWarningEvent.id}_${monthNumber}`,
    });
  }
}

export function advanceGameTime(saveData, days = 1) {
  const previousWeek = saveData.gameWeeks;
  const previousMonth = saveData.gameMonths;
  const previousAge = saveData.currentAge;

  saveData.gameDays += days;
  saveData.gameWeeks = Math.max(1, Math.floor(saveData.gameDays / 7));
  saveData.gameMonths = Math.max(1, Math.floor(saveData.gameDays / 30));
  saveData.gameYears = Number((saveData.gameDays / 360).toFixed(1));
  saveData.currentAge = saveData.startAge + Math.floor(saveData.gameDays / 360);

  if (saveData.gameWeeks > previousWeek) {
    for (let week = previousWeek + 1; week <= saveData.gameWeeks; week += 1) {
      applyWeeklyHousingPassive(saveData, week);
    }
  }

  if (saveData.gameMonths > previousMonth) {
    for (let month = previousMonth + 1; month <= saveData.gameMonths; month += 1) {
      applyMonthlyFinanceSettlement(saveData, month);
    }
  }

  enqueueProgressEvents(saveData, previousWeek, previousAge);
  // Global autosave policy: any day progression is immediately persisted.
  saveGame(saveData);
}

function enqueueProgressEvents(saveData, previousWeek, previousAge) {
  if (saveData.gameWeeks > previousWeek) {
    const weeklyPool = GLOBAL_PROGRESS_EVENTS.filter((event) => event.type === "weekly");
    const weeklyEvent = weeklyPool[Math.floor(Math.random() * weeklyPool.length)];
    queuePendingEvent(saveData, {
      ...clone(weeklyEvent),
      instanceId: `${weeklyEvent.id}_${saveData.gameWeeks}`,
    });
  }

  GLOBAL_PROGRESS_EVENTS
    .filter((event) => event.type === "age" && event.triggerAge > previousAge && event.triggerAge <= saveData.currentAge)
    .forEach((event) => {
      queuePendingEvent(saveData, {
        ...clone(event),
        instanceId: `${event.id}_${event.triggerAge}`,
      });
    });
}

export function queuePendingEvent(saveData, queuedEvent) {
  const alreadyHandled = saveData.eventHistory?.some((item) => item.eventId === queuedEvent.instanceId);
  const alreadyQueued = saveData.pendingEvents?.some((item) => item.instanceId === queuedEvent.instanceId);

  if (alreadyHandled || alreadyQueued) {
    return;
  }

  saveData.pendingEvents.push(queuedEvent);
}

function recordEvent(saveData, eventId, title) {
  saveData.eventHistory.push({
    eventId,
    day: saveData.gameDays,
    title,
  });
  saveData.lifetimeStats.totalEvents = (saveData.lifetimeStats.totalEvents ?? 0) + 1;
}

function syncCareerProgress(saveData) {
  const professionalism = saveData.skills?.professionalism ?? 0;
  const educationRank = getEducationRank(saveData.education?.educationLevel);
  const currentLevel = saveData.currentJob?.level ?? 1;

  const unlockedJob = CAREER_JOBS
    .filter((job) => professionalism >= job.minProfessionalism && educationRank >= job.minEducationRank)
    .at(-1);

  if (!unlockedJob || unlockedJob.level <= currentLevel) {
    return "";
  }

  const currentJob = saveData.currentJob ?? {};
  saveData.currentJob = {
    ...currentJob,
    ...unlockedJob,
    daysAtWork: currentJob.daysAtWork ?? 0,
  };

  return `Карьерный рост: новая должность «${unlockedJob.name}», ставка ${formatMoney(unlockedJob.salaryPerDay)} ₽ в день.`;
}
