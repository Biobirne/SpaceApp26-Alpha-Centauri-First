// SI disclosure: written with the SI tool Claude Code and reviewed by the team. See SI_USAGE.md and si-manifest.json.
// Mini-game: brush Moon dust off the solar panels during a spacewalk. Full screen, few words.
// It shows (instead of telling) three true things:
// - dust blocks sunlight: dusty squares stay dark, clean ones light up and send power down the cable to the battery
// - Moon dust is sticky: a few brushes make some dust land again
// - NASA tested an electric dust shield on the Moon in 2025 (the line at the end)
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
const MAX_RESETTLE = 3; // sticky dust lands again at most this often, so it never feels unfair

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
  // 2 = thick dust (two strokes), 1 = thin dust, 0 = clean.
  const dust = Array.from({ length: n }, (_, i) => ((i * 7) % 3 === 0 ? 1 : 2));
  const startDust = dust.reduce((a, d) => a + d, 0);
  const startPower = Math.round(dustyFactor * 100);
  let resettled = 0;
  let saidLight = false;
  let saidSticky = false;
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
      </div>
      <div class="dg-ground" aria-hidden="true"></div>
      <p class="dg-sam" aria-live="polite"><b>Sam</b><span>Tap or swipe the dust. Watch the battery!</span></p>
      <div class="dg-win" hidden>
        <p class="dg-gain"></p>
        <p class="dg-fact">Brushing is slow work. In 2025, NASA tested a dust shield on the Moon that shakes dust off with electricity.</p>
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
      c.dataset.dust = dust[i];
      c.setAttribute('aria-label', dust[i] ? `Dusty square ${i + 1}` : `Clean square ${i + 1}`);
    });
  };

  const neighbours = (i) => {
    const r = Math.floor(i / COLS), c = i % COLS;
    return [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]]
      .filter(([y, x]) => y >= 0 && y < ROWS && x >= 0 && x < COLS)
      .map(([y, x]) => y * COLS + x);
  };
  const cleanCount = () => dust.filter((d) => d === 0).length;

  // Dust floats off slowly: the Moon has weak gravity and no air.
  const puff = (cell) => {
    if (reducedMotion) return;
    for (let k = 0; k < 6; k++) {
      const d = document.createElement('i');
      d.className = 'dg-puff';
      d.style.left = `${15 + Math.random() * 70}%`;
      d.style.top = `${25 + Math.random() * 50}%`;
      d.style.setProperty('--dx', `${(Math.random() - 0.5) * 50}px`);
      d.style.setProperty('--dy', `${-25 - Math.random() * 35}px`);
      cell.appendChild(d);
      setTimeout(() => d.remove(), 1500);
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

  const brush = (cell) => {
    if (!cell || finished || root.querySelector('.dg-gate')) return;
    const i = Number(cell.dataset.i);
    if (!dust[i]) return;
    dust[i]--;
    puff(cell);
    if (navigator.vibrate) try { navigator.vibrate(10); } catch { /* not allowed */ }
    if (dust[i] === 0) {
      pulse();
      if (!saidLight) { saidLight = true; say('See? Sunlight gets through again. More light, more power.'); }
      // Sticky dust: some of it lands on a clean square next to this one.
      if (resettled < MAX_RESETTLE && cleanCount() >= 2 + resettled * 3) {
        const j = neighbours(i).find((k) => dust[k] === 0);
        if (j !== undefined) {
          dust[j] = 1;
          resettled++;
          cells[j].classList.remove('landed');
          void cells[j].offsetWidth; // restart the animation
          cells[j].classList.add('landed');
          if (!saidSticky) { saidSticky = true; say('Moon dust is sticky, like a balloon on your hair!'); }
        }
      }
    }
    render();
    if (dust.every((d) => d === 0)) win();
  };

  const win = () => {
    finished = true;
    game.classList.add('won');
    say('Full power again!');
    const box = root.querySelector('.dg-win');
    box.querySelector('.dg-gain').textContent = `+${100 - startPower}% power`;
    box.hidden = false;
    const back = box.querySelector('.dg-back');
    back.addEventListener('click', () => onFinish?.());
    setTimeout(() => back.focus({ preventScroll: true }), 60);
  };

  // Pointer: brush on touch-down and on every new square the finger slides over (swipe shortcut).
  // Click only handles the keyboard (Enter/Space), so one tap never brushes twice.
  let down = false;
  let last = null;
  const cellAt = (e) => {
    const c = document.elementFromPoint(e.clientX, e.clientY)?.closest('.dg-cell');
    return c && panel.contains(c) ? c : null;
  };
  panel.addEventListener('pointerdown', (e) => { down = true; last = cellAt(e); brush(last); });
  for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) panel.addEventListener(ev, () => { down = false; });
  panel.addEventListener('pointermove', (e) => {
    if (!down) return;
    const c = cellAt(e);
    if (c && c !== last) { last = c; brush(c); }
  });
  panel.addEventListener('click', (e) => { if (e.detail === 0) brush(e.target.closest('.dg-cell')); });

  render();
}
