// SI disclosure: written with the SI tool Claude Code and reviewed by the team. See SI_USAGE.md and si-manifest.json.
// Sheets that open over the game: decision cards, repair mini-games, Call Earth, upgrades,
// real data and pause. They never change state themselves; they call back into the controller.

import { icon } from './icons.js';
import { UPGRADES, ROOMS, CREWMATE_NAME } from '../rules/content.js';
import { SHIELD_LABELS, CONFIG } from '../rules/config.js';
import { currentDayIndex, fmtTimes } from '../rules/mission.js';
import { mountDust } from './minigames/dust.js';

export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
const BLOCK = ['Blocks nothing', 'Blocks about half', 'Blocks most', 'Blocks almost all'];

/** A modal sheet. Returns { el, close }. `onClose` runs once, however it was closed. */
export function openSheet(html, { className = '', closable = true, onClose } = {}) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `<div class="sheet ${className}" role="dialog" aria-modal="true">
    ${closable ? `<button type="button" class="btn quiet icon-only close" aria-label="Close">${icon('close')}</button>` : ''}
    ${html}</div>`;
  document.body.appendChild(modal);
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    document.removeEventListener('keydown', onKey);
    modal.classList.add('out');
    setTimeout(() => modal.remove(), reducedMotion() ? 0 : 180);
    onClose?.();
  };
  const onKey = (e) => { if (e.key === 'Escape' && closable) close(); };
  document.addEventListener('keydown', onKey);
  if (closable) {
    modal.querySelector('.close').addEventListener('click', close);
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  }
  const sheet = modal.querySelector('.sheet');
  // Focus the sheet itself, not an option, so no choice looks pre-selected.
  sheet.tabIndex = -1;
  setTimeout(() => sheet.focus({ preventScroll: true }), 50);
  return { el: sheet, close };
}

// ------------------------------------------------------------------ decision card

export function showCard(card, onChoose) {
  const kindIcon = card.kind === 'flare' ? 'sun' : 'radiation';
  const badge = card.kind === 'flare' ? 'Real solar flare' : 'Real particle storm';
  const html = `
    <span class="badge">${icon(kindIcon)}${badge}</span>
    <h2>${esc(card.title)}</h2>
    <p>${esc(card.text)}</p>
    <div class="fact">${icon('info')}<span>${esc(card.fact)}</span></div>
    <div class="options">
      ${card.options.map((o) => `
        <button type="button" class="btn quiet option" data-id="${esc(o.id)}" ${o.disabled ? 'disabled' : ''}>
          <span><span class="o-label">${esc(o.label)}</span><span class="o-block">${esc(o.disabled ? `${o.disabled}: the shield needs power` : blockText(o.effects))}</span></span>
          <span class="o-cost">${esc(o.cost)}</span>
        </button>`).join('')}
    </div>`;
  const sheet = openSheet(html, { className: 'card', closable: false });
  sheet.el.dataset.kind = card.kind;
  sheet.el.querySelector('.options').addEventListener('click', (e) => {
    const b = e.target.closest('[data-id]');
    if (!b || b.disabled) return;
    sheet.close();
    onChoose(b.dataset.id);
  });
  return sheet;
}

function blockText(fx) {
  if (fx.sheltered) return 'Thick walls block almost all';
  if (fx.shield !== undefined) return `Shield ${SHIELD_LABELS[fx.shield]}: ${BLOCK[fx.shield].toLowerCase()}`;
  return 'Shield stays as it is';
}

// ------------------------------------------------------------------ repair mini-games

const TASKS = {
  leak: { title: 'Patch the leak', goal: (n) => `Tap the ${n} cracks to seal them.`, icon: 'drop', spot: 'wrench' },
  dust: { title: 'Clean the solar panels', icon: 'sun', game: mountDust },
  filter: { title: 'Swap the air filter', goal: () => 'Do the steps in order.', icon: 'filter', steps: ['Pull out old filter', 'Put in new filter', 'Lock it'] },
  rebuild: { title: 'Rebuild the room', goal: () => 'Place the new wall panels.', icon: 'wrench', spot: 'check' },
};

