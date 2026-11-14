// SI disclosure: written with the SI tool Claude Code and reviewed by the team. See SI_USAGE.md and si-manifest.json.
// "What does this number mean?" Every number in the HUD gets a short, friendly explanation when the
// kid taps it: what it counts, what the rate means for the next days, and how it is measured for real.
// Real facts (opened 14 Nov 2026):
// - gray = 1 joule absorbed per kilogram (US NRC glossary, "gray (Gy)")
// - one astronaut uses about 0.84 kg of oxygen a day (NASA life support planning value, NASA RP-1324 tables)
// - NASA Fission Surface Power: at least 40 kilowatts, enough for about 30 homes (nasa.gov, Fission Surface Power)
// - NASA career limit 600 mSv (NASA-STD-3001, already used in FEEDBACK.md A1)
// - sievert = dose equivalent, the absorbed dose in gray times a factor for the kind of radiation, because
//   "different radiation types have different biological effects for the same deposited energy"
//   (Wikipedia "Sievert", SI definition H = Q x D; US NRC glossary "sievert (Sv)")
// Game numbers are called game numbers. Measured numbers say who measured them.

import { icon } from './icons.js';
import { openSheet, esc } from './overlays.js';
import { CREWMATE_NAME } from '../rules/content.js';
import {
  currentDayIndex, fmtTimes, powerInPerDay, powerUsePerDay, airBreakdown, doseNow, sciencePerDay,
} from '../rules/mission.js';

const round1 = (x) => Math.round(x * 10) / 10;
const ugy = (x) => (x >= 10 ? String(Math.round(x)) : String(round1(x)));
const days = (n) => {
  const d = Math.max(1, Math.round(n));
  return `${d} ${d === 1 ? 'day' : 'days'}`;
};
/** Gray or sievert? The Data sheet shows gray (what the detector measures), the dose bar speaks of sieverts (harm). */
const GRAY_OR_SIEVERT = 'Gray (Gy) counts the energy the radiation leaves behind. Sievert (Sv) counts how much harm it can do to a body. Some kinds of radiation do more harm with the same energy. Then 1 gray counts as more than 1 sievert.';

const signed = (x, unit = '') => `${x > 0 ? '+' : x < 0 ? '−' : ''}${Math.abs(round1(x))}${unit}`;

/** A block of "big number: what it means" lines, then an optional real-life line. */
function meaning(rows, real) {
  return `<div class="nm">
    <h3>${icon('info')}What the numbers mean</h3>
    <dl>${rows.map(([big, text]) => `<div class="nm-row"><dt>${big}</dt><dd>${esc(text)}</dd></div>`).join('')}</dl>
    ${real ? `<p class="nm-real">${icon('rocket')}<span><b>In real life:</b> ${esc(real)}</span></p>` : ''}
  </div>`;
}

export function powerMeaning(state) {
  const pct = Math.round((state.power / state.capacity) * 100);
  const net = powerInPerDay(state) - powerUsePerDay(state);
  const netPct = (net / state.capacity) * 100;
  let rateText;
  if (state.powerEmergency) rateText = 'The battery was empty. Science waits until it has charged up again.';
  else if (Math.abs(netPct) < 0.5) rateText = 'Steady: the base uses about as much as the panels make.';
  else if (net < 0) rateText = `Every day the battery loses ${Math.round(-netPct)}% of its charge. At this rate it is empty in about ${days(state.power / -net)}.`;
  else rateText = state.power >= state.capacity - 0.5
    ? `The panels make ${Math.round(netPct)}% more than the base needs. The battery is already full.`
    : `Every day the battery gains ${Math.round(netPct)}%. At this rate it is full in about ${days((state.capacity - state.power) / net)}.`;
  return meaning([
    [`${pct}%`, `How full the battery is: ${Math.round(state.power)} of ${state.capacity} ⚡.`],
    [`${signed(Math.round(netPct))}%/day`, rateText],
    ['⚡', `Our game unit for power. The buttons show their cost in it, like −${state.cfg.power.shieldPerDay[3]} ⚡/day for the Max shield.`],
  ], 'Power is measured in kilowatts. NASA’s planned Moon reactor would make at least 40 kilowatts, enough for about 30 homes.');
}

