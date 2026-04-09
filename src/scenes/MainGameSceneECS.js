import Phaser from 'phaser';
import { SceneAdapter } from '../ecs/adapters/SceneAdapter.js';
import { PersistenceSystem } from '../ecs/systems/index.js';
import { DEFAULT_SAVE } from '../balance/default-save.js';
import { CAREER_JOBS } from '../balance/career-jobs.js';
import { recalculateSkillModifiers } from '../balance/skill-modifiers.js';
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
import { resolveActivityLogTitle } from '../shared/activity-log-formatters.js';
import { STATS_COMPONENT } from '../ecs/components/index.js';

const STAT_TOOLTIPS = {
  hunger: 'Показывает насыщение. Низкое значение снижает эффективность и самочувствие.',
  energy: 'Запас сил на день. Низкая энергия ухудшает результат действий.',
  stress: 'Текущий уровень стресса. Чем выше стресс, тем сложнее сохранять стабильность.',
  mood: 'Эмоциональный фон персонажа. Высокое настроение помогает держать темп.',
  health: 'Общее состояние здоровья. Влияет на устойчивость к нагрузкам.',
  physical: 'Физическая форма. Улучшает выносливость и качество восстановления.',
};
const STAT_MAX_VALUE = 100;

const SKILL_LABELS = ALL_SKILLS.reduce((acc, skill) => {
  acc[skill.key] = skill.label;
  return acc;
}, {});