function evaPanel(eva) {
  const risky = eva.dose >= 2;
  return `<div class="eva ${risky ? 'risky' : ''}">
    ${icon('rocket')}<div><b>This is a spacewalk.</b>
    <p>The panels are outside. ${CREWMATE_NAME} puts on a spacesuit with oxygen, cooling water and 30 minutes of spare air.</p>
    <p>Out there, the shield can’t help. ${eva.dose < 0.5
    ? `Radiation is low now (${fmtTimes(eva.rad)} normal), so that is okay.`
    : `Radiation is ${fmtTimes(eva.rad)} normal: <b>+${eva.dose} dose</b>.`}</p>
    ${eva.dose >= 5 ? '<p><b>That is a lot.</b> Waiting a day or two is safer. The panels make less power until then.</p>' : ''}</div>
  </div>
  ${risky ? `<div class="row eva-choice">
    <button type="button" class="btn go eva-go">${icon('check')}Go outside now</button>
    <button type="button" class="btn quiet eva-wait">Wait for the storm to calm</button>
  </div>` : ''}`;
}

export function showRepair(job, onDone, onCancel) {
  const t = TASKS[job.kind];
  const room = ROOMS[job.roomId];
  let finished = false;
  if (t.game) {
    // Full-screen mini-games with their own rules and styles live in src/ui/minigames/.
    const sheet = openSheet('<div class="mg-root"></div>', {
      className: 'game-sheet',
      onClose: () => { if (!finished) onCancel?.(); },
    });
    t.game(sheet.el.querySelector('.mg-root'), {
      eva: job.eva,
      dustyFactor: CONFIG.power.dustySolarFactor,
      reducedMotion: reducedMotion(),
      onFinish: () => { finished = true; sheet.close(); onDone(); },
      onWait: () => sheet.close(),
    });
    return sheet;
  }
  const html = `
    <h2>${icon(t.icon)}${esc(t.title)}</h2>
    <p class="tgoal">${esc(room.name)}: ${esc(t.goal(job.taps))}</p>
    ${job.eva ? evaPanel(job.eva) : ''}
    <div class="board" data-kind="${job.kind}" ${job.eva && job.eva.dose >= 2 ? 'hidden' : ''}></div>
    <div class="progress">${'<i></i>'.repeat(job.taps)}</div>`;
  const sheet = openSheet(html, { className: 'task-sheet', onClose: () => { if (!finished) onCancel?.(); } });
  const board = sheet.el.querySelector('.board');
  const bars = [...sheet.el.querySelectorAll('.progress i')];
  const ordered = Boolean(t.steps) || job.kind === 'rebuild';
  const spots = layoutSpots(job.kind, job.taps);
  let done = 0;
  spots.forEach((p, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'spot';
    b.style.left = `${p.x}%`;
    b.style.top = `${p.y}%`;
    b.dataset.i = i;
    if (t.steps) {
      b.style.width = '64%';
      b.style.marginLeft = '-32%';
      b.style.height = '56px';
      b.style.borderRadius = '14px';
      b.innerHTML = `<span style="font-weight:600;font-size:16px">${i + 1}. ${esc(t.steps[i])}</span>`;
    } else if (t.spot) b.innerHTML = icon(t.spot);
    b.setAttribute('aria-label', t.steps ? t.steps[i] : `${t.title} ${i + 1} of ${job.taps}`);
    board.appendChild(b);
  });
  wireEva(sheet, board);
  const all = [...board.querySelectorAll('.spot')];
  const markNext = () => { if (ordered) all.forEach((b, i) => b.classList.toggle('next', i === done)); };
  markNext();

  const hit = (b) => {
    if (!b || b.classList.contains('done') || finished) return;
    if (ordered && Number(b.dataset.i) !== done) return;
    b.classList.add('done');
    if (job.kind === 'leak') b.innerHTML = icon('check');
    bars[done].classList.add('on');
    done++;
    markNext();
    if (navigator.vibrate) try { navigator.vibrate(12); } catch { /* not allowed */ }
    if (done >= job.taps) {
      finished = true;
      setTimeout(() => { sheet.close(); onDone(); }, reducedMotion() ? 150 : 450);
    }
  };
  board.addEventListener('click', (e) => hit(e.target.closest('.spot')));
  return sheet;
}

/** In a storm, going outside is a real choice: show the dose first and let the kid decide. */
function wireEva(sheet, board) {
  const go = sheet.el.querySelector('.eva-go');
  if (!go) return;
  go.addEventListener('click', () => {
    board.hidden = false;
    sheet.el.querySelector('.eva-choice').remove();
  });
  sheet.el.querySelector('.eva-wait').addEventListener('click', () => sheet.close());
}

