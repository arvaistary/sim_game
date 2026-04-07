import Phaser from 'phaser';
import { SceneAdapter } from '../ecs/adapters/SceneAdapter.js';
import { loadSave, persistSave } from '../game-state.js';
import {
  COLORS,
  createRoundedButton,
  createRoundedPanel,
  createToastMessage,
  textStyle,
} from '../ui-kit';

export class FinanceSceneECS extends Phaser.Scene {
  constructor() {
    super('FinanceScene');
  }

  create() {
    this.saveData = loadSave();
    this.registry.set('saveData', this.saveData);

    this.sceneAdapter = new SceneAdapter(this, this.saveData);
    this.sceneAdapter.initialize();

    const financeSystem = this.sceneAdapter.getSystem('financeAction');
    const investmentSystem = this.sceneAdapter.getSystem('investment');
    this.financeActionSystem = financeSystem;
    this.investmentSystem = investmentSystem;

    this.cameras.main.setBackgroundColor(COLORS.background);

    this.root = this.add.container(0, 0);
    this.createHeader();
    this.createOverview();
    this.createExpenses();
    this.createActions();
    this.createInvestments();
    this.createBackButton();
    this.createToast();
    this.createModals();

    this.scale.on('resize', this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.handleResize, this);
    });

    this.handleResize(this.scale.gameSize);
    this.animateEntrance();
  }

  createHeader() {
    this.headerCard = createRoundedPanel(this, { panelAlpha: 1, radius: 18, shadowAlpha: 0.22 });
    this.root.add(this.headerCard);

    this.headerTitle = this.add.text(0, 0, 'Финансы', textStyle(28, COLORS.text, '700'));
    this.headerSubtitle = this.add.text(0, 0, 'Управление финансами', textStyle(16, COLORS.text, '500'));
    this.root.add([this.headerTitle, this.headerSubtitle]);
  }

  createOverview() {
    this.overviewCard = createRoundedPanel(this, { panelAlpha: 1, radius: 18, shadowAlpha: 0.22 });
    this.root.add(this.overviewCard);

    const overview = this.financeActionSystem.getFinanceOverview();
    if (!overview) return;

    this.overviewTitle = this.add.text(0, 0, 'Обзор', textStyle(22, COLORS.text, '700'));
    this.root.add(this.overviewTitle);

    this.liquidMoneyText = this.add.text(0, 0, this.formatMoney(overview.liquidMoney) + ' ₽', textStyle(32, COLORS.accent, '700'));
    this.root.add(this.liquidMoneyText);

    this.liquidMoneyLabel = this.add.text(0, 0, 'Свободные деньги', textStyle(14, COLORS.text, '500'));
    this.root.add(this.liquidMoneyLabel);

    this.reserveFundText = this.add.text(0, 0, this.formatMoney(overview.reserveFund) + ' ₽', textStyle(24, COLORS.text, '600'));
    this.root.add(this.reserveFundText);

    this.reserveFundLabel = this.add.text(0, 0, 'Резервный фонд', textStyle(14, COLORS.text, '500'));
    this.root.add(this.reserveFundLabel);

    this.investedText = this.add.text(0, 0, this.formatMoney(overview.investedTotal) + ' ₽', textStyle(20, COLORS.text, '600'));
    this.root.add(this.investedText);

    this.investedLabel = this.add.text(0, 0, 'Вложено', textStyle(14, COLORS.text, '500'));
    this.root.add(this.investedLabel);

    this.monthlyBalanceText = this.add.text(0, 0, this.formatMoney(overview.monthlyBalance) + ' ₽/мес', textStyle(20, overview.monthlyBalance >= 0 ? COLORS.success : COLORS.danger, '600'));
    this.root.add(this.monthlyBalanceText);

    this.monthlyBalanceLabel = this.add.text(0, 0, 'Баланс месяца', textStyle(14, COLORS.text, '500'));
    this.root.add(this.monthlyBalanceLabel);
  }

  createExpenses() {
    this.expensesCard = createRoundedPanel(this, { panelAlpha: 1, radius: 18, shadowAlpha: 0.22 });
    this.root.add(this.expensesCard);

    this.expensesTitle = this.add.text(0, 0, 'Расходы', textStyle(22, COLORS.text, '700'));
    this.root.add(this.expensesTitle);

    const overview = this.financeActionSystem.getFinanceOverview();
    if (!overview) return;

    this.expenseItems = [];
    overview.expenseLines.forEach((expense, index) => {
      const label = this.add.text(0, 0, expense.label, textStyle(14, COLORS.text, '500'));
      const amount = this.add.text(0, 0, this.formatMoney(expense.amount) + ' ₽', textStyle(14, COLORS.text, '600'));
      this.root.add([label, amount]);
      this.expenseItems.push({ label, amount });
    });

    const totalLabel = this.add.text(0, 0, 'Итого', textStyle(16, COLORS.text, '700'));
    const totalAmount = this.add.text(0, 0, this.formatMoney(overview.monthlyExpensesTotal) + ' ₽', textStyle(18, COLORS.text, '700'));
    this.root.add([totalLabel, totalAmount]);
    this.expenseTotal = { label: totalLabel, amount: totalAmount };

    const incomeLabel = this.add.text(0, 0, 'Доход', textStyle(16, COLORS.text, '700'));
    const incomeAmount = this.add.text(0, 0, this.formatMoney(overview.monthlyIncome) + ' ₽', textStyle(18, COLORS.success, '700'));
    this.root.add([incomeLabel, incomeAmount]);
    this.expenseIncome = { label: incomeLabel, amount: incomeAmount };
  }

  createActions() {
    this.actionsCard = createRoundedPanel(this, { panelAlpha: 1, radius: 18, shadowAlpha: 0.22 });
    this.root.add(this.actionsCard);

    this.actionsTitle = this.add.text(0, 0, 'Действия', textStyle(22, COLORS.text, '700'));
    this.root.add(this.actionsTitle);

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

    const subtitleText = this.add.text(0, 0, action.subtitle, textStyle(14, COLORS.text, '500'));
    container.add(subtitleText);

    const costText = this.add.text(0, 0, this.formatMoney(action.amount) + ' ₽', textStyle(16, COLORS.accent, '600'));
    container.add(costText);

    const timeText = this.add.text(0, 0, `Время: ${action.dayCost} д.`, textStyle(12, COLORS.text, '400'));
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

    cardPanel.setSize(400, 160);

    return { container, cardPanel, titleText, subtitleText, costText, timeText, actionButton };
  }

  createInvestments() {
    this.investmentsCard = createRoundedPanel(this, { panelAlpha: 1, radius: 18, shadowAlpha: 0.22 });
    this.root.add(this.investmentsCard);

    this.investmentsTitle = this.add.text(0, 0, 'Инвестиции', textStyle(22, COLORS.text, '700'));
    this.root.add(this.investmentsTitle);

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
      this.root.add(this.collectAllButton);
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

    cardPanel.setSize(400, 160);

    return { container, cardPanel, titleText, amountText, returnText, daysLeftText, payoutAmountText, actionButton };
  }

  createBackButton() {
    this.backButton = createRoundedButton(this, {
      label: 'Back',
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
    // Простое модальное окно
    this.modalPanel = createRoundedPanel(this, { panelAlpha: 1, radius: 18, shadowAlpha: 0.3 });
    this.modalPanel.setVisible(false);
    this.root.add(this.modalPanel);

    this.modalTitle = this.add.text(0, 0, '', textStyle(18, COLORS.text, '700'));
    this.modalPanel.add(this.modalTitle);

    this.modalText = this.add.text(0, 0, '', textStyle(14, COLORS.text, '500'), { wordWrap: { width: 400 } });
    this.modalPanel.add(this.modalText);

    this.modalButton = createRoundedButton(this, {
      label: 'OK',
      onClick: () => this.hideModal(),
      fillColor: COLORS.accent,
      fontSize: 16,
    });
    this.modalPanel.add(this.modalButton);
  }

  showModal(title, text) {
    this.modalTitle.setText(title);
    this.modalText.setText(text);
    this.modalPanel.setVisible(true);
    this.modalPanel.setSize(460, 200);
    this.modalPanel.setPosition((this.scale.width - 460) / 2, (this.scale.height - 200) / 2);

    this.modalTitle.setPosition(24, 30);
    this.modalText.setPosition(24, 70);
    this.modalButton.setPosition(230, 150);
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
      persistSave(this, this.saveData);

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
      persistSave(this, this.saveData);

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
      persistSave(this, this.saveData);

      this.showToast(`Собрано ${collectedCount} инвестиций на сумму ${this.formatMoney(totalPayout)} ₽`);
      this.updateUI();
    }
  }

  updateUI() {
    // Обновляем обзор
    this.createOverview();
    this.createExpenses();
    this.createActions();
    this.createInvestments();
    this.handleResize(this.scale.gameSize);
  }

  formatMoney(value) {
    return new Intl.NumberFormat('ru-RU').format(value);
  }

  handleResize(gameSize) {
    const w = gameSize.width;
    const h = gameSize.height;
    const isDesktop = w >= 768;

    // Header
    this.headerCard.setSize(isDesktop ? 460 : w - 40, 100);
    this.headerCard.setPosition(isDesktop ? (w - 460) / 2 : 20, 20);

    this.headerTitle.setPosition(this.headerCard.x + 24, this.headerCard.y + 30);
    this.headerSubtitle.setPosition(this.headerCard.x + 24, this.headerCard.y + 65);

    // Overview
    this.overviewCard.setSize(isDesktop ? 460 : w - 40, 180);
    this.overviewCard.setPosition(isDesktop ? (w - 460) / 2 : 20, 130);

    this.overviewTitle.setPosition(this.overviewCard.x + 24, this.overviewCard.y + 24);

    this.liquidMoneyText.setPosition(this.overviewCard.x + 24, this.overviewCard.y + 60);
    this.liquidMoneyLabel.setPosition(this.overviewCard.x + 24, this.overviewCard.y + 95);

    this.reserveFundText.setPosition(this.overviewCard.x + 200, this.overviewCard.y + 60);
    this.reserveFundLabel.setPosition(this.overviewCard.x + 200, this.overviewCard.y + 95);

    this.investedText.setPosition(this.overviewCard.x + 320, this.overviewCard.y + 60);
    this.investedLabel.setPosition(this.overviewCard.x + 320, this.overviewCard.y + 95);

    this.monthlyBalanceText.setPosition(this.overviewCard.x + 24, this.overviewCard.y + 135);
    this.monthlyBalanceLabel.setPosition(this.overviewCard.x + 24, this.overviewCard.y + 160);

    // Expenses
    const cardWidth = isDesktop ? 460 : w - 40;
    this.expensesCard.setSize(cardWidth, 180);
    this.expensesCard.setPosition(isDesktop ? (w - cardWidth) / 2 : 20, 320);

    this.expensesTitle.setPosition(this.expensesCard.x + 24, this.expensesCard.y + 24);

    if (this.expenseItems) {
      const startY = this.expensesCard.y + 60;
      const lineHeight = 24;

      this.expenseItems.forEach((item, index) => {
        const y = startY + index * lineHeight;
        item.label.setPosition(this.expensesCard.x + 24, y);
        item.amount.setPosition(this.expensesCard.x + 200, y);
      });

      const totalY = startY + this.expenseItems.length * lineHeight;
      this.expenseTotal.label.setPosition(this.expensesCard.x + 24, totalY);
      this.expenseTotal.amount.setPosition(this.expensesCard.x + 200, totalY);

      this.expenseIncome.label.setPosition(this.expensesCard.x + 24, totalY + 24);
      this.expenseIncome.amount.setPosition(this.expensesCard.x + 200, totalY + 24);
    }

    // Actions
    let actionsY = 510;
    if (this.actionCards) {
      this.actionsCard.setSize(cardWidth, 200);
      this.actionsCard.setPosition(isDesktop ? (w - cardWidth) / 2 : 20, actionsY);

      this.actionsTitle.setPosition(this.actionsCard.x + 24, this.actionsCard.y + 24);

      const cardSpacing = 24;
      const cardsPerRow = isDesktop ? 2 : 1;
      const cardHeight = 160;

      this.actionCards.forEach((card, index) => {
        const row = Math.floor(index / cardsPerRow);
        const col = index % cardsPerRow;

        const cardWidthInner = (this.actionsCard.width - cardSpacing * (cardsPerRow + 1)) / cardsPerRow;

        const cardX = this.actionsCard.x + cardSpacing + col * (cardWidthInner + cardSpacing);
        const cardY = this.actionsCard.y + 60 + row * (cardHeight + cardSpacing);

        card.cardPanel.setPosition(cardX, cardY);
        card.cardPanel.setSize(cardWidthInner, cardHeight);

        card.titleText.setPosition(cardX + 20, cardY + 20);
        card.subtitleText.setPosition(cardX + 20, cardY + 45);
        card.costText.setPosition(cardX + cardWidthInner - 20, cardY + 20);
        card.costText.setOrigin(1, 0);
        card.timeText.setPosition(cardX + 20, cardY + 65);
        card.actionButton.setPosition(cardX + cardWidthInner / 2, cardY + 120);
      });

      actionsY = this.actionsCard.y + this.actionsCard.height + 20;
    }

    // Investments
    if (this.investmentCards) {
      const investmentHeight = 200;
      this.investmentsCard.setSize(cardWidth, investmentHeight);
      this.investmentsCard.setPosition(isDesktop ? (w - cardWidth) / 2 : 20, actionsY);

      this.investmentsTitle.setPosition(this.investmentsCard.x + 24, this.investmentsCard.y + 24);

      if (this.investmentCards.length === 1 && this.investmentCards[0].container.text) {
        // No investments text
        this.investmentCards[0].container.setPosition(
          this.investmentsCard.x + this.investmentsCard.width / 2,
          this.investmentsCard.y + this.investmentsCard.height / 2
        );
      } else {
        const cardSpacing = 24;
        const cardsPerRow = isDesktop ? 2 : 1;
        const cardHeight = 160;

        this.investmentCards.forEach((card, index) => {
          const row = Math.floor(index / cardsPerRow);
          const col = index % cardsPerRow;

          const cardWidthInner = (this.investmentsCard.width - cardSpacing * (cardsPerRow + 1)) / cardsPerRow;

          const cardX = this.investmentsCard.x + cardSpacing + col * (cardWidthInner + cardSpacing);
          const cardY = this.investmentsCard.y + 60 + row * (cardHeight + cardSpacing);

          card.cardPanel.setPosition(cardX, cardY);
          card.cardPanel.setSize(cardWidthInner, cardHeight);

          card.titleText.setPosition(cardX + 20, cardY + 20);
          card.amountText.setPosition(cardX + 20, cardY + 45);
          card.returnText.setPosition(cardX + 20, cardY + 65);
          card.daysLeftText.setPosition(cardX + 20, cardY + 85);
          card.payoutAmountText.setPosition(cardX + 20, cardY + 105);
          card.actionButton.setPosition(cardX + cardWidthInner / 2, cardY + 120);
        });
      }

      actionsY = this.investmentsCard.y + this.investmentsCard.height + 20;
    }

    // Collect all button
    if (this.collectAllButton) {
      this.collectAllButton.setPosition(cardWidth / 2 + (isDesktop ? (w - cardWidth) / 2 : 20), actionsY);
      actionsY += 80;
    }

    // Back button
    this.backButton.setPosition(cardWidth / 2 + (isDesktop ? (w - cardWidth) / 2 : 20), h - 60);

    // Toast
    this.toast.setPosition(w / 2, h - 120);
  }

  animateEntrance() {
    this.headerCard.alpha = 0;
    this.overviewCard.alpha = 0;
    this.expensesCard.alpha = 0;
    this.actionsCard.alpha = 0;
    this.investmentsCard.alpha = 0;
    this.backButton.alpha = 0;

    this.tweens.add({
      targets: this.headerCard,
      alpha: 1,
      duration: 400,
      ease: 'Cubic.easeOut',
    });

    this.tweens.add({
      targets: this.overviewCard,
      alpha: 1,
      duration: 500,
      delay: 100,
      ease: 'Cubic.easeOut',
    });

    this.tweens.add({
      targets: this.expensesCard,
      alpha: 1,
      duration: 500,
      delay: 150,
      ease: 'Cubic.easeOut',
    });

    this.tweens.add({
      targets: this.actionsCard,
      alpha: 1,
      duration: 500,
      delay: 200,
      ease: 'Cubic.easeOut',
    });

    this.tweens.add({
      targets: this.investmentsCard,
      alpha: 1,
      duration: 500,
      delay: 250,
      ease: 'Cubic.easeOut',
    });

    this.tweens.add({
      targets: this.backButton,
      alpha: 1,
      duration: 400,
      delay: 400,
      ease: 'Cubic.easeOut',
    });
  }
}