export class MainGameSceneECS extends Phaser.Scene {
  constructor() {
    super('MainGameScene');
    this.statBars = [];
    this.openModalCount = 0;
    this.skillsModalScrollY = 0;
    this.skillsModalScrollMax = 0;
    this.skillsModalListContentHeight = 0;
    this.skillsScrollViewportRect = { x: 0, y: 0, w: 0, h: 0 };
    this._skillsListLayout = null;
    this.skillsListPointerState = null;
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

    // Авто-назначение первой доступной работы, если игрок безработный
    this._ensureInitialJob();

    this.cameras.main.setBackgroundColor(COLORS.background);
    this.root = this.add.container(0, 0);

    this.profileCard = this.createCard();
    this.logCard = this.createCard();
    this.scalesCard = this.createCard();
    this.homePreviewCard = this.createCard();
    this.actionCard = this.createCard();
    this.navCard = this.createCard();
    this.root.add([this.profileCard, this.logCard, this.scalesCard, this.homePreviewCard, this.actionCard, this.navCard]);

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

    // Activity log block elements
    this.logTitle = this.add.text(0, 0, '📋 Последние события', textStyle(16, COLORS.text, '700'));
    this.logEntriesText = this.add.text(0, 0, '', {
      ...textStyle(13, COLORS.text, '500'),
      lineSpacing: 3,
    });
    this.logHintText = this.add.text(0, 0, 'Нажмите для подробностей →', textStyle(11, COLORS.text, '400'));
    this.logHintText.setOrigin(0.5, 1);
    this.logHitArea = this.add.rectangle(0, 0, 1, 1, 0x000000, 0);
    this.logHitArea.setOrigin(0, 0);
    this.logHitArea.setInteractive({ useHandCursor: true });
    this.logHitArea.on('pointerup', () => this.navigateTo('ActivityLogScene', 'Журнал событий'));
    this.root.add([this.logTitle, this.logEntriesText, this.logHintText, this.logHitArea]);

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
    this.refreshActivityLog();

    this.scale.on('resize', this.handleResize, this);
    this.input.keyboard.on('keydown-ESC', this.handleEscapeKey, this);
    this.input.on('wheel', this.onSkillsModalWheel, this);
    this.input.on('pointermove', this.onSkillsListGlobalDrag, this);
    this.input.on('pointerup', this.onSkillsListPointerUp, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.handleResize, this);
      this.input.keyboard.off('keydown-ESC', this.handleEscapeKey, this);
      this.input.off('wheel', this.onSkillsModalWheel, this);
      this.input.off('pointermove', this.onSkillsListGlobalDrag, this);
      this.input.off('pointerup', this.onSkillsListPointerUp, this);
    });

    this.handleResize(this.scale.gameSize);
    this.animateEntrance();
    this.ensureEventQueue(520);
  }

  createCard() {
    return createRoundedPanel(this, { panelAlpha: 1, radius: 18, shadowAlpha: 0.22 });
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
    const content = this.buildStatTooltipText(statKey);
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

  buildStatTooltipText(statKey) {
    const description = STAT_TOOLTIPS[statKey];
    if (!description) return '';

    const world = this.sceneAdapter?.getWorld?.();
    const playerId = this.sceneAdapter?.getPlayerEntityId?.();
    const stats = world?.getComponent?.(playerId, STATS_COMPONENT) || {};
    const rawValue = Number(stats?.[statKey] ?? 0);
    const currentValue = Phaser.Math.Clamp(Math.round(rawValue), 0, STAT_MAX_VALUE);

    return `${description}\n\nТекущее значение: ${currentValue}/${STAT_MAX_VALUE}`;
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
    this.homePreviewDom = this.add.dom(0, 0).createFromHTML(
      '<div style="position:relative;overflow:hidden;border-radius:12px;pointer-events:none;">'
      + '<img src="/image/home_interier_0.gif" alt="Интерьер дома" '
      + 'style="width:100%;height:100%;display:block;object-fit:cover;object-position:center bottom;"/>'
      + '</div>'
    );
    this.homePreviewDom.setOrigin(0, 0);
    this.homePreviewTitle = this.add.text(0, 0, 'Интерьер дома', textStyle(18, COLORS.text, '700'));
    this.homePreviewHint = this.add.text(0, 0, 'Поместите изображение в `public/images/home-interior.png`', textStyle(12, COLORS.text, '500'));
    this.homePreviewHint2 = this.add.text(0, 0, 'Затем загрузите его в сцене через this.add.image(...)', textStyle(12, COLORS.text, '500'));
    this.root.add([
      this.homePreviewGraphics,
      this.homePreviewTitle,
      this.homePreviewHint,
      this.homePreviewHint2,
    ]);
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
        const sceneMap = {
          education: 'EducationScene',
          finance: 'FinanceScene',
          skills: 'SkillsScene',
          home: 'HomeScene',
          shop: 'ShopScene',
          fun: 'FunScene',
          social: 'SocialScene',
          activityLog: 'ActivityLogScene',
        };
        const sceneName = sceneMap[item.id];
        if (sceneName) {
          this.navigateTo(sceneName, item.label);
          return;
        }
        this.navigateTo('RecoveryScene', item.label, { initialTab: item.id });
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

  navigateTo(sceneName, label, data) {
    if (this.sceneAdapter && this.sceneAdapter.world && this.sceneAdapter.world.eventBus) {
      this.sceneAdapter.world.eventBus.dispatchEvent(new CustomEvent('activity:navigation', {
        detail: {
          category: 'scene_change',
          title: '🗺️ Переход: ' + sceneName,
          description: 'Перешёл в ' + label,
          icon: null,
          metadata: { from: 'MainGameSceneECS', to: sceneName },
        },
      }));
    }
    if (data) {
      this.scene.start(sceneName, data);
    } else {
      this.scene.start(sceneName);
    }
  }

  createToast() {
    this.toast = createToastMessage(this, { width: 260, height: 52 });
    this.toast.setDepth(25000);
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
      width: 360,
      height: 440,
      primaryLabel: 'Ок',
      secondaryLabel: 'Закрыть',
    });
    this.skillsModalScrollMask = this.add
      .rectangle(0, 0, 100, 100, 0xffffff, 0)
      .setOrigin(0)
      .setVisible(false);
    this.root.add(this.skillsModalScrollMask);

    this.skillsModalList = this.add.container(0, 0);
    this.skillsModalList.setMask(this.skillsModalScrollMask.createGeometryMask());
    this.skillsModal.addAt(this.skillsModalList, 5);
    this.escapeMenuModal = createNotificationModal(this, {
      primaryLabel: 'Начать новую игру',
      secondaryLabel: 'Отмена',
    });
    this._bindModalPreviewVisibility(this.workPeriodModal);
    this._bindModalPreviewVisibility(this.notificationModal);
    this._bindModalPreviewVisibility(this.skillsModal);
    this._bindModalPreviewVisibility(this.escapeMenuModal);
    this.root.add([this.workPeriodModal, this.notificationModal, this.skillsModal, this.escapeMenuModal]);
  }

  _bindModalPreviewVisibility(modal) {
    if (!modal || modal.__previewVisibilityBound) return;
    const originalShow = modal.show?.bind(modal);
    const originalHide = modal.hide?.bind(modal);
    if (!originalShow || !originalHide) return;

    modal.show = (...args) => {
      this.openModalCount += 1;
      this._setHomePreviewDomVisible(false);
      return originalShow(...args);
    };

    modal.hide = (...args) => {
      const result = originalHide(...args);
      this.openModalCount = Math.max(0, this.openModalCount - 1);
      this.time.delayedCall(180, () => {
        if (this.openModalCount === 0) {
          this._setHomePreviewDomVisible(true);
        }
      });
      return result;
    };

    modal.__previewVisibilityBound = true;
  }

  _setHomePreviewDomVisible(visible) {
    if (!this.homePreviewDom) return;
    this.homePreviewDom.setVisible(visible);
    if (this.homePreviewDom.node) {
      this.homePreviewDom.node.style.display = visible ? 'block' : 'none';
    }
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
    const hint = 'Наведите на строку — покажется описание и бонусы. Список можно прокручивать колёсиком или перетаскиванием.';

    this.skillsModalScrollY = 0;
    this.skillsListPointerState = null;
    this.buildSkillsModalList(skillEntries);
    this.skillsModal.show({
      title: 'Мои навыки',
      description: skillEntries.length ? hint : 'Пока нет открытых навыков. Они появятся в ходе игры.',
    });
    this.layoutSkillsModalList();
  }

  buildSkillsModalList(skillEntries) {
    this.skillsModalList.removeAll(true);
    this.skillsModalItems = [];

    skillEntries.forEach(([key, value]) => {
      const row = this.add.text(0, 0, `${SKILL_LABELS[key] || key}: ${value}/10`, textStyle(14, COLORS.text, '600'));
      row.setInteractive({ useHandCursor: true });
      row.on('pointerover', (pointer) => {
        if (this.skillsListPointerState?.dragging) return;
        this.showSkillTooltip(key, pointer.worldX, pointer.worldY);
      });
      row.on('pointermove', (pointer) => {
        if (this.skillsListPointerState?.dragging) return;
        this.showSkillTooltip(key, pointer.worldX, pointer.worldY);
      });
      row.on('pointerout', () => this.hideSkillTooltip());
      row.on('pointerdown', (pointer) => {
        if (!this.skillsModal?.visible || !this.skillsModalItems?.length) return;
        this.skillsListPointerState = {
          startY: pointer.y,
          startScroll: this.skillsModalScrollY,
          dragging: false,
        };
      });
      this.skillsModalList.add(row);
      this.skillsModalItems.push({ row, key });
    });
  }

  layoutSkillsModalList() {
    if (!this.skillsModalList || !this.skillsModal?.panel) return;

    const panel = this.skillsModal.panel;
    const px = panel.x;
    const py = panel.y;
    const pw = panel.panelWidth ?? panel.width;
    const horizontalPad = 24;
    const listW = Math.max(120, pw - horizontalPad * 2);

    const desc = this.skillsModal.description;
    const secondary = this.skillsModal.secondaryButton;
    const listTop = desc.y + desc.height + 12;
    const gapAboveButtons = 14;
    const listBottom = secondary.y - secondary.height / 2 - gapAboveButtons;
    const viewportH = Math.max(72, listBottom - listTop);

    this.skillsScrollViewportRect = {
      x: px + horizontalPad,
      y: listTop,
      w: listW,
      h: viewportH,
    };

    this.skillsModalScrollMask.setPosition(this.skillsScrollViewportRect.x, this.skillsScrollViewportRect.y);
    this.skillsModalScrollMask.setSize(this.skillsScrollViewportRect.w, this.skillsScrollViewportRect.h);

    this._skillsListLayout = { px, listTop, horizontalPad };

    const rowGap = 6;
    let y = 0;
    this.skillsModalItems?.forEach(({ row }) => {
      row.setStyle({
        ...textStyle(14, COLORS.text, '600'),
        wordWrap: { width: listW },
        lineSpacing: 2,
      });
      row.setPosition(0, y);
      y += row.height + rowGap;
    });

    this.skillsModalListContentHeight = y;
    this.skillsModalScrollMax = Math.min(0, viewportH - y);
    this.skillsModalScrollY = Phaser.Math.Clamp(this.skillsModalScrollY, this.skillsModalScrollMax, 0);

    this._applySkillsModalScrollPosition();
  }

  _applySkillsModalScrollPosition() {
    const L = this._skillsListLayout;
    if (!L || !this.skillsModalList) return;
    this.skillsModalList.setPosition(L.px + L.horizontalPad, L.listTop + this.skillsModalScrollY);
  }

  _isPointInSkillsScrollViewport(wx, wy) {
    const r = this.skillsScrollViewportRect;
    if (!r?.w || !this.skillsModal?.visible) return false;
    return wx >= r.x && wx <= r.x + r.w && wy >= r.y && wy <= r.y + r.h;
  }

  onSkillsModalWheel(pointer, _go, _dx, dy, _dz, event) {
    if (!this.skillsModal?.visible || !this.skillsModalItems?.length) return;
    if (!this._isPointInSkillsScrollViewport(pointer.worldX, pointer.worldY)) return;
    if (this.skillsModalScrollMax >= 0) return;
    event?.preventDefault?.();

    const delta = typeof event?.deltaY === 'number' ? event.deltaY : typeof dy === 'number' ? dy : 0;
    if (delta === 0) return;

    this.skillsModalScrollY = Phaser.Math.Clamp(
      this.skillsModalScrollY - delta * 0.4,
      this.skillsModalScrollMax,
      0,
    );
    this._applySkillsModalScrollPosition();
    this.hideSkillTooltip();
  }

  onSkillsListGlobalDrag(pointer) {
    const st = this.skillsListPointerState;
    if (!this.skillsModal?.visible || !st || !pointer.isDown) return;
    if (this.skillsModalScrollMax >= 0) return;

    const dragDy = pointer.y - st.startY;
    if (!st.dragging && Math.abs(dragDy) > 10) st.dragging = true;
    if (!st.dragging) return;

    this.skillsModalScrollY = Phaser.Math.Clamp(st.startScroll + dragDy, this.skillsModalScrollMax, 0);
    this._applySkillsModalScrollPosition();
    this.hideSkillTooltip();
  }

  onSkillsListPointerUp() {
    this.skillsListPointerState = null;
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

    const requiredHoursPerWeek = Math.max(0, Number(currentJob.requiredHoursPerWeek) || 40);
    const workedWeek = Math.max(0, Number(currentJob.workedHoursCurrentWeek) || 0);
    const jobHoursLeft = Math.max(0, requiredHoursPerWeek - workedWeek);

    if (jobHoursLeft <= 0) {
      this.showToast(
        'Недельная норма по работе уже выполнена. Новые смены будут доступны с начала следующей игровой недели.',
      );
      return;
    }

    const timeComp = world.getComponent(playerId, 'time');
    const timeSystem = world.systems.find((s) => typeof s.normalizeTimeComponent === 'function');
    if (timeSystem && timeComp) {
      timeSystem.normalizeTimeComponent(timeComp);
    }
    const weekLeft = Math.max(0, timeComp?.weekHoursRemaining ?? 168);
    const schedule = currentJob.schedule || '5/2';
    const parts = schedule.split('/');
    const scheduleWorkDays = parts.length === 2 ? parseInt(parts[0], 10) : 5;
    const shiftHours = Math.max(4, Math.round(requiredHoursPerWeek / Math.max(1, scheduleWorkDays)));
    const totalPeriodHours = requiredHoursPerWeek;

    if (weekLeft < shiftHours) {
      this.showToast(
        `В неделе осталось ${weekLeft} ч. свободного времени — недостаточно для смены (${shiftHours} ч).`,
      );
      return;
    }

    if (jobHoursLeft < shiftHours) {
      this.showToast(
        `По норме работы на неделе осталось ${jobHoursLeft} ч. — меньше одной смены (${shiftHours} ч).`,
      );
      return;
    }

    const salaryPerHour = this.resolveSalaryPerHour(currentJob);

    const shiftSalary = (salaryPerHour || 0) * shiftHours;
    const periodSalary = (salaryPerHour || 0) * totalPeriodHours;

    const allowFullPeriod = jobHoursLeft >= totalPeriodHours && weekLeft >= totalPeriodHours;

    const description = [
      `График: ${schedule}`,
      '',
      `▸ Одна смена: ${shiftHours} ч → ${this.formatMoney(shiftSalary)} ₽`,
      `▸ Весь период: ${totalPeriodHours} ч → ${this.formatMoney(periodSalary)} ₽`,
      '',
      'Весь период — это все рабочие дни цикла подряд.',
      'Потеря характеристик пропорциональна часам.',
      '',
      `Норма по работе на эту неделю: ${workedWeek} / ${requiredHoursPerWeek} ч (ещё можно отработать ${jobHoursLeft} ч.).`,
      !allowFullPeriod
        ? `Полный период сейчас недоступен: по норме или по свободному времени недели не хватает ${totalPeriodHours} ч.`
        : '',
    ]
      .filter(Boolean)
      .join('\n');

    this.workPeriodModal.show({
      title: 'Пойти на работу',
      description,
      primaryLabel: `Смена (${shiftHours} ч)`,
      secondaryLabel: allowFullPeriod
        ? `Весь период (${totalPeriodHours} ч)`
        : `Период ${totalPeriodHours} ч (недоступно)`,
      onPrimary: () => this.startWorkPeriod(shiftHours),
      onSecondary: () => {
        if (!allowFullPeriod) {
          this.showToast(
            `Полный период — ${totalPeriodHours} ч. Сейчас по норме осталось ${jobHoursLeft} ч., в неделе свободно ${weekLeft} ч.`,
          );
          return;
        }
        this.startWorkPeriod(totalPeriodHours);
      },
    });
  }

  startWorkPeriod(workHours) {
    const playerId = this.sceneAdapter.getPlayerEntityId();
    const world = this.sceneAdapter.getWorld();
    const walletBefore = world.getComponent(playerId, 'wallet')?.money ?? 0;
    const summary = this.workPeriodSystem.applyWorkShift
      ? this.workPeriodSystem.applyWorkShift(workHours)
      : this.workPeriodSystem.applyWorkPeriodResult(Math.max(1, Math.round(workHours / 8)));
    const walletAfter = world.getComponent(playerId, 'wallet')?.money ?? walletBefore;
    const earned = walletAfter - walletBefore;

    this.sceneAdapter.syncToSaveData();
    this.persistenceSystem.saveGame(this.sceneAdapter.getSaveData());
    this.refreshTexts();

    const { title, description } = this.buildWorkPeriodNotificationContent({
      world,
      playerId,
      workHours,
      summary,
      walletBefore,
      walletAfter,
      earned,
    });

    this.notificationModal.show({
      title,
      description,
      onConfirm: () => this.ensureEventQueue(520),
    });
  }

  /**
   * Текст модалки после попытки выйти на работу: при отказе смены — без ложных «отработано X ч»;
   * при нулевой выплате — явная причина (ставка 0 и т.д.).
   */
  buildWorkPeriodNotificationContent({
    world,
    playerId,
    workHours,
    summary,
    walletBefore,
    walletAfter,
    earned,
  }) {
    const summaryStr = String(summary || '').trim();
    const summaryLines = summaryStr
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const payoutIdx = summaryLines.findIndex((line) => line.startsWith('Выплата:'));
    const statLines = [];
    if (payoutIdx >= 0) {
      for (let i = payoutIdx + 1; i < summaryLines.length; i++) {
        const line = summaryLines[i];
        if (line.startsWith('Событие:') || line.startsWith('Карьерный рост:')) break;
        statLines.push(line);
      }
    }
    const statBlock = statLines.join('\n');
    const eventLine = summaryLines.find((line) => line.startsWith('Событие:')) || '';
    const careerLine = summaryLines.find((line) => line.startsWith('Карьерный рост:')) || '';

    if (earned > 0) {
      const description = [
        `Отработано: ${workHours} ч`,
        `Начислено: +${this.formatMoney(earned)} ₽`,
        `Баланс: ${this.formatMoney(walletBefore)} ₽ → ${this.formatMoney(walletAfter)} ₽`,
        statBlock ? `\nИзменения:\n${statBlock}` : '',
        eventLine || '',
        careerLine || '',
      ]
        .filter(Boolean)
        .join('\n');
      return { title: 'Рабочий период завершён', description };
    }

    const shiftRejected =
      summaryLines[0]?.startsWith('Смена не проведена') ||
      summaryStr.startsWith('Смена не проведена');

    if (shiftRejected) {
      const detailLines = summaryLines.slice(1).filter(Boolean);
      const reasonBlock = detailLines.length ? detailLines.join('\n') : summaryStr;
      const description = [
        'Деньги не начислены: смена не была проведена (время игры и характеристики не менялись).',
        '',
        reasonBlock,
        '',
        `Вы запрашивали смену на ${workHours} ч — выберите меньший период или дождитесь новой недели, когда в расписании снова будет достаточно часов.`,
      ].join('\n');
      return { title: 'Смена не выполнена', description };
    }

    if (!summaryStr) {
      const work = world.getComponent(playerId, 'work');
      const hasJob = Boolean(work?.id && work.employed !== false);
      const description = hasJob
        ? 'Смена не была учтена: не хватает игровых данных (кошелёк, время или статы). Сохраните игру и попробуйте снова; если повторится — это ошибка версии.'
        : 'Смена недоступна: у персонажа нет активной работы. Откройте «Карьера» и устройтесь на должность со ставкой.';
      return { title: 'Смена не выполнена', description };
    }

    const completedLine = summaryLines.find((line) => line.startsWith('Рабочая смена завершена'));
    const payoutLine = summaryLines.find((line) => line.startsWith('Выплата:'));
    const work = world.getComponent(playerId, 'work');
    const jobLabel = work?.name || work?.id || 'текущая должность';
    const baseHourly = this.resolveSalaryPerHour(work);
    const skills = world.getComponent(playerId, 'skills') || {};
    const mods = recalculateSkillModifiers(skills);
    const effectiveHourly = Math.round(
      baseHourly * (mods.salaryMultiplier ?? 1) * (mods.workEfficiencyMultiplier ?? 1),
    );

    if (completedLine && payoutLine) {
      let zeroPayReason;
      if (baseHourly <= 0) {
        zeroPayReason = `Почасовая ставка по «${jobLabel}» в данных игры равна 0 ₽/ч (зарплата не задана или не подтянулась из справочника карьеры). Откройте «Карьера» и выберите должность со ставкой.`;
      } else if (effectiveHourly <= 0) {
        zeroPayReason = `Базовая ставка ${this.formatMoney(baseHourly)} ₽/ч есть, но после модификаторов навыков (зарплата ×${(mods.salaryMultiplier ?? 1).toFixed(2)}, эффективность ×${(mods.workEfficiencyMultiplier ?? 1).toFixed(2)}) расчёт округляется до 0 ₽/ч — за смену нечего начислить. Развивайте навыки или смените работу с более высокой ставкой.`;
      } else {
        zeroPayReason =
          'По правилам расчёта сумма выплаты за эту смену получилась 0 ₽ при ненулевой ставке — такого обычно не бывает; сохраните игру и проверьте журнал событий.';
      }

      const description = [
        `Вы отработали ${workHours} ч., но на счёт ничего не поступило.`,
        '',
        zeroPayReason,
        statBlock ? `\nИзменения за смену:\n${statBlock}` : '',
        eventLine || '',
        careerLine || '',
        '',
        `Баланс без изменений: ${this.formatMoney(walletAfter)} ₽.`,
      ]
        .filter(Boolean)
        .join('\n');
      return { title: 'Рабочий период завершён', description };
    }

    const description = [
      summaryStr,
      '',
      earned <= 0
        ? 'Деньги не начислены — причина см. выше или в журнале событий.'
        : '',
    ]
      .filter(Boolean)
      .join('\n');
    return { title: 'Рабочий период завершён', description };
  }

  resolveSalaryPerHour(work) {
    if (typeof work?.salaryPerHour === 'number' && work.salaryPerHour > 0) return work.salaryPerHour;
    if (typeof work?.salaryPerDay === 'number' && work.salaryPerDay > 0) return Math.round(work.salaryPerDay / 8);
    if (typeof work?.salaryPerWeek === 'number' && work.salaryPerWeek > 0) return Math.round(work.salaryPerWeek / 40);
    const byId = CAREER_JOBS.find((job) => job.id === work?.id);
    if (byId?.salaryPerHour) return byId.salaryPerHour;
    return 0;
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
    const requiredHoursPerWeek = Math.max(0, Number(work?.requiredHoursPerWeek) || 0);
    const workedHoursCurrentWeek = Math.max(0, Number(work?.workedHoursCurrentWeek) || 0);
    const remainingNorm = Math.max(0, requiredHoursPerWeek - workedHoursCurrentWeek);
    const baseJobLabel = work?.name || 'Безработный';
    const weeklyHoursLabel =
      requiredHoursPerWeek > 0
        ? remainingNorm > 0
          ? ` • Работа на неделе: ${workedHoursCurrentWeek}/${requiredHoursPerWeek} ч (ещё ${remainingNorm} ч до нормы)`
          : ` • Работа на неделе: ${workedHoursCurrentWeek}/${requiredHoursPerWeek} ч (норма закрыта)`
        : '';
    this.jobText.setText(`${baseJobLabel}${weeklyHoursLabel}`);
    this.moneyText.setText(this.formatMoney(wallet?.money || 0) + ' ₽');
    this.timeText.setText(
      `День ${time?.gameDays || 1} • Неделя ${time?.gameWeeks || 1} (${time?.weekHoursRemaining ?? 168} ч. осталось) • ${time?.currentAge || 18} лет`,
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
      const sideW = Math.floor((contentWidth - gap * 2) * 0.35);
      const profileW = sideW;
      const scalesW = sideW;
      const logW = contentWidth - profileW - scalesW - gap * 2;

      const profileX = safeX;
      const logX = profileX + profileW + gap;
      const scalesX = logX + logW + gap;

      this.profileCard.setSize(profileW, topHeight);
      this.profileCard.setPosition(profileX, cursorY);
      this.logCard.setSize(logW, topHeight);
      this.logCard.setPosition(logX, cursorY);
      this.scalesCard.setSize(scalesW, topHeight);
      this.scalesCard.setPosition(scalesX, cursorY);

      this.layoutProfileContent(profileX, cursorY, profileW, topHeight, false);
      this.layoutLogContent(logX, cursorY, logW, topHeight);
      this.layoutScalesContent(scalesX, cursorY, scalesW, topHeight);

      cursorY += topHeight + gap;
    } else {
      const profileH = 186;
      const rowH = 238;
      const logW = Math.floor((contentWidth - gap) / 2);
      const scalesW = contentWidth - logW - gap;

      this.profileCard.setSize(contentWidth, profileH);
      this.profileCard.setPosition(safeX, cursorY);
      this.layoutProfileContent(safeX, cursorY, contentWidth, profileH, true);
      cursorY += profileH + gap;

      this.logCard.setSize(logW, rowH);
      this.logCard.setPosition(safeX, cursorY);
      this.layoutLogContent(safeX, cursorY, logW, rowH);

      this.scalesCard.setSize(scalesW, rowH);
      this.scalesCard.setPosition(safeX + logW + gap, cursorY);
      this.layoutScalesContent(safeX + logW + gap, cursorY, scalesW, rowH);
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

    const toastW = this.toast.widthValue ?? 260;
    const toastX = (w - toastW) / 2;
    const toastY = safeY + 20;
    this.toast.layoutAnchorX = toastX;
    this.toast.layoutAnchorY = toastY;
    this.toast.setPosition(toastX, toastY);
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
    this.timeText.setFontSize(mobile ? 14 : 16);
    this.comfortText.setFontSize(mobile ? 14 : 16);
    this.playerNameText.setPosition(x + pad, y + 18);
    this.jobText.setPosition(x + pad, y + 54);
    this.moneyText.setPosition(x + pad, y + 80);
    if (mobile) {
      this.timeText.setStyle({ wordWrap: { width: Math.max(160, width - pad * 2) } });
      this.timeText.setPosition(x + pad, y + 104);
      this.comfortText.setPosition(x + pad, y + 136);
    } else {
      this.timeText.setStyle({ wordWrap: { width: Math.max(260, width - pad * 2) } });
      this.timeText.setPosition(x + pad, y + 118);
      this.comfortText.setPosition(x + pad, y + 144);
    }

    const buttonY = y + (mobile ? height - 20 : height - 28);
    this.careerButton.resize(112, 34);
    this.skillsButton.resize(112, 34);
    this.careerButton.setPosition(x + pad + 56, buttonY);
    this.skillsButton.setPosition(x + pad + 56 + 124, buttonY);
  }

  layoutLogContent(x, y, width, height) {
    const pad = 14;
    this.logTitle.setPosition(x + pad, y + 14);
    this.logEntriesText.setPosition(x + pad, y + 38);
    const wrapWidth = Math.max(80, width - pad * 2);
    this.logEntriesText.setStyle({ wordWrap: { width: wrapWidth } });
    this.logHintText.setPosition(x + width / 2, y + height - 8);
    if (this.logHitArea) {
      this.logHitArea.setPosition(x, y);
      this.logHitArea.setSize(width, height);
    }
  }

  refreshActivityLog() {
    const activityLogSystem = this.sceneAdapter ? this.sceneAdapter.getSystem('activityLog') : null;
    const entries = activityLogSystem ? activityLogSystem.getRecentEntries(8) : [];

    if (entries.length === 0) {
      this.logEntriesText.setText('Пока нет записей');
    } else {
      const lines = entries.map((entry) => {
        const icon = entry.icon || '•';
        const displayTitle = resolveActivityLogTitle(entry);
        const title = displayTitle.length > 28 ? displayTitle.substring(0, 25) + '…' : displayTitle;
        const day = entry.timestamp?.day ?? '?';
        return `${icon} ${title} · д${day}`;
      });
      this.logEntriesText.setText(lines.join('\n'));
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

    this.homePreviewTitle.setPosition(x + pad, y + 16);

    if (this.homePreviewDom?.node) {
      const domNode = this.homePreviewDom.node;
      domNode.style.width = `${Math.max(1, Math.floor(innerW))}px`;
      domNode.style.height = `${Math.max(1, Math.floor(innerH))}px`;
      domNode.style.borderRadius = '12px';
      domNode.style.overflow = 'hidden';
      this.homePreviewDom.setPosition(innerX, innerY);
      this.homePreviewDom.setVisible(true);
      this.homePreviewHint.setVisible(false);
      this.homePreviewHint2.setVisible(false);
      return;
    }

    // Fallback placeholder if DOM mode is unavailable.
    this.homePreviewGraphics.lineStyle(1, COLORS.neutral, 0.9);
    this.homePreviewGraphics.lineBetween(innerX + 8, innerY + 8, innerX + innerW - 8, innerY + innerH - 8);
    this.homePreviewGraphics.lineBetween(innerX + innerW - 8, innerY + 8, innerX + 8, innerY + innerH - 8);

    const hintMidX = innerX + innerW / 2;
    const hintMidY = innerY + innerH / 2;
    const wrapW = Math.max(160, innerW - 24);
    this.homePreviewHint.setStyle({ align: 'center', wordWrap: { width: wrapW } });
    this.homePreviewHint2.setStyle({ align: 'center', wordWrap: { width: wrapW } });
    this.homePreviewHint.setOrigin(0.5, 0.5);
    this.homePreviewHint2.setOrigin(0.5, 0.5);
    this.homePreviewHint.setPosition(hintMidX, hintMidY - 9);
    this.homePreviewHint2.setPosition(hintMidX, hintMidY + 11);
    this.homePreviewHint.setVisible(true);
    this.homePreviewHint2.setVisible(true);
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
    [this.profileCard, this.logCard, this.scalesCard, this.homePreviewCard, this.actionCard, this.navCard].forEach((item, index) => {
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

  /**
   * Авто-назначить первую доступную работу, если игрок безработный.
   * Использует CareerProgressSystem.changeCareer() для корректного обновления
   * компонентов work и career.
   */
  _ensureInitialJob() {
    const playerId = this.sceneAdapter.getPlayerEntityId();
    const world = this.sceneAdapter.getWorld();
    const work = world.getComponent(playerId, 'work');

    if (work?.id) return; // Уже есть работа

    const save = this.sceneAdapter.getSaveData();
    // Уволенный / осознанно безработный: в сейве есть currentJob с id === null — не подставляем работу автоматически
    if (save?.currentJob?.id === null) return;

    const careerSystem = this.sceneAdapter.getSystem('careerProgress');
    if (!careerSystem) return;

    // Найти первую работу, для которой выполнены требования
    const track = careerSystem.getCareerTrack();
    const firstUnlocked = track.find(job => job.unlocked);

    if (firstUnlocked) {
      careerSystem.changeCareer(firstUnlocked.id);
      this.sceneAdapter.syncToSaveData();
      this.persistenceSystem.saveGame(this.sceneAdapter.getSaveData());
    }
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
