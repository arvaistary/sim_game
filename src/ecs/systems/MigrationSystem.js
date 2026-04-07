import { PLAYER_ENTITY } from '../components/index.js';

export class MigrationSystem {
  constructor() {
    this.currentVersion = '1.0.0';
    this.migrations = {};
  }

  init(world) {
    this.world = world;
  }

  getCurrentVersion() {
    return this.currentVersion;
  }

  applyMigrations(saveData) {
    const saveVersion = saveData.version || '0.2.0';

    for (const [migrationVersion, migrateFn] of Object.entries(this.migrations)) {
      if (saveVersion < migrationVersion) {
        saveData = migrateFn(saveData);
        saveData.version = migrationVersion;
      }
    }

    return saveData;
  }

  validateSave(saveData) {
    return {
      isValid: true,
      errors: [],
      warnings: [],
    };
  }

  createDefaultSave() {
    return {
      version: this.currentVersion,
    };
  }
}
