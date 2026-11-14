// SI disclosure: written with the SI tool Claude Code and reviewed by the team. See SI_USAGE.md and si-manifest.json.
// The intro ("training"): the kid builds the base piece by piece, then meets each event once.
// Teaching rules (RESEARCH.md, section 0): one new idea at a time, say the problem and the fix
// before the kid acts, show the cost as a number, and let the clock wait the whole time.
// It has the same interface as the in-mission guide (guide.js), so the controller treats it the same.

import { setShield, setShelter, powerInPerDay } from '../rules/mission.js';
import { crewAvatar, soundButton } from './icons.js';
import { UPGRADES } from '../rules/content.js';

const CSS_URL = new URL('./intro.css', import.meta.url).href;
if (typeof document !== 'undefined' && !document.querySelector(`link[href="${CSS_URL}"]`)) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = CSS_URL;
  document.head.appendChild(link);
}

const DRILL_RADIATION = 12; // times normal, for the practice alarm only
const num = (x) => String(Math.round(x * 10) / 10);
const sign = (x) => `${x >= 0 ? '+' : '−'}${num(Math.abs(x))}`;

/** The buildings in the order they are placed. `show` lists the HUD parts that appear with them. */
function buildings(cfg, solarNow) {
  const p = cfg.power;
  return [
    {
      id: 'solar', name: 'Solar panels', delta: solarNow, show: ['power'],
      what: 'Solar panels turn sunlight into power. Everything in the base runs on power.',
      after: `They make ${num(solarNow)} power a day while the Sun shines. At night they make none.`,
    },
    {
      id: 'hab', name: 'Home', delta: -p.lifeSupportPerDay, show: ['air'],
      what: 'The crew lives here. A machine makes oxygen from water, and a filter cleans the air.',
      after: `That uses ${num(p.lifeSupportPerDay)} power a day. No power means no fresh air.`,
    },
    {
      id: 'greenhouse', name: 'Greenhouse', delta: -p.growLightsPerDay, show: [],
      what: 'Plants grow fresh food here. They also make a little oxygen.',
      after: `Their lamps use ${num(p.growLightsPerDay)} power a day.`,
    },
    {
      id: 'lab', name: 'Lab', delta: -p.sciencePerDay, show: ['science'],
      what: 'Here the crew studies Moon rocks and plants. That earns science points.',
      after: `Lab work uses ${num(p.sciencePerDay)} power a day. Science points are your score.`,
    },
    {
      id: 'shelter', name: 'Shelter', delta: 0, show: ['dose'],
      what: 'A room with very thick walls. Radiation from the Sun can’t get through.',
      after: 'In a storm, the crew hides here. But then nobody can do science.',
    },
  ];
}

