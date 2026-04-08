import Phaser from 'phaser';
import { SceneAdapter } from '../ecs/adapters/SceneAdapter.js';
import { PersistenceSystem } from '../ecs/systems/PersistenceSystem.js';
import {
  COLORS,
  createNotificationModal,
  createRoundedButton,
  createRoundedPanel,
  createToastMessage,
  textStyle,
} from '../ui-kit';

/** Контрастнее фона панели (#fffcf7 / #f8f4ed) */
const CAREER_TITLE = 0x241a1a;
const CAREER_BODY = 0x352828;
const CAREER_MUTED = 0x5a4a44;
const CAREER_ACCENT_STRONG = 0xc97a5c;
/**
 * CareerScene с поддержкой ECS
 * Отображает доступные работы и позволяет сменить работу
 */
export class CareerSceneECS extends Phaser.Scene {
  constructor() {
    super('CareerScene');
  }

  create() {
    this.persistenceSystem = new PersistenceSystem();
    const loadedSaveData = this.persistenceSystem.loadSave();
    this.registry.set('saveData', loadedSaveData);
    this.sceneAdapter = new SceneAdapter(this, loadedSaveData);
    this.sceneAdapter.initialize();
    this.persistenceSystem.init(this.sceneAdapter.getWorld());

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

    this.headerTitle = this.add.text(0, 0, 'Карьера', textStyle(28, CAREER_TITLE, '700'));
    this.headerSubtitle = this.add.text(
      0,
      0,
      'Должности, зарплата и требования к росту',
      textStyle(16, CAREER_BODY, '500')
    );
    this.root.add([this.headerTitle, this.headerSubtitle]);
    this.headerTitle.setDepth(6);
    this.headerSubtitle.setDepth(6);
  }

  createCareerList() {
    if (!this.contentCard) {
      this.contentCard = createRoundedPanel(this, { panelAlpha: 1, radius: 18, shadowAlpha: 0.22 });
      this.root.add(this.contentCard);

      this.listSectionTitle = this.add.text(0, 0, 'Должности', textStyle(22, CAREER_TITLE, '700'));
      this.root.add(this.listSectionTitle);
      this.listSectionTitle.setDepth(5);
    }

    if (this.careerCards) {
      this.careerCards.forEach((card) => card.container.destroy());
    }
    this.careerCards = [];
    const careerTrack = this.careerSystem.getCareerTrack();
    const currentJob = this.careerSystem.getCurrentJob();

    careerTrack.forEach((job, index) => {
      const card = this.createJobCard(job, index, currentJob?.id);
      this.careerCards.push(card);
      this.root.add(card.container);
    });
  }

