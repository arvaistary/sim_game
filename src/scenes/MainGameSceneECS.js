import Phaser from 'phaser';
import { SceneAdapter } from '../ecs/adapters/SceneAdapter.js';
import { PersistenceSystem } from '../ecs/systems/index.js';
import { DEFAULT_SAVE } from '../balance/default-save.js';
import {
  COLORS,
  createEventModal,
  createNotificationModal,
  createRoundedButton,
  createRoundedPanel,
  createToastMessage,
  textStyle,
} from '../ui-kit';
import { STAT_DEFS, NAV_ITEMS } from '../shared/constants.js';
import { ALL_SKILLS, getSkillByKey } from '../balance/skills-constants.js';
import { buildSkillTooltipText } from '../shared/skill-tooltip-content.js';

const STAT_TOOLTIPS = {
  hunger: 'Показывает насыщение. Низкое значение снижает эффективность и самочувствие.',
  energy: 'Запас сил на день. Низкая энергия ухудшает результат действий.',
  stress: 'Текущий уровень стресса. Чем выше стресс, тем сложнее сохранять стабильность.',
  mood: 'Эмоциональный фон персонажа. Высокое настроение помогает держать темп.',
  health: 'Общее состояние здоровья. Влияет на устойчивость к нагрузкам.',
  physical: 'Физическая форма. Улучшает выносливость и качество восстановления.',
};

const SKILL_LABELS = ALL_SKILLS.reduce((acc, skill) => {
  acc[skill.key] = skill.label;
  return acc;
}, {});

export class MainGameSceneECS extends Phaser.Scene {
  constructor() {
    super('MainGameScene');
    this.statBars = [];
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

    this.workPeriodSystem = this.sceneAdapter.getSystem('workPeriod');

    this.cameras.main.setBackgroundColor(COLORS.background);
    this.root = this.add.container(0, 0);

    this.profileCard = this.createCard();
    this.avatarCard = this.createCard();
    this.scalesCard = this.createCard();
    this.homePreviewCard = this.createCard();
    this.actionCard = this.createCard();
    this.navCard = this.createCard();
    this.root.add([this.profileCard, this.avatarCard, this.scalesCard, this.homePreviewCard, this.actionCard, this.navCard]);

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
    this.skillsButton = createRoundedButton(this, {
      label: 'Мои навыки',
      onClick: () => this.openSkillsModal(),
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
      this.skillsButton,
    ]);

    this.character = this.createCharacterBlock();
    this.root.add(this.character.container);

    this.moodPlaceholder = this.add.text(0, 0, 'Изображение\nнастроения', {
      ...textStyle(12, COLORS.text, '500'),
      align: 'center',
    });
    this.moodPlaceholder.setOrigin(0.5);
    this.root.add(this.moodPlaceholder);

    this.sectionTitle = this.add.text(0, 0, 'Состояние персонажа', textStyle(18, COLORS.text, '700'));
    this.root.add(this.sectionTitle);

    this.createStats();
    this.createStatTooltip();
    this.createSkillTooltip();
    this.createHomePreviewBlock();
    this.createActionButton();
    this.createNavigation();
    this.createToast();
    this.createSceneModals();
    this.refreshTexts();

    this.scale.on('resize', this.handleResize, this);
    this.input.keyboard.on('keydown-ESC', this.handleEscapeKey, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.handleResize, this);
      this.input.keyboard.off('keydown-ESC', this.handleEscapeKey, this);
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
    const shadow = this.add.ellipse(0, 116, 110, 26, COLORS.shadow, 0.22);
    const halo = this.add.circle(0, -14, 72, COLORS.accent, 0.12);
    const body = this.add.graphics();

    body.fillStyle(COLORS.sage, 0.28);
    body.fillRoundedRect(-54, 12, 108, 98, 34);
    body.fillStyle(COLORS.accent, 1);
    body.fillCircle(0, -20, 28);
    body.fillStyle(COLORS.sage, 1);
    body.fillRoundedRect(-38, 6, 76, 98, 28);
    body.fillStyle(COLORS.blue, 1);
    body.fillRoundedRect(-34, 40, 68, 52, 18);

    const face = this.add.graphics();
    face.fillStyle(COLORS.text, 0.95);
    face.fillCircle(-9, -22, 2.5);
    face.fillCircle(9, -22, 2.5);
    face.fillRoundedRect(-10, -4, 20, 4, 2);

    const caption = this.add.text(0, 144, 'Текущий рабочий настрой', textStyle(12, COLORS.text, '600'));
    caption.setOrigin(0.5);

    container.add([shadow, halo, body, face, caption]);
    return { container, caption };
  }

