// SI disclosure: written with the SI tool Claude Code and reviewed by the team. See SI_USAGE.md and si-manifest.json.
// Mini-game: brush Moon dust off the solar panels during a spacewalk. Full screen, few words.
// It shows (instead of telling) four true things:
// - dust blocks sunlight: dusty squares stay dark, clean ones light up and send power down the cable to the battery
// - the battery runs the base: as power comes back, water, lab and radio switch on again
// - Moon dust is sticky, so it takes rubbing
// - NASA tested an electric dust shield on the Moon in 2025 (the line at the end)
import { icon } from '../icons.js';

// Styles live next to this file (dust.css) and load themselves, so no shared file changes.

const CSS_URL = new URL('./dust.css', import.meta.url).href;
if (typeof document !== 'undefined' && !document.querySelector(`link[href="${CSS_URL}"]`)) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = CSS_URL;
  document.head.appendChild(link);
}

const COLS = 4;
const ROWS = 3;

// What the battery runs. Low power means only the most important machine keeps going.
const DEVICES = [
  { id: 'air', icon: 'air', label: 'Air', at: 0, say: '' },
  { id: 'water', icon: 'drop', label: 'Water', at: 55, say: 'Water recycler on. We can clean our water again.' },
  { id: 'lab', icon: 'science', label: 'Lab', at: 75, say: 'The lab is on. The crew can do science again!' },
  { id: 'radio', icon: 'dish', label: 'Radio', at: 95, say: 'Radio on. We can talk to Earth again!' },
];

const fmt = (x) => (x >= 10 ? Math.round(x) : Math.round(x * 10) / 10);

/**
 * Renders the mini-game into `root`.
 * eva: { rad, dose } from the rules (radiation outside right now, dose this spacewalk adds), or null.
 * dustyFactor: the share of power dusty panels still make (from config), so the battery starts where the rules are.
 * onFinish(): the kid tapped "Back inside" after cleaning everything.
 * onWait(): the kid chose to wait for the storm to calm (only offered when the dose is high).
 */
