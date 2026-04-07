import Phaser from 'phaser';
import { SceneAdapter } from '../ecs/adapters/SceneAdapter.js';
import { loadSave, persistSave } from '../game-state.js';
import {
  COLORS,
  createRoundedButton,
  createRoundedPanel,
  createToastMessage,
  createNotificationModal,
  textStyle,
} from '../ui-kit';

export class EducationSceneECS extends Phaser.Scene {
  constructor() {
    super('EducationScene');
  }

  create() {
    this.saveData = loadSave();
    this.registry.set('saveData', this.saveData);

    this.sceneAdapter = new SceneAdapter(this, this.saveData);
    this.sceneAdapter.initialize();

    const educationSystem = this.sceneAdapter.getSystem('education');
    this.educationSystem = educationSystem;

    this.cameras.main.setBackgroundColor(COLORS.background);

    this.root = this.add.container(0, 0);
    this.createHeader();
    this.createPrograms();
    this.createActiveCourses();
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

    this.headerTitle = this.add.text(0, 0, 'Education', textStyle(28, COLORS.text, '700'));
    this.headerSubtitle = this.add.text(0, 0, 'Courses and skills', textStyle(16, COLORS.text, '500'));
    this.root.add([this.headerTitle, this.headerSubtitle]);
  }

  createPrograms() {
    this.programsCard = createRoundedPanel(this, { panelAlpha: 1, radius: 18, shadowAlpha: 0.22 });
    this.root.add(this.programsCard);

    this.sectionTitle = this.add.text(0, 0, 'Available programs', textStyle(22, COLORS.text, '700'));
    this.root.add(this.sectionTitle);

    this.updatePrograms();
  }

  updatePrograms() {
    const programs = this.educationSystem.getEducationPrograms();

    if (this.programCards) {
      this.programCards.forEach(card => card.container.destroy());
    }
    this.programCards = [];

    programs.forEach((program, index) => {
      const card = this.createProgramCard(program, index);
      this.programCards.push(card);
      this.programsCard.add(card.container);
    });
  }

  createProgramCard(program, index) {
    const container = this.add.container(0, 0);
    const cardPanel = createRoundedPanel(this, { panelAlpha: 1, radius: 14, shadowAlpha: 0.15 });
    container.add(cardPanel);

    const titleLabel = this.add.text(0, 0, program.typeLabel, textStyle(12, COLORS.text, '400'));
    container.add(titleLabel);

    const titleText = this.add.text(0, 0, program.title, textStyle(20, COLORS.text, '700'));
    container.add(titleText);

    const subtitleText = this.add.text(0, 0, program.subtitle, textStyle(14, COLORS.text, '500'));
    container.add(subtitleText);

    const costText = this.add.text(0, 0, `Cost: ${this.formatMoney(program.cost)}`, textStyle(14, COLORS.text, '500'));
    container.add(costText);

    const daysText = this.add.text(0, 0, `Time: ${program.daysRequired} days`, textStyle(12, COLORS.text, '400'));
    container.add(daysText);

    const rewardText = this.add.text(0, 0, program.rewardText, textStyle(12, COLORS.text, '400'));
    container.add(rewardText);

    let actionButton;
    const validation = this.educationSystem.canStartEducationProgram(program);
    if (validation.ok) {
      actionButton = createRoundedButton(this, {
        label: 'Start',
        onClick: () => this.startProgram(program.id),
        fillColor: COLORS.accent,
        fontSize: 16,
      });
    } else {
      actionButton = createRoundedButton(this, {
        label: 'Not available',
        onClick: () => {},
        fillColor: COLORS.neutral,
        fontSize: 16,
        disabled: true,
      });
    }
    container.add(actionButton);

    cardPanel.setSize(400, 200);

    return { container, cardPanel, titleLabel, titleText, subtitleText, costText, daysText, rewardText, actionButton };
  }

  createActiveCourses() {
    this.coursesCard = createRoundedPanel(this, { panelAlpha: 1, radius: 18, shadowAlpha: 0.22 });
    this.root.add(this.coursesCard);

    this.coursesTitle = this.add.text(0, 0, 'Active courses', textStyle(22, COLORS.text, '700'));
    this.root.add(this.coursesTitle);

    this.updateActiveCourses();
  }

  updateActiveCourses() {
    const activeCourses = this.educationSystem.getActiveCourses();

    if (this.courseCards) {
      this.courseCards.forEach(card => card.container.destroy());
    }
    this.courseCards = [];

    if (activeCourses.length === 0) {
      const noCoursesText = this.add.text(0, 0, 'No active courses', textStyle(14, COLORS.neutral, '400'));
      this.coursesCard.add(noCoursesText);
      this.courseCards = [{ container: noCoursesText }];
      return;
    }

    activeCourses.forEach((course, index) => {
      const card = this.createActiveCourseCard(course, index);
      this.courseCards.push(card);
      this.coursesCard.add(card.container);
    });
  }

