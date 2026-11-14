// SI disclosure: written with the SI tool Claude Code and reviewed by the team. See SI_USAGE.md and si-manifest.json.
// Controller: loads data, runs the game clock, sends player actions to the rules and
// routes the rules' outbox to the HUD, the overlays and the Phaser scene.

import { CONFIG, ROOM_IDS, SHIELD_LABELS, configFor } from './rules/config.js';
import { UPGRADES, ROOMS, FUN_FACTS } from './rules/content.js';
import {
  createMission, tick, setShield, setShelter, buyUpgrade, repairFor, completeRepair, chooseOption,
  callEarthReady, callEarth, applyAdvice, radiationNow, describeAdvice, explainSetup,
} from './rules/mission.js';
import { setGrowLights, noteLoopSeen, isCalm, powerBreakdown } from './rules/mission.js';
import { showHelp } from './ui/help.js';
import { showRoomInfo, showMeterInfo, showBriefing, setInfoActions } from './ui/info.js';
import { showData, scienceMeaning } from './ui/numbers.js';
import { createHud } from './ui/hud.js';
import { showCard, showRepair, showRebuild, showCall, showShop, showPause, toast, floater, esc } from './ui/overlays.js';
import { renderStart, renderEnd, renderError } from './ui/screens.js';
import { icon } from './ui/icons.js';
import {
  loadProgress, saveResult, nextLevel, isUnlocked, LEVEL_ORDER, rankFor, markHintSeen, setHints, setPref, saveBadges,
} from './progress.js';
import { createSfx } from './audio/sfx.js';
import { voice } from './audio/voice.js';
import { createGuide } from './ui/guide.js';
import { createIntro } from './ui/intro.js';
import { createMoonScene } from './scene/MoonScene.js';

const params = new URLSearchParams(location.search);
const UNLOCK_ALL = params.get('all') === '1';
const app = document.getElementById('app');
const BLOCK_SHORT = ['blocks nothing', 'blocks more than half', 'blocks most', 'blocks almost all'];

const data = { index: null, docs: {}, art: { rooms: {}, background: null } };

// ------------------------------------------------------------------ sound and read-aloud
const sfx = createSfx({ enabled: loadProgress().sound });
let readAloud = loadProgress().readAloud && voice.available;
// The Listen button lights up while a line is read, also when "Read aloud" reads by itself.
voice.onState = (on) => {
  for (const b of document.querySelectorAll('.crew .speak')) b.setAttribute('aria-pressed', String(on));
};
const funIdx = { earth: 0, sun: 0, suit: 0 };

/** Easter eggs: tap Earth, the Sun or Sam for the next true fact. */
function funFact(id) {
  if (!run || run.blockers.size || run.state.pendingCard) return;
  const facts = FUN_FACTS[id];
  sfx.play('fun');
  run.hud.crew.say(facts[funIdx[id]++ % facts.length], 'happy', { tag: 'fun' });
}

// Browsers only allow audio after a tap, so the sound starts with the first one.
document.addEventListener('pointerdown', () => sfx.unlock(), { capture: true });
document.addEventListener('click', (e) => {
  const soundBtn = e.target.closest('[data-sound]');
  if (soundBtn) {
    const on = !sfx.on;
    sfx.set(on);
    setPref('sound', on);
    syncSoundButtons();
    if (on) sfx.play('tap');
    return;
  }
  if (e.target.closest('.crew .speak')) {
    // A second tap while it reads stops it.
    if (voice.busy) { voice.stop(); return; }
    const line = run?.hud.crew.current();
    if (line) voice.speak(line);
    return;
  }
  if (e.target.closest('button:not([disabled])')) sfx.play('tap');
});

function syncSoundButtons() {
  for (const b of document.querySelectorAll('[data-sound]')) {
    b.setAttribute('aria-pressed', String(sfx.on));
    b.innerHTML = icon(sfx.on ? 'sound' : 'mute');
    b.setAttribute('aria-label', sfx.on ? 'Sound is on. Tap to mute.' : 'Sound is off. Tap to turn it on.');
  }
}
// Playtest helper: ?debug=1 exposes the running mission and lets tests jump ahead in time.
if (params.get('debug') === '1') {
  window.__moonbase = {
    run: () => run,
    /** Jump ahead; cards are answered with `pick(card)` (default: the first option). */
    skip(days, pick = (c) => c.options[0].id) {
      const s = run.state;
      const end = Math.min(s.cfg.missionDays, s.t + days);
      while (run && s.t < end - 1e-6 && !s.ended) {
        if (s.pendingCard) chooseOption(s, pick(s.pendingCard));
        tick(s, Math.min(0.05, end - s.t));
      }
    },
  };
}
let scene = null;
let game = null;
let run = null; // the mission in progress

