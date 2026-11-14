// SI disclosure: written with the SI tool Claude Code and reviewed by the team. See SI_USAGE.md and si-manifest.json.
// "How it works": one sheet that explains every part of the game, what is real and what is made up.
// Opened from the start screen and the pause menu. Plain DOM, no game rules.

import { icon } from './icons.js';
import { openSheet } from './overlays.js';

const row = (ic, cls, title, text) => `<li class="hw-row ${cls}">${icon(ic)}<div><b>${title}</b><p>${text}</p></div></li>`;

export function showHelp(cfg, { onClose } = {}) {
  const block = (x) => `${Math.round(x * 100)}%`;
  const html = `
    <h2>How it works</h2>
    <p class="hw-lead">You run a base on the Moon for 30 days. A real solar storm from the past hits it. Keep your crew safe and keep the science going.</p>

    <h3>Your base</h3>
    <ul class="hw-list">
      ${row('bolt', 'power', 'Power', 'Solar panels charge the battery in daylight. A night on the Moon lasts about 2 weeks, so save power before dark.')}
      ${row('air', 'air', 'Air', 'Leaks and a clogged filter let air drop. Tap a room with a red ! to fix it.')}
      ${row('radiation', 'dose', 'Crew dose', `All the radiation your crew has taken. Keep it below ${cfg.dose.limit}.`)}
      ${row('science', 'science', 'Science', 'The lab earns points while the crew works. Spend them on upgrades like walls of Moon soil.')}
    </ul>

    <h3>Your choices (each one costs something)</h3>
    <ul class="hw-list">
      ${row('shield', 'power', 'Shield', `Blocks part of the radiation (Low ${block(cfg.dose.shieldBlock[1])}, Mid ${block(cfg.dose.shieldBlock[2])}, Max ${block(cfg.dose.shieldBlock[3])}), but uses power every day. It is a magnet shield: scientists are testing this idea, but no base has one yet.`)}
      ${row('shelter', 'dose', 'Shelter', `A small room with thick walls. It blocks ${block(cfg.dose.shelterBlock)} of the radiation, but the crew can’t do science in there.`)}
      ${row('dish', 'air', 'Call Earth', `Mission Control looks at the real space weather and at your base. They tell you the most important thing to do now and why. The radio signal needs ${cfg.callEarth.roundTripSeconds} seconds there and back. Then they need ${cfg.callEarth.cooldownDays} days before the next call.`)}
      ${row('fast', 'power', 'Time', `One day of the mission passes in ${cfg.secondsPerDay.normal} seconds. Fast-forward on calm days. The game slows down by itself when something happens.`)}
    </ul>

    <h3>What is real?</h3>
    <ul class="hw-list">
      ${row('check', 'science', 'Real', 'The storms really happened. Flares, particle storms and radiation levels come from NASA measurements (DONKI and RadLab archives, not live). Day and night follow the real dates. The radio delay is real too.')}
      ${row('star', 'power', 'Made up for the game', 'The magnet shield, the exact costs, science points, stars and how fast time runs.')}
      ${row('shelter', 'dose', 'What real bases plan', 'Thick walls of Moon soil or water, a storm shelter, and a space weather team on Earth that warns the crew.')}
    </ul>

    <details class="hw-grown">
      <summary>For grown-ups</summary>
      <p>Made for the NASA Space Apps Challenge 2026 (“Build a Junior Astronaut Mission Trainer”) by team Alpha Centauri First. Kids aged 7–12 learn that every choice on a Moon base is a trade-off: power against protection, safety against science. The space weather is real NASA data from six historical storms (2017–2025). The game is open source (MIT), needs no login and stores nothing but progress on this device. Not made or endorsed by NASA.</p>
    </details>
    <div class="row"><button type="button" class="btn primary hw-ok">${icon('check')}Got it</button></div>`;
  const sheet = openSheet(html, { className: 'help-sheet', onClose });
  sheet.el.querySelector('.hw-ok').addEventListener('click', () => sheet.close());
  return sheet;
}
