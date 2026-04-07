import Phaser from "phaser";
import "./style.css";
import {
  applyFinanceActionToSave,
  applyPeriodEventChoiceToSave,
  applyQueuedEventChoice,
  applyRecoveryActionToSave,
  applyWorkOutcomeToSave,
  applyWorkPeriodResult,
  advanceEducationCourseDay,
  buildWorkOutcome,
  canStartEducationProgram,
  collectInvestmentToSave,
  consumePendingEvent,
  getFinanceActions,
  getFinanceOverview,
  getCareerTrack,
  getHousingOverview,
  EDUCATION_PROGRAMS,
  formatMoney,
  loadSave,
  parseSchedule,
  pickWorkPeriodEvent,
  persistSave,
  RECOVERY_TABS,
  startEducationProgram,
  validateRecoveryAction,
} from "./game-state";
import {
  COLORS,
  createEventModal,
  createNotificationModal,
  createRoundedButton,
  createRoundedPanel,
  createToastMessage,
  textStyle,
} from "./ui-kit";
// import { DebugPanelScene, ensureDebugPanel } from "./debug-panel"; // Temporarily disabled

const STAT_DEFS = [
  { key: "hunger", label: "Голод", startColor: "#FF9F6B", endColor: "#FF6B6B" },
  { key: "energy", label: "Энергия", startColor: "#6D9DC5", endColor: "#4A7C9E" },
  { key: "stress", label: "Стресс", startColor: "#E87D7D", endColor: "#D14D4D" },
  { key: "mood", label: "Настроение", startColor: "#F4D95F", endColor: "#E8B94A" },
  { key: "health", label: "Здоровье", startColor: "#7ED9A0", endColor: "#4EBF7A" },
  { key: "physical", label: "Форма", startColor: "#A8CABA", endColor: "#6FAE91" },
];

const NAV_ITEMS = [
  { id: "home", icon: "Д", label: "Дом" },
  { id: "shop", icon: "М", label: "Магазин" },
  { id: "fun", icon: "Р", label: "Развлеч." },
  { id: "education", icon: "О", label: "Обучение" },
  { id: "social", icon: "С", label: "Соц. жизнь" },
  { id: "finance", icon: "Ф", label: "Финансы" },
];

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
    this.label = scene.add.text(0, 0, config.label, textStyle(18, COLORS.text, "600"));
    this.label.setOrigin(0, 0.5);

    this.valueText = scene.add.text(width, 0, "0%", textStyle(16, COLORS.text, "600"));
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
      ease: "Cubic.easeOut",
      onUpdate: (tween) => {
        this.redraw(tween.getValue());
      },
      onComplete: () => {
        this.value = target;
      },
    });
  }

  redraw(value) {
    this.value = Phaser.Math.Clamp(value, 0, 100);
    const top = 22;
    const radius = 8;
    const filledWidth = Math.max(18, (this.width * this.value) / 100);
    const color = mixHex(this.config.startColor, this.config.endColor, 1 - this.value / 100);

    this.valueText.setText(`${Math.round(this.value)}%`);
    this.valueText.setX(this.width);

    this.track.clear();
    this.track.fillStyle(COLORS.neutral, 0.55);
    this.track.fillRoundedRect(0, top, this.width, this.height, radius);

    this.fill.clear();
    this.fill.fillStyle(color, 1);
    this.fill.fillRoundedRect(0, top, filledWidth, this.height, radius);
  }
}

class MainGameScene extends Phaser.Scene {
  constructor() {
    super("MainGameScene");
    this.statBars = [];
  }