// ------------------------------------------------------------------ boot

boot().catch((err) => {
  console.error(err);
  app.innerHTML = '';
  renderError(app, location.protocol === 'file:'
    ? 'The game needs a small web server to load its data. Run "npx serve" or "python -m http.server" in the project folder.'
    : 'The game data did not load. Please reload the page.');
});

async function boot() {
  const getJson = async (url) => {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`${url}: ${r.status}`);
    return r.json();
  };
  data.index = await getJson('data/storms/index.json');
  const docs = await Promise.all(data.index.storms.map((s) => getJson(`data/storms/${s.file}`)));
  for (const d of docs) data.docs[d.id] = d;
  for (const s of data.index.storms) s.summary = data.docs[s.id]?.summary;
  data.art = await getJson('assets/art/manifest.json').catch(() => data.art);

  // Wait (briefly) for the font so canvas labels use it too.
  await Promise.race([document.fonts?.load('600 16px Lexend'), new Promise((r) => setTimeout(r, 1200))]).catch(() => {});
  startPhaser();

  const direct = params.get('storm');
  if (params.has('intro')) startTraining(params.get('intro')); // ?intro=1, or ?intro=dust to jump to one lesson
  else if (direct && data.docs[direct] && isUnlocked(direct, loadProgress(), UNLOCK_ALL)) startMission(direct);
  else if (!loadProgress().seen.intro) startTraining(); // first visit: build the base and learn each event once
  else showStart();
}

function startPhaser() {
  if (typeof Phaser === 'undefined') {
    document.body.classList.add('no-phaser'); // CDN blocked: the HUD still works on a plain background
    return;
  }
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const MoonScene = createMoonScene();
  game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'scene',
    backgroundColor: '#03070d',
    banner: false,
    audio: { noAudio: true },
    scale: { mode: Phaser.Scale.NONE, width: innerWidth * dpr, height: innerHeight * dpr, zoom: 1 / dpr },
    render: { antialias: true },
  });
  game.scene.add('moon', MoonScene, true, { art: data.art, dpr });
  game.events.once('moon-ready', (s) => { scene = s; scene.view = idleView(); syncSlot(); });
  game.events.on('room-tap', (id) => {
    if (!run) return;
    if (run.guide.onRoomTap?.(id)) return; // the intro uses the tap to place a building
    actions.repair(id, true);
  });
  game.events.on('sky-tap', (id) => funFact(id));
  addEventListener('resize', onResize);
}

function onResize() {
  if (!game) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  game.scale.resize(innerWidth * dpr, innerHeight * dpr);
  game.scale.setZoom(1 / dpr);
  syncSlot();
}

/** Tell the scene where the empty stage area is, so the base never hides under the HUD. */
function syncSlot() {
  if (!scene) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const stage = run?.hud.stage;
  if (stage) {
    const r = stage.getBoundingClientRect();
    // Keep the base clear of Sam's bubble and the repair buttons: layout.css reserves their space
    // per screen shape (--reserve-top / --reserve-bottom). On a very short stage the reserves shrink.
    const cs = getComputedStyle(stage);
    let top = parseFloat(cs.getPropertyValue('--reserve-top')) || 0;
    let bottom = parseFloat(cs.getPropertyValue('--reserve-bottom')) || 0;
    // The intro has its own coach card instead of Sam's bubble, and says how much room that needs.
    const pad = run.guide.stagePad?.();
    if (pad) { top = pad.top; bottom = pad.bottom; }
    const fit = Math.min(1, (r.height * (pad ? 0.72 : 0.5)) / Math.max(1, top + bottom));
    top *= fit;
    bottom *= fit;
    const full = { x: r.left, y: r.top, w: r.width, h: r.height };
    scene.setSlot(full, dpr, { x: r.left, y: r.top + top, w: r.width, h: r.height - top - bottom }, top > 0);
    document.documentElement.style.setProperty('--toast-bottom', `${Math.round(innerHeight - r.bottom + 60)}px`);
  } else {
    const h = innerHeight;
    scene.setSlot({ x: 0, y: h * 0.38, w: innerWidth, h: h * 0.62 }, dpr);
  }
}

