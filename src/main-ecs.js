import Phaser from 'phaser';
import './style.css';
import { SceneAdapter } from './ecs/adapters/SceneAdapter.js';
import { PersistenceSystem } from './ecs/systems/index.js';
import { defaultSaveData } from './ecs/data/default-save.js';
import {
  COLORS,
  createEventModal,
  createNotificationModal,
  createRoundedButton,
  createRoundedPanel,
  createToastMessage,
  textStyle,
} from './ui-kit';
import { STAT_DEFS, NAV_ITEMS } from './shared/constants.js';

// Import legacy scenes (will be removed in future)
import './main.js';

/**
 * MainGameScene с поддержкой ECS
 */
class MainGameSceneECSEnhanced extends Phaser.Scene {
  constructor() {
    super('MainGameScene');
    this.statBars = [];
  }

  create() {
    // Создаём ECS адаптер с данными по умолчанию
    this.sceneAdapter = new SceneAdapter(this, defaultSaveData);
    this.sceneAdapter.initialize();

    // Добавляем Persistence System для управления сохранениями
    this.persistenceSystem = new PersistenceSystem();
    this.persistenceSystem.init(this.sceneAdapter.getWorld());

    // Загружаем сохранение через Persistence System
    const saveData = this.persistenceSystem.load();
    
    if (saveData) {
      // Обновляем адаптер данными из сохранения
      this.sceneAdapter.updateFromSaveData(saveData);
    }
    
    // Получаем системы ECS
    this.statsSystem = this.sceneAdapter.getSystem('stats');
    this.workPeriodSystem = this.sceneAdapter.getSystem('workPeriod');

    this.cameras.main.setBackgroundColor(COLORS.background);

    this.backgroundDecor = this.add.graphics();
    this.root = this.add.container(0, 0);

    this.topCard = this.createCard();
    this.characterCard = this.createCard();
    this.actionCard = this.createCard();
    this.navCard = this.createCard();

    this.root.add([this.topCard, this.characterCard, this.actionCard, this.navCard]);

    this.playerNameText = this.add.text(0, 0, '', textStyle(28, COLORS.text, '700'));
    this.jobText = this.add.text(0, 0, '', textStyle(16, COLORS.text, '500'));
    this.moneyText = this.add.text(0, 0, '', textStyle(26, COLORS.text, '700'));
    this.timeText = this.add.text(0, 0, '', textStyle(16, COLORS.text, '500'));
    this.comfortText = this.add.text(0, 0, '', textStyle(16, COLORS.text, '500'));
    this.careerButton = createRoundedButton(this, {
      label: 'Карьера',
      onClick: () => this.scene.start('CareerScene'),
      fillColor: COLORS.neutral,
      fontSize: 14,
    });
    this.root.add([
      this.playerNameText,
      this.jobText,
      this.moneyText,
      this.timeText,
      this.comfortText,
      this.careerButton,
    ]);

    this.character = this.createCharacterBlock();
    this.root.add(this.character.container);

    this.sectionTitle = this.add.text(0, 0, 'Состояние персонажа', textStyle(18, COLORS.text, '700'));
    this.root.add(this.sectionTitle);

    this.createStats();
    this.createActionButton();
    this.createNavigation();
    this.createToast();
    this.createSceneModals();
    this.refreshTexts();

    this.scale.on('resize', this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.handleResize, this);
    });

    this.handleResize(this.scale.gameSize);
    this.animateEntrance();
    this.ensureEventQueue(520);
  }

  createCard() {
    return createRoundedPanel(this, { panelAlpha: 1, radius: 18, shadowAlpha: 0.22 });
  }

  createCharacterBlock() {
    const container = this.add.container(0, 0);
    const shadow = this.add.ellipse(0, 172, 148, 36, COLORS.shadow, 0.22);
    const halo = this.add.circle(0, -18, 92, COLORS.accent, 0.12);
    const body = this.add.graphics();

    body.fillStyle(COLORS.sage, 0.28);
    body.fillRoundedRect(-72, 18, 144, 136, 44);
    body.fillStyle(COLORS.accent, 1);
    body.fillCircle(0, -24, 36);
    body.fillStyle(COLORS.sage, 1);
    body.fillRoundedRect(-52, 10, 104, 128, 34);
    body.fillStyle(COLORS.blue, 1);
    body.fillRoundedRect(-48, 60, 96, 72, 24);

    const face = this.add.graphics();
    face.fillStyle(COLORS.text, 0.95);
    face.fillCircle(-13, -28, 3);
    face.fillCircle(13, -28, 3);
    face.fillRoundedRect(-14, -4, 28, 6, 3);

    const caption = this.add.text(0, 214, 'Текущий рабочий настрой', textStyle(16, COLORS.text, '600'));
    caption.setOrigin(0.5);

    container.add([shadow, halo, body, face, caption]);
    return { container, caption };
  }

  createStats() {
    this.statBars = STAT_DEFS.map((stat) => {
      const bar = new StatBar(this, 0, 0, 320, stat);
      this.root.add(bar.container);
      return bar;
    });
  }

  createActionButton() {
    this.actionButton = createRoundedButton(this, {
      label: 'Пойти на работу',
      onClick: () => this.showWorkPeriodModal(),
      fillColor: COLORS.accent,
      fontSize: 22,
    });
    this.actionButton.text.setY(-10);
    this.actionButton.subtitle = this.add.text(0, 16, 'обменять свое здоровье на деньги', textStyle(14, COLORS.text, '500'));
    this.actionButton.subtitle.setOrigin(0.5);
    this.actionButton.add(this.actionButton.subtitle);
    this.root.add(this.actionButton);
  }

  createNavigation() {
    this.navButtons = NAV_ITEMS.map((item) => {
      const container = this.add.container(0, 0);
      const dot = this.add.circle(0, -10, 21, item.id === 'home' ? COLORS.accent : COLORS.accentSoft, 1);
      const icon = this.add.text(0, -10, item.icon, textStyle(18, COLORS.text, '700'));
      icon.setOrigin(0.5);
      const label = this.add.text(0, 24, item.label, textStyle(12, COLORS.text, '600'));
      label.setOrigin(0.5);
      const hit = this.add.circle(0, 8, 34, 0x000000, 0);

      hit.setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => this.tweens.add({ targets: container, y: container.y - 4, duration: 180 }));
      hit.on('pointerout', () => this.tweens.add({ targets: container, y: container.baseY, duration: 180 }));
      hit.on('pointerup', () => {
        if (item.id === 'education') {
          this.scene.start('EducationScene');
          return;
        }

        if (item.id === 'finance') {
          this.scene.start('FinanceScene');
          return;
        }

        if (item.id === 'home') {
          this.scene.start('HomeScene');
          return;
        }

        if (item.id === 'shop') {
          this.scene.start('ShopScene');
          return;
        }

        if (item.id === 'social') {
          this.scene.start('SocialScene');
          return;
        }

        if (item.id === 'fun') {
          this.scene.start('FunScene');
          return;
        }

        this.scene.start('RecoveryScene', { initialTab: item.id });
      });

      container.baseY = 0;
      container.add([dot, icon, label, hit]);
      this.root.add(container);
      return container;
    });
  }

  createToast() {
    this.toast = createToastMessage(this, { width: 220, height: 48 });
    this.root.add(this.toast);
  }

  createSceneModals() {
    this.workPeriodModal = createEventModal(this, {
      primaryLabel: 'Начать',
      secondaryLabel: 'Позже',
    });
    this.notificationModal = createNotificationModal(this, {
      primaryLabel: 'Понятно',
      secondaryLabel: 'Закрыть',
    });
    this.root.add([this.workPeriodModal, this.notificationModal]);
  }

  showToast(message) {
    this.toast.show(message);
  }

  showWorkPeriodModal() {
    const { currentJob } = this.saveData;
    const schedule = currentJob.schedule || '5/2';
    const parts = schedule.split('/');
    const workDays = parts.length === 2 ? parseInt(parts[0], 10) : 5;
    
    this.workPeriodModal.show({
      title: 'Рабочий период',
      description: `Смена: ${workDays} рабочих дней.\nЗа это время ты получишь зарплату, но потратишь энергию и настроение.`,
      event: {
        title: 'Ожидаемый результат',
        description: `Зарплата: ${this.formatMoney(currentJob.salaryPerDay * workDays)} ₽`,
      },
      onConfirm: () => this.startWorkPeriod(workDays),
    });
  }

  startWorkPeriod(workDays) {
    // Используем ECS систему для обработки рабочего периода
    const workPeriodSystem = this.sceneAdapter.getSystem('workPeriod');
    const summary = workPeriodSystem.applyWorkPeriodResult(workDays);
    
    // Синхронизируем с saveData
    this.sceneAdapter.syncToSaveData();
    persistSave(this, this.saveData);
    
    // Показываем результат
    this.refreshTexts();
    this.notificationModal.show({
      title: 'Рабочий период завершён',
      description: summary,
      onConfirm: () => this.ensureEventQueue(520),
    });
  }

  refreshTexts() {
    const world = this.sceneAdapter.getWorld();
    const playerId = this.sceneAdapter.getPlayerEntityId();
    
    // Получаем данные из ECS компонентов
    const stats = world.getComponent(playerId, 'stats');
    const career = world.getComponent(playerId, 'career');
    const finance = world.getComponent(playerId, 'finance');
    const time = world.getComponent(playerId, 'time');
    const housing = world.getComponent(playerId, 'housing');
    
    // Или получаем через syncToSaveData для совместимости
    const saveData = this.sceneAdapter.getSaveData();
    
    this.playerNameText.setText(saveData.playerName);
    this.jobText.setText(`${career?.currentJob?.name || 'Безработный'}`);
    this.moneyText.setText(this.formatMoney(finance?.money || 0) + ' ₽');
    this.timeText.setText(`День ${time?.gameDays || 1} • ${time?.currentAge || 18} лет`);
    this.comfortText.setText(`Комфорт: ${Math.round(housing?.comfort || 35)}`);

    this.statBars.forEach((bar, i) => {
      const statDef = STAT_DEFS[i];
      const value = stats?.[statDef.key] || 50;
      bar.animateTo(value);
    });
  }

  formatMoney(value) {
    return new Intl.NumberFormat('ru-RU').format(value);
  }

  handleResize(gameSize) {
    const w = gameSize.width;
    const h = gameSize.height;
    const isDesktop = w >= 768;

    this.topCard.setSize(isDesktop ? 460 : w - 40, isDesktop ? 160 : 150);
    this.topCard.setPosition(isDesktop ? (w - 460) / 2 : 20, 20);

    this.characterCard.setSize(160, 200);
    this.characterCard.setPosition(this.topCard.x + 20, this.topCard.y + 15);

    this.playerNameText.setPosition(this.characterCard.x + 180, this.topCard.y + 30);
    this.jobText.setPosition(this.playerNameText.x, this.topCard.y + 58);
    this.moneyText.setPosition(this.playerNameText.x, this.topCard.y + 90);
    this.timeText.setPosition(this.playerNameText.x, this.topCard.y + 122);
    this.comfortText.setPosition(this.playerNameText.x + 160, this.topCard.y + 122);

    this.careerButton.setPosition(this.comfortText.x - 70, this.comfortText.y - 12);

    this.characterCard.setSize(isDesktop ? 480 : w - 40, isDesktop ? 520 : h - 220);
    this.characterCard.setPosition(isDesktop ? (w - 480) / 2 : 20, isDesktop ? 200 : 170);

    this.sectionTitle.setPosition(this.characterCard.x + 24, this.characterCard.y + 24);

    this.statBars.forEach((bar, i) => {
      bar.setPosition(
        this.characterCard.x + 24,
        this.sectionTitle.y + 46 + i * 58,
        isDesktop ? 432 : w - 88
      );
    });

    this.actionCard.setSize(isDesktop ? 480 : w - 40, 100);
    this.actionCard.setPosition(isDesktop ? (w - 480) / 2 : 20, h - 120);

    this.actionButton.setPosition(this.actionCard.x + this.actionCard.width / 2, this.actionCard.y + 50);

    this.navCard.setSize(isDesktop ? 680 : w - 40, 80);
    this.navCard.setPosition(isDesktop ? (w - 680) / 2 : 20, isDesktop ? h - 100 : h - 220);

    const buttonSpacing = isDesktop ? 100 : 80;
    const totalWidth = NAV_ITEMS.length * buttonSpacing;
    const startX = this.navCard.x + (this.navCard.width - totalWidth) / 2 + buttonSpacing / 2;

    this.navButtons.forEach((button, i) => {
      button.setPosition(startX + i * buttonSpacing, this.navCard.y + 40);
    });

    this.toast.setPosition(w / 2, h - 160);

    if (this.workPeriodModal.visible) {
      this.workPeriodModal.center();
    }
    if (this.notificationModal.visible) {
      this.notificationModal.center();
    }
  }

  animateEntrance() {
    this.topCard.alpha = 0;
    this.characterCard.alpha = 0;
    this.actionCard.alpha = 0;
    this.navCard.alpha = 0;

    this.tweens.add({
      targets: [this.topCard, this.playerNameText, this.jobText, this.moneyText, this.timeText, this.comfortText, this.careerButton],
      alpha: 1,
      duration: 400,
      ease: 'Cubic.easeOut',
    });

    this.tweens.add({
      targets: [this.characterCard, this.character.container],
      alpha: 1,
      duration: 500,
      delay: 100,
      ease: 'Cubic.easeOut',
    });

    this.tweens.add({
      targets: this.actionCard,
      alpha: 1,
      duration: 500,
      delay: 200,
      ease: 'Cubic.easeOut',
    });

    this.tweens.add({
      targets: this.navCard,
      alpha: 1,
      duration: 500,
      delay: 300,
      ease: 'Cubic.easeOut',
    });
  }

  ensureEventQueue(delay = 0) {
    this.time.delayedCall(delay, () => {
      if (this.saveData.pendingEvents && this.saveData.pendingEvents.length > 0) {
        this.scene.start('EventQueueScene');
      }
    });
  }
}

