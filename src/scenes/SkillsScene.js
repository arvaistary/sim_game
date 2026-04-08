import Phaser from 'phaser';
import { SceneAdapter } from '../ecs/adapters/SceneAdapter.js';
import { PersistenceSystem } from '../ecs/systems/index.js';
import { DEFAULT_SAVE } from '../ecs/data/default-save.js';
import {
  COLORS,
  createRoundedButton,
  createRoundedPanel,
  createToastMessage,
  textStyle,
} from '../ui-kit';
import { BASIC_SKILLS, PROFESSIONAL_SKILLS, SKILLS_TABS } from '../shared/skills-constants.js';

/**
 * SkillsScene с полной поддержкой ECS
 * Отображает все навыки персонажа с разделением на базовые и профессиональные
 */
export class SkillsScene extends Phaser.Scene {
  constructor() {
    super('SkillsScene');
    this.skillCardViews = [];
    this.contentScrollOffset = 0;
    this.maxContentScroll = 0;
    this.skillsViewport = null;
  }

  init(data) {
    this.initialTab = data.initialTab || 'basic';
  }

  create() {
    // Загружаем сохранение через Persistence System
    const persistenceSystem = new PersistenceSystem();
    const saveData = persistenceSystem.loadSave();
    
    // Создаём ECS адаптер с данными из сохранения или по умолчанию
    this.sceneAdapter = new SceneAdapter(this, saveData || DEFAULT_SAVE);
    this.sceneAdapter.initialize();
    
    // Получаем системы
    this.skillsSystem = this.sceneAdapter.getSystem('skills');

    this.cameras.main.setBackgroundColor(COLORS.background);

    this.root = this.add.container(0, 0);
    this.createHeader();
    this.createTabs();
    this.createContent();
    this.createBackButton();
    this.createToast();
    this.contentScrollOffset = 0;
    this.maxContentScroll = 0;

    this.selectTab(this.initialTab);

    this.scale.on('resize', this.handleResize, this);
    this.input.on('wheel', this.handleWheel, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.handleResize);
      this.input.off('wheel', this.handleWheel, this);
    });

    this.handleResize(this.scale.gameSize);
    this.animateEntrance();
  }

  createHeader() {
    this.headerCard = createRoundedPanel(this, { panelAlpha: 1, radius: 18, shadowAlpha: 0.22 });
    this.root.add(this.headerCard);

    this.headerTitle = this.add.text(0, 0, 'Навыки', textStyle(28, COLORS.text, '700'));
    this.headerSubtitle = this.add.text(0, 0, 'Развитие ваших способностей', textStyle(16, COLORS.text, '500'));
    this.root.add([this.headerTitle, this.headerSubtitle]);
  }

  createTabs() {
    this.tabsCard = createRoundedPanel(this, { panelAlpha: 1, radius: 18, shadowAlpha: 0.22 });
    this.root.add(this.tabsCard);

    this.tabButtons = SKILLS_TABS.map((tab, index) => {
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

    this.skillCards = this.add.container(0, 0);
    this.skillsMaskGraphics = this.add.graphics();
    this.skillsMask = this.skillsMaskGraphics.createGeometryMask();
    this.skillCards.setMask(this.skillsMask);
    this.root.add(this.skillsMaskGraphics);
    this.root.add(this.skillCards);
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

  selectTab(tabId) {
    this.currentTab = SKILLS_TABS.find(tab => tab.id === tabId);
    if (!this.currentTab) return;

    // Обновляем кнопки табов
    this.tabButtons.forEach(({ button, tab }) => {
      const isSelected = tab.id === tabId;
      button.setFillColor(isSelected ? COLORS.accent : COLORS.neutral);
    });

    // Обновляем контент
    this.contentTitle.setText(this.currentTab.label);
    this.contentSubtitle.setText(tabId === 'basic' ? 'Фундаментальные навыки' : 'Профессиональные компетенции');

    // Создаём карточки навыков
    this.contentScrollOffset = 0;
    this.createSkillCards();
    this.handleResize(this.scale.gameSize);
  }

  createSkillCards() {
    // Удаляем старые карточки
    this.skillCards.removeAll(true);
    this.skillCardViews = [];

    const skills = this.currentTab.id === 'basic' ? BASIC_SKILLS : PROFESSIONAL_SKILLS;
    const currentSkills = this.skillsSystem.getSkills();

    skills.forEach((skill) => {
      const skillValue = currentSkills?.[skill.key] ?? 0;
      const skillCard = this.createSkillCard(skill, skillValue);
      this.skillCardViews.push(skillCard);
      this.skillCards.add(skillCard.container);
    });
  }

  createSkillCard(skillData, value) {
    const container = this.add.container(0, 0);
    const cardPanel = createRoundedPanel(this, { panelAlpha: 1, radius: 14, shadowAlpha: 0.15 });
    container.add(cardPanel);

    // Заголовок навыка
    const skillName = this.add.text(0, 0, skillData.label, textStyle(18, COLORS.text, '700'));
    container.add(skillName);

    // Описание
    const skillDesc = this.add.text(0, 0, skillData.description, {
      ...textStyle(13, COLORS.text, '400'),
      wordWrap: { width: 280 },
    });
    container.add(skillDesc);

    // Значение навыка
    const skillValueText = this.add.text(0, 0, `${value}/10`, textStyle(24, skillData.color, '700'));
    container.add(skillValueText);

    // Прогресс-бар
    const progressBarHeight = 8;
    const progressContainer = this.add.container(0, 0);
    
    // Фон прогресс-бара
    const progressBg = this.add.graphics();
    progressBg.fillStyle(COLORS.neutral, 0.3);
    progressContainer.add(progressBg);

    // Заполненный прогресс-бар
    const progressFill = this.add.graphics();
    progressFill.fillStyle(skillData.color, 1);
    progressContainer.add(progressFill);

    container.add(progressContainer);

    return {
      container,
      cardPanel,
      skillName,
      skillDesc,
      skillValueText,
      progressContainer,
      progressBg,
      progressFill,
      value,
      color: skillData.color,
    };
  }

  showToast(message) {
    this.toast.show(message);
  }

  handleResize(gameSize) {
    const width = gameSize.width;
    const height = gameSize.height;
    const safeX = Math.max(20, width * 0.04);
    const safeY = Math.max(20, height * 0.03);
    const sceneWidth = Math.min(760, width - safeX * 2);
    const sceneX = (width - sceneWidth) / 2;
    const headerHeight = 96;
    const tabsHeight = 76;
    const footerHeight = 86;
    const contentY = safeY + headerHeight + tabsHeight + 26;
    const contentHeight = height - contentY - footerHeight - safeY - 12;

    this.headerCard.resize(sceneX, safeY, sceneWidth, headerHeight);
    this.headerTitle.setPosition(sceneX + 24, safeY + 20);
    this.headerSubtitle.setPosition(sceneX + 24, safeY + 54);

    this.tabsCard.resize(sceneX, safeY + headerHeight + 14, sceneWidth, tabsHeight);
    const tabGap = 12;
    const tabButtonWidth = (sceneWidth - 40 - tabGap) / this.tabButtons.length;
    const tabY = safeY + headerHeight + 14 + tabsHeight / 2;
    this.tabButtons.forEach(({ button }, index) => {
      button.resize(tabButtonWidth, 44);
      button.setPosition(sceneX + 20 + tabButtonWidth / 2 + index * (tabButtonWidth + tabGap), tabY);
    });

    this.contentCard.resize(sceneX, contentY, sceneWidth, contentHeight);
    this.contentTitle.setPosition(sceneX + 22, contentY + 18);
    this.contentSubtitle.setPosition(sceneX + 22, contentY + 50);

    const viewportX = sceneX + 18;
    const viewportY = contentY + 84;
    const viewportWidth = sceneWidth - 36;
    const viewportHeight = Math.max(140, contentHeight - 98);
    this.skillsViewport = new Phaser.Geom.Rectangle(viewportX, viewportY, viewportWidth, viewportHeight);
    this.layoutSkillCards();

    this.skillsMaskGraphics.clear();
    this.skillsMaskGraphics.fillStyle(0xffffff, 1);
    this.skillsMaskGraphics.fillRect(viewportX, viewportY, viewportWidth, viewportHeight);

    this.backButton.resize(Math.min(320, sceneWidth - 24), 54);
    this.backButton.setPosition(sceneX + sceneWidth / 2, height - safeY - footerHeight / 2);
    this.toast.setPosition(width / 2, height - safeY - footerHeight - 12);
  }

  layoutSkillCards() {
    if (!this.skillsViewport) {
      return;
    }

    const cardGap = 12;
    const cardHeight = 110;
    const cardWidth = this.skillsViewport.width;
    const totalHeight = this.skillCardViews.length * cardHeight + Math.max(0, this.skillCardViews.length - 1) * cardGap;
    this.maxContentScroll = Math.max(0, totalHeight - this.skillsViewport.height);
    this.contentScrollOffset = Phaser.Math.Clamp(this.contentScrollOffset, 0, this.maxContentScroll);

    this.skillCardViews.forEach((card, index) => {
      const top = this.skillsViewport.y + index * (cardHeight + cardGap) - this.contentScrollOffset;
      card.container.setPosition(this.skillsViewport.x, top);
      this.layoutSkillCard(card, cardWidth, cardHeight);
    });
  }

  layoutSkillCard(card, width, height) {
    card.cardPanel.resize(0, 0, width, height, 14, 1);
    card.skillName.setPosition(18, 16);
    card.skillDesc.setPosition(18, 44).setWordWrapWidth(width - 150);
    card.skillValueText.setPosition(width - 18, 16).setOrigin(1, 0);

    const progressWidth = width - 36;
    card.progressContainer.setPosition(18, height - 24);
    card.progressBg.clear();
    card.progressBg.fillStyle(COLORS.neutral, 0.34);
    card.progressBg.fillRoundedRect(0, 0, progressWidth, 8, 4);

    card.progressFill.clear();
    const fillWidth = Phaser.Math.Clamp((card.value / 10) * progressWidth, 0, progressWidth);
    card.progressFill.fillStyle(card.color, 1);
    card.progressFill.fillRoundedRect(0, 0, fillWidth, 8, 4);
  }

  handleWheel(pointer, _gameObjects, _deltaX, deltaY) {
    if (!this.skillsViewport) {
      return;
    }
    const isInside = Phaser.Geom.Rectangle.Contains(this.skillsViewport, pointer.worldX, pointer.worldY);
    if (!isInside || this.maxContentScroll <= 0) {
      return;
    }
    this.contentScrollOffset = Phaser.Math.Clamp(this.contentScrollOffset + deltaY * 0.45, 0, this.maxContentScroll);
    this.layoutSkillCards();
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