function idleView() {
  return { daylight: true, earthLit: 0.7, rooms: Object.fromEntries(ROOM_IDS.map((id) => [id, 'ok'])), shield: 0, radiation: 1, blockShield: 0, repairs: {} };
}

// ------------------------------------------------------------------ screens

function clearApp() {
  app.innerHTML = '';
  document.querySelectorAll('.modal, .toasts, .floater').forEach((n) => n.remove());
}

function showStart() {
  stopRun();
  clearApp();
  const progress = loadProgress();
  renderStart(app, {
    index: data.index, progress, unlockAll: UNLOCK_ALL, next: nextLevel(progress, UNLOCK_ALL),
    onStart: (id) => startMission(id),
    onTraining: () => startTraining(),
    onHelp: () => showHelp(configFor(loadProgress().difficulty)),
    onDifficulty: (level) => setPref('difficulty', level),
  });
  syncSoundButtons();
  if (scene) { scene.view = idleView(); syncSlot(); }
}

function showEnd(summary) {
  const id = run.id;
  const doc = run.doc;
  const rankBefore = rankFor(loadProgress());
  const progress = saveResult(id, summary.stars);
  const newBadges = saveBadges(summary.badges);
  const rankAfter = rankFor(progress);
  const i = LEVEL_ORDER.indexOf(id);
  const nextId = LEVEL_ORDER.slice(i + 1).find((x) => data.docs[x] && isUnlocked(x, progress, UNLOCK_ALL));
  const finalView = scene?.view;
  stopRun();
  clearApp();
  renderEnd(app, {
    summary, doc, rankBefore, rankAfter, nextId, nextTitle: nextId ? data.docs[nextId].title : '', newBadges, sound: sfx.on,
    onNext: () => startMission(nextId), onAgain: () => startMission(id), onMenu: showStart,
  });
  if (scene && finalView) { scene.view = finalView; syncSlot(); }
  syncSoundButtons();
  sfx.play('star');
}

// ------------------------------------------------------------------ mission run

/** The intro: build the base piece by piece, then meet each event once. The clock waits the whole time. */
function startTraining(startAt) {
  // Any storm works as the backdrop: the clock never runs, and the only alarm is a labelled drill.
  const id = LEVEL_ORDER.find((x) => data.docs[x]) ?? Object.keys(data.docs)[0];
  startMission(id, { training: startAt || '1' });
}

function endTraining() {
  // What the intro taught does not need the in-mission hints again.
  for (const key of ['intro', 'bars', 'leak', 'shield', 'shelter', 'shelterOut']) markHintSeen(key);
  history.replaceState(null, '', location.pathname);
  showStart();
}

function startMission(id, { training = null } = {}) {
  stopRun();
  clearApp();
  const doc = data.docs[id];
  const seed = Number(params.get('seed')) || (Date.now() % 1e9);
  const progress = loadProgress();
  const hud = createHud(app, actions, { sound: sfx.on, canSpeak: voice.available });
  hud.crew.onLine = (text) => { if (readAloud) voice.speak(text); };
  hud.crew.onAvatar = () => funFact('suit');
  const guide = training
    ? createIntro({
      hud, startAt: training,
      speak: (text) => { if (readAloud) voice.speak(text); },
      relayout: () => syncSlot(),
      syncSound: () => syncSoundButtons(),
      onDone: endTraining,
    })
    : createGuide({
      root: hud.el, enabled: progress.hints, seen: progress.seen, markSeen: markHintSeen,
      say: (text, mood, opts) => hud.crew.say(text, mood, opts),
      unsay: (tag) => hud.crew.drop(tag),
    });
  const state = createMission(doc, { seed, config: configFor(training ? 'easy' : progress.difficulty), script: guide.script() });
  run = {
    id, doc, state, hud, guide,
    speed: 'normal',
    lastSpeed: 'normal',
    blockers: new Set(),
    raf: 0,
    lastMs: performance.now(),
  };
  const ro = new ResizeObserver(syncSlot);
  ro.observe(hud.stage);
  run.ro = ro;
  requestAnimationFrame(syncSlot);
  run.raf = requestAnimationFrame(loop);
  if (training) {
    guide.begin(state);
    return;
  }
  // The story first: where we are, and which real storm is coming. The clock waits.
  block('brief', true);
  const date = new Date(state.timeline.startMs).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  showBriefing(doc, state.cfg, date, () => block('brief', false));
  history.replaceState(null, '', `?storm=${id}${UNLOCK_ALL ? '&all=1' : ''}`);
}

