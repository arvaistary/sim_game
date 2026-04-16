import { PLAYER_ENTITY } from '../../components/index'
import type { GameWorld } from '../../world'
import type { MigrationFn } from './index.types'

export class MigrationSystem {
  private world!: GameWorld

  readonly currentVersion = '1.2.0'
  private migrations: Record<string, MigrationFn> = {}

  init(world: GameWorld): void {
    this.world = world
  }

  getCurrentVersion(): string {
    return this.currentVersion
  }

  applyMigrations(saveData: Record<string, unknown>): Record<string, unknown> {
    const saveVersion = (saveData.version as string) || '0.2.0'

    for (const [migrationVersion, migrateFn] of Object.entries(this.migrations)) {
      if (saveVersion < migrationVersion) {
        saveData = migrateFn(saveData)
        saveData.version = migrationVersion
      }
    }

    return saveData
  }

  validateSave(saveData: Record<string, unknown>): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = []
    const warnings: string[] = []

    const time = saveData.time as Record<string, unknown> | undefined
    const totalHours = typeof time?.totalHours === 'number' ? time.totalHours : Number(time?.totalHours)
    if (Number.isNaN(totalHours) || totalHours < 0) {
      errors.push('time.totalHours должен быть числом >= 0')
    }

    const wallet = saveData.wallet as Record<string, unknown> | undefined
    const money = typeof wallet?.money === 'number' ? wallet.money : Number(wallet?.money)
    if (Number.isNaN(money) || money < 0) {
      errors.push('wallet.money должен быть числом >= 0')
    }

    if (!saveData.stats || typeof saveData.stats !== 'object') {
      errors.push('stats должен быть объектом')
    }

    const work = saveData.work as Record<string, unknown> | undefined
    if (work?.id !== null && typeof work?.id !== 'string') {
      errors.push('work.id должен быть строкой или null')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  createDefaultSave(): Record<string, unknown> {
    return {
      version: this.currentVersion,
    }
  }
}

