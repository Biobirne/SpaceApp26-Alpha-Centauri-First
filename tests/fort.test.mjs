// SI disclosure: written with the SI tool Claude Code and reviewed by the team. See SI_USAGE.md and si-manifest.json.
// Run with: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createMission, repairFor, completeRepair, setShelter, blockFraction, shieldOptions, doseNow } from '../src/rules/mission.js';

const doc = JSON.parse(readFileSync(new URL('../data/storms/oct2021.json', import.meta.url)));

test('the storm fort is offered at the shelter only when a storm is here or forecast', () => {
  const s = createMission(doc, { seed: 1 });
  assert.equal(repairFor(s, 'shelter'), null);
  s.stormSoon = true;
  assert.equal(repairFor(s, 'shelter').kind, 'fort');
  s.stormSoon = false;
  s.drillRadiation = 12;
  assert.equal(repairFor(s, 'shelter').kind, 'fort');
});

test('a built storm fort makes the shelter block more, and is built only once', () => {
  const s = createMission(doc, { seed: 1 });
  s.drillRadiation = 12;
  setShelter(s, true);
  const before = blockFraction(s);
  const repairsBefore = s.stats.repairs;
  assert.equal(completeRepair(s, 'shelter', 'fort'), true);
  assert.ok(blockFraction(s) > before);
  assert.equal(s.stats.repairs, repairsBefore, 'building the fort is not counted as a repair');
  assert.equal(repairFor(s, 'shelter'), null);
  assert.equal(completeRepair(s, 'shelter', 'fort'), false);
});

test('the fort only helps while the crew is in the shelter', () => {
  const s = createMission(doc, { seed: 1 });
  const outside = blockFraction(s);
  completeRepair(s, 'shelter', 'fort');
  assert.equal(blockFraction(s), outside);
});

test('the shield sheet includes the fort, so it matches the dose bar', () => {
  const s = createMission(doc, { seed: 1 });
  s.t = 14.5; // the October 2021 peak
  setShelter(s, true);
  completeRepair(s, 'shelter', 'fort');
  const current = shieldOptions(s).find((o) => o.current);
  assert.ok(Math.abs(current.perDay - doseNow(s).perDay) < 1e-9,
    `sheet ${current.perDay} vs dose bar ${doseNow(s).perDay}`);
});
