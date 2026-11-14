// SI disclosure: written with the SI tool Claude Code and reviewed by the team. See SI_USAGE.md and si-manifest.json.
// Game tuning. These numbers are GAME RULES, not NASA data. Tune them by playtesting.
// Real data (radiation, flares, particle events, dates) comes from data/storms/*.json.

export const CONFIG = {
  missionDays: 30,

  // Real seconds per in-game day.
  secondsPerDay: { normal: 15, fast: 5 },

  // Near-side base, so Earth is always in the sky. Lunar day/night is computed for the
  // real storm dates at this longitude (see sky.js).
  site: { name: 'Sea of Tranquility', nearby: 'near the Apollo 11 landing site', lonDeg: 23.47 },

  power: {
    capacity: 100,
    start: 100,
    solarPerDay: 24,          // full sun, clean panels
    dustySolarFactor: 0.4,    // lunar dust on the panels
    lifeSupportPerDay: 2.5,
    sciencePerDay: 1.5,
    nightHeatingPerDay: 1,    // keeping the base warm in the lunar night
    shieldPerDay: [0, 1.5, 3.5, 6], // shield level 0..3
    fissionPerDay: 5,         // upgrade
    warnBelow: 25,
    recoverAbove: 15,         // after a power emergency, science restarts above this
  },

  air: {
    start: 100,
    max: 100,
    regenPerDay: 12,          // life support, needs power
    greenhouseBonusPerDay: 4,
    leakPerDay: 28,
    cloggedFilterPerDay: 15,
    noPowerPerDay: 18,
    warnBelow: 30,
    emergencyRefill: 40,
  },

  dose: {
    limit: 100,
    perNormalDay: 0.25,       // dose units per day at 1x normal radiation, unshielded
    shieldBlock: [0, 0.6, 0.85, 0.95],
    shelterBlock: 0.9,
    wallsFactor: 0.6,         // upgrade: regolith walls multiply what gets through
    warnAbove: 70,
  },

  science: {
    perDay: 6,
    labLostFactor: 0.3,
    lowPowerFactor: 0.5,
    lowPowerBelow: 20,
    targetForStar: 120,
  },

  callEarth: { cooldownDays: 3, roundTripSeconds: 2.6 },

  events: {
    firstRandomDay: 2.2,
    randomGapDays: [3, 5],
    leakToLostDays: 2.5,
    // Flare cards: the first X-class flare, then only new record flares (others are mentioned).
    cardFlareMinClass: 'X1',
    minHoursBetweenFlareCards: 18,
    particleCardMergeDays: 1, // particle onsets closer than this share one card
    mentionEveryHours: 6,
    chatterEveryDays: 1.6,
  },

  // Invisible difficulty adjustment (Guide_Gamedesign_Attention.md, DDA). Only the random
  // problems (leaks, dust, filters) adapt. The real NASA storm data never changes.
  dda: {
    min: -1,                 // flawless play: problems come a bit sooner
    max: 2,                  // struggling: problems come much later
    upOnTrouble: 1,          // each setback or sealed room
    calmDaysToEase: 4,       // this long without trouble lowers the level by easeStep
    easeStep: 0.5,
    slowerPerLevel: 0.35,    // gap × (1 + 0.35 × level) when level > 0
    fasterPerLevel: 0.15,    // gap × (1 + 0.15 × level) when level < 0
    waitWhileOpenDays: 1,    // when struggling, no new problem while one is still open
  },

  radiation: {
    announceAtLeast: 10,      // times normal; crewmate announces new levels above this
  },

  upgrades: {
    battery: { cost: 40, capacityBonus: 40 },
    walls: { cost: 60 },
    fission: { cost: 80 },
  },
};

export const SHIELD_LABELS = ['Off', 'Low', 'Mid', 'Max'];
export const ROOM_IDS = ['solar', 'lab', 'hab', 'greenhouse', 'shelter'];

/** Difficulty levels (mentor feedback). Each one changes a copy of CONFIG. Kid-facing text: content.js. */
export const DIFFICULTY_TUNING = {
  easy: (c) => {
    c.events.randomGapDays = [4.5, 7];
    c.events.leakToLostDays = 4;
    c.power.capacity = 130;
    c.power.start = 130;
    c.callEarth.cooldownDays = 2;
    c.dose.perNormalDay = 0.2;
  },
  normal: () => {},
  hard: (c) => {
    c.events.randomGapDays = [2.2, 3.6];
    c.events.leakToLostDays = 1.6;
    c.power.solarPerDay = 21;
    c.callEarth.cooldownDays = 4;
    c.dda.max = 0.5; // the adaptive help stays small on Hard
  },
};

export function configFor(level = 'normal') {
  const key = DIFFICULTY_TUNING[level] ? level : 'normal';
  const c = structuredClone(CONFIG);
  DIFFICULTY_TUNING[key](c);
  c.difficulty = key;
  return c;
}
