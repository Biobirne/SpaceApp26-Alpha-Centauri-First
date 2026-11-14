// SI disclosure: written with the SI tool Claude Code and reviewed by the team. See SI_USAGE.md and si-manifest.json.
// The life support loop (mentor feedback M2/M3): oxygen machine, plants with lamps, algae bioreactor.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  createMission, tick, airBreakdown, powerBreakdown, powerUsePerDay, lifeLoop, setGrowLights, plantsLit,
  buyUpgrade, noteLoopSeen,
} from '../src/rules/mission.js';
import { LIFE_LOOP, ROOM_INFO, CHATTER } from '../src/rules/content.js';

const load = (id) => JSON.parse(readFileSync(new URL(`../data/storms/${id}.json`, import.meta.url)));
const sum = (rows) => rows.reduce((a, r) => a + r.perDay, 0);

test('plant lamps: switching them off saves power, but the plants stop helping the air', () => {
  const s = createMission(load('nov2025'), { seed: 1 });
  assert.equal(plantsLit(s), true);
  const powerOn = powerUsePerDay(s);
  const airOn = sum(airBreakdown(s));
  assert.ok(powerBreakdown(s).some((r) => /Plant lamps/.test(r.label)));

  setGrowLights(s, false);
  assert.equal(plantsLit(s), false);
  assert.equal(powerUsePerDay(s), powerOn - s.cfg.power.growLightsPerDay);
  assert.equal(sum(airBreakdown(s)), airOn - s.cfg.air.greenhouseBonusPerDay);
  assert.equal(lifeLoop(s).plants, 'dark');
  // the player always hears why
  assert.ok(s.outbox.some((e) => e.type === 'crew' && /saves power/.test(e.text)));
});

test('the air bar moves by exactly what the breakdown lists', () => {
  const s = createMission(load('nov2025'), { seed: 1 });
  s.air = 50;
  s.filter = true;
  const expected = 50 + sum(airBreakdown(s)) * 0.1;
  tick(s, 0.1);
  assert.ok(Math.abs(s.air - expected) < 1e-6, `${s.air} vs ${expected}`);
});

test('an empty battery switches the lamps off, and they cannot go back on until it recharges', () => {
  const s = createMission(load('nov2025'), { seed: 1 });
  s.daylight = false;
  s.power = 0.01;
  tick(s, 0.05);
  assert.equal(s.powerEmergency, true);
  assert.equal(s.growLights, false);
  assert.equal(setGrowLights(s, true), false);
});

test('algae bioreactor: more air, a clogged filter hurts half as much, and it costs power', () => {
  const s = createMission(load('nov2025'), { seed: 1 });
  s.filter = true;
  const before = sum(airBreakdown(s));
  const powerBefore = powerUsePerDay(s);
  s.science = 100;
  assert.equal(buyUpgrade(s, 'algae'), true);
  const a = s.cfg.air;
  assert.equal(sum(airBreakdown(s)) - before, a.algaePerDay + a.cloggedFilterPerDay * (1 - a.algaeFilterFactor));
  assert.equal(powerUsePerDay(s) - powerBefore, s.cfg.power.algaePerDay);
  assert.equal(lifeLoop(s).algae, 'ok');
  assert.ok(s.words.includes('recycling'));
});

test('the loop shows what is wrong right now', () => {
  const s = createMission(load('nov2025'), { seed: 1 });
  assert.deepEqual(lifeLoop(s), { crew: 'breathing', filter: 'ok', water: 'ok', oxygen: 'ok', plants: 'on', algae: 'none', leak: null });
  s.filter = true;
  s.rooms.lab.status = 'leak';
  s.power = 0;
  s.daylight = false;
  const l = lifeLoop(s);
  assert.equal(l.filter, 'clogged');
  assert.equal(l.oxygen, 'off');
  assert.equal(l.leak, 'Science lab');
  noteLoopSeen(s);
  assert.ok(s.words.includes('oxygenMachine'));
});

test('kid texts: plants are helpers, machines make most of the oxygen (RESEARCH.md section 3)', () => {
  const texts = [ROOM_INFO.greenhouse.does, ...CHATTER, LIFE_LOOP.plants.text].join(' ');
  assert.doesNotMatch(texts, /plants?[^.]*make[^.]*(fresh )?oxygen for us/i);
  assert.match(LIFE_LOOP.oxygen.text, /Most of our air/);
});

test('at the first sunset Sam says the plant lamps use power, once', () => {
  const s = createMission(load('oct2021'), { seed: 1 });
  const hints = [];
  let sunsets = 0;
  while (s.t < 30 && !s.ended) {
    for (const e of s.outbox) {
      if (e.type === 'daylight' && !e.isDay) sunsets++;
      if (e.type === 'crew' && /plant lamps use power/.test(e.text)) hints.push(e.t);
    }
    s.outbox.length = 0;
    if (s.pendingCard) { s.pendingCard = null; continue; }
    tick(s, 0.05);
  }
  assert.ok(sunsets >= 1, 'this storm has a sunset');
  assert.equal(hints.length, 1);
});
