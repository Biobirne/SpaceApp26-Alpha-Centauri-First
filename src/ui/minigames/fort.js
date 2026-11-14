// SI disclosure: written with the SI tool Claude Code and reviewed by the team. See SI_USAGE.md and si-manifest.json.
// Mini-game: build a storm wall (called "fort" in the code). It teaches what really protects astronauts: mass.
// Two parts, so a 7-year-old knows what they are doing and why:
// 1. Test: hold a pillow, then a water bag into the particle stream. Light lets it through, heavy stops it.
// 2. Build: use that rule to stack the right things on the thin shelter wall, and watch how much
//    radiation still reaches the crew (before and after).
// The real plan for NASA's Orion spaceship works the same way: the crew builds a shelter from its supply bags.
// Styles live next to this file (fort.css) and load themselves.
import { icon, crewAvatar } from '../icons.js';

const CSS_URL = new URL('./fort.css', import.meta.url).href;
if (typeof document !== 'undefined' && !document.querySelector(`link[href="${CSS_URL}"]`)) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = CSS_URL;
  document.head.appendChild(link);
}

const SLOTS = 5;
const SAFE = 30; // the fort is done when this share of the radiation or less still reaches the crew

// `stops` is the share of the radiation one item stops. Heavy, dense things stop a lot.
const KINDS = {
  water: { name: 'Water bag', stops: 18, heavy: true },
  soil: { name: 'Moon soil', stops: 18, heavy: true },
  food: { name: 'Full food crate', stops: 18, heavy: true },
  pillow: { name: 'Pillow', stops: 2, heavy: false },
  box: { name: 'Empty box', stops: 2, heavy: false },
  blanket: { name: 'Blanket', stops: 2, heavy: false },
};
// Shelf order: heavy and light things mixed, so the kid has to use the rule.
const SHELF = ['pillow', 'water', 'soil', 'box', 'food', 'blanket', 'water', 'soil'];

const thing = (kind) => `<span class="fg-thing" data-kind="${kind}">${kind === 'water' ? icon('drop') : ''}</span>`;
const lane = (cls, n) => `<span class="fg-lane ${cls}" aria-hidden="true">${'<i></i>'.repeat(n)}</span>`;

/**
 * Renders the mini-game into `root`.
 * onFinish(): the kid tapped the button after the fort was strong enough.
 */
