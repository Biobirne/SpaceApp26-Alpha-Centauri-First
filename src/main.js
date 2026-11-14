// Controller: loads data, runs the game clock, sends player actions to the rules and
// routes the rules' outbox to the HUD, the overlays and the Phaser scene.

import { CONFIG, ROOM_IDS, SHIELD_LABELS } from './rules/config.js';
import { UPGRADES, ROOMS } from './rules/content.js';
import {
  createMission, tick, setShield, setShelter, buyUpgrade, repairFor, completeRepair, chooseOption,
  callEarthReady, callEarth, applyAdvice, radiationNow,
} from './rules/mission.js';
import { createHud } from './ui/hud.js';
import { showCard, showRepair, showRebuild, showCall, showShop, showData, showPause, toast, floater, esc } from './ui/overlays.js';
import { renderStart, renderEnd, renderError } from './ui/screens.js';
import { icon } from './ui/icons.js';
import { loadProgress, saveResult, nextLevel, isUnlocked, LEVEL_ORDER, rankFor, markHintSeen, setHints } from './progress.js';
import { createGuide } from './ui/guide.js';
import { createMoonScene } from './scene/MoonScene.js';

const params = new URLSearchParams(location.search);
const UNLOCK_ALL = params.get('all') === '1';
const app = document.getElementById('app');
const BLOCK_SHORT = ['blocks nothing', 'blocks half', 'blocks most', 'blocks almost all'];

const data = { index: null, docs: {}, art: { rooms: {}, background: null } };
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
  if (direct && data.docs[direct] && isUnlocked(direct, loadProgress(), UNLOCK_ALL)) startMission(direct);
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
    backgroundColor: '#070b18',
    banner: false,
    audio: { noAudio: true },
    scale: { mode: Phaser.Scale.NONE, width: innerWidth * dpr, height: innerHeight * dpr, zoom: 1 / dpr },
    render: { antialias: true },
  });
  game.scene.add('moon', MoonScene, true, { art: data.art, dpr });
  game.events.once('moon-ready', (s) => { scene = s; scene.view = idleView(); syncSlot(); });
  game.events.on('room-tap', (id) => run && actions.repair(id, true));
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
    scene.setSlot({ x: r.left, y: r.top, w: r.width, h: r.height }, dpr);
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
  });
  if (scene) { scene.view = idleView(); syncSlot(); }
}

function showEnd(summary) {
  const id = run.id;
  const doc = run.doc;
  const rankBefore = rankFor(loadProgress());
  const progress = saveResult(id, summary.stars);
  const rankAfter = rankFor(progress);
  const i = LEVEL_ORDER.indexOf(id);
  const nextId = LEVEL_ORDER.slice(i + 1).find((x) => data.docs[x] && isUnlocked(x, progress, UNLOCK_ALL));
  const finalView = scene?.view;
  stopRun();
  clearApp();
  renderEnd(app, {
    summary, doc, rankBefore, rankAfter, nextId, nextTitle: nextId ? data.docs[nextId].title : '',
    onNext: () => startMission(nextId), onAgain: () => startMission(id), onMenu: showStart,
  });
  if (scene && finalView) { scene.view = finalView; syncSlot(); }
}

// ------------------------------------------------------------------ mission run

function startMission(id) {
  stopRun();
  clearApp();
  const doc = data.docs[id];
  const seed = Number(params.get('seed')) || (Date.now() % 1e9);
  const hud = createHud(app, actions);
  const progress = loadProgress();
  const guide = createGuide({
    root: hud.el, enabled: progress.hints, seen: progress.seen, markSeen: markHintSeen,
    say: (text, mood, opts) => hud.crew.say(text, mood, opts),
    unsay: (tag) => hud.crew.drop(tag),
  });
  const state = createMission(doc, { seed, config: CONFIG, script: guide.script() });
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
  history.replaceState(null, '', `?storm=${id}${UNLOCK_ALL ? '&all=1' : ''}`);
}

function stopRun() {
  if (!run) return;
  cancelAnimationFrame(run.raf);
  run.ro?.disconnect();
  run.guide.stop();
  run.hud.crew.clear();
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
  if (!blocked) tick(s, dtSec / s.cfg.secondsPerDay[r.speed]);
  drain();
  if (run !== r) return; // the mission ended inside drain()
  r.guide.update(s);
  r.hud.update(s, r.blockers.has('pause') ? 'pause' : r.guide.hold ? 'wait' : r.speed);
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
  };
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
        r.hud.crew.say(e.text, e.mood, { chatter: e.chatter, word });
        word = null;
        break;
      case 'word':
        if (word) r.hud.crew.say(`New word for your log: ${word.word}!`, 'happy', { word });
        word = { word: e.word, text: e.text };
        break;
      case 'card':
        if (s.pendingCard !== e.card) break; // already answered (only happens in debug skips)
        slowDown();
        block('card', true);
        showCard(e.card, (optionId) => {
          chooseOption(s, optionId);
          block('card', false);
        });
        break;
      case 'flare':
        scene?.flare(e.score);
        if (e.score >= 400) slowDown();
        break;
      case 'particles':
        scene?.burst();
        slowDown();
        break;
      case 'room':
        if (e.status === 'leak' || e.status === 'lost') slowDown();
        if (e.status === 'ok') r.hud.crew.dismissAlert();
        break;
      case 'setback':
        r.hud.hitMeter(e.kind);
        slowDown();
        break;
      case 'warn':
        r.hud.hitMeter(e.key);
        slowDown();
        break;
      case 'upgrade':
        toast(`${icon('check')}<span>Built: <b>${esc(UPGRADES[e.key].name)}</b></span>`, 'word');
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
      onResume: () => block('pause', false),
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
      floater(anchor, `${SHIELD_LABELS[level]}: ${BLOCK_SHORT[level]}${cost ? `, −${cost} power/day` : ''}`, 'var(--air)');
    }
  },

  shelter() {
    const s = run?.state;
    if (!s) return;
    const on = !s.sheltered;
    if (setShelter(s, on)) {
      floater(run.hud.refs.shelter, on ? 'Crew safe inside, science paused' : 'Back to work: science is running', on ? 'var(--dose)' : 'var(--science)');
      if (on) run.hud.crew.say('Everyone is in the shelter. Its thick walls block almost all radiation.', 'happy');
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
    run.guide.onAction('call');
    block('call', true);
    let applied = null;
    showCall(advice, s.cfg.callEarth.roundTripSeconds, (action) => { applied = action; }, () => {
      block('call', false);
      if (!applied) return;
      if (applied.repair) actions.repair(applied.repair);
      else {
        applyAdvice(s, applied);
        run.hud.crew.say('Done! Mission Control’s plan is set.', 'happy');
      }
    });
  },

  repair(roomId, fromScene = false) {
    const s = run?.state;
    if (!s || run.blockers.size) return;
    const job = repairFor(s, roomId);
    if (!job) {
      if (fromScene) toast(`${icon('check')}<span>${esc(ROOMS[roomId].name)}: all good.</span>`, '', 1600);
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

  shop() {
    const s = run?.state;
    if (!s || run.blockers.size) return;
    block('shop', true);
    const sheet = showShop(s, (key) => buyUpgrade(s, key));
    watchClose(sheet, 'shop');
  },

  data() {
    const s = run?.state;
    if (!s || run.blockers.size) return;
    block('data', true);
    run.guide.onAction('data');
    watchClose(showData(s, run.doc), 'data');
  },
};

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
  if (document.hidden && run && !run.blockers.size && !run.state.ended) actions.pause();
});
