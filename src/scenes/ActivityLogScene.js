import Phaser from 'phaser';
import { SceneAdapter } from '../ecs/adapters/SceneAdapter.js';
import { PersistenceSystem } from '../ecs/systems/PersistenceSystem.js';
import {
  COLORS,
  createRoundedButton,
  createRoundedPanel,
  textStyle,
} from '../ui-kit';

// ─── Константы ────────────────────────────────────────────────────────

const SCENE_BG = 0x1a1a2e;
const PAGE_SIZE = 30;
const LOAD_THRESHOLD = 200;
const CARD_BOTTOM_PAD = 40;

/** Фильтры: метка → тип (null = все) */
const FILTERS = [
  { label: 'Все', type: null },
  { label: 'Действия', type: 'action' },
  { label: 'События', type: 'event' },
  { label: 'Финансы', type: 'finance' },
  { label: 'Карьера', type: 'career' },
  { label: 'Обучение', type: 'education' },
  { label: 'Навыки', type: 'skill_change' },
  { label: 'Время', type: 'time' },
];

/** Цвета фона карточек по типу записи */
const TYPE_COLORS = {
  action: 0x2a3a2a,
  event: 0x3a2a3a,
  finance: 0x3a3a2a,
  career: 0x2a2a3a,
  prevented: 0x3a2a2a,
  education: 0x2a3a3a,
  time: 0x333333,
  stat_change: 0x2d2d2d,
  skill_change: 0x2d2d2d,
  navigation: 0x2d2d2d,
};
const DEFAULT_CARD_COLOR = 0x2d2d2d;

// ─── Сцена ────────────────────────────────────────────────────────────

export class ActivityLogScene extends Phaser.Scene {
  constructor() {
    super('ActivityLogScene');
  }

  // ── Жизненный цикл ────────────────────────────────────────────────

