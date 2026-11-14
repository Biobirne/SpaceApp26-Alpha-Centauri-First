// SI disclosure: written with the SI tool Claude Code and reviewed by the team. See SI_USAGE.md and si-manifest.json.
// The mission simulation. Plain JS: no Phaser, no DOM. The controller calls tick() with
// elapsed game days and drains state.outbox to update the screen.

import { CONFIG, ROOM_IDS, SHIELD_LABELS } from './config.js';
import { CREWMATE_NAME, ROOMS, GLOSSARY, CHATTER, BADGES } from './content.js';
import { buildTimeline, moonTimesNormal, flareScore, peakDay } from './storm.js';
import { isDaylight, sunElevation, earthLitFraction } from './sky.js';
import { createRng } from './rng.js';

const DAY_MS = 86400000;
const STEP = 0.02; // max simulation step in days (~29 minutes of mission time)
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const BLOCK_WORDS = ['nothing', 'about half', 'most', 'almost all'];

/**
 * @param script Optional scripted problems for guided first steps, e.g. [{ t: 0.7, kind: 'leak', roomId: 'hab' }].
 *   Random problems then start only after the script is done.
 */
export function createMission(stormDoc, { seed = 1, config = CONFIG, script = [] } = {}) {
  const cfg = config;
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
    upgrades: { battery: false, walls: false, fission: false },
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
  };
  updateSky(state, true);
  emit(state, 'crew', {
    mood: 'happy',
    text: `Hi Commander, I'm ${CREWMATE_NAME}! Real NASA data decides our space weather.`,
  });
  if (!state.daylight) {
    learn(state, 'lunarNight');
    emit(state, 'crew', { mood: 'calm', text: 'It’s lunar night right now, so the solar panels make no power. Save your battery!' });
  }
  return state;
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
export const radiationNow = (state) => moonTimesNormal(state.timeline, currentDayIndex(state));
export const isWorking = (state) => !state.sheltered && !state.forcedShelter && !state.powerEmergency;

/** Fraction of incoming radiation that the current setup blocks (0..1). */
export function blockFraction(state) {
  const c = state.cfg.dose;
  let through = 1 - c.shieldBlock[state.shield];
  if ((state.sheltered || state.forcedShelter) && state.rooms.shelter.status !== 'lost') through *= 1 - c.shelterBlock;
  if (state.upgrades.walls) through *= c.wallsFactor;
  return 1 - through;
}

export function powerUsePerDay(state) {
  const p = state.cfg.power;
  return (
    p.lifeSupportPerDay +
    (isWorking(state) ? p.sciencePerDay : 0) +
    p.shieldPerDay[state.shield] +
    (state.daylight ? 0 : p.nightHeatingPerDay)
  );
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
  if (key === 'battery') state.capacity += up.capacityBonus;
  emit(state, 'upgrade', { key });
  return true;
}

/** Problems the player can fix by tapping a room. */
export function repairFor(state, roomId) {
  const room = state.rooms[roomId];
  if (room.status === 'leak') return { roomId, kind: 'leak', taps: 4 };
  if (room.status === 'lost') return { roomId, kind: 'rebuild', taps: 6, cost: 30 };
  if (roomId === 'solar' && state.dust) return { roomId, kind: 'dust', taps: 5 };
  if (roomId === 'hab' && state.filter) return { roomId, kind: 'filter', taps: 3 };
  return null;
}