  create() {
    this.saveData = loadSave();
    this.registry.set("saveData", this.saveData);

    this.cameras.main.setBackgroundColor(COLORS.background);

    this.backgroundDecor = this.add.graphics();
    this.root = this.add.container(0, 0);

    this.topCard = this.createCard();
    this.characterCard = this.createCard();
    this.actionCard = this.createCard();
    this.navCard = this.createCard();

    this.root.add([this.topCard, this.characterCard, this.actionCard, this.navCard]);

    this.playerNameText = this.add.text(0, 0, "", textStyle(28, COLORS.text, "700"));
    this.jobText = this.add.text(0, 0, "", textStyle(16, COLORS.text, "500"));
    this.moneyText = this.add.text(0, 0, "", textStyle(26, COLORS.text, "700"));
    this.timeText = this.add.text(0, 0, "", textStyle(16, COLORS.text, "500"));
    this.comfortText = this.add.text(0, 0, "", textStyle(16, COLORS.text, "500"));
    this.careerButton = createRoundedButton(this, {
      label: "Карьера",
      onClick: () => this.scene.start("CareerScene"),
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

    this.sectionTitle = this.add.text(0, 0, "Состояние персонажа", textStyle(18, COLORS.text, "700"));
    this.root.add(this.sectionTitle);

    this.createStats();
    this.createActionButton();
    this.createNavigation();
    this.createToast();
    this.createSceneModals();
    this.refreshTexts();

    this.scale.on("resize", this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off("resize", this.handleResize, this);
    });

    this.handleResize(this.scale.gameSize);
    this.animateEntrance();
    ensureEventQueue(this, 520);
    // ensureDebugPanel(this.game);  // Temporarily disabled
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

    const caption = this.add.text(0, 214, "Текущий рабочий настрой", textStyle(16, COLORS.text, "600"));
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
      label: "Пойти на работу",
      onClick: () => this.showWorkPeriodModal(),
      fillColor: COLORS.accent,
      fontSize: 22,
    });
    this.actionButton.text.setY(-10);
    this.actionButton.subtitle = this.add.text(0, 16, "обменять свое здоровье на деньги", textStyle(14, COLORS.text, "500"));
    this.actionButton.subtitle.setOrigin(0.5);
    this.actionButton.add(this.actionButton.subtitle);
    this.root.add(this.actionButton);
  }

  createNavigation() {
    this.navButtons = NAV_ITEMS.map((item) => {
      const container = this.add.container(0, 0);
      const dot = this.add.circle(0, -10, 21, item.id === "home" ? COLORS.accent : COLORS.accentSoft, 1);
      const icon = this.add.text(0, -10, item.icon, textStyle(18, COLORS.text, "700"));
      icon.setOrigin(0.5);
      const label = this.add.text(0, 24, item.label, textStyle(12, COLORS.text, "600"));
      label.setOrigin(0.5);
      const hit = this.add.circle(0, 8, 34, 0x000000, 0);

      hit.setInteractive({ useHandCursor: true });
      hit.on("pointerover", () => this.tweens.add({ targets: container, y: container.y - 4, duration: 180 }));
      hit.on("pointerout", () => this.tweens.add({ targets: container, y: container.baseY, duration: 180 }));
      hit.on("pointerup", () => {
        if (item.id === "education") {
          this.scene.start("EducationScene");
          return;
        }

        if (item.id === "finance") {
          this.scene.start("FinanceScene");
          return;
        }

        if (item.id === "home") {
          this.scene.start("HomeScene");
          return;
        }

        if (item.id === "shop") {
          this.scene.start("ShopScene");
          return;
        }

        if (item.id === "social") {
          this.scene.start("SocialScene");
          return;
        }

        if (item.id === "fun") {
          this.scene.start("FunScene");
          return;
        }

        this.scene.start("RecoveryScene", { initialTab: item.id });
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
      primaryLabel: "Начать",
      secondaryLabel: "Позже",
    });
    this.notificationModal = createNotificationModal(this, {
      primaryLabel: "Понятно",
      secondaryLabel: "Закрыть",
    });
    this.root.add([this.workPeriodModal, this.notificationModal]);
  }

  showToast(message) {
    this.toast.show(message);
  }

  showWorkPeriodModal() {
    const { currentJob } = this.saveData;
    const { workDays } = parseSchedule(currentJob.schedule);
    this.workPeriodModal.show({
      title: "Начать рабочий период",
      description: `${currentJob.name} • график ${currentJob.schedule}\n\nРабочий период: ${workDays} дн.\n\nШанс сценарного события: 15%. Если событие не сработает, результат будет применён сразу.`,
      accentColor: COLORS.accent,
      primaryLabel: "Начать",
      secondaryLabel: "Позже",
      onPrimary: () => this.startWorkPeriod(),
    });
  }

  startWorkPeriod() {
    const { workDays } = parseSchedule(this.saveData.currentJob.schedule);
    const event = pickWorkPeriodEvent(this.saveData);

    if (event) {
      this.scene.start("WorkEventScene", { mode: "event_only", event, workDays });
    } else {
      this.applyWorkPeriodResult(workDays);
    }
  }

  applyWorkPeriodResult(workDays) {
    const summary = applyWorkPeriodResult(this.saveData, workDays);
    persistSave(this, this.saveData);
    this.scene.start("RecoveryScene", {
      initialTab: "shop",
      entrySummary: summary,
    });
  }

  showNotificationModal(title, description) {
    this.notificationModal.show({
      title,
      description,
      accentColor: COLORS.blue,
      primaryLabel: "Понятно",
      secondaryLabel: "Закрыть",
    });
  }

  onExternalStateChange() {
    this.saveData = this.registry.get("saveData") ?? this.saveData;
    this.refreshTexts();
  }

  refreshTexts() {
    const { playerName, currentAge, gameDays, gameWeeks, money, currentJob, housing } = this.saveData;
    this.playerNameText.setText(`${playerName}, ${currentAge} лет`);
    this.jobText.setText(`${currentJob.name} • график ${currentJob.schedule}`);
    this.moneyText.setText(`${formatMoney(money)} ₽`);
    this.timeText.setText(`День ${gameDays} • Неделя ${gameWeeks}`);
    this.comfortText.setText(`Дом: ${housing.name} • комфорт ${housing.comfort}%`);

    this.statBars.forEach((bar) => {
      bar.animateTo(this.saveData.stats[bar.config.key]);
    });
  }

  animateEntrance() {
    const animated = [
      this.topCard,
      this.characterCard,
      this.actionCard,
      this.navCard,
      this.character.container,
      this.actionButton,
      this.careerButton,
    ];

    animated.forEach((item, index) => {
      item.setAlpha(0);
      item.y += 18;
      this.tweens.add({
        targets: item,
        alpha: 1,
        y: item.y - 18,
        duration: 420,
        delay: index * 70,
        ease: "Cubic.easeOut",
      });
    });
  }

  handleResize(gameSize) {
    // Получаем размеры экрана
    const width = gameSize.width;           // Ширина экрана
    const height = gameSize.height;         // Высота экрана
    
    // Определяем тип устройства
    const isMobile = width < 900;          // Мобильное устройство
    const isNarrow = width < 700;          // Очень узкий экран
    
    // Вычисляем безопасные отступы от краёв
    const safeX = Math.max(24, width * 0.04);    // Отступ слева и справа (минимум 24px)
    const safeY = Math.max(24, height * 0.04);  // Отступ сверху и снизу (минимум 24px)
    
    // Вычисляем ширину контента
    const contentWidth = width - safeX * 2;  // Ширина за вычетом боковых отступов
    
    // Вычисляем высоту компонентов
    const hudHeight = isMobile ? (isNarrow ? 195 : 177) : 162; // Верхняя карточка с информацией (увеличена в 1.5 раза)
    const navHeight = 116;             // Нижняя панель навигации
    const buttonHeight = 110;           // Высота кнопки действия
    
    // Вычисляем границы контента с отступами между плашками
    const contentTop = safeY + hudHeight + 10;                     // Верхняя граница контента (отступ между topCard и characterCard = 10px)
    const contentBottom = height - safeY - navHeight - buttonHeight - 36; // Нижняя граница контента (отступ между actionCard и navCard = 10px, плюс 26px между characterCard и actionCard)
    const contentHeight = Math.max(360, contentBottom - contentTop);     // Высота контента (минимум 360px)
    
    // Вычисляем ширину колонок для десктопа
    const leftWidth = isMobile ? contentWidth : Math.min(360, contentWidth * 0.37);   // Левая колонка (персонаж)
    const rightWidth = isMobile ? contentWidth : contentWidth - leftWidth - 20;         // Правая колонка (шкалы)

    // Настраиваем размер шрифтов для узких экранов
    if (isNarrow) {
      this.playerNameText.setFontSize(22);   // Уменьшаем имя игрока
      this.moneyText.setFontSize(20);        // Уменьшаем размер текста денег
      this.comfortText.setFontSize(14);      // Уменьшаем размер текста комфорта
    } else {
      this.playerNameText.setFontSize(28);   // Обычный размер имени игрока
      this.moneyText.setFontSize(26);        // Обычный размер текста денег
      this.comfortText.setFontSize(16);      // Обычный размер текста комфорта
    }

    // Рисуем фоновые элементы
    this.drawBackground(width, height);

    // Настраиваем размеры и позиции карточек с отступами между плашками
    resizeCard(this.topCard, safeX, safeY, contentWidth, hudHeight);         // Верхняя карточка (информация об игроке)
    resizeCard(this.navCard, safeX, height - safeY - navHeight, contentWidth, navHeight); // Нижняя панель навигации (без отступа снизу)
    resizeCard(this.actionCard, safeX, height - safeY - navHeight - 10 - buttonHeight, contentWidth, buttonHeight); // Кнопка действия (отступ между actionCard и navCard = 10px)

    if (isMobile) {
      resizeCard(this.characterCard, safeX, contentTop, contentWidth, contentHeight * 0.42);
      this.layoutMobile(safeX, contentTop, contentWidth, contentHeight);
    } else {
      resizeCard(this.characterCard, safeX, contentTop, leftWidth, contentHeight);
      this.layoutDesktop(safeX, contentTop, leftWidth, rightWidth, contentHeight);
    }

    this.layoutTopCard(safeX, safeY, contentWidth, hudHeight);
    this.layoutActionCard(safeX, height - safeY - navHeight - 16 - buttonHeight, contentWidth, buttonHeight); // Отступ между characterCard и actionCard = 26px (увеличен на 6px)
    this.layoutNavCard(safeX, height - safeY - navHeight, contentWidth, navHeight); // Отступ между actionCard и navCard = 10px

    this.toast.setPosition(width - safeX - 220, safeY + hudHeight + 14);
    this.workPeriodModal.resize(this.scale.gameSize);
    this.notificationModal.resize(this.scale.gameSize);
  }

  layoutTopCard(x, y, width, height) {
    // Позиционируем тексты слева (имя игрока и работа)
    this.playerNameText.setPosition(x + 24, y + 30);  // Имя игрока в левом верхнем углу
    this.jobText.setPosition(x + 24, y + 70);         // Работа под именем игрока

    // Определяем тип экрана и вычисляем отступы справа
    const isMobile = width < 700;                      // Мобильный экран (узкий)
    const rightMargin = isMobile ? 16 : 28;           // Отступ справа зависит от типа экрана
    const textRightX = x + width - rightMargin;       // Правая граница для текстов
    
    // Позиционируем тексты справа (деньги, время, комфорт)
    this.moneyText.setPosition(textRightX, y + 28).setOrigin(1, 0);     // Деньги в правом верхнем углу
    this.timeText.setPosition(textRightX, y + 64).setOrigin(1, 0);      // Время под деньгами
    this.comfortText.setPosition(textRightX, y + 86).setOrigin(1, 0);   // Комфорт под временем
    
    // Позиционируем кнопку карьеры в начале плашки, сразу под работой пользователя
    if (isMobile) {
      // На мобильном: кнопка под работой пользователя, по центру
      this.careerButton.resize(100, 32);
      this.careerButton.setPosition(x + width / 2, y + 95); // По центру, под работой
    } else {
      // На десктопе: кнопка под работой пользователя, слева
      this.careerButton.resize(112, 36);
      this.careerButton.setPosition(x + 78, y + 120); // Слева, под работой
    }
  }

  layoutDesktop(x, y, leftWidth, rightWidth, contentHeight) {
    this.character.container.setPosition(x + leftWidth / 2, y + 132);
    this.character.caption.setText("Текущий рабочий настрой");

    const rightX = x + leftWidth + 20;
    const titleY = y + 22;
    this.sectionTitle.setPosition(rightX, titleY);

    const statWidth = rightWidth;
    const startY = titleY + 40;
    const gap = 58;

    this.statBars.forEach((bar, index) => {
      bar.setPosition(rightX, startY + index * gap, statWidth);
    });
  }

  layoutMobile(x, y, width, contentHeight) {
    const topCardHeight = this.characterCard.cardHeight;
    this.character.container.setPosition(x + width / 2, y + topCardHeight / 2 - 18);
    this.character.caption.setText("Баланс между работой и жизнью");

    const titleY = y + topCardHeight + 18;
    this.sectionTitle.setPosition(x, titleY);

    const startY = titleY + 40;
    const gap = 54;
    const statWidth = width;

    this.statBars.forEach((bar, index) => {
      bar.setPosition(x, startY + index * gap, statWidth);
    });
  }

  layoutActionCard(x, y, width, height) {
    const buttonWidth = Math.min(560, width - 28);
    const buttonHeight = 72;
    this.resizeActionButton(buttonWidth, buttonHeight);
    this.actionButton.setPosition(x + width / 2, y + height / 2 + 6);
  }

  resizeActionButton(width, height) {
    this.actionButton.resize(width, height, COLORS.accent);
    this.actionButton.text.setFontSize(width < 420 ? 18 : 22);
    this.actionButton.subtitle.setFontSize(width < 420 ? 12 : 14);
  }

  layoutNavCard(x, y, width, height) {
    const sectionWidth = width / NAV_ITEMS.length;
    this.navButtons.forEach((button, index) => {
      const centerX = x + sectionWidth * index + sectionWidth / 2;
      const centerY = y + height / 2 + 6;
      button.baseY = centerY;
      button.setPosition(centerX, centerY);
    });
  }

  drawBackground(width, height) {
    this.backgroundDecor.clear();
    this.backgroundDecor.fillStyle(COLORS.accent, 0.14);
    this.backgroundDecor.fillCircle(width * 0.84, height * 0.16, Math.min(width, height) * 0.14);
    this.backgroundDecor.fillStyle(COLORS.sage, 0.16);
    this.backgroundDecor.fillCircle(width * 0.14, height * 0.8, Math.min(width, height) * 0.18);
    this.backgroundDecor.fillStyle(COLORS.blue, 0.08);
    this.backgroundDecor.fillEllipse(width * 0.5, height * 0.94, width * 0.72, height * 0.22);
  }
}

class RecoveryScene extends Phaser.Scene {
  constructor() {
    super("RecoveryScene");
  }

  create(data = {}) {
    this.saveData = this.registry.get("saveData") ?? loadSave();
    this.activeTabId = data.initialTab ?? "home";
    this.entrySummary = data.entrySummary ?? null;
    this.cards = [];
    this.tabButtons = [];

    this.cameras.main.setBackgroundColor(COLORS.background);

    this.background = this.add.graphics();
    this.root = this.add.container(0, 0);

    this.headerCard = this.createPanel();
    this.tabsCard = this.createPanel();
    this.contentCard = this.createPanel();
    this.footerCard = this.createPanel();
    this.root.add([this.headerCard, this.tabsCard, this.contentCard, this.footerCard]);

    this.titleText = this.add.text(0, 0, "Фаза восстановления", textStyle(30, COLORS.text, "700"));
    this.subtitleText = this.add.text(0, 0, "", { ...textStyle(16, COLORS.text, "500"), wordWrap: { width: 320 } });
    this.moneyText = this.add.text(0, 0, "", textStyle(24, COLORS.text, "700"));
    this.metaText = this.add.text(0, 0, "", textStyle(15, COLORS.text, "500"));
    this.roomText = this.add.text(0, 0, "", textStyle(15, COLORS.text, "600"));
    this.root.add([this.titleText, this.subtitleText, this.moneyText, this.metaText, this.roomText]);

    this.roomIllustration = this.createRoomIllustration();
    this.root.add(this.roomIllustration);

    this.tabRow = this.add.container(0, 0);
    this.contentGroup = this.add.container(0, 0);
    this.contentScroll = createVerticalScrollController(this, this.contentGroup);
    this.footerButton = this.createFooterButton();
    this.actionModal = createEventModal(this, {
      width: 360,
      height: 430,
      primaryLabel: "Применить",
      secondaryLabel: "Отмена",
    });
    this.feedbackModal = createNotificationModal(this, {
      primaryLabel: "На главный экран",
      secondaryLabel: "Остаться",
    });
    this.root.add([this.tabRow, this.contentGroup, this.footerButton, this.actionModal, this.feedbackModal]);

    this.buildTabs();
    this.scale.on("resize", this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off("resize", this.handleResize, this);
    });

    this.handleResize(this.scale.gameSize);
    this.renderActiveTab(false);
    this.animateRecoveryIntro();
    ensureEventQueue(this, this.entrySummary ? 900 : 520);

    if (this.entrySummary) {
      this.time.delayedCall(420, () => {
        this.feedbackModal.show({
          title: "Рабочий период завершён",
          description: this.entrySummary,
          accentColor: COLORS.blue,
          primaryLabel: "На главный экран",
          secondaryLabel: "Остаться",
          onPrimary: () => this.scene.start("MainGameScene"),
        });
      });
    }
  }

  createPanel() {
    return createRoundedPanel(this, { panelAlpha: 0.96, radius: 22, shadowAlpha: 0.2 });
  }

  createRoomIllustration() {
    const container = this.add.container(0, 0);
    const art = this.add.graphics();
    container.art = art;
    container.add(art);
    return container;
  }

  drawRoom(width, height) {
    const art = this.roomIllustration.art;
    const comfortRatio = Phaser.Math.Clamp(this.saveData.housing.comfort / 100, 0, 1);
    const wall = COLORS.background;
    const floor = COLORS.neutral;

    art.clear();
    art.fillStyle(wall, 1);
    art.fillRoundedRect(0, 0, width, height, 24);
    art.fillStyle(floor, 0.8);
    art.fillRoundedRect(0, height * 0.62, width, height * 0.38, 24);
    art.fillStyle(COLORS.accent, 0.18 + comfortRatio * 0.08);
    art.fillCircle(width * 0.78, height * 0.28, Math.min(width, height) * 0.16);

    art.fillStyle(COLORS.white, 1);
    art.fillRoundedRect(width * 0.1, height * 0.18, width * 0.24, height * 0.22, 18);
    art.lineStyle(3, COLORS.line, 1);
    art.strokeRoundedRect(width * 0.1, height * 0.18, width * 0.24, height * 0.22, 18);
    art.lineBetween(width * 0.22, height * 0.18, width * 0.22, height * 0.4);
    art.lineBetween(width * 0.1, height * 0.29, width * 0.34, height * 0.29);

    art.fillStyle(COLORS.sage, 0.95);
    art.fillRoundedRect(width * 0.12, height * 0.56, width * 0.24, height * 0.1, 18);
    art.fillStyle(COLORS.accent, 0.95);
    art.fillRoundedRect(width * 0.44, height * 0.46, width * 0.36, height * 0.18, 22);
    art.fillStyle(COLORS.text, 0.08);
    art.fillRoundedRect(width * 0.48, height * 0.5, width * 0.28, height * 0.1, 18);

    art.fillStyle(COLORS.sage, 0.95);
    art.fillRoundedRect(width * 0.82, height * 0.34, width * 0.08, height * 0.28, 18);
    art.fillStyle(COLORS.accentSoft, 1);
    art.fillCircle(width * 0.86, height * 0.28, width * 0.06);

    if (comfortRatio > 0.3) {
      art.fillStyle(COLORS.blue, 0.88);
      art.fillRoundedRect(width * 0.56, height * 0.3, width * 0.12, height * 0.08, 14);
    }

    if (comfortRatio > 0.55) {
      art.fillStyle(COLORS.accent, 0.9);
      art.fillCircle(width * 0.32, height * 0.48, width * 0.035);
      art.fillStyle(COLORS.sage, 0.95);
      art.fillRoundedRect(width * 0.29, height * 0.49, width * 0.06, height * 0.1, 10);
    }
  }

  createFooterButton() {
    return createRoundedButton(this, {
      label: "Вернуться на главный экран",
      fillColor: COLORS.accent,
      fontSize: 19,
      onClick: () => this.scene.start("MainGameScene"),
    });
  }

  buildTabs() {
    RECOVERY_TABS.forEach((tab) => {
      const tabAccent = COLORS[tab.accentKey];
      const container = this.add.container(0, 0);
      const bg = this.add.graphics();
      const iconBg = this.add.circle(0, 0, 16, tabAccent, 1);
      const icon = this.add.text(0, 0, tab.icon, textStyle(14, COLORS.text, "700")).setOrigin(0.5);
      const label = this.add.text(0, 30, tab.label, textStyle(12, COLORS.text, "600")).setOrigin(0.5);
      const hit = this.add.rectangle(0, 12, 84, 68, 0x000000, 0).setOrigin(0.5);

      hit.setInteractive({ useHandCursor: true });
      hit.on("pointerup", () => {
        if (this.activeTabId === tab.id) {
          return;
        }

        this.activeTabId = tab.id;
        this.renderActiveTab(true);
      });

      container.bg = bg;
      container.iconBg = iconBg;
      container.label = label;
      container.tab = tab;
      container.tabAccent = tabAccent;
      container.add([bg, iconBg, icon, label, hit]);
      this.tabButtons.push(container);
      this.tabRow.add(container);
    });
  }

  renderActiveTab(animated = true) {
    const activeTab = RECOVERY_TABS.find((tab) => tab.id === this.activeTabId) ?? RECOVERY_TABS[0];
    this.cards.forEach((card) => card.destroy());
    this.cards = [];
    this.contentScroll.reset();

    this.subtitleText.setText(activeTab.subtitle);
    this.contentTitle.setText(activeTab.title);

    this.tabButtons.forEach((button) => {
        const isActive = button.tab.id === activeTab.id;
        button.bg.clear();
        if (isActive) {
          button.bg.fillStyle(button.tabAccent, 0.18);
          button.bg.fillRoundedRect(-44, -22, 88, 72, 18);
        }
        button.iconBg.setFillStyle(isActive ? button.tabAccent : COLORS.accentSoft, 1);
        button.label.setStyle(textStyle(12, COLORS.text, isActive ? "700" : "600"));
      });

    const metrics = this.contentMetrics;
    if (!metrics) {
      return;
    }

    activeTab.cards.forEach((cardData, index) => {
      const card = this.createActionCard(cardData, activeTab, index);
      const row = Math.floor(index / metrics.columns);
      const column = index % metrics.columns;
      const x = column * (metrics.cardWidth + metrics.gap);
      const y = row * (metrics.cardHeight + metrics.gap);
      card.setPosition(x, y);
      this.contentGroup.add(card);
      this.cards.push(card);

      if (animated) {
        card.setAlpha(0);
        card.y += 14;
        this.tweens.add({
          targets: card,
          alpha: 1,
          y: card.y - 14,
          duration: 360,
          delay: index * 70,
          ease: "Cubic.easeOut",
        });
      }
    });

    const rows = Math.ceil(activeTab.cards.length / metrics.columns);
    const totalHeight = rows * metrics.cardHeight + Math.max(0, rows - 1) * metrics.gap;
    this.contentScroll.setContentHeight(totalHeight);
  }

  showActionModal(cardData, tab) {
    if (tab.id === "education") {
      const programId = getEducationProgramIdFromCard(cardData.title);
      this.scene.start("EducationScene", {
        selectedProgramId: programId,
      });
      return;
    }

    const availability = validateRecoveryAction(this.saveData, cardData);
    if (!availability.ok) {
      this.feedbackModal.show({
        title: cardData.title,
        description: availability.reason,
        accentColor: COLORS[tab.accentKey],
        primaryLabel: "Понятно",
        secondaryLabel: "Закрыть",
      });
      return;
    }

    this.actionModal.show({
      title: cardData.title,
      description: `${cardData.effect}\n\n${cardData.mood}\n\nСтоимость: ${formatMoney(cardData.price)} ₽ • Время: ${cardData.dayCost} д.`,
      accentColor: COLORS[tab.accentKey],
      primaryLabel: "Применить",
      secondaryLabel: "Отмена",
      onPrimary: () => this.applyRecoveryAction(cardData, tab),
    });
  }

  applyRecoveryAction(cardData, tab) {
    const summary = applyRecoveryActionToSave(this.saveData, cardData);
    persistSave(this, this.saveData);
    this.actionModal.hide();
    this.renderActiveTab(false);
    this.handleResize(this.scale.gameSize);

    this.feedbackModal.show({
      title: `${cardData.title} выполнено`,
      description: summary,
      accentColor: COLORS[tab.accentKey],
      primaryLabel: "На главный экран",
      secondaryLabel: "Остаться",
      onPrimary: () => this.scene.start("MainGameScene"),
    });
  }

  onExternalStateChange() {
    this.saveData = this.registry.get("saveData") ?? this.saveData;
    this.handleResize(this.scale.gameSize);
  }

  createActionCard(cardData, tab, index) {
    const container = this.add.container(0, 0);
    const width = this.contentMetrics.cardWidth;
    const height = this.contentMetrics.cardHeight;
    const shadow = this.add.graphics();
    shadow.fillStyle(COLORS.shadow, 0.18);
    shadow.fillRoundedRect(8, 10, width, height, 20);

    const body = this.add.graphics();
    body.fillStyle(COLORS.white, 1);
    body.lineStyle(1, COLORS.line, 1);
    body.fillRoundedRect(0, 0, width, height, 20);
    body.strokeRoundedRect(0, 0, width, height, 20);

    // Показываем цену только если она > 0
    const chip = this.add.graphics();
    const chipText = this.add.text(0, 0, "", textStyle(13, COLORS.text, "700")).setOrigin(0.5);
    
    if (cardData.price > 0) {
      chip.fillStyle(COLORS[tab.accentKey], 0.2);
      chip.fillRoundedRect(18, 18, 92, 30, 14);
      chipText.setText(`${formatMoney(cardData.price)} ₽`);
      chipText.setPosition(64, 33);
    } else {
      chip.setVisible(false);
      chipText.setVisible(false);
    }
    
    const title = this.add.text(18, 62, cardData.title, { ...textStyle(19, COLORS.text, "700"), wordWrap: { width: width - 36 } });
    const effect = this.add.text(18, 112, cardData.effect, { ...textStyle(14, COLORS.text, "600"), wordWrap: { width: width - 36 } });
    const mood = this.add.text(18, height - 48, cardData.mood, { ...textStyle(13, COLORS.text, "500"), wordWrap: { width: width - 120 } });

    const button = this.add.container(width - 86, height - 42);
    const buttonBg = this.add.graphics();
    buttonBg.fillStyle(COLORS[tab.accentKey], 1);
    buttonBg.fillRoundedRect(-42, -18, 84, 36, 16);
    const buttonText = this.add.text(0, 0, "Выбрать", textStyle(13, COLORS.text, "700")).setOrigin(0.5);
    const hit = this.add.rectangle(0, 0, 84, 36, 0x000000, 0).setOrigin(0.5);
    hit.setInteractive({ useHandCursor: true });
    hit.on("pointerover", () => this.tweens.add({ targets: button, scale: 1.04, duration: 160 }));
    hit.on("pointerout", () => this.tweens.add({ targets: button, scale: 1, duration: 160 }));
    hit.on("pointerup", () => {
      this.showActionModal(cardData, tab);
      this.tweens.add({
        targets: container,
        scaleX: 0.99,
        scaleY: 0.99,
        duration: 110,
        yoyo: true,
      });
    });
    button.add([buttonBg, buttonText, hit]);
    if (tab.id === "education") {
      buttonText.setText("Открыть");
    }

    const badge = this.add.circle(width - 34, 34, 15, COLORS[tab.accentKey], 0.95);
    const badgeText = this.add.text(width - 34, 34, String(index + 1), textStyle(12, COLORS.text, "700")).setOrigin(0.5);

    container.add([shadow, body, chip, chipText, title, effect, mood, badge, badgeText, button]);
    return container;
  }

  handleResize(gameSize) {
    const width = gameSize.width;
    const height = gameSize.height;
    const safeX = Math.max(20, width * 0.04);
    const safeY = Math.max(20, height * 0.035);
    const contentWidth = width - safeX * 2;
    const isMobile = width < 720;
    const headerHeight = isMobile ? 180 : 190;
    const tabsHeight = 108;
    const footerHeight = 94;
    const contentY = safeY + headerHeight + tabsHeight + 28;
    const contentHeight = height - contentY - footerHeight - safeY - 14;

    this.drawRecoveryBackground(width, height);

    this.headerCard.resize(safeX, safeY, contentWidth, headerHeight);
    this.tabsCard.resize(safeX, safeY + headerHeight + 14, contentWidth, tabsHeight);
    this.contentCard.resize(safeX, contentY, contentWidth, contentHeight);
    this.footerCard.resize(safeX, height - safeY - footerHeight, contentWidth, footerHeight);

    this.layoutHeader(safeX, safeY, contentWidth, headerHeight, isMobile);
    this.layoutTabs(safeX, safeY + headerHeight + 14, contentWidth);
    this.layoutContent(safeX, contentY, contentWidth, contentHeight, isMobile);
    this.layoutFooter(safeX, height - safeY - footerHeight, contentWidth, footerHeight);
    this.actionModal.resize(this.scale.gameSize);
    this.feedbackModal.resize(this.scale.gameSize);

    this.renderActiveTab(false);
  }

  layoutHeader(x, y, width, height, isMobile) {
    const illustrationWidth = isMobile ? width - 32 : 220;
    const illustrationHeight = isMobile ? 74 : height - 32;
    const textWidth = isMobile ? width - 32 : width - illustrationWidth - 52;

    this.titleText.setPosition(x + 24, y + 24);
    this.subtitleText.setPosition(x + 24, y + 66).setWordWrapWidth(textWidth);
    this.moneyText.setPosition(x + 24, y + (isMobile ? 122 : 126));
    this.metaText.setPosition(x + 24, y + (isMobile ? 154 : 158));
    this.roomText.setPosition(isMobile ? x + width - 24 : x + width - 24, y + 24).setOrigin(1, 0);

    this.moneyText.setText(`${formatMoney(this.saveData.money)} ₽`);
    this.metaText.setText(`Жильё: ${this.saveData.housing.name} • комфорт ${this.saveData.housing.comfort}%`);
    this.roomText.setText("После смены можно восстановиться, купить или спланировать следующий шаг");

    const roomX = isMobile ? x + 16 : x + width - illustrationWidth - 16;
    const roomY = isMobile ? y + height - illustrationHeight - 16 : y + 16;
    this.roomIllustration.setPosition(roomX, roomY);
    this.drawRoom(illustrationWidth, illustrationHeight);
  }

  layoutTabs(x, y, width) {
    const section = width / this.tabButtons.length;
    this.tabButtons.forEach((button, index) => {
      button.setPosition(x + section * index + section / 2, y + 42);
    });
  }

  layoutContent(x, y, width, height, isMobile) {
    this.contentGroup.removeAll(true);
    this.cards = [];

    if (!this.contentTitle) {
      this.contentTitle = this.add.text(0, 0, "", textStyle(22, COLORS.text, "700"));
      this.root.add(this.contentTitle);
    }

    this.contentTitle.setPosition(x + 22, y + 20);

    const innerX = x + 20;
    const innerY = y + 62;
    const innerWidth = width - 40;
    const innerHeight = height - 80;
    const columns = isMobile ? 1 : 2;
    const gap = 18;
    const cardWidth = columns === 1 ? innerWidth : (innerWidth - gap) / 2;
    const cardHeight = isMobile ? 176 : 188;

    this.contentScroll.resize(innerX, innerY, innerWidth, innerHeight);
    this.contentMetrics = {
      gap,
      columns,
      cardWidth,
      cardHeight,
      viewportHeight: innerHeight,
    };
  }

  layoutFooter(x, y, width, height) {
    this.footerButton.resize(Math.min(320, width - 28), 58);
    this.footerButton.setPosition(x + width / 2, y + height / 2 + 3);
  }

  drawRecoveryBackground(width, height) {
    this.background.clear();
    this.background.fillStyle(COLORS.accent, 0.12);
    this.background.fillCircle(width * 0.88, height * 0.14, Math.min(width, height) * 0.16);
    this.background.fillStyle(COLORS.sage, 0.14);
    this.background.fillCircle(width * 0.1, height * 0.78, Math.min(width, height) * 0.2);
    this.background.fillStyle(COLORS.blue, 0.08);
    this.background.fillEllipse(width * 0.52, height * 0.96, width * 0.74, height * 0.2);
  }

  animateRecoveryIntro() {
    [this.headerCard, this.tabsCard, this.contentCard, this.footerCard].forEach((item, index) => {
      item.setAlpha(0);
      item.y += 16;
      this.tweens.add({
        targets: item,
        alpha: 1,
        y: item.y - 16,
        duration: 380,
        delay: index * 70,
        ease: "Cubic.easeOut",
      });
    });
  }
}

