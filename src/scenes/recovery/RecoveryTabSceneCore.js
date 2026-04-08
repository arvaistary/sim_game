import Phaser from 'phaser';
import { SceneAdapter } from '../../ecs/adapters/SceneAdapter.js';
import { PersistenceSystem } from '../../ecs/systems/index.js';
import { WALLET_COMPONENT } from '../../ecs/components/index.js';
import { DEFAULT_SAVE } from '../../ecs/data/default-save.js';
import {
  COLORS,
  createNotificationModal,
  createRoundedButton,
  createRoundedPanel,
  createToastMessage,
  textStyle,
} from '../../ui-kit';
import { RECOVERY_TABS } from '../../game-state.js';

function formatEffectBulletText(effect) {
  const raw = (effect || '').trim();
  if (!raw) return '';
  const parts = raw.includes('•')
    ? raw.split(/\s*•\s*/).map((s) => s.trim()).filter(Boolean)
    : [raw];
  return parts.map((p) => `• ${p}`).join('\n');
}

const SCROLL_CARDS_BOTTOM_PAD = 50;

/**
 * Базовая сцена одного раздела восстановления (дом, магазин, развлечения, соц. жизнь).
 * @param {string} sceneKey — ключ Phaser
 * @param {string | null} fixedTabId — если задан, всегда этот таб из RECOVERY_TABS; если null — режим RecoveryScene с initialTab из init()
 */
export class RecoveryTabSceneCore extends Phaser.Scene {
  constructor(sceneKey, fixedTabId) {
    super(sceneKey);
    /** @type {string | null} */
    this.fixedTabId = fixedTabId;
  }

  init(data) {
    if (this.fixedTabId != null) {
      this.initialTab = this.fixedTabId;
    } else {
      this.initialTab = data?.initialTab ?? 'home';
    }
  }

