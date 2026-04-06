import Phaser from "phaser";

export const COLORS = {
  background: 0xf8f4ed,
  accent: 0xe8b4a0,
  accentSoft: 0xf3d3c6,
  sage: 0xa8caba,
  blue: 0x6d9dc5,
  neutral: 0xd9d0c3,
  text: 0x3c2f2f,
  white: 0xffffff,
  panel: 0xfffcf7,
  line: 0xe6ddd2,
  shadow: 0xd9cfc2,
};

export function textStyle(size, color, weight = "500") {
  return {
    fontFamily: "Inter, Poppins, Arial, sans-serif",
    fontSize: `${size}px`,
    color: `#${color.toString(16).padStart(6, "0")}`,
    fontStyle: weight === "700" ? "bold" : "normal",
    fontWeight: weight,
  };
}

export function createRoundedPanel(scene, options = {}) {
  const {
    fillColor = COLORS.panel,
    lineColor = COLORS.line,
    shadowColor = COLORS.shadow,
    shadowAlpha = 0.22,
    panelAlpha = 1,
    radius = 22,
  } = options;

  const container = scene.add.container(0, 0);
  const shadow = scene.add.graphics();
  const body = scene.add.graphics();
  container.add([shadow, body]);

  container.resize = (x, y, width, height, nextRadius = radius, nextAlpha = panelAlpha) => {
    container.setPosition(x, y);
    container.panelWidth = width;
    container.panelHeight = height;

    shadow.clear();
    shadow.fillStyle(shadowColor, shadowAlpha);
    shadow.fillRoundedRect(8, 10, width, height, nextRadius);

    body.clear();
    body.fillStyle(fillColor, nextAlpha);
    body.lineStyle(1, lineColor, 1);
    body.fillRoundedRect(0, 0, width, height, nextRadius);
    body.strokeRoundedRect(0, 0, width, height, nextRadius);
  };

  return container;
}

export function createRoundedButton(scene, options = {}) {
  const {
    label = "",
    onClick = () => {},
    fillColor = COLORS.accent,
    textColor = COLORS.text,
    shadowColor = COLORS.shadow,
    fontSize = 16,
    fontWeight = "700",
    useHandCursor = true,
    enableHoverScale = true,
  } = options;

  const container = scene.add.container(0, 0);
  const shadow = scene.add.graphics();
  const body = scene.add.graphics();
  const text = scene.add.text(0, 0, label, textStyle(fontSize, textColor, fontWeight)).setOrigin(0.5);
  const hit = scene.add.rectangle(0, 0, 160, 52, 0x000000, 0).setOrigin(0.5);
  hit.setInteractive({ useHandCursor });

  if (enableHoverScale) {
    hit.on("pointerover", () => scene.tweens.add({ targets: container, scale: 1.03, duration: 160 }));
    hit.on("pointerout", () => scene.tweens.add({ targets: container, scale: 1, duration: 160 }));
  }

  hit.on("pointerup", onClick);

  container.shadow = shadow;
  container.body = body;
  container.text = text;
  container.hit = hit;
  container.fillColor = fillColor;

  container.resize = (width, height, nextFillColor = container.fillColor) => {
    container.fillColor = nextFillColor;
    shadow.clear();
    shadow.fillStyle(shadowColor, 0.18);
    shadow.fillRoundedRect(-width / 2, -height / 2 + 8, width, height, 18);
    body.clear();
    body.fillStyle(container.fillColor, 1);
    body.fillRoundedRect(-width / 2, -height / 2, width, height, 18);
    hit.width = width;
    hit.height = height;
  };

  container.setLabel = (nextLabel) => {
    text.setText(nextLabel);
  };

  container.setTextStyle = (size, color = textColor, weight = fontWeight) => {
    text.setStyle(textStyle(size, color, weight));
  };

  container.add([shadow, body, text, hit]);
  return container;
}