class RecoveryCategoryScene extends Phaser.Scene {
  constructor(sceneKey, tabId, sceneTitle, sceneSubtitle) {
    super(sceneKey);
    this.tabId = tabId;
    this.sceneTitleValue = sceneTitle;
    this.sceneSubtitleValue = sceneSubtitle;
    this.cards = [];
  }

  create() {
    this.saveData = this.registry.get("saveData") ?? loadSave();
    this.tab = RECOVERY_TABS.find((item) => item.id === this.tabId);
    this.cameras.main.setBackgroundColor(COLORS.background);

    this.background = this.add.graphics();
    this.root = this.add.container(0, 0);

    this.headerCard = createRoundedPanel(this, { panelAlpha: 0.97, radius: 22, shadowAlpha: 0.2 });
    this.summaryCard = createRoundedPanel(this, { panelAlpha: 0.97, radius: 22, shadowAlpha: 0.2 });
    this.contentCard = createRoundedPanel(this, { panelAlpha: 0.97, radius: 22, shadowAlpha: 0.2 });
    this.footerCard = createRoundedPanel(this, { panelAlpha: 0.97, radius: 22, shadowAlpha: 0.2 });
    this.root.add([this.headerCard, this.summaryCard, this.contentCard, this.footerCard]);

    this.titleText = this.add.text(0, 0, this.sceneTitleValue, textStyle(30, COLORS.text, "700"));
    this.subtitleText = this.add.text(0, 0, this.sceneSubtitleValue, {
      ...textStyle(15, COLORS.text, "500"),
      wordWrap: { width: 440 },
    });
    this.moneyText = this.add.text(0, 0, "", textStyle(26, COLORS.text, "700"));
    this.summaryText = this.add.text(0, 0, "", {
      ...textStyle(14, COLORS.text, "600"),
      wordWrap: { width: 420 },
    });
    this.metaText = this.add.text(0, 0, "", {
      ...textStyle(14, COLORS.text, "500"),
      wordWrap: { width: 420 },
    });
    this.contentTitle = this.add.text(0, 0, this.tab?.title ?? "", textStyle(20, COLORS.text, "700"));
    this.root.add([this.titleText, this.subtitleText, this.moneyText, this.summaryText, this.metaText, this.contentTitle]);

    this.contentGroup = this.add.container(0, 0);
    this.contentScroll = createVerticalScrollController(this, this.contentGroup);
    this.root.add(this.contentGroup);

    this.actionModal = createEventModal(this, {
      width: 380,
      height: 430,
      primaryLabel: "Применить",
      secondaryLabel: "Отмена",
    });
    this.feedbackModal = createNotificationModal(this, {
      primaryLabel: "Понятно",
      secondaryLabel: "Закрыть",
    });
    this.root.add([this.actionModal, this.feedbackModal]);

    this.backButton = createRoundedButton(this, {
      label: "Назад",
      fillColor: COLORS.neutral,
      fontSize: 16,
      onClick: () => this.scene.start("MainGameScene"),
    });
    this.root.add(this.backButton);

    this.scale.on("resize", this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off("resize", this.handleResize, this);
    });

    this.refreshCategoryView();
    this.handleResize(this.scale.gameSize);
    this.animateCategoryIntro();
    ensureEventQueue(this, 520);
  }

  refreshCategoryView() {
    this.saveData = this.registry.get("saveData") ?? this.saveData;
    this.tab = RECOVERY_TABS.find((item) => item.id === this.tabId);
    this.moneyText.setText(`${formatMoney(this.saveData.money)} ₽`);
    const summary = this.getSummaryLines();
    this.summaryText.setText(summary.summary);
    this.metaText.setText(summary.meta);
    this.buildCards();
  }

  getSummaryLines() {
    if (this.tabId === "home") {
      const housingOverview = getHousingOverview(this.saveData);
      return {
        summary: `Жильё: ${housingOverview.currentTier.name} • комфорт ${housingOverview.comfort}% • еженедельный бонус: ${housingOverview.weeklyBonus.summary}`,
        meta: housingOverview.nextTier
          ? `Следующий уровень: ${housingOverview.nextTier.name} • апгрейд усиливает пассивное восстановление и меняет ежемесячную стоимость жилья.`
          : `Максимальный уровень жилья открыт. Куплено улучшений: ${housingOverview.furnitureCount}.`,
      };
    }

    if (this.tabId === "shop") {
      return {
        summary: `Свободные деньги: ${formatMoney(this.saveData.money)} ₽ • Быстрые покупки закрывают голод и бытовые провалы.`,
        meta: `Лучше всего покупать еду и базовые вещи перед тяжёлой рабочей неделей.`,
      };
    }

    if (this.tabId === "social") {
      const relationship = this.saveData.relationships?.[0];
      return {
        summary: relationship
          ? `${relationship.name}: уровень связи ${relationship.level}% • Последний контакт: день ${relationship.lastContact}`
          : "Пока активных отношений нет.",
        meta: "Социальные действия снижают стресс и дают мягкие долгосрочные бонусы к состоянию.",
      };
    }

    return {
      summary: this.tab?.subtitle ?? "",
      meta: "",
    };
  }

  buildCards() {
    this.contentGroup.removeAll(true);
    this.cards = [];
    this.contentScroll.reset();

    const cards = this.getSceneCards();
    cards.forEach((cardData, index) => {
      const card = this.createActionCard(cardData, index);
      this.contentGroup.add(card);
      this.cards.push(card);
    });
  }

  getSceneCards() {
    return this.tab?.cards ?? [];
  }

  createActionCard(cardData, index) {
    const container = this.add.container(0, 0);
    const shadow = this.add.graphics();
    const body = this.add.graphics();
    const chip = this.add.graphics();
    const title = this.add.text(0, 0, cardData.title, textStyle(19, COLORS.text, "700"));
    const effect = this.add.text(0, 0, cardData.effect, {
      ...textStyle(14, COLORS.text, "600"),
      wordWrap: { width: 280 },
    });
    const mood = this.add.text(0, 0, cardData.mood, {
      ...textStyle(13, COLORS.text, "500"),
      wordWrap: { width: 280 },
    });
    const badge = this.add.text(0, 0, String(index + 1), textStyle(12, COLORS.text, "700")).setOrigin(0.5);
    const chipText = this.add.text(0, 0, "", textStyle(13, COLORS.text, "700")).setOrigin(0.5);

    if (cardData.price > 0) {
      chipText.setText(`${formatMoney(cardData.price)} ₽`);
    } else {
      chip.setVisible(false);
      chipText.setVisible(false);
    }

    const button = createRoundedButton(this, {
      label: "Выбрать",
      fillColor: COLORS[this.tab.accentKey],
      fontSize: 14,
      onClick: () => this.showActionModal(cardData),
    });

    container.shadow = shadow;
    container.body = body;
    container.chip = chip;
    container.chipText = chipText;
    container.titleText = title;
    container.effectText = effect;
    container.moodText = mood;
    container.badgeText = badge;
    container.button = button;
    container.cardData = cardData;
    container.add([shadow, body, chip, chipText, title, effect, mood, badge, button]);
    return container;
  }

  showActionModal(cardData) {
    const availability = validateRecoveryAction(this.saveData, cardData);
    if (!availability.ok) {
      this.feedbackModal.show({
        title: cardData.title,
        description: availability.reason,
        accentColor: COLORS[this.tab.accentKey],
      });
      return;
    }

    this.actionModal.show({
      title: cardData.title,
      description: `${cardData.effect}\n\n${cardData.mood}\n\nСтоимость: ${formatMoney(cardData.price)} ₽ • Время: ${cardData.dayCost} д.`,
      accentColor: COLORS[this.tab.accentKey],
      primaryLabel: "Применить",
      secondaryLabel: "Отмена",
      onPrimary: () => this.applyCategoryAction(cardData),
    });
  }

  applyCategoryAction(cardData) {
    const summary = applyRecoveryActionToSave(this.saveData, cardData);
    persistSave(this, this.saveData);
    this.actionModal.hide();
    this.refreshCategoryView();
    this.handleResize(this.scale.gameSize);
    this.feedbackModal.show({
      title: `${cardData.title} выполнено`,
      description: summary,
      accentColor: COLORS[this.tab.accentKey],
    });
  }

  handleResize(gameSize) {
    const width = gameSize.width;
    const height = gameSize.height;
    const safeX = Math.max(20, width * 0.04);
    const safeY = Math.max(20, height * 0.035);
    const contentWidth = width - safeX * 2;
    const headerHeight = 122;
    const summaryHeight = 108;
    const footerHeight = 86;
    const contentY = safeY + headerHeight + summaryHeight + 28;
    const contentHeight = height - contentY - footerHeight - safeY - 14;

    this.drawCategoryBackground(width, height);
    this.headerCard.resize(safeX, safeY, contentWidth, headerHeight);
    this.summaryCard.resize(safeX, safeY + headerHeight + 14, contentWidth, summaryHeight);
    this.contentCard.resize(safeX, contentY, contentWidth, contentHeight);
    this.footerCard.resize(safeX, height - safeY - footerHeight, contentWidth, footerHeight);

    this.titleText.setPosition(safeX + 22, safeY + 20);
    this.subtitleText.setPosition(safeX + 22, safeY + 60).setWordWrapWidth(contentWidth - 44);

    this.moneyText.setPosition(safeX + 22, safeY + headerHeight + 24);
    this.summaryText.setPosition(safeX + 22, safeY + headerHeight + 58).setWordWrapWidth(contentWidth - 44);
    this.metaText.setPosition(safeX + 22, safeY + headerHeight + 82).setWordWrapWidth(contentWidth - 44);

    this.contentTitle.setPosition(safeX + 22, contentY + 18);
    this.backButton.resize(Math.min(320, contentWidth - 28), 54);
    this.backButton.setPosition(safeX + contentWidth / 2, height - safeY - footerHeight / 2);

    const innerX = safeX + 20;
    const innerY = contentY + 56;
    const innerWidth = contentWidth - 40;
    const innerHeight = contentHeight - 74;
    const isMobile = width < 900;
    const columns = isMobile ? 1 : 2;
    const gap = 18;
    const cardWidth = columns === 1 ? innerWidth : (innerWidth - gap) / 2;
    const cardHeight = isMobile ? 212 : 198;

    this.contentScroll.resize(innerX, innerY, innerWidth, innerHeight);
    this.cards.forEach((card, index) => {
      const row = Math.floor(index / columns);
      const column = index % columns;
      card.setPosition(column * (cardWidth + gap), row * (cardHeight + gap));
      this.layoutCategoryCard(card, cardWidth, cardHeight);
    });

    const totalHeight = Math.ceil(this.cards.length / columns) * (cardHeight + gap);
    this.contentScroll.setContentHeight(totalHeight);
    this.actionModal.resize(this.scale.gameSize);
    this.feedbackModal.resize(this.scale.gameSize);
  }

  layoutCategoryCard(card, width, height) {
    card.shadow.clear();
    card.shadow.fillStyle(COLORS.shadow, 0.16);
    card.shadow.fillRoundedRect(8, 10, width, height, 18);
    card.body.clear();
    card.body.fillStyle(COLORS.white, 1);
    card.body.lineStyle(1, COLORS.line, 1);
    card.body.fillRoundedRect(0, 0, width, height, 18);
    card.body.strokeRoundedRect(0, 0, width, height, 18);
    const hasPrice = card.cardData && card.cardData.price > 0;
    if (hasPrice) {
      card.chip.setVisible(true);
      if (card.chipText) card.chipText.setVisible(true);
      card.chip.clear();
      card.chip.fillStyle(COLORS[this.tab.accentKey], 0.2);
      card.chip.fillRoundedRect(18, 18, 92, 28, 14);
      if (card.chipText) card.chipText.setPosition(64, 32);
    } else {
      card.chip.setVisible(false);
      if (card.chipText) card.chipText.setVisible(false);
    }
    card.titleText.setPosition(18, hasPrice ? 54 : 18).setWordWrapWidth(width - 36);
    card.effectText.setPosition(18, hasPrice ? 92 : 56).setWordWrapWidth(width - 36);
    card.moodText.setPosition(18, height - 64).setWordWrapWidth(width - 154);
    card.badgeText.setPosition(width - 32, 30);
    card.button.resize(Math.min(122, width - 36), 42, COLORS[this.tab.accentKey]);
    card.button.setPosition(width - 82, height - 30);
  }

  drawCategoryBackground(width, height) {
    this.background.clear();
    this.background.fillStyle(COLORS[this.tab.accentKey], 0.1);
    this.background.fillCircle(width * 0.84, height * 0.14, Math.min(width, height) * 0.14);
    this.background.fillStyle(COLORS.blue, 0.07);
    this.background.fillCircle(width * 0.12, height * 0.82, Math.min(width, height) * 0.16);
    this.background.fillStyle(COLORS.sage, 0.07);
    this.background.fillEllipse(width * 0.52, height * 0.94, width * 0.74, height * 0.18);
  }

  animateCategoryIntro() {
    [this.headerCard, this.summaryCard, this.contentCard, this.footerCard].forEach((item, index) => {
      item.setAlpha(0);
      item.y += 16;
      this.tweens.add({
        targets: item,
        alpha: 1,
        y: item.y - 16,
        duration: 360,
        delay: index * 60,
        ease: "Cubic.easeOut",
      });
    });
  }

  onExternalStateChange() {
    this.refreshCategoryView();
    this.handleResize(this.scale.gameSize);
  }
}

class HomeScene extends RecoveryCategoryScene {
  constructor() {
    super("HomeScene", "home", "Дом и уют", "Улучшения жилья и домашний комфорт влияют на эффективность восстановления и качество жизни.");
  }

  getSceneCards() {
    const cards = [...super.getSceneCards()];
    const currentLevel = this.saveData?.housing?.level ?? 1;
    if (currentLevel > 1) {
      const nextLowerLevel = currentLevel - 1;
      cards.push({
        title: "Сменить жильё на вариант проще",
        price: 0,
        dayCost: 2,
        effect: `Переезд на уровень ${nextLowerLevel} • Ежемесячная аренда ниже • Комфорт немного снижается`,
        mood: "Осознанный шаг, если хочется разгрузить ежемесячные расходы",
        housingSetLevel: nextLowerLevel,
      });
    }
    return cards;
  }
}

class ShopScene extends RecoveryCategoryScene {
  constructor() {
    super("ShopScene", "shop", "Магазин", "Быстрые покупки закрывают базовые потребности и помогают не провалить следующий рабочий цикл.");
  }
}

class SocialScene extends RecoveryCategoryScene {
  constructor() {
    super("SocialScene", "social", "Социальная жизнь", "Контакты и встречи поддерживают настроение, уменьшают стресс и делают цикл устойчивее.");
  }
}

class FunScene extends RecoveryCategoryScene {
  constructor() {
    super("FunScene", "fun", "Развлечения и отдых", "Экран для мягкого восстановления после рабочих дней: отдых, прогулки и забота о теле без перегруза интерфейса.");
  }
}

class InteractiveWorkEventScene extends Phaser.Scene {
  constructor() {
    super("WorkEventScene");
  }

