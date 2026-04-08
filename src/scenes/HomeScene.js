import { RecoveryTabSceneCore } from './recovery/RecoveryTabSceneCore.js';

/** Дом: мебель, комфорт, переезд (раздел `home` из RECOVERY_TABS). */
export class HomeSceneECS extends RecoveryTabSceneCore {
  constructor() {
    super('HomeScene', 'home');
  }
}
