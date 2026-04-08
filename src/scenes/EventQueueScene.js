import Phaser from 'phaser';
import { SceneAdapter } from '../ecs/adapters/SceneAdapter.js';
import { PersistenceSystem } from '../ecs/systems/PersistenceSystem.js';
import {
  COLORS,
  createRoundedButton,
  createRoundedPanel,
  createToastMessage,
  textStyle,
} from '../ui-kit';

export class EventQueueSceneECS extends Phaser.Scene {
  constructor() {
    super('EventQueueScene');
  }

  create() {
    this.persistenceSystem = new PersistenceSystem();
    const loadedSaveData = this.persistenceSystem.loadSave();
    this.registry.set('saveData', loadedSaveData);
    this.sceneAdapter = new SceneAdapter(this, loadedSaveData);
    this.sceneAdapter.initialize();
    this.persistenceSystem.init(this.sceneAdapter.getWorld());

    const eventQueueSystem = this.sceneAdapter.getSystem('eventQueue');
    const eventChoiceSystem = this.sceneAdapter.getSystem('eventChoice');
    this.eventQueueSystem = eventQueueSystem;
    this.eventChoiceSystem = eventChoiceSystem;

    this.cameras.main.setBackgroundColor(COLORS.background);

    this.root = this.add.container(0, 0);
    this.createHeader();
    this.createEventDisplay();
    this.createBackButton();
    this.createToast();
    this.createModals();

    this.scale.on('resize', this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.handleResize, this);
    });

    this.loadNextEvent();
    this.handleResize(this.scale.gameSize);
    this.animateEntrance();
  }

  createHeader() {
    this.headerCard = createRoundedPanel(this, { panelAlpha: 1, radius: 18, shadowAlpha: 0.22 });
    this.root.add(this.headerCard);

    this.headerTitle = this.add.text(0, 0, 'Events', textStyle(28, COLORS.text, '700'));
    this.headerSubtitle = this.add.text(0, 0, 'Events queue and choices', textStyle(16, COLORS.text, '500'));
    this.root.add([this.headerTitle, this.headerSubtitle]);
  }

  createEventDisplay() {
    this.eventCard = createRoundedPanel(this, { panelAlpha: 1, radius: 18, shadowAlpha: 0.22 });
    this.root.add(this.eventCard);

    this.eventTitle = this.add.text(0, 0, '', textStyle(24, COLORS.text, '700'));
    this.root.add(this.eventTitle);

    this.eventDescription = this.add.text(0, 0, '', textStyle(16, COLORS.text, '500'), { wordWrap: { width: 400 } });
    this.root.add(this.eventDescription);

    this.choicesContainer = this.add.container(0, 0);
    this.root.add(this.choicesContainer);

    this.choiceButtons = [];
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
    this.resultModal = createRoundedPanel(this, { panelAlpha: 1, radius: 18, shadowAlpha: 0.3 });
    this.resultModal.setVisible(false);
    this.root.add(this.resultModal);

    this.resultTitle = this.add.text(0, 0, '', textStyle(18, COLORS.text, '700'));
    this.resultModal.add(this.resultTitle);

    this.resultText = this.add.text(0, 0, '', textStyle(14, COLORS.text, '500'), { wordWrap: { width: 400 } });
    this.resultModal.add(this.resultText);

    this.resultButton = createRoundedButton(this, {
      label: 'OK',
      onClick: () => this.hideResult(),
      fillColor: COLORS.accent,
      fontSize: 16,
    });
    this.resultModal.add(this.resultButton);
  }

  showResult(title, text) {
    this.resultTitle.setText(title);
    this.resultText.setText(text);
    this.resultModal.setVisible(true);
    this.resultModal.setSize(460, 250);
    this.resultModal.setPosition((this.scale.width - 460) / 2, (this.scale.height - 250) / 2);

    this.resultTitle.setPosition(24, 30);
    this.resultText.setPosition(24, 70);
    this.resultButton.setPosition(230, 190);
  }

  hideResult() {
    this.resultModal.setVisible(false);
  }

  loadNextEvent() {
    if (this.noEventsText) {
      this.noEventsText.destroy();
      this.noEventsText = null;
    }

    const nextEvent = this.eventQueueSystem.getNextEvent();

    if (!nextEvent) {
      this.showNoEvents();
      return;
    }

    this.currentEvent = nextEvent;
    this.updateEventDisplay();
    this.createChoiceButtons();
  }

  updateEventDisplay() {
    if (!this.currentEvent) return;

    this.eventTitle.setText(this.currentEvent.title);
    this.eventDescription.setText(this.currentEvent.description);

    this.removeChoiceButtons();
    this.createChoiceButtons();
  }

  createChoiceButtons() {
    if (!this.currentEvent || !this.currentEvent.choices) return;

    const choices = this.currentEvent.choices;

    choices.forEach((choice, index) => {
      const button = createRoundedButton(this, {
        label: choice.label,
        onClick: () => this.selectChoice(index),
        fillColor: COLORS.accent,
        fontSize: 16,
      });
      this.root.add(button);
      this.choiceButtons.push(button);
    });

    this.updateButtonPositions();
  }

  removeChoiceButtons() {
    this.choiceButtons.forEach(button => button.destroy());
    this.choiceButtons = [];
  }

  updateButtonPositions() {
    const startX = this.eventCard.x + 24;
    const startY = this.eventCard.y + 200;

    this.choiceButtons.forEach((button, index) => {
      button.setPosition(startX + 120 * index, startY);
    });
  }

  selectChoice(choiceIndex) {
    const choice = this.currentEvent.choices[choiceIndex];
    const result = this.eventChoiceSystem.applyEventChoice(this.currentEvent, choiceIndex);

    if (result.success) {
      this.sceneAdapter.syncToSaveData();
      this.persistenceSystem.saveGame(this.sceneAdapter.getSaveData());

      // Показываем модальное окно с результатом
      const resultText = [
        result.message,
        result.summary || '',
      ].filter(Boolean).join('\n');

      this.showResult('Результат выбора', resultText);

      // Загружаем следующее событие после закрытия модального окна
      this.time.delayedCall(1500, () => {
        this.hideResult();
        this.time.delayedCall(300, () => {
          this.loadNextEvent();
        });
      });
    } else {
      this.showToast(result.message);
    }
  }

  showNoEvents() {
    this.eventTitle.setText('No events');
    this.eventDescription.setText('There are no pending events to handle.');
    this.removeChoiceButtons();

    const noEventsText = this.add.text(0, 0, 'Return to main screen', textStyle(14, COLORS.neutral, '400'));
    this.root.add(noEventsText);
    this.noEventsText = noEventsText;
  }

  showToast(message) {
    this.toast.show(message);
  }

  handleResize(gameSize) {
    const w = gameSize.width;
    const h = gameSize.height;
    const isDesktop = w >= 768;

    this.headerCard.setSize(isDesktop ? 460 : w - 40, 100);
    this.headerCard.setPosition(isDesktop ? (w - 460) / 2 : 20, 20);

    this.headerTitle.setPosition(this.headerCard.x + 24, this.headerCard.y + 30);
    this.headerSubtitle.setPosition(this.headerCard.x + 24, this.headerCard.y + 65);

    this.eventCard.setSize(isDesktop ? 480 : w - 40, h - 180);
    this.eventCard.setPosition(isDesktop ? (w - 480) / 2 : 20, 140);

    this.eventTitle.setPosition(this.eventCard.x + 24, this.eventCard.y + 30);
    this.eventDescription.setPosition(this.eventCard.x + 24, this.eventCard.y + 70);
    this.eventDescription.setStyle({ wordWrap: { width: this.eventCard.width - 48 } });

    this.updateButtonPositions();

    this.backButton.setPosition(this.eventCard.x + this.eventCard.width / 2, h - 60);
    this.toast.setPosition(w / 2, h - 120);

    if (this.noEventsText) {
      this.noEventsText.setPosition(this.eventCard.x + this.eventCard.width / 2, this.eventCard.y + this.eventCard.height / 2);
    }

    // Обновляем позицию модального окна если оно видимо
    if (this.resultModal && this.resultModal.visible) {
      this.resultModal.setSize(isDesktop ? 460 : w - 40, 250);
      this.resultModal.setPosition(isDesktop ? (w - 460) / 2 : 20, (h - 250) / 2);

      this.resultTitle.setPosition(24, 30);
      this.resultText.setPosition(24, 70);
      this.resultButton.setPosition(this.resultModal.width / 2, 190);
    }
  }

  animateEntrance() {
    this.headerCard.alpha = 0;
    this.eventCard.alpha = 0;
    this.backButton.alpha = 0;

    this.tweens.add({
      targets: this.headerCard,
      alpha: 1,
      duration: 400,
      ease: 'Cubic.easeOut',
    });

    this.tweens.add({
      targets: this.eventCard,
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
