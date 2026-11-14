// SI disclosure: written with the SI tool Claude Code and reviewed by the team. See SI_USAGE.md and si-manifest.json.
// Mini-game: swap the air filter, in three guided steps.
// It shows what the filter is for: we breathe out CO₂, the filter catches it, and a full filter has to go.
// The twist is the true Apollo 13 story: the spare filter is square, the hole is round, so the kid
// builds an adapter from a bag, cardboard and tape, as the crew did in 1970.
// Checked on 14 Nov 2026: NASA SP-350, chapter 13.4 ("plastic bags, cardboard, and tape - all materials we had on board").
import { loadCss } from './css.js';
import { stepsHtml, createGuide } from './guide.js';

loadCss('./mg.css', import.meta.url);
loadCss('./filter.css', import.meta.url);

const PARTS = [
  { id: 'bag', name: 'Plastic bag', why: 'The bag goes around the filter, so no air sneaks past it.' },
  { id: 'card', name: 'Cardboard', why: 'The cardboard gives the bag a round shape.' },
  { id: 'tape', name: 'Tape', why: 'The tape holds it all together and makes it airtight.' },
];

/**
 * Renders the mini-game into `root`.
 * onFinish(): the kid tapped the button after the new filter was in.
 */
export function mountFilter(root, { onFinish }) {
  let stage = 'pull'; // pull -> build -> push -> done
  let co2 = 82;
  const used = new Set();

  root.innerHTML = `
    <div class="mg ft" data-stage="pull" style="--level:${co2}; --meter:#ff7b5c">
      <header class="mg-head">
        <h2>Swap the air filter</h2>
        <p class="mg-sam" aria-live="polite"><b>Sam</b><span></span></p>
        ${stepsHtml(['Pull out the old filter', 'Build an adapter', 'Push in the new filter'])}
      </header>
      <div class="mg-body">
        <div class="mg-meter" role="img" aria-label="CO₂ in the air">
          <span class="mg-meter-label">CO₂ in the air (the gas you breathe out)</span>
          <span class="mg-track"><span class="mg-fill"></span></span>
          <b class="mg-pct"></b>
        </div>
        <div class="ft-scene">
          <div class="ft-wall">
            <div class="ft-hole" aria-hidden="true"><span class="ft-fan"></span></div>
            <button type="button" class="ft-old" aria-label="Old, full filter. Tap to pull it out."></button>
            <span class="ft-label">Air machine</span>
          </div>
          <div class="ft-bench">
            <button type="button" class="ft-new" aria-label="New filter" disabled><span class="ft-square"></span></button>
            <span class="ft-label">New filter</span>
          </div>
        </div>
        <div class="ft-parts" role="group" aria-label="Things to build an adapter" hidden>
          ${PARTS.map((p) => `<button type="button" class="ft-part" data-id="${p.id}"><span class="ft-pic" data-id="${p.id}"></span><span>${p.name}</span></button>`).join('')}
        </div>
      </div>
      <div class="mg-win" hidden>
        <p class="mg-gain">Fresh air again!</p>
        <p class="mg-fact">This really happened: on <b>Apollo 13</b> in 1970, the square air filters did not fit the round holes. The crew built an adapter from bags, cardboard and tape, and it saved them.</p>
        <button type="button" class="mg-btn ft-done">Back to the base</button>
      </div>
    </div>`;

  const game = root.querySelector('.ft');
  const pct = root.querySelector('.mg-pct');
  const oldBtn = root.querySelector('.ft-old');
  const newBtn = root.querySelector('.ft-new');
  const parts = root.querySelector('.ft-parts');
  const guide = createGuide(game);
  const buzz = (ms) => { if (navigator.vibrate) try { navigator.vibrate(ms); } catch { /* not allowed */ } };
  const setCo2 = (v) => {
    co2 = v;
    game.style.setProperty('--level', v);
    pct.textContent = v >= 60 ? 'High' : v >= 30 ? 'Medium' : 'Low';
    game.style.setProperty('--meter', v >= 60 ? '#ff7b5c' : v >= 30 ? '#ffc94a' : '#8fe36b');
  };
  const go = (next) => { stage = next; game.dataset.stage = next; };
  const nextPart = () => parts.querySelector('.ft-part:not(:disabled)');
  setCo2(co2);

  // Step 1
  guide.step(0);
  guide.say('Tap the old filter to pull it out.', 'You breathe out a gas called CO₂. The filter catches it, and now it is full.');
  guide.point(oldBtn);

  // The crew keeps breathing while the filter is out. Only for show: it stops at 96, nobody can lose here.
  const timer = setInterval(() => {
    if (!root.isConnected) { clearInterval(timer); return; }
    if (stage !== 'done' && co2 < 96) setCo2(co2 + 1);
  }, 1000);

  oldBtn.addEventListener('click', () => {
    if (stage !== 'pull') return;
    buzz(14);
    oldBtn.classList.add('out');
    oldBtn.disabled = true;
    // Once it has slid away it is gone for good, so it can never sit on top of another button.
    setTimeout(() => oldBtn.remove(), 600);
    go('build');
    parts.hidden = false;
    guide.step(1);
    guide.say('Tap the 3 things to build an adapter.', 'The new filter is square, but the hole is round. It does not fit!');
    guide.point(nextPart());
  });

  parts.addEventListener('click', (e) => {
    const b = e.target.closest('.ft-part');
    if (!b || b.disabled || stage !== 'build') return;
    const part = PARTS.find((p) => p.id === b.dataset.id);
    used.add(part.id);
    b.disabled = true;
    newBtn.classList.add(`has-${part.id}`);
    buzz(10);
    const left = PARTS.length - used.size;
    if (left > 0) {
      guide.say(`Good! Tap the next thing (${left} to go).`, part.why);
      guide.point(nextPart());
      return;
    }
    go('push');
    newBtn.disabled = false;
    newBtn.setAttribute('aria-label', 'New filter with adapter. Tap to push it in.');
    parts.hidden = true;
    guide.step(2);
    guide.say('Tap the new filter to push it in.', 'The adapter is ready: square inside, round outside.');
    guide.point(newBtn);
  });

  newBtn.addEventListener('click', () => {
    if (stage !== 'push') return;
    buzz(18);
    newBtn.classList.add('in');
    newBtn.disabled = true;
    go('done');
    clearInterval(timer);
    guide.step(3);
    guide.point(null);
    guide.say('It fits!', 'The air machine pulls the CO₂ out of the air again. Watch the bar.');
    // The CO₂ sinks step by step, so the kid sees the filter working.
    let v = co2;
    const down = setInterval(() => {
      if (!root.isConnected) { clearInterval(down); return; }
      v = Math.max(8, v - 11);
      setCo2(v);
      if (v > 8) return;
      clearInterval(down);
      const box = root.querySelector('.mg-win');
      box.hidden = false;
      const done = box.querySelector('.ft-done');
      done.addEventListener('click', () => onFinish?.());
      setTimeout(() => done.focus({ preventScroll: true }), 60);
    }, 260);
  });
}
