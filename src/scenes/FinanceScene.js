import Phaser from 'phaser';
import { SceneAdapter } from '../ecs/adapters/SceneAdapter.js';
import { PersistenceSystem } from '../ecs/systems/PersistenceSystem.js';
import {
  COLORS,
  createRoundedButton,
  createRoundedPanel,
  createToastMessage,
  textStyle,
} from '../ui-kit';

/** Отступ снизу прокручиваемого блока (последняя секция не прилипает к маске) */
const SCROLL_CONTENT_BOTTOM_PAD = 48;

export class FinanceSceneECS extends Phaser.Scene {
  constructor() {
    super('FinanceScene');
  }

  create() {
    this.persistenceSystem = new PersistenceSystem();
    const loadedSaveData = this.persistenceSystem.loadSave();
    this.registry.set('saveData', loadedSaveData);
    this.sceneAdapter = new SceneAdapter(this, loadedSaveData);
    this.sceneAdapter.initialize();
    this.persistenceSystem.init(this.sceneAdapter.getWorld());

    const financeSystem = this.sceneAdapter.getSystem('financeAction');
    const investmentSystem = this.sceneAdapter.getSystem('investment');
    this.financeActionSystem = financeSystem;
    this.investmentSystem = investmentSystem;

    this.cameras.main.setBackgroundColor(COLORS.background);

    this.root = this.add.container(0, 0);
    this.financeScrollY = 0;
    this.scrollViewportRect = { x: 0, y: 0, w: 0, h: 0 };
    this.scrollTouch = { active: false, startY: 0, startScroll: 0, moved: false };

    this.createHeader();

    this.scrollMaskRect = this.add.rectangle(0, 0, 100, 100, 0xffffff, 0).setOrigin(0).setVisible(false);
    this.root.add(this.scrollMaskRect);

    this.financeScrollContent = this.add.container(0, 0);
    this.financeScrollContent.setDepth(1);
    this.financeScrollContent.setMask(this.scrollMaskRect.createGeometryMask());
    this.root.add(this.financeScrollContent);

    this.createOverview();
    this.createExpenses();
    this.createActions();
    this.createInvestments();
    this.createBackButton();
    this.createToast();
    this.createModals();

    this.scale.on('resize', this.handleResize, this);
    this.input.on('wheel', this.onFinanceWheel, this);
    this.input.on('pointerdown', this.onFinanceScrollPointerDown, this);
    this.input.on('pointermove', this.onFinanceScrollPointerMove, this);
    this.input.on('pointerup', this.onFinanceScrollPointerUp, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.handleResize, this);
      this.input.off('wheel', this.onFinanceWheel, this);
      this.input.off('pointerdown', this.onFinanceScrollPointerDown, this);
      this.input.off('pointermove', this.onFinanceScrollPointerMove, this);
      this.input.off('pointerup', this.onFinanceScrollPointerUp, this);
    });

    this.handleResize(this.scale.gameSize);
    this.animateEntrance();
  }

  isPointerInFinanceScrollViewport(pointer) {
    const r = this.scrollViewportRect;
    if (!r || r.w <= 0 || r.h <= 0) return false;
    const x = pointer.worldX;
    const y = pointer.worldY;
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }

  clampFinanceScroll() {
    const maxScroll = Math.min(0, this.scrollViewportH - this.scrollContentHeight);
    this.financeScrollY = Phaser.Math.Clamp(this.financeScrollY, maxScroll, 0);
  }

  applyFinanceScrollPosition() {
    if (!this.financeScrollContent) return;
    this.financeScrollContent.setPosition(this.scrollContentX, this.scrollTopY + this.financeScrollY);
  }

  onFinanceWheel(pointer, _go, _dx, dy, _dz, event) {
    if (!this.scrollViewportRect?.h) return;
    if (!this.isPointerInFinanceScrollViewport(pointer)) return;
    if (event) event.preventDefault?.();
    const delta =
      typeof event?.deltaY === 'number'
        ? event.deltaY
        : typeof dy === 'number'
          ? dy
          : 0;
    if (delta === 0) return;
    this.financeScrollY -= delta * 0.45;
    this.clampFinanceScroll();
    this.applyFinanceScrollPosition();
  }

  onFinanceScrollPointerDown(pointer) {
    const touchLike = pointer.pointerType === 'touch' || pointer.wasTouch === true;
    if (!touchLike || !this.isPointerInFinanceScrollViewport(pointer)) return;
    this.scrollTouch.active = true;
    this.scrollTouch.startY = pointer.y;
    this.scrollTouch.startScroll = this.financeScrollY;
    this.scrollTouch.moved = false;
  }

  onFinanceScrollPointerMove(pointer) {
    if (!this.scrollTouch.active || !pointer.isDown) return;
    if (!this.isPointerInFinanceScrollViewport(pointer)) return;
    const dy = pointer.y - this.scrollTouch.startY;
    if (Math.abs(dy) > 6) this.scrollTouch.moved = true;
    if (this.scrollTouch.moved) {
      this.financeScrollY = this.scrollTouch.startScroll + dy;
      this.clampFinanceScroll();
      this.applyFinanceScrollPosition();
    }
  }

  onFinanceScrollPointerUp() {
    this.scrollTouch.active = false;
  }

  createHeader() {
    this.headerCard = createRoundedPanel(this, { panelAlpha: 1, radius: 18, shadowAlpha: 0.22 });
    this.root.add(this.headerCard);
    this.headerCard.setDepth(10);

    this.headerTitle = this.add.text(0, 0, 'Финансы', textStyle(28, COLORS.text, '700'));
    this.headerSubtitle = this.add.text(0, 0, 'Счета, расходы и инвестиции', textStyle(16, COLORS.text, '500'));
    this.root.add([this.headerTitle, this.headerSubtitle]);
    this.headerTitle.setDepth(11);
    this.headerSubtitle.setDepth(11);
  }

  createOverview() {
    this.overviewCard = createRoundedPanel(this, { panelAlpha: 1, radius: 18, shadowAlpha: 0.22 });
    this.financeScrollContent.add(this.overviewCard);

    const overview = this.financeActionSystem.getFinanceOverview();
    if (!overview) return;

    this.overviewTitle = this.add.text(0, 0, 'Обзор', textStyle(22, COLORS.text, '700'));
    this.financeScrollContent.add(this.overviewTitle);
    this.overviewTitle.setDepth(5);

    this.liquidMoneyText = this.add.text(0, 0, this.formatMoney(overview.liquidMoney) + ' ₽', textStyle(32, COLORS.accent, '700'));
    this.financeScrollContent.add(this.liquidMoneyText);

    this.liquidMoneyLabel = this.add.text(0, 0, 'Свободные деньги', textStyle(14, COLORS.text, '500'));
    this.financeScrollContent.add(this.liquidMoneyLabel);

    this.reserveFundText = this.add.text(0, 0, this.formatMoney(overview.reserveFund) + ' ₽', textStyle(24, COLORS.text, '600'));
    this.financeScrollContent.add(this.reserveFundText);

    this.reserveFundLabel = this.add.text(0, 0, 'Резервный фонд', textStyle(14, COLORS.text, '500'));
    this.financeScrollContent.add(this.reserveFundLabel);

    this.investedText = this.add.text(0, 0, this.formatMoney(overview.investedTotal) + ' ₽', textStyle(20, COLORS.text, '600'));
    this.financeScrollContent.add(this.investedText);

    this.investedLabel = this.add.text(0, 0, 'Вложено', textStyle(14, COLORS.text, '500'));
    this.financeScrollContent.add(this.investedLabel);

    this.monthlyBalanceText = this.add.text(0, 0, this.formatMoney(overview.monthlyBalance) + ' ₽/мес', textStyle(20, overview.monthlyBalance >= 0 ? COLORS.success : COLORS.danger, '600'));
    this.financeScrollContent.add(this.monthlyBalanceText);

    this.monthlyBalanceLabel = this.add.text(0, 0, 'Баланс месяца', textStyle(14, COLORS.text, '500'));
    this.financeScrollContent.add(this.monthlyBalanceLabel);
  }

  createExpenses() {
    this.expensesCard = createRoundedPanel(this, { panelAlpha: 1, radius: 18, shadowAlpha: 0.22 });
    this.financeScrollContent.add(this.expensesCard);

    this.expensesTitle = this.add.text(0, 0, 'Расходы', textStyle(22, COLORS.text, '700'));
    this.financeScrollContent.add(this.expensesTitle);
    this.expensesTitle.setDepth(5);

    const overview = this.financeActionSystem.getFinanceOverview();
    if (!overview) return;

    this.expenseItems = [];
    overview.expenseLines.forEach((expense, index) => {
      const label = this.add.text(0, 0, expense.label, textStyle(14, COLORS.text, '500'));
      const amount = this.add.text(0, 0, this.formatMoney(expense.amount) + ' ₽', textStyle(14, COLORS.text, '600'));
      this.financeScrollContent.add([label, amount]);
      this.expenseItems.push({ label, amount });
    });

    const totalLabel = this.add.text(0, 0, 'Итого', textStyle(16, COLORS.text, '700'));
    const totalAmount = this.add.text(0, 0, this.formatMoney(overview.monthlyExpensesTotal) + ' ₽', textStyle(18, COLORS.text, '700'));
    this.financeScrollContent.add([totalLabel, totalAmount]);
    this.expenseTotal = { label: totalLabel, amount: totalAmount };

    const incomeLabel = this.add.text(0, 0, 'Доход', textStyle(16, COLORS.text, '700'));
    const incomeAmount = this.add.text(0, 0, this.formatMoney(overview.monthlyIncome) + ' ₽', textStyle(18, COLORS.success, '700'));
    this.financeScrollContent.add([incomeLabel, incomeAmount]);
    this.expenseIncome = { label: incomeLabel, amount: incomeAmount };
  }

  createActions() {
    this.actionsCard = createRoundedPanel(this, { panelAlpha: 1, radius: 18, shadowAlpha: 0.22 });
    this.financeScrollContent.add(this.actionsCard);

    this.actionsTitle = this.add.text(0, 0, 'Действия', textStyle(22, COLORS.text, '700'));
    this.financeScrollContent.add(this.actionsTitle);
    this.actionsTitle.setDepth(5);

    const actions = this.financeActionSystem.getFinanceActions();

    this.actionCards = [];
    actions.forEach((action, index) => {
      const container = this.createActionCard(action, index);
      this.actionCards.push(container);
      this.actionsCard.add(container.container);
    });
  }

  createActionCard(action, index) {
    const container = this.add.container(0, 0);
    const cardPanel = createRoundedPanel(this, { panelAlpha: 1, radius: 14, shadowAlpha: 0.15 });
    container.add(cardPanel);

    const titleText = this.add.text(0, 0, action.title, textStyle(18, COLORS.text, '700'));
    container.add(titleText);

    const subtitleText = this.add.text(0, 0, action.subtitle, {
      ...textStyle(14, COLORS.text, '500'),
      wordWrap: { width: 280 },
      lineSpacing: 2,
    });
    container.add(subtitleText);

    const costText = this.add.text(0, 0, this.formatMoney(action.amount) + ' ₽', textStyle(16, COLORS.accent, '600'));
    container.add(costText);

    const hourCost = typeof action.hourCost === 'number' ? action.hourCost : Math.max(1, Number(action.dayCost ?? 1)) * 2;
    const timeText = this.add.text(0, 0, `Время: ${hourCost} ч.`, textStyle(12, COLORS.text, '400'));
    container.add(timeText);

    let actionButton;
    if (action.available) {
      actionButton = createRoundedButton(this, {
        label: 'Выполнить',
        onClick: () => this.applyAction(action.id),
        fillColor: COLORS.accent,
        fontSize: 14,
      });
    } else {
      actionButton = createRoundedButton(this, {
        label: 'Недоступно',
        onClick: () => this.showToast(action.reason),
        fillColor: COLORS.neutral,
        fontSize: 14,
        disabled: true,
      });
    }
    container.add(actionButton);

    cardPanel.setSize(400, 176);

    return { container, cardPanel, titleText, subtitleText, costText, timeText, actionButton };
  }

  createInvestments() {
    this.investmentsCard = createRoundedPanel(this, { panelAlpha: 1, radius: 18, shadowAlpha: 0.22 });
    this.financeScrollContent.add(this.investmentsCard);

    this.investmentsTitle = this.add.text(0, 0, 'Инвестиции', textStyle(22, COLORS.text, '700'));
    this.financeScrollContent.add(this.investmentsTitle);
    this.investmentsTitle.setDepth(5);

    const investments = this.investmentSystem.getActiveInvestments();

    this.investmentCards = [];
    if (investments.length === 0) {
      const noInvestmentsText = this.add.text(0, 0, 'Нет активных инвестиций', textStyle(14, COLORS.neutral, '400'));
      this.investmentsCard.add(noInvestmentsText);
      this.investmentCards.push({ container: noInvestmentsText });
    } else {
      investments.forEach((investment, index) => {
        const container = this.createInvestmentCard(investment, index);
        this.investmentCards.push(container);
        this.investmentsCard.add(container.container);
      });
    }

    const maturedInvestments = this.investmentSystem.getMaturedInvestments();
    if (maturedInvestments.length > 0) {
      this.collectAllButton = createRoundedButton(this, {
        label: 'Забрать все доходы',
        onClick: () => this.collectAllMatured(),
        fillColor: COLORS.success,
        fontSize: 16,
      });
      this.financeScrollContent.add(this.collectAllButton);
    }
  }

  createInvestmentCard(investment, index) {
    const container = this.add.container(0, 0);
    const cardPanel = createRoundedPanel(this, { panelAlpha: 1, radius: 14, shadowAlpha: 0.15 });
    container.add(cardPanel);

    const titleText = this.add.text(0, 0, investment.label || 'Вклад', textStyle(18, COLORS.text, '600'));
    container.add(titleText);

    const amountText = this.add.text(0, 0, this.formatMoney(investment.amount) + ' ₽', textStyle(16, COLORS.text, '600'));
    container.add(amountText);

    const returnText = this.add.text(0, 0, 'Доход: ' + this.formatMoney(investment.expectedReturn) + ' ₽', textStyle(14, COLORS.success, '500'));
    container.add(returnText);

    const daysLeftText = this.add.text(0, 0, `Осталось: ${investment.daysLeft} д.`, textStyle(14, COLORS.text, '500'));
    container.add(daysLeftText);

    const payoutAmountText = this.add.text(0, 0, 'К выплате: ' + this.formatMoney(investment.payoutAmount) + ' ₽', textStyle(14, COLORS.text, '500'));
    container.add(payoutAmountText);

    let actionButton;
    if (investment.state === 'matured') {
      actionButton = createRoundedButton(this, {
        label: 'Забрать',
        onClick: () => this.collectInvestment(investment.id),
        fillColor: COLORS.success,
        fontSize: 14,
      });
    } else {
      actionButton = createRoundedButton(this, {
        label: 'Ожидание',
        onClick: () => {},
        fillColor: COLORS.neutral,
        fontSize: 14,
        disabled: true,
      });
    }
    container.add(actionButton);

    cardPanel.setSize(400, 176);

    return { container, cardPanel, titleText, amountText, returnText, daysLeftText, payoutAmountText, actionButton };
  }

  createBackButton() {
    this.backButton = createRoundedButton(this, {
      label: '← Назад',
      onClick: () => this.scene.start('MainGameScene'),
      fillColor: COLORS.neutral,
      fontSize: 16,
    });
    this.root.add(this.backButton);
    this.backButton.setDepth(10);
  }

  createToast() {
    this.toast = createToastMessage(this, { width: 220, height: 48 });
    this.root.add(this.toast);
    this.toast.setDepth(15);
  }

  createModals() {
    // Простое модальное окно
    this.modalPanel = createRoundedPanel(this, { panelAlpha: 1, radius: 18, shadowAlpha: 0.3 });
    this.modalPanel.setVisible(false);
    this.root.add(this.modalPanel);

    this.modalTitle = this.add.text(0, 0, '', textStyle(18, COLORS.text, '700'));
    this.modalPanel.add(this.modalTitle);

    this.modalText = this.add.text(0, 0, '', {
      ...textStyle(14, COLORS.text, '500'),
      wordWrap: { width: 400 },
    });
    this.modalPanel.add(this.modalText);

    this.modalButton = createRoundedButton(this, {
      label: 'Понятно',
      onClick: () => this.hideModal(),
      fillColor: COLORS.accent,
      fontSize: 16,
    });
    this.modalPanel.add(this.modalButton);
    this.modalPanel.setDepth(20);
  }

  showModal(title, text) {
    this.modalTitle.setText(title);
    this.modalText.setText(text);
    const w = this.scale.width;
    const h = this.scale.height;
    const modalW = Math.min(460, w - 40);
    const modalH = Math.min(220, h - 80);
    this.modalText.setStyle({ ...textStyle(14, COLORS.text, '500'), wordWrap: { width: modalW - 48 } });
    this.modalPanel.setVisible(true);
    this.modalPanel.setSize(modalW, modalH);
    this.modalPanel.setPosition((w - modalW) / 2, (h - modalH) / 2);

    this.modalTitle.setPosition(24, 28);
    this.modalText.setPosition(24, 64);
    this.modalButton.setPosition(modalW / 2, modalH - 36);
  }

  hideModal() {
    this.modalPanel.setVisible(false);
  }

  showToast(message) {
    this.toast.show(message);
  }

  applyAction(actionId) {
    const result = this.financeActionSystem.applyFinanceAction(actionId);

    if (result.success) {
      this.sceneAdapter.syncToSaveData();
      this.persistenceSystem.saveGame(this.sceneAdapter.getSaveData());

      this.showToast(result.message);
      this.updateUI();
    } else {
      this.showToast(result.message);
    }
  }

  collectInvestment(investmentId) {
    const result = this.investmentSystem.collectInvestment(investmentId);

    if (result.success) {
      this.sceneAdapter.syncToSaveData();
      this.persistenceSystem.saveGame(this.sceneAdapter.getSaveData());

      this.showToast(result.message);
      this.updateUI();
    } else {
      this.showToast(result.message);
    }
  }

  collectAllMatured() {
    const matured = this.investmentSystem.getMaturedInvestments();
    let collectedCount = 0;
    let totalPayout = 0;

    matured.forEach(investment => {
      const result = this.investmentSystem.collectInvestment(investment.id);
      if (result.success) {
        collectedCount++;
        totalPayout += investment.payoutAmount || 0;
      }
    });

    if (collectedCount > 0) {
      this.sceneAdapter.syncToSaveData();
      this.persistenceSystem.saveGame(this.sceneAdapter.getSaveData());

      this.showToast(`Собрано ${collectedCount} инвестиций на сумму ${this.formatMoney(totalPayout)} ₽`);
      this.updateUI();
    }
  }

  destroyFinancePanels() {
    if (this.collectAllButton) {
      this.collectAllButton.destroy();
      this.collectAllButton = undefined;
    }
    if (this.financeScrollContent) {
      this.financeScrollContent.removeAll(true);
    }
    this.overviewCard = null;
    this.overviewTitle = null;
    this.liquidMoneyText = null;
    this.liquidMoneyLabel = null;
    this.reserveFundText = null;
    this.reserveFundLabel = null;
    this.investedText = null;
    this.investedLabel = null;
    this.monthlyBalanceText = null;
    this.monthlyBalanceLabel = null;
    this.expensesCard = null;
    this.expensesTitle = null;
    this.expenseItems = null;
    this.expenseTotal = null;
    this.expenseIncome = null;
    this.actionsCard = null;
    this.actionsTitle = null;
    this.actionCards = [];
    this.investmentsCard = null;
    this.investmentsTitle = null;
    this.investmentCards = [];
  }

  updateUI() {
    this.financeScrollY = 0;
    this.destroyFinancePanels();
    this.createOverview();
    this.createExpenses();
    this.createActions();
    this.createInvestments();
    this.handleResize(this.scale.gameSize);
  }

  formatMoney(value) {
    return new Intl.NumberFormat('ru-RU').format(value);
  }

  layoutOverviewMetrics(narrow) {
    const ox = this.overviewCard.x;
    const oy = this.overviewCard.y;
    const cw = this.overviewCard.width;
    this.overviewTitle.setPosition(ox + 24, oy + 20);

    if (narrow) {
      this.liquidMoneyText.setPosition(ox + 24, oy + 52);
      this.liquidMoneyLabel.setPosition(ox + 24, oy + 86);
      this.reserveFundText.setPosition(ox + 24, oy + 112);
      this.reserveFundLabel.setPosition(ox + 24, oy + 146);
      this.investedText.setPosition(ox + 24, oy + 172);
      this.investedLabel.setPosition(ox + 24, oy + 206);
      this.monthlyBalanceText.setPosition(ox + 24, oy + 238);
      this.monthlyBalanceLabel.setPosition(ox + 24, oy + 272);
    } else {
      const col2 = Math.floor(cw * 0.38);
      const col3 = Math.floor(cw * 0.62);
      this.liquidMoneyText.setPosition(ox + 24, oy + 56);
      this.liquidMoneyLabel.setPosition(ox + 24, oy + 92);
      this.reserveFundText.setPosition(ox + col2, oy + 56);
      this.reserveFundLabel.setPosition(ox + col2, oy + 92);
      this.investedText.setPosition(ox + col3, oy + 56);
      this.investedLabel.setPosition(ox + col3, oy + 92);
      this.monthlyBalanceText.setPosition(ox + 24, oy + 132);
      this.monthlyBalanceLabel.setPosition(ox + 24, oy + 160);
    }
  }

  handleResize(gameSize) {
    const w = gameSize.width;
    const h = gameSize.height;
    const safeX = Math.max(16, Math.floor(w * 0.03));
    const safeY = Math.max(16, Math.floor(h * 0.03));
    const maxW = Math.min(920, w - safeX * 2);
    const sceneX = (w - maxW) / 2;
    const headerH = 100;
    const gap = 14;
    const backReserve = 92;
    const narrow = maxW < 520;

    this.headerCard.setSize(maxW, headerH);
    this.headerCard.setPosition(sceneX, safeY);

    this.headerTitle.setPosition(this.headerCard.x + 24, this.headerCard.y + 28);
    this.headerSubtitle.setPosition(this.headerCard.x + 24, this.headerCard.y + 62);

    const scrollTop = safeY + headerH + gap;
    const scrollBottom = h - safeY - backReserve;
    this.scrollViewportH = Math.max(160, scrollBottom - scrollTop);
    this.scrollContentX = sceneX;
    this.scrollTopY = scrollTop;

    this.scrollMaskRect.setPosition(sceneX, scrollTop);
    this.scrollMaskRect.setSize(maxW, this.scrollViewportH);
    this.scrollViewportRect = { x: sceneX, y: scrollTop, w: maxW, h: this.scrollViewportH };

    let y = 0;

    const overviewH = narrow ? 300 : 188;
    if (this.overviewCard) {
      this.overviewCard.setSize(maxW, overviewH);
      this.overviewCard.setPosition(0, y);
      if (this.overviewTitle) {
        this.layoutOverviewMetrics(narrow);
      }
      y += overviewH + gap;
    }

    const expenseLineCount = this.expenseItems?.length ?? 0;
    const lineHeight = 26;
    const expensesH = Math.max(128, 52 + expenseLineCount * lineHeight + 64);
    if (this.expensesCard) {
      this.expensesCard.setSize(maxW, expensesH);
      this.expensesCard.setPosition(0, y);

      this.expensesTitle.setPosition(this.expensesCard.x + 24, this.expensesCard.y + 20);

      const ex = this.expensesCard.x;
      const ey = this.expensesCard.y;
      const amountX = ex + Math.min(240, maxW - 112);

      this.expenseItems?.forEach((item, index) => {
        const lineY = ey + 52 + index * lineHeight;
        item.label.setPosition(ex + 24, lineY);
        item.amount.setPosition(amountX, lineY);
      });

      if (this.expenseTotal && this.expenseIncome) {
        const totalY = ey + 52 + expenseLineCount * lineHeight + 10;
        this.expenseTotal.label.setPosition(ex + 24, totalY);
        this.expenseTotal.amount.setPosition(amountX, totalY);

        this.expenseIncome.label.setPosition(ex + 24, totalY + 28);
        this.expenseIncome.amount.setPosition(amountX, totalY + 28);
      }

      y += expensesH + gap;
    }

    const cardSpacing = 16;
    const cardsPerRow = maxW >= 640 ? 2 : 1;
    const actionCount = this.actionCards?.length ?? 0;
    const actionCardH = 176;
    const actionRows = actionCount === 0 ? 0 : Math.ceil(actionCount / cardsPerRow);
    const actionsH =
      actionCount === 0 ? 72 : 52 + actionRows * (actionCardH + cardSpacing) + 12;

    if (this.actionsCard) {
      this.actionsCard.setSize(maxW, actionsH);
      this.actionsCard.setPosition(0, y);

      this.actionsTitle.setPosition(this.actionsCard.x + 24, this.actionsCard.y + 20);

      this.actionCards.forEach((card, index) => {
        const row = Math.floor(index / cardsPerRow);
        const col = index % cardsPerRow;
        const cardWidthInner = (this.actionsCard.width - cardSpacing * (cardsPerRow + 1)) / cardsPerRow;
        const relX = cardSpacing + col * (cardWidthInner + cardSpacing);
        const relY = 52 + row * (actionCardH + cardSpacing);

        card.cardPanel.setPosition(relX, relY);
        card.cardPanel.setSize(cardWidthInner, actionCardH);

        const wrapW = Math.max(96, cardWidthInner - 100);
        card.subtitleText.setStyle({
          ...textStyle(14, COLORS.text, '500'),
          wordWrap: { width: wrapW },
          lineSpacing: 2,
        });

        card.titleText.setPosition(relX + 14, relY + 14);
        card.subtitleText.setPosition(relX + 14, relY + 40);
        card.costText.setPosition(relX + cardWidthInner - 14, relY + 14);
        card.costText.setOrigin(1, 0);
        card.timeText.setPosition(relX + 14, relY + 92);
        card.actionButton.setPosition(relX + cardWidthInner / 2, relY + 128);
      });

      y += actionsH + gap;
    }

    if (this.investmentCards?.length) {
      const invCardsPerRow = maxW >= 640 ? 2 : 1;
      const invCardH = 176;
      const invCount = this.investmentCards.filter((c) => c.cardPanel).length;
      const isEmptyPlaceholder = invCount === 0 && this.investmentCards[0]?.container;

      let investmentsH;
      if (isEmptyPlaceholder) {
        investmentsH = 108;
      } else {
        const invRows = Math.ceil(Math.max(invCount, 1) / invCardsPerRow);
        investmentsH = 52 + invRows * (invCardH + cardSpacing) + 12;
      }

      this.investmentsCard.setSize(maxW, investmentsH);
      this.investmentsCard.setPosition(0, y);

      this.investmentsTitle.setPosition(this.investmentsCard.x + 24, this.investmentsCard.y + 20);

      if (isEmptyPlaceholder) {
        const placeholder = this.investmentCards[0].container;
        placeholder.setPosition(this.investmentsCard.width / 2, 62);
        placeholder.setOrigin(0.5, 0.5);
      } else {
        const invList = this.investmentCards.filter((c) => c.cardPanel);
        invList.forEach((card, index) => {
          const row = Math.floor(index / invCardsPerRow);
          const col = index % invCardsPerRow;
          const cardWidthInner = (this.investmentsCard.width - cardSpacing * (invCardsPerRow + 1)) / invCardsPerRow;
          const relX = cardSpacing + col * (cardWidthInner + cardSpacing);
          const relY = 52 + row * (invCardH + cardSpacing);

          card.cardPanel.setPosition(relX, relY);
          card.cardPanel.setSize(cardWidthInner, invCardH);

          card.titleText.setStyle({
            ...textStyle(18, COLORS.text, '600'),
            wordWrap: { width: Math.max(80, cardWidthInner - 32) },
          });

          card.titleText.setPosition(relX + 14, relY + 14);
          card.amountText.setPosition(relX + 14, relY + 44);
          card.returnText.setPosition(relX + 14, relY + 68);
          card.daysLeftText.setPosition(relX + 14, relY + 90);
          card.payoutAmountText.setPosition(relX + 14, relY + 112);
          card.actionButton.setPosition(relX + cardWidthInner / 2, relY + 132);
        });
      }

      y += investmentsH + gap;
    }

    if (this.collectAllButton) {
      this.collectAllButton.setPosition(maxW / 2, y + 32);
      y += 72;
    }

    this.scrollContentHeight = y + SCROLL_CONTENT_BOTTOM_PAD;
    this.clampFinanceScroll();
    this.applyFinanceScrollPosition();

    this.backButton.setPosition(sceneX + maxW / 2, h - safeY - 36);

    this.toast.setPosition(w / 2, h - 100);

    if (this.modalPanel?.visible) {
      this.showModal(this.modalTitle.text, this.modalText.text);
    }
  }

  animateEntrance() {
    this.headerCard.alpha = 0;
    this.financeScrollContent.alpha = 0;
    this.backButton.alpha = 0;

    this.tweens.add({
      targets: this.headerCard,
      alpha: 1,
      duration: 400,
      ease: 'Cubic.easeOut',
    });

    this.tweens.add({
      targets: this.financeScrollContent,
      alpha: 1,
      duration: 520,
      delay: 90,
      ease: 'Cubic.easeOut',
    });

    this.tweens.add({
      targets: this.backButton,
      alpha: 1,
      duration: 400,
      delay: 360,
      ease: 'Cubic.easeOut',
    });
  }
}
