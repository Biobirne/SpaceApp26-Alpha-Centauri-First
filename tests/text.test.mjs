// SI disclosure: written with the SI tool Claude Code and reviewed by the team. See SI_USAGE.md and si-manifest.json.
// Kid-facing text must match what the game really does (text audit, 14 Nov): names, units, percentages.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createMission, getAdvice, buyUpgrade, lifeLoop, shieldOptions, doseNow, setShelter } from '../src/rules/mission.js';
import { configFor } from '../src/rules/config.js';
import { ROOMS, SHIELD_INFO } from '../src/rules/content.js';

const load = (id) => JSON.parse(readFileSync(new URL(`../data/storms/${id}.json`, import.meta.url)));

test('every room has one name: the label on the base is the name in the sheets', () => {
  for (const r of Object.values(ROOMS)) assert.equal(r.short, r.name);
  assert.equal(ROOMS.greenhouse.name, 'Greenhouse');
});

test('Mission Control speaks of the battery in percent, also with a bigger battery', () => {
  const s = createMission(load('nov2025'), { seed: 1, config: configFor('easy') });
  const a = getAdvice(s);
  assert.doesNotMatch(`${a.text} ${a.reason}`, /1[0-9]{2}%/, 'no "130%" battery');
});

test('the bigger battery arrives charged, so the bar does not drop after buying it', () => {
  const s = createMission(load('nov2025'), { seed: 1 });
  s.science = 100;
  const before = s.power / s.capacity;
  assert.equal(buyUpgrade(s, 'battery'), true);
  assert.equal(s.power / s.capacity, before);
});

test('a leaking greenhouse shows "leak" in the loop, not "sealed"', () => {
  const s = createMission(load('nov2025'), { seed: 1 });
  s.rooms.greenhouse.status = 'leak';
  assert.equal(lifeLoop(s).plants, 'leak');
  s.rooms.greenhouse.status = 'lost';
  assert.equal(lifeLoop(s).plants, 'lost');
});

test('the shield sheet: every level with the real radiation of today, the current one matches the dose bar', () => {
  const s = createMission(load('may2024'), { seed: 1 });
  s.t = 13.5; // the storm peak
  for (const inside of [false, true]) {
    setShelter(s, inside);
    const opts = shieldOptions(s);
    assert.equal(opts.length, 4);
    for (let i = 1; i < 4; i++) assert.ok(opts[i].perDay < opts[i - 1].perDay, 'more shield, less dose');
    const now = opts.find((o) => o.current);
    assert.ok(Math.abs(now.perDay - doseNow(s).perDay) < 1e-9);
    assert.deepEqual(opts.map((o) => o.cost), s.cfg.power.shieldPerDay);
  }
  assert.ok(SHIELD_INFO.sources.length >= 2, 'the sheet names its sources');
  assert.match(SHIELD_INFO.real, /No base/);
});

// Playtest 14 Nov (~22:00): storm cards must fit the shield the kid already has, and Call Earth must
// help when things went wrong, not say "Everything looks great".
import { tick, setShield as setShieldLevel, chooseOption, getAdvice as adviceNow } from '../src/rules/mission.js';

function nextCard(s, kind, maxDays = 30) {
  while (s.t < maxDays) {
    tick(s, 0.05);
    if (s.pendingCard) {
      if (s.pendingCard.kind === kind) return s.pendingCard;
      chooseOption(s, s.pendingCard.options.at(-1).id);
    }
  }
  return null;
}

test('a flare card with the shield already on Max offers no "up to Max" and no twin choices', () => {
  const s = createMission(load('may2024'), { seed: 1 });
  s.script = [];
  setShieldLevel(s, 3);
  s.power = s.capacity; s.cfg.power.shieldPerDay = [0, 0, 0, 0]; // keep the shield running
  const card = nextCard(s, 'flare');
  assert.ok(card, 'a flare card came');
  const labels = card.options.map((o) => o.label);
  assert.ok(labels.includes('Keep shield on Max'), labels.join(' / '));
  assert.ok(labels.includes('Shield down to Mid'), labels.join(' / '));
  assert.ok(!labels.some((l) => /up to Max/.test(l)));
  assert.equal(card.options.length, 2);
});

test('a particle card says "down to Low" for the shelter when the shield is higher, and "Stay" when inside', () => {
  const s = createMission(load('may2024'), { seed: 1 });
  s.script = [];
  s.power = s.capacity; s.cfg.power.shieldPerDay = [0, 0, 0, 0];
  setShieldLevel(s, 3);
  setShelter(s, true);
  const card = nextCard(s, 'particles');
  assert.ok(card, 'a particle card came');
  const shelter = card.options.find((o) => o.id === 'shelter');
  assert.equal(shelter.label, 'Stay in the shelter, shield down to Low');
  assert.ok(card.options.some((o) => o.label === 'Back to work'));
});

test('Call Earth notices a sealed building, an empty battery and the forced shelter', () => {
  const s = createMission(load('oct2021'), { seed: 1 });
  s.rooms.lab.status = 'lost';
  s.science = 5;
  let a = adviceNow(s);
  assert.doesNotMatch(a.text, /Everything looks great/);
  assert.match(a.text, /Reopen the science lab/);
  assert.equal(a.action.repair, 'lab', 'reopening costs no points, so it is offered even with few of them');
  s.science = 40;
  a = adviceNow(s);
  assert.match(a.text, /Reopen the science lab/);
  assert.equal(a.action.repair, 'lab');

  const p = createMission(load('oct2021'), { seed: 1 });
  p.powerEmergency = true; p.power = 0;
  assert.match(adviceNow(p).text, /Wait for sunrise|Let the battery charge|Clean the solar panels/);

  const f = createMission(load('oct2021'), { seed: 1 });
  f.forcedShelter = true;
  assert.match(adviceNow(f).text, /Stay in the shelter and wait/);
});