export function createModalCard(scene, options = {}) {
  const {
    width = 360,
    height = 420,
    primaryLabel = "Ок",
    secondaryLabel = "Закрыть",
  } = options;

  const root = scene.add.container(0, 0);
  const backdrop = scene.add.rectangle(0, 0, 10, 10, 0x3c2f2f, 0.32).setOrigin(0);
  const panel = createRoundedPanel(scene, { panelAlpha: 1, radius: 24 });
  const illustration = scene.add.graphics();
  const title = scene.add.text(0, 0, "", textStyle(24, COLORS.text, "700")).setOrigin(0.5, 0);
  const description = scene.add.text(0, 0, "", {
    ...textStyle(16, COLORS.text, "500"),
    align: "center",
    wordWrap: { width: width - 48 },
  }).setOrigin(0.5, 0);

  const primaryButton = createRoundedButton(scene, {
    label: primaryLabel,
    fillColor: COLORS.accent,
  });
  const secondaryButton = createRoundedButton(scene, {
    label: secondaryLabel,
    fillColor: COLORS.neutral,
  });

  root.add([backdrop, panel, illustration, title, description, primaryButton, secondaryButton]);
  root.setVisible(false).setAlpha(0);

  root.primaryButton = primaryButton;
  root.secondaryButton = secondaryButton;
  root.backdrop = backdrop;
  root.panel = panel;
  root.title = title;
  root.description = description;
  root.illustration = illustration;

  const redrawIllustration = (accentColor = COLORS.accent) => {
    const panelWidth = panel.panelWidth ?? width;
    illustration.clear();
    illustration.fillStyle(accentColor, 0.18);
    illustration.fillCircle(panelWidth / 2, 72, 48);
    illustration.fillStyle(COLORS.white, 1);
    illustration.fillRoundedRect(panelWidth / 2 - 58, 42, 116, 62, 20);
    illustration.lineStyle(2, COLORS.line, 1);
    illustration.strokeRoundedRect(panelWidth / 2 - 58, 42, 116, 62, 20);
    illustration.fillStyle(accentColor, 0.9);
    illustration.fillRoundedRect(panelWidth / 2 - 26, 56, 52, 32, 12);
  };

  root.resize = (gameSize) => {
    const sceneWidth = gameSize.width;
    const sceneHeight = gameSize.height;
    const cardWidth = Math.min(width, sceneWidth - 36);
    const cardHeight = Math.min(height, sceneHeight - 48);
    const x = (sceneWidth - cardWidth) / 2;
    const y = (sceneHeight - cardHeight) / 2;

    backdrop.width = sceneWidth;
    backdrop.height = sceneHeight;
    panel.resize(x, y, cardWidth, cardHeight, 24, 1);
    title.setPosition(x + cardWidth / 2, y + 132);
    description.setPosition(x + cardWidth / 2, y + 178).setWordWrapWidth(cardWidth - 48);
    primaryButton.resize(cardWidth - 48, 50);
    primaryButton.setPosition(x + cardWidth / 2, y + cardHeight - 78);
    secondaryButton.resize(cardWidth - 48, 46);
    secondaryButton.setPosition(x + cardWidth / 2, y + cardHeight - 24);
    redrawIllustration(root.accentColor ?? COLORS.accent);
  };

  root.show = (config = {}) => {
    root.accentColor = config.accentColor ?? COLORS.accent;
    title.setText(config.title ?? "");
    description.setText(config.description ?? "");
    primaryButton.setLabel(config.primaryLabel ?? primaryLabel);
    secondaryButton.setLabel(config.secondaryLabel ?? secondaryLabel);

    primaryButton.hit.removeAllListeners("pointerup");
    secondaryButton.hit.removeAllListeners("pointerup");
    primaryButton.hit.on("pointerup", () => {
      config.onPrimary?.();
      if (config.closeOnPrimary !== false) {
        root.hide();
      }
    });
    secondaryButton.hit.on("pointerup", () => {
      config.onSecondary?.();
      root.hide();
    });

    root.resize(scene.scale.gameSize);
    root.setVisible(true);
    root.setAlpha(0);
    panel.setScale(0.96);
    scene.tweens.add({
      targets: root,
      alpha: 1,
      duration: 180,
      ease: "Quad.easeOut",
    });
    scene.tweens.add({
      targets: panel,
      scaleX: 1,
      scaleY: 1,
      duration: 260,
      ease: "Back.easeOut",
    });
  };

  root.hide = () => {
    scene.tweens.add({
      targets: root,
      alpha: 0,
      duration: 160,
      ease: "Quad.easeIn",
      onComplete: () => {
        root.setVisible(false);
      },
    });
  };

  return root;
}

export function createEventModal(scene, options = {}) {
  return createModalCard(scene, {
    width: 380,
    height: 440,
    primaryLabel: "Выбрать",
    secondaryLabel: "Позже",
    ...options,
  });
}

export function createNotificationModal(scene, options = {}) {
  return createModalCard(scene, {
    width: 340,
    height: 380,
    primaryLabel: "Ок",
    secondaryLabel: "Закрыть",
    ...options,
  });
}

export function createToastMessage(scene, options = {}) {
  const { width = 220, height = 48 } = options;
  const root = scene.add.container(0, 0).setAlpha(0);
  const shadow = scene.add.graphics();
  const body = scene.add.graphics();
  const text = scene.add.text(width / 2, height / 2, "", textStyle(15, COLORS.text, "600")).setOrigin(0.5);

  shadow.fillStyle(COLORS.shadow, 0.25);
  shadow.fillRoundedRect(6, 8, width, height, 14);
  body.fillStyle(COLORS.white, 1);
  body.lineStyle(1, COLORS.line, 1);
  body.fillRoundedRect(0, 0, width, height, 14);
  body.strokeRoundedRect(0, 0, width, height, 14);

  root.messageText = text;
  root.widthValue = width;
  root.heightValue = height;

  root.show = (message) => {
    text.setText(message);
    scene.tweens.killTweensOf(root);
    root.setAlpha(0).setY(root.y + 8);
    scene.tweens.add({
      targets: root,
      alpha: 1,
      y: root.y - 8,
      duration: 220,
      ease: "Cubic.easeOut",
      yoyo: true,
      hold: 1400,
    });
  };

  root.add([shadow, body, text]);
  return root;
}