  create() {
    // Загрузка сейва и инициализация ECS
    this.persistenceSystem = new PersistenceSystem();
    const loadedSaveData = this.persistenceSystem.loadSave();
    this.sceneAdapter = new SceneAdapter(this, loadedSaveData);
    this.sceneAdapter.initialize();
    this.persistenceSystem.init(this.sceneAdapter.getWorld());

    this.activityLogSystem = this.sceneAdapter.getSystem('activityLog');

    // Состояние пагинации
    this.activeFilter = null;
    this.currentOffset = 0;
    this.hasMore = true;
    this.isLoading = false;
    this.entryCards = [];

    // Состояние скролла
    this.cardsScrollY = 0;
    this.scrollViewportH = 0;
    this.scrollContentHeight = 0;
    this.scrollViewportRect = { x: 0, y: 0, w: 0, h: 0 };
    this.scrollTouch = { active: false, startY: 0, startScroll: 0, moved: false };

    // UI
    this.cameras.main.setBackgroundColor(SCENE_BG);
    this.root = this.add.container(0, 0);

    this.createHeader();
    this.createFilterBar();
    this.createScrollArea();
    this.createBackButton();

    // Обработчики ввода
    this.scale.on('resize', this.handleResize, this);
    this.input.on('wheel', this.onScrollWheel, this);
    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.handleResize, this);
      this.input.off('wheel', this.onScrollWheel, this);
      this.input.off('pointerdown', this.onPointerDown, this);
      this.input.off('pointermove', this.onPointerMove, this);
      this.input.off('pointerup', this.onPointerUp, this);
    });

    // Первая загрузка записей
    this.loadEntries(true);
    this.handleResize(this.scale.gameSize);
    this.animateEntrance();
  }

  // ── Заголовок ─────────────────────────────────────────────────────

  createHeader() {
    this.headerPanel = createRoundedPanel(this, {
      fillColor: 0x252545,
      lineColor: 0x3a3a5e,
      shadowColor: 0x111122,
      panelAlpha: 1,
      radius: 14,
      shadowAlpha: 0.3,
    });
    this.root.add(this.headerPanel);

    this.headerTitle = this.add.text(0, 0, '📋 Журнал событий', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    this.root.add(this.headerTitle);
  }

  // ── Панель фильтров ───────────────────────────────────────────────

  createFilterBar() {
    this.filterContainer = this.add.container(0, 0);
    this.root.add(this.filterContainer);

    this.filterButtons = [];

    FILTERS.forEach((filter) => {
      const btn = this._createFilterButton(filter);
      this.filterButtons.push(btn);
      this.filterContainer.add(btn.container);
    });

    // Подсветить первый («Все»)
    this._highlightFilter(0);
  }

  _createFilterButton(filter) {
    const container = this.add.container(0, 0);

    const bg = this.add.rectangle(0, 0, 90, 32, 0x333355, 1).setOrigin(0.5);
    bg.setStrokeStyle(1, 0x555577);
    bg.setInteractive({ useHandCursor: true });

    const label = this.add.text(0, 0, filter.label, {
      fontFamily: 'Arial',
      fontSize: '13px',
      color: '#cccccc',
    }).setOrigin(0.5);

    container.add([bg, label]);

    bg.on('pointerdown', () => {
      this._onFilterClick(filter);
    });

    // Hover-эффект
    bg.on('pointerover', () => {
      if (this.activeFilter !== filter.type) {
        bg.setFillStyle(0x444466);
      }
    });
    bg.on('pointerout', () => {
      if (this.activeFilter !== filter.type) {
        bg.setFillStyle(0x333355);
      }
    });

    return { container, bg, label, filter };
  }

  _highlightFilter(activeIndex) {
    this.filterButtons.forEach((btn, i) => {
      if (i === activeIndex) {
        btn.bg.setFillStyle(0x5555aa);
        btn.bg.setStrokeStyle(2, 0x8888dd);
        btn.label.setColor('#ffffff');
      } else {
        btn.bg.setFillStyle(0x333355);
        btn.bg.setStrokeStyle(1, 0x555577);
        btn.label.setColor('#cccccc');
      }
    });
  }

  _onFilterClick(filter) {
    if (this.activeFilter === filter.type) return;
    this.activeFilter = filter.type;

    const idx = FILTERS.findIndex((f) => f.type === filter.type);
    this._highlightFilter(idx);

    // Перезагрузить записи с новым фильтром
    this.loadEntries(true);
  }

  // ── Область скролла ───────────────────────────────────────────────

  createScrollArea() {
    this.scrollPanel = createRoundedPanel(this, {
      fillColor: 0x20203a,
      lineColor: 0x3a3a5e,
      shadowColor: 0x111122,
      panelAlpha: 1,
      radius: 14,
      shadowAlpha: 0.25,
    });
    this.root.add(this.scrollPanel);

    // Маска для обрезки контента
    this.scrollMaskRect = this.add.rectangle(0, 0, 100, 100, 0xffffff, 0)
      .setOrigin(0)
      .setVisible(false);
    this.root.add(this.scrollMaskRect);

    // Контейнер карточек
    this.cardsContainer = this.add.container(0, 0);
    this.cardsContainer.setDepth(2);
    this.cardsContainer.setMask(this.scrollMaskRect.createGeometryMask());
    this.root.add(this.cardsContainer);

    // Сообщение «пусто»
    this.emptyText = this.add.text(0, 0, 'Записей пока нет', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#888888',
    }).setOrigin(0.5);
    this.emptyText.setVisible(false);
    this.root.add(this.emptyText);

    // Индикатор загрузки
    this.loadingText = this.add.text(0, 0, 'Загрузка...', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#888888',
    }).setOrigin(0.5);
    this.loadingText.setVisible(false);
    this.root.add(this.loadingText);
  }

  // ── Кнопка «Назад» ────────────────────────────────────────────────

  createBackButton() {
    this.backButton = createRoundedButton(this, {
      label: '← Назад',
      onClick: () => this.backToMain(),
      fillColor: 0x333355,
      fontSize: 16,
      width: 140,
      height: 44,
    });
    this.root.add(this.backButton);
  }

  backToMain() {
    this.scene.start('MainGameScene');
  }

  // ── Загрузка записей (ленивая пагинация) ──────────────────────────

  loadEntries(reset = false) {
    if (reset) {
      this.currentOffset = 0;
      this.hasMore = true;
      this.cardsScrollY = 0;
      this.entryCards = [];
      this.cardsContainer.removeAll(true);
    }

    if (!this.hasMore && !reset) return;
    if (this.isLoading) return;

    this.isLoading = true;
    this.loadingText.setVisible(true);

    const result = this.activityLogSystem.getEntries({
      offset: this.currentOffset,
      limit: PAGE_SIZE,
      type: this.activeFilter,
    });

    this.isLoading = false;
    this.loadingText.setVisible(false);

    if (reset) {
      this.entryCards = [];
      this.cardsContainer.removeAll(true);
    }

    const { entries, hasMore } = result;
    this.hasMore = hasMore;

    entries.forEach((entry) => {
      const card = this._createEntryCard(entry);
      this.entryCards.push(card);
      this.cardsContainer.add(card.container);
    });

    this.currentOffset += entries.length;

    // Показать/скрыть сообщение «пусто»
    this.emptyText.setVisible(this.entryCards.length === 0);

    // Пересчитать layout
    this._layoutCards();
    this.handleResize(this.scale.gameSize);
  }

  // ── Карточка записи ───────────────────────────────────────────────

  _createEntryCard(entry) {
    const container = this.add.container(0, 0);

    const bgColor = TYPE_COLORS[entry.type] || DEFAULT_CARD_COLOR;
    const bg = this.add.rectangle(0, 0, 100, 60, bgColor, 1).setOrigin(0);
    bg.setStrokeStyle(1, 0x444466);
    container.add(bg);

    // Иконка + заголовок
    const titleStr = entry.title || 'Без заголовка';
    const titleText = this.add.text(12, 10, titleStr, {
      fontFamily: 'Arial',
      fontSize: '15px',
      color: '#ffffff',
      fontStyle: 'bold',
      wordWrap: { width: 660 },
    });
    container.add(titleText);

    // Описание
    const descStr = entry.description || '';
    const descText = this.add.text(12, 0, descStr, {
      fontFamily: 'Arial',
      fontSize: '13px',
      color: '#cccccc',
      wordWrap: { width: 660 },
      lineSpacing: 3,
    });
    container.add(descText);

    // Временная метка
    const ts = entry.timestamp || {};
    const timeStr = `День ${ts.day ?? 0}, ${ts.hour ?? 0}:00 — Возраст ${ts.age ?? 0}`;
    const timeText = this.add.text(12, 0, timeStr, {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: '#888888',
    });
    container.add(timeText);

    return { container, bg, titleText, descText, timeText, entry };
  }

  _measureCardHeight(card, cardW) {
    const padX = 12;
    const innerW = Math.max(120, cardW - padX * 2);
    card.titleText.setWordWrapWidth(innerW);
    card.descText.setWordWrapWidth(innerW);

    let h = 12; // top pad
    h += card.titleText.height + 6;
    h += card.descText.height + 6;
    h += card.timeText.height + 10; // bottom pad
    return Math.max(60, h);
  }

  _layoutCard(card, left, top, cardW) {
    const padX = 12;
    const innerW = Math.max(120, cardW - padX * 2);

    const cardH = this._measureCardHeight(card, cardW);
    card.bg.setSize(cardW, cardH);

    card.container.setPosition(left, top);

    card.titleText.setPosition(padX, 10);
    card.titleText.setWordWrapWidth(innerW);

    let y = 10 + card.titleText.height + 6;
    card.descText.setPosition(padX, y);
    card.descText.setWordWrapWidth(innerW);

    y += card.descText.height + 6;
    card.timeText.setPosition(padX, y);
  }

  _layoutCards() {
    if (this.entryCards.length === 0) {
      this.scrollContentHeight = 0;
      return;
    }

    const cardW = this._getCardWidth();
    const gap = 10;
    let y = 0;

    this.entryCards.forEach((card) => {
      this._layoutCard(card, 0, y, cardW);
      const h = this._measureCardHeight(card, cardW);
      y += h + gap;
    });

    this.scrollContentHeight = y + CARD_BOTTOM_PAD;
  }

  _getCardWidth() {
    const w = this.scale.gameSize.width;
    return Math.floor(w * 0.9);
  }

  // ── Скролл: wheel ─────────────────────────────────────────────────

  onScrollWheel(pointer, _go, _dx, dy, _dz, event) {
    if (!this.scrollViewportRect?.h) return;
    if (!this._isPointerInViewport(pointer)) return;
    if (event) event.preventDefault?.();

    const delta =
      typeof event?.deltaY === 'number'
        ? event.deltaY
        : typeof dy === 'number'
          ? dy
          : 0;
    if (delta === 0) return;

    this.cardsScrollY -= delta * 0.45;
    this._clampScroll();
    this._applyScrollPosition();
    this._checkLoadMore();
  }

  // ── Скролл: pointer (drag) ────────────────────────────────────────

  onPointerDown(pointer) {
    const touchLike = pointer.pointerType === 'touch' || pointer.wasTouch === true;
    if (!touchLike || !this._isPointerInViewport(pointer)) return;
    this.scrollTouch.active = true;
    this.scrollTouch.startY = pointer.y;
    this.scrollTouch.startScroll = this.cardsScrollY;
    this.scrollTouch.moved = false;
  }

  onPointerMove(pointer) {
    if (!this.scrollTouch.active || !pointer.isDown) return;
    if (!this._isPointerInViewport(pointer)) return;
    const dy = pointer.y - this.scrollTouch.startY;
    if (Math.abs(dy) > 6) this.scrollTouch.moved = true;
    if (this.scrollTouch.moved) {
      this.cardsScrollY = this.scrollTouch.startScroll + dy;
      this._clampScroll();
      this._applyScrollPosition();
      this._checkLoadMore();
    }
  }

  onPointerUp() {
    this.scrollTouch.active = false;
  }

  // ── Скролл: утилиты ───────────────────────────────────────────────

  _isPointerInViewport(pointer) {
    const r = this.scrollViewportRect;
    if (!r || r.w <= 0 || r.h <= 0) return false;
    const x = pointer.worldX;
    const y = pointer.worldY;
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }

  _clampScroll() {
    const maxScroll = Math.min(0, this.scrollViewportH - this.scrollContentHeight);
    this.cardsScrollY = Phaser.Math.Clamp(this.cardsScrollY, maxScroll, 0);
  }

  _applyScrollPosition() {
    const innerPad = 10;
    this.cardsContainer.setPosition(
      this.scrollPanel.x + innerPad,
      this.scrollPanel.y + innerPad + this.cardsScrollY
    );
  }

  _checkLoadMore() {
    if (!this.hasMore || this.isLoading) return;
    if (this.entryCards.length === 0) return;

    // Если прокрутили достаточно близко к концу — подгрузить
    const distanceToBottom = this.scrollContentHeight + this.cardsScrollY - this.scrollViewportH;
    if (distanceToBottom < LOAD_THRESHOLD) {
      this.loadEntries(false);
    }
  }

  // ── Resize ────────────────────────────────────────────────────────

  handleResize(gameSize) {
    const w = gameSize.width;
    const h = gameSize.height;
    const safeX = Math.max(16, Math.floor(w * 0.03));
    const maxW = Math.min(920, w - safeX * 2);

    // Заголовок
    this.headerPanel.setSize(maxW, 56);
    this.headerPanel.setPosition((w - maxW) / 2, safeX);
    this.headerTitle.setPosition(this.headerPanel.x + 20, this.headerPanel.y + 14);

    // Панель фильтров
    const filterTop = this.headerPanel.y + this.headerPanel.height + 8;
    this.filterContainer.setPosition((w - maxW) / 2 + 8, filterTop);
    this._layoutFilterButtons(maxW - 16);

    // Область скролла
    const scrollTop = filterTop + 44;
    const bottomReserve = 70;
    const scrollH = Math.max(200, h - scrollTop - bottomReserve);
    this.scrollPanel.setSize(maxW, scrollH);
    this.scrollPanel.setPosition((w - maxW) / 2, scrollTop);

    // Маска скролла
    const innerPad = 10;
    this.scrollMaskRect.setPosition(
      this.scrollPanel.x + innerPad,
      this.scrollPanel.y + innerPad
    );
    this.scrollMaskRect.setSize(maxW - innerPad * 2, scrollH - innerPad * 2);
    this.scrollViewportRect = {
      x: this.scrollPanel.x + innerPad,
      y: this.scrollPanel.y + innerPad,
      w: maxW - innerPad * 2,
      h: scrollH - innerPad * 2,
    };
    this.scrollViewportH = scrollH - innerPad * 2;

    // Пересчитать карточки
    this._layoutCards();
    this._clampScroll();
    this._applyScrollPosition();

    // Сообщение «пусто»
    this.emptyText.setPosition(
      this.scrollPanel.x + this.scrollPanel.width / 2,
      this.scrollPanel.y + this.scrollPanel.height / 2
    );

    // Индикатор загрузки
    this.loadingText.setPosition(
      this.scrollPanel.x + this.scrollPanel.width / 2,
      this.scrollPanel.y + this.scrollPanel.height - 20
    );

    // Кнопка «Назад»
    this.backButton.setPosition(w / 2, h - safeX - 28);
  }

  _layoutFilterButtons(maxW) {
    let x = 0;
    const gap = 6;

    this.filterButtons.forEach((btn) => {
      const labelWidth = btn.label.width + 20;
      const btnW = Math.max(60, Math.min(labelWidth, 110));
      btn.bg.setSize(btnW, 32);
      btn.container.setPosition(x, 0);
      x += btnW + gap;
    });
  }

  // ── Анимация появления ────────────────────────────────────────────

  animateEntrance() {
    this.headerPanel.alpha = 0;
    this.filterContainer.alpha = 0;
    this.scrollPanel.alpha = 0;
    this.backButton.alpha = 0;

    this.tweens.add({
      targets: this.headerPanel,
      alpha: 1,
      duration: 300,
      ease: 'Cubic.easeOut',
    });

    this.tweens.add({
      targets: this.filterContainer,
      alpha: 1,
      duration: 400,
      delay: 80,
      ease: 'Cubic.easeOut',
    });

    this.tweens.add({
      targets: this.scrollPanel,
      alpha: 1,
      duration: 500,
      delay: 160,
      ease: 'Cubic.easeOut',
    });

    this.tweens.add({
      targets: this.backButton,
      alpha: 1,
      duration: 300,
      delay: 300,
      ease: 'Cubic.easeOut',
    });
  }
}

export default ActivityLogScene;
