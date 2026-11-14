// SI disclosure: written with the SI tool Claude Code and reviewed by the team. See SI_USAGE.md and si-manifest.json.
// Run with: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import {
  createMission, tick, chooseOption, setShield, setShelter, getAdvice, callEarth, callEarthReady,
  repairFor, completeRepair, radiationNow, buyUpgrade,
} from '../src/rules/mission.js';
import { isDaylight } from '../src/rules/sky.js';
import { buildTimeline, flareScore } from '../src/rules/storm.js';

const load = (id) => JSON.parse(readFileSync(new URL(`../data/storms/${id}.json`, import.meta.url)));
const STORMS = readdirSync(new URL('../data/storms/', import.meta.url))
  .filter((f) => f.endsWith('.json') && f !== 'index.json')
  .map((f) => f.replace('.json', ''));

/** Play a whole mission with a simple strategy; returns the final state. */
function play(id, policy, seed = 7) {
  const s = createMission(load(id), { seed });
  let guard = 0;
  while (!s.ended && guard++ < 100000) {
    s.outbox.length = 0;
    if (s.pendingCard) {
      chooseOption(s, policy.card(s, s.pendingCard));
      continue;
    }
    policy.each?.(s);
    tick(s, 0.05);
  }
  return s;
}

const passive = { card: (s, c) => c.options[c.options.length - 1].id };
const sensible = {
  card: (s, c) => c.options[0].id,
  each: (s) => {
    for (const id of ['lab', 'greenhouse', 'hab', 'solar']) {
      const r = repairFor(s, id);
      if (r && r.kind !== 'rebuild') completeRepair(s, id, r.kind);
    }
    const rad = radiationNow(s);
    if (rad < 5 && !s.forcedShelter) {
      setShelter(s, false);
      setShield(s, rad > 2 || s.power > 60 ? 1 : 0);
    }
  },
};

test('lunar day/night follows real dates at the Sea of Tranquility', () => {
  const lon = 23.47;
  assert.equal(isDaylight(Date.UTC(2024, 4, 5, 12), lon), false); // before sunrise (new Moon 8 May)
  assert.equal(isDaylight(Date.UTC(2024, 4, 20, 12), lon), true);
  assert.equal(isDaylight(Date.UTC(2024, 4, 30, 12), lon), false);
});

test('flare classes sort by strength', () => {
  assert.ok(flareScore('X1.0') > flareScore('M9.9'));
  assert.ok(flareScore('X8.7') > flareScore('X5.8'));
});

test('timeline maps real radiation onto mission days', () => {
  const tl = buildTimeline(load('may2024'), 30);
  assert.equal(tl.days[13].iso, '2024-05-14');
  assert.ok(tl.days[13].radiation.moonOrbit.times > 200);
  assert.ok(tl.seps.length > 0 && tl.seps.length < 13, 'particle onsets are merged');
});

for (const id of STORMS) {
  test(`${id}: a passive player finishes without crashing and gets setbacks, not a game over`, () => {
    const s = play(id, passive);
    assert.equal(s.ended, true);
    assert.ok(s.air > 0 && s.air <= 100);
    assert.ok(s.power >= 0);
  });

  test(`${id}: a sensible player keeps the crew under the dose limit`, () => {
    const s = play(id, sensible);
    assert.equal(s.ended, true);
    assert.ok(s.dose < s.cfg.dose.limit, `dose ${s.dose.toFixed(1)}`);
    assert.ok(s.science > 40, `science ${s.science.toFixed(1)}`);
  });
}

test('may2024: ignoring the storm costs real dose', () => {
  const s = play('may2024', passive);
  assert.ok(s.dose > s.cfg.dose.limit * 0.8, `dose ${s.dose.toFixed(1)}`);
});

test('Mission Control always explains why, with numbers when it matters', () => {
  const s = createMission(load('may2024'), { seed: 3 });
  while (s.t < 13.5) {
    if (s.pendingCard) chooseOption(s, s.pendingCard.options.at(-1).id);
    tick(s, 0.1);
  }
  const a = getAdvice(s);
  assert.ok(a.text.length > 0 && a.reason.length > 0);
  assert.match(a.reason, /\d/);
  assert.ok(callEarthReady(s));
  assert.ok(callEarth(s));
  assert.equal(callEarthReady(s), false, 'cooldown after a call');
});

test('upgrades cost science', () => {
  const s = createMission(load('oct2021'), { seed: 1 });
  assert.equal(buyUpgrade(s, 'battery'), false);
  s.science = 50;
  assert.equal(buyUpgrade(s, 'battery'), true);
  assert.equal(s.capacity, 140);
  assert.equal(Math.round(s.science), 10);
});

test('guided first steps: a scripted leak comes first, random problems wait', () => {
  const s = createMission(load('oct2021'), { seed: 4, script: [{ t: 0.7, kind: 'leak', roomId: 'hab' }] });
  const problems = [];
  while (s.t < 3) {
    tick(s, 0.05);
    for (const e of s.outbox) if (e.type === 'room' && e.status !== 'ok') problems.push([e.roomId, +e.t.toFixed(2)]);
    s.outbox.length = 0;
    if (s.rooms.hab.status === 'leak' && s.t > 1) completeRepair(s, 'hab', 'leak');
  }
  assert.deepEqual(problems[0][0], 'hab');
  assert.ok(problems[0][1] >= 0.7 && problems[0][1] < 0.8);
  assert.ok(problems.slice(1).every(([, t]) => t >= 0.7 + s.cfg.events.randomGapDays[0]), JSON.stringify(problems));
});
