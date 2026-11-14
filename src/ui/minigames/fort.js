// SI disclosure: written with the SI tool Claude Code and reviewed by the team. See SI_USAGE.md and si-manifest.json.
// Mini-game: build a storm fort. The kid stacks supplies against the thin shelter wall.
// It shows (instead of telling) what really protects astronauts: mass. Heavy things like water
// stop the particles, light things like a pillow let them through. The real plan for NASA's
// Orion spaceship works the same way: the crew builds a shelter from its supply bags.
// Styles live next to this file (fort.css) and load themselves.
import { icon, crewAvatar } from '../icons.js';

const CSS_URL = new URL('./fort.css', import.meta.url).href;
if (typeof document !== 'undefined' && !document.querySelector(`link[href="${CSS_URL}"]`)) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = CSS_URL;
  document.head.appendChild(link);
}

const SLOTS = 6;
const SAFE = 25; // the fort is done when this share of the radiation or less still gets in

// `stops` is the share of the radiation one item stops. Heavy, dense things stop a lot.
const KINDS = {
  water: { name: 'Water bag', stops: 15, heavy: true, say: 'Water is heavy. It stops the particles!' },
  soil: { name: 'Moon soil', stops: 15, heavy: true, say: 'A bag of Moon soil is heavy. Good wall!' },
  food: { name: 'Food crate', stops: 15, heavy: true, say: 'A full food crate is heavy. That works!' },
  pillow: { name: 'Pillow', stops: 2, heavy: false, say: 'A pillow is light. The particles fly right through.' },
  box: { name: 'Empty box', stops: 2, heavy: false, say: 'An empty box is light. The particles fly right through.' },
  blanket: { name: 'Blanket', stops: 2, heavy: false, say: 'A blanket is light. The particles fly right through.' },
};
// Shelf order: heavy and light things mixed, so the kid has to choose.
const SHELF = ['pillow', 'water', 'soil', 'food', 'box', 'water', 'blanket', 'food', 'soil'];

const thing = (kind) => `<span class="fg-thing" data-kind="${kind}">${kind === 'water' ? icon('drop') : ''}</span>`;

/**
 * Renders the mini-game into `root`.
 * onFinish(): the kid tapped the button after the fort was strong enough.
 */
export function mountFort(root, { reducedMotion = false, onFinish }) {
  const wall = Array(SLOTS).fill(null); // shelf index of the item in each wall spot
  const said = new Set();
  let finished = false;

  root.innerHTML = `
    <div class="fg ${reducedMotion ? 'still' : ''}" style="--through:100">
      <header class="fg-head">
        <h2>Build the storm fort</h2>
        <p class="fg-why"><b>Problem:</b> radiation gets through the thin shelter wall.</p>
        <p class="fg-why"><b>Fix:</b> stack things against the wall. Which ones stop it?</p>
      </header>
      <div class="fg-scene">
        <div class="fg-room" aria-hidden="true">${crewAvatar('calm')}<span>Shelter</span></div>
        ${Array.from({ length: SLOTS }, (_, i) => `
          <div class="fg-row" data-i="${i}" data-state="open">
            <span class="fg-lane out" aria-hidden="true"><i></i><i></i><i></i></span>
            <button type="button" class="fg-slot" data-i="${i}" aria-label="Empty wall spot ${i + 1}"></button>
            <span class="fg-lane in" aria-hidden="true"><i></i><i></i></span>
          </div>`).join('')}
      </div>
      <div class="fg-meter" role="img" aria-label="Radiation getting in">
        <span class="fg-meter-label">Radiation getting in</span>
        <span class="fg-track"><span class="fg-fill"></span><span class="fg-goal"></span></span>
        <b class="fg-pct"></b>
      </div>
      <div class="fg-shelf" role="group" aria-label="Supplies">
        ${SHELF.map((kind, n) => `<button type="button" class="fg-item" data-n="${n}">${thing(kind)}<span>${KINDS[kind].name}</span></button>`).join('')}
      </div>
      <p class="fg-sam" aria-live="polite"><b>Sam</b><span>Tap a thing to put it on the wall. Watch the purple bar!</span></p>
      <span class="mg-mark">SI-generated placeholder art</span>
      <div class="fg-win" hidden>
        <p class="fg-gain"></p>
        <p class="fg-fact">Heavy things stop radiation, and water is one of the best. On NASA’s Orion spaceship, the crew plans to build a storm shelter from its supply bags.</p>
        <button type="button" class="fg-btn fg-done">Fort is ready</button>
      </div>
    </div>`;

  const game = root.querySelector('.fg');
  const rows = [...root.querySelectorAll('.fg-row')];
  const slots = [...root.querySelectorAll('.fg-slot')];
  const items = [...root.querySelectorAll('.fg-item')];
  const pct = root.querySelector('.fg-pct');
  const sam = root.querySelector('.fg-sam span');
  const say = (text) => { sam.textContent = text; };

  const through = () => Math.max(0, 100 - wall.reduce((sum, n) => sum + (n == null ? 0 : KINDS[SHELF[n]].stops), 0));

  const render = () => {
    const t = through();
    game.style.setProperty('--through', t);
    pct.textContent = `${t}%`;
    wall.forEach((n, i) => {
      const kind = n == null ? null : SHELF[n];
      rows[i].dataset.state = !kind ? 'open' : KINDS[kind].heavy ? 'heavy' : 'light';
      slots[i].innerHTML = kind ? `${thing(kind)}<span>${KINDS[kind].name}</span>` : '';
      slots[i].setAttribute('aria-label', kind ? `${KINDS[kind].name} on wall spot ${i + 1}. Tap to take it off.` : `Empty wall spot ${i + 1}`);
    });
    items.forEach((b, n) => { b.disabled = wall.includes(n); });
    return t;
  };

  const place = (n) => {
    if (finished) return;
    const spot = wall.indexOf(null);
    if (spot < 0) { say('The wall is full. Tap a thing on the wall to take it off.'); return; }
    wall[spot] = n;
    const kind = SHELF[n];
    if (navigator.vibrate) try { navigator.vibrate(KINDS[kind].heavy ? 18 : 6); } catch { /* not allowed */ }
    const t = render();
    if (t <= SAFE) { win(t); return; }
    if (!wall.includes(null)) say('Still too much gets in. Tap a light thing on the wall to take it off.');
    else if (!said.has(kind)) { said.add(kind); say(KINDS[kind].say); }
  };

  const takeOff = (i) => {
    if (finished || wall[i] == null) return;
    wall[i] = null;
    render();
    say('Back on the shelf. Try something heavier.');
  };

  const win = (t) => {
    finished = true;
    game.classList.add('won');
    say('That wall is thick and heavy. The crew is safe behind it!');
    const box = root.querySelector('.fg-win');
    box.querySelector('.fg-gain').textContent = `Only ${t}% gets in now`;
    box.hidden = false;
    const done = box.querySelector('.fg-done');
    done.addEventListener('click', () => onFinish?.());
    setTimeout(() => done.focus({ preventScroll: true }), 60);
  };

  root.querySelector('.fg-shelf').addEventListener('click', (e) => {
    const b = e.target.closest('.fg-item');
    if (b && !b.disabled) place(Number(b.dataset.n));
  });
  root.querySelector('.fg-scene').addEventListener('click', (e) => {
    const b = e.target.closest('.fg-slot');
    if (b) takeOff(Number(b.dataset.i));
  });

  render();
}