function stopRun() {
  if (!run) return;
  cancelAnimationFrame(run.raf);
  run.ro?.disconnect();
  run.guide.stop();
  run.hud.crew.clear();
  voice.stop();
  run = null;
}

function loop(now) {
  if (!run) return;
  const r = run;
  const dtSec = Math.min(0.25, (now - r.lastMs) / 1000);
  r.lastMs = now;
  const s = r.state;
  // The guide can hold the clock (not the controls) while a kid learns something new.
  const blocked = r.blockers.size > 0 || r.speed === 'pause' || r.guide.hold || s.pendingCard || s.ended;
  // Calm days fly by, but only once the guided first steps are over.
  r.calm = !blocked && !r.guide.busy && isCalm(s);
  const secPerDay = (r.calm ? s.cfg.calmSecondsPerDay : s.cfg.secondsPerDay)[r.speed];
  if (!blocked) tick(s, dtSec / secPerDay);
  drain();
  if (run !== r) return; // the mission ended inside drain()
  r.guide.update(s);
  // Any open sheet (repair, card, info) stops the clock, and the HUD says so.
  r.hud.update(s, r.blockers.has('pause') ? 'pause' : (r.guide.hold || r.blockers.size) ? 'wait' : r.calm ? `calm-${r.speed}` : r.speed);
  if (scene) scene.view = viewOf(s);
  r.raf = requestAnimationFrame(loop);
}

function viewOf(s) {
  const repairs = {};
  for (const id of ROOM_IDS) {
    const j = repairFor(s, id);
    if (j) repairs[id] = j.kind;
  }
  return {
    daylight: s.daylight,
    earthLit: s.earthLit,
    rooms: Object.fromEntries(ROOM_IDS.map((id) => [id, s.rooms[id].status])),
    dust: s.dust,
    filter: s.filter,
    shield: s.shield,
    sheltered: s.sheltered || s.forcedShelter,
    powerEmergency: s.powerEmergency,
    radiation: radiationNow(s),
    blockShield: s.cfg.dose.shieldBlock[s.shield],
    repairs,
    ...solarView(s),
    ...run?.guide.view?.(s),
  };
}

/** What the solar panels make right now, shown above them in the scene. */
function solarView(s) {
  if (s.rooms.solar.status === 'lost') return { solarText: '', solarLow: true };
  const perDay = Math.round(powerBreakdown(s)[0].perDay * 10) / 10;
  if (!s.daylight) return { solarText: 'Night: 0 power', solarLow: true };
  return { solarText: `${s.dust ? 'Dusty: ' : ''}+${perDay} power a day`, solarLow: Boolean(s.dust) };
}

/** Something happened that needs attention: drop out of fast-forward. */
function slowDown() {
  if (run?.speed !== 'fast') return;
  run.speed = 'normal';
  toast(`${icon('play')}<span>Slowed down so you can react</span>`, 'speed', 2000);
}

function block(key, on) {
  if (!run) return;
  if (on) run.blockers.add(key);
  else run.blockers.delete(key);
  run.hud.crew.freeze(run.blockers.size > 0);
}

