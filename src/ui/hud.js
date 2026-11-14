// SI disclosure: written with the SI tool Claude Code and reviewed by the team. See SI_USAGE.md and si-manifest.json.
// The in-game console (HTML on top of the Phaser canvas). It renders mission state and sends
// player actions to the controller through `actions`. No game rules in here.

import { icon, crewAvatar, soundButton } from './icons.js';
import { SHIELD_LABELS, ROOM_IDS } from '../rules/config.js';
import { CREWMATE_NAME, ROOMS } from '../rules/content.js';
import {
  dateMsAt, currentDayIndex, radiationNow, fmtTimes, powerInPerDay, powerUsePerDay, sciencePerDay,
  repairFor, callEarthReady, blockFraction,
} from '../rules/mission.js';
import { airBreakdown } from '../rules/mission.js';
import { nextTerminatorCrossing } from '../rules/sky.js';

const DAY_MS = 86400000;
const fmtDate = (ms) => new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const BLOCK_SHORT = ['none', 'more than half', 'most', 'almost all'];

export function createHud(root, actions, { sound = true, canSpeak = false } = {}) {
  const el = document.createElement('div');
  el.className = 'game';
  el.innerHTML = `
    <header class="topbar">
      <div class="clock" aria-live="off"><span class="clock-day"></span><span class="clock-date"></span></div>
      ${soundButton(sound)}
      <div class="speedbox"><div class="speed" role="group" aria-label="Game speed">
        <button type="button" data-speed="pause" aria-label="Pause and menu">${icon('pause')}</button>
        <button type="button" data-speed="normal" aria-label="Normal speed">${icon('play')}</button>
        <button type="button" data-speed="fast" aria-label="Fast forward">${icon('fast')}</button>
      </div><span class="speed-note"></span></div>
    </header>
    <div class="status">
      <div class="skypill chip" data-day="1">${icon('sun')}<span class="chip-text"><small class="sp-label"></small><span class="sp-text"></span></span></div>
      <button type="button" class="radchip chip" data-level="calm" aria-label="Radiation now. Tap to see the real NASA data.">
        ${icon('radiation')}<span class="chip-text"><small>Radiation</small><span><b class="rc-val">1×</b> normal</span></span><span class="rc-data">${icon('chart')}<span>Data</span></span>
      </button>
    </div>
    <div class="stage">
      <div class="tasks" aria-label="Repairs"></div>
      <div class="crew" aria-live="polite">
        <button type="button" class="av-wrap" aria-label="Ask ${CREWMATE_NAME} about the spacesuit"></button>
        <button type="button" class="bubble"><span class="who">${CREWMATE_NAME}</span><span class="say"></span><span class="word" hidden>${icon('book')}<span>New word: <b></b><br><span class="w-text"></span></span></span><span class="more"></span></button>
        ${canSpeak ? `<button type="button" class="speak" aria-pressed="false" aria-label="Listen: ${CREWMATE_NAME} reads this line out loud">${icon('sound')}<span class="speak-word" aria-hidden="true">Listen</span></button>` : ''}
      </div>
    </div>
    <section class="meters" aria-label="Base status">
      ${meter('power', 'bolt', 'Power')}
      ${meter('air', 'air', 'Air')}
      ${meter('dose', 'radiation', 'Crew dose')}
      <button type="button" class="meter science" aria-label="Science points. Tap for upgrades.">
        ${icon('science')}<span class="m-value"></span><span class="m-label">Science</span>
        <span class="m-rate">Upgrades</span>
      </button>
    </section>
    <nav class="dock" aria-label="Controls">
      <div class="shieldctl">
        <button type="button" class="sc-label" data-info="shield" aria-label="Shield: how it works, what it costs, and the real research. Tap to learn more.">${icon('shield')}Shield<span class="sc-i" aria-hidden="true">i</span></button>
        <div class="seg" role="group" aria-label="Shield level">
          ${SHIELD_LABELS.map((l, i) => `<button type="button" data-shield="${i}"><b>${l}</b><span></span></button>`).join('')}
        </div>
      </div>
      <button type="button" class="btn shelterbtn" aria-pressed="false">${icon('shelter')}<span class="txt">Shelter<span class="sub"></span></span></button>
      <button type="button" class="btn earth callbtn">${icon('dish')}<span class="txt">Call Earth<span class="sub"></span></span><span class="ring"></span></button>
    </nav>`;
  root.appendChild(el);

  const $ = (s) => el.querySelector(s);
  const refs = {
    day: $('.clock-day'), date: $('.clock-date'), sky: $('.skypill'), skyText: $('.sp-text'), skyLabel: $('.sp-label'),
    rad: $('.radchip'), radVal: $('.rc-val'), tasks: $('.tasks'), stage: $('.stage'),
    meters: { power: $('.meter.power'), air: $('.meter.air'), dose: $('.meter.dose') },
    science: $('.meter.science'), shelter: $('.shelterbtn'), call: $('.callbtn'),
    seg: [...el.querySelectorAll('.seg button')],
    speed: [...el.querySelectorAll('.speed button')],
    speedNote: el.querySelector('.speed-note'),
  };

  // ---- input
  for (const b of refs.speed) b.addEventListener('click', () => actions.speed(b.dataset.speed));
  for (const b of refs.seg) b.addEventListener('click', (e) => actions.shield(Number(b.dataset.shield), e.currentTarget));
  refs.shelter.addEventListener('click', () => actions.shelter());
  refs.call.addEventListener('click', () => actions.call());
  refs.science.addEventListener('click', () => actions.shop());
  for (const m of el.querySelectorAll('[data-info]')) m.addEventListener('click', () => actions.info(m.dataset.info));
  refs.rad.addEventListener('click', () => actions.data());
  refs.tasks.addEventListener('click', (e) => {
    const b = e.target.closest('[data-room]');
    if (b) actions.repair(b.dataset.room);
  });

  const crew = createCrew(el.querySelector('.crew'));
  let gameT = 0;
  crew.now = () => gameT;
  const cache = {};
  const set = (key, node, value, fn) => {
    if (cache[key] === value) return;
    cache[key] = value;
    fn(node, value);
  };

  function update(state, speed) {
    const cfg = state.cfg;
    gameT = state.t;
    const dayNo = currentDayIndex(state) + 1;
    set('day', refs.day, dayNo, (n, v) => { n.innerHTML = `Day ${v} <small>of ${cfg.missionDays}</small>`; });
    set('date', refs.date, fmtDate(dateMsAt(state)), (n, v) => { n.textContent = v; });

    // day/night with a countdown to the next change, recomputed a few times per day
    const qt = Math.floor(state.t * 4);
    if (cache.skyQ !== qt || cache.dl !== state.daylight) {
      cache.skyQ = qt;
      cache.dl = state.daylight;
      const nx = nextTerminatorCrossing(dateMsAt(state), cfg.site.lonDeg);
      const inDays = nx ? Math.max(1, Math.round((nx.atMs - dateMsAt(state)) / DAY_MS)) : null;
      refs.sky.dataset.day = state.daylight ? '1' : '0';
      refs.sky.querySelector('.ic').outerHTML = icon(state.daylight ? 'sun' : 'moon');
      const d = `${inDays} ${inDays === 1 ? 'day' : 'days'}`;
      refs.skyLabel.textContent = state.daylight ? 'Daytime' : 'Lunar night';
      refs.skyText.textContent = !inDays ? (state.daylight ? 'Sun is up' : 'No sun') : state.daylight ? `Sunset in ${d}` : `Sunrise in ${d}`;
    }

    for (const b of refs.speed) b.setAttribute('aria-pressed', String(b.dataset.speed === speed.replace('calm-', '')));
    // Say openly how fast time runs (GAME_DESIGN.md: never pretend it is real time).
    set('speedNote', refs.speedNote, speed, (n, v) => {
      if (v === 'pause') n.textContent = 'Paused';
      else if (v === 'wait') n.textContent = 'Clock waits for you';
      else if (v.startsWith('calm-')) n.textContent = `Calm days: 1 day = ${cfg.calmSecondsPerDay[v.slice(5)]} s`;
      else n.textContent = `1 day = ${cfg.secondsPerDay[v]} s`;
    });

    // radiation chip
    const rad = radiationNow(state);
    set('rad', refs.radVal, fmtTimes(rad), (n, v) => { n.textContent = v; });
    refs.rad.dataset.level = rad >= 20 ? 'storm' : rad >= 3 ? 'high' : 'calm';

    // meters
    const pNet = powerInPerDay(state) - powerUsePerDay(state);
    const pct = (state.power / state.capacity) * 100;
    meterSet(refs.meters.power, cache, 'power', state.power / state.capacity, `${Math.round(pct)}<small>%</small>`,
      state.powerEmergency ? (pNet > 0 ? 'Recharging' : 'Needs sun') : rate((pNet / state.capacity) * 100, '%'), pct < cfg.power.warnBelow || state.powerEmergency, state.powerEmergency ? 'Empty' : 'Low');
    // Air: the number that matters is how fast it changes; the warning pill names the cause.
    const leaking = ROOM_IDS.some((id) => state.rooms[id].status === 'leak');
    const aNet = airBreakdown(state).reduce((a, r) => a + r.perDay, 0);
    meterSet(refs.meters.air, cache, 'air', state.air / cfg.air.max, `${Math.round(state.air)}<small>%</small>`,
      state.air >= cfg.air.max - 0.5 && aNet >= 0 ? 'Full' : rate(aNet, '%'),
      state.air < cfg.air.warnBelow || leaking || state.filter, leaking ? 'Leak!' : state.filter ? 'Clogged' : 'Low');
    const block = blockFraction(state);
    const doseRate = cfg.dose.perNormalDay * rad * (1 - block);
    meterSet(refs.meters.dose, cache, 'dose', state.dose / cfg.dose.limit, `${Math.round(state.dose)}<small>/${cfg.dose.limit}</small>`,
      state.forcedShelter ? 'At the limit' : doseRate >= 0.5 ? `+${Math.round(doseRate)}/day` : 'Calm now',
      state.dose > cfg.dose.warnAbove, 'High');

    // science / upgrades
    const sci = Math.floor(state.science);
    set('sci', refs.science.querySelector('.m-value'), sci, (n, v) => { n.textContent = v; });
    const canBuy = Object.entries(cfg.upgrades).some(([k, u]) => !state.upgrades[k] && state.science >= u.cost);
    refs.science.classList.toggle('can-buy', canBuy);
    const sRate = sciencePerDay(state);
    set('sciRate', refs.science.querySelector('.m-rate'), canBuy ? 'Upgrade!' : sRate > 0 ? `+${Math.round(sRate)}/day` : 'Paused',
      (n, v) => { n.textContent = v; });

    // shield control with costs shown before the tap
    refs.seg.forEach((b, i) => {
      b.setAttribute('aria-pressed', String(state.shield === i));
      b.disabled = state.powerEmergency && i > 0;
      const cost = cfg.power.shieldPerDay[i];
      set(`seg${i}`, b.querySelector('span'), cost, (n, v) => { n.innerHTML = v ? `${icon('bolt')}−${v}/day` : 'free'; });
      b.setAttribute('aria-label', `Shield ${SHIELD_LABELS[i]}: blocks ${BLOCK_SHORT[i]} of the radiation, costs ${cost} power per day`);
    });

    const inShelter = state.sheltered || state.forcedShelter;
    refs.shelter.setAttribute('aria-pressed', String(inShelter));
    refs.shelter.disabled = state.rooms.shelter.status === 'lost';
    set('shelterSub', refs.shelter.querySelector('.sub'), `${inShelter}|${state.forcedShelter}|${state.rooms.shelter.status}`, (n) => {
      n.textContent = state.rooms.shelter.status === 'lost' ? 'Sealed' : state.forcedShelter ? 'Must stay inside' : inShelter ? 'Tap: back to work' : 'Stops science';
    });

    // Call Earth: cooldown ring
    const ready = callEarthReady(state);
    const left = Math.max(0, state.callEarth.readyAt - state.t);
    refs.call.classList.toggle('ready', ready);
    refs.call.style.setProperty('--cool', ready ? 0 : (left / cfg.callEarth.cooldownDays).toFixed(3));
    set('callSub', refs.call.querySelector('.sub'), ready ? 'Ask for a tip' : `Ready in ${Math.ceil(left)} ${Math.ceil(left) === 1 ? 'day' : 'days'}`,
      (n, v) => { n.textContent = v; });

    // repair list
    const jobs = ROOM_IDS.map((id) => repairFor(state, id)).filter(Boolean);
    const sig = jobs.map((j) => `${j.roomId}:${j.kind}`).join(',');
    set('jobs', refs.tasks, sig, (n) => {
      n.innerHTML = jobs.map((j) => `<button type="button" class="task" data-room="${j.roomId}" data-kind="${j.kind}">
        ${icon(j.kind === 'rebuild' ? 'wrench' : j.kind === 'dust' ? 'sun' : j.kind === 'filter' ? 'filter' : j.kind === 'fort' ? 'shelter' : 'drop')}
        ${JOB_LABEL[j.kind](ROOMS[j.roomId])}</button>`).join('');
    });
  }

  function hitMeter(kind) {
    const m = refs.meters[kind];
    if (!m) return;
    m.classList.remove('hit');
    void m.offsetWidth;
    m.classList.add('hit');
  }

  return { el, stage: refs.stage, update, crew, hitMeter, meters: refs.meters, refs };
}

