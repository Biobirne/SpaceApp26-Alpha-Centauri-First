// SI disclosure: written with the SI tool Claude Code and reviewed by the team. See SI_USAGE.md and si-manifest.json.
// Run with: npm test (node --test)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import {
  createMission, tick, chooseOption, setShield, setShelter, getAdvice, callEarth, callEarthReady,
  repairFor, completeRepair, radiationNow, buyUpgrade, randomGapScale, summarize, evaCost, upgradeEffect,
} from '../src/rules/mission.js';
import { isDaylight } from '../src/rules/sky.js';
import { configFor } from '../src/rules/config.js';
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
      // a sensible player waits with a spacewalk until the storm calms
      if (r && r.kind !== 'rebuild' && !(r.eva && r.eva.dose >= 2)) completeRepair(s, id, r.kind);
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

/** Count the random problems (leaks, dust, filters) a whole mission throws at the player. */
function problemsIn(id, policy, seed) {
  let n = 0;
  let maxLevel = 0;
  const s = createMission(load(id), { seed });
  let guard = 0;
  while (!s.ended && guard++ < 100000) {
    maxLevel = Math.max(maxLevel, s.dda.level);
    for (const e of s.outbox) if (e.type === 'room' && ['leak', 'dust', 'filter'].includes(e.status)) n++;
    s.outbox.length = 0;
    if (s.pendingCard) { chooseOption(s, policy.card(s, s.pendingCard)); continue; }
    policy.each?.(s);
    tick(s, 0.05);
  }
  return { n, s, maxLevel };
}

test('difficulty adapts: a struggling player gets fewer random problems, real data stays the same', () => {
  let struggling = 0;
  let sensibleN = 0;
  for (const seed of [1, 2, 3, 4, 5]) {
    const a = problemsIn('may2024', passive, seed);
    const b = problemsIn('may2024', sensible, seed);
    // It may ease off again after calm days, so look at the highest level during the mission.
    assert.ok(a.maxLevel > 0, `seed ${seed}: passive play should raise the level`);
    assert.ok(b.s.dda.level <= 0, `seed ${seed}: good play should not raise it (got ${b.s.dda.level})`);
    struggling += a.n;
    sensibleN += b.n;
    // The storm itself is the same NASA data for everyone.
    assert.deepEqual(a.s.timeline.days.map((d) => d.radiation), b.s.timeline.days.map((d) => d.radiation));
  }
  assert.ok(struggling < sensibleN, `struggling ${struggling} vs sensible ${sensibleN}`);
});

test('difficulty scale: slower when struggling, a bit faster when flawless', () => {
  const s = createMission(load('oct2021'), { seed: 1 });
  assert.equal(randomGapScale(s), 1);
  s.dda.level = 2;
  assert.ok(randomGapScale(s) > 1.5);
  s.dda.level = -1;
  assert.ok(randomGapScale(s) < 1 && randomGapScale(s) >= 0.8);
});

test('badges and praise reward how the kid played', () => {
  const good = play('oct2021', sensible);
  const sum = summarize(good);
  assert.ok(sum.badges.includes('allRooms'));
  assert.ok(sum.badges.includes('fixer') === good.stats.repairs >= 3);
  assert.ok(typeof sum.praise === 'string' && sum.praise.length > 10);
  const lazy = play('may2024', passive);
  assert.ok(!summarize(lazy).badges.includes('steady'));
});

test('difficulty levels: Easy throws fewer random problems than Hard, the storm data is the same', () => {
  const count = (level, seed) => {
    const s = createMission(load('mar2024'), { seed, config: configFor(level) });
    let n = 0;
    while (!s.ended) {
      for (const e of s.outbox) if (e.type === 'room' && ['leak', 'dust', 'filter'].includes(e.status)) n++;
      s.outbox.length = 0;
      if (s.pendingCard) { chooseOption(s, s.pendingCard.options[0].id); continue; }
      sensible.each(s);
      tick(s, 0.05);
    }
    return { n, s };
  };
  let easy = 0;
  let hard = 0;
  for (const seed of [1, 2, 3, 4]) {
    const e = count('easy', seed);
    const h = count('hard', seed);
    easy += e.n;
    hard += h.n;
    assert.deepEqual(e.s.timeline.days.map((d) => d.radiation), h.s.timeline.days.map((d) => d.radiation));
    assert.equal(summarize(h.s).difficulty, 'hard');
  }
  assert.ok(easy < hard, `easy ${easy} vs hard ${hard}`);
  assert.equal(configFor('nonsense').difficulty, 'normal');
});