class StatBar {
  constructor(scene, x, y, width, config) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = 14;
    this.config = config;
    this.value = 0;

    this.container = scene.add.container(x, y);
    this.label = scene.add.text(0, 0, config.label, textStyle(18, COLORS.text, '600'));
    this.label.setOrigin(0, 0.5);

    this.valueText = scene.add.text(width, 0, '0%', textStyle(16, COLORS.text, '600'));
    this.valueText.setOrigin(1, 0.5);

    this.track = scene.add.graphics();
    this.fill = scene.add.graphics();

    this.container.add([this.label, this.valueText, this.track, this.fill]);
    this.redraw(0);
  }

  setPosition(x, y, width = this.width) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.container.setPosition(x, y);
    this.redraw(this.value);
  }

  animateTo(value) {
    const target = Phaser.Math.Clamp(value, 0, 100);
    this.scene.tweens.addCounter({
      from: this.value,
      to: target,
      duration: 500,
      ease: 'Cubic.easeOut',
      onUpdate: (tween) => {
        this.redraw(tween.getValue());
      },
      onComplete: () => {
        this.value = target;
      },
    });
  }

  redraw(value) {
    const clamped = Phaser.Math.Clamp(value, 0, 100);
    const ratio = clamped / 100;

    this.track.clear();
    this.track.fillStyle(0x000000, 0.08);
    this.track.fillRoundedRect(0, -this.height / 2, this.width, this.height, this.height / 2);

    this.fill.clear();
    this.fill.lineStyle(2, Phaser.Display.Color.HexStringToColor(this.config.startColor).color, 1);
    this.fill.strokeRoundedRect(0, -this.height / 2, this.width, this.height, this.height / 2);

    this.fill.fillStyle(
      Phaser.Display.Color.ValueToColor(
        Phaser.Display.Color.HexStringToColor(this.config.startColor).color,
        Phaser.Display.Color.HexStringToColor(this.config.endColor).color,
        ratio
      ).color,
      1
    );
    this.fill.fillRoundedRect(0, -this.height / 2, this.width * ratio, this.height, this.height / 2);

    this.valueText.setText(`${Math.round(clamped)}%`);
  }

  destroy() {
    this.container.destroy();
  }
}

const config = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.RESIZE,
    parent: 'game-container',
    width: window.innerWidth,
    height: window.innerHeight,
  },
  backgroundColor: COLORS.background,
  scene: [
    // Используем ECS-улучшенную сцену
    MainGameSceneECSEnhanced,
    // Остальные сцены из старого main.js
    RecoveryScene,
    RecoveryCategoryScene,
    HomeScene,
    ShopScene,
    SocialScene,
    FunScene,
    InteractiveWorkEventScene,
    EducationScene,
    CareerScene,
    FinanceScene,
    SchoolScene,
    InstituteScene,
    EventQueueScene,
  ],
};

const game = new Phaser.Game(config);