const JOB_LABEL = {
  leak: (r) => `Fix leak: ${r.short}`,
  dust: () => 'Clean panels',
  filter: () => 'Swap filter',
  fort: () => 'Build storm fort',
  rebuild: (r) => `Rebuild ${r.short}`,
};

function meter(kind, ic, label) {
  return `<button type="button" class="meter ${kind}" data-info="${kind}" aria-label="${label}. Tap to see where it comes from and goes to.">
    ${icon(ic)}<span class="m-value"></span><span class="m-label">${label}</span>
    <span class="m-bar"><span class="m-fill"></span></span><span class="m-rate"></span><span class="m-warn"></span>
    <span class="m-info" aria-hidden="true">i</span>
  </button>`;
}

function rate(perDay, unit) {
  if (Math.abs(perDay) < 0.5) return 'Steady';
  return `${perDay > 0 ? '+' : '−'}${Math.round(Math.abs(perDay))}${unit}/day`;
}

function meterSet(node, cache, key, frac, valueHtml, rateText, warn, warnText) {
  const f = Math.max(0, Math.min(1, frac));
  const fk = Math.round(f * 200);
  if (cache[`${key}f`] !== fk) {
    cache[`${key}f`] = fk;
    node.querySelector('.m-fill').style.transform = `scaleX(${f.toFixed(3)})`;
  }
  if (cache[`${key}v`] !== valueHtml) { cache[`${key}v`] = valueHtml; node.querySelector('.m-value').innerHTML = valueHtml; }
  if (cache[`${key}r`] !== rateText) {
    cache[`${key}r`] = rateText;
    const r = node.querySelector('.m-rate');
    r.textContent = rateText;
    r.className = `m-rate ${rateText.startsWith('+') ? (key === 'dose' ? 'down' : 'up') : rateText.startsWith('−') ? 'down' : ''}`;
  }
  node.classList.toggle('warn', Boolean(warn));
  if (warn) node.querySelector('.m-warn').textContent = warnText;
}

