import Phaser from 'phaser';
import {
  applySkillChanges,
  applyStatChanges,
} from '../game-state.js';
import { PersistenceSystem } from '../ecs/systems/PersistenceSystem.js';
import {
  COLORS,
  createRoundedButton,
  createRoundedPanel,
  createToastMessage,
  textStyle,
} from '../ui-kit.js';

const SCHOOL_ROUNDS = [
  {
    id: 'math',
    title: 'Математика',
    description: 'Быстро решайте примеры за 60 секунд',
    duration: 60,
    skillReward: { timeManagement: 1 },
    questions: [
      { question: '15 + 27 = ?', answers: ['42', '43', '41', '40'], correct: 0 },
      { question: '8 × 9 = ?', answers: ['72', '81', '63', '71'], correct: 0 },
      { question: '144 ÷ 12 = ?', answers: ['12', '14', '11', '13'], correct: 0 },
      { question: '25 × 4 = ?', answers: ['100', '90', '110', '95'], correct: 0 },
      { question: '56 + 28 = ?', answers: ['84', '74', '94', '82'], correct: 0 },
    ],
  },
  {
    id: 'russian',
    title: 'Русский язык',
    description: 'Соедините слово с его определением',
    duration: 90,
    skillReward: { communication: 1 },
    questions: [
      { question: 'Синоним - это:', answers: ['Слово с похожим значением', 'Противоположное значение', 'Часть речи', 'Словосочетание'], correct: 0 },
      { question: 'Антоним - это:', answers: ['Слово с противоположным значением', 'Синоним', 'Омоним', 'Пароним'], correct: 0 },
      { question: 'Главные члены предложения:', answers: ['Подлежащее и сказуемое', 'Дополнение и обстоятельство', 'Определение и дополнение', 'Прилагательное и существительное'], correct: 0 },
      { question: 'Глагол обозначает:', answers: ['Действие предмета', 'Признак предмета', 'Предмет', 'Количество'], correct: 0 },
      { question: 'Прилагательное обозначает:', answers: ['Признак предмета', 'Действие предмета', 'Предмет', 'Место действия'], correct: 0 },
    ],
  },
  {
    id: 'history',
    title: 'История',
    description: 'Ответьте на вопросы по истории',
    duration: 90,
    skillReward: { financialLiteracy: 1 },
    questions: [
      { question: 'В каком году началась Великая Отечественная война?', answers: ['1941', '1939', '1942', '1940'], correct: 0 },
      { question: 'Кто первым полетел в космос?', answers: ['Юрий Гагарин', 'Алексей Леонов', 'Сергей Королёв', 'Владимир Комаров'], correct: 0 },
      { question: 'В каком году была отменена крепостное право?', answers: ['1861', '1863', '1859', '1865'], correct: 0 },
      { question: 'Кто написал «Войну и мир»?', answers: ['Лев Толстой', 'Фёдор Достоевский', 'Иван Тургенев', 'Антон Чехов'], correct: 0 },
      { question: 'В каком году основан Санкт-Петербург?', answers: ['1703', '1712', '1696', '1725'], correct: 0 },
    ],
  },
  {
    id: 'biology',
    title: 'Биология',
    description: 'Проверьте свои знания о живой природе',
    duration: 90,
    skillReward: { healthyLifestyle: 1 },
    questions: [
      { question: 'Сколько хромосом у человека?', answers: ['46', '44', '48', '42'], correct: 0 },
      { question: 'Какой орган является центром нервной системы?', answers: ['Мозг', 'Сердце', 'Печень', 'Лёгкие'], correct: 0 },
      { question: 'Что вырабатывает поджелудочная железа?', answers: ['Инсулин', 'Адреналин', 'Тироксин', 'Кортизол'], correct: 0 },
      { question: 'Сколько костей в человеческом теле?', answers: ['206', '208', '204', '210'], correct: 0 },
      { question: 'Какой витамин вырабатывается на солнце?', answers: ['Витамин D', 'Витамин C', 'Витамин A', 'Витамин E'], correct: 0 },
    ],
  },
];

