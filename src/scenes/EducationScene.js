import Phaser from 'phaser';
import { SceneAdapter } from '../ecs/adapters/SceneAdapter.js';
import { PersistenceSystem } from '../ecs/systems/PersistenceSystem.js';
import {
  COLORS,
  createRoundedButton,
  createRoundedPanel,
  createToastMessage,
  createNotificationModal,
  textStyle,
} from '../ui-kit';

/** Контраст к фону панели (как на карьере) */
const EDU_TITLE = 0x241a1a;
const EDU_BODY = 0x352828;
const EDU_MUTED = 0x5a4a44;
const EDU_ACCENT = 0xc97a5c;

const PROGRAM_CARD_H = 220;
const PROGRAM_CARD_GAP = 14;
const PROGRAM_SECTION_TOP = 56;
const COURSE_CARD_H = 152;
const COURSE_CARD_GAP = 14;
const SCROLL_BOTTOM_PAD = 32;

export class EducationSceneECS extends Phaser.Scene {
  constructor() {
    super('EducationScene');
  }

  create() {
    this.persistenceSystem = new PersistenceSystem();
    const loadedSaveData = this.persistenceSystem.loadSave();
    this.registry.set('saveData', loadedSaveData);
    this.sceneAdapter = new SceneAdapter(this, loadedSaveData);
    this.sceneAdapter.initialize();
    this.persistenceSystem.init(this.sceneAdapter.getWorld());

    const educationSystem = this.sceneAdapter.getSystem('education');
    this.educationSystem = educationSystem;

    this.cameras.main.setBackgroundColor(COLORS.background);

    this.root = this.add.container(0, 0);
    this.programsScrollY = 0;
    this.programsScrollViewportRect = { x: 0, y: 0, w: 0, h: 0 };
    this.programsScrollTouch = { active: false, startY: 0, startScroll: 0, moved: false };

    this.createHeader();
    this.createProgramsSection();
    this.createCoursesSection();
    this.createBackButton();
    this.createToast();
    this.createModals();

    this.scale.on('resize', this.handleResize, this);
    this.input.on('wheel', this.onProgramsWheel, this);
    this.input.on('pointerdown', this.onProgramsScrollPointerDown, this);
    this.input.on('pointermove', this.onProgramsScrollPointerMove, this);
    this.input.on('pointerup', this.onProgramsScrollPointerUp, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.handleResize, this);
      this.input.off('wheel', this.onProgramsWheel, this);
      this.input.off('pointerdown', this.onProgramsScrollPointerDown, this);
      this.input.off('pointermove', this.onProgramsScrollPointerMove, this);
      this.input.off('pointerup', this.onProgramsScrollPointerUp, this);
    });

    this.handleResize(this.scale.gameSize);
    this.animateEntrance();
  }

  isPointerInProgramsScrollViewport(pointer) {
    const r = this.programsScrollViewportRect;
    if (!r || r.w <= 0 || r.h <= 0) return false;
    const x = pointer.worldX;
    const y = pointer.worldY;
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }

  clampProgramsScroll() {
    const maxScroll = Math.min(0, this.programsViewportH - this.programsContentHeight);
    this.programsScrollY = Phaser.Math.Clamp(this.programsScrollY, maxScroll, 0);
  }

  applyProgramsScrollPosition() {
    if (!this.programsScrollContent) return;
    this.programsScrollContent.setPosition(this.programsScrollX, this.programsScrollTopY + this.programsScrollY);
  }

  onProgramsWheel(pointer, _go, _dx, dy, _dz, event) {
    if (!this.programsScrollViewportRect?.h) return;
    if (!this.isPointerInProgramsScrollViewport(pointer)) return;
    if (event) event.preventDefault?.();
    const delta =
      typeof event?.deltaY === 'number'
        ? event.deltaY
        : typeof dy === 'number'
          ? dy
          : 0;
    if (delta === 0) return;
    this.programsScrollY -= delta * 0.45;
    this.clampProgramsScroll();
    this.applyProgramsScrollPosition();
  }

  onProgramsScrollPointerDown(pointer) {
    const touchLike = pointer.pointerType === 'touch' || pointer.wasTouch === true;
    if (!touchLike || !this.isPointerInProgramsScrollViewport(pointer)) return;
    this.programsScrollTouch.active = true;
    this.programsScrollTouch.startY = pointer.y;
    this.programsScrollTouch.startScroll = this.programsScrollY;
    this.programsScrollTouch.moved = false;
  }

  onProgramsScrollPointerMove(pointer) {
    if (!this.programsScrollTouch.active || !pointer.isDown) return;
    if (!this.isPointerInProgramsScrollViewport(pointer)) return;
    const dy = pointer.y - this.programsScrollTouch.startY;
    if (Math.abs(dy) > 6) this.programsScrollTouch.moved = true;
    if (this.programsScrollTouch.moved) {
      this.programsScrollY = this.programsScrollTouch.startScroll + dy;
      this.clampProgramsScroll();
      this.applyProgramsScrollPosition();
    }
  }

  onProgramsScrollPointerUp() {
    this.programsScrollTouch.active = false;
  }

  createHeader() {
    this.headerCard = createRoundedPanel(this, { panelAlpha: 1, radius: 18, shadowAlpha: 0.22 });
    this.root.add(this.headerCard);
    this.headerCard.setDepth(10);

    this.headerTitle = this.add.text(0, 0, 'Обучение', textStyle(28, EDU_TITLE, '700'));
    this.headerSubtitle = this.add.text(0, 0, 'Программы, курсы и развитие навыков', textStyle(16, EDU_BODY, '500'));
    this.root.add([this.headerTitle, this.headerSubtitle]);
    this.headerTitle.setDepth(11);
    this.headerSubtitle.setDepth(11);
  }

  createProgramsSection() {
    this.programsCard = createRoundedPanel(this, { panelAlpha: 1, radius: 18, shadowAlpha: 0.22 });
    this.root.add(this.programsCard);
    this.programsCard.setDepth(1);

    this.programsScrollMaskRect = this.add.rectangle(0, 0, 100, 100, 0xffffff, 0).setOrigin(0).setVisible(false);
    this.root.add(this.programsScrollMaskRect);

    this.programsScrollContent = this.add.container(0, 0);
    this.programsScrollContent.setDepth(2);
    this.programsScrollContent.setMask(this.programsScrollMaskRect.createGeometryMask());
    this.root.add(this.programsScrollContent);

    this.sectionTitle = this.add.text(0, 0, 'Доступные программы', textStyle(22, EDU_TITLE, '700'));
    this.programsScrollContent.add(this.sectionTitle);

    this.updatePrograms();
  }

  updatePrograms() {
    const programs = this.educationSystem.getEducationPrograms();

    if (this.programCards) {
      this.programCards.forEach((card) => card.container.destroy());
    }
    this.programCards = [];
    this.programsScrollY = 0;

    programs.forEach((program, index) => {
      const card = this.createProgramCard(program, index);
      this.programCards.push(card);
      this.programsScrollContent.add(card.container);
    });
  }

  formatRewardBullets(rewardText) {
    const raw = (rewardText || '').trim();
    if (!raw) return '';
    const parts = raw.includes('•')
      ? raw.split(/\s*•\s*/).map((s) => s.trim()).filter(Boolean)
      : [raw];
    return parts.map((p) => `• ${p}`).join('\n');
  }

  createProgramCard(program, index) {
    const container = this.add.container(0, 0);
    const cardPanel = createRoundedPanel(this, { panelAlpha: 1, radius: 14, shadowAlpha: 0.15 });
    container.add(cardPanel);

    const titleLabel = this.add.text(0, 0, program.typeLabel, textStyle(12, EDU_ACCENT, '600'));
    container.add(titleLabel);

    const titleText = this.add.text(0, 0, program.title, {
      ...textStyle(20, EDU_TITLE, '700'),
      wordWrap: { width: 260 },
      lineSpacing: 2,
    });
    container.add(titleText);

    const subtitleText = this.add.text(0, 0, program.subtitle, {
      ...textStyle(14, EDU_BODY, '500'),
      wordWrap: { width: 260 },
      lineSpacing: 3,
    });
    container.add(subtitleText);

    const costLine = this.add.text(
      0,
      0,
      `Стоимость: ${this.formatMoney(program.cost)} ₽`,
      textStyle(16, EDU_BODY, '600')
    );
    container.add(costLine);

    const daysText = this.add.text(0, 0, `Срок: ${program.daysRequired} дн.`, textStyle(13, EDU_MUTED, '500'));
    container.add(daysText);

    const rewardText = this.add.text(0, 0, this.formatRewardBullets(program.rewardText), {
      ...textStyle(12, EDU_MUTED, '500'),
      lineSpacing: 5,
    });
    container.add(rewardText);

    let actionButton;
    const validation = this.educationSystem.canStartEducationProgram(program);
    if (validation.ok) {
      actionButton = createRoundedButton(this, {
        label: 'Начать',
        onClick: () => this.startProgram(program.id),
        fillColor: COLORS.accent,
        fontSize: 14,
        width: 112,
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

    cardPanel.setSize(400, PROGRAM_CARD_H);

    return {
      container,
      cardPanel,
      titleLabel,
      titleText,
      subtitleText,
      costLine,
      daysText,
      rewardText,
      actionButton,
    };
  }

  createCoursesSection() {
    this.coursesCard = createRoundedPanel(this, { panelAlpha: 1, radius: 18, shadowAlpha: 0.22 });
    this.root.add(this.coursesCard);
    this.coursesCard.setDepth(1);

    this.coursesTitle = this.add.text(0, 0, 'Текущие курсы', textStyle(22, EDU_TITLE, '700'));
    this.coursesCard.add(this.coursesTitle);

    this.updateActiveCourses();
  }

  updateActiveCourses() {
    const activeCourses = this.educationSystem.getActiveCourses();

    if (this.courseCards) {
      this.courseCards.forEach((card) => {
        if (card.container?.destroy) card.container.destroy();
      });
    }
    this.courseCards = [];

    if (activeCourses.length === 0) {
      const noCoursesText = this.add.text(0, 0, 'Нет активных курсов', textStyle(14, EDU_MUTED, '500'));
      this.coursesCard.add(noCoursesText);
      this.courseCards = [{ container: noCoursesText, isPlaceholder: true }];
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

    const titleText = this.add.text(0, 0, course.name, {
      ...textStyle(18, EDU_TITLE, '700'),
      wordWrap: { width: 280 },
    });
    container.add(titleText);

    const progressText = this.add.text(
      0,
      0,
      `Прогресс: ${Math.round(course.progress * 100)}%`,
      textStyle(15, EDU_BODY, '600')
    );
    container.add(progressText);

    const detailsText = this.add.text(
      0,
      0,
      `Дней: ${course.daysSpent} / ${course.daysRequired}`,
      textStyle(13, EDU_MUTED, '500')
    );
    container.add(detailsText);

    const actionButton = createRoundedButton(this, {
      label: 'Продолжить',
      onClick: () => this.advanceCourse(course.id),
      fillColor: COLORS.accent,
      fontSize: 14,
      width: 128,
      height: 44,
    });
    container.add(actionButton);

    cardPanel.setSize(400, COURSE_CARD_H);

    return { container, cardPanel, titleText, progressText, detailsText, actionButton };
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
    this.notificationModal = createNotificationModal(this, {
      primaryLabel: 'Понятно',
      secondaryLabel: 'Закрыть',
    });
    this.root.add(this.notificationModal);
  }

  startProgram(programId) {
    const result = this.educationSystem.startEducationProgram(programId);

    if (result.success) {
      this.sceneAdapter.syncToSaveData();
      this.persistenceSystem.saveGame(this.sceneAdapter.getSaveData());

      this.showToast(result.message);
      this.updatePrograms();
      this.updateActiveCourses();
      this.handleResize(this.scale.gameSize);
    } else {
      this.showToast(result.message);
    }
  }

  advanceCourse(courseId) {
    const result = this.educationSystem.advanceEducationCourseDay(courseId);

    if (result.completed) {
      this.sceneAdapter.syncToSaveData();
      this.persistenceSystem.saveGame(this.sceneAdapter.getSaveData());

      this.showToast(result.summary);
      this.updateActiveCourses();
      this.handleResize(this.scale.gameSize);
    } else {
      this.sceneAdapter.syncToSaveData();
      this.persistenceSystem.saveGame(this.sceneAdapter.getSaveData());

      this.showToast(result.summary);
      this.updateActiveCourses();
      this.handleResize(this.scale.gameSize);
    }
  }

  showToast(message) {
    this.toast.show(message);
  }

  formatMoney(value) {
    return new Intl.NumberFormat('ru-RU').format(value);
  }

  layoutProgramCard(card, cardW, cardH) {
    const pad = 16;
    const innerW = Math.max(100, cardW - pad * 2);
    card.titleLabel.setPosition(pad, pad);
    card.titleText.setWordWrapWidth(innerW);
    card.subtitleText.setWordWrapWidth(innerW);
    card.rewardText.setWordWrapWidth(innerW);

    let y = pad + card.titleLabel.height + 6;
    card.titleText.setPosition(pad, y);
    y += card.titleText.height + 8;
    card.subtitleText.setPosition(pad, y);
    y += card.subtitleText.height + 10;
    card.costLine.setPosition(pad, y);
    y += card.costLine.height + 6;
    card.daysText.setPosition(pad, y);
    y += card.daysText.height + 6;
    card.rewardText.setPosition(pad, y);

    const bw = card.actionButton.width;
    const bh = card.actionButton.height;
    card.actionButton.setPosition(cardW - pad - bw / 2, cardH - pad - bh / 2);

    card.cardPanel.setPosition(0, 0);
    card.cardPanel.setSize(cardW, cardH);
  }

  layoutCourseCard(card, cardW, cardH) {
    const pad = 16;
    const innerW = Math.max(100, cardW - pad * 2);
    card.titleText.setWordWrapWidth(innerW);

    card.titleText.setPosition(pad, pad);
    let y = pad + card.titleText.height + 8;
    card.progressText.setPosition(pad, y);
    y += card.progressText.height + 6;
    card.detailsText.setPosition(pad, y);

    const bw = card.actionButton.width;
    const bh = card.actionButton.height;
    card.actionButton.setPosition(cardW - pad - bw / 2, cardH - pad - bh / 2);

    card.cardPanel.setPosition(0, 0);
    card.cardPanel.setSize(cardW, cardH);
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
    const padX = 24;

    this.headerCard.setSize(maxW, headerH);
    this.headerCard.setPosition(sceneX, safeY);

    this.headerTitle.setPosition(this.headerCard.x + 24, this.headerCard.y + 28);
    this.headerSubtitle.setPosition(this.headerCard.x + 24, this.headerCard.y + 62);

    const programsTop = safeY + headerH + gap;

    const nPrograms = this.programCards?.length ?? 0;
    const programStep = PROGRAM_CARD_H + PROGRAM_CARD_GAP;
    this.programsContentHeight =
      nPrograms === 0
        ? PROGRAM_SECTION_TOP + 40
        : PROGRAM_SECTION_TOP + nPrograms * programStep + SCROLL_BOTTOM_PAD;

    const nCoursePanels = this.courseCards?.filter((c) => c.cardPanel).length ?? 0;
    const hasPlaceholder = this.courseCards?.some((c) => c.isPlaceholder);
    const coursesCardH = hasPlaceholder
      ? 108
      : 56 + Math.max(1, nCoursePanels) * (COURSE_CARD_H + COURSE_CARD_GAP) + 24;

    const remaining =
      h - programsTop - gap - coursesCardH - gap - backReserve;
    this.programsViewportH = Math.max(160, remaining);

    this.programsCard.setSize(maxW, this.programsViewportH);
    this.programsCard.setPosition(sceneX, programsTop);

    this.programsScrollMaskRect.setPosition(sceneX, programsTop);
    this.programsScrollMaskRect.setSize(maxW, this.programsViewportH);
    this.programsScrollViewportRect = { x: sceneX, y: programsTop, w: maxW, h: this.programsViewportH };

    this.programsScrollX = sceneX;
    this.programsScrollTopY = programsTop;

    this.clampProgramsScroll();
    this.applyProgramsScrollPosition();

    this.sectionTitle.setPosition(padX, 20);

    const cardInnerW = maxW - padX * 2;
    this.programCards.forEach((card, index) => {
      const y = PROGRAM_SECTION_TOP + index * programStep;
      card.container.setPosition(padX, y);
      this.layoutProgramCard(card, cardInnerW, PROGRAM_CARD_H);
    });

    const coursesTop = programsTop + this.programsViewportH + gap;
    this.coursesCard.setSize(maxW, coursesCardH);
    this.coursesCard.setPosition(sceneX, coursesTop);

    this.coursesTitle.setPosition(24, 20);

    const courseInnerW = maxW - 48;
    this.courseCards.forEach((card, index) => {
      if (!card.cardPanel) {
        if (card.container?.setPosition) {
          card.container.setPosition(maxW / 2, 64);
          card.container.setOrigin(0.5, 0.5);
        }
        return;
      }
      const cy = 56 + index * (COURSE_CARD_H + COURSE_CARD_GAP);
      card.container.setPosition(24, cy);
      this.layoutCourseCard(card, courseInnerW, COURSE_CARD_H);
    });

    this.backButton.setPosition(sceneX + maxW / 2, h - safeY - 36);

    this.toast.setPosition(w / 2, h - 100);

    this.notificationModal.resize(gameSize);
  }

  animateEntrance() {
    this.headerCard.alpha = 0;
    this.programsCard.alpha = 0;
    this.programsScrollContent.alpha = 0;
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
      duration: 450,
      delay: 80,
      ease: 'Cubic.easeOut',
    });

    this.tweens.add({
      targets: this.programsScrollContent,
      alpha: 1,
      duration: 500,
      delay: 100,
      ease: 'Cubic.easeOut',
    });

    this.tweens.add({
      targets: this.coursesCard,
      alpha: 1,
      duration: 520,
      delay: 160,
      ease: 'Cubic.easeOut',
    });

    this.tweens.add({
      targets: this.backButton,
      alpha: 1,
      duration: 400,
      delay: 280,
      ease: 'Cubic.easeOut',
    });
  }
}