  create() {
    this.sceneAdapter = new SceneAdapter(this, structuredClone(DEFAULT_SAVE));
    this.sceneAdapter.initialize();

    this.persistenceSystem = new PersistenceSystem();
    this.persistenceSystem.init(this.sceneAdapter.getWorld());

    const saveData = this.persistenceSystem.loadSave();
    if (saveData) {
      this.sceneAdapter.updateFromSaveData(saveData);
    }

    this.recoverySystem = this.sceneAdapter.getSystem('recovery');
    this.statsSystem = this.sceneAdapter.getSystem('stats');
    this.actionCardViews = [];

    this.cameras.main.setBackgroundColor(COLORS.background);

    this.root = this.add.container(0, 0);
    this.createHeader();
    this.createContent();
    this.createBackButton();
    this.createToast();
    this.createModals();

    this.selectTab(this.initialTab);

    this.cardsScrollY = 0;
    this.scrollViewportH = 0;
    this.scrollContentHeight = 0;
    this.scrollViewportRect = { x: 0, y: 0, w: 0, h: 0 };
    this.scrollTouch = { active: false, startY: 0, startScroll: 0 };

    this.scale.on('resize', this.handleResize, this);
    this.input.on('wheel', this.onCardsWheel, this);
    this.input.on('pointerdown', this.onScrollPointerDown, this);
    this.input.on('pointermove', this.onScrollPointerMove, this);
    this.input.on('pointerup', this.onScrollPointerUp, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.handleResize, this);
      this.input.off('wheel', this.onCardsWheel, this);
      this.input.off('pointerdown', this.onScrollPointerDown, this);
      this.input.off('pointermove', this.onScrollPointerMove, this);
      this.input.off('pointerup', this.onScrollPointerUp, this);
    });

    this.handleResize(this.scale.gameSize);
    this.animateEntrance();
  }

  createHeader() {
    const tab = RECOVERY_TABS.find((t) => t.id === this.initialTab);
    const titleStr = tab ? tab.label : 'Восстановление';
    const subtitleStr = tab
      ? tab.subtitle
      : 'Выберите действие для восстановления ресурсов';

    this.headerCard = createRoundedPanel(this, { panelAlpha: 1, radius: 18, shadowAlpha: 0.22 });
    this.root.add(this.headerCard);

    this.headerTitle = this.add.text(0, 0, titleStr, textStyle(28, COLORS.text, '700'));
    this.headerSubtitle = this.add.text(0, 0, subtitleStr, textStyle(16, COLORS.text, '500'));
    this.root.add([this.headerTitle, this.headerSubtitle]);
  }

  createContent() {
    this.contentCard = createRoundedPanel(this, { panelAlpha: 1, radius: 18, shadowAlpha: 0.22 });
    this.root.add(this.contentCard);

    this.contentTitle = this.add.text(0, 0, '', textStyle(22, COLORS.text, '700'));
    this.contentSubtitle = this.add.text(0, 0, '', textStyle(14, COLORS.text, '500'));
    this.root.add([this.contentTitle, this.contentSubtitle]);
    this.contentTitle.setDepth(4);
    this.contentSubtitle.setDepth(4);

    this.scrollMaskRect = this.add.rectangle(0, 0, 100, 100, 0xffffff, 0).setOrigin(0).setVisible(false);
    this.root.add(this.scrollMaskRect);

    this.cardsContainer = this.add.container(0, 0);
    this.cardsContainer.setDepth(2);
    this.cardsContainer.setMask(this.scrollMaskRect.createGeometryMask());
    this.root.add(this.cardsContainer);
  }

  isPointerInScrollViewport(pointer) {
    const r = this.scrollViewportRect;
    if (!r || r.w <= 0 || r.h <= 0) return false;
    const x = pointer.worldX;
    const y = pointer.worldY;
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }

  clampCardsScroll() {
    const maxScroll = Math.min(0, this.scrollViewportH - this.scrollContentHeight);
    this.cardsScrollY = Phaser.Math.Clamp(this.cardsScrollY, maxScroll, 0);
  }

  applyCardsScrollPosition() {
    const innerPad = 20;
    this.cardsContainer.setPosition(
      this.contentCard.x + innerPad,
      this.contentCard.y + 86 + this.cardsScrollY
    );
  }

  onCardsWheel(pointer, _go, _dx, dy, _dz, event) {
    if (!this.scrollViewportRect?.h) return;
    if (!this.isPointerInScrollViewport(pointer)) return;
    if (event) event.preventDefault?.();
    const delta =
      typeof event?.deltaY === 'number'
        ? event.deltaY
        : typeof dy === 'number'
          ? dy
          : 0;
    if (delta === 0) return;
    this.cardsScrollY -= delta * 0.45;
    this.clampCardsScroll();
    this.applyCardsScrollPosition();
  }

  onScrollPointerDown(pointer) {
    const touchLike = pointer.pointerType === 'touch' || pointer.wasTouch === true;
    if (!touchLike || !this.isPointerInScrollViewport(pointer)) return;
    this.scrollTouch.active = true;
    this.scrollTouch.startY = pointer.y;
    this.scrollTouch.startScroll = this.cardsScrollY;
    this.scrollTouch.moved = false;
  }

  onScrollPointerMove(pointer) {
    if (!this.scrollTouch.active || !pointer.isDown) return;
    if (!this.isPointerInScrollViewport(pointer)) return;
    const dy = pointer.y - this.scrollTouch.startY;
    if (Math.abs(dy) > 6) this.scrollTouch.moved = true;
    if (this.scrollTouch.moved) {
      this.cardsScrollY = this.scrollTouch.startScroll + dy;
      this.clampCardsScroll();
      this.applyCardsScrollPosition();
    }
  }

  onScrollPointerUp() {
    this.scrollTouch.active = false;
  }

  createBackButton() {
    this.backButton = createRoundedButton(this, {
      label: '← Назад',
      onClick: () => this.scene.start('MainGameScene'),
      fillColor: COLORS.neutral,
      fontSize: 16,
    });
    this.root.add(this.backButton);
  }

  createToast() {
    this.toast = createToastMessage(this, { width: 220, height: 48 });
    this.root.add(this.toast);
  }

  createModals() {
    this.notificationModal = createNotificationModal(this, {
      primaryLabel: 'Понятно',
      secondaryLabel: 'Закрыть',
    });
    this.root.add(this.notificationModal);
  }

  selectTab(tabId) {
    this.currentTab = RECOVERY_TABS.find((tab) => tab.id === tabId);
    if (!this.currentTab) return;

    this.cardsScrollY = 0;

    this.contentTitle.setText(this.currentTab.title);
    this.contentSubtitle.setText(this.currentTab.subtitle);

    this.createActionCards();
    this.handleResize(this.scale.gameSize);
  }

  createActionCards() {
    this.cardsContainer.removeAll(true);
    this.actionCardViews = [];

    this.currentTab.cards.forEach((card, index) => {
      const cardView = this.createActionCard(card, index);
      this.actionCardViews.push(cardView);
      this.cardsContainer.add(cardView.container);
    });
  }

  createActionCard(cardData, index) {
    const container = this.add.container(0, 0);
    const cardPanel = createRoundedPanel(this, { panelAlpha: 1, radius: 14, shadowAlpha: 0.15 });
    const priceChipBg = this.add.graphics();
    container.add(cardPanel);
    container.add(priceChipBg);

    const priceText = this.add.text(0, 0, this.formatMoney(cardData.price) + ' ₽', textStyle(13, COLORS.text, '700'));
    priceText.setOrigin(0, 0.5);
    container.add(priceText);

    const titleText = this.add.text(0, 0, cardData.title, {
      ...textStyle(18, COLORS.text, '700'),
      wordWrap: { width: 320 },
    });
    container.add(titleText);

    const effectText = this.add.text(0, 0, formatEffectBulletText(cardData.effect), {
      ...textStyle(14, COLORS.text, '500'),
      wordWrap: { width: 320 },
      lineSpacing: 6,
    });
    container.add(effectText);

    const timeText = this.add.text(0, 0, `Время: ${cardData.dayCost} д.`, textStyle(13, COLORS.text, '500'));
    container.add(timeText);

    const moodText = this.add.text(0, 0, cardData.mood, {
      ...textStyle(13, COLORS.text, '400'),
      fontStyle: 'italic',
      wordWrap: { width: 320 },
      lineSpacing: 4,
    });
    container.add(moodText);

    const actionButton = createRoundedButton(this, {
      label: 'Применить',
      onClick: () => this.applyAction(cardData),
      fillColor: COLORS.accent,
      fontSize: 15,
      width: 148,
      height: 44,
    });
    container.add(actionButton);

    cardPanel.setSize(400, 260);

    return {
      container,
      cardPanel,
      priceChipBg,
      priceText,
      titleText,
      effectText,
      timeText,
      moodText,
      actionButton,
    };
  }

  measureActionCardHeight(cardObj, cardW) {
    const pad = 16;
    const innerW = Math.max(120, cardW - pad * 2);
    cardObj.titleText.setWordWrapWidth(innerW);
    cardObj.effectText.setWordWrapWidth(innerW);
    cardObj.moodText.setWordWrapWidth(innerW);

    const chipPadY = 5;
    const chipH = Math.max(28, cardObj.priceText.height + chipPadY * 2);
    let h = pad + chipH + 10;
    h += cardObj.titleText.height + 12;
    h += cardObj.effectText.height + 10;
    h += cardObj.timeText.height + 8;
    h += cardObj.moodText.height + 16;
    h += 72;
    return Math.max(248, h);
  }

  layoutActionCard(cardObj, left, top, cardW, cardH) {
    const pad = 16;
    const btnPadX = 16;
    const btnPadY = 16;
    const chipPadX = 10;
    const chipPadY = 5;
    const innerW = Math.max(120, cardW - pad * 2);

    cardObj.cardPanel.setPosition(left, top);
    cardObj.cardPanel.setSize(cardW, cardH);

    cardObj.titleText.setWordWrapWidth(innerW);
    cardObj.effectText.setWordWrapWidth(innerW);
    cardObj.moodText.setWordWrapWidth(innerW);

    let y = top + pad;

    const chipW = cardObj.priceText.width + chipPadX * 2;
    const chipH = Math.max(28, cardObj.priceText.height + chipPadY * 2);
    cardObj.priceChipBg.clear();
    cardObj.priceChipBg.fillStyle(COLORS.accentSoft, 1);
    cardObj.priceChipBg.fillRoundedRect(left + pad, y, chipW, chipH, 10);
    cardObj.priceChipBg.lineStyle(1, COLORS.line, 0.85);
    cardObj.priceChipBg.strokeRoundedRect(left + pad, y, chipW, chipH, 10);
    cardObj.priceText.setPosition(left + pad + chipPadX, y + chipH / 2);
    y += chipH + 10;

    cardObj.titleText.setPosition(left + pad, y);
    y += cardObj.titleText.height + 12;

    cardObj.effectText.setPosition(left + pad, y);
    y += cardObj.effectText.height + 10;

    cardObj.timeText.setPosition(left + pad, y);
    y += cardObj.timeText.height + 8;

    cardObj.moodText.setPosition(left + pad, y);

    const btnW = cardObj.actionButton.width;
    const btnH = cardObj.actionButton.height;
    cardObj.actionButton.setPosition(left + cardW - btnPadX - btnW / 2, top + cardH - btnPadY - btnH / 2);
  }

  applyAction(cardData) {
    const playerId = this.sceneAdapter.getPlayerEntityId();
    const world = this.sceneAdapter.getWorld();
    const wallet = world.getComponent(playerId, WALLET_COMPONENT);
    if (!wallet) {
      this.showToast('Не удалось получить данные кошелька');
      return;
    }

    if (wallet.money < cardData.price) {
      this.showToast(`Недостаточно денег. Нужно ${cardData.price} ₽`);
      return;
    }

    const summary = this.recoverySystem.applyRecoveryAction(cardData);

    this.sceneAdapter.syncToSaveData();
    this.persistenceSystem.saveGame(this.sceneAdapter.getSaveData());

    this.refreshContent();
    this.notificationModal.show({
      title: 'Действие завершено',
      description: summary,
      onConfirm: () => this.scene.start('MainGameScene'),
    });
  }

  refreshContent() {
    this.cardsScrollY = 0;
    this.createActionCards();
    this.handleResize(this.scale.gameSize);
  }

  showToast(message) {
    this.toast.show(message);
  }

  formatMoney(value) {
    return new Intl.NumberFormat('ru-RU').format(value);
  }

  handleResize(gameSize) {
    const w = gameSize.width;
    const h = gameSize.height;
    const isDesktop = w >= 960;
    const safeX = Math.max(16, Math.floor(w * 0.03));
    const maxW = Math.min(920, w - safeX * 2);

    this.headerCard.setSize(maxW, 100);
    this.headerCard.setPosition((w - maxW) / 2, safeX);

    this.headerTitle.setPosition(this.headerCard.x + 24, this.headerCard.y + 28);
    this.headerSubtitle.setPosition(this.headerCard.x + 24, this.headerCard.y + 62);

    const bottomReserve = 100;
    const contentTop = this.headerCard.y + this.headerCard.height + 12;
    const contentH = Math.max(260, h - contentTop - bottomReserve);
    this.contentCard.setSize(maxW, contentH);
    this.contentCard.setPosition((w - maxW) / 2, contentTop);

    this.contentTitle.setPosition(this.contentCard.x + 24, this.contentCard.y + 20);
    this.contentSubtitle.setPosition(this.contentCard.x + 24, this.contentCard.y + 52);

    const innerPad = 20;
    const headerBlockH = 86;
    const scrollTopOffset = headerBlockH;
    const viewportH = Math.max(120, contentH - scrollTopOffset);
    this.scrollViewportH = viewportH;

    const vx = this.contentCard.x;
    const vy = this.contentCard.y + scrollTopOffset;
    this.scrollMaskRect.setPosition(vx, vy);
    this.scrollMaskRect.setSize(this.contentCard.width, viewportH);
    this.scrollViewportRect = { x: vx, y: vy, w: this.contentCard.width, h: viewportH };

    const cardGap = 16;

    if (this.actionCardViews.length > 0) {
      const innerW = this.contentCard.width - innerPad * 2;
      const useGrid = isDesktop && this.actionCardViews.length >= 2 && innerW >= 560;
      const cols = useGrid ? 2 : 1;
      const colGap = 16;
      const cardW = cols === 2 ? Math.floor((innerW - colGap) / 2) : Math.min(520, innerW);

      const n = this.actionCardViews.length;
      const heights = this.actionCardViews.map((cardObj) => this.measureActionCardHeight(cardObj, cardW));

      let rowTop = 0;
      let contentBottom = 0;
      for (let r = 0; r < Math.ceil(n / cols); r += 1) {
        const i0 = r * cols;
        const i1 = Math.min(i0 + cols, n);
        let rowH = 0;
        for (let i = i0; i < i1; i += 1) {
          rowH = Math.max(rowH, heights[i]);
        }
        for (let i = i0; i < i1; i += 1) {
          const col = i - i0;
          const left = col * (cardW + colGap);
          this.layoutActionCard(this.actionCardViews[i], left, rowTop, cardW, rowH);
        }
        contentBottom = rowTop + rowH;
        rowTop += rowH + cardGap;
      }

      this.scrollContentHeight = contentBottom + SCROLL_CARDS_BOTTOM_PAD;
      this.clampCardsScroll();
      this.applyCardsScrollPosition();
    } else {
      this.scrollContentHeight = 0;
      this.cardsScrollY = 0;
      this.applyCardsScrollPosition();
    }

    this.backButton.setPosition(this.contentCard.x + this.contentCard.width / 2, h - safeX - 36);

    this.toast.setPosition(w / 2, h - 100);

    this.notificationModal.resize(gameSize);
  }

  animateEntrance() {
    this.headerCard.alpha = 0;
    this.contentCard.alpha = 0;
    this.backButton.alpha = 0;

    this.tweens.add({
      targets: this.headerCard,
      alpha: 1,
      duration: 400,
      ease: 'Cubic.easeOut',
    });

    this.tweens.add({
      targets: this.contentCard,
      alpha: 1,
      duration: 600,
      delay: 120,
      ease: 'Cubic.easeOut',
    });

    this.tweens.add({
      targets: this.backButton,
      alpha: 1,
      duration: 400,
      delay: 300,
      ease: 'Cubic.easeOut',
    });
  }
}
