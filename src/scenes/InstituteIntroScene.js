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

const INSTITUTE_ROUNDS = [
  {
    id: 'case_study',
    title: 'Бизнес-кейс',
    description: 'Проанализируйте ситуацию и выберите лучшее решение',
    duration: 120,
    skillReward: { professionalism: 1 },
    questions: [
      {
        question: 'Компания теряет клиентов из-за медленного обслуживания. Что делать?',
        answers: [
          'Оптимизировать процессы и обучить персонал',
          'Нанять больше сотрудников',
          'Снизить цены для удержания клиентов',
          'Увеличить рекламный бюджет',
        ],
        correct: 0,
      },
      {
        question: 'У вас ограничен бюджет на маркетинг. Где лучше вложиться?',
        answers: [
          'Создать контент-стратегию и работать с SEO',
          'Запустить рекламу во всех каналах сразу',
          'Организовать массовую акцию со скидками',
          'Нанять дорогого маркетолога',
        ],
        correct: 0,
      },
      {
        question: 'Ключевой сотрудник хочет уйти. Как поступить?',
        answers: [
          'Провести переговоры и предложить улучшения',
          'Сразу начать поиск замены',
          'Повысить ему зарплату без обсуждения',
          'Позволить уйти и не удерживать',
        ],
        correct: 0,
      },
    ],
  },
  {
    id: 'project_simulation',
    title: 'Управление проектом',
    description: 'Распределите ресурсы wisely для успешного завершения проекта',
    duration: 180,
    skillReward: { communication: 1 },
    questions: [
      {
        question: 'Проект задерживается на 2 недели. Что первым делом?',
        answers: [
          'Пересмотреть приоритеты и перенести несущественные задачи',
          'Попросить команду работать сверхурочно',
          'Сообщить заказчику о задержке',
          'Сократить тестирование продукта',
        ],
        correct: 0,
      },
      {
        question: 'В команде конфликт между двумя разработчиками. Ваше действие?',
        answers: [
          'Провести личную встречу и найти компромисс',
          'Разделить их по разным задачам',
          'Оставить как есть - само разрулится',
          'Уволить одного из них',
        ],
        correct: 0,
      },
      {
        question: 'Заказчик хочет добавить новую функцию в середине проекта.',
        answers: [
          'Оценить влияние на сроки и бюджет, предложить альтернативы',
          'Принять без обсуждения - клиент всегда прав',
          'Категорически отказаться',
          'Добавить бесплатно за хорошее впечатление',
        ],
        correct: 0,
      },
    ],
  },
  {
    id: 'presentation',
    title: 'Интерактивная презентация',
    description: 'Продемонстрируйте свои знания в форме презентации',
    duration: 150,
    skillReward: { timeManagement: 1 },
    questions: [
      {
        question: 'Какая главная цель эффективной презентации?',
        answers: [
          'Передать ключевую идею и убедить аудиторию',
          'Показать все функции продукта',
          'Заполнить всё отведённое время',
          'Использовать красивую анимацию',
        ],
        correct: 0,
      },
      {
        question: 'Сколько слайдов в среднем должно быть у 10-минутной презентации?',
        answers: [
          '8-12 слайдов',
          '20-30 слайдов',
          '3-5 слайдов',
          '15-20 слайдов',
        ],
        correct: 0,
      },
      {
        question: 'Что самое важное при подготовке к презентации?',
        answers: [
          'Понять аудиторию и её потребности',
          'Сделать красивый дизайн',
          'Подготовить много данных',
          'Заучить текст наизусть',
        ],
        correct: 0,
      },
    ],
  },
  {
    id: 'final_project',
    title: 'Финальный проект',
    description: 'Примените все полученные знания для комплексного решения',
    duration: 200,
    skillReward: { financialLiteracy: 1 },
    questions: [
      {
        question: 'Вы руководите стартапом. Приоритет на первый год:',
        answers: [
          'Продукт-маркет-фит и удержание первых клиентов',
          'Масштабирование и наём большой команды',
          'Создание идеальной инфраструктуры',
          'Поиск инвесторов и PR',
        ],
        correct: 0,
      },
      {
        question: 'Как лучше измерять успех продукта в начале?',
        answers: [
          'Retention и LTV пользователей',
          'Количество скачиваний',
          'Размер инвестиций',
          'Количество сотрудников',
        ],
        correct: 0,
      },
      {
        question: 'Команда измучена перед релизом. Ваше решение?',
        answers: [
          'Сократить scope релиза и дать отдохнуть команде',
          'Потребовать доделать всё запланированное',
          'Нанять дополнительных работников',
          'Перенести релиз на месяц',
        ],
        correct: 0,
      },
      {
        question: 'Конкурент запустил похожий продукт. Что делать?',
        answers: [
          'Выделить уникальное преимущество и сфокусироваться',
          'Понизить цену ниже конкурента',
          'Срочно добавить все его функции',
          'Ничего не делать - наш продукт лучше',
        ],
        correct: 0,
      },
    ],
  },
];