export class SchoolIntroScene extends Phaser.Scene {
  constructor() {
    super('SchoolIntroScene');
  }

  init(data) {
    this.saveData = data.saveData || this.registry.get('saveData');
    this.targetScene = data.targetScene || 'MainGameScene';
    this.currentRound = 0;
    this.score = 0;
    this.timeRemaining = 0;
    this.timerEvent = null;
    this.passedRounds = [];
  }

  create() {
    this.persistenceSystem = new PersistenceSystem();
    this.cameras.main.setBackgroundColor(COLORS.background);

    this.root = this.add.container(0, 0);
    this.createHeader();
    this.createProgress();
    this.createRoundDisplay();
    this.createControls();

    this.scale.on('resize', this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.handleResize, this);
      if (this.timerEvent) {
        this.timerEvent.remove();
      }
    });

    this.handleResize(this.scale.gameSize);
    this.startRound();
  }

  createHeader() {
    this.headerCard = createRoundedPanel(this, { panelAlpha: 1, radius: 18, shadowAlpha: 0.22 });
    this.root.add(this.headerCard);

    this.headerTitle = this.add.text(0, 0, 'Образование: Школа', textStyle(28, COLORS.text, '700'));
    this.headerSubtitle = this.add.text(0, 0, 'Пройдите 4 учебных предмета', textStyle(16, COLORS.text, '500'));
    this.root.add([this.headerTitle, this.headerSubtitle]);
  }

  createProgress() {
    const progressCard = createRoundedPanel(this, { panelAlpha: 1, radius: 18, shadowAlpha: 0.22 });
    this.root.add(progressCard);

    this.roundLabels = [];
    for (let i = 0; i < 4; i++) {
      const circle = this.add.graphics();
      const text = this.add.text(0, 0, '', textStyle(14, COLORS.text, '700')).setOrigin(0.5);
      this.roundLabels.push({ circle, text, index: i });
      progressCard.add([circle, text]);
    }

    this.progressCard = progressCard;
  }

  createRoundDisplay() {
    const roundCard = createRoundedPanel(this, { panelAlpha: 1, radius: 18, shadowAlpha: 0.22 });
    this.root.add(roundCard);

    this.roundTitle = this.add.text(0, 0, '', textStyle(24, COLORS.text, '700'));
    this.roundDescription = this.add.text(0, 0, '', textStyle(16, COLORS.text, '500'));
    roundCard.add([this.roundTitle, this.roundDescription]);

    this.timerText = this.add.text(0, 0, '', textStyle(32, COLORS.accent, '700'));
    this.root.add(this.timerText);

    this.questionText = this.add.text(0, 0, '', textStyle(20, COLORS.text, '600'));
    this.root.add(this.questionText);

    this.answerButtons = [];
    for (let i = 0; i < 4; i++) {
      const btn = createRoundedButton(this, {
        label: '',
        fillColor: COLORS.neutral,
        fontSize: 16,
        width: 200,
        height: 48,
        onClick: () => this.checkAnswer(i),
      });
      this.answerButtons.push(btn);
      this.root.add(btn);
    }

    this.roundCard = roundCard;
  }

  createControls() {
    this.nextButton = createRoundedButton(this, {
      label: 'Дальше',
      fillColor: COLORS.accent,
      fontSize: 18,
      onClick: () => this.nextRound(),
    });
    this.nextButton.setVisible(false);
    this.root.add(this.nextButton);

    this.finishButton = createRoundedButton(this, {
      label: 'Завершить обучение',
      fillColor: COLORS.sage,
      fontSize: 18,
      onClick: () => this.finishSchool(),
    });
    this.finishButton.setVisible(false);
    this.root.add(this.finishButton);
  }

  startRound() {
    if (this.currentRound >= SCHOOL_ROUNDS.length) {
      this.showCompletion();
      return;
    }

    const round = SCHOOL_ROUNDS[this.currentRound];
    this.roundTitle.setText(round.title);
    this.roundDescription.setText(round.description);
    this.timeRemaining = round.duration;
    this.currentQuestion = 0;
    this.correctAnswers = 0;

    this.updateProgress();
    this.showQuestion();
    this.startTimer();
  }

  showQuestion() {
    const round = SCHOOL_ROUNDS[this.currentRound];
    if (this.currentQuestion >= round.questions.length) {
      this.endRound();
      return;
    }

    const question = round.questions[this.currentQuestion];
    this.questionText.setText(`${this.currentQuestion + 1}. ${question.question}`);

    this.answerButtons.forEach((btn, i) => {
      btn.setLabel(question.answers[i]);
      btn.fillColor = COLORS.neutral;
      btn.hit.setInteractive();
    });
  }

  checkAnswer(selectedIndex) {
    const round = SCHOOL_ROUNDS[this.currentRound];
    const question = round.questions[this.currentQuestion];

    this.answerButtons.forEach((btn, i) => {
      btn.hit.removeInteractive();
      if (i === question.correct) {
        btn.fillColor = COLORS.sage;
      } else if (i === selectedIndex && selectedIndex !== question.correct) {
        btn.fillColor = 0xD14D4D;
      }
    });

    if (selectedIndex === question.correct) {
      this.correctAnswers++;
      this.score += 10;
    }

    this.time.delayedCall(1000, () => {
      this.currentQuestion++;
      this.showQuestion();
    });
  }

  startTimer() {
    if (this.timerEvent) {
      this.timerEvent.remove();
    }

    this.updateTimerDisplay();

    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: this.tickTimer,
      callbackScope: this,
      loop: true,
    });
  }

  tickTimer() {
    this.timeRemaining--;
    this.updateTimerDisplay();

    if (this.timeRemaining <= 0) {
      this.endRound();
    }
  }

  updateTimerDisplay() {
    const minutes = Math.floor(this.timeRemaining / 60);
    const seconds = this.timeRemaining % 60;
    this.timerText.setText(`${minutes}:${seconds.toString().padStart(2, '0')}`);
  }

  endRound() {
    if (this.timerEvent) {
      this.timerEvent.remove();
    }

    const round = SCHOOL_ROUNDS[this.currentRound];
    const passed = this.correctAnswers >= Math.ceil(round.questions.length / 2);

    if (passed) {
      this.passedRounds.push(this.currentRound);
      this.questionText.setText(
        `Раунд пройден! Правильных ответов: ${this.correctAnswers}/${round.questions.length}`
      );
      this.timerText.setText('Отлично!');
    } else {
      this.questionText.setText(
        `Раунд провален. Правильных ответов: ${this.correctAnswers}/${round.questions.length}`
      );
      this.timerText.setText('Попробуйте ещё раз');
    }

    this.nextButton.setVisible(true);
    this.hideAnswerButtons();
  }

  nextRound() {
    this.nextButton.setVisible(false);
    this.currentRound++;

    if (this.currentRound >= SCHOOL_ROUNDS.length) {
      this.showCompletion();
    } else {
      this.startRound();
    }
  }

  hideAnswerButtons() {
    this.answerButtons.forEach(btn => {
      btn.setVisible(false);
    });
  }

  showAnswerButtons() {
    this.answerButtons.forEach(btn => {
      btn.setVisible(true);
    });
  }

  updateProgress() {
    const radius = 18;
    const spacing = 12;
    const totalWidth = radius * 2 * 4 + spacing * 3;

    this.roundLabels.forEach((item, i) => {
      const x = -totalWidth / 2 + radius + i * (radius * 2 + spacing);
      
      item.circle.clear();
      item.circle.fillStyle(i < this.currentRound ? COLORS.sage : COLORS.neutral, 1);
      item.circle.fillCircle(x, 0, radius - 4);

      if (i < this.currentRound) {
        item.circle.fillStyle(0xffffff, 1);
        item.circle.fillCircle(x, 0, 6);
        item.text.setVisible(false);
      } else {
        item.text.setText(`${i + 1}`);
        item.text.setPosition(x, 0);
        item.text.setVisible(true);
      }
    });
  }

  showCompletion() {
    const allPassed = this.passedRounds.length === SCHOOL_ROUNDS.length;

    if (allPassed) {
      this.roundTitle.setText('Обучение завершено');
      this.roundDescription.setText(`Общий счёт: ${this.score} очков`);
      this.timerText.setText('Среднее образование получено');
      this.questionText.setText('Теперь вы готовы начать свою карьеру');
      this.hideAnswerButtons();
      this.nextButton.setVisible(false);
      this.finishButton.setVisible(true);

      applySkillChanges(this.saveData.skills, { timeManagement: 1, communication: 1, financialLiteracy: 1, healthyLifestyle: 1 });
      this.saveData.education.school = 'completed';
      this.saveData.education.educationLevel = 'Среднее';
      this.persistenceSystem.saveGame(this.saveData);
      this.registry.set('saveData', this.saveData);
    } else {
      this.roundTitle.setText('Обучение не завершено');
      this.roundDescription.setText(`Пройдено раундов: ${this.passedRounds.length}/${SCHOOL_ROUNDS.length}`);
      this.timerText.setText('Образование не получено');
      this.questionText.setText('Для получения образования нужно пройти все предметы успешно');
      this.hideAnswerButtons();
      this.nextButton.setVisible(false);
      this.finishButton.setVisible(true);
      this.finishButton.setLabel('Вернуться без сохранения');
    }
  }

  finishSchool() {
    this.scene.start(this.targetScene, { saveData: this.saveData });
  }

  handleResize(gameSize) {
    const width = gameSize.width;
    const height = gameSize.height;

    const headerWidth = Math.min(600, width - 24);
    const headerHeight = 88;
    const headerX = (width - headerWidth) / 2;
    const headerY = 16;

    this.headerCard.resize(headerX, headerY, headerWidth, headerHeight);
    this.headerTitle.setPosition(headerX + 24, headerY + 20);
    this.headerSubtitle.setPosition(headerX + 24, headerY + 52);

    const progressWidth = Math.min(300, width - 24);
    const progressHeight = 56;
    const progressX = (width - progressWidth) / 2;
    const progressY = headerY + headerHeight + 12;

    this.progressCard.resize(progressX, progressY, progressWidth, progressHeight);
    this.roundLabels.forEach((item, i) => {
      item.circle.setPosition(progressX + progressWidth / 2, progressY + progressHeight / 2);
    });

    const roundWidth = Math.min(600, width - 24);
    const roundHeight = 240;
    const roundX = (width - roundWidth) / 2;
    const roundY = progressY + progressHeight + 12;

    this.roundCard.resize(roundX, roundY, roundWidth, roundHeight);
    this.roundTitle.setPosition(roundX + 24, roundY + 20);
    this.roundDescription.setPosition(roundX + 24, roundY + 52);

    this.timerText.setPosition(width / 2, roundY + roundHeight + 20);

    let answerY = roundY + roundHeight + 70;
    const buttonWidth = Math.min(260, (roundWidth - 48) / 2);
    const buttonHeight = 52;

    for (let i = 0; i < 4; i++) {
      const row = Math.floor(i / 2);
      const col = i % 2;
      const btn = this.answerButtons[i];
      btn.resize(buttonWidth, buttonHeight);
      btn.setPosition(roundX + 24 + col * (buttonWidth + 12), answerY + row * (buttonHeight + 12));
    }

    this.questionText.setPosition(roundX + 24, answerY + 2 * (buttonHeight + 12) + 16);
    this.questionText.setWordWrapWidth(roundWidth - 48);

    const btnY = Math.min(answerY + 2 * (buttonHeight + 12) + 80, height - 80);
    const btnWidth2 = Math.min(320, width - 48);

    this.nextButton.resize(btnWidth2, 56);
    this.nextButton.setPosition(width / 2, btnY);

    this.finishButton.resize(btnWidth2, 56);
    this.finishButton.setPosition(width / 2, btnY);
  }
}