function drain() {
  const r = run;
  const s = r.state;
  const events = s.outbox.splice(0);
  let word = null; // a new science word rides along with the crew line that uses it
  for (const e of events) {
    r.guide.onEvent(e);
    switch (e.type) {
      case 'crew':
        if (r.guide.quiet) break; // the intro explains everything on its own cards
        r.hud.crew.say(e.text, e.mood, { chatter: e.chatter, keep: e.keep, word });
        word = null;
        break;
      case 'word':
        if (r.guide.quiet) break;
        if (word) r.hud.crew.say(`New word for your log: ${word.word}!`, 'happy', { word });
        word = { word: e.word, text: e.text };
        break;
      case 'card':
        if (s.pendingCard !== e.card) break; // already answered (only happens in debug skips)
        slowDown();
        block('card', true);
        sfx.play('card');
        showCard(e.card, (optionId) => {
          chooseOption(s, optionId);
          block('card', false);
        });
        break;
      case 'flare':
        scene?.flare(e.score);
        if (e.score >= 400) sfx.play('flare');
        if (e.score >= 400) slowDown();
        break;
      case 'particles':
        scene?.burst();
        slowDown();
        break;
      case 'room':
        if (e.status === 'leak' || e.status === 'lost') slowDown();
        if (e.status === 'ok') { r.hud.crew.dismissAlert(); sfx.play('fixed'); }
        else if (e.status === 'lost') sfx.play('setback');
        else sfx.play('alert');
        break;
      case 'setback':
        r.hud.hitMeter(e.kind);
        sfx.play('setback');
        slowDown();
        break;
      case 'warn':
        r.hud.hitMeter(e.key);
        sfx.play('warn');
        slowDown();
        break;
      case 'upgrade':
        toast(`${icon('check')}<span>Built: <b>${esc(UPGRADES[e.key].name)}</b></span>`, 'word');
        sfx.play('upgrade');
        break;
      case 'end':
        setTimeout(() => { if (run === r) showEnd(e.summary); }, 900);
        block('end', true);
        break;
      default:
        break;
    }
  }
  if (word) r.hud.crew.say(`New word for your log: ${word.word}!`, 'happy', { word });
}

// ------------------------------------------------------------------ player actions (from the HUD)