test('every setback comes with a reason and a tip for next time', () => {
  const s = play('may2024', passive);
  const sum = summarize(s);
  assert.ok(sum.lessons.length > 0);
  for (const l of sum.lessons) {
    assert.ok(l.title && l.why && l.next, JSON.stringify(l));
    assert.ok(l.day >= 1 && l.day <= 30);
  }
  // one per kind on the end screen
  assert.equal(new Set(sum.lessons.map((l) => l.kind)).size, sum.lessons.length);
});

/** The day of a storm with the most radiation (mid-day). */
function peakT(s) {
  const rad = (t) => { s.t = t; return radiationNow(s); };
  let best = 0.5;
  for (let d = 1; d < 30; d++) if (rad(d + 0.5) > rad(best)) best = d + 0.5;
  return best;
}

test('cleaning the panels is a spacewalk: no shield outside, so a storm costs dose', () => {
  const s = createMission(load('may2024'), { seed: 3 });
  s.t = peakT(s);
  s.dust = true;
  const job = repairFor(s, 'solar');
  assert.equal(job.kind, 'dust');
  assert.ok(job.eva.dose >= 2, `peak spacewalk dose ${job.eva.dose}`);
  // the shield does not change what a spacewalk costs
  setShield(s, 3);
  assert.equal(evaCost(s).dose, job.eva.dose);
  const before = s.dose;
  completeRepair(s, 'solar', 'dust');
  assert.ok(Math.abs(s.dose - before - job.eva.dose) < 0.11, `${s.dose - before} vs ${job.eva.dose}`);
  // Mission Control says to wait instead of sending the crew out
  assert.match(getAdvice(s).text, /Wait|shelter|shield/i);

  // a quiet day costs almost nothing
  const q = createMission(load('nov2025'), { seed: 3 });
  q.dust = true;
  assert.ok(repairFor(q, 'solar').eva.dose < 0.5);
});

test('Moon dust from a spacewalk can clog the air filter, unless suitports are built', () => {
  let clogged = 0;
  for (let seed = 1; seed <= 12; seed++) {
    for (const ports of [false, true]) {
      const s = createMission(load('nov2025'), { seed });
      s.upgrades.suitport = ports;
      const scripted = s.script.length;
      s.dust = true;
      completeRepair(s, 'solar', 'dust');
      const dusty = s.script.filter((e) => e.cause === 'dust');
      if (ports) assert.equal(dusty.length, 0);
      else if (dusty.length) {
        clogged++;
        assert.equal(s.script.length, scripted + 1);
        assert.ok(dusty[0].t > s.t);
      }
    }
  }
  assert.ok(clogged >= 3 && clogged <= 11, `clogged ${clogged} of 12`);
});

test('suitports can be bought like the other upgrades', () => {
  const s = createMission(load('nov2025'), { seed: 1 });
  s.science = 1000;
  assert.equal(s.upgrades.suitport, false);
  buyUpgrade(s, 'suitport');
  assert.equal(s.upgrades.suitport, true);
});

test('the end screen compares each place at its peak in the same storm', () => {
  const s = play('may2024', passive);
  const sum = summarize(s);
  assert.deepEqual(sum.moonPeak, { iso: '2024-05-14', times: 278.4 });
  const mars = sum.comparisons.find((c) => c.site === 'marsSurface');
  assert.ok(mars, 'Mars is compared');
  assert.equal(mars.iso, '2024-05-20', 'Mars peak day, not the Moon peak day');
  assert.ok(Math.abs(mars.times - 15.4) < 0.05, `Mars ${mars.times}`);
  const iss = sum.comparisons.find((c) => c.site === 'iss');
  assert.ok(iss && iss.times < 2, 'the space station stayed near normal');
});