export function airMeaning(state) {
  const net = airBreakdown(state).reduce((a, r) => a + r.perDay, 0);
  const air = Math.round(state.air);
  let rateText;
  if (Math.abs(net) < 0.5) rateText = 'Steady: the machines make as much air as the base loses.';
  else if (net < 0) rateText = `Every day the base loses ${Math.round(-net)}% of its air. At this rate it runs out in about ${days(state.air / -net)}.`;
  else rateText = state.air >= state.cfg.air.max - 0.5
    ? 'The tanks are full. The machines keep them topped up.'
    : `Every day the machines add ${Math.round(net)}%. Full again in about ${days((state.cfg.air.max - state.air) / net)}.`;
  return meaning([
    [`${air}%`, `How much fresh air the base has in store. Below ${state.cfg.air.warnBelow}%, ${CREWMATE_NAME} warns you. At 0%, the emergency tanks open.`],
    [`${signed(Math.round(net))}%/day`, rateText],
  ], 'Every astronaut breathes in about 0.8 kg of oxygen each day. That is why the oxygen machine never stops.');
}

export function doseMeaning(state) {
  const d = doseNow(state);
  const limit = state.cfg.dose.limit;
  const calmDays = Math.round(1 / state.cfg.dose.perNormalDay);
  const left = limit - state.dose;
  const rateText = d.perDay < 0.05
    ? 'Almost nothing gets to the crew right now.'
    : `What the crew gets each day right now.${d.perDay >= 1 ? ` At this rate they reach ${limit} in about ${days(left / d.perDay)}.` : ''}`;
  return meaning([
    [`${Math.round(state.dose)}/${limit}`, `Dose points the crew has collected on this mission. At ${limit}, everyone must stay in the shelter.`],
    [`+${round1(d.perDay)}/day`, rateText],
    ['1 point', `A game number: about ${calmDays} calm days with the shield off. In a big storm, it can be many points a day.`],
    ['mSv', 'Millisievert: one thousandth of a sievert. Doctors use it for the harm radiation can do to a body.'],
    ['Gy or Sv?', `${GRAY_OR_SIEVERT} NASA’s detector measures gray, so the Data sheet shows µGy/h.`],
  ], 'Doctors measure dose in millisieverts (mSv). NASA lets an astronaut collect at most 600 mSv in a whole career.');
}

export function scienceMeaning(state) {
  const rate = sciencePerDay(state);
  const s = state.cfg.science;
  const goal = [`${s.targetForStar}`, 'The goal. Points you still have at the end count for your stars, so every upgrade you build is a choice.'];
  const rule = 'In the shelter the lab stops, and with a low battery it runs at half speed.';
  if (rate === s.perDay) {
    return meaning([[`+${s.perDay}/day`, `Science points are what the crew finds out in the lab. They earn ${s.perDay} a day while they work. ${rule}`], goal]);
  }
  let why = 'the lab runs slower';
  if (state.powerEmergency) why = 'the battery is empty';
  else if (state.sheltered || state.forcedShelter) why = 'the crew is in the shelter';
  else if (state.rooms.lab.status === 'lost') why = 'the science lab is sealed';
  else if (state.rooms.lab.status === 'leak') why = 'the science lab is leaking';
  else if (state.power < s.lowPowerBelow) why = 'the battery is low';
  return meaning([
    [`+${round1(rate)}/day`, `Science points are what the crew finds out in the lab. Right now they earn ${rate === 0 ? 'nothing' : 'less'}, because ${why}.`],
    [`+${s.perDay}/day`, `When the crew works and the lab is fine. ${rule}`],
    goal,
  ]);
}