  create() {
    this.saveData = this.registry.get("saveData") ?? loadSave();
    this.initData = this.scene.settings?.data ?? {};
    this.mode = this.initData.mode ?? "normal";
    this.event = this.initData.event ?? null;
    this.workDays = this.initData.workDays ?? 1;
    this.state = "idle";
    this.durationMs = 10000;
    this.elapsedMs = 0;
    this.clickCount = 0;
    this.remainingSeconds = 10;
    this.pendingOutcome = null;

    this.cameras.main.setBackgroundColor(COLORS.background);

    this.background = this.add.graphics();
    this.root = this.add.container(0, 0);
    this.contentCard = this.createPanel();
    this.resultCard = this.createPanel();
    this.root.add([this.contentCard, this.resultCard]);

    this.titleText = this.add.text(0, 0, "Рабочее событие", textStyle(30, COLORS.text, "700"));
    this.subtitleText = this.add.text(0, 0, "Нажимай по центральной кнопке 10 секунд. Чем выше темп, тем лучше итог смены.", {
      ...textStyle(16, COLORS.text, "500"),
      align: "center",
      wordWrap: { width: 360 },
    });
    this.statusText = this.add.text(0, 0, "Подготовься и начни мини-ивент", textStyle(16, COLORS.text, "600"));
    this.counterText = this.add.text(0, 0, "0", textStyle(50, COLORS.text, "700"));
    this.counterCaption = this.add.text(0, 0, "кликов", textStyle(15, COLORS.text, "500"));
    this.timerText = this.add.text(0, 0, "10.0", textStyle(26, COLORS.text, "700"));
    this.timerCaption = this.add.text(0, 0, "секунд", textStyle(13, COLORS.text, "500"));
    this.root.add([
      this.titleText,
      this.subtitleText,
      this.statusText,
      this.counterText,
      this.counterCaption,
      this.timerText,
      this.timerCaption,
    ]);

    this.timerRing = this.add.graphics();
    this.lightRing = this.add.graphics();
    this.centerButton = this.add.container(0, 0);
    this.centerButtonShadow = this.add.graphics();
    this.centerButtonBody = this.add.graphics();
    this.centerButtonLabel = this.add.text(0, -6, "Старт", textStyle(24, COLORS.text, "700")).setOrigin(0.5);
    this.centerButtonHint = this.add.text(0, 18, "нажми", textStyle(13, COLORS.text, "500")).setOrigin(0.5);
    this.centerButtonHit = this.add.circle(0, 0, 84, 0x000000, 0);
    this.centerButtonHit.setInteractive({ useHandCursor: true });
    this.centerButtonHit.on("pointerover", () => {
      if (this.state !== "finished") {
        this.tweens.add({ targets: this.centerButton, scale: 1.02, duration: 160 });
      }
    });
    this.centerButtonHit.on("pointerout", () => this.tweens.add({ targets: this.centerButton, scale: 1, duration: 160 }));
    this.centerButtonHit.on("pointerup", () => this.handleCenterButtonPress());
    this.centerButton.add([
      this.centerButtonShadow,
      this.centerButtonBody,
      this.centerButtonLabel,
      this.centerButtonHint,
      this.centerButtonHit,
    ]);
    this.root.add([this.timerRing, this.lightRing, this.centerButton]);

    this.backButton = this.createSceneButton("Назад", () => this.scene.start("MainGameScene"), COLORS.neutral);
    this.restartButton = this.createSceneButton("Ещё раз", () => this.resetEvent(), COLORS.accentSoft);
    this.root.add([this.backButton, this.restartButton]);

    this.resultTitle = this.add.text(0, 0, "Результат смены", textStyle(26, COLORS.text, "700"));
    this.resultGrade = this.add.text(0, 0, "", textStyle(30, COLORS.text, "700"));
    this.resultMeta = this.add.text(0, 0, "", { ...textStyle(16, COLORS.text, "500"), align: "center", wordWrap: { width: 320 } });
    this.resultAction = this.createSceneButton("Перейти к восстановлению", () => this.resolveWorkOutcome(), COLORS.accent);
    this.resultCard.add([this.resultTitle, this.resultGrade, this.resultMeta, this.resultAction]);
    this.workEventModal = createEventModal(this, {
      primaryLabel: "Выбрать",
      secondaryLabel: "Позже",
    });
    this.root.add(this.workEventModal);

    this.scale.on("resize", this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off("resize", this.handleResize, this);
    });

    this.handleResize(this.scale.gameSize);
    
    if (this.mode === "event_only" && this.event) {
      this.showEventOnlyMode();
    } else {
      this.resetEvent();
      this.animateSceneIn();
    }
    ensureEventQueue(this, 420);
  }

  update(_, delta) {
    if (this.state !== "active") {
      return;
    }

    this.elapsedMs += delta;
    const progress = Phaser.Math.Clamp(this.elapsedMs / this.durationMs, 0, 1);
    const remaining = Math.max(0, (this.durationMs - this.elapsedMs) / 1000);
    const secondsDisplay = remaining.toFixed(1);
    const wholeSeconds = Math.ceil(remaining);

    this.timerText.setText(secondsDisplay);
    if (wholeSeconds !== this.remainingSeconds) {
      this.remainingSeconds = wholeSeconds;
      this.pulseTimer();
    }

    this.drawTimer(progress);
    this.drawLightRing(progress);

    if (progress >= 1) {
      this.finishEvent();
    }
  }

  createPanel() {
    return createRoundedPanel(this, { panelAlpha: 0.96, radius: 24, shadowAlpha: 0.22 });
  }

  createSceneButton(label, onClick, fillColor) {
    return createRoundedButton(this, {
      label,
      onClick,
      fillColor,
      fontSize: 16,
    });
  }

  handleResize(gameSize) {
    const width = gameSize.width;
    const height = gameSize.height;
    const safeX = Math.max(20, width * 0.05);
    const safeY = Math.max(20, height * 0.04);
    const contentWidth = width - safeX * 2;
    const isMobile = width < 720;
    const mainHeight = height - safeY * 2 - (isMobile ? 120 : 104);

    this.drawWorkBackground(width, height);
    this.contentCard.resize(safeX, safeY, contentWidth, mainHeight, 28);
    this.resultCard.resize(width / 2 - Math.min(180, contentWidth / 2), height - safeY - (isMobile ? 254 : 232), Math.min(360, contentWidth), isMobile ? 180 : 164, 24, 0.98);
    this.resultCard.setVisible(this.state === "finished");

    this.titleText.setPosition(width / 2, safeY + 32).setOrigin(0.5, 0);
    this.subtitleText.setPosition(width / 2, safeY + 76).setOrigin(0.5, 0);
    this.statusText.setPosition(width / 2, safeY + (isMobile ? 154 : 146)).setOrigin(0.5, 0.5);
    this.counterText.setPosition(width / 2, safeY + (isMobile ? 210 : 196)).setOrigin(0.5);
    this.counterCaption.setPosition(width / 2, this.counterText.y + 42).setOrigin(0.5);
    this.timerText.setPosition(width / 2, safeY + (isMobile ? 262 : 246)).setOrigin(0.5);
    this.timerCaption.setPosition(width / 2, this.timerText.y + 26).setOrigin(0.5);

    this.centerX = width / 2;
    this.centerY = safeY + (isMobile ? 432 : 400);
    this.buttonRadius = isMobile ? 84 : 92;
    this.lightRadius = this.buttonRadius + (isMobile ? 54 : 68);
    this.centerButton.setPosition(this.centerX, this.centerY);
    this.resizeCenterButton(this.buttonRadius);

    this.backButton.resize(142, 48);
    this.backButton.setPosition(safeX + 71, height - safeY - 28);
    this.restartButton.resize(142, 48);
    this.restartButton.setPosition(width - safeX - 71, height - safeY - 28);

    this.layoutResultCard(width, height, safeY, isMobile);
    this.drawTimer(this.elapsedMs / this.durationMs);
    this.drawLightRing(this.elapsedMs / this.durationMs);
    this.workEventModal.resize(this.scale.gameSize);
  }

  layoutResultCard(width, height, safeY, isMobile) {
    const cardWidth = this.resultCard.panelWidth;
    const cardHeight = this.resultCard.panelHeight;
    const cardX = width / 2 - cardWidth / 2;
    const cardY = height - safeY - cardHeight - (isMobile ? 74 : 68);
    this.resultCard.setPosition(cardX, cardY);

    this.resultTitle.setPosition(cardWidth / 2, 24).setOrigin(0.5, 0);
    this.resultGrade.setPosition(cardWidth / 2, 72).setOrigin(0.5, 0);
    this.resultMeta.setPosition(cardWidth / 2, 116).setOrigin(0.5, 0).setWordWrapWidth(cardWidth - 40);
    this.resultAction.resize(Math.min(280, cardWidth - 40), 48);
    this.resultAction.setPosition(cardWidth / 2, cardHeight - 34);
  }

  resizeCenterButton(radius) {
    this.centerButtonShadow.clear();
    this.centerButtonShadow.fillStyle(COLORS.shadow, 0.2);
    this.centerButtonShadow.fillCircle(0, 10, radius);

    this.centerButtonBody.clear();
    this.centerButtonBody.fillStyle(this.state === "active" ? COLORS.accent : COLORS.accentSoft, 1);
    this.centerButtonBody.lineStyle(2, COLORS.text, 0.08);
    this.centerButtonBody.fillCircle(0, 0, radius);
    this.centerButtonBody.strokeCircle(0, 0, radius);

    this.centerButtonHit.setRadius(radius);
    this.centerButtonLabel.setFontSize(radius > 88 ? 28 : 24);
  }

  drawWorkBackground(width, height) {
    this.background.clear();
    this.background.fillStyle(COLORS.accent, 0.14);
    this.background.fillCircle(width * 0.82, height * 0.14, Math.min(width, height) * 0.16);
    this.background.fillStyle(COLORS.blue, 0.08);
    this.background.fillEllipse(width * 0.5, height * 0.92, width * 0.72, height * 0.18);
    this.background.fillStyle(COLORS.sage, 0.14);
    this.background.fillCircle(width * 0.14, height * 0.76, Math.min(width, height) * 0.22);
  }

  drawTimer(progress) {
    const clamped = Phaser.Math.Clamp(progress, 0, 1);
    this.timerRing.clear();
    this.timerRing.lineStyle(12, COLORS.neutral, 0.55);
    this.timerRing.strokeCircle(this.centerX, this.centerY, this.lightRadius + 28);
    this.timerRing.lineStyle(12, COLORS.blue, 0.95);
    this.timerRing.beginPath();
    this.timerRing.arc(
      this.centerX,
      this.centerY,
      this.lightRadius + 28,
      Phaser.Math.DegToRad(-90),
      Phaser.Math.DegToRad(-90 + 360 * (1 - clamped)),
      false,
    );
    this.timerRing.strokePath();
  }

  drawLightRing(progress) {
    const clamped = Phaser.Math.Clamp(progress, 0, 1);
    const activeLights = Math.max(0, 12 - Math.floor(clamped * 12));
    this.lightRing.clear();

    for (let index = 0; index < 12; index += 1) {
      const angle = Phaser.Math.DegToRad(index * 30 - 90);
      const x = this.centerX + Math.cos(angle) * this.lightRadius;
      const y = this.centerY + Math.sin(angle) * this.lightRadius;
      const isLit = index < activeLights;
      const color = index % 2 === 0 ? COLORS.accent : COLORS.sage;
      this.lightRing.fillStyle(color, isLit ? 0.96 : 0.18);
      this.lightRing.fillCircle(x, y, isLit ? 10 : 8);
    }
  }

  handleCenterButtonPress() {
    if (this.state === "idle") {
      this.startEvent();
      return;
    }

    if (this.state === "active") {
      this.registerClick();
      return;
    }

    if (this.state === "finished") {
      this.resetEvent();
    }
  }

  startEvent() {
    this.state = "active";
    this.elapsedMs = 0;
    this.clickCount = 0;
    this.remainingSeconds = 10;
    this.counterText.setText("0");
    this.timerText.setText("10.0");
    this.statusText.setText("Кликай как можно быстрее");
    this.centerButtonLabel.setText("Жми");
    this.centerButtonHint.setText("10 секунд");
    this.resultCard.setVisible(false);
    this.resizeCenterButton(this.buttonRadius);
    this.drawTimer(0);
    this.drawLightRing(0);
    this.tweens.add({
      targets: this.centerButton,
      scale: 1.03,
      duration: 220,
      yoyo: true,
      repeat: 1,
    });
  }

  registerClick() {
    this.clickCount += 1;
    this.counterText.setText(String(this.clickCount));

    this.tweens.add({
      targets: this.centerButton,
      scale: 0.96,
      duration: 70,
      yoyo: true,
      ease: "Quad.easeOut",
    });

    this.tweens.add({
      targets: this.counterText,
      scale: 1.08,
      duration: 90,
      yoyo: true,
    });
  }

  pulseTimer() {
    this.tweens.add({
      targets: this.timerText,
      scale: 1.12,
      duration: 120,
      yoyo: true,
    });
  }

  finishEvent() {
    if (this.state !== "active") {
      return;
    }

    this.state = "finished";
    this.elapsedMs = this.durationMs;
    this.drawTimer(1);
    this.drawLightRing(1);
    this.timerText.setText("0.0");
    this.centerButtonLabel.setText("Ещё");
    this.centerButtonHint.setText("раз");
    this.statusText.setText("Смена завершена");
    this.resizeCenterButton(this.buttonRadius);

    const result = this.buildWorkOutcome();
    this.pendingOutcome = result;
    this.resultGrade.setText(result.grade);
    this.resultGrade.setColor(result.color);
    this.resultMeta.setText(result.previewText);
    this.resultAction.setLabel(result.workEvent ? "Разобрать событие" : "Перейти к восстановлению");
    this.resultCard.setVisible(true);

    this.tweens.add({
      targets: this.resultCard,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 320,
      ease: "Back.easeOut",
    });
  }

  resetEvent() {
    this.state = "idle";
    this.elapsedMs = 0;
    this.clickCount = 0;
    this.remainingSeconds = 10;
    this.pendingOutcome = null;
    this.counterText.setText("0");
    this.timerText.setText("10.0");
    this.statusText.setText("Подготовься и начни мини-ивент");
    this.centerButtonLabel.setText("Старт");
    this.centerButtonHint.setText("нажми");
    this.resultCard.setVisible(false).setAlpha(0).setScale(0.96);
    this.resultGrade.setText("");
    this.resultMeta.setText("");
    this.resultAction.setLabel("Перейти к восстановлению");
    this.resizeCenterButton(this.buttonRadius ?? 84);
    this.drawTimer(0);
    this.drawLightRing(0);
  }

  buildWorkOutcome() {
    return buildWorkOutcome(this.saveData, this.clickCount);
  }

  resolveWorkOutcome() {
    if (!this.pendingOutcome) {
      return;
    }

    if (!this.pendingOutcome.workEvent) {
      this.applyWorkOutcome();
      return;
    }

    const [primaryChoice, secondaryChoice] = this.pendingOutcome.workEvent.choices;
    this.workEventModal.show({
      title: this.pendingOutcome.workEvent.title,
      description: `${this.pendingOutcome.workEvent.description}\n\n1. ${primaryChoice.label} — ${primaryChoice.outcome}\n2. ${secondaryChoice.label} — ${secondaryChoice.outcome}`,
      accentColor: COLORS.accent,
      primaryLabel: primaryChoice.label,
      secondaryLabel: secondaryChoice.label,
      onPrimary: () => this.applyWorkOutcome(primaryChoice),
      onSecondary: () => this.applyWorkOutcome(secondaryChoice),
    });
  }

  applyWorkOutcome(eventChoice = null) {
    const summary = applyWorkOutcomeToSave(this.saveData, this.pendingOutcome, eventChoice);
    persistSave(this, this.saveData);
    this.scene.start("RecoveryScene", {
      initialTab: "shop",
      entrySummary: summary,
    });
  }

  showEventOnlyMode() {
    this.state = "event_only";
    this.mode = "event_only";
    
    this.titleText.setText(this.event.title);
    this.subtitleText.setText(this.event.description);
    this.statusText.setText("Выбери действие");
    
    this.centerButtonHit.visible = false;
    this.timerText.visible = false;
    this.timerCaption.visible = false;
    this.counterText.visible = false;
    this.counterCaption.visible = false;
    this.timerRing.visible = false;
    this.lightRing.visible = false;
    
    this.resultCard.setVisible(false);
    this.animateSceneIn();
    
    this.showPeriodEventModal();
  }

  showPeriodEventModal() {
    const [primaryChoice, secondaryChoice] = this.event.choices;
    this.workEventModal.show({
      title: this.event.title,
      description: `${this.event.description}\n\nРабочий период: ${this.workDays} дн.\n\n1. ${primaryChoice.label} — ${primaryChoice.outcome}\n2. ${secondaryChoice.label} — ${secondaryChoice.outcome}`,
      accentColor: COLORS.accent,
      primaryLabel: primaryChoice.label,
      secondaryLabel: secondaryChoice.label,
      onPrimary: () => this.applyPeriodEventChoice(primaryChoice),
      onSecondary: () => this.applyPeriodEventChoice(secondaryChoice),
    });
  }

  applyPeriodEventChoice(eventChoice) {
    const summary = applyPeriodEventChoiceToSave(this.saveData, this.event, eventChoice, this.workDays);
    persistSave(this, this.saveData);
    this.scene.start("RecoveryScene", {
      initialTab: "shop",
      entrySummary: summary,
    });
  }

  onExternalStateChange() {
    this.saveData = this.registry.get("saveData") ?? this.saveData;
  }

  animateSceneIn() {
    [this.contentCard, this.centerButton, this.backButton, this.restartButton].forEach((item, index) => {
      item.setAlpha(0);
      item.y += 16;
      this.tweens.add({
        targets: item,
        alpha: 1,
        y: item.y - 16,
        duration: 360,
        delay: index * 60,
        ease: "Cubic.easeOut",
      });
    });
  }
}

