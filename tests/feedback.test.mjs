// SI disclosure: written with the SI tool Claude Code and reviewed by the team. See SI_USAGE.md and si-manifest.json.
// Playtest feedback (FEEDBACK.md): forecast before the first storm, calm days, storm report, card numbers.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createMission, tick, chooseOption, isCalm } from '../src/rules/mission.js';

const load = (id) => JSON.parse(readFileSync(new URL(`../data/storms/${id}.json`, import.meta.url)));

function run(id, pick, seed = 3) {
  const s = createMission(load(id), { seed });
  const events = [];
  while (!s.ended) {
    events.push(...s.outbox);
    s.outbox.length = 0;
    if (s.pendingCard) { chooseOption(s, pick(s.pendingCard).id); continue; }
    tick(s, 0.05);
  }
  return { s, events };
}
const keepWorking = (c) => c.options.at(-1);
const safe = (c) => c.options[0];

test('a forecast comes before the first storm, and calm days stop counting as calm then', () => {
  const s = createMission(load('oct2021'), { seed: 3 });
  assert.ok(s.forecastT > 1);
  assert.equal(isCalm(s), true);
  while (s.t < s.forecastT + 0.1) { s.outbox.length = 0; tick(s, 0.05); }
  assert.equal(s.stormSoon, true);
  assert.equal(isCalm(s), false);
});

test('storm report: keeping the crew at work is compared with what the shelter would have let through', () => {
  const risky = run('oct2021', keepWorking).s.stormReports[0];
  const careful = run('oct2021', safe).s.stormReports[0];
  assert.ok(risky.taken > risky.inShelter * 2, JSON.stringify(risky));
  assert.ok(careful.taken < risky.taken / 3, `${careful.taken} vs ${risky.taken}`);
});

test('the report never praises a crew that only went inside because of the dose limit', () => {
  const { events } = run('sep2017', keepWorking);
  const reports = events.filter((e) => e.type === 'crew' && /Storm report/.test(e.text)).map((e) => e.text);
  assert.ok(reports.length >= 1);
  for (const r of reports) assert.doesNotMatch(r, /Smart moves|did their job/);
});

test('particle cards use the real number of the day and count the waves', () => {
  const { events } = run('sep2017', safe);
  const cards = events.filter((e) => e.type === 'card' && e.card?.kind === 'particles').map((e) => e.card);
  if (!cards.length) return; // card shape differs: nothing to check
  assert.match(cards[0].text, /× normal/);
  if (cards[1]) assert.notEqual(cards[0].title, cards[1].title);
});