// ------------------------------------------------------------------ real data (the radiation chip)

export function showData(state, doc) {
  const tl = state.timeline;
  const today = currentDayIndex(state);
  const moon = doc.radiation.moonOrbit;
  const vals = tl.days.map((d) => d.radiation.moonOrbit?.times ?? null);
  const max = Math.max(10, ...vals.filter((v, i) => v != null && i <= today));
  const W = 320;
  const H = 120;
  const bw = W / vals.length;
  const y = (v) => H - 14 - (Math.log10(Math.max(1, v)) / Math.log10(max)) * (H - 30);
  const bars = vals.map((v, i) => {
    if (v == null) return '';
    const future = i > today;
    const h = future ? 6 : H - 14 - y(v);
    return `<rect class="bar ${future ? 'future' : i === today ? 'today' : ''}" x="${(i * bw + 1).toFixed(1)}" y="${(H - 14 - Math.max(2, h)).toFixed(1)}" width="${(bw - 2).toFixed(1)}" height="${Math.max(2, h).toFixed(1)}" rx="1.5"/>`;
  }).join('');
  const todayV = vals[today];
  const todayMean = tl.days[today].radiation.moonOrbit?.mean;
  const flares = tl.flares.filter((f) => f.t <= state.t && f.score >= 300).sort((a, b) => b.score - a.score).slice(0, 4);
  const fdate = (t) => new Date(tl.startMs + t * 86400000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  const d = doseNow(state);
  const rows = [];
  if (todayV != null && todayMean != null) {
    const times = fmtTimes(todayV).replace('×', '');
    rows.push([`${fmtTimes(todayV)}`, `Today the radiation near the Moon is ${times} times as strong as on a calm day. NASA measured ${ugy(todayMean)} µGy/h today. A calm day has ${ugy(moon.normal)} µGy/h.`]);
  }
  rows.push(['µGy/h', 'Microgray per hour: how much radiation energy something soaks up in one hour. A microgray is one millionth of a gray.']);
  rows.push(['Gy or Sv?', `${GRAY_OR_SIEVERT} NASA’s limits for astronauts are in sieverts, because they are about the body.`]);
  rows.push([`+${round1(d.perDay)}/day`, `What gets to your crew: shield, shelter and walls block ${Math.round(d.block * 100)}%, the rest adds to the Crew dose.`]);
  const html = `
    <h2>Real NASA data</h2>
    <p>Radiation near the Moon, day by day. Today is the bright bar.</p>
    <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Radiation near the Moon for each mission day">
      <line class="axis" x1="0" x2="${W}" y1="${H - 13}" y2="${H - 13}"/>
      ${bars}
      <text x="0" y="${H - 1}">Day 1</text><text x="${W}" y="${H - 1}" text-anchor="end">Day ${vals.length}</text>
      <text x="0" y="10">${fmtTimes(max)} normal</text>
    </svg>
    ${meaning(rows, 'Doctors and space agencies use the gray for radiation energy. 1 gray means 1 joule of energy in every kilogram.')}
    <ul class="datalist">
      <li><span>Today (${esc(tl.days[today].iso)})</span><span>${todayV != null ? `${fmtTimes(todayV)} normal` : 'no reading'}${todayMean != null ? `, ${todayMean} µGy/h` : ''}</span></li>
      <li><span>Measured by</span><span>${esc(moon.where)}</span></li>
      <li><span>Normal level</span><span>${moon.normal} µGy/h</span></li>
      ${flares.length ? `<li><span>Biggest flares so far</span><span>${flares.map((f) => `${esc(f.cls)} (${fdate(f.t)})`).join(', ')}</span></li>` : ''}
    </ul>
    <p class="source">Measured in orbit around the Moon. On the surface it is about half, because the Moon blocks half the sky.
    ${esc(doc.displayLabel)}: radiation from NASA OSDR RadLab, flares and particle storms from NASA DONKI.</p>`;
  return openSheet(html);
}
