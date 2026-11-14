// SI disclosure: written with the SI tool Claude Code and reviewed by the team. See SI_USAGE.md and si-manifest.json.
// Mini-game: reopen a room that was sealed after a leak, in three guided steps.
// It shows what a sealed room is (no air at all inside) and what has to happen before anyone
// goes back in: close the hole, let air in, and check that the room holds it.
import { loadCss } from './css.js';
import { stepsHtml, createGuide } from './guide.js';

loadCss('./mg.css', import.meta.url);
loadCss('./reopen.css', import.meta.url);

const SHAPES = ['round', 'square', 'triangle'];
const PUMPS = 5;          // taps on the pump until the room is full
const TEST_MS = 2600;     // how long the pressure test watches the needle

// The real story at the end. Checked on 14 Nov 2026: NASA SP-4225 ("On June 25, 1997 ... the Progress resupply
// vehicle"), PBS NOVA and RussianSpaceWeb on Mir's Spektr module (sealed, never pressurised again). Leak checks
// before opening a hatch are standard: NASA space station blog, 14 Feb 2026 ("standard leak checks").
const REOPEN_FACT = 'This really happened: in 1997 a cargo ship hit the space station <b>Mir</b> and made a hole. The crew quickly sealed that room, and it never held air again. Our crew was luckier!';

/**
 * Renders the mini-game into `root`.
 * room: name of the sealed room.
 * onFinish(): the kid tapped the button after the hatch was open.
 */
export function mountReopen(root, { room = 'room', reducedMotion = false, onFinish }) {
  const hole = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  const order = [...SHAPES].sort(() => Math.random() - 0.5);
  const name = room.toLowerCase();
  let stage = 'panel'; // panel -> pump -> test -> hatch -> done
  let air = 0;

  root.innerHTML = `
    <div class="mg ro" data-stage="panel" style="--level:0; --meter:#5edcf0">
      <header class="mg-head">
        <h2>Reopen the ${name}</h2>
        <p class="mg-sam" aria-live="polite"><b>Sam</b><span></span></p>
        ${stepsHtml(['Close the hole', 'Pump air in', 'Test, then open'])}
      </header>
      <div class="mg-body">
        <div class="mg-meter" role="img" aria-label="Air in the ${name}">
          <span class="mg-meter-label">Air in the ${name}</span>
          <span class="mg-track"><span class="mg-fill"></span></span>
          <b class="mg-pct"></b>
        </div>
        <div class="ro-wall">
          <div class="ro-hole" data-shape="${hole}" aria-hidden="true"></div>
          <span class="ro-label">Wall of the ${name}, seen from outside</span>
        </div>
        <div class="ro-panels" role="group" aria-label="Wall panels">
          ${order.map((s) => `<button type="button" class="ro-panel" data-shape="${s}" aria-label="${s} wall panel"><span class="ro-shape" data-shape="${s}"></span></button>`).join('')}
        </div>
        <button type="button" class="mg-btn ro-pump" hidden>Pump air in</button>
        <button type="button" class="mg-btn ro-test" hidden>Start the pressure test</button>
        <button type="button" class="mg-btn ro-hatch" hidden>Open the hatch</button>
      </div>
      <div class="mg-win" hidden>
        <p class="mg-gain">The ${name} is open again!</p>
        <p class="mg-fact">${REOPEN_FACT}</p>
        <button type="button" class="mg-btn ro-done">Back to the base</button>
      </div>
    </div>`;

  const game = root.querySelector('.ro');
  const pct = root.querySelector('.mg-pct');
  const panels = root.querySelector('.ro-panels');
  const holeEl = root.querySelector('.ro-hole');
  const pump = root.querySelector('.ro-pump');
  const test = root.querySelector('.ro-test');
  const hatch = root.querySelector('.ro-hatch');
  const guide = createGuide(game);
  const buzz = (ms) => { if (navigator.vibrate) try { navigator.vibrate(ms); } catch { /* not allowed */ } };
  const go = (next) => { stage = next; game.dataset.stage = next; };
  const setAir = (v) => {
    air = v;
    game.style.setProperty('--level', v);
    game.style.setProperty('--meter', v >= 100 ? '#8fe36b' : '#5edcf0');
    pct.textContent = v <= 0 ? 'Empty' : v >= 100 ? 'Full' : `${Math.round(v)}%`;
  };
  setAir(0);

  // Step 1: the right panel for the hole
  guide.step(0);
  guide.say('Tap the wall panel that fits the hole.', `We closed the ${name} because of a leak. Now there is no air in it at all, like outside.`);
  guide.point(null);

  panels.addEventListener('click', (e) => {
    const b = e.target.closest('.ro-panel');
    if (!b || stage !== 'panel') return;
    if (b.dataset.shape !== hole) {
      b.classList.remove('miss');
      void b.offsetWidth; // restart the shake
      b.classList.add('miss');
      guide.say('That panel does not cover the hole. Look at its shape.', 'A gap would let the air out again.');
      guide.point(panels.querySelector(`.ro-panel[data-shape="${hole}"]`));
      return;
    }
    buzz(16);
    holeEl.classList.add('closed');
    panels.hidden = true;
    go('pump');
    pump.hidden = false;
    guide.step(1);
    guide.say('Tap “Pump air in” until the bar is full.', 'The hole is closed. Now the room needs air again, from our tanks.');
    guide.point(pump);
  });

  // Step 2: fill the room
  pump.addEventListener('click', () => {
    if (stage !== 'pump') return;
    buzz(10);
    setAir(Math.min(100, air + 100 / PUMPS));
    if (air < 100) {
      guide.say(`Keep pumping (${Math.round(air)}% full).`, 'Every push sends more air from the tanks into the room.');
      return;
    }
    pump.hidden = true;
    go('test');
    test.hidden = false;
    guide.step(2);
    guide.say('Tap “Start the pressure test”.', 'The room is full. But does the new panel hold? We watch the air for a moment before anyone goes in.');
    guide.point(test);
  });

  // Step 3: the pressure test, then the hatch
  test.addEventListener('click', () => {
    if (stage !== 'test') return;
    test.disabled = true;
    go('testing');
    guide.point(null);
    guide.say('Watch the bar…', 'If it stays full, no air gets out.');
    setTimeout(() => {
      if (!root.isConnected) return;
      test.hidden = true;
      go('hatch');
      hatch.hidden = false;
      guide.say('It holds! Tap “Open the hatch”.', 'No air is getting out, so the crew can go back in.');
      guide.point(hatch);
    }, reducedMotion ? 600 : TEST_MS);
  });

  hatch.addEventListener('click', () => {
    if (stage !== 'hatch') return;
    buzz(18);
    hatch.hidden = true;
    go('done');
    guide.step(3);
    guide.point(null);
    guide.say('The hatch is open!', `The ${name} is part of the base again.`);
    const box = root.querySelector('.mg-win');
    box.hidden = false;
    const done = box.querySelector('.ro-done');
    done.addEventListener('click', () => onFinish?.());
    setTimeout(() => done.focus({ preventScroll: true }), 60);
  });
}
