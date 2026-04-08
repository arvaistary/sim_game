import { RecoveryTabSceneCore } from './recovery/RecoveryTabSceneCore.js';

/**
 * Сцена восстановления с выбором вкладки через `init({ initialTab })`.
 * Для навигации с главного экрана предпочтительны отдельные сцены:
 * HomeScene, ShopScene, FunScene, SocialScene.
 */
export class RecoverySceneECS extends RecoveryTabSceneCore {
  constructor() {
    super('RecoveryScene', null);
  }
}
