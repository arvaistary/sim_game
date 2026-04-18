/**
 * Плоские миграции save-формата (pre-ECS и legacy JSON).
 */

import type { MigrationFn } from './index.types'

export const migrateFrom_0_1_0: MigrationFn = (saveData: Record<string, unknown>) => {
  if (!saveData.version) {
    saveData.version = '0.2.0'
  }

  if (typeof saveData.saveVersion !== 'number') {
    saveData.saveVersion = 1
  }

  const finance = (saveData.finance ?? {}) as Record<string, unknown>
  if (typeof finance.reserveFund !== 'number') {
    finance.reserveFund = 0
  }

  if (!finance.monthlyExpenses) {
    finance.monthlyExpenses = {
      housing: 16000,
      food: 9000,
      transport: 4500,
      leisure: 6500,
      education: 2500,
    }
  }
  saveData.finance = finance

  if (!saveData.investments) {
    saveData.investments = []
  }

  if (!saveData.eventHistory) {
    saveData.eventHistory = []
  }

  if (!saveData.pendingEvents) {
    saveData.pendingEvents = []
  }

  if (!saveData.lifetimeStats) {
    saveData.lifetimeStats = {
      totalWorkDays: 0,
      totalEvents: 0,
      maxMoney: saveData.money || 0,
    }
  }

  return saveData
}

export const migrateFrom_0_2_0: MigrationFn = (saveData: Record<string, unknown>) => {
  const education = (saveData.education ?? {}) as Record<string, unknown>
  if (!Array.isArray(education.activeCourses)) {
    education.activeCourses = []
  }
  saveData.education = education

  const finance = (saveData.finance ?? {}) as Record<string, unknown>
  if (!finance.lastMonthlySettlement) {
    finance.lastMonthlySettlement = null
  }
  saveData.finance = finance

  const housing = (saveData.housing ?? {}) as Record<string, unknown>
  if (!housing.comfort) {
    const housingLevels = [
      { level: 1, name: 'Общежитие', comfort: 30 },
      { level: 2, name: 'Студия', comfort: 50 },
      { level: 3, name: '1-комнатная', comfort: 70 },
      { level: 4, name: '2-комнатная', comfort: 90 },
    ]
    const housingMatch = housingLevels.find(h => h.level === housing.level) || housingLevels[0]
    housing.comfort = housingMatch.comfort
  }
  saveData.housing = housing

  saveData.version = '0.2.0'

  return saveData
}
