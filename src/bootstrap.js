import Phaser from "phaser";
import "./style.css";

import { StartScene } from "./scenes/StartScene.js";
import { SchoolIntroScene } from "./scenes/SchoolIntroScene.js";
import { InstituteIntroScene } from "./scenes/InstituteIntroScene.js";
import { MainGameSceneECS } from "./scenes/MainGameSceneECS.js";
import { RecoverySceneECS } from "./scenes/RecoveryScene.js";
import { HomeSceneECS } from "./scenes/HomeScene.js";
import { ShopSceneECS } from "./scenes/ShopScene.js";
import { FunSceneECS } from "./scenes/FunScene.js";
import { SocialSceneECS } from "./scenes/SocialScene.js";
import { CareerSceneECS } from "./scenes/CareerScene.js";
import { FinanceSceneECS } from "./scenes/FinanceScene.js";
import { EducationSceneECS } from "./scenes/EducationScene.js";
import { EventQueueSceneECS } from "./scenes/EventQueueScene.js";
import { SkillsScene } from "./scenes/SkillsScene.js";
import { HobbyScene } from "./scenes/HobbyScene.js";
import { HealthScene } from "./scenes/HealthScene.js";
import { SelfdevScene } from "./scenes/SelfdevScene.js";

const config = {
  type: Phaser.AUTO,
  parent: "game-container",
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: "#f8f4ed",
  scene: [
    StartScene,
    SchoolIntroScene,
    InstituteIntroScene,
    MainGameSceneECS,
    RecoverySceneECS,
    HomeSceneECS,
    ShopSceneECS,
    FunSceneECS,
    SocialSceneECS,
    CareerSceneECS,
    FinanceSceneECS,
    EducationSceneECS,
    EventQueueSceneECS,
    SkillsScene,
    HobbyScene,
    HealthScene,
    SelfdevScene,
  ],
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

const game = new Phaser.Game(config);
if (import.meta.env.DEV) {
  window.__GAME_LIFE_GAME = game;
}