function layoutSpots(kind, n) {
  if (kind === 'filter') return Array.from({ length: n }, (_, i) => ({ x: 50, y: 20 + i * 30 }));
  if (kind === 'rebuild') return Array.from({ length: n }, (_, i) => ({ x: 20 + (i % 3) * 30, y: 30 + Math.floor(i / 3) * 40 }));
  // leak: scattered, but never on top of each other
  const pts = [];
  let guard = 0;
  while (pts.length < n && guard++ < 500) {
    const p = { x: 14 + Math.random() * 72, y: 16 + Math.random() * 68 };
    if (pts.every((q) => Math.hypot(q.x - p.x, (q.y - p.y) * 0.8) > 22)) pts.push(p);
  }
  while (pts.length < n) pts.push({ x: 20 + pts.length * 15, y: 50 });
  return pts;
}

export function showRebuild(job, science, onYes) {
  const room = ROOMS[job.roomId];
  const enough = science >= job.cost;
  const html = `
    <h2>Rebuild the ${esc(room.name.toLowerCase())}?</h2>
    <p>We sealed it to save air. New wall panels cost science points.</p>
    <div class="row">
      <button type="button" class="btn go" ${enough ? '' : 'disabled'}>${icon('wrench')}Rebuild for ${icon('science')}${job.cost}</button>
    </div>
    ${enough ? '' : `<p class="source">You need ${Math.ceil(job.cost - science)} more science points. Keep the crew working!</p>`}`;
  const sheet = openSheet(html);
  sheet.el.querySelector('.btn.go').addEventListener('click', () => { sheet.close(); onYes(); });
  return sheet;
}

// ------------------------------------------------------------------ Call Earth

/**
 * The radio signal really takes about 1.3 s each way between the Moon and Earth.
 * We play that delay, then show the tip with its reason.
 */
export function showCall(advice, { roundTripSeconds, cooldownDays, actionLabel }, onApply, onClose) {
  const html = `
    <h2>Calling Mission Control</h2>
    <p class="call-intro">Mission Control on Earth watches the real space weather and your base. They tell you the one most important thing to do now.</p>
    <div class="link" aria-hidden="true">
      <span class="end moon">Moon</span><span class="wire"></span><span class="pulse"></span><span class="end earth">Earth</span>
      <span class="timer">Radio signal on its way…</span>
    </div>
    <div class="advice" hidden>
      <p class="a-text"></p>
      <div class="a-why">${icon('info')}<span><b>Why?</b> <span class="a-reason"></span></span></div>
      <div class="row"></div>
      <p class="source">Mission Control can take your next call in ${cooldownDays} days.</p>
    </div>`;
  const sheet = openSheet(html, { className: 'call-sheet', onClose });
  const pulse = sheet.el.querySelector('.pulse');
  const timer = sheet.el.querySelector('.timer');
  const link = sheet.el.querySelector('.link');
  const total = roundTripSeconds * 1000;
  const start = performance.now();
  let raf = 0;
  const frame = (now) => {
    const k = Math.min(1, (now - start) / total);
    const wire = link.clientWidth - 132;
    const pos = k < 0.5 ? k * 2 : 2 - k * 2;
    pulse.style.opacity = '1';
    pulse.style.transform = `translateX(${(reducedMotion() ? (k < 0.5 ? 1 : 0) : pos) * wire}px)`;
    pulse.style.background = k < 0.5 ? 'var(--air)' : 'var(--power)';
    timer.textContent = k < 0.5 ? `To Earth: ${((now - start) / 1000).toFixed(1)} s` : `Answer coming back: ${((now - start) / 1000).toFixed(1)} s`;
    if (k < 1) raf = requestAnimationFrame(frame);
    else reveal();
  };
  raf = requestAnimationFrame(frame);

  function reveal() {
    timer.textContent = `Round trip: ${roundTripSeconds.toFixed(1)} s. Radio waves travel at the speed of light!`;
    pulse.style.opacity = '0';
    const box = sheet.el.querySelector('.advice');
    box.hidden = false;
    box.querySelector('.a-text').textContent = advice.text;
    box.querySelector('.a-reason').textContent = advice.reason;
    const row = box.querySelector('.row');
    if (advice.action && actionLabel) {
      // A repair is still the kid's job: the button opens it. Shield and shelter are set for them.
      const label = advice.action.repair ? 'Fix it now' : 'Do it for me';
      const sub = advice.action.repair ? 'Opens the repair' : actionLabel;
      row.insertAdjacentHTML('beforeend', `<button type="button" class="btn earth apply">${icon('check')}<span>${label}<small class="sub">${esc(sub)}</small></span></button>`);
      row.querySelector('.apply').addEventListener('click', () => { onApply(advice.action); sheet.close(); });
    }
    row.insertAdjacentHTML('beforeend', `<button type="button" class="btn quiet ok">${advice.action && actionLabel ? 'I’ll do it myself' : 'Got it'}</button>`);
    row.querySelector('.ok').addEventListener('click', () => sheet.close());
    row.querySelector('.btn').focus({ preventScroll: true });
  }
  const close = sheet.close;
  sheet.close = () => { cancelAnimationFrame(raf); close(); };
  return sheet;
}

