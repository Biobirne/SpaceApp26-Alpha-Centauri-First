// SI disclosure: written with the SI tool Claude Code and reviewed by the team. See SI_USAGE.md and si-manifest.json.
// Mini-game: brush Moon dust off the solar panels during a spacewalk.
// Teaches three true things: dust blocks sunlight (the power meter climbs as cells get clean),
// Moon dust is sticky (some of it lands again), and NASA tested an electric dust shield on the Moon in 2025.

const COLS = 4;
const ROWS = 3;
const MAX_RESETTLE = 3; // sticky dust lands on a clean cell at most this many times, so it never feels unfair

/**
 * Fills `board` with the panel grid and `ui` with the power meter, status line and finish box.
 * Calls `onFinish()` when the kid taps "Back inside" after cleaning everything.
 * `dustyFactor` is the share of power dusty panels still make (from config).
 */
export function mountDust(board, ui, { dustyFactor = 0.4, reducedMotion = false, onFinish }) {
  const n = COLS * ROWS;
  // 2 = thick dust, 1 = thin dust, 0 = clean. Thick dust needs two strokes.
  const dust = Array.from({ length: n }, (_, i) => ((i * 7) % 3 === 0 ? 1 : 2));
  let resettled = 0;
  let toldSticky = false;
  let finished = false;

  board.classList.add('dust-board');
  board.style.setProperty('--cols', COLS);
  board.innerHTML = Array.from({ length: n }, (_, i) =>
    `<button type="button" class="cell" data-i="${i}" aria-label="Dusty panel square ${i + 1} of ${n}"></button>`).join('');
  const cells = [...board.querySelectorAll('.cell')];

  ui.innerHTML = `
    <div class="dust-meter" role="img" aria-label="Power from the panels">
      <span class="dm-label">Power from the panels</span>
      <span class="dm-track"><span class="dm-fill"></span></span>
      <b class="dm-value"></b>
    </div>
    <p class="dust-status" aria-live="polite">Tap or swipe the dusty squares to brush them.</p>
    <div class="dust-done" hidden>
      <div class="fact"><span><b>Real fact:</b> In 2025, NASA tested an electric dust shield on the Moon. It shakes dust off with electricity, no brushing needed.</span></div>
      <button type="button" class="btn go dust-back">Back inside</button>
    </div>`;
  const fill = ui.querySelector('.dm-fill');
  const value = ui.querySelector('.dm-value');
  const status = ui.querySelector('.dust-status');

  const startDust = dust.reduce((a, d) => a + d, 0);
  // Starts at the same share the game rules use for dusty panels, ends at 100 %.
  const power = () => {
    const left = Math.min(1, dust.reduce((a, d) => a + d, 0) / startDust);
    return Math.round(100 * (1 - left * (1 - dustyFactor)));
  };
  const render = () => {
    const p = power();
    fill.style.width = `${p}%`;
    value.textContent = `${p}%`;
    cells.forEach((c, i) => {
      c.dataset.dust = dust[i];
      c.setAttribute('aria-label', dust[i] ? `Dusty panel square ${i + 1} of ${n}` : `Clean panel square ${i + 1} of ${n}`);
    });
  };

  const neighbours = (i) => {
    const r = Math.floor(i / COLS), c = i % COLS;
    return [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]]
      .filter(([y, x]) => y >= 0 && y < ROWS && x >= 0 && x < COLS)
      .map(([y, x]) => y * COLS + x);
  };

  const puff = (cell) => {
    if (reducedMotion) return;
    for (let k = 0; k < 5; k++) {
      const d = document.createElement('i');
      d.className = 'puff';
      d.style.left = `${20 + Math.random() * 60}%`;
      d.style.top = `${30 + Math.random() * 40}%`;
      d.style.setProperty('--dx', `${(Math.random() - 0.5) * 40}px`);
      d.style.setProperty('--dy', `${-20 - Math.random() * 30}px`);
      cell.appendChild(d);
      setTimeout(() => d.remove(), 1400);
    }
  };

  const brush = (cell) => {
    if (!cell || finished) return;
    const i = Number(cell.dataset.i);
    if (!dust[i]) return;
    dust[i]--;
    puff(cell);
    if (navigator.vibrate) try { navigator.vibrate(10); } catch { /* not allowed */ }
    // Sticky dust: the first few brushes make some dust land on a clean neighbour.
    if (dust[i] === 0 && resettled < MAX_RESETTLE && cleanCount() >= 2 + resettled * 3) {
      const target = neighbours(i).find((j) => dust[j] === 0);
      if (target !== undefined) {
        dust[target] = 1;
        resettled++;
        cells[target].classList.remove('landed');
        void cells[target].offsetWidth; // restart the animation
        cells[target].classList.add('landed');
        if (!toldSticky) {
          toldSticky = true;
          status.textContent = 'Moon dust is sticky, like a balloon on your hair. Some of it landed again!';
        }
      }
    }
    render();
    if (dust.every((d) => d === 0)) win();
  };
  const cleanCount = () => dust.filter((d) => d === 0).length;

  const win = () => {
    finished = true;
    board.classList.add('all-clean');
    status.textContent = 'All clean! The panels make full power again.';
    const done = ui.querySelector('.dust-done');
    done.hidden = false;
    const back = done.querySelector('.dust-back');
    back.addEventListener('click', () => onFinish());
    setTimeout(() => back.focus({ preventScroll: false }), 50);
  };

  // Pointer: brush on touch-down and on every new square the finger slides over (swipe shortcut).
  // Click only handles the keyboard (Enter/Space), so one tap never brushes twice.
  let down = false;
  let last = null;
  const cellAt = (e) => {
    const c = document.elementFromPoint(e.clientX, e.clientY)?.closest('.cell');
    return c && board.contains(c) ? c : null;
  };
  board.addEventListener('pointerdown', (e) => {
    down = true;
    last = cellAt(e);
    brush(last);
  });
  for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) board.addEventListener(ev, () => { down = false; });
  board.addEventListener('pointermove', (e) => {
    if (!down) return;
    const cell = cellAt(e);
    if (cell && cell !== last) { last = cell; brush(cell); }
  });
  board.addEventListener('click', (e) => { if (e.detail === 0) brush(e.target.closest('.cell')); });

  render();
}
