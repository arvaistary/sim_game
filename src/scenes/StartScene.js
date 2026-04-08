import Phaser from 'phaser';
import {
  DEFAULT_SAVE,
  EDUCATION_PATHS,
} from '../game-state.js';
import { PersistenceSystem } from '../ecs/systems/PersistenceSystem.js';
import {
  COLORS,
  createRoundedButton,
  createRoundedPanel,
  createToastMessage,
  textStyle,
} from '../ui-kit.js';

export class StartScene extends Phaser.Scene {
  constructor() {
    super('StartScene');
  }

  create() {
    this.persistenceSystem = new PersistenceSystem();
    const hasExistingSave = this.persistenceSystem.hasSave();
    const existingSave = hasExistingSave ? this.persistenceSystem.loadSave() : null;
    const hasStartedGame = Boolean(existingSave?.playerName?.trim());
    if (hasExistingSave && hasStartedGame) {
      this.registry.set('saveData', existingSave);
      this.scene.start('MainGameScene');
      return;
    }

    this.saveData = {
      ...DEFAULT_SAVE,
      playerName: '',
    };
    this.selectedEducationPath = null;
    this.playerAge = 18;
    this.playerName = '';
    this.isNameInputActive = false;
    this.debugNameInput = false;

    this.cameras.main.setBackgroundColor(COLORS.background);

    this.root = this.add.container(0, 0);
    this.createHeader();
    this.createForm();
    this.createToast();

    this.scale.on('resize', this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.handleResize, this);
      this.input.off('pointerdown', this.handleGlobalPointerDown, this);
      this.input.off('pointermove', this.handleGlobalPointerMove, this);
      this.input.keyboard.off('keydown', this.handleNameInputKey, this);
    });

    this.handleResize(this.scale.gameSize);
  }

  createHeader() {
    this.headerCard = createRoundedPanel(this, { panelAlpha: 1, radius: 18, shadowAlpha: 0.22 });
    this.root.add(this.headerCard);

    this.headerTitle = this.add.text(0, 0, 'Создание персонажа', textStyle(28, COLORS.text, '700'));
    this.headerSubtitle = this.add.text(0, 0, 'Определите начало своего пути', textStyle(16, COLORS.text, '500'));
    this.root.add([this.headerTitle, this.headerSubtitle]);
  }

  createForm() {
    this.scrollContainer = this.add.container(0, 0);
    this.root.add(this.scrollContainer);

    this.createNameInput();
    this.createAgeSelector();
    this.createEducationSelection();
  }

  createNameInput() {
    const nameCard = createRoundedPanel(this, { panelAlpha: 1, radius: 18, shadowAlpha: 0.22 });
    this.nameCard = nameCard;
    this.scrollContainer.add(nameCard);

    const nameLabel = this.add.text(0, 0, 'Имя персонажа', textStyle(18, COLORS.text, '700'));
    this.nameLabel = nameLabel;
    const nameFocusHint = this.add.text(0, 0, 'Введите имя', textStyle(13, COLORS.accent, '700')).setOrigin(1, 0.5).setVisible(false);
    this.nameFocusHint = nameFocusHint;
    
    const nameInputBackground = createRoundedPanel(this, { panelAlpha: 1, radius: 12, shadowAlpha: 0, fillColor: 0xffffff });
    this.nameInputBackground = nameInputBackground;
    const nameValueText = this.add.text(0, 0, 'Введите имя', textStyle(16, 0xa0a0a0, '500')).setOrigin(0.5);
    this.nameValueText = nameValueText;
    
    const inputZone = this.add.zone(0, 0, 320, 44).setOrigin(0);
    inputZone.setInteractive({ useHandCursor: true });
    const normalInputFill = 0xffffff;
    const hoverInputFill = 0xf8f4ed;
    const activeInputFill = 0xf3ede3;
    this.nameInputState = { normalInputFill, hoverInputFill, activeInputFill };
    this.nameInputZone = inputZone;
    inputZone.on('pointerover', (pointer) => {
      if (this.debugNameInput) {
        console.log('[StartScene][name-input] pointerover', JSON.stringify({ x: pointer.worldX, y: pointer.worldY }));
      }
      if (!this.isNameInputActive) {
        this.paintNameInput(hoverInputFill);
      }
    });
    inputZone.on('pointerout', (pointer) => {
      if (this.debugNameInput) {
        console.log('[StartScene][name-input] pointerout', JSON.stringify({ x: pointer.worldX, y: pointer.worldY }));
      }
      if (!this.isNameInputActive) {
        this.paintNameInput(normalInputFill);
      }
    });
    inputZone.on('pointerdown', (pointer) => {
      if (this.debugNameInput) {
        console.log('[StartScene][name-input] pointerdown -> activate', JSON.stringify({ x: pointer.worldX, y: pointer.worldY }));
      }
      this.activateNameInput();
    });

    this.nameInput = {
      getText: () => this.playerName || '',
    };

    // Позиционируем элементы по центру контейнера
    nameValueText.setPosition(0, 0);
    inputZone.setPosition(0, 0);
    
    nameInputBackground.add([nameValueText, inputZone]);
    
    // Переопределяем resize для nameInputBackground, чтобы сохранять дочерние элементы по центру
    nameInputBackground.originalResize = nameInputBackground.resize;
    nameInputBackground.resize = (x, y, width, height, nextRadius, nextAlpha) => {
      nameInputBackground.originalResize(x, y, width, height, nextRadius, nextAlpha);
      // Обновляем размер интерактивной зоны
      inputZone.setSize(width, height);
      // Убеждаемся что nameValueText центрирован
      nameValueText.setPosition(width / 2, height / 2);
      inputZone.setPosition(0, 0);
    };
    
    this.scrollContainer.add([nameLabel, nameFocusHint, nameInputBackground]);
    this.handleGlobalPointerDown = (pointer) => {
      if (!this.nameInputBounds) {
        return;
      }
      const containsPointer = Phaser.Geom.Rectangle.Contains(this.nameInputBounds, pointer.worldX, pointer.worldY);
      if (this.debugNameInput) {
        console.log('[StartScene][name-input] global pointerdown', JSON.stringify({
          x: pointer.worldX,
          y: pointer.worldY,
          containsPointer,
          active: this.isNameInputActive,
        }));
      }
      if (containsPointer) {
        this.activateNameInput();
        return;
      }
      if (!containsPointer && this.isNameInputActive) {
        this.deactivateNameInput();
      }
    };
    this.handleGlobalPointerMove = (pointer) => {
      if (!this.nameInputBounds || this.isNameInputActive) {
        return;
      }
      const isHover = Phaser.Geom.Rectangle.Contains(this.nameInputBounds, pointer.worldX, pointer.worldY);
      this.paintNameInput(isHover ? this.nameInputState.hoverInputFill : this.nameInputState.normalInputFill);
    };
    this.input.on('pointerdown', this.handleGlobalPointerDown, this);
    this.input.on('pointermove', this.handleGlobalPointerMove, this);
    this.input.keyboard.on('keydown', this.handleNameInputKey, this);
  }

  createAgeSelector() {
    const ageCard = createRoundedPanel(this, { panelAlpha: 1, radius: 18, shadowAlpha: 0.22 });
    this.ageCard = ageCard;
    this.scrollContainer.add(ageCard);

    const ageLabel = this.add.text(0, 0, 'Начальный возраст', textStyle(18, COLORS.text, '700'));
    const ageHint = this.add.text(0, 0, 'Рекомендуется 14-25 лет', textStyle(14, COLORS.text, '500'));
    this.ageLabel = ageLabel;
    this.ageHint = ageHint;

    // Создаем контейнер для визуальной группировки возраста и кнопок
    const ageControlsContainer = this.add.container(0, 0);
    this.ageControlsContainer = ageControlsContainer;
    
    const ageValue = this.add.text(0, 0, '18 лет', textStyle(32, COLORS.accent, '700')).setOrigin(0, 0.5);
    this.ageValue = ageValue;

    const decreaseBtn = createRoundedButton(this, {
      label: '-',
      fillColor: COLORS.neutral,
      fontSize: 24,
      width: 56,
      height: 56,
      onClick: () => this.adjustAge(-1),
    });

    const increaseBtn = createRoundedButton(this, {
      label: '+',
      fillColor: COLORS.neutral,
      fontSize: 24,
      width: 56,
      height: 56,
      onClick: () => this.adjustAge(1),
    });
    this.decreaseBtn = decreaseBtn;
    this.increaseBtn = increaseBtn;

    // Добавляем элементы в контейнер
    ageControlsContainer.add([ageValue, decreaseBtn, increaseBtn]);

    this.scrollContainer.add([ageLabel, ageHint, ageControlsContainer]);
  }

  createEducationSelection() {
    const eduCard = createRoundedPanel(this, { panelAlpha: 1, radius: 18, shadowAlpha: 0.22 });
    this.eduCard = eduCard;
    this.scrollContainer.add(eduCard);

    const eduLabel = this.add.text(0, 0, 'Путь образования', textStyle(18, COLORS.text, '700'));
    const eduHint = this.add.text(0, 0, 'Выберите вариант и получите начальные навыки', textStyle(14, COLORS.text, '500'));
    this.eduLabel = eduLabel;
    this.eduHint = eduHint;
    
    // Добавляем label и hint в eduCard, а не в scrollContainer
    eduCard.add([eduLabel, eduHint]);

    this.eduButtons = [];
    EDUCATION_PATHS.forEach((path, index) => {
      const eduButton = createRoundedButton(this, {
        label: path.label,
        fillColor: COLORS.neutral,
        fontSize: 15,
        width: 320,
        height: 72,
        onClick: () => this.selectEducationPath(path, index),
      });
      this.eduButtons.push(eduButton);
      // Добавляем кнопки в eduCard
      eduCard.add(eduButton);
    });
  }

  createToast() {
    this.toast = createToastMessage(this, { width: 280, height: 52 });
    this.root.add(this.toast);
  }

  paintNameInput(fillColor, isFocused = false) {
    if (!this.nameInputBackground?.body) {
      return;
    }
    this.nameInputBackground.body.clear();
    this.nameInputBackground.body.fillStyle(fillColor, 1);
    this.nameInputBackground.body.lineStyle(isFocused ? 2 : 1, isFocused ? 0x000000 : COLORS.line, 1);
    this.nameInputBackground.body.fillRoundedRect(0, 0, this.nameInputBackground.panelWidth, this.nameInputBackground.panelHeight, 12);
    this.nameInputBackground.body.strokeRoundedRect(0, 0, this.nameInputBackground.panelWidth, this.nameInputBackground.panelHeight, 12);
  }

  activateNameInput() {
    this.isNameInputActive = true;
    this.paintNameInput(this.nameInputState.activeInputFill, true);
    this.nameFocusHint?.setVisible(true);
    this.syncNameInputText();
  }

  deactivateNameInput() {
    this.isNameInputActive = false;
    this.paintNameInput(this.nameInputState.normalInputFill, false);
    this.nameFocusHint?.setVisible(false);
    this.syncNameInputText();
  }

  handleNameInputKey(event) {
    if (!this.isNameInputActive) {
      return;
    }
    if (event.key === 'Enter' || event.key === 'Escape') {
      this.deactivateNameInput();
      return;
    }
    if (event.key === 'Backspace') {
      this.playerName = this.playerName.slice(0, -1);
      this.syncNameInputText();
      return;
    }
    if (event.key.length !== 1 || this.playerName.length >= 20) {
      return;
    }
    if (!/[\p{L}\p{N}\s\-']/u.test(event.key)) {
      return;
    }
    this.playerName += event.key;
    this.syncNameInputText();
  }

  syncNameInputText() {
    const hasName = this.playerName.trim().length > 0;
    if (!hasName) {
      const emptyStateText = this.isNameInputActive ? '|' : 'Введите имя';
      const emptyStateColor = this.isNameInputActive ? '#3c2f2f' : '#a0a0a0';
      this.nameValueText.setText(emptyStateText).setColor(emptyStateColor).setFontStyle('normal');
      return;
    }
    this.nameValueText.setText(this.playerName).setColor('#3c2f2f').setFontStyle('500');
  }

  adjustAge(delta) {
    const newAge = this.playerAge + delta;
    if (newAge >= 14 && newAge <= 30) {
      this.playerAge = newAge;
      this.ageValue.setText(`${newAge} лет`);
    }
  }

  selectEducationPath(path, index) {
    this.selectedEducationPath = path;
    this.eduButtons.forEach((btn, i) => {
      btn.setFillColor(i === index ? COLORS.accent : COLORS.neutral);
    });
    
    // Автоматически начинаем игру после выбора пути образования
    this.startGame();
  }

  validateForm() {
    const errors = [];

    const playerName = this.nameInput.getText();
    if (!playerName) {
      errors.push('Введите имя персонажа');
    } else if (playerName.length < 2 || playerName.length > 20) {
      errors.push('Имя должно содержать от 2 до 20 символов');
    }

    if (!this.selectedEducationPath) {
      errors.push('Выберите путь образования');
    }

    return errors;
  }

  startGame() {
    const errors = this.validateForm();
    if (errors.length > 0) {
      this.toast.show(errors[0]);
      return;
    }

    const playerName = this.nameInput.getText();
    
    this.saveData = {
      ...DEFAULT_SAVE,
      playerName,
      startAge: this.playerAge,
      currentAge: this.playerAge,
      skills: {
        ...DEFAULT_SAVE.skills,
        ...this.selectedEducationPath.result.skills,
      },
      education: {
        ...DEFAULT_SAVE.education,
        educationLevel: this.selectedEducationPath.result.educationLevel,
      },
    };

    this.persistenceSystem.saveGame(this.saveData);
    this.registry.set('saveData', this.saveData);

    // Маршрутизация на основе выбранного пути образования
    if (this.selectedEducationPath.id === 'institute') {
      // Школа + Институт
      this.scene.start('SchoolIntroScene', { 
        targetScene: 'InstituteIntroScene',
        saveData: this.saveData 
      });
    } else if (this.selectedEducationPath.id === 'school') {
      // Только школа
      this.scene.start('SchoolIntroScene', { 
        targetScene: 'MainGameScene',
        saveData: this.saveData 
      });
    } else {
      // Без образования
      this.scene.start('MainGameScene');
    }
  }

  handleResize(gameSize) {
    const width = gameSize.width;
    const height = gameSize.height;

    const desktopWide = width >= 960;
    const maxForm = desktopWide ? Math.min(680, width - 48) : Math.min(500, width - 24);
    const headerWidth = maxForm;
    const headerHeight = 88;
    const headerX = (width - headerWidth) / 2;
    const headerY = 16;

    this.headerCard.resize(headerX, headerY, headerWidth, headerHeight);
    this.headerTitle.setPosition(headerX + 24, headerY + 20);
    this.headerSubtitle.setPosition(headerX + 24, headerY + 52);

    const formWidth = maxForm;
    const formX = (width - formWidth) / 2;
    let formY = headerY + headerHeight + 16;

    const cardPadding = 20;
    const cardGap = 20;

    const nameHeight = 114;
    this.nameCard.resize(formX, formY, formWidth, nameHeight);
    this.nameLabel.setPosition(formX + cardPadding, formY + 18);
    this.nameFocusHint.setPosition(formX + formWidth - cardPadding, formY + 30);
    this.nameInputBackground.resize(formX + cardPadding, formY + 52, formWidth - cardPadding * 2, 46);
    this.nameInputBounds = new Phaser.Geom.Rectangle(
      formX + cardPadding - 4,
      formY + 48,
      formWidth - cardPadding * 2 + 8,
      54
    );
    if (this.debugNameInput) {
      console.log('[StartScene][name-input] layout', JSON.stringify({
        bgX: this.nameInputBackground.x,
        bgY: this.nameInputBackground.y,
        width: this.nameInputBackground.panelWidth,
        height: this.nameInputBackground.panelHeight,
      }));
    }
    formY += nameHeight + cardGap;

    const ageHeight = 132;
    this.ageCard.resize(formX, formY, formWidth, ageHeight);
    this.ageLabel.setPosition(formX + cardPadding, formY + 16);
    this.ageHint.setPosition(formX + cardPadding, formY + 44);
    
    const btnRadius = 28; // радиус кнопки (56/2)
    const controlsY = formY + 90;
    
    this.ageControlsContainer.setPosition(0, 0);
    
    // ageValue - слева
    this.ageValue.setPosition(formX + cardPadding + 8, controlsY);
    
    // Кнопки - справа, в естественном порядке: минус слева, плюс справа
    this.decreaseBtn.setPosition(formX + formWidth - cardPadding - btnRadius * 2 - 8 - 24, controlsY);
    this.increaseBtn.setPosition(formX + formWidth - cardPadding - btnRadius, controlsY);
    
    formY += ageHeight + cardGap;

    const eduCardHeight = 80;
    const eduButtonsCount = EDUCATION_PATHS.length;
    const eduHeaderHeight = 82;
    const eduBottomPadding = 24;
    const eduButtonVisualHeight = eduCardHeight - 8;
    const eduButtonGap = 12;
    const eduButtonsHeight = eduButtonsCount * eduButtonVisualHeight + (eduButtonsCount - 1) * eduButtonGap;
    const eduCardTotalHeight = eduHeaderHeight + eduButtonsHeight + eduBottomPadding;

    this.eduCard.resize(formX, formY, formWidth, eduCardTotalHeight);

    // Позиционируем элементы внутри eduCard (относительные координаты)
    this.eduLabel.setPosition(cardPadding, 16);
    this.eduHint.setPosition(cardPadding, 52);
    
    let eduButtonY = 76;
    
    EDUCATION_PATHS.forEach((_, i) => {
      const btn = this.eduButtons[i];
      btn.resize(formWidth - cardPadding * 2, eduCardHeight - 8);
      btn.setPosition(formWidth / 2, eduButtonY + eduCardHeight / 2 - 4);
      eduButtonY += eduCardHeight + 12;
    });

    // Toast
    this.toast.setPosition(width / 2, height - 100);
  }
}