class EducationScene extends Phaser.Scene {
  constructor() {
    super("EducationScene");
    this.programCards = [];
  }

  create(data = {}) {
    this.saveData = this.registry.get("saveData") ?? loadSave();
    this.selectedProgramId = data.selectedProgramId ?? EDUCATION_PROGRAMS[0].id;
    this.sessionSummary = data.sessionSummary ?? null;
    this.sessionCompleted = data.sessionCompleted ?? false;

    this.cameras.main.setBackgroundColor(COLORS.background);

    this.background = this.add.graphics();
    this.root = this.add.container(0, 0);
    this.headerCard = this.createPanel();
    this.progressCard = this.createPanel();
    this.programsCard = this.createPanel();
    this.footerCard = this.createPanel();
    this.root.add([this.headerCard, this.progressCard, this.programsCard, this.footerCard]);

    this.titleText = this.add.text(0, 0, "Образование и развитие", textStyle(30, COLORS.text, "700"));
    this.subtitleText = this.add.text(0, 0, "Чистый, спокойный экран обучения: курсы, книги и длинный академический трек.", {
      ...textStyle(16, COLORS.text, "500"),
      wordWrap: { width: 360 },
    });
    this.moneyText = this.add.text(0, 0, "", textStyle(24, COLORS.text, "700"));
    this.levelText = this.add.text(0, 0, "", textStyle(15, COLORS.text, "600"));
    this.root.add([this.titleText, this.subtitleText, this.moneyText, this.levelText]);

    this.classroom = this.createClassroomIllustration();
    this.root.add(this.classroom);

    this.activeCourseTitle = this.add.text(0, 0, "Активный курс", textStyle(21, COLORS.text, "700"));
    this.activeCourseMeta = this.add.text(0, 0, "", { ...textStyle(15, COLORS.text, "500"), wordWrap: { width: 320 } });
    this.progressLabel = this.add.text(0, 0, "", textStyle(14, COLORS.text, "600"));
    this.progressTrack = this.add.graphics();
    this.progressFill = this.add.graphics();
    this.studyButton = createRoundedButton(this, {
      label: "Учиться 1 день",
      fillColor: COLORS.accent,
      fontSize: 17,
      onClick: () => this.advanceStudyDay(),
    });
    this.progressGroup = this.add.container(0, 0, [
      this.activeCourseTitle,
      this.activeCourseMeta,
      this.progressTrack,
      this.progressFill,
      this.progressLabel,
      this.studyButton,
    ]);
    this.root.add(this.progressGroup);

    this.programsGroup = this.add.container(0, 0);
    this.programsScroll = createVerticalScrollController(this, this.programsGroup);
    this.root.add(this.programsGroup);

    this.backButton = createRoundedButton(this, {
      label: "Назад",
      fillColor: COLORS.neutral,
      fontSize: 17,
      onClick: () => this.scene.start("MainGameScene"),
    });
    this.root.add(this.backButton);

    this.actionModal = createEventModal(this, {
      primaryLabel: "Начать",
      secondaryLabel: "Отмена",
    });
    this.feedbackModal = createNotificationModal(this, {
      primaryLabel: "Понятно",
      secondaryLabel: "Закрыть",
    });
    this.root.add([this.actionModal, this.feedbackModal]);

    this.scale.on("resize", this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off("resize", this.handleResize, this);
    });

    this.rebuildProgramCards();
    this.handleResize(this.scale.gameSize);
    this.refreshEducationView();
    this.animateEducationIntro();
    ensureEventQueue(this, 520);

    if (this.sessionSummary) {
      this.time.delayedCall(360, () => {
        this.feedbackModal.show({
          title: this.sessionCompleted ? "Учебная сессия завершена" : "Учебный день",
          description: this.sessionSummary,
          accentColor: this.sessionCompleted ? COLORS.sage : COLORS.blue,
          primaryLabel: this.sessionCompleted ? "На главный экран" : "Продолжить",
          secondaryLabel: "Закрыть",
          onPrimary: this.sessionCompleted ? () => this.scene.start("MainGameScene") : undefined,
        });
      });
    }
  }

  createPanel() {
    return createRoundedPanel(this, { panelAlpha: 0.97, radius: 22, shadowAlpha: 0.2 });
  }

  createClassroomIllustration() {
    const container = this.add.container(0, 0);
    container.art = this.add.graphics();
    container.add(container.art);
    return container;
  }

  drawClassroom(width, height) {
    const art = this.classroom.art;
    art.clear();
    art.fillStyle(COLORS.white, 1);
    art.fillRoundedRect(0, 0, width, height, 22);
    art.fillStyle(COLORS.blue, 0.1);
    art.fillRoundedRect(width * 0.08, height * 0.12, width * 0.84, height * 0.2, 16);
    art.fillStyle(COLORS.text, 0.1);
    art.fillRoundedRect(width * 0.18, height * 0.42, width * 0.64, height * 0.08, 12);
    art.fillStyle(COLORS.accent, 0.85);
    art.fillRoundedRect(width * 0.2, height * 0.58, width * 0.22, height * 0.16, 14);
    art.fillRoundedRect(width * 0.48, height * 0.58, width * 0.22, height * 0.16, 14);
    art.fillStyle(COLORS.sage, 0.9);
    art.fillRoundedRect(width * 0.76, height * 0.2, width * 0.08, height * 0.38, 12);
    art.fillStyle(COLORS.accentSoft, 1);
    art.fillCircle(width * 0.8, height * 0.15, width * 0.08);
  }

  rebuildProgramCards() {
    this.programCards.forEach((card) => card.destroy());
    this.programCards = [];
    this.programsGroup.removeAll(true);

    EDUCATION_PROGRAMS.forEach((program) => {
      const card = this.createProgramCard(program);
      this.programCards.push(card);
      this.programsGroup.add(card);
    });
  }

  createProgramCard(program) {
    const container = this.add.container(0, 0);
    const shadow = this.add.graphics();
    const body = this.add.graphics();
    const chip = this.add.graphics();
    const title = this.add.text(0, 0, program.title, { ...textStyle(18, COLORS.text, "700"), wordWrap: { width: 280 } });
    const subtitle = this.add.text(0, 0, program.subtitle, { ...textStyle(13, COLORS.text, "500"), wordWrap: { width: 280 } });
    const reward = this.add.text(0, 0, program.rewardText, { ...textStyle(13, COLORS.text, "600"), wordWrap: { width: 280 } });
    const chipText = this.add.text(0, 0, "", textStyle(12, COLORS.text, "700")).setOrigin(0.5);
    const priceText = program.cost > 0 ? ` • ${formatMoney(program.cost)} ₽` : "";
    chipText.setText(`${program.typeLabel} • ${program.daysRequired} д.${priceText}`);
    const button = createRoundedButton(this, {
      label: "Начать",
      fillColor: COLORS[program.accentKey],
      fontSize: 14,
      onClick: () => this.promptStartProgram(program),
    });

    container.shadow = shadow;
    container.body = body;
    container.chip = chip;
    container.titleText = title;
    container.subtitleText = subtitle;
    container.rewardText = reward;
    container.chipText = chipText;
    container.button = button;
    container.program = program;
    
    // Добавляем элементы в правильном порядке (chip и chipText первыми)
    container.add([shadow, body, chip, title, subtitle, reward, chipText, button]);
    
    // Устанавливаем depth для текстовых элементов, чтобы они были поверх плашки
    title.setDepth(1);
    subtitle.setDepth(2);
    reward.setDepth(3);
    chipText.setDepth(4);
    button.setDepth(5);

    return container;
  }

  promptStartProgram(program) {
    const availability = canStartEducationProgram(this.saveData, program);
    if (!availability.ok) {
      this.feedbackModal.show({
        title: program.title,
        description: availability.reason,
        accentColor: COLORS[program.accentKey],
        primaryLabel: "Понятно",
        secondaryLabel: "Закрыть",
      });
      return;
    }

    this.actionModal.show({
      title: program.title,
      description: `${program.subtitle}\n\nСтоимость: ${formatMoney(program.cost)} ₽ • Длительность: ${program.daysRequired} д.\n\nНаграда: ${program.rewardText}`,
      accentColor: COLORS[program.accentKey],
      primaryLabel: "Начать",
      secondaryLabel: "Отмена",
      onPrimary: () => this.startProgram(program),
    });
  }

  startProgram(program) {
    const summary = startEducationProgram(this.saveData, program);
    persistSave(this, this.saveData);
    this.refreshEducationView();
    this.feedbackModal.show({
      title: "Обучение начато",
      description: summary,
      accentColor: COLORS[program.accentKey],
      primaryLabel: "Продолжить",
      secondaryLabel: "Закрыть",
    });
  }

  advanceStudyDay() {
    const activeCourse = this.saveData.education.activeCourses?.[0];
    if (!activeCourse) {
      return;
    }
    const sceneKey = getEducationMiniSceneKey(activeCourse.id);
    this.scene.start(sceneKey, {
      courseId: activeCourse.id,
      returnScene: "EducationScene",
    });
  }

  refreshEducationView() {
    this.saveData = this.registry.get("saveData") ?? this.saveData;
    this.moneyText.setText(`${formatMoney(this.saveData.money)} ₽`);
    this.levelText.setText(`Уровень образования: ${this.saveData.education.educationLevel} • Активных курсов: ${this.saveData.education.activeCourses.length}`);

    const activeCourse = this.saveData.education.activeCourses?.[0];
    if (activeCourse) {
      this.activeCourseTitle.setText(activeCourse.name);
      this.activeCourseMeta.setText(`${activeCourse.type} • ${activeCourse.daysSpent}/${activeCourse.daysRequired} д. • стоимость ${formatMoney(activeCourse.costPaid)} ₽`);
      this.progressLabel.setText(`${Math.round((activeCourse.progress ?? 0) * 100)}%`);
      this.studyButton.setVisible(true);
    } else {
      this.activeCourseTitle.setText("Сейчас курс не запущен");
      this.activeCourseMeta.setText("Выбери книгу, онлайн-курс или длинную программу переподготовки. Пока курс не активен, можно спокойно планировать следующий шаг.");
      this.progressLabel.setText("0%");
      this.studyButton.setVisible(false);
    }

    this.programCards.forEach((card) => {
      const program = card.program;
      const activeId = activeCourse?.id;
      const canStart = canStartEducationProgram(this.saveData, program).ok;
      const isActive = activeId === program.id;
      const isSelected = this.selectedProgramId === program.id;
      card.button.setLabel(isActive ? "Идёт курс" : "Начать");
      card.button.resize(116, 40, isActive ? COLORS.neutral : COLORS[program.accentKey]);
      card.button.hit.input.enabled = !isActive && canStart;
      card.button.setAlpha(!isActive && canStart ? 1 : 0.72);
      card.setScale(isSelected ? 1.01 : 1);
      card.body.setAlpha(isSelected ? 1 : 0.96);
    });

    this.programsScroll.reset();
    this.handleResize(this.scale.gameSize);
  }

  handleResize(gameSize) {
    const width = gameSize.width;
    const height = gameSize.height;
    const safeX = Math.max(20, width * 0.04);
    const safeY = Math.max(20, height * 0.035);
    const contentWidth = width - safeX * 2;
    const isMobile = width < 720;
    const headerHeight = isMobile ? 190 : 196;
    const progressHeight = isMobile ? 180 : 154;
    const footerHeight = 86;
    const cardsY = safeY + headerHeight + progressHeight + 36;
    const cardsHeight = height - cardsY - footerHeight - safeY - 14;

    this.drawEducationBackground(width, height);
    this.headerCard.resize(safeX, safeY, contentWidth, headerHeight);
    this.progressCard.resize(safeX, safeY + headerHeight + 14, contentWidth, progressHeight);
    this.programsCard.resize(safeX, cardsY, contentWidth, cardsHeight);
    this.footerCard.resize(safeX, height - safeY - footerHeight, contentWidth, footerHeight);

    this.layoutHeader(safeX, safeY, contentWidth, headerHeight, isMobile);
    this.layoutProgress(safeX, safeY + headerHeight + 14, contentWidth, progressHeight);
    this.layoutPrograms(safeX, cardsY, contentWidth, cardsHeight, isMobile);
    this.backButton.resize(Math.min(320, contentWidth - 24), 54);
    this.backButton.setPosition(safeX + contentWidth / 2, height - safeY - footerHeight / 2);
    this.actionModal.resize(this.scale.gameSize);
    this.feedbackModal.resize(this.scale.gameSize);
  }

  layoutHeader(x, y, width, height, isMobile) {
    this.titleText.setPosition(x + 22, y + 22);
    this.subtitleText.setPosition(x + 22, y + 64).setWordWrapWidth(isMobile ? width - 44 : width - 280);
    this.moneyText.setPosition(x + 22, y + (isMobile ? 126 : 132));
    this.levelText.setPosition(x + 22, y + (isMobile ? 156 : 162));

    const artWidth = isMobile ? width - 32 : 220;
    const artHeight = isMobile ? 74 : height - 30;
    const artX = isMobile ? x + 16 : x + width - artWidth - 16;
    const artY = isMobile ? y + height - artHeight - 16 : y + 15;
    this.classroom.setPosition(artX, artY);
    this.drawClassroom(artWidth, artHeight);
  }

  layoutProgress(x, y, width, height) {
    this.progressGroup.setPosition(x + 22, y + 20);
    this.activeCourseTitle.setPosition(0, 0);
    this.activeCourseMeta.setPosition(0, 36).setWordWrapWidth(width - 44);
    this.progressTrack.clear();
    this.progressTrack.fillStyle(COLORS.neutral, 0.55);
    this.progressTrack.fillRoundedRect(0, 96, width - 44, 16, 9);

    const activeCourse = this.saveData.education.activeCourses?.[0];
    const progress = activeCourse?.progress ?? 0;
    this.progressFill.clear();
    this.progressFill.fillStyle(COLORS.accent, 1);
    this.progressFill.fillRoundedRect(0, 96, Math.max(progress > 0 ? 18 : 0, (width - 44) * progress), 16, 9);
    this.progressLabel.setPosition(width - 44, 88).setOrigin(1, 0);
    this.studyButton.resize(180, 48);
    this.studyButton.setPosition(Math.min(width - 134, 200), height - 54);
  }

  layoutPrograms(x, y, width, height, isMobile) {
    const innerX = x + 18;
    const innerY = y + 18;
    const gap = 16;
    const columns = isMobile ? 1 : 2;
    const cardWidth = columns === 1 ? width - 36 : (width - 36 - gap) / 2;
    const cardHeight = 176;
    const rows = Math.ceil(this.programCards.length / columns);
    const totalHeight = rows * cardHeight + Math.max(0, rows - 1) * gap;

    this.programsScroll.resize(innerX, innerY, width - 36, height - 36);
    this.programsScroll.setContentHeight(totalHeight);

    this.programCards.forEach((card, index) => {
      const row = Math.floor(index / columns);
      const col = index % columns;
      const cardX = col * (cardWidth + gap);
      const cardY = row * (cardHeight + gap);
      card.setPosition(cardX, cardY);
      this.layoutProgramCard(card, cardWidth, cardHeight);
    });
  }

  layoutProgramCard(card, width, height) {
    card.shadow.clear();
    card.shadow.fillStyle(COLORS.shadow, 0.18);
    card.shadow.fillRoundedRect(8, 10, width, height, 20);
    card.body.clear();
    card.body.fillStyle(COLORS.white, 1);
    card.body.lineStyle(1, COLORS.line, 1);
    card.body.fillRoundedRect(0, 0, width, height, 20);
    card.body.strokeRoundedRect(0, 0, width, height, 20);
    card.chip.clear();
    const chipWidth = Math.max(120, card.chipText.width + 28);
    card.chip.fillStyle(COLORS[card.program.accentKey], 0.2);
    card.chip.fillRoundedRect(18, 18, chipWidth, 28, 14);
    card.chipText.setPosition(18 + chipWidth / 2, 32);
    card.titleText.setPosition(18, 58).setWordWrapWidth(width - 36);
    card.subtitleText.setPosition(18, 92).setWordWrapWidth(width - 36);
    card.rewardText.setPosition(18, 128).setWordWrapWidth(width - 144);
    card.button.setPosition(width - 74, height - 34);
  }

  drawEducationBackground(width, height) {
    this.background.clear();
    this.background.fillStyle(COLORS.blue, 0.09);
    this.background.fillCircle(width * 0.84, height * 0.14, Math.min(width, height) * 0.14);
    this.background.fillStyle(COLORS.accent, 0.12);
    this.background.fillCircle(width * 0.12, height * 0.78, Math.min(width, height) * 0.18);
    this.background.fillStyle(COLORS.sage, 0.08);
    this.background.fillEllipse(width * 0.52, height * 0.94, width * 0.74, height * 0.18);
  }

  animateEducationIntro() {
    [this.headerCard, this.progressCard, this.programsCard, this.footerCard].forEach((item, index) => {
      item.setAlpha(0);
      item.y += 16;
      this.tweens.add({
        targets: item,
        alpha: 1,
        y: item.y - 16,
        duration: 360,
        delay: index * 70,
        ease: "Cubic.easeOut",
      });
    });
  }

  onExternalStateChange() {
    this.saveData = this.registry.get("saveData") ?? this.saveData;
    this.refreshEducationView();
  }
}

