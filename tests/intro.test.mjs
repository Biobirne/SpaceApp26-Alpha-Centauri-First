// SI disclosure: written with the SI tool Claude Code and reviewed by the team. See SI_USAGE.md and si-manifest.json.
// Run with: npm test (node --test)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createMission, radiationNow, doseNow, setShield } from '../src/rules/mission.js';

const doc = JSON.parse(readFileSync(new URL('../data/storms/oct2021.json', import.meta.url)));

test('the training drill can raise the radiation without touching the real data', () => {
  const s = createMission(doc, { seed: 1 });
  const real = radiationNow(s);
  s.drillRadiation = 12;
  assert.equal(radiationNow(s), 12);
  s.drillRadiation = null;
  assert.equal(radiationNow(s), real);
});

test('in the drill, the shield lowers the dose the crew gets', () => {
  const s = createMission(doc, { seed: 1 });
  s.drillRadiation = 12;
  const open = doseNow(s).perDay;
  setShield(s, 3);
  assert.ok(doseNow(s).perDay < open);
});