export function completeRepair(state, roomId, kind) {
  const room = state.rooms[roomId];
  if (kind === 'leak' && room.status === 'leak') {
    room.status = 'ok';
    state.stats.leaksFixed++;
    emit(state, 'room', { roomId, status: 'ok' });
    emit(state, 'crew', { mood: 'happy', text: `Leak patched! The ${ROOMS[roomId].name.toLowerCase()} is airtight again. Nice work!` });
  } else if (kind === 'rebuild' && room.status === 'lost') {
    if (!canAfford(state, 30)) return false;
    state.science -= 30;
    room.status = 'ok';
    emit(state, 'room', { roomId, status: 'ok' });
    emit(state, 'crew', { mood: 'happy', text: `The ${ROOMS[roomId].name.toLowerCase()} is back online!` });
  } else if (kind === 'dust' && state.dust) {
    state.dust = false;
    emit(state, 'room', { roomId: 'solar', status: 'ok' });
    emit(state, 'crew', { mood: 'happy', text: 'Panels are clean. Full solar power again!' });
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

  if (state.air < 35 && leak) {
    return advice(`Fix the leak in the ${ROOMS[leak].name.toLowerCase()} first.`,
      `Air is escaping, and you have ${Math.round(state.air)}% left.`, { repair: leak });
  }
  if (rad >= 20 && blockFraction(state) < 0.9) {
    return advice(state.rooms.shelter.status !== 'lost' ? 'Send the crew to the shelter and set the shield to Mid.' : 'Set the shield to Max.',
      `Radiation near the Moon is ${fmtTimes(rad)} normal right now.`,
      state.rooms.shelter.status !== 'lost' ? { shield: 2, sheltered: true } : { shield: 3 });
  }
  if (recentBigFlare && state.shield < 2 && rad < 20) {
    return advice('Raise your shield to Mid or Max.',
      `An ${recentBigFlare.cls} flare just went off. Its particles can arrive within hours.`, { shield: 3 });
  }
  if (leak) {
    return advice(`Tap the ${ROOMS[leak].name.toLowerCase()} to patch the leak.`,
      'Every hour it leaks, the crew loses air.', { repair: leak });
  }
  if (state.dust && state.daylight) {
    return advice('Clean the solar panels.', 'Moon dust is blocking most of the sunlight.', { repair: 'solar' });
  }
  if (state.filter) {
    return advice('Change the air filter in the living quarters.', 'A clogged filter means less fresh air.', { repair: 'hab' });
  }
  if (state.dose > state.cfg.dose.warnAbove && rad > 3) {
    return advice('Keep the crew in the shelter for now.',
      `Their radiation dose is already ${Math.round(state.dose)} of ${state.cfg.dose.limit}.`, { sheltered: true });
  }
  if (!state.daylight && state.power < 40 && state.shield > 0 && rad < 5) {
    return advice('Turn the shield down to save power.',
      `It’s night, there’s no sunlight, and your battery is at ${Math.round(state.power)}%. Radiation is calm.`, { shield: 0 });
  }
  if (night && !night.becomesDay && night.inDays < 3 && state.power < 70) {
    return advice('Charge up before dark: keep the shield low.',
      `The Sun sets in about ${Math.max(1, Math.round(night.inDays))} days. Then the night lasts about 2 weeks.`, { shield: Math.min(state.shield, 1) });
  }
  if (rad < 5 && (state.sheltered || state.shield >= 2)) {
    return advice('It’s safe to get back to work.', `Radiation is down to ${fmtTimes(rad)} normal. Science needs the crew in the lab.`,
      { sheltered: false, shield: 1 });
  }
  if (nextSep && nextSep.t - state.t < 3) {
    return advice('Stay alert: keep your shield ready.', 'Our space weather team sees an active Sun. More particles may come soon.', null);
  }
  return advice('Everything looks great. Keep the science going!',
    `Radiation is ${fmtTimes(rad)} normal, power ${Math.round(state.power)}%, air ${Math.round(state.air)}%.`, null);
}

function advice(text, reason, action) {
  return { text, reason, action };
}

export function applyAdvice(state, action) {
  if (!action) return;
  if (action.shield !== undefined) setShield(state, action.shield);
  if (action.sheltered !== undefined) setShelter(state, action.sheltered);
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
  processDataEvents(state);
  if (state.pendingCard) return;
  while (state.script.length && state.script[0].t <= state.t) {
    const e = state.script.shift();
    startProblem(state, e.kind, e.roomId);
  }
  if (state.t >= state.nextRandomAt) randomEvent(state);

  // power
  const inflow = powerInPerDay(state);
  const use = powerUsePerDay(state);
  state.power = clamp(state.power + (inflow - use) * h, 0, state.capacity);
  if (state.power <= 0 && !state.powerEmergency) {
    state.powerEmergency = true;
    state.shield = 0;
    state.stats.setbacks++;
    trouble(state);
    emit(state, 'setback', { kind: 'power' });
    emit(state, 'crew', { mood: 'alert', text: 'Battery empty! I switched off the shield and the lab. Only life support runs now.' });
  } else if (state.powerEmergency && state.power > cfg.power.recoverAbove) {
    state.powerEmergency = false;
    emit(state, 'crew', { mood: 'happy', text: 'Power is back. The lab is running again.' });
  }
  threshold(state, 'power', state.power / state.capacity * 100 < cfg.power.warnBelow,
    () => (state.daylight ? 'Battery is low! Turn the shield down a bit.' : 'Battery is low and it’s night. Turn off what you can.'));

  // air
  const lifeSupportOn = state.power > 0 || inflow >= cfg.power.lifeSupportPerDay;
  let air = lifeSupportOn ? cfg.air.regenPerDay : -cfg.air.noPowerPerDay;
  if (lifeSupportOn && state.rooms.greenhouse.status === 'ok') air += cfg.air.greenhouseBonusPerDay;
  for (const id of ROOM_IDS) if (state.rooms[id].status === 'leak') air -= cfg.air.leakPerDay;
  if (state.filter) air -= cfg.air.cloggedFilterPerDay;
  state.air = clamp(state.air + air * h, 0, cfg.air.max);
  if (state.air <= 0) {
    state.air = cfg.air.emergencyRefill;
    state.science = Math.max(0, state.science - 10);
    state.stats.setbacks++;
    trouble(state);
    emit(state, 'setback', { kind: 'air' });
    emit(state, 'crew', { mood: 'alert', text: 'Air ran out, so we opened the emergency oxygen tanks. Everyone is fine, but we lost some science.' });
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
      emit(state, 'crew', { mood: 'alert', text: `We sealed the ${ROOMS[id].name.toLowerCase()} to save the air. You can rebuild it later with science points.` });
    }
  }

  // radiation
  const rad = radiationNow(state);
  const unshielded = cfg.dose.perNormalDay * rad * h;
  const got = unshielded * (1 - blockFraction(state));
  state.dose += got;
  state.stats.totalDose += got;
  state.stats.blockedDose += unshielded - got;
  if (state.dose >= cfg.dose.limit && rad > 3 && !state.forcedShelter && state.rooms.shelter.status !== 'lost') {
    state.forcedShelter = true;
    if (!state.doseLimitHit) state.stats.setbacks++;
    state.doseLimitHit = true;
    trouble(state);
    emit(state, 'setback', { kind: 'dose' });
    emit(state, 'crew', { mood: 'alert', text: 'Our radiation dose hit the safety limit. Everyone into the shelter until the storm calms down!' });
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
      }
    }
  }
  state.earthLit = earthLitFraction(ms);
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
      mention(state, `Another ${f.cls} flare on the Sun! Keep an eye on the radiation.`);
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
  if (state.powerEmergency) {
    for (const o of card.options) if (o.effects.shield > 0 && !o.effects.sheltered) o.disabled = 'Battery empty';
  }
  state.pendingCard = card;
  state.lastCardT = state.t;
  emit(state, 'card', { card });
}

