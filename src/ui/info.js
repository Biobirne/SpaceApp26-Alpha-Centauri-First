// SI disclosure: written with the SI tool Claude Code and reviewed by the team. See SI_USAGE.md and si-manifest.json.
// "Learn more" sheets for curious players (mentor feedback): tap a building or a bar to see what it
// does, how it works for real, what it is built from, and where your power and air go right now.
// Plain DOM. Reads state through the rules' helper functions, never changes it.

import { icon } from './icons.js';
import { openSheet, esc } from './overlays.js';
import { ROOMS, ROOM_INFO, CREWMATE_NAME } from '../rules/content.js';
import { SHIELD_INFO } from '../rules/content.js';
import { shieldOptions, noteShieldSeen, repairFor } from '../rules/mission.js';
import { ROOM_IDS } from '../rules/config.js';
import { powerBreakdown, airBreakdown, doseNow, fmtTimes } from '../rules/mission.js';
import { loopHTML, wireLoop, lampHTML } from './loop.js';
import { powerMeaning, airMeaning, doseMeaning } from './numbers.js';

// Controller actions the sheets can call. main.js sets them once (keeps showRoomInfo's signature stable).
let infoActions = {};
export function setInfoActions(actions) { infoActions = actions; }

const ROOM_ICON = { solar: 'sun', greenhouse: 'plant', hab: 'moon', lab: 'science', shelter: 'shelter' };

function part(ic, title, text) {
  return `<div class="info-part">${icon(ic)}<div><b>${title}</b><p>${esc(text)}</p></div></div>`;
}

export function showRoomInfo(roomId, state) {
  const info = ROOM_INFO[roomId];
  const room = state.rooms[roomId];
  let status = 'Working fine.';
  if (room.status === 'lost') status = 'Sealed after a leak. Tap it again to rebuild it with science points.';
  else if (roomId === 'shelter' && (state.sheltered || state.forcedShelter)) status = 'The crew is inside right now.';
  else if (roomId === 'lab' && state.powerEmergency) status = 'Paused: the battery is empty.';
  else if (roomId === 'lab' && (state.sheltered || state.forcedShelter)) status = 'Paused: the crew is in the shelter.';
  else if (room.status === 'leak') status = 'Leaking! Tap the red ! to fix it.';
  const html = `
    <h2>${icon(ROOM_ICON[roomId])} ${esc(ROOMS[roomId].name)}</h2>
    <p class="info-status">${esc(status)}</p>
    ${roomId === 'greenhouse' ? lampHTML(state) : ''}
    ${part('check', 'What it does', info.does)}
    ${part('rocket', 'In real life', info.real)}
    ${part('wrench', 'Built from', info.built)}
    <div class="fact">${icon('info')}<span>${esc(info.fact)}</span></div>
    <div class="row"><button type="button" class="btn primary ok">${icon('check')}Got it</button></div>`;
  const sheet = openSheet(html, { className: 'info-sheet' });
  sheet.el.querySelector('.ok').addEventListener('click', () => sheet.close());
  // The lamp switch flips in place, so the kid sees the new state and the cost right there.
  const wireLamp = () => sheet.el.querySelector('.lamp-toggle')?.addEventListener('click', (e) => {
    infoActions.growLights?.(!(state.growLights && !state.powerEmergency));
    e.currentTarget.outerHTML = lampHTML(state);
    wireLamp();
  });
  wireLamp();
  return sheet;
}

const num = (x) => {
  const r = Math.round(x * 10) / 10;
  return `${r > 0 ? '+' : r < 0 ? '−' : ''}${Math.abs(r)}`;
};

function table(rows, unit) {
  const total = rows.reduce((a, r) => a + r.perDay, 0);
  return `<ul class="flow">
    ${rows.map((r) => `<li class="${r.perDay > 0 ? 'in' : r.perDay < 0 ? 'out' : ''}"><span>${esc(r.label)}</span><b>${num(r.perDay)} ${unit}</b></li>`).join('')}
    <li class="total"><span>Every day</span><b>${num(total)} ${unit}</b></li>
  </ul>`;
}

