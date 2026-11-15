// SI disclosure: written with the SI tool Claude Code and reviewed by the team. See SI_USAGE.md and si-manifest.json.
// Data integrity: a Moon level must actually have a Moon radiation measurement, and the archived
// label must name the month of the storm peak (not the start of the 30-day window).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LEVEL_ORDER, isUnlocked, rankFor, setHints, markHintSeen } from '../src/progress.js';
import { buildTimeline, peakDay } from '../src/rules/storm.js';

const load = (id) => JSON.parse(readFileSync(new URL(`../data/storms/${id}.json`, import.meta.url)));

const monthOf = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
  month: 'long', year: 'numeric', timeZone: 'UTC',
});

test('every Moon level has a Moon radiation measurement', () => {
  for (const id of LEVEL_ORDER) {
    const doc = load(id);
    assert.ok(doc.radiation.moonOrbit, `${id}: no moonOrbit data`);
    const tl = buildTimeline(doc, 30);
    const moon = peakDay(tl, 'moonOrbit');
    assert.ok(moon && moon.times > 0, `${id}: no Moon peak`);
    assert.ok(tl.days.some((d) => d.radiation.moonOrbit), `${id}: no Moon daily values`);
  }
});

test('the archived label names the month of the storm peak', () => {
  for (const id of LEVEL_ORDER) {
    const doc = load(id);
    const tl = buildTimeline(doc, 30);
    const peak = peakDay(tl, 'moonOrbit');
    assert.ok(doc.displayLabel.includes(monthOf(peak.iso)), `${id}: "${doc.displayLabel}" vs peak ${peak.iso}`);
  }
  // The deep-space storm is not a Moon level, but its label must still name its real peak month.
  const nov = load('nov2025');
  const novPeak = peakDay(buildTimeline(nov, 30), 'deepSpace');
  assert.ok(nov.displayLabel.includes(monthOf(novPeak.iso)), `nov2025: "${nov.displayLabel}" vs peak ${novPeak.iso}`);
});

test('the deep-space Nov 2025 storm is not startable as a Moon mission', () => {
  assert.equal(LEVEL_ORDER.includes('nov2025'), false);
  assert.equal(isUnlocked('nov2025', { stars: {} }, false), false);
  assert.equal(isUnlocked('nov2025', { stars: {} }, true), false, 'judge unlock must not start it either');
  assert.equal(load('nov2025').radiation.moonOrbit, undefined);
});

test('only real levels count for the rank', () => {
  assert.equal(rankFor({ stars: { nov2025: 3 } }), 'Cadet', 'stars of a removed storm do not count');
  assert.equal(rankFor({ stars: { oct2021: 3, nov2025: 3 } }), 'Flight Engineer');
});

test('turning the tips back on shows the hints again, but not the whole training', () => {
  markHintSeen('intro');
  markHintSeen('shield');
  setHints(false);
  const p = setHints(true);
  assert.equal(p.seen.intro, true);
  assert.equal(p.seen.shield, undefined);
});