  createStats() {
    this.statBars = STAT_DEFS.map((stat) => {
      const bar = new StatBar(this, 0, 0, 300, stat);
      bar.hit.on('pointerover', (pointer) => this.showStatTooltip(stat.key, pointer.worldX, pointer.worldY));
      bar.hit.on('pointermove', (pointer) => this.showStatTooltip(stat.key, pointer.worldX, pointer.worldY));
      bar.hit.on('pointerout', () => this.hideStatTooltip());
      this.root.add(bar.container);
      return bar;
    });
  }

  createStatTooltip() {
    this.statTooltip = this.add.container(0, 0);
    this.statTooltipBg = this.add.graphics();
    this.statTooltipText = this.add.text(0, 0, '', {
      ...textStyle(12, COLORS.white, '500'),
      wordWrap: { width: 220 },
      align: 'left',
    });
    this.statTooltipText.setOrigin(0, 0);
    this.statTooltip.add([this.statTooltipBg, this.statTooltipText]);
    this.statTooltip.setVisible(false);
    this.root.add(this.statTooltip);
  }

  createSkillTooltip() {
    this.skillTooltip = this.add.container(0, 0);
    this.skillTooltipBg = this.add.graphics();
    this.skillTooltipText = this.add.text(0, 0, '', {
      ...textStyle(12, COLORS.white, '500'),
      wordWrap: { width: 260 },
      align: 'left',
      lineSpacing: 4,
    });
    this.skillTooltipText.setOrigin(0, 0);
    this.skillTooltip.add([this.skillTooltipBg, this.skillTooltipText]);
    this.skillTooltip.setVisible(false);
    this.skillTooltip.setDepth(3000);
    this.root.add(this.skillTooltip);
  }

  showStatTooltip(statKey, x, y) {
    const content = STAT_TOOLTIPS[statKey];
    if (!content) return;

    this.statTooltipText.setText(content);
    const width = this.statTooltipText.width + 18;
    const height = this.statTooltipText.height + 14;

    this.statTooltipBg.clear();
    this.statTooltipBg.fillStyle(0x2b2522, 0.94);
    this.statTooltipBg.fillRoundedRect(0, 0, width, height, 8);
    this.statTooltipText.setPosition(9, 7);

    const px = Phaser.Math.Clamp(x + 12, 8, this.scale.width - width - 8);
    const py = Phaser.Math.Clamp(y + 12, 8, this.scale.height - height - 8);
    this.statTooltip.setPosition(px, py);
    this.statTooltip.setVisible(true);
  }

  hideStatTooltip() {
    this.statTooltip.setVisible(false);
  }

  showSkillTooltip(skillKey, x, y) {
    const skill = getSkillByKey(skillKey);
    const content = buildSkillTooltipText(skill);
    if (!content) return;

    this.skillTooltipText.setText(content);
    const width = this.skillTooltipText.width + 20;
    const height = this.skillTooltipText.height + 16;

    this.skillTooltipBg.clear();
    this.skillTooltipBg.fillStyle(0x2b2522, 0.96);
    this.skillTooltipBg.fillRoundedRect(0, 0, width, height, 10);
    this.skillTooltipText.setPosition(10, 8);

    const px = Phaser.Math.Clamp(x + 14, 8, this.scale.width - width - 8);
    const py = Phaser.Math.Clamp(y + 14, 8, this.scale.height - height - 8);
    this.skillTooltip.setPosition(px, py);
    this.root.bringToTop(this.skillTooltip);
    this.skillTooltip.setVisible(true);
  }

