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
import { STAT_DEFS, NAV_ITEMS } from '../shared/constants.js';

/**
 * CareerScene с поддержкой ECS
 * Отображает доступные работы и позволяет сменить работу
 */
export class CareerSceneECS extends Phaser.Scene {
  constructor() {
    super('CareerScene');
  }

  create() {
    // Загружаем сохранение
    this.saveData = loadSave();
    this.registry.set('saveData', this.saveData);

    // Создаем ECS адаптер
    this.sceneAdapter = new SceneAdapter(this, this.saveData);
    this.sceneAdapter.initialize();

    // Получаем системы
    const careerSystem = this.sceneAdapter.getSystem('careerProgress');
    this.careerSystem = careerSystem;

    this.cameras.main.setBackgroundColor(COLORS.background);

    this.root = this.add.container(0, 0);
    this.createHeader();
    this.createCareerList();
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

    this.headerTitle = this.add.text(0, 0, 'Карьера', textStyle(28, COLORS.text, '700'));
    this.headerSubtitle = this.add.text(0, 0, 'Доступные должности и требования', textStyle(16, COLORS.text, '500'));
    this.root.add([this.headerTitle, this.headerSubtitle]);
  }

  createCareerList() {
    this.contentCard = createRoundedPanel(this, { panelAlpha: 1, radius: 18, shadowAlpha: 0.22 });
    this.root.add(this.contentCard);

    this.careerCards = [];
    const careerTrack = this.careerSystem.getCareerTrack();
    const currentJob = this.careerSystem.getCurrentJob();

    careerTrack.forEach((job, index) => {
      const card = this.createJobCard(job, index, currentJob?.id);
      this.careerCards.push(card);
      this.contentCard.add(card.container);
    });
  }

  createJobCard(job, index, currentJobId) {
    const container = this.add.container(0, 0);
    const cardPanel = createRoundedPanel(this, { panelAlpha: 1, radius: 14, shadowAlpha: 0.15 });
    container.add(cardPanel);

    const isCurrent = job.id === currentJobId;
    const isUnlocked = job.unlocked;

    // Заголовок
    const jobTitle = this.add.text(0, 0, job.name, textStyle(20, isCurrent ? COLORS.accent : (isUnlocked ? COLORS.text : COLORS.neutral), '700'));
    container.add(jobTitle);

    // Зарплата
    const salaryText = this.add.text(0, 0, this.formatMoney(job.salaryPerDay) + ' ₽/день', textStyle(18, COLORS.text, '600'));
    container.add(salaryText);

    // Уровень
    const levelText = this.add.text(0, 0, `Уровень ${job.level}`, textStyle(14, COLORS.text, '500'));
    container.add(levelText);

    // Требования
    let requirementsText = '';
    if (!isUnlocked) {
      const requirements = [];
      if (job.missingProfessionalism > 0) {
        requirements.push(`Профессионализм: ${job.missingProfessionalism}`);
      }
      if (job.educationRequiredLabel) {
        requirements.push(`Образование: ${job.educationRequiredLabel}`);
      }
      requirementsText = requirements.join(' • ');
    }

    const requirementsLabel = this.add.text(0, 0, requirementsText, textStyle(12, COLORS.neutral, '400'));
    container.add(requirementsLabel);

    // Кнопка
    let actionButton;
    if (isCurrent) {
      actionButton = createRoundedButton(this, {
        label: 'Текущая работа',
        onClick: () => this.showJobDetails(job),
        fillColor: COLORS.accent,
        fontSize: 16,
        disabled: true,
      });
    } else if (isUnlocked) {
      actionButton = createRoundedButton(this, {
        label: 'Устроиться',
        onClick: () => this.changeCareer(job.id),
        fillColor: COLORS.accent,
        fontSize: 16,
      });
    } else {
      actionButton = createRoundedButton(this, {
        label: 'Недоступно',
        onClick: () => {},
        fillColor: COLORS.neutral,
        fontSize: 16,
        disabled: true,
      });
    }
    container.add(actionButton);

    cardPanel.setSize(400, 200);

    return { container, cardPanel, jobTitle, salaryText, levelText, requirementsLabel, actionButton };
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
    this.notificationModal = createRoundedButton(this, {
      label: 'Понятно',
      onClick: () => {},
      fillColor: COLORS.accent,
      fontSize: 14,
    });
    this.root.add(this.notificationModal);
  }

  showToast(message) {
    this.toast.show(message);
  }

  formatMoney(value) {
    return new Intl.NumberFormat('ru-RU').format(value);
  }

  changeCareer(jobId) {
    const result = this.careerSystem.changeCareer(jobId);

    if (result.success) {
      // Синхронизируем с saveData
      this.sceneAdapter.syncToSaveData();
      persistSave(this, this.saveData);

      this.showToast(result.message);
      this.createCareerList(); // Обновляем список
    } else {
      this.showToast(result.reason);
    }
  }

  showJobDetails(job) {
    this.notificationModal.show({
      title: job.name,
      description: [
        `Зарплата: ${this.formatMoney(job.salaryPerDay)} ₽/день (${this.formatMoney(job.salaryPerWeek)} ₽/неделю)`,
        `Уровень: ${job.level}`,
      ].join('\n'),
      onConfirm: () => {},
    });
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

    // Content
    const cardWidth = isDesktop ? 480 : w - 40;
    const cardHeight = h - 180;
    this.contentCard.setSize(cardWidth, cardHeight);
    this.contentCard.setPosition(isDesktop ? (w - cardWidth) / 2 : 20, 130);

    // Career cards
    const cardSpacing = 24;
    const cardsPerRow = isDesktop ? 2 : 1;
    const cardHeight = 200;

    this.careerCards.forEach((card, index) => {
      const row = Math.floor(index / cardsPerRow);
      const col = index % cardsPerRow;

      const cardWidth = (contentCard.width - cardSpacing * (cardsPerRow + 1)) / cardsPerRow;

      const cardX = this.contentCard.x + cardSpacing + col * (cardWidth + cardSpacing);
      const cardY = this.contentCard.y + cardSpacing + row * (cardHeight + cardSpacing);

      card.cardPanel.setPosition(cardX, cardY);
      card.cardPanel.setSize(cardWidth, cardHeight);

      card.jobTitle.setPosition(cardX + 20, cardY + 20);
      card.salaryText.setPosition(cardX + cardWidth - 20, cardY + 20);
      card.salaryText.setOrigin(1, 0);

      card.levelText.setPosition(cardX + 20, cardY + 55);

      card.requirementsLabel.setPosition(cardX + 20, cardY + 85);

      card.actionButton.setPosition(cardX + cardWidth / 2, cardY + 160);
    });

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
      duration: 500,
      delay: 100,
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