test('a storm that misses the Moon says so (the aim lesson)', () => {
  const feb = createMission(load('feb2022'), { seed: 1 });
  assert.ok(feb.outbox.some((e) => e.type === 'crew' && /misses the Moon/.test(e.text)),
    'feb2022 explains that the storm went elsewhere');
  const may = createMission(load('may2024'), { seed: 1 });
  assert.ok(!may.outbox.some((e) => e.type === 'crew' && /misses the Moon/.test(e.text)));
  // Mars was hit in Sep 2017 and Oct 2021 as well: both files must keep a Mars peak the end screen can show.
  for (const id of ['sep2017', 'oct2021']) {
    const mars = summarize(play(id, passive)).comparisons.find((c) => c.site === 'marsSurface');
    assert.ok(mars && mars.times >= 1.5, `${id}: Mars felt the storm (${mars?.times})`);
  }
});

test('the solo badge needs 3 stars and no call to Earth', () => {
  const s = play('oct2021', sensible);
  const sum = summarize(s);
  assert.equal(sum.calls, 0);
  assert.equal(sum.badges.includes('solo'), sum.stars === 3);
  const helped = createMission(load('oct2021'), { seed: 7 });
  callEarth(helped);
  assert.ok(!summarize(helped).badges.includes('solo'), 'one call is not solo');
  assert.equal(summarize(helped).calls, 1);
});

test('createMission works on a private config copy', () => {
  const a = createMission(load('oct2021'), { seed: 1 });
  const before = a.cfg.power.solarPerDay;
  a.cfg.power.solarPerDay = 999;
  const b = createMission(load('oct2021'), { seed: 1 });
  assert.equal(b.cfg.power.solarPerDay, before, 'mutating one mission must not change the next');
  assert.equal(configFor('normal').power.solarPerDay, before);
});

test('every upgrade says what it does, with real numbers', () => {
  const s = createMission(load('may2024'), { seed: 3 });
  for (const key of Object.keys(s.cfg.upgrades)) {
    const text = upgradeEffect(s, key);
    assert.ok(text.length > 20, `${key} has an effect line`);
    assert.match(text, /\d/, `${key} names a number`);
    assert.doesNotMatch(text, /undefined|NaN/, `${key} has no missing number`);
  }
  assert.match(upgradeEffect(s, 'battery'), /40 more power/);
  assert.match(upgradeEffect(s, 'walls'), /40% less radiation/);
  // After building the walls, "before" is still the dose without walls.
  const before = upgradeEffect(s, 'walls');
  s.science = 1000;
  buyUpgrade(s, 'walls');
  assert.equal(upgradeEffect(s, 'walls'), before);
  // On a calm day the dose is too small to compare ("+0 becomes +0"); in a storm it is shown.
  assert.doesNotMatch(before, /Right now/);
  const storm = createMission(load('may2024'), { seed: 3 });
  while (storm.t < 13.6) { if (storm.pendingCard) chooseOption(storm, storm.pendingCard.options.at(-1).id); tick(storm, 0.05); }
  assert.match(upgradeEffect(storm, 'walls'), /Right now: \+7 dose a day becomes \+4\.2/);
});

test('with an empty battery at night the air drops, and the crew says so', () => {
  const s = createMission(load('may2024'), { seed: 1 }); // starts in lunar night
  setShield(s, 3);
  let said = null;
  while (!said && s.t < 12) {
    if (s.pendingCard) { chooseOption(s, s.pendingCard.options.find((o) => !o.disabled).id); continue; }
    for (const e of s.outbox) if (e.type === 'crew' && /Battery empty/.test(e.text)) said = e.text;
    s.outbox.length = 0;
    tick(s, 0.05);
  }
  assert.ok(said, 'the battery ran empty');
  assert.doesNotMatch(said, /air machines.*run/i, 'no promise that the air machines keep running');
  assert.match(said, /oxygen machine/i);
  const air = s.air;
  tick(s, 0.2);
  assert.ok(s.air < air, 'air really drops without power');
  assert.doesNotMatch(getAdvice(s).reason, /keep running/);
});
