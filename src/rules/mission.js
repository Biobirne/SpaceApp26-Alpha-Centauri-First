// SI disclosure: written with the SI tool Claude Code and reviewed by the team. See SI_USAGE.md and si-manifest.json.
// The mission simulation. Plain JS: no Phaser, no DOM. The controller calls tick() with
// elapsed game days and drains state.outbox to update the screen.

import { ROOM_IDS, SHIELD_LABELS, configFor } from './config.js';
import { CREWMATE_NAME, ROOMS, GLOSSARY, CHATTER, BADGES, LESSONS, UPGRADES } from './content.js';
import { buildTimeline, moonTimesNormal, flareScore, peakDay } from './storm.js';
import { isDaylight, sunElevation, earthLitFraction } from './sky.js';
import { createRng } from './rng.js';

const DAY_MS = 86400000;
const STEP = 0.02; // max simulation step in days (~29 minutes of mission time)
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const BLOCK_WORDS = ['nothing', 'more than half', 'most', 'almost all'];
const dayWord = (n) => `${n} ${n === 1 ? 'day' : 'days'}`;
const batteryPct = (state) => Math.round((state.power / state.capacity) * 100);

/**
 * @param script Optional scripted problems for guided first steps, e.g. [{ t: 0.7, kind: 'leak', roomId: 'hab' }].
 *   Random problems then start only after the script is done.
 */
export function createMission(stormDoc, { seed = 1, config = null, script = [] } = {}) {
  // Always work on a private copy: callers and tests may tune state.cfg without touching CONFIG.
  const cfg = config ?? configFor('normal');
  const timeline = buildTimeline(stormDoc, cfg.missionDays);
  const rng = createRng(seed);
  const state = {
    cfg,
    timeline,
    rng,
    seed,
    t: 0,
    ended: false,
    power: cfg.power.start,
    capacity: cfg.power.capacity,
    air: cfg.air.start,
    dose: 0,
    shield: 0,
    sheltered: false,
    forcedShelter: false,
    powerEmergency: false,
    doseLimitHit: false,
    science: 0,
    rooms: Object.fromEntries(ROOM_IDS.map((id) => [id, { status: 'ok', since: 0 }])),
    dust: false,
    filter: false,
    upgrades: { battery: false, suitport: false, algae: false, walls: false, fission: false },
    growLights: true,
    callEarth: { readyAt: 0, calls: 0 },
    pendingCard: null,
    cardQueue: [],
    lastCardT: -Infinity,
    outbox: [],
    words: [],
    flareIdx: 0,
    sepIdx: 0,
    dayIndex: -1,
    daylight: null,
    lastAnnounced: 1,
    nextRandomAt: Math.max(cfg.events.firstRandomDay, ...script.map((e) => e.t + cfg.events.randomGapDays[0])) + rng.range(0, 1),
    script: [...script].sort((a, b) => a.t - b.t),
    nextChatterAt: 0.6,
    chatterOrder: shuffle([...CHATTER.keys()], rng),
    chatterIdx: 0,
    warned: {},
    stats: { blockedDose: 0, totalDose: 0, leaksFixed: 0, repairs: 0, roomsLost: 0, setbacks: 0, cardsAnswered: 0 },
    // Difficulty level: 0 normal, above 0 the kid is struggling, below 0 it's too easy.
    dda: { level: 0, lastTroubleT: 0, lastEaseT: 0 },
    lessons: [],
    stormReports: [],
  };
  updateSky(state, true);
  const storm = firstStormDay(state);
  state.forecastT = storm != null && storm - state.cfg.forecastDaysAhead >= 1 ? storm - state.cfg.forecastDaysAhead : null;
  emit(state, 'crew', {
    mood: 'happy',
    text: `Hi Commander, I'm ${CREWMATE_NAME}! Real NASA data decides our space weather.`,
  });
  if (!state.daylight) {
    learn(state, 'lunarNight');
    emit(state, 'crew', { mood: 'calm', text: 'It’s lunar night right now, so the solar panels make no power. Save your battery!' });
  }
  // A calm Moon can still be a lesson: the real storm hit somewhere else.
  const aim = aimLesson(state, storm);
  if (aim) emit(state, 'crew', { mood: 'calm', text: aim });
  return state;
}

/** "This storm missed the Moon" for a storm whose peak is clearly somewhere else. */
function aimLesson(state, firstStorm) {
  if (firstStorm != null) return null;
  const moon = peakDay(state.timeline, 'moonOrbit');
  const other = ['marsSurface', 'iss', 'deepSpace']
    .map((site) => ({ site, peak: peakDay(state.timeline, site) }))
    .filter((x) => x.peak)
    .sort((a, b) => b.peak.times - a.peak.times)[0];
  if (!other || other.peak.times < 2) return null;
  if (moon && other.peak.times < moon.times * 1.5) return null;
  const name = { marsSurface: 'Mars', iss: 'the space station', deepSpace: 'deep space' }[other.site];
  return `This storm misses the Moon. NASA measured it at ${name} instead (${fmtTimes(other.peak.times)} normal). A storm does not hit every place!`;
}