  createActiveCourseCard(course, index) {
    const container = this.add.container(0, 0);
    const cardPanel = createRoundedPanel(this, { panelAlpha: 1, radius: 14, shadowAlpha: 0.15 });
    container.add(cardPanel);

    const titleText = this.add.text(0, 0, course.name, textStyle(18, COLORS.text, '600'));
    container.add(titleText);

    const progressText = this.add.text(0, 0, `Progress: ${Math.round(course.progress * 100)}%`, textStyle(16, COLORS.text, '500'));
    container.add(progressText);

    const detailsText = this.add.text(0, 0, `Days spent: ${course.daysSpent}/${course.daysRequired}`, textStyle(12, COLORS.text, '400'));
    container.add(detailsText);

    const actionButton = createRoundedButton(this, {
      label: 'Continue',
      onClick: () => this.advanceCourse(course.id),
      fillColor: COLORS.accent,
      fontSize: 14,
    });
    container.add(actionButton);

    cardPanel.setSize(400, 140);

    return { container, cardPanel, titleText, progressText, detailsText, actionButton };
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
    this.notificationModal = createNotificationModal(this, {
      primaryLabel: 'OK',
      secondaryLabel: 'Close',
    });
    this.root.add(this.notificationModal);
  }

  startProgram(programId) {
    const result = this.educationSystem.startEducationProgram(programId);

    if (result.success) {
      this.sceneAdapter.syncToSaveData();
      persistSave(this, this.saveData);

      this.showToast(result.message);
      this.updatePrograms();
      this.updateActiveCourses();
    } else {
      this.showToast(result.message);
    }
  }

  advanceCourse(courseId) {
    const result = this.educationSystem.advanceEducationCourseDay(courseId);

    if (result.completed) {
      this.sceneAdapter.syncToSaveData();
      persistSave(this, this.saveData);

      this.showToast(result.summary);
      this.updateActiveCourses();
    } else {
      this.sceneAdapter.syncToSaveData();
      persistSave(this, this.saveData);

      this.showToast(result.summary);
      this.updateActiveCourses();
    }
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

    this.headerCard.setSize(isDesktop ? 460 : w - 40, 100);
    this.headerCard.setPosition(isDesktop ? (w - 460) / 2 : 20, 20);

    this.headerTitle.setPosition(this.headerCard.x + 24, this.headerCard.y + 30);
    this.headerSubtitle.setPosition(this.headerCard.x + 24, this.headerCard.y + 65);

    const cardWidth = isDesktop ? 480 : w - 40;

    this.programsCard.setSize(cardWidth, h - 260);
    this.programsCard.setPosition(isDesktop ? (w - cardWidth) / 2 : 20, 130);

    this.sectionTitle.setPosition(this.programsCard.x + 24, this.programsCard.y + 24);

    if (this.programCards) {
      this.programCards.forEach((card, index) => {
        const cardY = this.programsCard.y + 60 + index * 220;
        card.cardPanel.setPosition(this.programsCard.x + 24, cardY);
        
        card.titleLabel.setPosition(card.cardPanel.x + 20, card.cardPanel.y + 20);
        card.titleText.setPosition(card.cardPanel.x + 20, card.cardPanel.y + 35);
        card.subtitleText.setPosition(card.cardPanel.x + 20, card.cardPanel.y + 60);
        card.costText.setPosition(card.cardPanel.x + 20, card.cardPanel.y + 80);
        card.daysText.setPosition(card.cardPanel.x + 20, card.cardPanel.y + 95);
        card.rewardText.setPosition(card.cardPanel.x + 20, card.cardPanel.y + 110);
        card.actionButton.setPosition(card.cardPanel.x + card.cardPanel.width / 2, card.cardPanel.y + 160);
      });
    }

    this.coursesCard.setSize(cardWidth, 100);
    this.coursesCard.setPosition(isDesktop ? (w - cardWidth) / 2 : 20, h - 140);

    this.coursesTitle.setPosition(this.coursesCard.x + 24, this.coursesCard.y + 24);

    if (this.courseCards) {
      this.courseCards.forEach((card, index) => {
        const cardY = this.coursesCard.y + 60 + index * 160;
        card.cardPanel.setPosition(this.coursesCard.x + 24, cardY);
        
        card.titleText.setPosition(card.cardPanel.x + 20, card.cardPanel.y + 20);
        card.progressText.setPosition(card.cardPanel.x + 20, card.cardPanel.y + 50);
        card.detailsText.setPosition(card.cardPanel.x + 20, card.cardPanel.y + 70);
        card.actionButton.setPosition(card.cardPanel.x + card.cardPanel.width / 2, card.cardPanel.y + 100);
      });
    }

    this.backButton.setPosition(cardWidth / 2 + (isDesktop ? (w - cardWidth) / 2 : 20), h - 60);

    this.toast.setPosition(w / 2, h - 120);

    if (this.notificationModal.visible) {
      this.notificationModal.center();
    }
  }

  animateEntrance() {
    this.headerCard.alpha = 0;
    this.programsCard.alpha = 0;
    this.coursesCard.alpha = 0;
    this.backButton.alpha = 0;

    this.tweens.add({
      targets: this.headerCard,
      alpha: 1,
      duration: 400,
      ease: 'Cubic.easeOut',
    });

    this.tweens.add({
      targets: this.programsCard,
      alpha: 1,
      duration: 500,
      delay: 100,
      ease: 'Cubic.easeOut',
    });

    this.tweens.add({
      targets: this.coursesCard,
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