export class InstituteIntroScene extends Phaser.Scene {
  constructor() {
    super('InstituteIntroScene');
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

    this.headerTitle = this.add.text(0, 0, 'Образование: Институт', textStyle(28, COLORS.text, '700'));
    this.headerSubtitle = this.add.text(0, 0, 'Пройдите 4 продвинутых курса', textStyle(16, COLORS.text, '500'));
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

    this.questionText = this.add.text(0, 0, '', textStyle(18, COLORS.text, '500'));
    this.questionText.setWordWrapWidth(500);
    this.root.add(this.questionText);

    this.answerButtons = [];
    for (let i = 0; i < 4; i++) {
      const btn = createRoundedButton(this, {
        label: '',
        fillColor: COLORS.neutral,
        fontSize: 15,
        width: 300,
        height: 72,
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
      fillColor: COLORS.blue,
      fontSize: 18,
      onClick: () => this.finishInstitute(),
    });
    this.finishButton.setVisible(false);
    this.root.add(this.finishButton);
  }

  startRound() {
    if (this.currentRound >= INSTITUTE_ROUNDS.length) {
      this.showCompletion();
      return;
    }

    const round = INSTITUTE_ROUNDS[this.currentRound];
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
    const round = INSTITUTE_ROUNDS[this.currentRound];
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
    const round = INSTITUTE_ROUNDS[this.currentRound];
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
      this.score += 15;
    }

    this.time.delayedCall(1200, () => {
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

    const round = INSTITUTE_ROUNDS[this.currentRound];
    const passed = this.correctAnswers >= Math.ceil(round.questions.length / 2);

    if (passed) {
      this.passedRounds.push(this.currentRound);
      this.questionText.setText(
        `Курс пройден! Правильных ответов: ${this.correctAnswers}/${round.questions.length}`
      );
      this.timerText.setText('Отлично!');
    } else {
      this.questionText.setText(
        `Курс провален. Правильных ответов: ${this.correctAnswers}/${round.questions.length}`
      );
      this.timerText.setText('Попробуйте ещё раз');
    }

    this.nextButton.setVisible(true);
    this.hideAnswerButtons();
  }

  nextRound() {
    this.nextButton.setVisible(false);
    this.currentRound++;

    if (this.currentRound >= INSTITUTE_ROUNDS.length) {
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
      item.circle.fillStyle(i < this.currentRound ? COLORS.blue : COLORS.neutral, 1);
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
    const allPassed = this.passedRounds.length === INSTITUTE_ROUNDS.length;

    if (allPassed) {
      this.roundTitle.setText('Обучение завершено');
      this.roundDescription.setText(`Общий счёт: ${this.score} очков`);
      this.timerText.setText('Высшее образование получено');
      this.questionText.setText('У вас есть продвинутые навыки для успешной карьеры');
      this.hideAnswerButtons();
      this.nextButton.setVisible(false);
      this.finishButton.setVisible(true);

      applySkillChanges(this.saveData.skills, { professionalism: 1, communication: 1, timeManagement: 1, financialLiteracy: 1 });
      this.saveData.education.institute = 'completed';
      this.saveData.education.educationLevel = 'Высшее';
      this.persistenceSystem.saveGame(this.saveData);
      this.registry.set('saveData', this.saveData);
    } else {
      this.roundTitle.setText('Обучение не завершено');
      this.roundDescription.setText(`Пройдено курсов: ${this.passedRounds.length}/${INSTITUTE_ROUNDS.length}`);
      this.timerText.setText('Образование не получено');
      this.questionText.setText('Для получения образования нужно пройти все курсы успешно');
      this.hideAnswerButtons();
      this.nextButton.setVisible(false);
      this.finishButton.setVisible(true);
      this.finishButton.setLabel('Вернуться без сохранения');
    }
  }

  finishInstitute() {
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

    const roundWidth = Math.min(650, width - 24);
    const roundHeight = 200;
    const roundX = (width - roundWidth) / 2;
    const roundY = progressY + progressHeight + 12;

    this.roundCard.resize(roundX, roundY, roundWidth, roundHeight);
    this.roundTitle.setPosition(roundX + 24, roundY + 20);
    this.roundDescription.setPosition(roundX + 24, roundY + 52);

    this.timerText.setPosition(width / 2, roundY + roundHeight + 20);

    const buttonWidth = Math.min(280, (roundWidth - 48) / 2);
    const buttonHeight = 72;
    const buttonGap = 12;

    this.questionText.setPosition(roundX + 24, roundY + roundHeight + 60);
    this.questionText.setWordWrapWidth(roundWidth - 48);

    let answerY = roundY + roundHeight + 100;
    for (let i = 0; i < 4; i++) {
      const row = Math.floor(i / 2);
      const col = i % 2;
      const btn = this.answerButtons[i];
      btn.resize(buttonWidth, buttonHeight);
      btn.setPosition(roundX + 24 + col * (buttonWidth + buttonGap), answerY + row * (buttonHeight + buttonGap));
    }

    const btnY = Math.min(answerY + 2 * (buttonHeight + buttonGap) + 16, height - 80);
    const btnWidth2 = Math.min(320, width - 48);

    this.nextButton.resize(btnWidth2, 56);
    this.nextButton.setPosition(width / 2, btnY);

    this.finishButton.resize(btnWidth2, 56);
    this.finishButton.setPosition(width / 2, btnY);
  }
}
