// SI disclosure: written with the SI tool Claude Code and reviewed by the team. See SI_USAGE.md and si-manifest.json.
// Kid-facing text must match what the game really does (text audit, 14 Nov): names, units, percentages.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createMission, getAdvice, buyUpgrade, lifeLoop } from '../src/rules/mission.js';
import { configFor } from '../src/rules/config.js';
import { ROOMS } from '../src/rules/content.js';

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