const actions = {
  speed(next) {
    if (!run) return;
    if (next === 'pause') return actions.pause();
    run.speed = next;
    if (next === 'fast') run.guide.onAction('fast');
  },

  pause() {
    if (!run || run.blockers.size) return;
    block('pause', true);
    showPause({
      hints: loadProgress().hints,
      onHints: (on) => { setHints(on); run?.guide.setEnabled(on); },
      readAloud: voice.available ? readAloud : null,
      onReadAloud: (on) => {
        readAloud = on;
        setPref('readAloud', on);
        if (on) voice.speak('Okay! I will read every line aloud.');
        else voice.stop();
      },
      onResume: () => block('pause', false),
      // Help keeps the clock stopped until the sheet is closed.
      onHelp: () => { block('pause', true); showHelp(run.state.cfg, { onClose: () => block('pause', false) }); },
      onRestart: () => startMission(run.id),
      onMenu: showStart,
    });
  },

  shield(level, anchor) {
    const s = run?.state;
    if (!s || s.shield === level) return;
    if (setShield(s, level)) {
      if (level > 0) run.guide.onAction('shieldUp');
      const cost = s.cfg.power.shieldPerDay[level];
      floater(anchor, `${SHIELD_LABELS[level]}: ${BLOCK_SHORT[level]}${cost ? `, −${cost} ⚡/day` : ''}`, 'var(--air)');
    }
  },

  shelter() {
    const s = run?.state;
    if (!s) return;
    const on = !(s.sheltered || s.forcedShelter);
    if (setShelter(s, on)) {
      floater(run.hud.refs.shelter, on ? 'Crew safe inside, science paused' : 'Back to work: science is running', on ? 'var(--dose)' : 'var(--science)');
      const teaching = run.guide.busy; // the guide explains the shelter itself
      run.guide.onAction(on ? 'shelterIn' : 'shelterOut');
      if (on && !teaching) run.hud.crew.say('Everyone is in the shelter. Its thick walls block most of the radiation.', 'happy');
    }
  },

  call() {
    const s = run?.state;
    if (!s || run.blockers.size) return;
    if (!callEarthReady(s)) {
      const left = Math.ceil(s.callEarth.readyAt - s.t);
      toast(`${icon('dish')}<span>Mission Control is busy. Try again in ${left} ${left === 1 ? 'day' : 'days'}.</span>`);
      return;
    }
    const advice = callEarth(s);
    sfx.play('radio');
    run.guide.onAction('call');
    block('call', true);
    let applied = null;
    const info = { ...s.cfg.callEarth, actionLabel: describeAdvice(s, advice.action) };
    showCall(advice, info, (action) => { applied = action; }, () => {
      block('call', false);
      if (!applied) return;
      if (applied.repair) actions.repair(applied.repair);
      else {
        applyAdvice(s, applied);
        // Say exactly what changed and what it costs, so the advice is understood, not just followed.
        run.hud.crew.say(`Done! ${explainSetup(s)}`, 'happy');
      }
    });
  },

  repair(roomId, fromScene = false) {
    const s = run?.state;
    if (!s || run.blockers.size) return;
    const job = repairFor(s, roomId);
    if (!job) {
      // Nothing broken: show what this building is (curious players can learn more).
      if (fromScene) {
        block('info', true);
        watchClose(showRoomInfo(roomId, s), 'info');
      }
      return;
    }
    const doRepair = () => {
      block('repair', true);
      showRepair(job, () => {
        block('repair', false);
        completeRepair(s, roomId, job.kind);
        run?.guide.onAction('repairDone');
      }, () => block('repair', false));
    };
    if (job.kind === 'rebuild') {
      block('rebuild', true);
      watchClose(showRebuild(job, s.science, doRepair), 'rebuild');
    } else doRepair();
  },

  info(kind) {
    const s = run?.state;
    if (!s || run.blockers.size) return;
    block('info', true);
    watchClose(showMeterInfo(kind, s), 'info');
  },

  shop() {
    const s = run?.state;
    if (!s || run.blockers.size) return;
    block('shop', true);
    const sheet = showShop(s, (key) => buyUpgrade(s, key));
    sheet.el.querySelector('h2 + p')?.insertAdjacentHTML('afterend', scienceMeaning(s));
    watchClose(sheet, 'shop');
  },

  /** Greenhouse lamps on or off (life support loop). */
  growLights(on, { quiet = false } = {}) {
    if (!run) return;
    sfx.play('tap');
    if (!setGrowLights(run.state, on)) return;
    if (quiet) return; // the switch in the greenhouse sheet shows the new state and its cost itself
    const c = run.state.cfg;
    toast(`${icon(on ? 'plant' : 'moon')}<span>${on
      ? `Plant lamps on: +${c.air.greenhouseBonusPerDay}% air, −${c.power.growLightsPerDay} ⚡ per day`
      : `Plant lamps off: saves ${c.power.growLightsPerDay} ⚡ per day, no help from plants`}</span>`, 'lamps', 2600);
  },

  data() {
    const s = run?.state;
    if (!s || run.blockers.size) return;
    block('data', true);
    run.guide.onAction('data');
    watchClose(showData(s, run.doc), 'data');
  },
};

// The learn-more sheets can switch the plant lamps and teach the loop words.
setInfoActions({
  growLights: (on) => actions.growLights(on, { quiet: true }),
  // A fix button in a learn-more sheet: that sheet is closing, so it no longer blocks the repair.
  repair: (roomId) => { block('info', false); actions.repair(roomId); },
  loopSeen: () => run && noteLoopSeen(run.state),
});

/** Unblock when a sheet's modal disappears, however it was closed. */
function watchClose(sheet, key) {
  const modal = sheet.el.parentElement;
  const mo = new MutationObserver(() => {
    if (!modal.isConnected || modal.classList.contains('out')) {
      mo.disconnect();
      block(key, false);
    }
  });
  mo.observe(document.body, { childList: true });
  mo.observe(modal, { attributes: true, attributeFilter: ['class'] });
}

// ------------------------------------------------------------------ keyboard (laptops) and tab switching

addEventListener('keydown', (e) => {
  if (!run || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
  if (document.querySelector('.modal')) return;
  const k = e.key.toLowerCase();
  if (k === ' ' || k === 'p') { e.preventDefault(); actions.pause(); }
  else if (['1', '2', '3', '4'].includes(k)) actions.shield(Number(k) - 1, run.hud.refs.seg[Number(k) - 1]);
  else if (k === 's') actions.shelter();
  else if (k === 'c') actions.call();
  else if (k === 'f') actions.speed(run.speed === 'fast' ? 'normal' : 'fast');
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) voice.stop();
  if (document.hidden && run && !run.blockers.size && !run.state.ended) actions.pause();
});