// ------------------------------------------------------------------ upgrades

export function showShop(state, onBuy) {
  const render = () => Object.entries(UPGRADES).map(([key, u]) => {
    const cost = state.cfg.upgrades[key].cost;
    const owned = state.upgrades[key];
    const short = Math.ceil(cost - state.science);
    return `<div class="item ${owned ? 'owned' : ''}">
      <h3>${esc(u.name)}</h3>
      <p>${esc(u.text)} <br><span style="color:var(--air)">${esc(u.fact)}</span></p>
      ${owned
        ? `<button type="button" class="btn quiet small" disabled>${icon('check')}Built</button>`
        : `<button type="button" class="btn go small" data-key="${key}" ${short > 0 ? 'disabled' : ''}>${icon('science')}${cost}</button>`}
      ${!owned && short > 0 ? `<p style="grid-column:1/-1;font-size:13px">Need ${short} more science points.</p>` : ''}
    </div>`;
  }).join('');
  const html = `
    <h2>Upgrades</h2>
    <p>Spend science points to make the base stronger. You have ${icon('science')}<b class="have">${Math.floor(state.science)}</b>.</p>
    <div class="shop"></div>`;
  const sheet = openSheet(html);
  const shop = sheet.el.querySelector('.shop');
  shop.innerHTML = render();
  shop.addEventListener('click', (e) => {
    const b = e.target.closest('[data-key]');
    if (!b || b.disabled) return;
    if (onBuy(b.dataset.key)) {
      shop.innerHTML = render();
      sheet.el.querySelector('.have').textContent = Math.floor(state.science);
    }
  });
  return sheet;
}

// ------------------------------------------------------------------ real data

