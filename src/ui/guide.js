// SI disclosure: written with the SI tool Claude Code and reviewed by the team. See SI_USAGE.md and si-manifest.json.
// Guided first steps (scaffolding and fading, see Guide_Gamedesign_Attention.md 3.2 and 3.3).
// One new thing at a time: the crewmate says one short line and the matching control glows.
// Each hint shows once. A kid who already did the thing never gets the hint ("don't teach what
// they already know"). Hints can be switched back on in the pause menu (help on demand).
// No game rules in here: the guide only reads state, highlights and asks the clock to wait.

import { callEarthReady, radiationNow } from '../rules/mission.js';
import { ROOM_IDS } from '../rules/config.js';

/** The first problem in a guided mission: a leak in the living quarters (it can never be lost). */
export const GUIDED_LEAK = { t: 0.75, kind: 'leak', roomId: 'hab' };

const calm = (s) => radiationNow(s) < 3 && !s.pendingCard && !s.powerEmergency
  && !s.dust && !s.filter && ROOM_IDS.every((id) => s.rooms[id].status !== 'leak');

/**
 * Steps in the order a new player meets them. `ready` decides when a step may start,
 * `doneOn` is the player action that completes it, `maxDays` lets it fade on its own.
 */
const STEPS = [
  {
    id: 'bars', target: '.meters', maxDays: 0.5,
    ready: (s) => s.t >= 0.2,
    say: 'These bars show your base: power, air and the crew’s radiation dose.',
  },
  {
    id: 'leak', target: '.task[data-room="hab"]', doneOn: 'repairDone', hold: true,
    ready: (s) => s.rooms.hab.status === 'leak',
    say: 'Don’t worry, the clock waits for you. Tap the red button to patch the leak!',
    after: 'You fixed your first leak! Tiny space rocks hit the Moon all the time, so real bases need repairs too.',
  },
  {
    id: 'shield', target: '.seg', doneOn: 'shieldUp', maxDays: 2,
    ready: (s, g) => g.sinceLast(s) > 0.25 && calm(s),
    say: 'Now try the shield. Tap Low and watch what happens to the power bar.',
    after: 'See? The shield blocks radiation, but it uses power. Turn it up when the Sun gets stormy.',
  },
  {
    id: 'fast', target: '.speed [data-speed="fast"]', doneOn: 'fast', maxDays: 1.2,
    ready: (s, g) => g.sinceLast(s) > 0.3 && calm(s),
    say: 'Calm days can go quickly. Tap fast-forward to speed up time.',
  },
  {
    id: 'call', target: '.callbtn', doneOn: 'call', maxDays: 2,
    ready: (s, g) => g.flags.needHelp && callEarthReady(s) && !s.pendingCard,
    say: 'Not sure what to do? Call Earth. Mission Control always tells you why.',
  },
  {
    id: 'data', target: '.radchip', doneOn: 'data', maxDays: 1.5,
    ready: (s) => radiationNow(s) >= 10 && !s.pendingCard,
    say: 'This number comes from real NASA measurements. Tap it to see them!',
  },
];

/** Player actions that show a step is already learned, even without the hint. */
const LEARNED_BY = { repairDone: 'leak', shieldUp: 'shield', fast: 'fast', call: 'call', data: 'data' };

export function createGuide({ root, enabled, seen, markSeen, say, unsay }) {
  let on = enabled;
  const done = new Set(Object.keys(seen || {}));
  let active = null;
  let activeSince = 0;
  let shown = false; // the hint line is on screen, so the glow can start
  let lastEndT = 0;
  let curT = 0;
  let spotEl = null;
  // The leak lesson needs the scripted leak, which only exists if planned at mission start.
  const leakPlanned = on && !done.has('leak');
  if (!leakPlanned) done.add('leak');

  const g = {
    flags: { needHelp: false },
    sinceLast: (s) => s.t - lastEndT,

    /** Scripted problems for createMission: only while the leak lesson is still to come. */
    script() {
      return leakPlanned ? [GUIDED_LEAK] : [];
    },

    get hold() {
      return Boolean(on && active?.hold);
    },

    onEvent(e) {
      if (e.type === 'warn' || e.type === 'setback' || e.type === 'card') g.flags.needHelp = true;
    },

    onAction(name) {
      const id = LEARNED_BY[name];
      if (!id) return;
      if (active?.id === id) finish(true);
      else if (!done.has(id)) { done.add(id); markSeen(id); }
    },

    update(state) {
      curT = state.t;
      if (!on) return;
      // A lesson that holds the clock (the first leak) cuts in front of a running hint.
      const urgent = STEPS.find((st) => st.hold && !done.has(st.id) && st.ready(state, g));
      if (active && urgent && active !== urgent) finish(false);
      if (active) {
        if (!shown) return;
        if (active.maxDays && state.t - activeSince > active.maxDays) finish(false);
        else spotlight(active.target); // the target can be re-rendered (task chips), so re-apply
        return;
      }
      const next = STEPS.find((st) => !done.has(st.id) && prevDone(st) && st.ready(state, g));
      if (!next) return;
      active = next;
      shown = false;
      // While the clock waits, the thing to tap glows at once (the crew already says what happened).
      if (next.hold) { shown = true; activeSince = curT; spotlight(next.target); }
      // The glow starts together with the sentence that explains it.
      say(next.say, 'happy', {
        tag: 'guide',
        onShow: () => {
          if (active !== next || next.hold) return;
          shown = true;
          activeSince = curT;
          spotlight(next.target);
        },
      });
    },

    setEnabled(value) {
      on = value;
      if (!on) { active = null; clearSpot(); unsay('guide'); return; }
      done.clear();
      if (!leakPlanned) done.add('leak'); // no scripted leak in this mission
    },

    stop() { active = null; clearSpot(); },
  };

  // Keep the first lessons in order; the later ones (call, data) wait for a matching moment.
  function prevDone(step) {
    const order = ['bars', 'leak', 'shield', 'fast'];
    const i = order.indexOf(step.id);
    return i <= 0 || order.slice(0, i).every((id) => done.has(id));
  }

  function finish(success) {
    const step = active;
    active = null;
    lastEndT = curT;
    done.add(step.id);
    markSeen(step.id);
    clearSpot();
    unsay('guide');
    if (success && step.after) say(step.after, 'happy', { tag: 'praise' });
  }

  function spotlight(selector) {
    const el = root.querySelector(selector);
    if (el === spotEl) return;
    clearSpot();
    if (el) { el.classList.add('spot-on'); spotEl = el; }
  }

  function clearSpot() {
    spotEl?.classList.remove('spot-on');
    spotEl = null;
  }

  return g;
}
