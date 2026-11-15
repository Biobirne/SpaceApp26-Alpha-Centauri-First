// SI disclosure: written with the SI tool Claude Code and reviewed by the team. See SI_USAGE.md and si-manifest.json.
// Run with: npm test (node --test)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createMission, repairFor, completeRepair, sciencePerDay } from '../src/rules/mission.js';

const doc = JSON.parse(readFileSync(new URL('../data/storms/oct2021.json', import.meta.url)));

test('a sealed lab can be reopened without any science points', () => {
  const s = createMission(doc, { seed: 1 });
  s.rooms.lab.status = 'lost';
  s.science = 0;
  const job = repairFor(s, 'lab');
  assert.equal(job.kind, 'rebuild');
  assert.equal(job.cost, undefined, 'no price: a sealed lab earns too little to pay one');
  assert.equal(completeRepair(s, 'lab', 'rebuild'), true);
  assert.equal(s.rooms.lab.status, 'ok');
  assert.equal(s.science, 0, 'reopening takes no points away');
});

test('a sealed lab still costs something: science is slow until it is open again', () => {
  const s = createMission(doc, { seed: 1 });
  const open = sciencePerDay(s);
  s.rooms.lab.status = 'lost';
  assert.ok(sciencePerDay(s) < open);
  completeRepair(s, 'lab', 'rebuild');
  assert.equal(sciencePerDay(s), open);
});
