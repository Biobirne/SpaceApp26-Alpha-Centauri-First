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
