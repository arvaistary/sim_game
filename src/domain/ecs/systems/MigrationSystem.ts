import { PLAYER_ENTITY } from '../components/index'
import type { ECSWorld } from '../world'

type MigrationFn = (saveData: Record<string, unknown>) => Record<string, unknown>

export class MigrationSystem {
  private world!: ECSWorld

  readonly currentVersion = '1.0.0'
  private migrations: Record<string, MigrationFn> = {}

  init(world: ECSWorld): void {
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

  validateSave(_saveData: Record<string, unknown>): { isValid: boolean; errors: string[]; warnings: string[] } {
    return {
      isValid: true,
      errors: [],
      warnings: [],
    }
  }

  createDefaultSave(): Record<string, unknown> {
    return {
      version: this.currentVersion,
    }
  }
}

