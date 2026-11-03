export type LocaleCode = 'pt-BR' | 'en' | 'es' | 'ru' | 'zh-CN' | 'de';

export type TableId = 'outpost' | 'command_post' | 'mine';

export interface TableTranslation {
  name: string;
  subtitle: string;
  description: string;
  objectives: string[];
}

export interface TranslationDictionary {
  locale: LocaleCode;
  languageName: string;
  flag: string;
  windowTitle: string;
  menus: {
    game: string;
    newGame: string;
    launchBall: string;
    pause: string;
    resume: string;
    highScores: string;
    resetScores: string;
    options: string;
    soundEffects: string;
    music: string;
    ballTrails: string;
    collisionDebug: string;
    preferences: string;
    controls: string;
    table: string;
    selectTable: string;
    nudgeLeft: string;
    nudgeRight: string;
    nudgeUp: string;
    language: string;
    help: string;
    howToPlay: string;
    credits: string;
    about: string;
  };
  hud: {
    score: string;
    highScore: string;
    ball: string;
    multiplier: string;
    plungerPower: string;
    activeTable: string;
    missionStatus: string;
    targetsHit: string;
    bonusPool: string;
    ballSaveActive: string;
    multiballActive: string;
    tiltWarning: string;
    tilted: string;
    paused: string;
    clickToStart: string;
    pressSpaceToLaunch: string;
  };
  mobile: {
    leftFlipper: string;
    rightFlipper: string;
    launch: string;
    nudgeLeft: string;
    nudgeUp: string;
    nudgeRight: string;
  };
  tables: {
    outpost: TableTranslation;
    commandPost: TableTranslation;
    mine: TableTranslation;
  };
  led: {
    ready: string;
    shootAgain: string;
    tilt: string;
    gameOver: string;
    extraBall: string;
    bonusBall: string;
    multiplierUp: string;
    ballLocked: string;
    quickMultiball: string;
    threeBallMultiball: string;
    superGlide: string;
    orbitHurryUp: string;
    energyGems: string;
    spacePortBonus: string;
    labBonus: string;
    colonySaved: string;
    discoveryChallenge: string;
    supplyChallenge: string;
    energyChallenge: string;
    breachChallenge: string;
    alertChallenge: string;
    evacuationChallenge: string;
    repairChallenge: string;
    shootOpsCenter: string;
    motherlodeChallenge: string;
    blastingChallenge: string;
    motherlodeJackpot: string;
    shootRightMineShaft: string;
    superJets: string;
    invincibilityOn: string;
  };
  modals: {
    close: string;
    playTable: string;
    highScoresTitle: string;
    rank: string;
    commander: string;
    points: string;
    tableColumn: string;
    preferencesTitle: string;
    sfxVolume: string;
    musicVolume: string;
    physicsQuality: string;
    highQuality480Hz: string;
    controlsTitle: string;
    action: string;
    keyboardKey: string;
    touchControl: string;
    howToPlayTitle: string;
    howToPlayIntro: string;
    creditsTitle: string;
    aboutTitle: string;
    aboutDescription: string;
  };
}
