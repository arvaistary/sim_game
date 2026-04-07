import Phaser from 'phaser';
import { SceneAdapter } from '../ecs/adapters/SceneAdapter.js';
import { PersistenceSystem } from '../ecs/systems/index.js';
import { defaultSaveData } from '../ecs/data/default-save.js';
import {
  COLORS,
  createEventModal,
  createNotificationModal,
  createRoundedButton,
  createRoundedPanel,
  createToastMessage,
  textStyle,
} from '../ui-kit';
import { RECOVERY_TABS } from '../shared/constants.js';

/**
 * RecoveryScene с полной поддержкой ECS
 * Обрабатывает восстановление через магазин, развлечения, дом и т.д.
 * Больше не использует прямые обращения к legacy game-state
 */
export class RecoverySceneECS extends Phaser.Scene {
  constructor() {
    super('RecoveryScene');
  }

  init(data) {
    this.initialTab = data.initialTab || 'shop';
  }

  create() {
    // Создаём ECS адаптер с данными по умолчанию
    this.sceneAdapter = new SceneAdapter(this, defaultSaveData);
    this.sceneAdapter.initialize();

    // Добавляем Persistence System
    this.persistenceSystem = new PersistenceSystem();
    this.persistenceSystem.init(this.sceneAdapter.getWorld());

    // Загружаем сохранение через Persistence System
    const saveData = this.persistenceSystem.load();
    
    if (saveData) {
      this.sceneAdapter.updateFromSaveData(saveData);
    }
    
    // Получаем системы
    this.recoverySystem = this.sceneAdapter.getSystem('recovery');
    this.statsSystem = this.sceneAdapter.getSystem('stats');

    this.cameras.main.setBackgroundColor(COLORS.background);

    this.root = this.add.container(0, 0);
    this.createHeader();
    this.createTabs();
    this.createContent();
    this.createBackButton();
    this.createToast();
    this.createModals();

    this.selectTab(this.initialTab);

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

    this.headerTitle = this.add.text(0, 0, 'Восстановление', textStyle(28, COLORS.text, '700'));
    this.headerSubtitle = this.add.text(0, 0, 'Выберите действие для восстановления ресурсов', textStyle(16, COLORS.text, '500'));
    this.root.add([this.headerTitle, this.headerSubtitle]);
  }

  createTabs() {
    this.tabsCard = createRoundedPanel(this, { panelAlpha: 1, radius: 18, shadowAlpha: 0.22 });
    this.root.add(this.tabsCard);

    this.tabButtons = RECOVERY_TABS.map((tab, index) => {
      const button = createRoundedButton(this, {
        label: tab.label,
        onClick: () => this.selectTab(tab.id),
        fillColor: COLORS.neutral,
        fontSize: 14,
      });
      this.root.add(button);
      return { button, tab, index };
    });
  }

  createContent() {
    this.contentCard = createRoundedPanel(this, { panelAlpha: 1, radius: 18, shadowAlpha: 0.22 });
    this.root.add(this.contentCard);

    this.contentTitle = this.add.text(0, 0, '', textStyle(22, COLORS.text, '700'));
    this.contentSubtitle = this.add.text(0, 0, '', textStyle(14, COLORS.text, '500'));
    this.root.add([this.contentTitle, this.contentSubtitle]);

    this.cardsContainer = this.add.container(0, 0);
    this.root.add(this.cardsContainer);
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
    this.currentTab = RECOVERY_TABS.find(tab => tab.id === tabId);
    if (!this.currentTab) return;

    // Обновляем кнопки табов
    this.tabButtons.forEach(({ button, tab }) => {
      const isSelected = tab.id === tabId;
      button.setFillColor(isSelected ? COLORS.accent : COLORS.neutral);
    });

    // Обновляем контент
    this.contentTitle.setText(this.currentTab.title);
    this.contentSubtitle.setText(this.currentTab.subtitle);

    // Создаём карточки действий
    this.createActionCards();
    this.handleResize(this.scale.gameSize);
  }

  createActionCards() {
    // Удаляем старые карточки
    this.cardsContainer.removeAll(true);

    this.currentTab.cards.forEach((card, index) => {
      const cardContainer = this.createActionCard(card, index);
      this.cardsContainer.add(cardContainer);
    });
  }

  createActionCard(cardData, index) {
    const container = this.add.container(0, 0);
    const cardPanel = createRoundedPanel(this, { panelAlpha: 1, radius: 14, shadowAlpha: 0.15 });
    container.add(cardPanel);

    const titleText = this.add.text(0, 0, cardData.title, textStyle(18, COLORS.text, '700'));
    container.add(titleText);

    const effectText = this.add.text(0, 0, cardData.effect, textStyle(14, COLORS.text, '500'));
    container.add(effectText);

    const priceText = this.add.text(0, 0, this.formatMoney(cardData.price) + ' ₽', textStyle(20, COLORS.accent, '700'));
    container.add(priceText);

    const timeText = this.add.text(0, 0, `Время: ${cardData.dayCost} д.`, textStyle(14, COLORS.text, '500'));
    container.add(timeText);

    const moodText = this.add.text(0, 0, cardData.mood, textStyle(14, COLORS.text, '400'));
    container.add(moodText);

    const actionButton = createRoundedButton(this, {
      label: 'Применить',
      onClick: () => this.applyAction(cardData),
      fillColor: COLORS.accent,
      fontSize: 16,
    });
    container.add(actionButton);

    cardPanel.setSize(400, 180);

    return { container, cardPanel, titleText, effectText, priceText, timeText, moodText, actionButton };
  }