  createJobCard(job, index, currentJobId) {
    const container = this.add.container(0, 0);
    const cardPanel = createRoundedPanel(this, { panelAlpha: 1, radius: 14, shadowAlpha: 0.15 });
    container.add(cardPanel);

    const isCurrent = job.id === currentJobId;
    const isUnlocked = job.unlocked;

    const titleColor = isCurrent ? CAREER_ACCENT_STRONG : isUnlocked ? CAREER_TITLE : CAREER_MUTED;

    const jobTitle = this.add.text(0, 0, job.name, {
      ...textStyle(20, titleColor, '700'),
      wordWrap: { width: 260 },
      lineSpacing: 2,
    });
    container.add(jobTitle);

    const dailyLine = this.add.text(
      0,
      0,
      `Доход в день: ${this.formatMoney(job.salaryPerDay)} ₽`,
      textStyle(16, CAREER_BODY, '600')
    );
    container.add(dailyLine);

    let requirementsText = '';
    if (!isUnlocked) {
      const requirements = [];
      if (job.missingProfessionalism > 0) {
        requirements.push(`Профессионализм: ${job.missingProfessionalism}`);
      }
      if (job.educationRequiredLabel) {
        requirements.push(`Образование: ${job.educationRequiredLabel}`);
      }
      if (job.missingAge > 0) {
        requirements.push(`Возраст: ${job.missingAge}+`);
      }
      requirementsText = requirements.map((line) => `• ${line}`).join('\n');
    }

    const requirementsLabel = this.add.text(0, 0, requirementsText, {
      ...textStyle(13, CAREER_MUTED, '500'),
      lineSpacing: 5,
    });
    container.add(requirementsLabel);

    let actionButton;
    if (isCurrent) {
      actionButton = createRoundedButton(this, {
        label: 'Текущая работа',
        onClick: () => this.showJobDetails(job),
        fillColor: COLORS.accent,
        fontSize: 14,
        width: 152,
        height: 44,
        disabled: true,
      });
    } else if (isUnlocked) {
      actionButton = createRoundedButton(this, {
        label: 'Устроиться',
        onClick: () => this.changeCareer(job.id),
        fillColor: COLORS.accent,
        fontSize: 14,
        width: 132,
        height: 44,
      });
    } else {
      actionButton = createRoundedButton(this, {
        label: 'Недоступно',
        onClick: () => {},
        fillColor: COLORS.neutral,
        fontSize: 14,
        width: 132,
        height: 44,
        disabled: true,
      });
    }
    container.add(actionButton);

    cardPanel.setSize(400, 220);

    return { container, cardPanel, jobTitle, dailyLine, requirementsLabel, actionButton };
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
      this.persistenceSystem.saveGame(this.sceneAdapter.getSaveData());

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
        `Доход: ${this.formatMoney(job.salaryPerDay)} ₽/день`,
        `За неделю: ${this.formatMoney(job.salaryPerWeek)} ₽`,
      ].join('\n'),
    });
  }

  handleResize(gameSize) {
    const w = gameSize.width;
    const h = gameSize.height;
    const safeX = Math.max(16, Math.floor(w * 0.03));
    const safeY = Math.max(16, Math.floor(h * 0.03));
    const maxW = Math.min(920, w - safeX * 2);
    const sceneX = (w - maxW) / 2;
    const headerH = 100;
    const gap = 12;
    const backReserve = 100;
    const listTitleH = 56;

    this.headerCard.setSize(maxW, headerH);
    this.headerCard.setPosition(sceneX, safeY);

    this.headerTitle.setPosition(this.headerCard.x + 24, this.headerCard.y + 28);
    this.headerSubtitle.setPosition(this.headerCard.x + 24, this.headerCard.y + 62);

    const contentTop = safeY + headerH + gap;
    const contentH = Math.max(240, h - contentTop - backReserve);
    this.contentCard.setSize(maxW, contentH);
    this.contentCard.setPosition(sceneX, contentTop);

    if (this.listSectionTitle) {
      this.listSectionTitle.setPosition(this.contentCard.x + 24, this.contentCard.y + 20);
    }

    const cardSpacing = 16;
    const cardsPerRow = maxW >= 640 ? 2 : 1;
    const itemCardHeight = 228;
    const gridTop = this.contentCard.y + listTitleH;
    const pad = 16;

    this.careerCards.forEach((card, index) => {
      const row = Math.floor(index / cardsPerRow);
      const col = index % cardsPerRow;

      const itemCardWidth = (this.contentCard.width - cardSpacing * (cardsPerRow + 1)) / cardsPerRow;

      const cardX = this.contentCard.x + cardSpacing + col * (itemCardWidth + cardSpacing);
      const cardY = gridTop + row * (itemCardHeight + cardSpacing);

      card.cardPanel.setPosition(cardX, cardY);
      card.cardPanel.setSize(itemCardWidth, itemCardHeight);

      const textW = Math.max(120, itemCardWidth - pad * 2);
      card.jobTitle.setWordWrapWidth(textW);
      card.jobTitle.setPosition(cardX + pad, cardY + pad);

      const titleBottom = cardY + pad + card.jobTitle.height;
      card.dailyLine.setPosition(cardX + pad, titleBottom + 8);

      const dailyBottom = titleBottom + 8 + card.dailyLine.height;
      card.requirementsLabel.setPosition(cardX + pad, dailyBottom + 10);
      card.requirementsLabel.setWordWrapWidth(textW);

      const bw = card.actionButton.width;
      const bh = card.actionButton.height;
      card.actionButton.setPosition(cardX + itemCardWidth - pad - bw / 2, cardY + itemCardHeight - pad - bh / 2);
    });

    this.backButton.setPosition(sceneX + maxW / 2, h - safeY - 36);

    this.toast.setPosition(w / 2, h - 100);

    this.notificationModal.resize(gameSize);
  }

  animateEntrance() {
    this.headerCard.alpha = 0;
    this.contentCard.alpha = 0;
    this.backButton.alpha = 0;
    if (this.listSectionTitle) this.listSectionTitle.alpha = 0;

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

    if (this.listSectionTitle) {
      this.tweens.add({
        targets: this.listSectionTitle,
        alpha: 1,
        duration: 500,
        delay: 100,
        ease: 'Cubic.easeOut',
      });
    }

    this.tweens.add({
      targets: this.backButton,
      alpha: 1,
      duration: 400,
      delay: 300,
      ease: 'Cubic.easeOut',
    });
  }
}