class CareerScene extends Phaser.Scene {
  constructor() {
    super("CareerScene");
    this.jobCards = [];
  }

  create() {
    this.saveData = this.registry.get("saveData") ?? loadSave();
    this.careerTrack = getCareerTrack(this.saveData);

    this.background = this.add.graphics();
    this.root = this.add.container(0, 0);
    this.headerCard = createRoundedPanel(this, { panelAlpha: 0.97, radius: 22, shadowAlpha: 0.2 });
    this.currentCard = createRoundedPanel(this, { panelAlpha: 0.97, radius: 22, shadowAlpha: 0.2 });
    this.listCard = createRoundedPanel(this, { panelAlpha: 0.97, radius: 22, shadowAlpha: 0.2 });
    this.footerCard = createRoundedPanel(this, { panelAlpha: 0.97, radius: 22, shadowAlpha: 0.2 });
    this.root.add([this.headerCard, this.currentCard, this.listCard, this.footerCard]);

    this.titleText = this.add.text(0, 0, "Карьера и рост", textStyle(30, COLORS.text, "700"));
    this.subtitleText = this.add.text(0, 0, "Экран показывает текущую работу, доступные роли и требования по навыкам и образованию.", {
      ...textStyle(15, COLORS.text, "500"),
      wordWrap: { width: 420 },
    });
    this.root.add([this.titleText, this.subtitleText]);

    this.currentJobTitle = this.add.text(0, 0, "", textStyle(24, COLORS.text, "700"));
    this.currentJobMeta = this.add.text(0, 0, "", { ...textStyle(15, COLORS.text, "500"), wordWrap: { width: 420 } });
    this.currentJobStats = this.add.text(0, 0, "", { ...textStyle(14, COLORS.text, "600"), wordWrap: { width: 420 } });
    this.root.add([this.currentJobTitle, this.currentJobMeta, this.currentJobStats]);

    this.jobsGroup = this.add.container(0, 0);
    this.jobsScroll = createVerticalScrollController(this, this.jobsGroup);
    this.root.add(this.jobsGroup);

    this.backButton = createRoundedButton(this, {
      label: "Назад",
      fillColor: COLORS.neutral,
      fontSize: 16,
      onClick: () => this.scene.start("MainGameScene"),
    });
    this.root.add(this.backButton);

    this.buildCareerCards();
    this.scale.on("resize", this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off("resize", this.handleResize, this);
    });

    this.handleResize(this.scale.gameSize);
    this.refreshCareerView();
    this.animateCareerIntro();
    ensureEventQueue(this, 520);
  }

  buildCareerCards() {
    this.jobCards.forEach((card) => card.destroy());
    this.jobCards = [];
    this.jobsGroup.removeAll(true);

    this.careerTrack.forEach((job) => {
      const card = this.createCareerCard(job);
      this.jobCards.push(card);
      this.jobsGroup.add(card);
    });
  }

  createCareerCard(job) {
    const container = this.add.container(0, 0);
    const shadow = this.add.graphics();
    const body = this.add.graphics();
    const chip = this.add.graphics();
    const chipText = this.add.text(0, 0, "", textStyle(13, COLORS.text, "700")).setOrigin(0.5);
    const badge = this.add.graphics();
    const title = this.add.text(0, 0, job.name, textStyle(20, COLORS.text, "700"));
    const meta = this.add.text(0, 0, "", { ...textStyle(14, COLORS.text, "500"), wordWrap: { width: 440 } });
    const status = this.add.text(0, 0, "", { ...textStyle(13, COLORS.text, "700"), wordWrap: { width: 200 } });
    container.shadow = shadow;
    container.body = body;
    container.chip = chip;
    container.chipText = chipText;
    container.badge = badge;
    container.titleText = title;
    container.metaText = meta;
    container.statusText = status;
    container.job = job;
    container.add([shadow, body, chip, chipText, badge, title, meta, status]);
    return container;
  }

  refreshCareerView() {
    this.saveData = this.registry.get("saveData") ?? this.saveData;
    this.careerTrack = getCareerTrack(this.saveData);

    this.currentJobTitle.setText(this.saveData.currentJob.name);
    this.currentJobMeta.setText(`Текущая ставка: ${formatMoney(this.saveData.currentJob.salaryPerDay)} ₽ в день • график ${this.saveData.currentJob.schedule}`);
    this.currentJobStats.setText(`Профессионализм ${this.saveData.skills.professionalism} • Образование ${this.saveData.education.educationLevel} • Дней на работе ${this.saveData.currentJob.daysAtWork}`);

    this.jobCards.forEach((card, index) => {
      const job = this.careerTrack[index];
      card.job = job;
      const statusText = job.current
        ? (job.unlocked ? "Требования выполнены" : "")
        : job.unlocked
          ? "Можно получить автоматически"
          : `Нужно: проф. +${job.missingProfessionalism}, образование ${job.educationRequiredLabel}`;
      card.titleText.setText(job.name);
      card.metaText.setText(`Ставка ${formatMoney(job.salaryPerDay)} ₽ в день • график ${job.schedule} • уровень ${job.level}`);
      card.statusText.setText(statusText);
      card.chipText.setText(statusText);
    });

    this.jobsScroll.reset();
    this.handleResize(this.scale.gameSize);
  }

  handleResize(gameSize) {
    const width = gameSize.width;
    const height = gameSize.height;
    const safeX = Math.max(20, width * 0.04);
    const safeY = Math.max(20, height * 0.035);
    const contentWidth = width - safeX * 2;
    const headerHeight = 132;
    const currentHeight = 134;
    const footerHeight = 86;
    const listY = safeY + headerHeight + currentHeight + 34;
    const listHeight = height - listY - footerHeight - safeY - 14;

    this.drawCareerBackground(width, height);
    this.headerCard.resize(safeX, safeY, contentWidth, headerHeight);
    this.currentCard.resize(safeX, safeY + headerHeight + 14, contentWidth, currentHeight);
    this.listCard.resize(safeX, listY, contentWidth, listHeight);
    this.footerCard.resize(safeX, height - safeY - footerHeight, contentWidth, footerHeight);

    this.titleText.setPosition(safeX + 22, safeY + 20);
    this.subtitleText.setPosition(safeX + 22, safeY + 60).setWordWrapWidth(contentWidth - 44);

    this.currentJobTitle.setPosition(safeX + 22, safeY + headerHeight + 34);
    this.currentJobMeta.setPosition(safeX + 22, safeY + headerHeight + 72).setWordWrapWidth(contentWidth - 44);
    this.currentJobStats.setPosition(safeX + 22, safeY + headerHeight + 98).setWordWrapWidth(contentWidth - 44);

    this.backButton.resize(Math.min(320, contentWidth - 28), 54);
    this.backButton.setPosition(safeX + contentWidth / 2, height - safeY - footerHeight / 2);

    const innerX = safeX + 18;
    const innerY = listY + 18;
    const innerWidth = contentWidth - 36;
    const cardHeight = 118;
    const gap = 14;
    this.jobsScroll.resize(innerX, innerY, innerWidth, listHeight - 36);
    const totalHeight = this.jobCards.length * cardHeight + Math.max(0, this.jobCards.length - 1) * gap;
    this.jobsScroll.setContentHeight(totalHeight);

    this.jobCards.forEach((card, index) => {
      card.setPosition(0, index * (cardHeight + gap));
      this.layoutCareerCard(card, innerWidth, cardHeight);
    });
  }

  layoutCareerCard(card, width, height) {
    card.shadow.clear();
    card.shadow.fillStyle(COLORS.shadow, 0.16);
    card.shadow.fillRoundedRect(8, 10, width, height, 18);
    card.body.clear();
    card.body.fillStyle(COLORS.white, 1);
    card.body.lineStyle(1, COLORS.line, 1);
    card.body.fillRoundedRect(0, 0, width, height, 18);
    card.body.strokeRoundedRect(0, 0, width, height, 18);
    card.badge.clear();
    card.badge.fillStyle(card.job.current ? COLORS.accent : card.job.unlocked ? COLORS.sage : COLORS.neutral, card.job.current ? 0.26 : 0.22);
    
    // Draw chip for current role (if unlocked) and unlocked/locked jobs
    if (card.chipText.text !== "") {
      card.chipText.setText(card.chipText.text);
      const chipWidth = Math.max(120, card.chipText.width + 28);
      card.chip.clear();
      card.chip.fillStyle(card.job.unlocked ? COLORS.sage : COLORS.neutral, 0.22);
      card.chip.fillRoundedRect(18, 16, chipWidth, 28, 14);
      card.chipText.setPosition(18 + chipWidth / 2, 30);
      card.chipText.setColor(card.job.unlocked ? "#4A7C68" : "#6B6258");
      card.chip.setVisible(true);
      card.chipText.setVisible(true);
    } else {
      card.chip.clear();
      card.chip.setVisible(false);
      card.chipText.setVisible(false);
    }
    
    card.titleText.setPosition(18, 52);
    card.metaText.setPosition(18, 78).setWordWrapWidth(width - 36);
    card.statusText.setVisible(false);
  }

  drawCareerBackground(width, height) {
    this.background.clear();
    this.background.fillStyle(COLORS.accent, 0.1);
    this.background.fillCircle(width * 0.84, height * 0.12, Math.min(width, height) * 0.14);
    this.background.fillStyle(COLORS.blue, 0.08);
    this.background.fillCircle(width * 0.14, height * 0.82, Math.min(width, height) * 0.18);
    this.background.fillStyle(COLORS.sage, 0.08);
    this.background.fillEllipse(width * 0.52, height * 0.94, width * 0.74, height * 0.18);
  }

  animateCareerIntro() {
    [this.headerCard, this.currentCard, this.listCard, this.footerCard].forEach((item, index) => {
      item.setAlpha(0);
      item.y += 14;
      this.tweens.add({
        targets: item,
        alpha: 1,
        y: item.y - 14,
        duration: 340,
        delay: index * 60,
        ease: "Cubic.easeOut",
      });
    });
  }

  onExternalStateChange() {
    this.refreshCareerView();
  }
}

class FinanceScene extends Phaser.Scene {
  constructor() {
    super("FinanceScene");
    this.contentItems = [];
  }

  create() {
    this.saveData = this.registry.get("saveData") ?? loadSave();
    this.financeOverview = getFinanceOverview(this.saveData);
    this.financeActions = getFinanceActions(this.saveData);

    this.background = this.add.graphics();
    this.root = this.add.container(0, 0);

    this.headerCard = createRoundedPanel(this, { panelAlpha: 0.97, radius: 22, shadowAlpha: 0.2 });
    this.balanceCard = createRoundedPanel(this, { panelAlpha: 0.97, radius: 22, shadowAlpha: 0.2 });
    this.cashflowCard = createRoundedPanel(this, { panelAlpha: 0.97, radius: 22, shadowAlpha: 0.2 });
    this.contentCard = createRoundedPanel(this, { panelAlpha: 0.97, radius: 22, shadowAlpha: 0.2 });
    this.footerCard = createRoundedPanel(this, { panelAlpha: 0.97, radius: 22, shadowAlpha: 0.2 });
    this.root.add([this.headerCard, this.balanceCard, this.cashflowCard, this.contentCard, this.footerCard]);

    this.titleText = this.add.text(0, 0, "Финансы", textStyle(30, COLORS.text, "700"));
    this.subtitleText = this.add.text(0, 0, "Здесь видны свободные деньги, резерв, ежемесячная нагрузка и активные инвестиции.", {
      ...textStyle(15, COLORS.text, "500"),
      wordWrap: { width: 440 },
    });
    this.root.add([this.titleText, this.subtitleText]);

    this.liquidTitle = this.add.text(0, 0, "Свободные деньги", textStyle(14, COLORS.text, "600"));
    this.liquidValue = this.add.text(0, 0, "", textStyle(28, COLORS.text, "700"));
    this.reserveTitle = this.add.text(0, 0, "Резерв", textStyle(14, COLORS.text, "600"));
    this.reserveValue = this.add.text(0, 0, "", textStyle(28, COLORS.text, "700"));
    this.root.add([this.liquidTitle, this.liquidValue, this.reserveTitle, this.reserveValue]);

    this.expensesTitle = this.add.text(0, 0, "Ежемесячный поток", textStyle(18, COLORS.text, "700"));
    this.expensesMeta = this.add.text(0, 0, "", {
      ...textStyle(14, COLORS.text, "500"),
      wordWrap: { width: 420 },
    });
    this.expensesDetails = this.add.text(0, 0, "", {
      ...textStyle(14, COLORS.text, "600"),
      wordWrap: { width: 420 },
    });
    this.root.add([this.expensesTitle, this.expensesMeta, this.expensesDetails]);

    this.contentGroup = this.add.container(0, 0);
    this.contentScroll = createVerticalScrollController(this, this.contentGroup);
    this.root.add(this.contentGroup);

    this.actionModal = createEventModal(this, {
      width: 380,
      height: 430,
      primaryLabel: "Подтвердить",
      secondaryLabel: "Отмена",
    });
    this.feedbackModal = createNotificationModal(this, {
      primaryLabel: "Понятно",
      secondaryLabel: "Закрыть",
    });
    this.root.add([this.actionModal, this.feedbackModal]);

    this.backButton = createRoundedButton(this, {
      label: "Назад",
      fillColor: COLORS.neutral,
      fontSize: 16,
      onClick: () => this.scene.start("MainGameScene"),
    });
    this.root.add(this.backButton);

    this.scale.on("resize", this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off("resize", this.handleResize, this);
    });