export function mountDust(root, { eva = null, dustyFactor = 0.4, reducedMotion = false, onFinish, onWait }) {
  const n = COLS * ROWS;
  // How much dust is on each square: 1 = thick, 0 = clean. Rubbing lowers it bit by bit.
  const dust = Array.from({ length: n }, (_, i) => ((i * 7) % 3 === 0 ? 0.6 : 1));
  const startDust = dust.reduce((a, d) => a + d, 0);
  const startPower = Math.round(dustyFactor * 100);
  const on = new Set(DEVICES.filter((d) => d.at <= startPower).map((d) => d.id));
  let saidLight = false;
  let finished = false;

  const risky = eva && eva.dose >= 2;
  const evaLine = !eva ? ''
    : eva.dose < 0.5 ? 'Spacewalk. Radiation is low right now.'
      : `Spacewalk. Radiation out here: ${fmt(eva.rad)}× normal.`;

  root.innerHTML = `
    <div class="dg" style="--p:${startPower}">
      <div class="dg-sun" aria-hidden="true"></div>
      <div class="dg-rays" aria-hidden="true"><i></i><i></i><i></i></div>
      <header class="dg-head">
        <h2>Brush off the Moon dust</h2>
        <p>Dust blocks the sunlight.</p>
        ${evaLine ? `<p class="dg-eva">${evaLine}</p>` : ''}
      </header>
      <div class="dg-rig">
        <div class="dg-panel" role="group" aria-label="Solar panel, ${n} squares">
          ${Array.from({ length: n }, (_, i) => `<button type="button" class="dg-cell" data-i="${i}"></button>`).join('')}
        </div>
        <div class="dg-cable" aria-hidden="true"></div>
        <div class="dg-battery" role="img" aria-label="Battery">
          <div class="dg-fill"></div>
          <b class="dg-pct"></b>
        </div>
        <ul class="dg-devices" aria-label="What the power runs">
          ${DEVICES.map((d) => `<li data-id="${d.id}">${icon(d.icon)}<span>${d.label}</span></li>`).join('')}
        </ul>
      </div>
      <div class="dg-ground" aria-hidden="true"></div>
      <p class="dg-sam" aria-live="polite"><b>Sam</b><span>Low power! Only the air machine still runs. Rub the dust off.</span></p>
      <div class="dg-win" hidden>
        <p class="dg-gain"></p>
        <p class="dg-fact">Moon dust sticks like a balloon on your hair, so brushing is slow. In 2025, NASA tested a dust shield on the Moon that shakes dust off with electricity.</p>
        <button type="button" class="dg-btn dg-back">Back inside</button>
      </div>
      ${risky ? `
      <div class="dg-gate">
        <p class="dg-gate-big">Radiation is ${fmt(eva.rad)}× normal outside.</p>
        <p>The shield can’t help out there. This spacewalk adds <b>+${fmt(eva.dose)} dose</b>.</p>
        ${eva.dose >= 5 ? '<p>Waiting a day or two is safer. The panels make less power until then.</p>' : ''}
        <button type="button" class="dg-btn dg-go">Go outside now</button>
        <button type="button" class="dg-btn quiet dg-wait">Wait for the storm to calm</button>
      </div>` : ''}
    </div>`;

  const game = root.querySelector('.dg');
  const panel = root.querySelector('.dg-panel');
  const cells = [...root.querySelectorAll('.dg-cell')];
  const pct = root.querySelector('.dg-pct');
  const cable = root.querySelector('.dg-cable');
  const sam = root.querySelector('.dg-sam span');
  const deviceEls = Object.fromEntries([...root.querySelectorAll('.dg-devices li')].map((li) => [li.dataset.id, li]));

  if (risky) {
    root.querySelector('.dg-go').addEventListener('click', () => root.querySelector('.dg-gate').remove());
    root.querySelector('.dg-wait').addEventListener('click', () => onWait?.());
  }

  const say = (text) => { sam.textContent = text; };
  const power = () => {
    const left = Math.min(1, dust.reduce((a, d) => a + d, 0) / startDust);
    return Math.round(100 * (1 - left * (1 - dustyFactor)));
  };
  const render = () => {
    const p = power();
    game.style.setProperty('--p', p);
    pct.textContent = `${p}%`;
    cells.forEach((c, i) => {
      c.style.setProperty('--d', dust[i].toFixed(3));
      c.classList.toggle('clean', dust[i] === 0);
      c.setAttribute('aria-label', dust[i] ? `Dusty square ${i + 1}` : `Clean square ${i + 1}`);
    });
    for (const d of DEVICES) {
      const el = deviceEls[d.id];
      el.classList.toggle('on', on.has(d.id) || p >= d.at);
      if (!on.has(d.id) && p >= d.at) {
        on.add(d.id);
        if (d.say) say(d.say);
      }
    }
    return p;
  };

  // Dust floats off slowly: the Moon has weak gravity and no air.
  let lastPuff = 0;
  const puff = (cell, x, y) => {
    if (reducedMotion) return;
    const now = performance.now();
    if (now - lastPuff < 60) return;
    lastPuff = now;
    const r = cell.getBoundingClientRect();
    for (let k = 0; k < 3; k++) {
      const d = document.createElement('i');
      d.className = 'dg-puff';
      d.style.left = `${((x ?? r.x + r.width / 2) - r.x) + (Math.random() - 0.5) * 16}px`;
      d.style.top = `${((y ?? r.y + r.height / 2) - r.y) + (Math.random() - 0.5) * 16}px`;
      d.style.setProperty('--dx', `${(Math.random() - 0.5) * 40}px`);
      d.style.setProperty('--dy', `${-20 - Math.random() * 30}px`);
      cell.appendChild(d);
      setTimeout(() => d.remove(), 1400);
    }
  };
  // Light from a clean square travels down the cable into the battery.
  const pulse = () => {
    if (reducedMotion) return;
    const p = document.createElement('i');
    p.className = 'dg-pulse';
    cable.appendChild(p);
    setTimeout(() => p.remove(), 900);
  };

  /** Take `amount` of dust off one square (1 = a whole thick layer). */
  const rub = (cell, amount, x, y) => {
    if (!cell || finished || root.querySelector('.dg-gate')) return;
    const i = Number(cell.dataset.i);
    if (!dust[i]) return;
    dust[i] = Math.max(0, dust[i] - amount);
    if (dust[i] < 0.06) dust[i] = 0;
    puff(cell, x, y);
    if (dust[i] === 0) {
      pulse();
      if (navigator.vibrate) try { navigator.vibrate(12); } catch { /* not allowed */ }
      if (!saidLight) { saidLight = true; say('See? Sunlight gets through again. More light, more power.'); }
    }
    render();
    if (dust.every((d) => d === 0)) win();
  };

  const win = () => {
    finished = true;
    game.classList.add('won');
    say('Full power! Everything in the base runs again.');
    const box = root.querySelector('.dg-win');
    box.querySelector('.dg-gain').textContent = `+${100 - startPower}% power`;
    box.hidden = false;
    const back = box.querySelector('.dg-back');
    back.addEventListener('click', () => onFinish?.());
    setTimeout(() => back.focus({ preventScroll: true }), 60);
  };

  // Rubbing: hold and move over the panel. The farther you rub over a square, the cleaner it gets.
  // A tap also takes some dust off, so it works without swiping too.
  const TAP = 0.36;
  let down = false;
  let lx = 0, ly = 0;
  const cellAt = (x, y) => {
    const c = document.elementFromPoint(x, y)?.closest('.dg-cell');
    return c && panel.contains(c) ? c : null;
  };
  panel.addEventListener('pointerdown', (e) => {
    down = true;
    lx = e.clientX; ly = e.clientY;
    try { panel.setPointerCapture(e.pointerId); } catch { /* fine without */ }
    rub(cellAt(e.clientX, e.clientY), TAP, e.clientX, e.clientY);
  });
  for (const ev of ['pointerup', 'pointercancel']) panel.addEventListener(ev, () => { down = false; });
  panel.addEventListener('pointermove', (e) => {
    if (!down) return;
    const pts = e.getCoalescedEvents?.() ?? [e];
    for (const p of pts.length ? pts : [e]) {
      const dist = Math.hypot(p.clientX - lx, p.clientY - ly);
      lx = p.clientX; ly = p.clientY;
      const cell = cellAt(p.clientX, p.clientY);
      if (cell && dist > 0) rub(cell, dist / (cell.offsetWidth * 1.4), p.clientX, p.clientY);
    }
  });
  panel.addEventListener('click', (e) => { if (e.detail === 0) rub(e.target.closest('.dg-cell'), 0.5); });

  render();
}