const shieldCost = (state, lvl) => `−${state.cfg.power.shieldPerDay[lvl]} ⚡/day`;

function flareCard(state, f) {
  const x = f.score >= flareScore('X1');
  const first = state.stats.flareCards === undefined;
  state.stats.flareCards = (state.stats.flareCards ?? 0) + 1;
  return {
    kind: 'flare',
    title: first ? `Solar flare: ${f.cls}!` : `New record flare: ${f.cls}!`,
    text: 'A giant flash on the Sun. Fast particles may follow within hours.',
    fact: x ? 'X flares are the biggest kind. X2 is twice as strong as X1.' : 'M flares are big. X flares are 10 times bigger.',
    options: [
      { id: 'max', label: 'Shield to Max', cost: shieldCost(state, 3), effects: { shield: 3 }, mood: 'happy',
        reply: 'Shield at Max! It stops almost all particles. It does eat power, though.' },
      { id: 'mid', label: 'Shield to Mid', cost: shieldCost(state, 2), effects: { shield: 2 }, mood: 'calm',
        reply: 'Shield at Mid. It stops most particles and saves some power.' },
      { id: 'wait', label: 'Wait and see', cost: 'Risky', effects: {}, mood: 'calm',
        reply: 'Okay, we keep working. Watch the radiation level!' },
    ],
  };
}

function particleCard(state) {
  const shelterOk = state.rooms.shelter.status !== 'lost';
  const options = [];
  if (shelterOk) {
    options.push({ id: 'shelter', label: 'Crew to shelter', cost: `${shieldCost(state, 1)}, no science`,
      effects: { sheltered: true, shield: 1 }, mood: 'happy',
      reply: 'Everyone is in the shelter. Its thick walls block almost everything, and it costs no extra power. Good plan!' });
  }
  options.push({ id: 'max', label: 'Shield to Max', cost: shieldCost(state, 3), effects: { shield: 3, sheltered: false }, mood: 'calm',
    reply: 'Shield at Max, and the crew keeps working. That costs a lot of power.' });
  options.push({ id: 'work', label: 'Keep working', cost: 'Risky', effects: { sheltered: false }, mood: 'calm',
    reply: 'We keep working. Our radiation dose will go up.' });
  return {
    kind: 'particles',
    title: 'Particle storm!',
    text: 'Fast particles from the Sun are hitting the Moon right now.',
    fact: 'The Moon has no air and no magnetic field to stop them.',
    options,
  };
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

function startProblem(state, kind, id) {
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
    state.filter = true;
    learn(state, 'scrubber');
    emit(state, 'room', { roomId: 'hab', status: 'filter' });
    emit(state, 'crew', { mood: 'alert', text: 'The air filter is clogged. Tap the living quarters to swap it!' });
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
  const sameDay = (site) => (moon ? tl.days[moon.index].radiation[site]?.times ?? null : null);
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
  return {
    badges,
    praise,
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
    sameDay: moon ? { mars: sameDay('marsSurface'), iss: sameDay('iss'), deepSpace: sameDay('deepSpace') } : null,
    marsPeak: mars ? { iso: mars.iso, times: mars.times } : null,
    tip,
    shieldLabel: SHIELD_LABELS[state.shield],
    blockWords: BLOCK_WORDS,
  };
}