  applyAction(cardData) {
    const playerId = this.sceneAdapter.getPlayerEntityId();
    const world = this.sceneAdapter.getWorld();
    const finance = world.getComponent(playerId, 'finance');
    
    // Валидация: проверяем деньги
    if (finance.money < cardData.price) {
      this.showToast(`Недостаточно денег. Нужно ${cardData.price} ₽`);
      return;
    }

    // Применяем через ECS систему
    const summary = this.recoverySystem.recover(playerId, this.currentTab, cardData.id);

    // Синхронизируем и сохраняем через ECS
    this.sceneAdapter.syncToSaveData();
    this.persistenceSystem.save(this.sceneAdapter.getSaveData());

    // Показываем результат
    this.refreshContent();
    this.notificationModal.show({
      title: 'Действие завершено',
      description: summary,
      onConfirm: () => this.scene.start('MainGameScene'),
    });
  }

  refreshContent() {
    // Обновляем UI если нужно
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
    const isDesktop = w >= 768;

    // Header
    this.headerCard.setSize(isDesktop ? 460 : w - 40, 100);
    this.headerCard.setPosition(isDesktop ? (w - 460) / 2 : 20, 20);

    this.headerTitle.setPosition(this.headerCard.x + 24, this.headerCard.y + 30);
    this.headerSubtitle.setPosition(this.headerCard.x + 24, this.headerCard.y + 65);

    // Tabs
    this.tabsCard.setSize(isDesktop ? 680 : w - 40, 80);
    this.tabsCard.setPosition(isDesktop ? (w - 680) / 2 : 20, 130);

    const tabSpacing = isDesktop ? 100 : 80;
    const tabsTotalWidth = this.tabButtons.length * tabSpacing;
    const tabsStartX = this.tabsCard.x + (this.tabsCard.width - tabsTotalWidth) / 2 + tabSpacing / 2;

    this.tabButtons.forEach(({ button }, i) => {
      button.setPosition(tabsStartX + i * tabSpacing, this.tabsCard.y + 40);
    });

    // Content
    this.contentCard.setSize(isDesktop ? 680 : w - 40, h - 300);
    this.contentCard.setPosition(isDesktop ? (w - 680) / 2 : 20, 220);

    this.contentTitle.setPosition(this.contentCard.x + 24, this.contentCard.y + 24);
    this.contentSubtitle.setPosition(this.contentCard.x + 24, this.contentCard.y + 58);

    // Action cards
    if (this.cardsContainer.list.length > 0) {
      const cardSpacing = 24;
      let cardY = this.contentCard.y + 90;

      this.cardsContainer.list.forEach((cardObj, i) => {
        if (cardObj.cardPanel) {
          cardObj.cardPanel.setPosition(this.contentCard.x + (this.contentCard.width - 400) / 2, cardY);
          
          cardObj.titleText.setPosition(cardObj.cardPanel.x + 20, cardObj.cardPanel.y + 20);
          cardObj.effectText.setPosition(cardObj.cardPanel.x + 20, cardObj.cardPanel.y + 50);
          cardObj.priceText.setPosition(cardObj.cardPanel.x + cardObj.cardPanel.width - 20, cardObj.cardPanel.y + 20);
          cardObj.priceText.setOrigin(1, 0);
          cardObj.timeText.setPosition(cardObj.cardPanel.x + 20, cardObj.cardPanel.y + 80);
          cardObj.moodText.setPosition(cardObj.cardPanel.x + 20, cardObj.cardPanel.y + 105);
          cardObj.actionButton.setPosition(cardObj.cardPanel.x + cardObj.cardPanel.width - 80, cardObj.cardPanel.y + 140);

          cardY += cardObj.cardPanel.height + cardSpacing;
        }
      });

      // Scroll container if needed
      if (cardY > this.contentCard.y + this.contentCard.height) {
        this.cardsContainer.y = -(cardY - this.contentCard.y - this.contentCard.height + 20);
      } else {
        this.cardsContainer.y = 0;
      }
    }

    // Back button
    this.backButton.setPosition(this.contentCard.x + this.contentCard.width / 2, h - 60);

    // Toast
    this.toast.setPosition(w / 2, h - 120);

    // Modal
    if (this.notificationModal.visible) {
      this.notificationModal.center();
    }
  }

  animateEntrance() {
    this.headerCard.alpha = 0;
    this.tabsCard.alpha = 0;
    this.contentCard.alpha = 0;
    this.backButton.alpha = 0;

    this.tweens.add({
      targets: this.headerCard,
      alpha: 1,
      duration: 400,
      ease: 'Cubic.easeOut',
    });

    this.tweens.add({
      targets: this.tabsCard,
      alpha: 1,
      duration: 500,
      delay: 100,
      ease: 'Cubic.easeOut',
    });

    this.tweens.add({
      targets: this.contentCard,
      alpha: 1,
      duration: 600,
      delay: 200,
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