export function createIntro({ hud, startAt = '1', speak, relayout, syncSound, onDone }) {
  const root = hud.el;
  let state = null;
  let steps = [];
  let idx = -1;
  let built = {};
  let buildNext = null;
  let ledger = 0; // power per day so far, as the buildings add up
  let spotSel = null;
  let spotEl = null;
  let stopped = false;
  let lastUpgrade = null;
  let call = null; // set while the kid's first call to Earth is open

  root.classList.add('intro');
  const card = document.createElement('section');
  card.className = 'coach';
  card.setAttribute('aria-live', 'polite');
  hud.stage.appendChild(card);

  // ------------------------------------------------------------------ helpers

  const show = (...parts) => { for (const part of parts) root.classList.add(`show-${part}`); };
  // Start one problem by hand. The clock never runs here, so nothing gets worse while the kid reads.
  const trigger = (kind, roomId) => {
    if (kind === 'dust') state.dust = true;
    else if (kind === 'filter') state.filter = true;
    else { state.rooms[roomId].status = 'leak'; state.rooms[roomId].since = state.t; }
  };

  function spotlight(sel) {
    spotSel = sel;
    applySpot();
  }
  function applySpot() {
    const el = spotSel ? root.querySelector(spotSel) : null;
    if (el === spotEl) return;
    spotEl?.classList.remove('spot-on');
    spotEl = el;
    el?.classList.add('spot-on');
  }

  /**
   * Draw the coach card.
   * praise: one line about what the kid just did. problem/fix: the two labelled lines.
   * text: plain lines. tap: a highlighted hint that stays on the card. button: { label, go }.
   * todo: what the kid has to do in the game itself. A card with a todo has two phases: first the
   *   explanation with an OK button, then it shrinks to that one line, so the base has room
   *   (on a phone the base was tiny while the whole text was up).
   */
  let spec = null;
  let mini = false;
  function render(next) {
    spec = { kind: 'info', text: [], ...next };
    mini = false;
    draw();
    const { praise, title, problem, fix, text, tap, todo } = spec;
    speak?.([praise, title, problem, fix, ...text, tap, todo].filter(Boolean).join(' ').replace(/<[^>]+>/g, ''));
  }

  function draw() {
    const { kind, praise, title, note, text, problem, fix, tap, button, todo } = spec;
    card.dataset.kind = kind;
    card.dataset.mode = mini ? 'mini' : 'full';
    if (mini) {
      card.innerHTML = `
        <div class="coach-body">
          <p class="coach-todo">${todo}</p>
          ${soundButton(true)}
          <button type="button" class="coach-more" aria-label="Show the explanation again">?</button>
        </div>`;
      card.querySelector('.coach-more').addEventListener('click', () => { mini = false; draw(); });
    } else {
      const lines = [
        praise ? `<p class="coach-praise">${praise}</p>` : '',
        `<h2>${title}</h2>`,
        note ? `<p class="coach-note">${note}</p>` : '',
        problem ? `<p class="coach-row"><b>Problem</b><span>${problem}</span></p>` : '',
        fix ? `<p class="coach-row fix"><b>Fix</b><span>${fix}</span></p>` : '',
        ...text.map((line) => `<p>${line}</p>`),
        tap ? `<p class="coach-tap">${tap}</p>` : '',
      ].join('');
      const act = todo ? { label: 'OK, let me do it', go: () => { mini = true; draw(); } } : button;
      card.innerHTML = `
        <div class="coach-av" aria-hidden="true">${crewAvatar(kind === 'problem' ? 'alert' : 'happy')}</div>
        <div class="coach-body">
          <div class="coach-top">
            <span class="coach-progress" role="img" aria-label="Training step ${idx + 1} of ${steps.length}"><i style="width:${Math.round(((idx + 1) / steps.length) * 100)}%"></i></span>
            <button type="button" class="coach-skip">Skip training</button>
            ${soundButton(true)}
          </div>
          ${lines}
          ${act ? `<button type="button" class="coach-btn">${act.label}</button>` : ''}
        </div>`;
      card.querySelector('.coach-skip').addEventListener('click', () => onDone({ skipped: true }));
      if (act) card.querySelector('.coach-btn').addEventListener('click', () => act.go());
    }
    syncSound?.(); // on phones the sound button lives on the card (the top bar would cost a whole row)
    card.classList.remove('pop');
    void card.offsetWidth; // restart the entrance
    card.classList.add('pop');
    requestAnimationFrame(() => relayout?.()); // the base takes the room the card leaves
  }

  const next = () => go(idx + 1);
  function go(i) {
    if (stopped) return;
    idx = i;
    spotlight(null);
    buildNext = null;
    steps[idx].enter();
  }

  // ------------------------------------------------------------------ the steps

  /** What science points are for: the kid gets a few and builds one upgrade. */
  function addScienceLesson(add) {
    const cheapest = Math.min(...Object.values(state.cfg.upgrades).map((u) => u.cost));
    add('science', {
      doneOn: 'upgrade',
      enter: () => {
        state.science += cheapest;
        spotlight('.meter.science');
        render({
          title: 'Science points buy upgrades',
          text: [
            'The lab earns science points while the crew works.',
            `You spend them on better gear for the base. Here are ${cheapest} points to try it.`,
          ],
          todo: 'Tap Science, then build one upgrade.',
        });
      },
    });
    add('science-done', {
      enter: () => {
        spotlight('.meter.science');
        render({
          praise: `Built: ${UPGRADES[lastUpgrade]?.name ?? 'your first upgrade'}!`, title: 'An upgrade lasts the whole mission',
          text: ['In a mission, you earn points while the crew works in the lab.'],
          button: { label: 'Next', go: next },
        });
      },
    });
  }

  function makeSteps() {
    const cfg = state.cfg;
    const list = [];
    const add = (id, step) => list.push({ id, ...step });

    add('welcome', {
      enter: () => render({
        title: 'Welcome to the Moon, Commander!',
        text: ['I’m Sam. First we build our base, piece by piece.', 'Then we practise everything that can go wrong.'],
        button: { label: 'Let’s build', go: next },
      }),
    });

    for (const b of buildings(cfg, powerInPerDay(state))) {
      const place = () => {
        if (built[b.id]) return;
        built = { ...built, [b.id]: true };
        buildNext = null;
        ledger += b.delta;
        show(...b.show);
        spotlight(b.show[0] ? `.meter.${b.show[0]}` : null);
        render({
          kind: 'build', praise: `${b.name}: built!`, title: b.after,
          text: b.delta ? [`Power for the base now: <b class="coach-num">${sign(ledger)} a day</b>`] : [],
          button: { label: 'Next', go: next },
        });
      };
      add(`build-${b.id}`, {
        room: b.id, place,
        enter: () => {
          buildNext = b.id;
          // The kid has to place it on the Moon: no shortcut button on the card.
          // Only when the scene could not load (no canvas) does the card offer a button, so nobody gets stuck.
          const noScene = document.body.classList.contains('no-phaser');
          render({
            kind: 'build', title: `Build: ${b.name}`, text: [b.what],
            tap: noScene ? '' : 'Tap the glowing <b>+</b> on the Moon to build it.',
            button: noScene ? { label: `Build the ${b.name.toLowerCase()}`, go: place } : null,
          });
        },
      });
      if (b.id === 'lab') addScienceLesson(add);
    }

    add('dust', {
      doneOn: 'repairDone',
      enter: () => {
        show('rates', 'tasks');
        trigger('dust');
        spotlight('.task[data-room="solar"]');
        render({
          kind: 'problem', praise: 'The base is ready. Now we practise!', title: 'Dusty solar panels',
          problem: 'Moon dust covers the panels. Less sunlight gets in, so they make less power.',
          fix: 'Go outside and brush the dust off.',
          todo: 'Tap the red button, or the dusty panels.',
        });
      },
    });

    add('leak', {
      doneOn: 'repairDone',
      enter: () => {
        trigger('leak', 'hab');
        spotlight('.task[data-room="hab"]');
        render({
          kind: 'problem', praise: 'Clean panels, full power!', title: 'A leak in Home',
          problem: 'A tiny space rock made a hole. The air we breathe is leaking out.',
          fix: 'Patch the hole.',
          todo: 'Tap the red button, or Home.',
        });
      },
    });

    add('sealed', {
      doneOn: 'repairDone',
      enter: () => {
        state.rooms.lab.status = 'lost'; // what happens to a leak that nobody fixes
        spotlight('.task[data-room="lab"]');
        render({
          kind: 'problem', praise: 'Leak patched. The air is safe.', title: 'A leak that waits too long',
          problem: 'If nobody fixes a leak in time, the crew closes that room to save the air. Look: the lab is sealed. A sealed lab does almost no science.',
          fix: 'Close the hole, pump air back in, and open the lab again.',
          todo: 'Tap “Reopen”, or the sealed lab.',
        });
      },
    });

    add('filter', {
      doneOn: 'repairDone',
      enter: () => {
        trigger('filter');
        spotlight('.task[data-room="hab"]');
        render({
          kind: 'problem', praise: 'The lab is open again!', title: 'A full air filter',
          problem: 'You breathe out a gas called CO₂. The filter catches it, and now it is full.',
          fix: 'Swap in a fresh filter.',
          todo: 'Tap the red button, or Home.',
        });
      },
    });

    add('storm-shield', {
      doneOn: 'shieldUp',
      enter: () => {
        state.drillRadiation = DRILL_RADIATION;
        show('status', 'shield');
        spotlight('.seg');
        render({
          kind: 'problem', praise: 'Fresh filter, clean air!', title: 'Practice alarm: solar storm',
          note: 'This is a drill, not real data.',
          problem: 'Particles from the Sun raise the radiation. Too much harms the crew.',
          fix: 'Switch on the shield.',
          todo: 'Tap Low, Mid or Max at the bottom.',
        });
      },
    });

    add('storm-cost', {
      enter: () => {
        const cost = cfg.power.shieldPerDay[state.shield];
        spotlight('.meter.power');
        render({
          title: `The shield uses ${num(cost)} power a day`,
          text: [
            'It blocks radiation, but it eats power. A stronger shield eats more.',
            'A magnet shield is test tech: scientists are working on it, but no base has one yet.',
          ],
          button: { label: 'Next', go: next },
        });
      },
    });

    add('fort', {
      doneOn: 'repairDone',
      enter: () => {
        state.fort = false; // the rules now offer the fort at the shelter
        spotlight('.task[data-room="shelter"]');
        render({
          kind: 'problem', title: 'What really protects astronauts',
          problem: 'In a very strong storm, the shield alone is not enough.',
          fix: 'Thick, heavy walls stop radiation. Build a storm wall at the shelter.',
          todo: 'Tap the red button, or the shelter.',
        });
      },
    });

    add('storm-shelter', {
      doneOn: 'shelterIn',
      enter: () => {
        show('shelter');
        spotlight('.shelterbtn');
        render({
          praise: 'The storm wall is built!', title: 'Now send the crew inside',
          text: ['Behind the thick wall, almost no radiation reaches them.'],
          todo: 'Tap Shelter at the bottom.',
        });
      },
    });

    add('storm-back', {
      doneOn: 'shelterOut',
      enter: () => {
        spotlight('.shelterbtn');
        render({
          praise: 'Everyone is safe inside!', title: 'But look at Science: paused',
          text: ['Nobody can work in the shelter. That is the trade: safe, or science.'],
          todo: 'Tap Shelter again to go back to work.',
        });
      },
    });

    add('night', {
      enter: () => {
        state.drillRadiation = null;
        setShield(state, 0);
        state.daylight = false;
        spotlight('.meter.power');
        render({
          praise: 'Drill over. Well done!', title: 'Night on the Moon lasts 14 days',
          text: ['No sunlight, so the panels make 0 power. The base lives on its battery.', 'At night, save power: use the shield only when you need it.'],
          button: { label: 'Got it', go: () => { state.daylight = true; next(); } },
        });
      },
    });

    add('call', {
      doneOn: 'call', // the step ends when the call sheet is closed again (see update)
      enter: () => {
        show('call');
        spotlight('.callbtn');
        render({
          title: 'Stuck? Call Earth',
          text: ['Mission Control tells you the most important thing to do, and why.', 'Try it once now.'],
          todo: 'Tap Call Earth at the bottom.',
        });
      },
    });

    add('done', {
      enter: () => render({
        kind: 'done', praise: 'You called Earth. They always tell you why.', title: 'Training complete!',
        text: ['You built the base and fixed every problem once.', 'Now a real solar storm is waiting, measured by NASA spacecraft.'],
        button: { label: 'Choose a mission', go: () => onDone({ skipped: false }) },
      }),
    });
    return list;
  }

  /** Jump straight to one lesson (for testing): everything before it counts as done. */
  function jumpTo(name) {
    const alias = { storm: 'storm-shield', drill: 'storm-shield', shelter: 'storm-shelter', build: 'build-solar', reopen: 'sealed' };
    if (name === 'fort') show('rates', 'tasks');
    const target = steps.findIndex((s) => s.id === (alias[name] ?? name));
    if (target <= 0) return 0;
    for (const b of buildings(state.cfg, powerInPerDay(state))) {
      if (steps.findIndex((s) => s.id === `build-${b.id}`) >= target) break;
      built[b.id] = true;
      ledger += b.delta;
      show(...b.show);
    }
    const after = (id) => steps.findIndex((s) => s.id === id) < target;
    if (after('dust')) show('rates', 'tasks');
    if (after('storm-shield')) { show('status', 'shield'); state.drillRadiation = DRILL_RADIATION; setShield(state, 1); }
    if (after('storm-shelter')) { show('shelter'); if (steps[target].id === 'storm-back') setShelter(state, true); }
    if (after('night')) { state.drillRadiation = null; setShield(state, 0); }
    return target;
  }

  // ------------------------------------------------------------------ the guide interface

  return {
    quiet: true,           // the controller keeps the usual crew lines off
    get hold() { return !stopped; }, // the clock waits during the whole intro
    get busy() { return !stopped; },
    flags: {},
    script: () => [],
    setEnabled() {},
    onEvent(e) {
      if (e.type !== 'upgrade') return;
      lastUpgrade = e.key;
      if (steps[idx]?.doneOn === 'upgrade') next();
    },

    /** Called once the mission state exists. */
    begin(missionState) {
      state = missionState;
      state.outbox.length = 0;
      state.fort = true; // not offered until its own lesson
      steps = makeSteps();
      go(jumpTo(startAt));
    },

    /** A tap on a building or a free spot in the scene. True means the intro used it. */
    onRoomTap(id) {
      const step = steps[idx];
      if (!step) return false;
      if (step.room) {
        if (step.room === id) step.place();
        return true; // while building, taps never open repairs or info sheets
      }
      return step.doneOn !== 'repairDone'; // only repair lessons pass taps on to the game
    },

    onAction(name) {
      if (steps[idx]?.doneOn !== name) return;
      // A call opens a sheet with the answer. The lesson is over when the kid has read it and closed it.
      if (name === 'call') call = { seen: false, frames: 0 };
      else next();
    },

    update() {
      applySpot(); // repair buttons are re-rendered, so the glow is re-applied
      if (!call) return;
      const open = Boolean(document.querySelector('.call-sheet'));
      if (open) call.seen = true;
      else if (call.seen || ++call.frames > 60) { call = null; next(); }
    },

    /** Room the coach card needs inside the stage: on top on phones, at the bottom on wide screens. */
    stagePad() {
      const wide = window.matchMedia('(min-width: 900px) and (min-aspect-ratio: 5/4)').matches;
      // A card with a todo shrinks to one line, so it only keeps room for that line (it may cover
      // the base while the explanation is up). Other cards keep the base clear of the whole card.
      const full = Math.ceil(card.querySelector('.coach-body')?.getBoundingClientRect().height ?? 260);
      let h = spec?.todo ? (mini ? full : 64) : full;
      // On a small phone a big card would squeeze the base into a strip. Then the card lies over the
      // base while the kid reads it, and the base keeps its size and its places.
      const stageH = hud.stage.getBoundingClientRect().height;
      if (h > stageH * 0.45) h = 64;
      return wide ? { top: 0, bottom: h + 24 } : { top: h + 8, bottom: 0 };
    },

    /** Extra fields for the scene: which buildings exist, and where the next one goes. */
    view() {
      return { built, buildNext };
    },

    stop() {
      stopped = true;
      spotEl?.classList.remove('spot-on');
      card.remove();
      root.classList.remove('intro');
    },
  };
}