    this.refreshFinanceView();
    this.handleResize(this.scale.gameSize);
    this.animateFinanceIntro();
    ensureEventQueue(this, 520);
  }

  refreshFinanceView() {
    this.saveData = this.registry.get("saveData") ?? this.saveData;
    this.financeOverview = getFinanceOverview(this.saveData);
    this.financeActions = getFinanceActions(this.saveData);

    this.liquidValue.setText(`${formatMoney(this.financeOverview.liquidMoney)} ₽`);
    this.reserveValue.setText(`${formatMoney(this.financeOverview.reserveFund)} ₽`);
    this.expensesMeta.setText(
      `Доход в месяц: ${formatMoney(this.financeOverview.monthlyIncome)} ₽ • Расходы: ${formatMoney(this.financeOverview.monthlyExpensesTotal)} ₽ • Баланс: ${formatMoney(this.financeOverview.monthlyBalance)} ₽`,
    );
    this.expensesDetails.setText(
      [
        this.financeOverview.expenseLines.map((item) => `${item.label}: ${formatMoney(item.amount)} ₽`).join(" • "),
        this.financeOverview.lastMonthlySettlement
          ? `Последнее списание: ${formatMoney(this.financeOverview.lastMonthlySettlement.totalCharged)} ₽, из резерва ${formatMoney(this.financeOverview.lastMonthlySettlement.reservePaid)} ₽`
          : "Ежемесячное списание ещё не срабатывало в этом сохранении.",
      ].join("\n"),
    );

    this.buildContent();
  }

  buildContent() {
    this.contentGroup.removeAll(true);
    this.contentItems = [];
    let cursorY = 0;

    const actionsTitle = this.add.text(0, cursorY, "Финансовые шаги", textStyle(20, COLORS.text, "700"));
    this.contentGroup.add(actionsTitle);
    this.contentItems.push(actionsTitle);
    cursorY += 38;

    const isMobile = this.scale.gameSize.width < 900;
    const gap = 18;
    const columns = isMobile ? 1 : 2;
    const cardWidth = this.contentInnerWidth ? (columns === 1 ? this.contentInnerWidth : (this.contentInnerWidth - gap) / 2) : 320;
    const actionHeight = isMobile ? 220 : 196;

    this.financeActions.forEach((action, index) => {
      const card = this.createFinanceActionCard(action);
      const row = Math.floor(index / columns);
      const column = index % columns;
      card.setPosition(column * (cardWidth + gap), cursorY + row * (actionHeight + gap));
      this.layoutFinanceActionCard(card, cardWidth, actionHeight);
      this.contentGroup.add(card);
      this.contentItems.push(card);
    });

    cursorY += Math.ceil(this.financeActions.length / columns) * (actionHeight + gap);
    cursorY += 10;

    const investTitle = this.add.text(0, cursorY, "Инвестиции и накопления", textStyle(20, COLORS.text, "700"));
    this.contentGroup.add(investTitle);
    this.contentItems.push(investTitle);
    cursorY += 40;

    if (!this.financeOverview.investments.length) {
      const emptyState = this.add.text(
        0,
        cursorY,
        "Активных вложений пока нет. Можно начать с резерва или первого вклада.",
        { ...textStyle(15, COLORS.text, "500"), wordWrap: { width: Math.max(280, this.contentInnerWidth ?? 320) } },
      );
      this.contentGroup.add(emptyState);
      this.contentItems.push(emptyState);
      cursorY += 56;
    } else {
      this.financeOverview.investments.forEach((investment, index) => {
        const card = this.createInvestmentCard(investment);
        card.setPosition(0, cursorY + index * 142);
        this.layoutInvestmentCard(card, Math.max(280, this.contentInnerWidth ?? 320), 126);
        this.contentGroup.add(card);
        this.contentItems.push(card);
      });
      cursorY += this.financeOverview.investments.length * 142;
    }

    this.contentHeight = cursorY + 12;
    this.contentScroll.setContentHeight(this.contentHeight);
  }

  createFinanceActionCard(action) {
    const container = this.add.container(0, 0);
    const shadow = this.add.graphics();
    const body = this.add.graphics();
    const chip = this.add.graphics();
    const chipText = this.add.text(0, 0, "", textStyle(13, COLORS.text, "700")).setOrigin(0.5);

    if (action.amount > 0) {
      chipText.setText(`${formatMoney(action.amount)} ₽`);
    } else {
      chip.setVisible(false);
      chipText.setVisible(false);
    }

    const title = this.add.text(0, 0, action.title, textStyle(19, COLORS.text, "700"));
    const subtitle = this.add.text(0, 0, action.subtitle, {
      ...textStyle(14, COLORS.text, "500"),
      wordWrap: { width: 280 },
    });
    const description = this.add.text(0, 0, action.description, {
      ...textStyle(13, COLORS.text, "600"),
      wordWrap: { width: 280 },
    });

    const button = createRoundedButton(this, {
      label: action.available ? "Применить" : "Недоступно",
      fillColor: action.available ? COLORS[action.accentKey] : COLORS.neutral,
      fontSize: 14,
      onClick: () => {
        if (!action.available) {
          this.feedbackModal.show({
            title: action.title,
            description: action.reason,
            accentColor: COLORS[action.accentKey],
          });
          return;
        }

        this.actionModal.show({
          title: action.title,
          description: `${action.description}\n\nЭто действие займёт ${action.dayCost} игровой день.`,
          accentColor: COLORS[action.accentKey],
          primaryLabel: "Подтвердить",
          secondaryLabel: "Отмена",
          onPrimary: () => this.applyFinanceAction(action),
        });
      },
    });

    container.shadow = shadow;
    container.body = body;
    container.chip = chip;
    container.chipText = chipText;
    container.titleText = title;
    container.subtitleText = subtitle;
    container.descriptionText = description;
    container.button = button;
    container.action = action;
    container.add([shadow, body, chip, chipText, title, subtitle, description, button]);
    return container;
  }

  layoutFinanceActionCard(card, width, height) {
    const hasPrice = card.action && card.action.amount > 0;
    card.shadow.clear();
    card.shadow.fillStyle(COLORS.shadow, 0.16);
    card.shadow.fillRoundedRect(8, 10, width, height, 18);
    card.body.clear();
    card.body.fillStyle(COLORS.white, 1);
    card.body.lineStyle(1, COLORS.line, 1);
    card.body.fillRoundedRect(0, 0, width, height, 18);
    card.body.strokeRoundedRect(0, 0, width, height, 18);
    if (hasPrice) {
      card.chip.setVisible(true);
      if (card.chipText) card.chipText.setVisible(true);
      card.chip.clear();
      card.chip.fillStyle(COLORS[card.action.accentKey], 0.2);
      card.chip.fillRoundedRect(18, 18, 92, 28, 14);
      if (card.chipText) card.chipText.setPosition(64, 32);
    } else {
      card.chip.setVisible(false);
      if (card.chipText) card.chipText.setVisible(false);
    }
    card.titleText.setPosition(18, hasPrice ? 54 : 18).setWordWrapWidth(width - 36);
    card.subtitleText.setPosition(18, hasPrice ? 92 : 56).setWordWrapWidth(width - 36);
    card.descriptionText.setPosition(18, hasPrice ? 144 : 108).setWordWrapWidth(width - 36);
    card.button.resize(Math.min(152, width - 36), 42, card.action.available ? COLORS[card.action.accentKey] : COLORS.neutral);
    card.button.setPosition(width - 92, height - 30);
  }

  createInvestmentCard(investment) {
    const container = this.add.container(0, 0);
    const shadow = this.add.graphics();
    const body = this.add.graphics();
    const badge = this.add.graphics();
    const title = this.add.text(0, 0, investment.label ?? "Инвестиция", textStyle(18, COLORS.text, "700"));
    const meta = this.add.text(0, 0, "", {
      ...textStyle(14, COLORS.text, "500"),
      wordWrap: { width: 420 },
    });
    const status = this.add.text(0, 0, "", textStyle(13, COLORS.text, "700"));
    const button = createRoundedButton(this, {
      label: investment.state === "matured" ? "Забрать" : "Следить",
      fillColor: investment.state === "matured" ? COLORS.accent : COLORS.neutral,
      fontSize: 14,
      onClick: () => this.handleInvestmentAction(investment),
    });

    container.shadow = shadow;
    container.body = body;
    container.badge = badge;
    container.titleText = title;
    container.metaText = meta;
    container.statusText = status;
    container.button = button;
    container.investment = investment;
    container.add([shadow, body, badge, title, meta, status, button]);
    return container;
  }

  layoutInvestmentCard(card, width, height) {
    card.shadow.clear();
    card.shadow.fillStyle(COLORS.shadow, 0.16);
    card.shadow.fillRoundedRect(8, 10, width, height, 18);
    card.body.clear();
    card.body.fillStyle(COLORS.white, 1);
    card.body.lineStyle(1, COLORS.line, 1);
    card.body.fillRoundedRect(0, 0, width, height, 18);
    card.body.strokeRoundedRect(0, 0, width, height, 18);
    card.badge.clear();
    card.badge.fillStyle(card.investment.state === "matured" ? COLORS.accent : COLORS.sage, 0.2);
    card.badge.fillRoundedRect(18, 16, 150, 28, 14);
    card.titleText.setPosition(18, 24).setWordWrapWidth(width - 170);
    card.metaText.setText(
      `Вложено ${formatMoney(card.investment.amount)} ₽ • Выплата ${formatMoney(card.investment.payoutAmount)} ₽ • ${card.investment.state === "matured" ? "доступно к закрытию" : `ещё ${card.investment.daysLeft} д.`}`,
    );
    card.metaText.setPosition(18, 60).setWordWrapWidth(width - 170);
    card.statusText.setText(card.investment.state === "closed" ? "Закрыто" : card.investment.state === "matured" ? "Можно забрать" : "Активно");
    card.statusText.setPosition(30, 22);
    card.button.resize(126, 42, card.investment.state === "matured" ? COLORS.accent : COLORS.neutral);
    card.button.setPosition(width - 84, height - 32);
  }

  handleInvestmentAction(investment) {
    if (investment.state !== "matured") {
      this.feedbackModal.show({
        title: investment.label ?? "Инвестиция",
        description: `До закрытия осталось ${investment.daysLeft} д. Пока можно только наблюдать за прогрессом.`,
        accentColor: COLORS.blue,
      });
      return;
    }

    this.actionModal.show({
      title: investment.label ?? "Инвестиция",
      description: `Забрать ${formatMoney(investment.payoutAmount)} ₽ и закрыть вложение?`,
      accentColor: COLORS.accent,
      primaryLabel: "Забрать",
      secondaryLabel: "Оставить",
      onPrimary: () => {
        const summary = collectInvestmentToSave(this.saveData, investment.id);
        persistSave(this, this.saveData);
        this.actionModal.hide();
        this.refreshFinanceView();
        this.handleResize(this.scale.gameSize);
        this.feedbackModal.show({
          title: "Инвестиция закрыта",
          description: summary,
          accentColor: COLORS.accent,
        });
      },
    });
  }

  applyFinanceAction(action) {
    const summary = applyFinanceActionToSave(this.saveData, action.id);
    persistSave(this, this.saveData);
    this.actionModal.hide();
    this.refreshFinanceView();
    this.handleResize(this.scale.gameSize);
    this.feedbackModal.show({
      title: action.title,
      description: summary,
      accentColor: COLORS[action.accentKey],
    });
  }

  handleResize(gameSize) {
    const width = gameSize.width;
    const height = gameSize.height;
    const safeX = Math.max(20, width * 0.04);
    const safeY = Math.max(20, height * 0.035);
    const contentWidth = width - safeX * 2;
    const headerHeight = 126;
    const summaryHeight = 108;
    const cashflowHeight = 128;
    const footerHeight = 86;
    const contentY = safeY + headerHeight + summaryHeight + cashflowHeight + 42;
    const contentHeight = height - contentY - footerHeight - safeY - 14;

    this.drawFinanceBackground(width, height);
    this.headerCard.resize(safeX, safeY, contentWidth, headerHeight);
    this.balanceCard.resize(safeX, safeY + headerHeight + 14, contentWidth, summaryHeight);
    this.cashflowCard.resize(safeX, safeY + headerHeight + summaryHeight + 28, contentWidth, cashflowHeight);
    this.contentCard.resize(safeX, contentY, contentWidth, contentHeight);
    this.footerCard.resize(safeX, height - safeY - footerHeight, contentWidth, footerHeight);

    this.titleText.setPosition(safeX + 22, safeY + 20);
    this.subtitleText.setPosition(safeX + 22, safeY + 60).setWordWrapWidth(contentWidth - 44);

    this.liquidTitle.setPosition(safeX + 22, safeY + headerHeight + 26);
    this.liquidValue.setPosition(safeX + 22, safeY + headerHeight + 50);
    this.reserveTitle.setPosition(safeX + contentWidth * 0.5, safeY + headerHeight + 26);
    this.reserveValue.setPosition(safeX + contentWidth * 0.5, safeY + headerHeight + 50);

    this.expensesTitle.setPosition(safeX + 22, safeY + headerHeight + summaryHeight + 40);
    this.expensesMeta.setPosition(safeX + 22, safeY + headerHeight + summaryHeight + 72).setWordWrapWidth(contentWidth - 44);
    this.expensesDetails.setPosition(safeX + 22, safeY + headerHeight + summaryHeight + 96).setWordWrapWidth(contentWidth - 44);

    this.backButton.resize(Math.min(320, contentWidth - 28), 54);
    this.backButton.setPosition(safeX + contentWidth / 2, height - safeY - footerHeight / 2);

    this.contentInnerWidth = contentWidth - 40;
    this.contentScroll.resize(safeX + 20, contentY + 20, this.contentInnerWidth, contentHeight - 40);
    this.buildContent();

    this.actionModal.resize(this.scale.gameSize);
    this.feedbackModal.resize(this.scale.gameSize);
  }

  drawFinanceBackground(width, height) {
    this.background.clear();
    this.background.fillStyle(COLORS.sage, 0.1);
    this.background.fillCircle(width * 0.84, height * 0.14, Math.min(width, height) * 0.14);
    this.background.fillStyle(COLORS.accent, 0.09);
    this.background.fillCircle(width * 0.12, height * 0.82, Math.min(width, height) * 0.18);
    this.background.fillStyle(COLORS.blue, 0.08);
    this.background.fillEllipse(width * 0.52, height * 0.94, width * 0.74, height * 0.18);
  }

  animateFinanceIntro() {
    [this.headerCard, this.balanceCard, this.cashflowCard, this.contentCard, this.footerCard].forEach((item, index) => {
      item.setAlpha(0);
      item.y += 16;
      this.tweens.add({
        targets: item,
        alpha: 1,
        y: item.y - 16,
        duration: 360,
        delay: index * 60,
        ease: "Cubic.easeOut",
      });
    });
  }

  onExternalStateChange() {
    this.refreshFinanceView();
    this.handleResize(this.scale.gameSize);
  }
}

class SchoolScene extends Phaser.Scene {
  constructor() {
    super("SchoolScene");
    this.lessonNodes = [];
  }

  create(data = {}) {
    this.saveData = this.registry.get("saveData") ?? loadSave();
    this.courseId = data.courseId;
    this.returnScene = data.returnScene ?? "EducationScene";
    this.completedNodes = 0;

    this.background = this.add.graphics();
    this.root = this.add.container(0, 0);
    this.card = createRoundedPanel(this, { panelAlpha: 0.97, radius: 24, shadowAlpha: 0.22 });
    this.root.add(this.card);

    this.titleText = this.add.text(0, 0, "Школьный модуль", textStyle(28, COLORS.text, "700"));
    this.subtitleText = this.add.text(0, 0, "Разложи день на три маленьких учебных шага: чтение, конспект и повторение.", {
      ...textStyle(15, COLORS.text, "500"),
      align: "center",
      wordWrap: { width: 360 },
    });
    this.statusText = this.add.text(0, 0, "0 / 3 шага завершено", textStyle(15, COLORS.text, "600"));
    this.root.add([this.titleText, this.subtitleText, this.statusText]);

    this.lessonGroup = this.add.container(0, 0);
    this.root.add(this.lessonGroup);
    this.buildLessonNodes();

    this.finishButton = createRoundedButton(this, {
      label: "Завершить учебный день",
      fillColor: COLORS.accent,
      fontSize: 17,
      onClick: () => this.finishStudySession(),
    });
    this.finishButton.setAlpha(0.72);
    this.finishButton.hit.input.enabled = false;

    this.backButton = createRoundedButton(this, {
      label: "Назад",
      fillColor: COLORS.neutral,
      fontSize: 16,
      onClick: () => this.scene.start(this.returnScene, { selectedProgramId: this.courseId }),
    });
    this.root.add([this.finishButton, this.backButton]);

    this.scale.on("resize", this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off("resize", this.handleResize, this);
    });

    this.handleResize(this.scale.gameSize);
    this.animateIn();
    ensureEventQueue(this, 420);
  }

  buildLessonNodes() {
    const labels = [
      ["Чтение", "Внимательно пройти материал"],
      ["Конспект", "Выделить главное короткими тезисами"],
      ["Повтор", "Закрепить идею перед следующим днём"],
    ];

    labels.forEach(([title, subtitle]) => {
      const node = this.add.container(0, 0);
      const shadow = this.add.graphics();
      const body = this.add.graphics();
      const titleText = this.add.text(0, 0, title, textStyle(18, COLORS.text, "700")).setOrigin(0.5);
      const subtitleText = this.add.text(0, 0, subtitle, { ...textStyle(13, COLORS.text, "500"), align: "center", wordWrap: { width: 160 } }).setOrigin(0.5);
      const hit = this.add.rectangle(0, 0, 180, 120, 0x000000, 0).setOrigin(0.5);
      hit.setInteractive({ useHandCursor: true });
      hit.on("pointerup", () => this.completeLessonNode(node));
      node.shadow = shadow;
      node.body = body;
      node.titleText = titleText;
      node.subtitleText = subtitleText;
      node.hit = hit;
      node.done = false;
      node.add([shadow, body, titleText, subtitleText, hit]);
      this.lessonNodes.push(node);
      this.lessonGroup.add(node);
    });
  }

  completeLessonNode(node) {
    if (node.done) {
      return;
    }

    node.done = true;
    this.completedNodes += 1;
    this.statusText.setText(`${this.completedNodes} / 3 шага завершено`);
    this.layoutLessonNode(node, node.cardWidth, node.cardHeight, true);
    this.tweens.add({
      targets: node,
      scale: 1.03,
      duration: 130,
      yoyo: true,
    });

    if (this.completedNodes >= this.lessonNodes.length) {
      this.finishButton.setAlpha(1);
      this.finishButton.hit.input.enabled = true;
    }
  }

  finishStudySession() {
    const result = advanceEducationCourseDay(this.saveData, this.courseId);
    persistSave(this, this.saveData);
    this.scene.start(this.returnScene, {
      selectedProgramId: this.courseId,
      sessionSummary: result.summary,
      sessionCompleted: result.completed,
    });
  }

  handleResize(gameSize) {
    const width = gameSize.width;
    const height = gameSize.height;
    const safeX = Math.max(20, width * 0.05);
    const safeY = Math.max(20, height * 0.04);
    const cardWidth = width - safeX * 2;
    const cardHeight = height - safeY * 2;
    const isMobile = width < 720;

    this.drawSchoolBackground(width, height);
    this.card.resize(safeX, safeY, cardWidth, cardHeight, 24, 0.98);
    this.titleText.setPosition(width / 2, safeY + 28).setOrigin(0.5, 0);
    this.subtitleText.setPosition(width / 2, safeY + 72).setOrigin(0.5, 0);
    this.statusText.setPosition(width / 2, safeY + 138).setOrigin(0.5, 0);

    const columns = isMobile ? 1 : 3;
    const gap = 16;
    const nodeWidth = columns === 1 ? cardWidth - 40 : (cardWidth - 40 - gap * 2) / 3;
    const nodeHeight = 128;
    this.lessonNodes.forEach((node, index) => {
      const x = columns === 1
        ? safeX + cardWidth / 2
        : safeX + 20 + nodeWidth / 2 + index * (nodeWidth + gap);
      const y = safeY + (isMobile ? 220 + index * 148 : 240);
      node.setPosition(x, y);
      this.layoutLessonNode(node, nodeWidth, nodeHeight, node.done);
    });

    this.finishButton.resize(Math.min(280, cardWidth - 40), 52);
    this.finishButton.setPosition(width / 2, height - safeY - 82);
    this.backButton.resize(120, 46);
    this.backButton.setPosition(safeX + 70, height - safeY - 30);
  }

  layoutLessonNode(node, width, height, done) {
    node.cardWidth = width;
    node.cardHeight = height;
    node.shadow.clear();
    node.shadow.fillStyle(COLORS.shadow, 0.16);
    node.shadow.fillRoundedRect(-width / 2 + 8, -height / 2 + 10, width, height, 20);
    node.body.clear();
    node.body.fillStyle(done ? COLORS.sage : COLORS.white, done ? 0.34 : 1);
    node.body.lineStyle(1, done ? COLORS.sage : COLORS.line, 1);
    node.body.fillRoundedRect(-width / 2, -height / 2, width, height, 20);
    node.body.strokeRoundedRect(-width / 2, -height / 2, width, height, 20);
    node.hit.width = width;
    node.hit.height = height;
    node.titleText.setPosition(0, -24);
    node.subtitleText.setPosition(0, 18).setWordWrapWidth(width - 28);
  }

  drawSchoolBackground(width, height) {
    this.background.clear();
    this.background.fillStyle(COLORS.blue, 0.08);
    this.background.fillCircle(width * 0.82, height * 0.16, Math.min(width, height) * 0.16);
    this.background.fillStyle(COLORS.accent, 0.1);
    this.background.fillCircle(width * 0.14, height * 0.82, Math.min(width, height) * 0.18);
    this.background.fillStyle(COLORS.white, 0.75);
    this.background.fillRoundedRect(width * 0.12, height * 0.12, width * 0.76, height * 0.08, 18);
    this.background.fillStyle(COLORS.sage, 0.12);
    this.background.fillRoundedRect(width * 0.18, height * 0.24, width * 0.64, height * 0.04, 14);
  }

  animateIn() {
    [this.card, this.lessonGroup, this.finishButton].forEach((item, index) => {
      item.setAlpha(0);
      item.y += 12;
      this.tweens.add({
        targets: item,
        alpha: 1,
        y: item.y - 12,
        duration: 320,
        delay: index * 70,
        ease: "Cubic.easeOut",
      });
    });
  }

  onExternalStateChange() {
    this.saveData = this.registry.get("saveData") ?? this.saveData;
  }
}

