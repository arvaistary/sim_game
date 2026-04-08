import { RecoveryTabSceneCore } from './recovery/RecoveryTabSceneCore.js';

/** Магазин: еда и бытовые покупки (`shop`). */
export class ShopSceneECS extends RecoveryTabSceneCore {
  constructor() {
    super('ShopScene', 'shop');
  }
}
