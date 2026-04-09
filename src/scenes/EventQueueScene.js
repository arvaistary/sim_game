import Phaser from 'phaser';
import { SceneAdapter } from '../ecs/adapters/SceneAdapter.js';
import { PersistenceSystem } from '../ecs/systems/PersistenceSystem.js';
import { formatStatChangesBulletListRu } from '../shared/stat-changes-format.js';
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

  createEventDisplay() {
    this.eventCard = createRoundedPanel(this, { panelAlpha: 1, radius: 18, shadowAlpha: 0.22 });
    this.root.add(this.eventCard);

    this.eventTitle = this.add.text(0, 0, '', textStyle(24, COLORS.text, '700'));
    this.root.add(this.eventTitle);

    this.eventDescription = this.add.text(0, 0, '', textStyle(16, COLORS.text, '500'), { wordWrap: { width: 400 } });
    this.root.add(this.eventDescription);

    this.eventStatImpact = this.add.text(0, 0, '', textStyle(15, COLORS.text, '600'));
    this.root.add(this.eventStatImpact);

    this.choiceButtons = [];
  }

  createBackButton() {
    this.backButton = createRoundedButton(this, {
      label: 'Назад',
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
      label: 'Ок',
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
    this.layoutResultModal();
  }

  layoutResultModal() {
    if (!this.resultModal?.visible) return;

    const w = this.scale.width;
    const h = this.scale.height;
    const isDesktop = w >= 768;
    const modalW = isDesktop ? 460 : w - 40;
    const pad = 24;
    this.resultTitle.setStyle({ wordWrap: { width: modalW - pad * 2 } });
    this.resultTitle.setText(this.resultTitle.text);
    const titleH = this.resultTitle.height;
    this.resultText.setStyle({ wordWrap: { width: modalW - pad * 2 } });
    this.resultText.setText(this.resultText.text);
    const textH = this.resultText.height;
    const modalH = Math.min(
      h - 48,
      Math.max(220, pad + titleH + 16 + textH + 16 + 52 + pad),
    );
    const x = isDesktop ? (w - modalW) / 2 : 20;
    const y = (h - modalH) / 2;

    this.resultModal.setSize(modalW, modalH);
    this.resultModal.setPosition(x, y);

    this.resultTitle.setPosition(pad, pad);
    this.resultText.setPosition(pad, pad + titleH + 12);
    this.resultButton.setPosition(modalW / 2, modalH - pad - 26);
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
  }

  updateEventDisplay() {
    if (!this.currentEvent) return;

    this.eventTitle.setText(this.currentEvent.title);
    this.eventDescription.setText(this.currentEvent.description);

    const impactLine = formatStatChangesBulletListRu(this.currentEvent.statImpact);
    if (impactLine) {
      this.eventStatImpact.setText(`Последствия:\n${impactLine}`);
      this.eventStatImpact.setVisible(true);
    } else {
      this.eventStatImpact.setText('');
      this.eventStatImpact.setVisible(false);
    }

    this.removeChoiceButtons();
    this.createChoiceButtons();

    this.handleResize(this.scale.gameSize);
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
        width: Math.max(200, (this.eventCard?.width ?? 400) - 48),
        height: 48,
      });
      this.root.add(button);
      this.choiceButtons.push(button);
    });

    this.updateButtonPositions();
  }

  removeChoiceButtons() {
    this.choiceButtons.forEach((button) => button.destroy());
    this.choiceButtons = [];
  }

  _contentBottomBeforeChoices() {
    if (this.eventStatImpact.visible && this.eventStatImpact.text) {
      return this.eventStatImpact.y + this.eventStatImpact.height;
    }
    return this.eventDescription.y + this.eventDescription.height;
  }

  updateButtonPositions() {
    if (!this.eventCard || this.choiceButtons.length === 0) return;

    const pad = 24;
    const card = this.eventCard;
    const btnW = Math.max(160, card.width - pad * 2);
    const btnH = 48;
    const gap = 10;
    const centerX = card.x + card.width / 2;

    const descBottom = this._contentBottomBeforeChoices();
    const backReserve = 88;
    const cardBottom = card.y + card.height;
    let cy = descBottom + gap + btnH / 2;
    const totalH =
      this.choiceButtons.length * btnH + Math.max(0, this.choiceButtons.length - 1) * gap;
    const maxBottom = Math.min(this.scale.height - backReserve, cardBottom - pad);
    if (cy + totalH - btnH / 2 > maxBottom) {
      cy = Math.max(descBottom + btnH / 2 + gap, maxBottom - totalH + btnH / 2);
    }

    this.choiceButtons.forEach((button, index) => {
      button.resize(btnW, btnH);
      button.setPosition(centerX, cy + index * (btnH + gap));
    });
  }

  selectChoice(choiceIndex) {
    const choice = this.currentEvent.choices[choiceIndex];
    const result = this.eventChoiceSystem.applyEventChoice(this.currentEvent, choiceIndex);

    if (result.success) {
      this.sceneAdapter.syncToSaveData();
      this.persistenceSystem.saveGame(this.sceneAdapter.getSaveData());

      const resultText = [
        result.message,
        result.summary || '',
      ].filter(Boolean).join('\n');

      this.showResult('Результат выбора', resultText);

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
    this.eventTitle.setText('Нет событий');
    this.eventDescription.setText('В очереди ничего не ожидает вашего решения.');
    this.eventStatImpact.setText('');
    this.eventStatImpact.setVisible(false);
    this.removeChoiceButtons();

    const noEventsText = this.add.text(0, 0, 'Вернитесь на главный экран', textStyle(14, COLORS.neutral, '400'));
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
    const topY = 20;

    this.eventCard.setSize(isDesktop ? 480 : w - 40, h - topY - 100);
    this.eventCard.setPosition(isDesktop ? (w - 480) / 2 : 20, topY);

    const pad = 24;
    const contentW = this.eventCard.width - pad * 2;
    this.eventTitle.setPosition(this.eventCard.x + pad, this.eventCard.y + pad);
    this.eventTitle.setStyle({ wordWrap: { width: contentW } });
    this.eventDescription.setStyle({ wordWrap: { width: contentW } });
    this.eventDescription.setPosition(
      this.eventCard.x + pad,
      this.eventTitle.y + this.eventTitle.height + 12,
    );

    if (this.eventStatImpact.visible && this.eventStatImpact.text) {
      this.eventStatImpact.setStyle({ wordWrap: { width: contentW } });
      this.eventStatImpact.setPosition(
        this.eventCard.x + pad,
        this.eventDescription.y + this.eventDescription.height + 14,
      );
    } else {
      this.eventStatImpact.setPosition(
        this.eventCard.x + pad,
        this.eventDescription.y + this.eventDescription.height + 8,
      );
    }

    this.updateButtonPositions();

    this.backButton.setPosition(this.eventCard.x + this.eventCard.width / 2, h - 56);
    this.toast.setPosition(w / 2, h - 120);

    if (this.noEventsText) {
      this.noEventsText.setPosition(this.eventCard.x + this.eventCard.width / 2, this.eventCard.y + this.eventCard.height / 2);
    }

    if (this.resultModal?.visible) {
      this.layoutResultModal();
    }
  }

  animateEntrance() {
    this.eventCard.alpha = 0;
    this.backButton.alpha = 0;

    this.tweens.add({
      targets: this.eventCard,
      alpha: 1,
      duration: 500,
      ease: 'Cubic.easeOut',
    });

    this.tweens.add({
      targets: this.backButton,
      alpha: 1,
      duration: 400,
      delay: 200,
      ease: 'Cubic.easeOut',
    });
  }
}
