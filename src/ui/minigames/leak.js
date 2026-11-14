// SI disclosure: written with the SI tool Claude Code and reviewed by the team. See SI_USAGE.md and si-manifest.json.
// Mini-game: find a leak and patch it.
// It shows why a leak is hard to find and how to find it: the air flows out through the hole,
// so a puff of fog drifts to exactly that spot. Then the kid tapes a patch over it, corner by corner.
import { loadCss } from './css.js';
import { stepsHtml, createGuide } from './guide.js';

loadCss('./mg.css', import.meta.url);
loadCss('./leak.css', import.meta.url);

const COLS = 4;
const ROWS = 3;
const FOG = 16;

// The real story at the end. Checked on 14 Nov 2026: UPI, 20 Oct 2020, "Space Station air leak repaired with
// help from floating tea leaves" (cosmonaut Anatoly Ivanishin, Zvezda module, patched with Kapton tape), and TASS.
const LEAK_FACT = 'This really happened: in 2020, cosmonauts on the space station let <b>tea leaves</b> float. The leaves drifted to a tiny leak, and the crew patched it with tape.';

/**
 * Renders the mini-game into `root`.
 * room: the name of the leaking room. onFinish(): the kid tapped the button after the patch was on.
 */
export function mountLeak(root, { room = 'room', reducedMotion = false, onFinish }) {
  const n = COLS * ROWS;
  const hole = Math.floor(Math.random() * n);
  let air = 92;
  let found = false;
  let fogged = false;
  let misses = 0;
  let timer = 0;

  root.innerHTML = `
    <div class="mg lk" style="--level:${air}; --meter:#5edcf0">
      <header class="mg-head">
        <h2>Find the leak</h2>
        <p class="mg-sam" aria-live="polite"><b>Sam</b><span></span></p>
        ${stepsHtml(['Puff some fog', 'Tap where the fog goes', 'Tape the patch on'])}
      </header>
      <div class="mg-body">
      <div class="mg-meter" role="img" aria-label="Air in the room">
        <span class="mg-meter-label">Air in the room</span>
        <span class="mg-track"><span class="mg-fill"></span></span>
        <b class="mg-pct"></b>
      </div>
      <div class="lk-wall" role="group" aria-label="Wall of the room, ${n} panels">
        ${Array.from({ length: n }, (_, i) => `<button type="button" class="lk-cell" data-i="${i}" aria-label="Wall panel ${i + 1}"></button>`).join('')}
        <div class="lk-fog" aria-hidden="true">${'<i></i>'.repeat(FOG)}</div>
      </div>
      <button type="button" class="mg-btn lk-puff">Puff some fog</button>
      <div class="lk-patch" hidden>
        <div class="lk-hole" aria-hidden="true"></div>
        ${['Top left', 'Top right', 'Bottom left', 'Bottom right'].map((name, i) => `<button type="button" class="lk-corner" data-c="${i}" aria-label="${name} corner of the patch"></button>`).join('')}
      </div>
      </div>
      <div class="mg-win" hidden>
        <p class="mg-gain">Leak sealed!</p>
        <p class="mg-fact">${LEAK_FACT}</p>
        <button type="button" class="mg-btn lk-done">Back to the base</button>
      </div>
    </div>`;

  const game = root.querySelector('.lk');
  const wall = root.querySelector('.lk-wall');
  const cells = [...root.querySelectorAll('.lk-cell')];
  const fog = [...root.querySelectorAll('.lk-fog i')];
  const pct = root.querySelector('.mg-pct');
  const puffBtn = root.querySelector('.lk-puff');
  const guide = createGuide(game);
  const say = (doThis, why) => guide.say(doThis, why);
  const setAir = (v) => { air = v; game.style.setProperty('--level', v); pct.textContent = `${Math.round(v)}%`; };
  setAir(air);

  // Step 1
  guide.step(0);
  say('Tap “Puff some fog”.', `Air is hissing out of ${room}, but the hole is too small to see. Air flows to the hole, and fog flies with it.`);
  guide.point(puffBtn);

  // The air sinks slowly while the leak is open. It is only for show: it stops at 60, nobody can lose here.
  timer = setInterval(() => {
    if (!root.isConnected) { clearInterval(timer); return; }
    if (!found && air > 60) setAir(air - 1);
  }, 900);

  const holePos = () => ({ x: ((hole % COLS) + 0.5) / COLS * 100, y: (Math.floor(hole / COLS) + 0.5) / ROWS * 100 });
  const scatter = () => fog.forEach((f) => {
    f.style.left = `${8 + Math.random() * 84}%`;
    f.style.top = `${10 + Math.random() * 80}%`;
    f.style.opacity = '0';
  });
  scatter();

  const puff = () => {
    if (found) return;
    fogged = true;
    wall.classList.add('fogged');
    scatter();
    // First the fog appears all over the room, then the air stream pulls it to the hole.
    requestAnimationFrame(() => fog.forEach((f) => { f.style.opacity = '0.85'; }));
    const p = holePos();
    setTimeout(() => fog.forEach((f) => {
      f.style.left = `${p.x + (Math.random() - 0.5) * 16}%`;
      f.style.top = `${p.y + (Math.random() - 0.5) * 20}%`;
    }), reducedMotion ? 0 : 500);
    guide.step(1);
    guide.point(null);
    say('Watch the fog…', 'The air stream pulls it to the hole.');
    setTimeout(() => { if (!found) say('Tap the wall panel where the fog gathers.', 'That is where the air gets out.'); }, reducedMotion ? 0 : 1800);
    puffBtn.textContent = 'Puff more fog';
  };

  const tapCell = (cell) => {
    if (found || !cell) return;
    const i = Number(cell.dataset.i);
    if (i !== hole) {
      misses++;
      cell.classList.remove('miss');
      void cell.offsetWidth; // restart the shake
      cell.classList.add('miss');
      if (fogged) say('Not this panel. Tap where the fog gathers.', 'Need a better look? Puff more fog.');
      else { say('No hole here. Tap “Puff some fog” first.', misses > 1 ? 'Guessing takes long. The fog shows the way!' : 'The fog shows where the air goes.'); guide.point(puffBtn); }
      return;
    }
    found = true;
    if (navigator.vibrate) try { navigator.vibrate(18); } catch { /* not allowed */ }
    cell.classList.add('hit');
    puffBtn.hidden = true;
    wall.hidden = true;
    root.querySelector('.lk-patch').hidden = false;
    guide.step(2);
    say('Found it! Now tap all 4 corners of the patch.', 'The air rushes out into space through this hole. Tape seals it.');
    guide.point(root.querySelector('.lk-corner:not(.on)'));
  };

  let taped = 0;
  const tapCorner = (b) => {
    if (!b || b.classList.contains('on')) return;
    b.classList.add('on');
    taped++;
    setAir(air + (100 - air) * (taped / 4)); // each taped corner lets less air out
    if (navigator.vibrate) try { navigator.vibrate(10); } catch { /* not allowed */ }
    if (taped < 4) {
      say(`Tap the next corner (${4 - taped} to go).`, 'A loose corner still lets air out.');
      guide.point(root.querySelector('.lk-corner:not(.on)'));
      return;
    }
    clearInterval(timer);
    setAir(100);
    game.classList.add('won');
    guide.step(3);
    guide.point(null);
    say('Airtight!', 'The room keeps its air again.');
    const box = root.querySelector('.mg-win');
    box.hidden = false;
    const done = box.querySelector('.lk-done');
    done.addEventListener('click', () => onFinish?.());
    setTimeout(() => done.focus({ preventScroll: true }), 60);
  };

  puffBtn.addEventListener('click', puff);
  wall.addEventListener('click', (e) => tapCell(e.target.closest('.lk-cell')));
  root.querySelector('.lk-patch').addEventListener('click', (e) => tapCorner(e.target.closest('.lk-corner')));
}
