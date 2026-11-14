// SI disclosure: written with the SI tool Claude Code and reviewed by the team. See SI_USAGE.md and si-manifest.json.
// Start screen (mission select) and end screen (debrief). Plain DOM, no game rules.

import { icon, soundButton } from './icons.js';
import { BADGES } from '../rules/content.js';
import { esc } from './overlays.js';
import { LEVEL_ORDER, isUnlocked, rankFor } from '../progress.js';
import { fmtTimes } from '../rules/mission.js';

export const GAME_TITLE = 'Moon Base Commander'; // (open) final name decided by the team

const SOURCES = `Real data: space weather from <a href="https://ccmc.gsfc.nasa.gov/tools/DONKI/" target="_blank" rel="noopener">NASA DONKI</a>,
  radiation from <a href="https://visualization.osdr.nasa.gov/radlab/" target="_blank" rel="noopener">NASA OSDR RadLab</a>
  (archived measurements, not live). Made for the NASA Space Apps Challenge 2026 by team Alpha Centauri First. Not made or endorsed by NASA.
  Code written with help from SI tools (Claude Code). The placeholder pictures are SI-generated and marked in the game. No SI-generated audio.`;

function strength(peak) {
  const n = peak < 20 ? 1 : peak < 120 ? 2 : peak < 1000 ? 3 : 4;
  return `<span class="strength" aria-label="Storm strength ${n} of 4">${[1, 2, 3, 4].map((i) => `<i class="${i <= n ? 'on' : ''}" style="height:${6 + i * 3}px"></i>`).join('')}</span>`;
}

function starRow(n) {
  return `<span class="stars" aria-label="${n} of 3 stars">${[1, 2, 3].map((i) => icon('star', i <= n ? '' : 'off')).join('')}</span>`;
}

function badgeShelf(have) {
  const ids = Object.keys(BADGES);
  const got = ids.filter((id) => have[id]).length;
  return `<section class="shelf" aria-label="Badges">
    <h2>Badges: ${got} of ${ids.length}</h2>
    <ul class="badges">${ids.map((id) => `<li class="${have[id] ? 'got' : ''}">${icon('medal')}<span><b>${esc(BADGES[id].title)}</b><small>${esc(BADGES[id].text)}</small></span></li>`).join('')}</ul>
  </section>`;
}

export function renderStart(root, { index, progress, unlockAll, next, onStart }) {
  const byId = Object.fromEntries(index.storms.map((s) => [s.id, s]));
  const nextStorm = byId[next];
  const el = document.createElement('div');
  el.className = 'screen start';
  el.innerHTML = `<div class="screen-tools">${soundButton(progress.sound)}</div><div class="screen-inner">
    <h1 class="title">${esc(GAME_TITLE)}</h1>
    <p class="pitch">Run a base on the Moon for 30 days. A real solar storm is on its way. Keep your crew safe, and keep the science going.</p>
    <button type="button" class="btn primary big-start" data-id="${esc(next)}">${icon('rocket')}Start: ${esc(nextStorm?.title ?? next)}</button>
    <p class="credit">Your rank: <b>${rankFor(progress)}</b>. Each finished storm unlocks the next one.</p>
    <ul class="levels">
      ${LEVEL_ORDER.filter((id) => byId[id]).map((id, i) => {
        const s = byId[id];
        const open = isUnlocked(id, progress, unlockAll);
        const prev = byId[LEVEL_ORDER[i - 1]];
        const stars = progress.stars[id] || 0;
        return `<li><button type="button" class="level ${id === next ? 'next' : ''}" data-id="${esc(id)}" ${open ? '' : 'disabled'}>
          <h3>${open ? '' : icon('lock')}${esc(s.title)}</h3>
          <p>${open ? esc(s.summary ?? '') : `Finish the ${esc(prev?.title ?? 'previous storm')} first.`}</p>
          <span class="lv-meta">${strength(s.peakTimesNormal?.moonOrbit ?? 1)}${stars ? starRow(stars) : ''}</span>
        </button></li>`;
      }).join('')}
    </ul>
    ${badgeShelf(progress.badges || {})}
    <p class="credit">${SOURCES}</p>
  </div>`;
  root.appendChild(el);
  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-id]');
    if (b && !b.disabled) onStart(b.dataset.id);
  });
  return el;
}

const HEADLINES = ['Mission complete!', 'Mission complete. Well done!', 'Great mission, Commander!', 'Perfect mission!'];