// ------------------------------------------------------------------ crewmate speech bubble

/**
 * Messages queue up. Each stays long enough to read (about 2.2 words per second for young readers),
 * a tap skips to the next one. Chatter is dropped when real news is waiting.
 */
function createCrew(node) {
  const avWrap = node.querySelector('.av-wrap');
  const bubble = node.querySelector('.bubble');
  const say = node.querySelector('.say');
  const more = node.querySelector('.more');
  const word = node.querySelector('.word');
  const queue = [];
  let timer = null;
  let showing = null;
  let frozen = false;

  function next() {
    clearTimeout(timer);
    // News older than half a game day is out of date: skip it (warnings are re-sent by the rules).
    while (queue.length && !queue[0].tag && queue[0].t != null && api.now() - queue[0].t > 0.5) queue.shift();
    showing = queue.shift() || null;
    if (!showing) { node.classList.remove('show'); return; }
    avWrap.innerHTML = crewAvatar(showing.mood);
    bubble.dataset.mood = showing.mood;
    say.textContent = showing.text;
    word.hidden = !showing.word;
    if (showing.word) {
      word.querySelector('b').textContent = showing.word.word;
      word.querySelector('.w-text').textContent = showing.word.text;
    }
    more.textContent = queue.length ? `${queue.length} more ›` : '';
    node.classList.add('show');
    schedule();
    showing.onShow?.();
    api.onLine?.(showing.text);
  }

  function schedule() {
    clearTimeout(timer);
    if (frozen || !showing) return;
    const words = showing.text.split(/\s+/).length + (showing.word ? showing.word.text.split(/\s+/).length + 3 : 0);
    const ms = Math.max(3200, Math.min(9000, 1200 + words * 420)) * (queue.length > 2 ? 0.7 : 1);
    timer = setTimeout(next, ms);
  }

  // At most a couple of lines wait (playtest: "6 more" was too much to read). The least important
  // goes first: small news, then alerts. Hints, fun facts the kid asked for, and lessons stay.
  const MAX_WAITING = 2;
  function trim() {
    while (queue.length > MAX_WAITING) {
      let i = queue.findIndex((q) => !q.tag && !q.keep && q.mood !== 'alert');
      if (i < 0) i = queue.findIndex((q) => !q.tag && !q.keep);
      if (i < 0) i = 0;
      queue.splice(i, 1);
    }
  }

  bubble.addEventListener('click', next);
  avWrap.addEventListener('click', () => api.onAvatar?.());

  const api = {
    now: () => null,
    /** Called when the player taps the crewmate (fun facts about the spacesuit). */
    onAvatar: null,
    /** Called with the text of every line that appears (read-aloud). */
    onLine: null,
    /** The line on screen right now. */
    current: () => showing?.text ?? null,
    /**
     * `tag` groups lines that replace each other (the guide's hints): a new one removes older
     * queued ones and takes over the bubble. `onShow` runs when the line actually appears.
     */
    say(text, mood = 'calm', { chatter = false, word: w = null, tag = null, onShow = null, now = false, keep = false } = {}) {
      if (chatter && (showing || queue.length)) return;
      // The same sentence twice in a row is noise (playtest: a line came back the next day).
      if (!w && (showing?.text === text || queue.some((q) => q.text === text))) return;
      // Drop stale chatter when something important comes in.
      if (!chatter) for (let i = queue.length - 1; i >= 0; i--) if (queue[i].chatter) queue.splice(i, 1);
      if (tag) for (let i = queue.length - 1; i >= 0; i--) if (queue[i].tag === tag) queue.splice(i, 1);
      const line = { text, mood, chatter, word: w, tag, onShow, keep, t: api.now() };
      // `now`: a lesson that holds the clock goes first, so the glowing button and the words match.
      if (now) { queue.unshift(line); if (!frozen) { next(); return; } } else queue.push(line);
      trim();
      // Real news replaces small talk right away, and a new hint replaces an old one.
      if (!showing || (!frozen && ((showing.chatter && !chatter) || (tag && showing.tag === tag)))) next();
      else more.textContent = `${queue.length} more ›`;
    },
    /** Keep the current line on screen while the game is paused (cards, repairs, calls). */
    freeze(on) {
      frozen = on;
      if (on) clearTimeout(timer);
      else schedule();
    },
    /** The problem this alert was about is solved: move on instead of showing old news. */
    dismissAlert() {
      if (showing?.mood === 'alert' && !frozen) next();
    },
    /** Remove lines with this tag (a hint that is no longer needed). */
    drop(tag) {
      for (let i = queue.length - 1; i >= 0; i--) if (queue[i].tag === tag) queue.splice(i, 1);
      if (showing?.tag === tag && !frozen) next();
    },
    clear() { queue.length = 0; showing = null; clearTimeout(timer); node.classList.remove('show'); },
  };
  return api;
}