export function showData(state, doc) {
  const tl = state.timeline;
  const today = currentDayIndex(state);
  const moon = doc.radiation.moonOrbit;
  const vals = tl.days.map((d) => d.radiation.moonOrbit?.times ?? null);
  const max = Math.max(10, ...vals.filter((v, i) => v != null && i <= today));
  const W = 320;
  const H = 120;
  const bw = W / vals.length;
  const y = (v) => H - 14 - (Math.log10(Math.max(1, v)) / Math.log10(max)) * (H - 30);
  const bars = vals.map((v, i) => {
    if (v == null) return '';
    const future = i > today;
    const h = future ? 6 : H - 14 - y(v);
    return `<rect class="bar ${future ? 'future' : i === today ? 'today' : ''}" x="${(i * bw + 1).toFixed(1)}" y="${(H - 14 - Math.max(2, h)).toFixed(1)}" width="${(bw - 2).toFixed(1)}" height="${Math.max(2, h).toFixed(1)}" rx="1.5"/>`;
  }).join('');
  const todayV = vals[today];
  const todayMean = tl.days[today].radiation.moonOrbit?.mean;
  const flares = tl.flares.filter((f) => f.t <= state.t && f.score >= 300).sort((a, b) => b.score - a.score).slice(0, 4);
  const fdate = (t) => new Date(tl.startMs + t * 86400000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  const html = `
    <h2>Real NASA data</h2>
    <p>Radiation near the Moon, day by day. Today is the bright bar.</p>
    <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Radiation near the Moon for each mission day">
      <line class="axis" x1="0" x2="${W}" y1="${H - 13}" y2="${H - 13}"/>
      ${bars}
      <text x="0" y="${H - 1}">Day 1</text><text x="${W}" y="${H - 1}" text-anchor="end">Day ${vals.length}</text>
      <text x="0" y="10">${fmtTimes(max)} normal</text>
    </svg>
    <ul class="datalist">
      <li><span>Today (${esc(tl.days[today].iso)})</span><span>${todayV != null ? `${fmtTimes(todayV)} normal` : 'no reading'}${todayMean != null ? `, ${todayMean} µGy/h` : ''}</span></li>
      <li><span>Measured by</span><span>${esc(moon.where)}</span></li>
      <li><span>Normal level</span><span>${moon.normal} µGy/h</span></li>
      ${flares.length ? `<li><span>Biggest flares so far</span><span>${flares.map((f) => `${esc(f.cls)} (${fdate(f.t)})`).join(', ')}</span></li>` : ''}
    </ul>
    <p class="source">Measured in orbit around the Moon. On the surface it is about half, because the Moon blocks half the sky.
    ${esc(doc.displayLabel)}: radiation from NASA OSDR RadLab, flares and particle storms from NASA DONKI.</p>`;
  return openSheet(html);
}

// ------------------------------------------------------------------ pause

export function showPause({ onResume, onRestart, onMenu, onHelp, hints, onHints, readAloud = null, onReadAloud }) {
  const html = `
    <h2>Paused</h2>
    <p>The Moon base waits for you.</p>
    <div class="row">
      <button type="button" class="btn primary resume">${icon('play')}Keep playing</button>
    </div>
    <button type="button" class="btn quiet small hints howto">${icon('book')}<span>How it works</span></button>
    <button type="button" class="btn quiet small hints" aria-pressed="${hints}">${icon('info')}<span></span></button>
    ${readAloud === null ? '' : `<button type="button" class="btn quiet small hints readaloud" aria-pressed="${readAloud}">${icon('speak')}<span></span></button>`}
    <div class="row">
      <button type="button" class="btn quiet small restart">${icon('restart')}Start this storm again</button>
      <button type="button" class="btn quiet small menu">${icon('back')}All missions</button>
    </div>`;
  let picked = null;
  const sheet = openSheet(html, { className: 'pause-sheet', onClose: () => (picked || onResume)() });
  sheet.el.querySelector('.resume').addEventListener('click', () => { picked = onResume; sheet.close(); });
  // Help on demand: the kid decides whether the step-by-step hints show.
  const hintBtn = sheet.el.querySelector('.hints');
  const renderHints = (on) => {
    hintBtn.setAttribute('aria-pressed', String(on));
    hintBtn.querySelector('span').textContent = on ? 'Hints are on. Tap to turn them off.' : 'Hints are off. Tap to show them again.';
  };
  renderHints(hints);
  hintBtn.addEventListener('click', () => {
    const on = hintBtn.getAttribute('aria-pressed') !== 'true';
    onHints(on);
    renderHints(on);
  });
  // Read aloud: the device's own voice reads every crew line (for kids who are still learning to read).
  const readBtn = sheet.el.querySelector('.readaloud');
  if (readBtn) {
    const renderRead = (on) => {
      readBtn.setAttribute('aria-pressed', String(on));
      readBtn.querySelector('span').textContent = on ? 'Sam reads every line aloud. Tap to stop.' : 'Tap to let Sam read every line aloud.';
    };
    renderRead(readAloud);
    readBtn.addEventListener('click', () => {
      const on = readBtn.getAttribute('aria-pressed') !== 'true';
      onReadAloud(on);
      renderRead(on);
    });
  }
  sheet.el.querySelector('.howto').addEventListener('click', () => { picked = onHelp; sheet.close(); });
  sheet.el.querySelector('.restart').addEventListener('click', () => { picked = onRestart; sheet.close(); });
  sheet.el.querySelector('.menu').addEventListener('click', () => { picked = onMenu; sheet.close(); });
  return sheet;
}

// ------------------------------------------------------------------ small feedback

export function toast(html, cls = '', ms = 2600) {
  let box = document.querySelector('.toasts');
  if (!box) {
    box = document.createElement('div');
    box.className = 'toasts';
    box.setAttribute('aria-live', 'polite');
    document.body.appendChild(box);
  }
  const t = document.createElement('div');
  t.className = `toast ${cls}`;
  t.innerHTML = html;
  box.appendChild(t);
  while (box.children.length > 3) box.firstChild.remove();
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, ms);
}

/** "−3.5 ⚡/day" floating up from a button: shows the cause right after a tap. */
export function floater(anchor, text, color) {
  if (!anchor) return;
  const r = anchor.getBoundingClientRect();
  const f = document.createElement('div');
  f.className = 'floater';
  f.textContent = text;
  if (color) f.style.color = color;
  f.style.left = `${r.left + r.width / 2}px`;
  f.style.top = `${r.top - 8}px`;
  document.body.appendChild(f);
  setTimeout(() => f.remove(), 1500);
}