/** Tap "Shield": what it does, every level side by side with today's real radiation, and the real research. */
function shieldHTML(state) {
  const opts = shieldOptions(state);
  const { rad } = doseNow(state);
  const inShelter = state.sheltered || state.forcedShelter;
  const fmt = (x) => (x >= 10 ? Math.round(x) : Math.round(x * 10) / 10);
  const rows = opts.map((o) => `<tr class="${o.current ? 'now' : ''}">
      <th scope="row">${esc(o.label)}${o.current ? ' <small>now</small>' : ''}</th>
      <td>${Math.round(o.shieldBlock * 100)}%</td>
      <td>${o.cost ? `−${o.cost} ⚡` : 'free'}</td>
      <td>+${fmt(o.perDay)}</td>
    </tr>`).join('');
  return `<h2>${icon('shield')} Shield</h2>
    <p>${esc(SHIELD_INFO.intro)}</p>
    <h3>Every level, with today’s radiation (${fmtTimes(rad)} normal)</h3>
    <table class="sh-table">
      <thead><tr><th scope="col">Shield</th><th scope="col">Blocks</th><th scope="col">Power a day</th><th scope="col">Dose a day</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p class="sh-note">${inShelter
      ? `The crew is in the shelter, so its walls block another ${Math.round(state.cfg.dose.shelterBlock * 100)}%. That is already in the dose numbers.`
      : `The crew is working. In the shelter, its walls would block another ${Math.round(state.cfg.dose.shelterBlock * 100)}%.`}${state.upgrades.walls ? ' Your regolith walls help too.' : ''}</p>
    ${part('shield', 'How it works', SHIELD_INFO.how)}
    ${part('bolt', 'What it costs', SHIELD_INFO.cost)}
    ${part('rocket', 'In real life', SHIELD_INFO.real)}
    ${part('science', 'Why it needs power', SHIELD_INFO.cold)}
    <div class="fact">${icon('info')}<span>${esc(SHIELD_INFO.today)}</span></div>
    <p class="sh-game">${icon('check')}<span><b>Game numbers:</b> how much each level blocks and the power it uses are made up for the game. The radiation is real NASA data.</span></p>
    <div class="sh-sources"><b>Sources</b><ul>${SHIELD_INFO.sources.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></div>`;
}

/** What a repair is called on its button: the job, in the kid's words. */
export function jobName(job) {
  const room = ROOMS[job.roomId].name.toLowerCase();
  return {
    leak: `Patch the leak in the ${room}`,
    filter: 'Swap the air filter',
    dust: 'Clean the solar panels',
    fort: 'Build the storm fort',
    rebuild: `Rebuild the ${room}`,
  }[job.kind] || `Fix the ${room}`;
}

/** Which open repairs belong to which bar: the problems that make this number go down. */
const FIXES_FOR = {
  air: (j) => j.kind === 'leak' || j.kind === 'filter' || (j.kind === 'rebuild' && j.roomId === 'greenhouse'),
  power: (j) => j.kind === 'dust',
  dose: (j) => j.kind === 'fort',
};

function openJobs(state, kind) {
  const fits = FIXES_FOR[kind];
  return fits ? ROOM_IDS.map((id) => repairFor(state, id)).filter((j) => j && fits(j)) : [];
}

/** The fix comes first: a kid who tapped a red bar wants to repair it, the explanation can wait. */
function fixesHTML(jobs) {
  if (!jobs.length) return '';
  return `<div class="fixes">${jobs.map((j) => `
    <button type="button" class="btn go fix" data-room="${j.roomId}">${icon('wrench')}<span>${esc(jobName(j))}<small class="sub">${j.kind === 'rebuild' ? `Costs ${j.cost} science points` : j.kind === 'dust' ? 'A short spacewalk' : 'Opens the repair'}</small></span></button>`).join('')}
  </div>`;
}

/** A fix button in a sheet: close the sheet, then open the repair. */
function wireFixes(sheet) {
  sheet.el.querySelectorAll('.fix[data-room]').forEach((b) => b.addEventListener('click', () => {
    sheet.close();
    infoActions.repair?.(b.dataset.room);
  }));
}