export function mountFort(root, { reducedMotion = false, onFinish }) {
  root.innerHTML = `<div class="fg ${reducedMotion ? 'still' : ''}"></div>`;
  const game = root.querySelector('.fg');
  const buzz = (ms) => { if (navigator.vibrate) try { navigator.vibrate(ms); } catch { /* not allowed */ } };

  // ------------------------------------------------------------------ part 1: the test

  function showTest() {
    const tried = new Set();
    game.dataset.part = 'test';
    game.style.setProperty('--through', 100);
    game.innerHTML = `
      <header class="fg-head">
        <h2>What stops radiation?</h2>
        <p class="fg-sam" aria-live="polite"><b>Sam</b><span>Radiation is tiny, fast particles from the Sun. They fly through thin walls. Let’s test what stops them!</span></p>
      </header>
      <div class="fg-scene fg-test">
        <div class="fg-room" aria-hidden="true">${crewAvatar('alert')}<span>Crew</span></div>
        <div class="fg-row" data-state="open">
          ${lane('out', 3)}
          <span class="fg-slot fg-probe" aria-live="polite"></span>
          ${lane('in', 2)}
        </div>
      </div>
      <p class="fg-ask">Hold something in the way:</p>
      <div class="fg-shelf two" role="group" aria-label="Things to test">
        <button type="button" class="fg-item" data-kind="pillow">${thing('pillow')}<span>Pillow</span></button>
        <button type="button" class="fg-item" data-kind="water">${thing('water')}<span>Water bag</span></button>
      </div>
      <div class="fg-rule" hidden>
        <p><b>Light</b> things let radiation through.<br><b>Heavy</b> things stop it.</p>
        <p class="fg-why">Why? Every particle bumps into the stuff in its way. The more stuff, the more particles get stuck.</p>
        <button type="button" class="fg-btn fg-next">Build the wall</button>
      </div>
`;
    const row = game.querySelector('.fg-row');
    const probe = game.querySelector('.fg-probe');
    const sam = game.querySelector('.fg-sam span');
    const room = game.querySelector('.fg-room');
    game.querySelector('.fg-shelf').addEventListener('click', (e) => {
      const b = e.target.closest('.fg-item');
      if (!b) return;
      const kind = b.dataset.kind;
      const heavy = KINDS[kind].heavy;
      tried.add(kind);
      b.classList.add('tried');
      probe.innerHTML = `${thing(kind)}<span>${KINDS[kind].name}</span>`;
      row.dataset.state = heavy ? 'heavy' : 'light';
      room.innerHTML = `${crewAvatar(heavy ? 'happy' : 'alert')}<span>Crew</span>`;
      buzz(heavy ? 18 : 6);
      sam.textContent = heavy
        ? 'A water bag is heavy. The particles get stuck in it!'
        : 'A pillow is light. The particles fly right through!';
      if (tried.size === 2) {
        const rule = game.querySelector('.fg-rule');
        game.querySelector('.fg-ask').textContent = 'You tested both. So the rule is:';
        rule.hidden = false;
        rule.querySelector('.fg-next').addEventListener('click', showBuild, { once: true });
      } else {
        game.querySelector('.fg-ask').textContent = heavy ? 'Now try the pillow:' : 'Now try the water bag:';
      }
    });
  }

  // ------------------------------------------------------------------ part 2: the wall

  function showBuild() {
    const wall = Array(SLOTS).fill(null); // shelf index of the item in each wall spot
    let finished = false;
    game.dataset.part = 'build';
    game.style.setProperty('--through', 100);
    game.innerHTML = `
      <header class="fg-head">
        <h2>Build the storm wall</h2>
        <p class="fg-sam" aria-live="polite"><b>Sam</b><span>The shelter wall is thin. Stack heavy things against it, so more stuff is in the way. Get the purple bar below the yellow line!</span></p>
      </header>
      <div class="fg-scene">
        <div class="fg-room" aria-hidden="true">${crewAvatar('alert')}<span>Crew</span></div>
        ${Array.from({ length: SLOTS }, (_, i) => `
          <div class="fg-row" data-state="open">
            ${lane('out', 3)}
            <button type="button" class="fg-slot" data-i="${i}" aria-label="Empty wall spot ${i + 1}"></button>
            ${lane('in', 2)}
          </div>`).join('')}
      </div>
      <div class="fg-meter" role="img" aria-label="Radiation reaching the crew">
        <span class="fg-meter-label">Radiation reaching the crew</span>
        <span class="fg-track"><span class="fg-fill"></span><span class="fg-goal"></span></span>
        <b class="fg-pct"></b>
      </div>
      <div class="fg-shelf" role="group" aria-label="Supplies">
        ${SHELF.map((kind, n) => `<button type="button" class="fg-item" data-n="${n}">${thing(kind)}<span>${KINDS[kind].name}</span></button>`).join('')}
      </div>
      <div class="fg-win" hidden>
        <p class="fg-gain">The crew is safe!</p>
        <p class="fg-before"></p>
        <p class="fg-fact">Real astronauts do this too: on NASA’s Orion spaceship, the crew plans to build a storm shelter from its supply bags.</p>
        <button type="button" class="fg-btn fg-done">Wall is ready</button>
      </div>`;

    const rows = [...game.querySelectorAll('.fg-row')];
    const slots = [...game.querySelectorAll('.fg-slot')];
    const items = [...game.querySelectorAll('.fg-item')];
    const pct = game.querySelector('.fg-pct');
    const sam = game.querySelector('.fg-sam span');
    const room = game.querySelector('.fg-room');
    const say = (text) => { sam.textContent = text; };
    let mood = 'alert';

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
      const now = t <= SAFE ? 'happy' : 'alert';
      if (now !== mood) { mood = now; room.innerHTML = `${crewAvatar(mood)}<span>Crew</span>`; }
      return t;
    };

    const place = (n) => {
      if (finished) return;
      const spot = wall.indexOf(null);
      if (spot < 0) { say('The wall is full. Tap a light thing on the wall to take it off.'); return; }
      wall[spot] = n;
      const k = KINDS[SHELF[n]];
      buzz(k.heavy ? 18 : 6);
      const t = render();
      if (t <= SAFE) { win(t); return; }
      if (!wall.includes(null)) say('Still too much gets through. Tap a light thing on the wall to take it off.');
      else say(k.heavy ? `${k.name}: heavy. It stops the particles!` : `${k.name}: light. The particles fly right through.`);
    };

    const takeOff = (i) => {
      if (finished || wall[i] == null) return;
      wall[i] = null;
      render();
      say('Back on the shelf. Which things are heavy?');
    };

    const win = (t) => {
      finished = true;
      game.classList.add('won');
      say('That wall is thick and heavy. The crew is safe behind it!');
      const box = game.querySelector('.fg-win');
      box.querySelector('.fg-before').innerHTML = `Before: <b>100%</b> of the radiation reached the crew. Now: only <b>${t}%</b>.`;
      box.hidden = false;
      const done = box.querySelector('.fg-done');
      done.addEventListener('click', () => onFinish?.());
      setTimeout(() => done.focus({ preventScroll: true }), 60);
    };

    game.querySelector('.fg-shelf').addEventListener('click', (e) => {
      const b = e.target.closest('.fg-item');
      if (b && !b.disabled) place(Number(b.dataset.n));
    });
    game.querySelector('.fg-scene').addEventListener('click', (e) => {
      const b = e.target.closest('.fg-slot');
      if (b) takeOff(Number(b.dataset.i));
    });
    render();
  }

  showTest();
}