function shuffle(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function emit(state, type, payload = {}) {
  state.outbox.push({ type, t: state.t, ...payload });
}

function learn(state, key) {
  if (state.words.includes(key)) return;
  state.words.push(key);
  emit(state, 'word', { key, ...GLOSSARY[key] });
}

export const dateMsAt = (state, t = state.t) => state.timeline.startMs + t * DAY_MS;
export const currentDayIndex = (state) => Math.min(state.cfg.missionDays - 1, Math.floor(state.t));
// `drillRadiation` is set only by the training intro (a practice alarm, labelled as not real data).
export const radiationNow = (state) => state.drillRadiation ?? moonTimesNormal(state.timeline, currentDayIndex(state));
export const isWorking = (state) => !state.sheltered && !state.forcedShelter && !state.powerEmergency;

/** Fraction of incoming radiation that the current setup blocks (0..1). */
export function blockFraction(state) {
  const c = state.cfg.dose;
  let through = 1 - c.shieldBlock[state.shield];
  if ((state.sheltered || state.forcedShelter) && state.rooms.shelter.status !== 'lost') {
    through *= 1 - c.shelterBlock;
    if (state.fort) through *= c.fortFactor; // heavy supplies stacked on the wall block even more
  }
  if (state.upgrades.walls) through *= c.wallsFactor;
  return 1 - through;
}

export function powerUsePerDay(state) {
  const p = state.cfg.power;
  return (
    p.lifeSupportPerDay +
    (isWorking(state) ? p.sciencePerDay : 0) +
    p.shieldPerDay[state.shield] +
    (state.daylight ? 0 : p.nightHeatingPerDay) +
    (plantsLit(state) ? p.growLightsPerDay : 0) +
    (state.upgrades.algae ? p.algaePerDay : 0)
  );
}

/** The greenhouse lamps are on and the plants are growing (they help the air). */
export function plantsLit(state) {
  return state.growLights && state.rooms.greenhouse.status === 'ok' && !state.powerEmergency;
}

/** Switch the greenhouse lamps: saves power, but the plants stop helping the air. */
export function setGrowLights(state, on) {
  if (on && state.powerEmergency) {
    emit(state, 'crew', { mood: 'alert', text: 'Not enough power for the plant lamps right now. Let the battery recharge first.' });
    return false;
  }
  state.growLights = !!on;
  emit(state, 'crew', on
    ? { mood: 'happy', text: 'Plant lamps on. The plants help clean the air again.' }
    : { mood: 'calm', text: 'Plant lamps off. That saves power, but the plants stop helping the air.' });
  return true;
}

/** The player opened the air loop: teach its words. */
export function noteLoopSeen(state) {
  learn(state, 'oxygenMachine');
  learn(state, 'recycling');
}

export function powerInPerDay(state) {
  const p = state.cfg.power;
  let solar = 0;
  if (state.daylight && state.rooms.solar.status !== 'lost') {
    const elev = sunElevation(dateMsAt(state), state.cfg.site.lonDeg);
    solar = p.solarPerDay * clamp(elev / 30, 0.25, 1) * (state.dust ? p.dustySolarFactor : 1);
  }
  return solar + (state.upgrades.fission ? p.fissionPerDay : 0);
}

export function sciencePerDay(state) {
  const s = state.cfg.science;
  if (!isWorking(state)) return 0;
  let rate = s.perDay;
  if (state.rooms.lab.status === 'lost') rate *= s.labLostFactor;
  else if (state.rooms.lab.status === 'leak') rate *= 0.5;
  if (state.power < s.lowPowerBelow) rate *= s.lowPowerFactor;
  return rate;
}

// ---------------------------------------------------------------- player actions

export function setShield(state, level) {
  const lvl = clamp(Math.round(level), 0, 3);
  if (state.powerEmergency && lvl > 0) {
    emit(state, 'crew', { mood: 'alert', text: 'Not enough power for the shield right now. Let the battery recharge first.' });
    return false;
  }
  state.shield = lvl;
  if (lvl > 0) learn(state, 'magnetShield');
  return true;
}

export function setShelter(state, on) {
  if (on && state.rooms.shelter.status === 'lost') return false;
  if (!on && state.forcedShelter) {
    emit(state, 'crew', { mood: 'alert', text: 'We must stay in the shelter until the radiation drops.' });
    return false;
  }
  state.sheltered = !!on;
  return true;
}

export function canAfford(state, cost) {
  return state.science >= cost;
}

export function buyUpgrade(state, key) {
  const up = state.cfg.upgrades[key];
  if (!up || state.upgrades[key] || !canAfford(state, up.cost)) return false;
  state.science -= up.cost;
  state.upgrades[key] = true;
  if (key === 'battery') { state.capacity += up.capacityBonus; state.power += up.capacityBonus; }
  if (key === 'algae') learn(state, 'recycling');
  emit(state, 'upgrade', { key });
  return true;
}

/** What an upgrade does, in one sentence with real numbers from the tuning and today's state. */
export function upgradeEffect(state, key) {
  const c = state.cfg;
  const r1 = (x) => Math.round(x * 10) / 10;
  const nightUse = r1(c.power.lifeSupportPerDay + c.power.sciencePerDay + c.power.nightHeatingPerDay
    + (state.growLights ? c.power.growLightsPerDay : 0));
  let n;
  if (key === 'battery') {
    const bonus = c.upgrades.battery.capacityBonus;
    n = { bonus, nightUse, days: Math.round(bonus / nightUse) };
  } else if (key === 'walls') {
    const f = c.dose.wallsFactor;
    const now = doseNow(state).perDay;
    const before = state.upgrades.walls ? now / f : now;
    n = { less: Math.round((1 - f) * 100), before: r1(before), after: r1(before * f) };
  } else if (key === 'algae') {
    n = {
      air: c.air.algaePerDay, clogged: c.air.cloggedFilterPerDay,
      cloggedAlgae: Math.round(c.air.cloggedFilterPerDay * c.air.algaeFilterFactor), power: c.power.algaePerDay,
    };
  } else if (key === 'suitport') {
    n = { chance: Math.round(c.eva.dustToFilterChance * 10) };
  } else if (key === 'fission') {
    n = { power: c.power.fissionPerDay, nightUse };
  }
  return n && UPGRADES[key]?.effect ? UPGRADES[key].effect(n) : '';
}

/** Problems the player can fix by tapping a room. */
export function repairFor(state, roomId) {
  const room = state.rooms[roomId];
  if (room.status === 'leak') return { roomId, kind: 'leak', taps: 4 };
  if (room.status === 'lost') return { roomId, kind: 'rebuild', taps: 6 }; // the repair itself is the price, no points (a sealed lab earns too few to pay)
  if (roomId === 'solar' && state.dust) return { roomId, kind: 'dust', taps: 5, eva: evaCost(state) };
  if (roomId === 'hab' && state.filter) return { roomId, kind: 'filter', taps: 3 };
  if (roomId === 'shelter' && fortOpen(state)) return { roomId, kind: 'fort', taps: 5 };
  return null;
}

/**
 * The storm fort: before or during a storm, the crew can stack heavy supplies against the shelter wall
 * (the real plan for NASA's Orion spaceship). It is a way to prepare, not a repair, and stays for the mission.
 */
function fortOpen(state) {
  return !state.fort && state.rooms.shelter.status === 'ok' && (state.stormSoon || radiationNow(state) >= 3);
}

/** A spacewalk outside: what it costs in radiation dose right now (no shield, no walls out there). */
export function evaCost(state) {
  const rad = radiationNow(state);
  const dose = state.cfg.dose.perNormalDay * rad * (state.cfg.eva.hours / 24);
  return { rad, dose: Math.round(dose * 10) / 10, hours: state.cfg.eva.hours };
}

/** Back from a spacewalk: add its dose, and Moon dust may come inside with the crew. */
function afterSpacewalk(state) {
  const eva = evaCost(state);
  state.dose += eva.dose;
  state.stats.totalDose += eva.dose;
  learn(state, 'eva');
  if (eva.dose >= 1) emit(state, 'crew', { mood: 'calm', text: `Back inside! The spacewalk added ${eva.dose} to our radiation dose. Outside, the shield can’t protect us.` });
  const c = state.cfg.eva;
  if (!state.upgrades.suitport && !state.filter && state.rng.next() < c.dustToFilterChance) {
    state.script.push({ t: state.t + state.rng.range(c.dustToFilterDays[0], c.dustToFilterDays[1]), kind: 'filter', cause: 'dust' });
    state.script.sort((a, b) => a.t - b.t);
    emit(state, 'crew', { mood: 'calm', text: 'Oh no, we brought Moon dust inside on our suits. It is bad for our lungs, and the air filter has to catch it.' });
  }
}

export function completeRepair(state, roomId, kind) {
  const room = state.rooms[roomId];
  if (kind === 'fort') {
    if (state.fort) return false;
    state.fort = true;
    emit(state, 'crew', { mood: 'happy', text: 'The storm wall is built! More stuff in the way means less radiation in the shelter.' });
    return true;
  }
  if (kind === 'leak' && room.status === 'leak') {
    room.status = 'ok';
    state.stats.leaksFixed++;
    emit(state, 'room', { roomId, status: 'ok' });
    emit(state, 'crew', { mood: 'happy', text: `Leak patched! The ${ROOMS[roomId].name.toLowerCase()} is airtight again. Nice work!` });
  } else if (kind === 'rebuild' && room.status === 'lost') {
    room.status = 'ok';
    emit(state, 'room', { roomId, status: 'ok' });
    emit(state, 'crew', { mood: 'happy', text: `The ${ROOMS[roomId].name.toLowerCase()} is open again. The wall holds and the air is back!` });
  } else if (kind === 'dust' && state.dust) {
    state.dust = false;
    emit(state, 'room', { roomId: 'solar', status: 'ok' });
    emit(state, 'crew', { mood: 'happy', text: 'Panels are clean. Full solar power again!' });
    afterSpacewalk(state);
  } else if (kind === 'filter' && state.filter) {
    state.filter = false;
    emit(state, 'room', { roomId: 'hab', status: 'ok' });
    emit(state, 'crew', { mood: 'happy', text: 'New filter in. The air is fresh again!' });
  } else return false;
  state.stats.repairs++;
  return true;
}

export function chooseOption(state, optionId) {
  const card = state.pendingCard;
  if (!card) return false;
  const opt = card.options.find((o) => o.id === optionId);
  if (!opt) return false;
  if (opt.disabled) return false;
  if (opt.effects.shield !== undefined && opt.effects.shield > 0 && state.powerEmergency) {
    // Battery empty: the shield can't run, but the rest of the choice still happens.
    if (opt.effects.sheltered !== undefined) setShelter(state, opt.effects.sheltered);
    state.stats.cardsAnswered++;
    state.pendingCard = null;
    emit(state, 'crew', { mood: 'calm', text: opt.effects.sheltered
      ? 'Everyone is in the shelter. The shield has no power, but the thick walls still protect us.'
      : 'The battery is empty, so the shield can’t run yet.' });
    if (state.cardQueue.length) showCard(state, state.cardQueue.shift());
    return true;
  }
  if (opt.effects.shield !== undefined) setShield(state, opt.effects.shield);
  if (opt.effects.sheltered !== undefined) setShelter(state, opt.effects.sheltered);
  state.stats.cardsAnswered++;
  state.pendingCard = null;
  if (opt.reply) emit(state, 'crew', { mood: opt.mood || 'calm', text: opt.reply });
  if (state.cardQueue.length) showCard(state, state.cardQueue.shift());
  return true;
}

// ---------------------------------------------------------------- Mission Control

export function callEarthReady(state) {
  return state.t >= state.callEarth.readyAt;
}

export function callEarth(state) {
  if (!callEarthReady(state)) return null;
  state.callEarth.calls++;
  state.callEarth.readyAt = state.t + state.cfg.callEarth.cooldownDays;
  return getAdvice(state);
}

/** The most useful tip right now, always with the reason and real numbers. */
export function getAdvice(state) {
  const rad = radiationNow(state);
  const leak = ROOM_IDS.find((id) => state.rooms[id].status === 'leak');
  const nextSep = state.timeline.seps[state.sepIdx];
  const recentBigFlare = [...state.timeline.flares]
    .reverse()
    .find((f) => f.t <= state.t && state.t - f.t < 1.5 && f.score >= flareScore('M5'));
  const night = nextNightChange(state);

  const lost = ['lab', 'greenhouse', 'shelter', 'solar', 'hab'].find((id) => state.rooms[id].status === 'lost');
  const shelterOk = state.rooms.shelter.status !== 'lost';
  const inside = state.sheltered || state.forcedShelter;

  if (state.air < 35 && leak) {
    return advice(`Fix the leak in the ${ROOMS[leak].name.toLowerCase()} first.`,
      `Air is escaping, and you have ${Math.round(state.air)}% left.`, { repair: leak });
  }
  // The crew must stay inside: say why, and that waiting is the right move (a kid can't fix this by tapping).
  if (state.forcedShelter) {
    return advice('Stay in the shelter and wait. You are doing it right.',
      `The crew's dose reached the safety limit. When radiation drops below 3× normal (now ${fmtTimes(rad)}), they can go back to work.`, null);
  }
  if (rad >= 20 && blockFraction(state) < 0.9) {
    if (state.powerEmergency) {
      return advice(shelterOk ? 'Send the crew to the shelter.' : 'Keep the crew inside and wait for power.',
        `Radiation is ${fmtTimes(rad)} normal, and the battery is empty, so the shield can't run.${shelterOk ? ' The shelter walls work without power.' : ''}`,
        shelterOk && !inside ? { sheltered: true } : null);
    }
    return advice(shelterOk ? `${inside ? 'Keep the crew in the shelter' : 'Send the crew to the shelter'} and set the shield to Mid.` : 'Set the shield to Max.',
      `Radiation near the Moon is ${fmtTimes(rad)} normal right now.`,
      shelterOk ? { shield: 2, sheltered: true } : { shield: 3 });
  }
  // Battery empty: say what still works and when power comes back.
  if (state.powerEmergency) {
    const night = nextNightChange(state);
    if (!state.daylight) {
      return advice('Wait for sunrise. Leave the shield off.',
        `The battery is empty and it's night, so the panels make no power.${night?.becomesDay ? ` The Sun rises in about ${dayWord(Math.max(1, Math.round(night.inDays)))}.` : ''} Without power the oxygen machine stops too, so keep an eye on the air.`, null);
    }
    if (state.dust) {
      return advice('Clean the solar panels.', 'The battery is empty, and Moon dust blocks most of the sunlight. Clean panels charge it much faster.', { repair: 'solar' });
    }
    return advice('Let the battery charge. Leave the shield off for now.',
      `The battery is empty. The Sun is up, so the panels are charging it: ${batteryPct(state)}% now. The lab starts again at ${Math.round(state.cfg.power.recoverAbove / state.capacity * 100)}%.`, null);
  }
  if (recentBigFlare && state.shield < 2 && rad < 20) {
    return advice('Raise your shield to Max.',
      `An ${recentBigFlare.cls} flare just went off. Its particles can arrive within hours.`, { shield: 3 });
  }
  if (leak) {
    return advice(`Tap the ${ROOMS[leak].name.toLowerCase()} to patch the leak.`,
      'Every hour it leaks, the crew loses air.', { repair: leak });
  }
  // A storm is coming and the shelter can be made stronger: a good thing to do while waiting.
  if (state.stormSoon && fortOpen(state)) {
    return advice('Build the storm wall: tap the shelter.',
      'A storm is coming. Heavy supplies on the shelter wall stop even more radiation.', { repair: 'shelter' });
  }
  if (state.dust && state.daylight) {
    const eva = evaCost(state);
    if (eva.dose >= 2) {
      return advice('Wait a little before you clean the solar panels.',
        `Cleaning them is a spacewalk, and radiation is ${fmtTimes(rad)} normal. It would add ${eva.dose} to the dose.`);
    }
    return advice('Clean the solar panels.', 'Moon dust is blocking most of the sunlight. Cleaning them is a short spacewalk.', { repair: 'solar' });
  }
  if (state.filter) {
    return advice('Swap the air filter in the home.', `A clogged filter cleans less air. Air is at ${Math.round(state.air)}% now.`, { repair: 'hab' });
  }
  // A lost building: say what is missing, and how to get it back.
  if (lost) {
    const name = ROOMS[lost].name.toLowerCase();
    const missing = {
      lab: `Until then, the lab makes only ${Math.round(state.cfg.science.labLostFactor * 100)}% of its science.`,
      greenhouse: 'Until then, the plants can’t help the air.',
      shelter: 'Until then, there is no shelter in a storm: use the shield.',
    }[lost] || '';
    return advice(`Reopen the ${name}: tap it.`, `It was sealed to save the air. Fix the wall and let the air back in. ${missing}`, { repair: lost });
  }
  if (state.dose > state.cfg.dose.warnAbove && rad > 3) {
    return advice(state.sheltered || state.forcedShelter ? 'Keep the crew in the shelter for now.' : 'Send the crew to the shelter for now.',
      `Their radiation dose is already ${Math.round(state.dose)} of ${state.cfg.dose.limit}.`, { sheltered: true });
  }
  if (!state.daylight && batteryPct(state) < 40 && state.shield > 0 && rad < 5) {
    return advice('Turn the shield down to save power.',
      `It’s night, there’s no sunlight, and your battery is at ${batteryPct(state)}%. Radiation is calm.`, { shield: 0 });
  }
  if (state.daylight && batteryPct(state) < state.cfg.power.warnBelow && state.shield > 0 && rad < 5) {
    return advice('Turn the shield down until the battery is fuller.',
      `The battery is at ${batteryPct(state)}%, and radiation is calm (${fmtTimes(rad)} normal).`, { shield: 0 });
  }
  if (night && !night.becomesDay && night.inDays < 3 && batteryPct(state) < 70) {
    return advice('Charge up before dark: keep the shield low.',
      `The Sun sets in about ${dayWord(Math.max(1, Math.round(night.inDays)))}. Then the night lasts about 2 weeks.`, { shield: Math.min(state.shield, 1) });
  }
  // 18: only "back to work" when the crew is really in the shelter
  if (rad < 5 && state.sheltered && !state.forcedShelter) {
    return advice('It’s safe to get back to work.', `Radiation is down to ${fmtTimes(rad)} normal. Science needs the crew in the lab.`,
      { sheltered: false, shield: Math.min(state.shield, 1) });
  }
  if (rad < 5 && state.shield >= 2) {
    return advice('Radiation is calm: turn the shield down.', `Radiation is down to ${fmtTimes(rad)} normal. Shield on Low saves power.`,
      { shield: 1 });
  }
  if (nextSep && nextSep.t - state.t < 3) {
    return advice('Stay alert: keep your shield ready.', 'Our space weather team sees an active Sun. More particles may come soon.', null);
  }
  return advice('Everything looks great. Keep the science going!',
    `Radiation is ${fmtTimes(rad)} normal, battery ${batteryPct(state)}%, air ${Math.round(state.air)}%.`, null);
}

function advice(text, reason, action) {
  return { text, reason, action };
}

export function applyAdvice(state, action) {
  if (!action) return;
  if (action.shield !== undefined) setShield(state, action.shield);
  if (action.sheltered !== undefined) setShelter(state, action.sheltered);
}

/** What Mission Control's plan would change, in a few words (the button label). */
export function describeAdvice(state, action) {
  if (!action) return null;
  if (action.repair === 'shelter' && fortOpen(state)) return 'Build the storm wall';
  if (action.repair && state.rooms[action.repair].status === 'lost') return `Reopen the ${ROOMS[action.repair].name.toLowerCase()}`;
  if (action.repair) return `Fix the ${ROOMS[action.repair].name.toLowerCase()}`;
  const parts = [];
  if (action.shield !== undefined && action.shield !== state.shield) parts.push(`Shield to ${SHIELD_LABELS[action.shield]}`);
  if (action.sheltered === true && !state.sheltered) parts.push('crew to the shelter');
  if (action.sheltered === false && state.sheltered) parts.push('crew back to work');
  if (!parts.length) return null;
  const text = parts.join(', ');
  return text[0].toUpperCase() + text.slice(1);
}

/** After the plan is set: what is true now, and what it costs (said by the crewmate). */
export function explainSetup(state) {
  const cfg = state.cfg;
  const lvl = state.shield;
  const shield = lvl === 0
    ? 'The shield is off, so it uses no power.'
    : `The shield is on ${SHIELD_LABELS[lvl]}: it blocks ${BLOCK_WORDS[lvl]} of the radiation and uses ${cfg.power.shieldPerDay[lvl]} ⚡ a day.`;
  const shelter = state.sheltered
    ? ' The crew is in the shelter: very safe, but no science.'
    : ' The crew is working, so science goes on.';
  return shield + shelter;
}

export function fmtTimes(x) {
  if (x >= 10) return `${Math.round(x)}×`;
  return `${(Math.round(x * 10) / 10).toString()}×`;
}

function nextNightChange(state) {
  const lon = state.cfg.site.lonDeg;
  const now = isDaylight(dateMsAt(state), lon);
  for (let h = 1; h <= 20 * 24; h += 3) {
    const t = state.t + h / 24;
    if (isDaylight(dateMsAt(state, t), lon) !== now) return { inDays: h / 24, becomesDay: !now };
  }
  return null;
}

// ---------------------------------------------------------------- simulation

export function tick(state, dtDays) {
  if (state.ended || state.pendingCard) return;
  let remaining = dtDays;
  while (remaining > 1e-9 && !state.ended && !state.pendingCard) {
    const h = Math.min(STEP, remaining);
    remaining -= h;
    step(state, h);
  }
}

function step(state, h) {
  const cfg = state.cfg;
  state.t = Math.min(cfg.missionDays, state.t + h);

  const dayIdx = currentDayIndex(state);
  if (dayIdx !== state.dayIndex) onNewDay(state, dayIdx);
  updateSky(state, false);
  checkForecast(state);
  processDataEvents(state);
  if (state.pendingCard) return;
  while (state.script.length && state.script[0].t <= state.t) {
    const e = state.script.shift();
    startProblem(state, e.kind, e.roomId, e.cause);
  }
  if (state.t >= state.nextRandomAt) randomEvent(state);

  // power
  const inflow = powerInPerDay(state);
  const use = powerUsePerDay(state);
  state.power = clamp(state.power + (inflow - use) * h, 0, state.capacity);
  if (state.power <= 0 && !state.powerEmergency) {
    const shieldWas = state.shield;
    state.powerEmergency = true;
    state.shield = 0;
    state.growLights = false;
    state.stats.setbacks++;
    trouble(state);
    emit(state, 'setback', { kind: 'power' });
    emit(state, 'crew', { mood: 'alert', text: 'Battery empty! The shield, the lab and the plant lamps are off. The oxygen machine has no power either, so watch the air!' });
    lesson(state, 'power', { night: !state.daylight, shield: shieldWas > 0, dust: state.dust });
  } else if (state.powerEmergency && state.power > cfg.power.recoverAbove) {
    state.powerEmergency = false;
    emit(state, 'crew', { mood: 'happy', text: isWorking(state)
      ? 'Power is back. The lab is running again. The shield and plant lamps are still off: turn them on when you need them.'
      : 'Power is back. The shield and plant lamps are still off: turn them on when you need them.' });
  }
  threshold(state, 'power', state.power / state.capacity * 100 < cfg.power.warnBelow,
    () => (state.daylight && state.shield > 0 ? 'Battery is low! Turn the shield down a bit.'
      : state.daylight ? 'Battery is low! Switch off the plant lamps, or the shelter pauses the lab.'
        : 'Battery is low and it’s night. Turn off what you can.'));

  // air
  const lifeSupportOn = state.power > 0 || inflow >= cfg.power.lifeSupportPerDay;
  const air = airBreakdown(state).reduce((sum, r) => sum + r.perDay, 0);
  state.air = clamp(state.air + air * h, 0, cfg.air.max);
  if (state.air <= 0) {
    state.air = cfg.air.emergencyRefill;
    state.science = Math.max(0, state.science - 10);
    state.stats.setbacks++;
    trouble(state);
    emit(state, 'setback', { kind: 'air' });
    emit(state, 'crew', { mood: 'alert', text: 'Air ran out, so we opened the emergency oxygen tanks. Everyone is fine, but we lost some science.' });
    const leakId = ROOM_IDS.find((id) => state.rooms[id].status === 'leak');
    lesson(state, 'air', { leak: leakId ? ROOMS[leakId].name.toLowerCase() : null, filter: state.filter, noPower: !lifeSupportOn });
  }
  threshold(state, 'air', state.air < cfg.air.warnBelow, () => 'Air is getting low! Fix leaks and keep life support powered.');

  // leaks that wait too long: the crew closes the hatch and the room is lost
  for (const id of ['lab', 'greenhouse']) {
    const room = state.rooms[id];
    if (room.status === 'leak' && state.t - room.since > cfg.events.leakToLostDays) {
      room.status = 'lost';
      state.stats.roomsLost++;
      trouble(state);
      emit(state, 'room', { roomId: id, status: 'lost' });
      emit(state, 'crew', { mood: 'alert', text: `We sealed the ${ROOMS[id].name.toLowerCase()} to save the air. Tap it to fix the wall and open it again.` });
      lesson(state, 'roomLost', { room: ROOMS[id].name.toLowerCase(), days: Math.round(state.t - room.since) });
    }
  }

  // radiation
  const rad = radiationNow(state);
  const unshielded = cfg.dose.perNormalDay * rad * h;
  const got = unshielded * (1 - blockFraction(state));
  state.dose += got;
  state.stats.totalDose += got;
  state.stats.blockedDose += unshielded - got;
  if (state.stormDose) {
    // what would have got through in the shelter, with the same shield and walls
    const c = cfg.dose;
    const shelterOk = state.rooms.shelter.status !== 'lost';
    const through = (1 - c.shieldBlock[state.shield]) * (shelterOk ? 1 - c.shelterBlock : 1) * (state.upgrades.walls ? c.wallsFactor : 1);
    state.stormDose.taken += got;
    if (state.sheltered || state.forcedShelter || state.shield > 0) state.stormDose.protected = true;
    state.stormDose.inShelter += Math.min(got, unshielded * through);
  }
  if (state.dose >= cfg.dose.limit && rad > 3 && !state.forcedShelter && state.rooms.shelter.status !== 'lost') {
    state.forcedShelter = true;
    if (!state.doseLimitHit) state.stats.setbacks++;
    state.doseLimitHit = true;
    trouble(state);
    emit(state, 'setback', { kind: 'dose' });
    emit(state, 'crew', { mood: 'alert', text: 'Our radiation dose hit the safety limit. Everyone into the shelter until the storm calms down!' });
    lesson(state, 'dose', { shieldLabel: SHIELD_LABELS[state.shield], sheltered: state.sheltered });
  } else if (state.forcedShelter && rad <= 3) {
    state.forcedShelter = false;
    emit(state, 'crew', { mood: 'happy', text: 'Radiation has calmed down. We can leave the shelter.' });
  }
  threshold(state, 'dose', state.dose > cfg.dose.warnAbove && state.dose < cfg.dose.limit,
    () => 'Our radiation dose is getting high. More shielding or the shelter would help.');

  // science
  state.science += sciencePerDay(state) * h;

  // chatter in calm moments
  if (state.t >= state.nextChatterAt) {
    state.nextChatterAt = state.t + cfg.events.chatterEveryDays * (0.8 + state.rng.next() * 0.6);
    if (rad < 5 && !anyProblem(state)) {
      const line = CHATTER[state.chatterOrder[state.chatterIdx++ % state.chatterOrder.length]];
      emit(state, 'crew', { mood: 'calm', text: line, chatter: true });
    }
  }

  if (state.t >= cfg.missionDays) endMission(state);
}

function anyProblem(state) {
  return state.dust || state.filter || ROOM_IDS.some((id) => state.rooms[id].status === 'leak');
}

function threshold(state, key, active, text) {
  if (active && !state.warned[key]) {
    state.warned[key] = true;
    emit(state, 'warn', { key });
    emit(state, 'crew', { mood: 'alert', text: text() });
  } else if (!active) state.warned[key] = false;
}

function updateSky(state, initial) {
  const ms = dateMsAt(state);
  const day = isDaylight(ms, state.cfg.site.lonDeg);
  if (day !== state.daylight) {
    const was = state.daylight;
    state.daylight = day;
    emit(state, 'daylight', { isDay: day });
    if (!initial && was !== null) {
      if (day) emit(state, 'crew', { mood: 'happy', text: 'Sunrise! The solar panels are making power again.' });
      else {
        learn(state, 'lunarNight');
        emit(state, 'crew', { mood: 'calm', text: 'Sunset. The lunar night lasts about two weeks, so save your power!' });
        if (!state.lampHintGiven && plantsLit(state)) {
          state.lampHintGiven = true;
          emit(state, 'crew', { mood: 'calm', text: 'The plant lamps use power too. Tap the greenhouse to switch them off if the battery gets low.' });
        }
      }
    }
  }
  state.earthLit = earthLitFraction(ms);
}

/** The first day the storm gets announced (same rule as onNewDay), or null. */
function firstStormDay(state) {
  const cfg = state.cfg.radiation;
  let prev = moonTimesNormal(state.timeline, 0);
  for (let d = 1; d < state.cfg.missionDays; d++) {
    const rad = moonTimesNormal(state.timeline, d);
    if (rad >= cfg.announceAtLeast && rad >= prev * 1.5) return d;
    prev = rad;
  }
  return null;
}

/** Nothing needs the player right now, so the clock may run faster (see calmSecondsPerDay). */
export function isCalm(state) {
  if (state.pendingCard || state.stormActive || state.stormSoon || state.powerEmergency) return false;
  if (radiationNow(state) >= 3 || state.dust || state.filter) return false;
  if (ROOM_IDS.some((id) => state.rooms[id].status === 'leak')) return false;
  if (state.power / state.capacity * 100 < state.cfg.power.warnBelow || state.air < state.cfg.air.warnBelow) return false;
  return true;
}

/**
 * After a storm: what the crew got, next to what the shelter would have let through.
 * The risky choice gets a visible, explained result (playtest: "Keep working" had no felt consequence).
 */
function stormReport(state) {
  const r = state.stormDose;
  state.stormDose = null;
  if (!r) return;
  const took = Math.round(r.taken);
  const shelter = Math.max(1, Math.round(r.inShelter));
  let text;
  if (r.taken >= 3 && r.taken > r.inShelter * 2) {
    text = `Storm report: the crew got +${took} dose. In the shelter it would have been about +${shelter}. Working costs safety.`;
  } else if (r.taken < 3) {
    text = r.protected
      ? `Storm report: only +${Math.max(0, took)} dose for the crew. The shelter and shield did their job!`
      : `Storm report: only +${Math.max(0, took)} dose for the crew. That storm was mild.`;
  } else {
    // most of it came in the shelter: a really strong storm (or the dose limit sent everyone inside)
    text = `Storm report: the crew got +${took} dose, even with the shelter. That was a really strong storm!`
      + (state.shield < 3 ? ' Shield on Max in the shelter blocks even more.' : '');
  }
  state.stormReports.push({ day: Math.floor(state.t) + 1, taken: took, inShelter: shelter });
  emit(state, 'crew', { mood: 'calm', keep: true, text });
}

/** Space weather forecasters watch the Sun: pass on a warning before the first storm. */
function checkForecast(state) {
  if (state.forecastT == null || state.forecastGiven || state.t < state.forecastT) return;
  state.forecastGiven = true;
  state.stormSoon = true;
  emit(state, 'forecast', {});
  emit(state, 'crew', {
    mood: 'alert',
    text: 'Forecast from Earth: the Sun has a big, busy sunspot. A storm may come soon. Charge the battery!',
  });
}

function onNewDay(state, dayIdx) {
  state.dayIndex = dayIdx;
  const rad = moonTimesNormal(state.timeline, dayIdx);
  emit(state, 'newDay', { dayIndex: dayIdx, iso: state.timeline.days[dayIdx].iso, radiation: rad });
  const cfg = state.cfg.radiation;
  const yesterday = state.lastAnnounced; // radiation of the previous day
  emit(state, 'radiation', { times: rad });
  if (rad >= cfg.announceAtLeast && rad >= yesterday * 1.5) {
    learn(state, 'radiation');
    state.stormActive = true;
    state.stormSoon = false;
    state.stormDose = { taken: 0, inShelter: 0 };
    emit(state, 'crew', {
      mood: 'alert',
      text: `Real NASA data: radiation near the Moon is ${fmtTimes(rad)} normal today!`,
    });
  } else if (state.stormActive && rad < 5) {
    state.stormActive = false;
    emit(state, 'crew', {
      mood: 'happy',
      text: state.sheltered
        ? `The storm is fading: radiation is back to ${fmtTimes(rad)} normal. Tap Shelter to get back to work!`
        : `The storm is fading. Radiation is back to ${fmtTimes(rad)} normal.`,
    });
    stormReport(state);
  }
  state.lastAnnounced = rad;
}

function processDataEvents(state) {
  const tl = state.timeline;
  const ev = state.cfg.events;
  while (state.flareIdx < tl.flares.length && tl.flares[state.flareIdx].t <= state.t) {
    const f = tl.flares[state.flareIdx++];
    if (f.score < flareScore('M1')) continue;
    emit(state, 'flare', { cls: f.cls, score: f.score });
    // Cards only for the first X flare and for new records; other big flares get a mention.
    const isRecord = f.score >= flareScore(ev.cardFlareMinClass) && f.score > (state.biggestCardFlare ?? 0);
    const hoursSince = (state.t - (state.lastFlareCardT ?? -Infinity)) * 24;
    if (isRecord && hoursSince >= ev.minHoursBetweenFlareCards) {
      learn(state, 'flare');
      state.biggestCardFlare = f.score;
      state.lastFlareCardT = state.t;
      queueCard(state, flareCard(state, f));
    } else if (f.score >= flareScore('M5')) {
      mention(state, `${state.flareMentioned ? 'Another' : 'A big'} ${f.cls} flare on the Sun! Keep an eye on the radiation.`);
      state.flareMentioned = true;
    }
  }
  while (state.sepIdx < tl.seps.length && tl.seps[state.sepIdx].t <= state.t) {
    const sep = tl.seps[state.sepIdx++];
    learn(state, 'particles');
    emit(state, 'particles', {});
    if (sep.t - (state.lastParticleCardT ?? -Infinity) >= ev.particleCardMergeDays) {
      state.lastParticleCardT = sep.t;
      queueCard(state, particleCard(state), true);
    } else {
      mention(state, 'More solar particles are arriving!');
    }
  }
}

function mention(state, text) {
  if ((state.t - (state.lastMentionT ?? -Infinity)) * 24 < state.cfg.events.mentionEveryHours) return;
  state.lastMentionT = state.t;
  emit(state, 'crew', { mood: 'alert', text });
}

function queueCard(state, card, urgent = false) {
  if (!state.pendingCard) showCard(state, card);
  else if (urgent) state.cardQueue.unshift(card);
  else state.cardQueue.push(card);
}

function showCard(state, card) {
  // Build the choices now, not when the card was queued: they must match the shield the kid has set.
  if (card.kind === 'flare') card.options = flareOptions(state);
  else if (card.kind === 'particles') card.options = particleOptions(state);
  if (state.powerEmergency) {
    for (const o of card.options) if (o.effects.shield > 0 && !o.effects.sheltered) o.disabled = 'Battery empty';
  }
  state.pendingCard = card;
  state.lastCardT = state.t;
  emit(state, 'card', { card });
}

const shieldCost = (state, lvl) => `−${state.cfg.power.shieldPerDay[lvl]} ⚡/day`;

/** "Shield up to Max", "Keep shield on Mid" or "Shield down to Low", from the shield the kid has now. */
function shieldMove(state, lvl) {
  const name = SHIELD_LABELS[lvl];
  if (lvl > state.shield) return `Shield up to ${name}`;
  if (lvl < state.shield) return `Shield down to ${name}`;
  return `Keep shield on ${name}`;
}

/** Two choices that end in the same place are one choice: keep the first. */
function distinct(state, options) {
  const seen = new Set();
  return options.filter((o) => {
    const key = `${o.effects.shield ?? state.shield}|${o.effects.sheltered ?? (state.sheltered || state.forcedShelter)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function flareOptions(state) {
  const cur = state.shield;
  const inside = state.sheltered || state.forcedShelter;
  const maxReply = cur === 3
    ? 'The shield stays on Max. It stops almost all particles, but it eats power.'
    : 'Shield up to Max! It stops almost all particles. It does eat power, though.';
  const midReply = cur > 2
    ? 'Shield down to Mid. It still stops most particles and saves power.'
    : cur === 2 ? 'The shield stays on Mid. It stops most particles.'
      : 'Shield up to Mid. It stops most particles and saves some power.';
  return distinct(state, [
    { id: 'max', label: shieldMove(state, 3), cost: shieldCost(state, 3), effects: { shield: 3 }, mood: 'happy', reply: maxReply },
    { id: 'mid', label: shieldMove(state, 2), cost: shieldCost(state, 2), effects: { shield: 2 }, mood: 'calm', reply: midReply },
    { id: 'wait', label: 'Wait and see', cost: 'Risky', effects: {}, mood: 'calm',
      reply: inside ? 'Okay, the shield stays as it is. Watch the radiation level!' : 'Okay, we keep working. Watch the radiation level!' },
  ]);
}

function particleOptions(state) {
  const cur = state.shield;
  const inside = state.sheltered || state.forcedShelter;
  const options = [];
  if (state.rooms.shelter.status !== 'lost') {
    // The shelter is the power-saving choice: its walls do the work, so the shield goes to Low.
    const shieldNote = cur === 1 ? '' : `, shield ${cur > 1 ? 'down' : 'up'} to Low`;
    options.push({ id: 'shelter', label: `${inside ? 'Stay in the shelter' : 'Crew to shelter'}${shieldNote}`,
      cost: `${shieldCost(state, 1)}, no science`, effects: { sheltered: true, shield: 1 }, mood: 'happy',
      reply: cur > 1
        ? `Everyone is in the shelter. Its thick walls block most of the radiation, so I turned the shield down to Low to save power. Good plan!`
        : 'Everyone is in the shelter. Its thick walls block most of the radiation, and the shield on Low uses only a little power. Good plan!' });
  }
  if (!state.forcedShelter) {
    options.push({ id: 'max', label: inside ? `${shieldMove(state, 3)}, back to work` : shieldMove(state, 3),
      cost: shieldCost(state, 3), effects: { shield: 3, sheltered: false }, mood: 'calm',
      reply: 'Shield at Max, and the crew is working. That costs a lot of power.' });
    options.push({ id: 'work', label: inside ? 'Back to work' : 'Keep working', cost: cur >= 2 ? `Shield stays ${SHIELD_LABELS[cur]}` : 'Risky',
      effects: { sheltered: false }, mood: 'calm',
      reply: cur >= 2 ? `We work with the shield on ${SHIELD_LABELS[cur]}. Some radiation still gets through.` : 'We keep working. Our radiation dose will go up.' });
  }
  return distinct(state, options);
}

function flareCard(state, f) {
  const x = f.score >= flareScore('X1');
  const first = state.stats.flareCards === undefined;
  state.stats.flareCards = (state.stats.flareCards ?? 0) + 1;
  return {
    kind: 'flare',
    title: first ? `Solar flare: ${f.cls}!` : `New record flare: ${f.cls}!`,
    text: 'A giant flash on the Sun. Fast particles may follow within hours.',
    fact: x ? 'X flares are the biggest kind. X2 is twice as strong as X1.' : 'M flares are big. X flares are 10 times bigger.',
    options: flareOptions(state),
  };
}

function particleCard(state) {
  const options = particleOptions(state);
  state.particleWaves = (state.particleWaves || 0) + 1;
  const wave = state.particleWaves;
  const rad = radiationNow(state);
  return {
    kind: 'particles',
    title: wave === 1 ? 'Particle storm!' : wave === 2 ? 'Second wave of particles!' : `Particle wave number ${wave}!`,
    text: rad >= 3
      ? `Fast particles from the Sun are hitting the Moon. Radiation today: ${fmtTimes(rad)} normal (real NASA data).`
      : `NASA measured fast particles from the Sun. Near the Moon it is still ${fmtTimes(rad)} normal today, but it can rise fast.`,
    fact: 'The Moon has no air and no magnetic field to stop them.',
    options,
  };
}

/** Explain a setback: why it happened and what to try next time. Collected for the end screen. */
function lesson(state, kind, ctx) {
  const l = LESSONS[kind](ctx);
  state.lessons.push({ kind, day: Math.floor(state.t) + 1, ...l });
  emit(state, 'crew', { mood: 'calm', keep: true, text: `Why did that happen? ${l.why} Next time: ${l.next}` });
}

/** Where the power comes from and goes to, per day (for the power info sheet). */
export function powerBreakdown(state) {
  const p = state.cfg.power;
  const fission = state.upgrades.fission ? p.fissionPerDay : 0;
  const solar = powerInPerDay(state) - fission;
  const rows = [];
  let solarLabel = 'Solar panels';
  if (state.rooms.solar.status === 'lost') solarLabel = 'Solar panels (sealed)';
  else if (!state.daylight) solarLabel = 'Solar panels (night: no sunlight)';
  else if (state.dust) solarLabel = 'Solar panels (dusty)';
  rows.push({ label: solarLabel, perDay: solar });
  if (fission) rows.push({ label: UPGRADES.fission.name, perDay: fission });
  rows.push({ label: 'Oxygen machine, filters and lights', perDay: -p.lifeSupportPerDay });
  if (plantsLit(state)) rows.push({ label: 'Plant lamps in the greenhouse', perDay: -p.growLightsPerDay });
  if (state.upgrades.algae) rows.push({ label: UPGRADES.algae.name, perDay: -p.algaePerDay });
  if (isWorking(state)) rows.push({ label: 'Lab work', perDay: -p.sciencePerDay });
  if (state.shield) rows.push({ label: `Shield on ${SHIELD_LABELS[state.shield]}`, perDay: -p.shieldPerDay[state.shield] });
  if (!state.daylight) rows.push({ label: 'Heating in the cold night', perDay: -p.nightHeatingPerDay });
  return rows;
}

/** Where the air comes from and goes to, per day (for the air info sheet). */
export function airBreakdown(state) {
  const a = state.cfg.air;
  const on = state.power > 0 || powerInPerDay(state) >= state.cfg.power.lifeSupportPerDay;
  const rows = [on
    ? { label: 'Oxygen machine and CO₂ filter (need power)', perDay: a.regenPerDay }
    : { label: 'Oxygen machine is off: no power!', perDay: -a.noPowerPerDay }];
  if (on && plantsLit(state)) rows.push({ label: 'Plants in the greenhouse', perDay: a.greenhouseBonusPerDay });
  if (on && state.upgrades.algae) rows.push({ label: UPGRADES.algae.name, perDay: a.algaePerDay });
  for (const id of ROOM_IDS) if (state.rooms[id].status === 'leak') rows.push({ label: `Leak in the ${ROOMS[id].name.toLowerCase()}`, perDay: -a.leakPerDay });
  if (state.filter) {
    rows.push({
      label: state.upgrades.algae ? 'Clogged CO₂ filter (the algae help)' : 'Clogged CO₂ filter',
      perDay: -a.cloggedFilterPerDay * (state.upgrades.algae ? a.algaeFilterFactor : 1),
    });
  }
  return rows;
}

/** Live status of each step of the life support loop (for the air sheet). */
export function lifeLoop(state) {
  const on = state.power > 0 || powerInPerDay(state) >= state.cfg.power.lifeSupportPerDay;
  const leak = ROOM_IDS.find((id) => state.rooms[id].status === 'leak');
  let plants = 'on';
  if (state.rooms.greenhouse.status === 'lost') plants = 'lost';
  else if (state.rooms.greenhouse.status === 'leak') plants = 'leak';
  else if (!plantsLit(state)) plants = 'dark';
  return {
    crew: 'breathing',
    filter: state.filter ? 'clogged' : 'ok',
    water: on ? 'ok' : 'off',
    oxygen: on ? 'ok' : 'off',
    plants,
    algae: state.upgrades.algae ? (on ? 'ok' : 'off') : 'none',
    leak: leak ? ROOMS[leak].name : null,
  };
}

/**
 * Every shield level side by side, for the crew's current place (working or in the shelter):
 * how much it blocks, what it costs, and how much dose would get through each day right now.
 */
export function shieldOptions(state) {
  const c = state.cfg.dose;
  const rad = radiationNow(state);
  const inShelter = (state.sheltered || state.forcedShelter) && state.rooms.shelter.status !== 'lost';
  return SHIELD_LABELS.map((label, level) => {
    let through = 1 - c.shieldBlock[level];
    if (inShelter) {
      through *= 1 - c.shelterBlock;
      if (state.fort) through *= c.fortFactor;
    }
    if (state.upgrades.walls) through *= c.wallsFactor;
    return {
      level, label, current: level === state.shield,
      shieldBlock: c.shieldBlock[level],
      cost: state.cfg.power.shieldPerDay[level],
      perDay: c.perNormalDay * rad * through,
    };
  });
}

/** The player opened the shield sheet: teach the word. */
export function noteShieldSeen(state) {
  learn(state, 'magnetShield');
}

/** Radiation dose right now: outside level, what blocks it, what gets through per day. */
export function doseNow(state) {
  const rad = radiationNow(state);
  const block = blockFraction(state);
  return { rad, block, perDay: state.cfg.dose.perNormalDay * rad * (1 - block) };
}

/** Something went wrong for the player: random problems slow down. */
function trouble(state) {
  const d = state.dda;
  d.level = Math.min(state.cfg.dda.max, d.level + state.cfg.dda.upOnTrouble);
  d.lastTroubleT = state.t;
}

/** How much longer (or shorter) the gap to the next random problem is right now. */
export function randomGapScale(state) {
  const { level } = state.dda;
  const c = state.cfg.dda;
  return level >= 0 ? 1 + level * c.slowerPerLevel : 1 + level * c.fasterPerLevel;
}

const hasOpenProblem = (state) => state.dust || state.filter || ROOM_IDS.some((id) => state.rooms[id].status === 'leak');

function randomEvent(state) {
  const cfg = state.cfg.events;
  const c = state.cfg.dda;
  const d = state.dda;
  const rng = state.rng;
  // Calm stretch: the player is doing fine, so the level drifts down step by step.
  if (state.t - Math.max(d.lastTroubleT, d.lastEaseT) >= c.calmDaysToEase) {
    d.level = Math.max(c.min, d.level - c.easeStep);
    d.lastEaseT = state.t;
  }
  // A struggling player gets one problem at a time.
  if (d.level > 0 && hasOpenProblem(state)) {
    state.nextRandomAt = state.t + c.waitWhileOpenDays;
    return;
  }
  state.nextRandomAt = state.t + rng.range(cfg.randomGapDays[0], cfg.randomGapDays[1]) * randomGapScale(state);
  const leakable = ['lab', 'greenhouse', 'hab'].filter((id) => state.rooms[id].status === 'ok');
  const options = [];
  if (leakable.length) options.push('leak', 'leak');
  if (state.daylight && !state.dust && state.rooms.solar.status === 'ok') options.push('dust');
  if (!state.filter) options.push('filter');
  if (!options.length) return;
  const kind = rng.pick(options);
  startProblem(state, kind, kind === 'leak' ? rng.pick(leakable) : null);
}

function startProblem(state, kind, id, cause = null) {
  if (kind === 'leak') {
    if (state.rooms[id].status !== 'ok') return;
    state.rooms[id].status = 'leak';
    state.rooms[id].since = state.t;
    learn(state, 'micrometeoroid');
    emit(state, 'room', { roomId: id, status: 'leak' });
    emit(state, 'crew', { mood: 'alert', text: `A tiny space rock hit the ${ROOMS[id].name.toLowerCase()}! Air is leaking. Tap the room to fix it!` });
  } else if (kind === 'dust') {
    state.dust = true;
    learn(state, 'dust');
    emit(state, 'room', { roomId: 'solar', status: 'dust' });
    emit(state, 'crew', { mood: 'alert', text: 'Moon dust is covering the solar panels. Tap them to clean them!' });
  } else {
    if (state.filter) return;
    state.filter = true;
    learn(state, 'scrubber');
    emit(state, 'room', { roomId: 'hab', status: 'filter' });
    emit(state, 'crew', {
      mood: 'alert',
      text: cause === 'dust'
        ? 'Moon dust from the spacewalk clogged the air filter. Tap Home to swap it!'
        : 'The air filter is clogged. Tap Home to swap it!',
    });
  }
}

// ---------------------------------------------------------------- the end

function endMission(state) {
  if (state.ended) return;
  state.ended = true;
  learn(state, 'magneticField');
  emit(state, 'end', { summary: summarize(state) });
}

export function summarize(state) {
  const cfg = state.cfg;
  const tl = state.timeline;
  const moon = peakDay(tl, 'moonOrbit');
  // Each place is compared at its own peak within the storm, with the date. The peaks can fall on
  // different days (May 2024: Moon 14 May, Mars 20 May), so "same day" would hide the Mars peak.
  const SITE_LABELS = { deepSpace: 'Deep space', marsSurface: 'On Mars', iss: 'Space station' };
  const comparisons = ['deepSpace', 'marsSurface', 'iss']
    .map((site) => ({ site, peak: peakDay(tl, site) }))
    .filter((x) => x.peak)
    .map(({ site, peak }) => ({ site, label: SITE_LABELS[site], times: peak.times, iso: peak.iso }));
  const mars = peakDay(tl, 'marsSurface');
  if (mars) learn(state, 'atmosphere');
  const blockedPct = state.stats.totalDose + state.stats.blockedDose > 0
    ? Math.round((state.stats.blockedDose / (state.stats.totalDose + state.stats.blockedDose)) * 100)
    : 100;
  const doseOk = state.dose < cfg.dose.limit;
  const roomsOk = ROOM_IDS.every((id) => state.rooms[id].status !== 'lost');
  const target = cfg.science.targetForStar;
  // Star 1 for finishing, star 2 for a safe crew that still did real science, star 3 for hitting
  // the science goal with every room intact. Hiding in the shelter all month is safe but earns one star.
  const stars = 1 + (doseOk && state.science >= target / 2 ? 1 : 0) + (doseOk && state.science >= target && roomsOk ? 1 : 0);
  let tip;
  if (!doseOk) tip = 'Next time, raise the shield or use the shelter as soon as a big flare warning comes.';
  else if (state.science < target / 2) tip = 'Next time, send the crew back to work as soon as the radiation drops.';
  else if (state.stats.setbacks > 0) tip = 'Next time, keep an eye on the battery and the air before they run out.';
  else if (!roomsOk) tip = 'Next time, fix leaks quickly so no room gets sealed.';
  else if (state.science < target) tip = 'Next time, keep the lab running on calm days to reach the science goal.';
  else tip = 'You managed power, air and radiation like a real mission team!';
  const upgrades = Object.values(state.upgrades).filter(Boolean).length;
  const calls = state.callEarth.calls;
  const st = state.stats;
  // Badges reward ways of playing, not talent (Brain Points idea from the team's guide).
  const earned = {
    fixer: st.repairs >= 3,
    allRooms: st.roomsLost === 0,
    steady: st.setbacks === 0,
    shield: blockedPct >= 60,
    team: calls >= 1,
    builder: upgrades >= 1,
    science: state.science >= target,
    hardHero: cfg.difficulty === 'hard' && stars >= 2,
    solo: calls === 0 && stars === 3,
  };
  const badges = Object.keys(BADGES).filter((k) => earned[k]);
  // Praise the effort or the strategy the kid actually used.
  let praise;
  if (st.setbacks > 0 && stars >= 2) praise = 'Things went wrong and you kept going. That is what real crews do.';
  else if (st.repairs >= 3) praise = `You fixed ${st.repairs} problems. Quick repairs keep a base alive.`;
  else if (calls >= 2) praise = 'You asked Mission Control for advice. Smart crews ask for help.';
  else if (blockedPct >= 60 && state.science >= target / 2) praise = 'You raised the shield at the right times. Good planning!';
  else if (state.science >= target) praise = 'You kept the lab busy on calm days. Smart timing!';
  else praise = 'You stayed with your crew for all 30 days. Well done!';
  // One lesson per kind is enough on the end screen.
  const lessons = [];
  for (const l of state.lessons) if (!lessons.some((x) => x.kind === l.kind)) lessons.push(l);
  return {
    badges,
    praise,
    lessons,
    difficulty: cfg.difficulty || 'normal',
    calls,
    stormTitle: tl.title,
    displayLabel: tl.displayLabel,
    stars,
    science: Math.round(state.science),
    scienceTarget: cfg.science.targetForStar,
    dose: Math.round(state.dose),
    doseLimit: cfg.dose.limit,
    blockedPct,
    leaksFixed: state.stats.leaksFixed,
    roomsLost: state.stats.roomsLost,
    setbacks: state.stats.setbacks,
    words: state.words.map((k) => ({ key: k, ...GLOSSARY[k] })),
    moonPeak: moon ? { iso: moon.iso, times: moon.times } : null,
    comparisons,
    tip,
    shieldLabel: SHIELD_LABELS[state.shield],
    blockWords: BLOCK_WORDS,
  };
}
