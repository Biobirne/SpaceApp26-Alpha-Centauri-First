// SI disclosure: written with the SI tool Claude Code and reviewed by the team. See SI_USAGE.md and si-manifest.json.
// Autopilot simulation behind the "Isn't it too easy?" table in PITCH.md.
// The autopilot never thinks for itself: it calls Earth whenever it can, does what Mission Control
// says, and fixes every open repair right away. Run with: node tools/autopilot_sim.mjs
import { readFileSync } from 'node:fs';
import {
  createMission, tick, chooseOption, callEarth, callEarthReady, applyAdvice,
  repairFor, completeRepair, summarize,
} from '../src/rules/mission.js';
import { configFor } from '../src/rules/config.js';
import { LEVEL_ORDER } from '../src/progress.js';

const SEEDS = [1, 2, 3, 4, 5];
const load = (id) => JSON.parse(readFileSync(new URL(`../data/storms/${id}.json`, import.meta.url)));

function autopilot(id, level, seed) {
  const s = createMission(load(id), { seed, config: configFor(level) });
  let guard = 0;
  while (!s.ended && guard++ < 100000) {
    s.outbox.length = 0;
    if (s.pendingCard) {
      const c = s.pendingCard;
      chooseOption(s, (c.options.find((o) => !o.disabled) || c.options[0]).id);
      continue;
    }
    for (const room of Object.keys(s.rooms)) {
      const r = repairFor(s, room);
      if (r) completeRepair(s, room, r.kind);
    }
    if (callEarthReady(s)) {
      const advice = callEarth(s);
      if (advice?.action && !advice.action.repair) applyAdvice(s, advice.action);
    }
    tick(s, 0.05);
  }
  const sum = summarize(s);
  return { stars: sum.stars, science: sum.science, setbacks: sum.setbacks, roomsLost: sum.roomsLost, calls: s.callEarth.calls };
}

console.log(`Autopilot: always call Earth, follow the advice, fix open repairs. Seeds ${SEEDS.join(', ')}.`);
console.log(`Stars per seed (science min–max, setbacks max, rooms lost max, calls)\n`);
for (const level of ['easy', 'normal', 'hard']) {
  for (const id of LEVEL_ORDER) {
    const runs = SEEDS.map((seed) => autopilot(id, level, seed));
    const sci = runs.map((r) => r.science);
    console.log(`${level.padEnd(7)}${id.padEnd(9)}stars ${runs.map((r) => r.stars).join(' ')}   science ${Math.min(...sci)}–${Math.max(...sci)}   setbacks ${Math.max(...runs.map((r) => r.setbacks))}   rooms lost ${Math.max(...runs.map((r) => r.roomsLost))}   calls ${runs[0].calls}`);
  }
}
