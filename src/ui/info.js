// SI disclosure: written with the SI tool Claude Code and reviewed by the team. See SI_USAGE.md and si-manifest.json.
// "Learn more" sheets for curious players (mentor feedback): tap a building or a bar to see what it
// does, how it works for real, what it is built from, and where your power and air go right now.
// Plain DOM. Reads state through the rules' helper functions, never changes it.

import { icon } from './icons.js';
import { openSheet, esc } from './overlays.js';
import { ROOMS, ROOM_INFO, CREWMATE_NAME } from '../rules/content.js';
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
    ${part('check', 'What it does', info.does)}
    ${roomId === 'greenhouse' ? lampHTML(state) : ''}
    ${part('rocket', 'In real life', info.real)}
    ${part('wrench', 'Built from', info.built)}
    <div class="fact">${icon('info')}<span>${esc(info.fact)}</span></div>
    <div class="row"><button type="button" class="btn primary ok">${icon('check')}Got it</button></div>`;
  const sheet = openSheet(html, { className: 'info-sheet' });
  sheet.el.querySelector('.ok').addEventListener('click', () => sheet.close());
  sheet.el.querySelector('.lamp-btn')?.addEventListener('click', () => {
    infoActions.growLights?.(!(state.growLights && !state.powerEmergency));
    sheet.close();
  });
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

export function showMeterInfo(kind, state) {
  let html;
  if (kind === 'power') {
    html = `<h2>${icon('bolt')} Power</h2>
      <p>The battery stores electricity from the solar panels. Everything in the base needs some.</p>
      ${powerMeaning(state)}
      <h3>Where it goes, every day</h3>${table(powerBreakdown(state), '⚡')}
      <div class="fact">${icon('info')}<span>A night on the Moon lasts about 2 weeks. Real bases need big batteries, or a small nuclear power unit.</span></div>`;
  } else if (kind === 'air') {
    html = `<h2>${icon('air')} Air</h2>
      ${airMeaning(state)}
      ${loopHTML(state)}
      <h3>Where it goes, every day</h3>${table(airBreakdown(state), '%')}
      <div class="fact">${icon('info')}<span>On the space station, oxygen is made from water: electricity splits it into hydrogen and oxygen.</span></div>`;
    infoActions.loopSeen?.();
  } else {
    const d = doseNow(state);
    html = `<h2>${icon('radiation')} Crew dose</h2>
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
  const ls = sheet.el.querySelector('.ls');
  if (ls) wireLoop(ls);
  return sheet;
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