export function renderEnd(root, { summary: s, doc, rankBefore, rankAfter, nextId, nextTitle, newBadges = [], sound = true, onNext, onAgain, onMenu }) {
  const el = document.createElement('div');
  el.className = 'screen end';
  const badgeList = (s.badges || []).map((id) => `<li class="got ${newBadges.includes(id) ? 'new' : ''}">${icon('medal')}<span><b>${esc(BADGES[id].title)}</b><small>${newBadges.includes(id) ? 'New badge!' : esc(BADGES[id].text)}</small></span></li>`).join('');
  const rows = [];
  if (s.moonPeak) {
    rows.push(['Near the Moon', s.moonPeak.times]);
    if (s.sameDay?.deepSpace != null) rows.push(['Deep space', s.sameDay.deepSpace]);
    if (s.sameDay?.mars != null) rows.push(['On Mars', s.sameDay.mars]);
    if (s.sameDay?.iss != null) rows.push(['Space station', s.sameDay.iss]);
  }
  const maxLog = Math.log10(Math.max(10, ...rows.map((r) => r[1])));
  const peakDate = s.moonPeak ? new Date(`${s.moonPeak.iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : '';
  el.innerHTML = `<div class="screen-tools">${soundButton(sound)}</div><div class="screen-inner">
    <h1>${HEADLINES[s.stars]}</h1>
    <div class="bigstars" aria-label="${s.stars} of 3 stars">${[1, 2, 3].map((i) => icon('star', i <= s.stars ? '' : 'off')).join('')}</div>
    ${rankAfter !== rankBefore ? `<p class="pitch">New rank: <b>${esc(rankAfter)}</b>!</p>` : ''}
    ${s.praise ? `<p class="praise">${esc(s.praise)}</p>` : ''}
    <div class="stats">
      <div class="stat"><b>${s.science}</b><span>science points (goal ${s.scienceTarget})</span></div>
      <div class="stat"><b>${s.dose}/${s.doseLimit}</b><span>crew radiation dose</span></div>
      <div class="stat"><b>${s.blockedPct}%</b><span>of the radiation blocked</span></div>
      <div class="stat"><b>${s.leaksFixed}</b><span>${s.leaksFixed === 1 ? 'leak' : 'leaks'} fixed</span></div>
    </div>
    ${rows.length ? `<section class="compare">
      <h2>The real storm, ${esc(peakDate)}</h2>
      ${rows.map(([label, v]) => `<div class="cmp"><span>${label}</span><span class="track"><i style="width:${Math.max(3, (Math.log10(Math.max(1, v)) / maxLog) * 100)}%"></i></span><b>${fmtTimes(v)}</b></div>`).join('')}
      <p class="cmp-note">Times normal radiation, measured by NASA spacecraft that day.
        ${s.sameDay?.mars != null ? 'Mars has a thin atmosphere that helps a little.' : ''}
        ${s.sameDay?.iss != null ? 'The space station is inside Earth’s magnetic field, which bends the particles away.' : ''}
        The Moon has neither, so it gets the full storm.</p>
    </section>` : ''}
    <div class="tip">${icon('star')}<span>${esc(s.tip)}</span></div>
    ${badgeList ? `<section class="shelf"><h2>Badges this mission</h2><ul class="badges">${badgeList}</ul></section>` : ''}
    ${s.words.length ? `<section><h2 style="margin:0 0 8px;font-size:20px">Words you learned</h2>
      <ul class="words">${s.words.map((w) => `<li><b>${icon('check')} ${esc(w.word)}</b><span>${esc(w.text)}</span></li>`).join('')}</ul></section>` : ''}
    <div class="row">
      ${nextId ? `<button type="button" class="btn primary next">${icon('rocket')}Next: ${esc(nextTitle)}</button>` : ''}
      <button type="button" class="btn ${nextId ? 'quiet' : 'primary'} again">${icon('restart')}Play this storm again</button>
      <button type="button" class="btn quiet menu">${icon('back')}All missions</button>
    </div>
    <p class="credit">${esc(doc.displayLabel)}. ${SOURCES}</p>
  </div>`;
  root.appendChild(el);
  el.querySelector('.next')?.addEventListener('click', onNext);
  el.querySelector('.again').addEventListener('click', onAgain);
  el.querySelector('.menu').addEventListener('click', onMenu);
  return el;
}

export function renderError(root, message) {
  const el = document.createElement('div');
  el.className = 'screen';
  el.innerHTML = `<div class="screen-inner"><h1 class="title" style="font-size:40px">Houston, we have a problem</h1>
    <p class="pitch">${esc(message)}</p></div>`;
  root.appendChild(el);
}