class InstituteScene extends Phaser.Scene {
  constructor() {
    super("InstituteScene");
    this.researchNodes = [];
  }

  create(data = {}) {
    this.saveData = this.registry.get("saveData") ?? loadSave();
    this.courseId = data.courseId;
    this.returnScene = data.returnScene ?? "EducationScene";
    this.currentStep = 0;

    this.background = this.add.graphics();
    this.root = this.add.container(0, 0);
    this.card = createRoundedPanel(this, { panelAlpha: 0.97, radius: 26, shadowAlpha: 0.22 });
    this.root.add(this.card);

    this.titleText = this.add.text(0, 0, "Институт и практика", textStyle(28, COLORS.text, "700"));
    this.subtitleText = this.add.text(0, 0, "Собери учебный день как маленький проект: теория, данные, аргумент и финальная сборка.", {
      ...textStyle(15, COLORS.text, "500"),
      align: "center",
      wordWrap: { width: 380 },
    });
    this.statusText = this.add.text(0, 0, "Шаг 1 из 4", textStyle(15, COLORS.text, "600"));
    this.root.add([this.titleText, this.subtitleText, this.statusText]);

    this.graph = this.add.graphics();
    this.root.add(this.graph);
    this.buildResearchNodes();

    this.completeButton = createRoundedButton(this, {
      label: "Завершить день в институте",
      fillColor: COLORS.sage,
      fontSize: 17,
      onClick: () => this.finishInstituteSession(),
    });
    this.completeButton.setAlpha(0.72);
    this.completeButton.hit.input.enabled = false;

    this.backButton = createRoundedButton(this, {
      label: "Назад",
      fillColor: COLORS.neutral,
      fontSize: 16,
      onClick: () => this.scene.start(this.returnScene, { selectedProgramId: this.courseId }),
    });
    this.root.add([this.completeButton, this.backButton]);

    this.scale.on("resize", this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off("resize", this.handleResize, this);
    });

    this.handleResize(this.scale.gameSize);
    this.animateIn();
    ensureEventQueue(this, 420);
  }

  buildResearchNodes() {
    const nodes = [
      ["Теория", -1, -1],
      ["Данные", 1, -1],
      ["Аргумент", -1, 1],
      ["Вывод", 1, 1],
    ];

    nodes.forEach(([label]) => {
      const node = this.add.container(0, 0);
      const body = this.add.graphics();
      const text = this.add.text(0, 0, label, textStyle(15, COLORS.text, "700")).setOrigin(0.5);
      const hit = this.add.circle(0, 0, 44, 0x000000, 0);
      hit.setInteractive({ useHandCursor: true });
      hit.on("pointerup", () => this.advanceResearchNode(node));
      node.body = body;
      node.text = text;
      node.hit = hit;
      node.done = false;
      node.add([body, text, hit]);
      this.researchNodes.push(node);
      this.root.add(node);
    });
  }

  advanceResearchNode(node) {
    const expectedNode = this.researchNodes[this.currentStep];
    if (node !== expectedNode || node.done) {
      this.tweens.add({ targets: node, angle: 4, duration: 70, yoyo: true });
      return;
    }

    node.done = true;
    this.currentStep += 1;
    this.statusText.setText(`Шаг ${Math.min(this.currentStep + 1, 4)} из 4`);
    this.drawResearchNode(node, true);

    if (this.currentStep >= this.researchNodes.length) {
      this.statusText.setText("Проект собран");
      this.completeButton.setAlpha(1);
      this.completeButton.hit.input.enabled = true;
    }
  }

  finishInstituteSession() {
    const result = advanceEducationCourseDay(this.saveData, this.courseId);
    persistSave(this, this.saveData);
    this.scene.start(this.returnScene, {
      selectedProgramId: this.courseId,
      sessionSummary: result.summary,
      sessionCompleted: result.completed,
    });
  }

  handleResize(gameSize) {
    const width = gameSize.width;
    const height = gameSize.height;
    const safeX = Math.max(20, width * 0.05);
    const safeY = Math.max(20, height * 0.04);
    const cardWidth = width - safeX * 2;
    const cardHeight = height - safeY * 2;

    this.drawInstituteBackground(width, height);
    this.card.resize(safeX, safeY, cardWidth, cardHeight, 24, 0.98);
    this.titleText.setPosition(width / 2, safeY + 28).setOrigin(0.5, 0);
    this.subtitleText.setPosition(width / 2, safeY + 72).setOrigin(0.5, 0);
    this.statusText.setPosition(width / 2, safeY + 136).setOrigin(0.5, 0);

    const centerX = width / 2;
    const centerY = safeY + cardHeight * 0.54;
    const offsetX = Math.min(112, cardWidth * 0.24);
    const offsetY = Math.min(92, cardHeight * 0.14);
    const positions = [
      [centerX - offsetX, centerY - offsetY],
      [centerX + offsetX, centerY - offsetY],
      [centerX - offsetX, centerY + offsetY],
      [centerX + offsetX, centerY + offsetY],
    ];

    this.graph.clear();
    this.graph.lineStyle(3, COLORS.line, 1);
    this.graph.strokeLineShape(new Phaser.Geom.Line(...positions[0], ...positions[1]));
    this.graph.strokeLineShape(new Phaser.Geom.Line(...positions[0], ...positions[2]));
    this.graph.strokeLineShape(new Phaser.Geom.Line(...positions[1], ...positions[3]));
    this.graph.strokeLineShape(new Phaser.Geom.Line(...positions[2], ...positions[3]));

    this.researchNodes.forEach((node, index) => {
      node.setPosition(positions[index][0], positions[index][1]);
      this.drawResearchNode(node, node.done);
    });

    this.completeButton.resize(Math.min(300, cardWidth - 40), 52);
    this.completeButton.setPosition(width / 2, height - safeY - 82);
    this.backButton.resize(120, 46);
    this.backButton.setPosition(safeX + 70, height - safeY - 30);
  }

  drawResearchNode(node, done) {
    node.body.clear();
    node.body.fillStyle(done ? COLORS.sage : COLORS.white, done ? 0.42 : 1);
    node.body.lineStyle(2, done ? COLORS.sage : COLORS.line, 1);
    node.body.fillCircle(0, 0, 44);
    node.body.strokeCircle(0, 0, 44);
  }

  drawInstituteBackground(width, height) {
    this.background.clear();
    this.background.fillStyle(COLORS.sage, 0.08);
    this.background.fillCircle(width * 0.84, height * 0.12, Math.min(width, height) * 0.15);
    this.background.fillStyle(COLORS.blue, 0.08);
    this.background.fillCircle(width * 0.14, height * 0.82, Math.min(width, height) * 0.16);
    this.background.fillStyle(COLORS.white, 0.7);
    this.background.fillRoundedRect(width * 0.14, height * 0.12, width * 0.72, height * 0.06, 18);
    this.background.fillStyle(COLORS.text, 0.05);
    this.background.fillRoundedRect(width * 0.22, height * 0.24, width * 0.56, height * 0.02, 10);
  }

  animateIn() {
    [this.card, ...this.researchNodes, this.completeButton].forEach((item, index) => {
      item.setAlpha(0);
      item.y += 12;
      this.tweens.add({
        targets: item,
        alpha: 1,
        y: item.y - 12,
        duration: 320,
        delay: index * 55,
        ease: "Cubic.easeOut",
      });
    });
  }

  onExternalStateChange() {
    this.saveData = this.registry.get("saveData") ?? this.saveData;
  }
}

class EventQueueScene extends Phaser.Scene {
  constructor() {
    super("EventQueueScene");
    this.isProcessing = false;
  }

  create(data = {}) {
    this.saveData = this.registry.get("saveData") ?? loadSave();
    this.hostSceneKey = data.hostSceneKey ?? "MainGameScene";

    this.eventModal = createEventModal(this, {
      primaryLabel: "Выбрать",
      secondaryLabel: "Позже",
    });
    this.resultModal = createNotificationModal(this, {
      primaryLabel: "Продолжить",
      secondaryLabel: "Закрыть",
    });

    this.scale.on("resize", this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off("resize", this.handleResize, this);
    });

    this.handleResize(this.scale.gameSize);
    this.requestOpen(data.hostSceneKey, data.delay ?? 0);
  }

  handleResize(gameSize) {
    this.eventModal.resize(gameSize);
    this.resultModal.resize(gameSize);
  }

  requestOpen(hostSceneKey = this.hostSceneKey, delay = 0) {
    this.hostSceneKey = hostSceneKey ?? this.hostSceneKey;
    this.scene.bringToTop();

    if (delay > 0) {
      this.time.delayedCall(delay, () => this.tryOpenNextEvent());
      return;
    }

    this.tryOpenNextEvent();
  }

  tryOpenNextEvent() {
    if (this.isProcessing || this.eventModal.visible || this.resultModal.visible) {
      return;
    }

    this.saveData = this.registry.get("saveData") ?? this.saveData;
    const queuedEvent = consumePendingEvent(this.saveData);
    if (!queuedEvent) {
      return;
    }

    this.activeEvent = queuedEvent;
    this.isProcessing = true;
    persistSave(this, this.saveData);

    const [primaryChoice, secondaryChoice] = queuedEvent.choices;
    this.eventModal.show({
      title: queuedEvent.title,
      description: `${queuedEvent.description}\n\n1. ${primaryChoice.label} — ${primaryChoice.outcome}\n2. ${secondaryChoice.label} — ${secondaryChoice.outcome}`,
      accentColor: COLORS.sage,
      primaryLabel: primaryChoice.label,
      secondaryLabel: secondaryChoice.label,
      onPrimary: () => this.applyChoice(0),
      onSecondary: () => this.applyChoice(1),
    });
  }

  applyChoice(choiceIndex) {
    const summary = applyQueuedEventChoice(this.saveData, this.activeEvent, choiceIndex);
    persistSave(this, this.saveData);
    this.notifyHostScene();

    this.resultModal.show({
      title: this.activeEvent.title,
      description: summary,
      accentColor: COLORS.sage,
      primaryLabel: "Продолжить",
      secondaryLabel: "Закрыть",
      onPrimary: () => {
        this.isProcessing = false;
        this.time.delayedCall(220, () => this.tryOpenNextEvent());
      },
      onSecondary: () => {
        this.isProcessing = false;
      },
    });
  }

  notifyHostScene() {
    if (!this.hostSceneKey || !this.scene.isActive(this.hostSceneKey)) {
      return;
    }

    const hostScene = this.scene.get(this.hostSceneKey);
    hostScene.onExternalStateChange?.();
    hostScene.showToast?.("Новое событие применено");
  }
}

const config = {
  type: Phaser.AUTO,
  parent: "game-container",
  backgroundColor: "#F8F4ED",
  width: window.innerWidth,
  height: window.innerHeight,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.NO_CENTER,
  },
  scene: [
    MainGameScene,
    RecoveryScene,
    HomeScene,
    ShopScene,
    SocialScene,
    FunScene,
    CareerScene,
    FinanceScene,
    EducationScene,
    SchoolScene,
    InstituteScene,
    InteractiveWorkEventScene,
    EventQueueScene,
    // DebugPanelScene, // Temporarily disabled
  ],
};

new Phaser.Game(config);

function ensureEventQueue(scene, delay = 0) {
  if (scene.scene.isActive("EventQueueScene")) {
    const queueScene = scene.scene.get("EventQueueScene");
    queueScene.requestOpen(scene.scene.key, delay);
    scene.scene.bringToTop("EventQueueScene");
    return;
  }

  scene.scene.launch("EventQueueScene", {
    hostSceneKey: scene.scene.key,
    delay,
  });
  scene.scene.bringToTop("EventQueueScene");
}

function getEducationProgramIdFromCard(title) {
  const mapping = {
    "Книга по тайм-менеджменту": "time_management_book",
    "Онлайн-курс": "online_productivity_course",
    "Институт / переподготовка": "institute_retraining",
  };

  return mapping[title] ?? EDUCATION_PROGRAMS[0].id;
}

function getEducationMiniSceneKey(programId) {
  return programId === "institute_retraining" ? "InstituteScene" : "SchoolScene";
}

function createVerticalScrollController(scene, content) {
  const state = {
    viewportX: 0,
    viewportY: 0,
    viewportWidth: 0,
    viewportHeight: 0,
    contentHeight: 0,
    scrollY: 0,
    dragging: false,
    lastPointerY: 0,
  };

  const maskShape = scene.add.graphics().setVisible(false);
  content.setMask(maskShape.createGeometryMask());

  const isPointerInside = (pointer) =>
    pointer.x >= state.viewportX &&
    pointer.x <= state.viewportX + state.viewportWidth &&
    pointer.y >= state.viewportY &&
    pointer.y <= state.viewportY + state.viewportHeight;

  const applyPosition = () => {
    const minScroll = Math.min(0, state.viewportHeight - state.contentHeight);
    state.scrollY = Phaser.Math.Clamp(state.scrollY, minScroll, 0);
    content.setPosition(state.viewportX, state.viewportY + state.scrollY);
  };

  const handlePointerDown = (pointer) => {
    if (!isPointerInside(pointer) || state.contentHeight <= state.viewportHeight) {
      state.dragging = false;
      return;
    }

    state.dragging = true;
    state.lastPointerY = pointer.y;
  };

  const handlePointerUp = () => {
    state.dragging = false;
  };

  const handlePointerMove = (pointer) => {
    if (!state.dragging || !pointer.isDown || state.contentHeight <= state.viewportHeight) {
      return;
    }

    const deltaY = pointer.y - state.lastPointerY;
    state.lastPointerY = pointer.y;
    state.scrollY += deltaY;
    applyPosition();
  };

  const handleWheel = (pointer, _objects, _deltaX, deltaY) => {
    if (!isPointerInside(pointer) || state.contentHeight <= state.viewportHeight) {
      return;
    }

    state.scrollY -= deltaY * 0.5;
    applyPosition();
  };

  scene.input.on("pointerdown", handlePointerDown);
  scene.input.on("pointerup", handlePointerUp);
  scene.input.on("gameout", handlePointerUp);
  scene.input.on("pointermove", handlePointerMove);
  scene.input.on("wheel", handleWheel);

  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.input.off("pointerdown", handlePointerDown);
    scene.input.off("pointerup", handlePointerUp);
    scene.input.off("gameout", handlePointerUp);
    scene.input.off("pointermove", handlePointerMove);
    scene.input.off("wheel", handleWheel);
    maskShape.destroy();
  });

  return {
    resize(x, y, width, height) {
      state.viewportX = x;
      state.viewportY = y;
      state.viewportWidth = width;
      state.viewportHeight = height;
      maskShape.clear();
      maskShape.fillStyle(0xffffff, 1);
      maskShape.fillRect(x, y, width, height);
      applyPosition();
    },
    setContentHeight(contentHeight) {
      state.contentHeight = contentHeight;
      applyPosition();
    },
    reset() {
      state.scrollY = 0;
      applyPosition();
    },
  };
}

function resizeCard(card, x, y, width, height) {
  card.resize(x, y, width, height);
}

function mixHex(startHex, endHex, amount) {
  const start = Phaser.Display.Color.HexStringToColor(startHex);
  const end = Phaser.Display.Color.HexStringToColor(endHex);
  const color = Phaser.Display.Color.Interpolate.ColorWithColor(
    start,
    end,
    100,
    Phaser.Math.Clamp(amount * 100, 0, 100),
  );

  return Phaser.Display.Color.GetColor(color.r, color.g, color.b);
}