  hideSkillTooltip() {
    this.skillTooltip.setVisible(false);
  }

  createHomePreviewBlock() {
    this.homePreviewGraphics = this.add.graphics();
    this.homePreviewTitle = this.add.text(0, 0, 'Интерьер дома', textStyle(18, COLORS.text, '700'));
    this.homePreviewHint = this.add.text(0, 0, 'Поместите изображение в `public/images/home-interior.png`', textStyle(12, COLORS.text, '500'));
    this.homePreviewHint2 = this.add.text(0, 0, 'Затем загрузите его в сцене через this.add.image(...)', textStyle(12, COLORS.text, '500'));
    this.root.add([this.homePreviewGraphics, this.homePreviewTitle, this.homePreviewHint, this.homePreviewHint2]);
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
      const label = this.add.text(0, 24, item.label, textStyle(11, COLORS.text, '600'));
      label.setOrigin(0.5);
      const hit = this.add.circle(0, 8, 34, 0x000000, 0);

      hit.setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => this.tweens.add({ targets: container, y: container.baseY - 4, duration: 180 }));
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
        if (item.id === 'skills') {
          this.scene.start('SkillsScene');
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
        if (item.id === 'fun') {
          this.scene.start('FunScene');
          return;
        }
        if (item.id === 'social') {
          this.scene.start('SocialScene');
          return;
        }
        this.scene.start('RecoveryScene', { initialTab: item.id });
      });

      container.baseY = 0;
      container.dot = dot;
      container.icon = icon;
      container.label = label;
      container.add([dot, icon, label, hit]);
      this.root.add(container);
      return container;
    });
  }

  createToast() {
    this.toast = createToastMessage(this, { width: 260, height: 52 });
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
    this.skillsModal = createNotificationModal(this, {
      primaryLabel: 'Ок',
      secondaryLabel: 'Закрыть',
    });
    this.skillsModalList = this.add.container(0, 0);
    this.skillsModal.add(this.skillsModalList);
    this.escapeMenuModal = createNotificationModal(this, {
      primaryLabel: 'Начать новую игру',
      secondaryLabel: 'Отмена',
    });
    this.root.add([this.workPeriodModal, this.notificationModal, this.skillsModal, this.escapeMenuModal]);
  }

  handleEscapeKey() {
    this.escapeMenuModal.show({
      title: 'Меню',
      description: 'Сбросить прогресс и начать новую игру?',
      onConfirm: () => {
        this.persistenceSystem.clearSave();
        this.scene.start('StartScene');
      },
    });
  }

  openSkillsModal() {
    const world = this.sceneAdapter.getWorld();
    const playerId = this.sceneAdapter.getPlayerEntityId();
    const skills = world.getComponent(playerId, 'skills') || {};
    const skillEntries = Object.entries(skills);
    const lines = skillEntries.length ? 'РќР°РІРµРґРё РЅР° РЅР°РІС‹Рє, С‡С‚РѕР±С‹ СѓРІРёРґРµС‚СЊ РѕРїРёСЃР°РЅРёРµ Рё Р±РѕРЅСѓСЃС‹.' : '';

    this.buildSkillsModalList(skillEntries);
    this.skillsModal.show({
      title: 'Мои навыки',
      description: lines || 'Навыки пока не открыты',
    });
    this.skillsModal.description.setText(skillEntries.length ? 'Hover a skill to see details.' : 'No skills yet');
    this.layoutSkillsModalList();
  }

  buildSkillsModalList(skillEntries) {
    this.skillsModalList.removeAll(true);
    this.skillsModalItems = [];

    skillEntries.forEach(([key, value], index) => {
      const row = this.add.text(0, 0, `${SKILL_LABELS[key] || key}: ${value}/10`, textStyle(14, COLORS.text, '600'));
      row.setInteractive({ useHandCursor: true });
      row.on('pointerover', (pointer) => this.showSkillTooltip(key, pointer.worldX, pointer.worldY));
      row.on('pointermove', (pointer) => this.showSkillTooltip(key, pointer.worldX, pointer.worldY));
      row.on('pointerout', () => this.hideSkillTooltip());
      this.skillsModalList.add(row);
      this.skillsModalItems.push({ row, index });
    });
  }

  layoutSkillsModalList() {
    if (!this.skillsModalList || !this.skillsModal?.panel) return;

    const modalX = this.skillsModal.panel.x;
    const modalY = this.skillsModal.panel.y;
    const startX = modalX + 24;
    const startY = modalY + 112;
    const lineHeight = 24;

    this.skillsModalItems?.forEach(({ row, index }) => {
      row.setPosition(startX, startY + index * lineHeight);
    });
  }

  showToast(message) {
    this.toast.show(message);
  }

  showWorkPeriodModal() {
    const playerId = this.sceneAdapter.getPlayerEntityId();
    const world = this.sceneAdapter.getWorld();
    const currentJob = world.getComponent(playerId, 'work');
    if (!currentJob?.id) {
      this.showToast('У вас нет работы!');
      return;
    }

    const schedule = currentJob.schedule || '5/2';
    const parts = schedule.split('/');
    const scheduleWorkDays = parts.length === 2 ? parseInt(parts[0], 10) : 5;
    const requiredHoursPerWeek = currentJob.requiredHoursPerWeek || 40;
    const shiftHours = Math.max(4, Math.round(requiredHoursPerWeek / Math.max(1, scheduleWorkDays)));
    const salaryPerHour = currentJob.salaryPerHour || Math.round((currentJob.salaryPerDay || 0) / 8);

    this.workPeriodModal.show({
      title: 'Рабочая смена',
      description: `Смена: ${shiftHours} ч.\nЗа это время ты получишь зарплату, но потратишь энергию и настроение.`,
      event: {
        title: 'Ожидаемый результат',
        description: `Зарплата: ${this.formatMoney((salaryPerHour || 0) * shiftHours)} ₽`,
      },
      onConfirm: () => this.startWorkPeriod(shiftHours),
    });
  }

  startWorkPeriod(workHours) {
    const playerId = this.sceneAdapter.getPlayerEntityId();
    const summary = this.workPeriodSystem.applyWorkShift
      ? this.workPeriodSystem.applyWorkShift(workHours)
      : this.workPeriodSystem.applyWorkPeriodResult(Math.max(1, Math.round(workHours / 8)));
    this.sceneAdapter.syncToSaveData();
    this.persistenceSystem.saveGame(this.sceneAdapter.getSaveData());
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
    const stats = world.getComponent(playerId, 'stats');
    const work = world.getComponent(playerId, 'work');
    const wallet = world.getComponent(playerId, 'wallet');
    const time = world.getComponent(playerId, 'time');
    const housing = world.getComponent(playerId, 'housing');
    const saveData = this.sceneAdapter.getSaveData();

    this.playerNameText.setText(saveData.playerName || 'Без имени');
    this.jobText.setText(work?.name || 'Безработный');
    this.moneyText.setText(this.formatMoney(wallet?.money || 0) + ' ₽');
    this.timeText.setText(
      `День ${time?.gameDays || 1} • ${time?.hourOfDay ?? 0}:00 • Неделя ${time?.gameWeeks || 1} (${time?.weekHoursRemaining ?? 168} ч. осталось) • ${time?.currentAge || 18} лет`,
    );
    this.comfortText.setText(`Комфорт: ${Math.round(housing?.comfort || 35)}`);

    this.statBars.forEach((bar, i) => {
      const statDef = STAT_DEFS[i];
      const value = stats?.[statDef.key] ?? 50;
      bar.animateTo(value);
    });
  }

  formatMoney(value) {
    return new Intl.NumberFormat('ru-RU').format(value);
  }

  handleResize(gameSize) {
    const w = gameSize.width;
    const h = gameSize.height;
    const safeX = Math.max(16, Math.floor(w * 0.03));
    const safeY = Math.max(16, Math.floor(h * 0.03));
    const gap = 12;
    const contentWidth = w - safeX * 2;
    const desktop = contentWidth >= 960;

    let cursorY = safeY;

    if (desktop) {
      const topHeight = 252;
      const profileW = Math.floor((contentWidth - gap * 2) * 0.5);
      const avatarW = Math.floor((contentWidth - gap * 2) * 0.2);
      const scalesW = contentWidth - profileW - avatarW - gap * 2;

      const profileX = safeX;
      const avatarX = profileX + profileW + gap;
      const scalesX = avatarX + avatarW + gap;

      this.profileCard.setSize(profileW, topHeight);
      this.profileCard.setPosition(profileX, cursorY);
      this.avatarCard.setSize(avatarW, topHeight);
      this.avatarCard.setPosition(avatarX, cursorY);
      this.scalesCard.setSize(scalesW, topHeight);
      this.scalesCard.setPosition(scalesX, cursorY);

      this.layoutProfileContent(profileX, cursorY, profileW, topHeight, false);
      this.layoutAvatarContent(avatarX, cursorY, avatarW, topHeight);
      this.layoutScalesContent(scalesX, cursorY, scalesW, topHeight);

      cursorY += topHeight + gap;
    } else {
      const profileH = 156;
      const rowH = 238;
      const avatarW = Math.floor((contentWidth - gap) * 0.34);
      const scalesW = contentWidth - avatarW - gap;

      this.profileCard.setSize(contentWidth, profileH);
      this.profileCard.setPosition(safeX, cursorY);
      this.layoutProfileContent(safeX, cursorY, contentWidth, profileH, true);
      cursorY += profileH + gap;

      this.avatarCard.setSize(avatarW, rowH);
      this.avatarCard.setPosition(safeX, cursorY);
      this.layoutAvatarContent(safeX, cursorY, avatarW, rowH);

      this.scalesCard.setSize(scalesW, rowH);
      this.scalesCard.setPosition(safeX + avatarW + gap, cursorY);
      this.layoutScalesContent(safeX + avatarW + gap, cursorY, scalesW, rowH);
      cursorY += rowH + gap;
    }

    const navHeight = 96;
    const actionHeight = 98;
    const navY = h - safeY - navHeight;
    const actionY = navY - gap - actionHeight;
    const homeY = cursorY;
    const homeHeight = Math.max(72, actionY - gap - homeY);

    this.homePreviewCard.setSize(contentWidth, homeHeight);
    this.homePreviewCard.setPosition(safeX, homeY);
    this.layoutHomePreviewBlock(safeX, homeY, contentWidth, homeHeight);

    this.actionCard.setSize(contentWidth, actionHeight);
    this.actionCard.setPosition(safeX, actionY);
    this.actionButton.setPosition(safeX + contentWidth / 2, actionY + actionHeight / 2);
    this.resizeActionButton(Math.min(560, contentWidth - 30), 72);

    this.navCard.setSize(contentWidth, navHeight);
    this.navCard.setPosition(safeX, navY);
    this.layoutNavCard(safeX, navY, contentWidth, navHeight);

    this.toast.setPosition(w - safeX - 170, safeY + 24);
    this.workPeriodModal.resize(this.scale.gameSize);
    this.notificationModal.resize(this.scale.gameSize);
    this.skillsModal.resize(this.scale.gameSize);
    this.layoutSkillsModalList();
    this.escapeMenuModal.resize(this.scale.gameSize);
  }

  layoutProfileContent(x, y, width, height, mobile) {
    const pad = 18;
    this.moneyText.setFontSize(mobile ? 18 : 26);
    this.playerNameText.setFontSize(mobile ? 22 : 28);
    this.playerNameText.setPosition(x + pad, y + 18);
    this.jobText.setPosition(x + pad, y + 54);
    this.moneyText.setPosition(x + pad, y + 80);
    if (mobile) {
      this.timeText.setPosition(x + pad, y + 102);
      this.comfortText.setPosition(x + pad, y + 122);
    } else {
      this.timeText.setPosition(x + pad, y + 118);
      this.comfortText.setPosition(x + Math.floor(width * 0.52), y + 118);
    }

    const buttonY = y + (mobile ? height - 24 : height - 28);
    this.careerButton.resize(112, 34);
    this.skillsButton.resize(112, 34);
    this.careerButton.setPosition(x + pad + 56, buttonY);
    this.skillsButton.setPosition(x + pad + 56 + 124, buttonY);
  }

  layoutAvatarContent(x, y, width, height) {
    const compact = width < 180;
    const cx = x + width / 2;
    this.character.container.setPosition(cx, y + (compact ? 62 : 70));
    this.character.caption.setVisible(!compact);
    if (!compact) {
      this.character.caption.setY(116);
      this.moodPlaceholder.setOrigin(0.5, 1);
      this.moodPlaceholder.setPosition(cx, y + height - 10);
    } else {
      this.character.caption.setY(144);
      this.moodPlaceholder.setOrigin(0.5, 0.5);
      this.moodPlaceholder.setPosition(cx, y + height - 34);
    }
  }

  layoutScalesContent(x, y, width, height) {
    this.sectionTitle.setPosition(x + 16, y + 18);
    const compact = height < 246;
    const startY = y + (compact ? 46 : 56);
    const gap = compact ? 30 : 32;
    this.statBars.forEach((bar, i) => {
      bar.setPosition(x + 16, startY + i * gap, width - 32);
    });
  }

  layoutHomePreviewBlock(x, y, width, height) {
    const pad = 16;
    const titleH = 28;
    const innerX = x + pad;
    const innerY = y + 16 + titleH;
    const innerW = width - pad * 2;
    const innerH = Math.max(68, height - 16 - titleH - 14);

    this.homePreviewGraphics.clear();
    this.homePreviewGraphics.fillStyle(0xf2ece3, 0.9);
    this.homePreviewGraphics.lineStyle(2, COLORS.line, 1);
    this.homePreviewGraphics.fillRoundedRect(innerX, innerY, innerW, innerH, 12);
    this.homePreviewGraphics.strokeRoundedRect(innerX, innerY, innerW, innerH, 12);
    this.homePreviewGraphics.lineStyle(1, COLORS.neutral, 0.9);
    this.homePreviewGraphics.lineBetween(innerX + 8, innerY + 8, innerX + innerW - 8, innerY + innerH - 8);
    this.homePreviewGraphics.lineBetween(innerX + innerW - 8, innerY + 8, innerX + 8, innerY + innerH - 8);

    this.homePreviewTitle.setPosition(x + pad, y + 16);

    const hintMidX = innerX + innerW / 2;
    const hintMidY = innerY + innerH / 2;
    const wrapW = Math.max(160, innerW - 24);
    this.homePreviewHint.setStyle({ align: 'center', wordWrap: { width: wrapW } });
    this.homePreviewHint2.setStyle({ align: 'center', wordWrap: { width: wrapW } });
    this.homePreviewHint.setOrigin(0.5, 0.5);
    this.homePreviewHint2.setOrigin(0.5, 0.5);
    this.homePreviewHint.setPosition(hintMidX, hintMidY - 9);
    this.homePreviewHint2.setPosition(hintMidX, hintMidY + 11);
  }

  resizeActionButton(width, height) {
    this.actionButton.resize(width, height, COLORS.accent);
    this.actionButton.text.setFontSize(width < 420 ? 18 : 22);
    this.actionButton.subtitle.setFontSize(width < 420 ? 12 : 14);
  }

  layoutNavCard(x, y, width, height) {
    const sectionWidth = width / NAV_ITEMS.length;
    const compact = sectionWidth < 64;
    this.navButtons.forEach((button, index) => {
      const centerX = x + sectionWidth * index + sectionWidth / 2;
      const centerY = y + (compact ? height / 2 : height / 2 + 6);
      button.label.setVisible(!compact);
      button.dot.setRadius(compact ? 18 : 21);
      button.icon.setFontSize(compact ? 16 : 18);
      button.icon.setY(compact ? 0 : -10);
      button.baseY = centerY;
      button.setPosition(centerX, centerY);
    });
  }

  animateEntrance() {
    [this.profileCard, this.avatarCard, this.scalesCard, this.homePreviewCard, this.actionCard, this.navCard].forEach((item, index) => {
      item.setAlpha(0);
      this.tweens.add({
        targets: item,
        alpha: 1,
        duration: 360,
        delay: index * 60,
        ease: 'Cubic.easeOut',
      });
    });
  }

  ensureEventQueue(delay = 0) {
    this.time.delayedCall(delay, () => {
      const eventQueueSystem = this.sceneAdapter.getSystem('eventQueue');
      const pendingEvents = eventQueueSystem.getEventQueue().pendingEvents || [];
      if (pendingEvents.length > 0) {
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
    this.barHeight = 8;
    this.rowHeight = 28;
    this.labelColumnWidth = 126;
    this.valueColumnWidth = 44;
    this.columnsGap = 10;
    this.config = config;
    this.value = 0;

    this.container = scene.add.container(x, y);
    this.label = scene.add.text(0, 0, config.label, textStyle(14, COLORS.text, '600'));
    this.label.setOrigin(0, 0.5);
    this.valueText = scene.add.text(width, 0, '0%', textStyle(14, COLORS.text, '600'));
    this.valueText.setOrigin(1, 0.5);
    this.track = scene.add.graphics();
    this.fill = scene.add.graphics();
    this.hit = scene.add.rectangle(0, 0, width, this.rowHeight, 0x000000, 0).setOrigin(0, 0);
    this.hit.setInteractive({ useHandCursor: true });

    this.container.add([this.label, this.valueText, this.track, this.fill, this.hit]);
    this.redraw(0);
  }

  setPosition(x, y, width = this.width) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.container.setPosition(x, y);
    this.hit.setSize(width, this.rowHeight);
    this.redraw(this.value);
  }

  animateTo(value) {
    const target = Phaser.Math.Clamp(value, 0, 100);
    this.scene.tweens.addCounter({
      from: this.value,
      to: target,
      duration: 500,
      ease: 'Cubic.easeOut',
      onUpdate: (tween) => this.redraw(tween.getValue()),
      onComplete: () => {
        this.value = target;
      },
    });
  }

  redraw(value) {
    const clamped = Phaser.Math.Clamp(value, 0, 100);
    const rounded = Math.round(clamped);
    const labelColumnWidth = Math.min(this.labelColumnWidth, Math.floor(this.width * 0.44));
    const valueColumnWidth = this.width < 280 ? 34 : this.valueColumnWidth;
    const trackX = labelColumnWidth + this.columnsGap;
    const trackY = -this.barHeight / 2;
    const trackWidth = Math.max(56, this.width - labelColumnWidth - valueColumnWidth - this.columnsGap * 2);

    this.track.clear();
    this.track.fillStyle(COLORS.line, 1);
    this.track.fillRoundedRect(trackX, trackY, trackWidth, this.barHeight, this.barHeight / 2);

    this.fill.clear();
    this.fill.fillStyle(Phaser.Display.Color.HexStringToColor(this.config.endColor).color, 1);
    const filledWidth = clamped <= 0 ? 0 : Math.max(8, (trackWidth * clamped) / 100);
    this.fill.fillRoundedRect(trackX, trackY, filledWidth, this.barHeight, this.barHeight / 2);

    this.label.setPosition(0, 0);
    this.label.setFontSize(this.width < 280 ? 12 : 14);
    this.valueText.setPosition(this.width, 0);
    this.valueText.setFontSize(this.width < 280 ? 12 : 14);
    this.valueText.setText(`${rounded}%`);
    this.hit.setPosition(0, -this.rowHeight / 2);
  }

  destroy() {
    this.container.destroy();
  }
}