export function showMeterInfo(kind, state) {
  let html;
  const jobs = openJobs(state, kind);
  if (kind === 'shield') {
    html = shieldHTML(state);
    noteShieldSeen(state);
  } else if (kind === 'power') {
    html = `<h2>${icon('bolt')} Power</h2>
      ${fixesHTML(jobs)}
      <p>The battery stores electricity from the solar panels. Everything in the base needs some.</p>
      ${powerMeaning(state)}
      <h3>Where it goes, every day</h3>${table(powerBreakdown(state), '⚡')}
      <div class="fact">${icon('info')}<span>A night on the Moon lasts about 2 weeks. Real bases need big batteries, or a small nuclear power unit.</span></div>`;
  } else if (kind === 'air') {
    html = `<h2>${icon('air')} Air</h2>
      ${fixesHTML(jobs)}
      ${airMeaning(state)}
      ${loopHTML(state)}
      <h3>Where it goes, every day</h3>${table(airBreakdown(state), '%')}
      <div class="fact">${icon('info')}<span>On the space station, oxygen is made from water: electricity splits it into hydrogen and oxygen.</span></div>`;
    infoActions.loopSeen?.();
  } else {
    const d = doseNow(state);
    html = `<h2>${icon('radiation')} Crew dose</h2>
      ${fixesHTML(jobs)}
      <p>All the radiation your crew has taken on this mission. If it reaches ${state.cfg.dose.limit}, ${esc(CREWMATE_NAME)} sends everyone into the shelter.</p>
      ${doseMeaning(state)}
      <h3>Right now</h3>
      <ul class="flow">
        <li><span>Radiation outside (real NASA data)</span><b>${fmtTimes(d.rad)} normal</b></li>
        <li class="in"><span>Shield, shelter and walls block</span><b>${Math.round(d.block * 100)}%</b></li>
        <li class="total"><span>Gets to the crew every day</span><b>+${(Math.round(d.perDay * 10) / 10)}</b></li>
      </ul>
      <div class="fact">${icon('info')}<span>Without thick walls, about one year on the Moon would give an astronaut a whole career’s worth of radiation. That is why a Moon base needs shielding.</span></div>`;
  }
  html += `<div class="row"><button type="button" class="btn primary ok">${icon('check')}Got it</button></div>`;
  const sheet = openSheet(html, { className: 'info-sheet' });
  sheet.el.querySelector('.ok').addEventListener('click', () => sheet.close());
  wireFixes(sheet);
  const ls = sheet.el.querySelector('.ls');
  // A broken step in the loop offers its repair right where the kid tapped it.
  if (ls) wireLoop(ls, (key) => fixForStep(state, key), (roomId) => { sheet.close(); infoActions.repair?.(roomId); });
  return sheet;
}

/** The repair behind a broken loop step, if there is one. */
function fixForStep(state, key) {
  let job = null;
  if (key === 'filter') job = repairFor(state, 'hab');
  else if (key === 'plants') job = repairFor(state, 'greenhouse');
  else if (key === 'leak') job = ROOM_IDS.map((id) => repairFor(state, id)).find((j) => j?.kind === 'leak');
  if (key === 'filter' && job?.kind !== 'filter') job = null;
  return job ? { roomId: job.roomId, label: jobName(job) } : null;
}

/** Story at the start of a mission (mentor feedback: storytelling). */
export function showBriefing(doc, cfg, dateText, onClose) {
  const html = `
    <h2>${icon('rocket')} Mission briefing</h2>
    <p class="brief-date">${esc(dateText)}</p>
    <p>Your crew has just landed in the ${esc(cfg.site.name)}. Apollo 11 landed nearby in 1969. Your job: keep the base running for ${cfg.missionDays} days and do as much science as you can.</p>
    <div class="fact">${icon('sun')}<span><b>Space weather news:</b> ${esc(doc.summary || 'The Sun is getting active.')}</span></div>
    <p class="brief-real">${icon('check')}<span>This storm really happened. Its flares and radiation were measured by NASA spacecraft. You will live through it day by day.</span></p>
    <div class="row"><button type="button" class="btn primary ok">${icon('play')}Start the mission</button></div>`;
  const sheet = openSheet(html, { className: 'info-sheet brief', onClose });
  sheet.el.querySelector('.ok').addEventListener('click', () => sheet.close());
  return sheet;
}
