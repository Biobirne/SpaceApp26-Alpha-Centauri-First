// SI disclosure: written with the SI tool Claude Code and reviewed by the team. See SI_USAGE.md and si-manifest.json.
// Start screen (mission select) and end screen (debrief). Plain DOM, no game rules.

import { icon, soundButton } from './icons.js';
import { BADGES, DIFFICULTY } from '../rules/content.js';
import { esc } from './overlays.js';
import { LEVEL_ORDER, isUnlocked, rankFor } from '../progress.js';
import { fmtTimes } from '../rules/mission.js';

export const GAME_TITLE = 'Moon Base Commander'; // (open) final name decided by the team

const SOURCES = `Real data: space weather from <a href="https://ccmc.gsfc.nasa.gov/tools/DONKI/" target="_blank" rel="noopener">NASA DONKI</a>,
  radiation from <a href="https://visualization.osdr.nasa.gov/radlab/" target="_blank" rel="noopener">NASA OSDR RadLab</a>
  (archived measurements, not live). Made for the NASA Space Apps Challenge 2026 by team Alpha Centauri First. Not made or endorsed by NASA.
  Code written with help from SI tools (Claude Code). All graphics are drawn in code: no image files and no SI-generated images or audio.`;

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

function difficultyPicker(current) {
  return `<section class="difficulty" aria-label="Difficulty">
    <div class="diff-seg" role="radiogroup">
      ${Object.entries(DIFFICULTY).map(([k, d]) => `<button type="button" role="radio" data-diff="${k}" aria-checked="${k === current}">${esc(d.label)}</button>`).join('')}
    </div>
    <p class="diff-text">${esc(DIFFICULTY[current].text)}</p>
  </section>`;
}

export function renderStart(root, { index, progress, unlockAll, next, onStart, onHelp, onDifficulty, onTraining }) {
  const byId = Object.fromEntries(index.storms.map((s) => [s.id, s]));
  const nextStorm = byId[next];
  const allDone = LEVEL_ORDER.every((id) => progress.stars[id]);
  const el = document.createElement('div');
  el.className = 'screen start';
  el.innerHTML = `<div class="screen-tools">${soundButton(progress.sound)}</div><div class="screen-inner">
    <h1 class="title">${esc(GAME_TITLE)}</h1>
    <p class="pitch">Run a base on the Moon for 30 days. A real solar storm is on its way. Keep your crew safe, and keep the science going.</p>
    <p class="real-note">${icon('check')}<span>The storms really happened. The radiation numbers were measured by NASA spacecraft.</span></p>
    ${difficultyPicker(DIFFICULTY[progress.difficulty] ? progress.difficulty : 'normal')}
    <button type="button" class="btn primary big-start" data-id="${esc(next)}">${icon('rocket')}${allDone ? 'Play again' : 'Start'}: ${esc(nextStorm?.title ?? next)}</button>
    <button type="button" class="btn quiet howto">${icon('book')}How it works</button>
    <button type="button" class="btn quiet training">${icon('wrench')}Training: build the base</button>
    <p class="credit">Your rank: <b>${rankFor(progress)}</b>. ${allDone ? 'You finished every storm! Play any of them again for more stars and badges.' : 'Each finished storm unlocks the next one.'}</p>
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
  el.querySelector('.howto').addEventListener('click', () => onHelp());
  el.querySelector('.training').addEventListener('click', () => onTraining?.());
  for (const b of el.querySelectorAll('[data-diff]')) {
    b.addEventListener('click', () => {
      for (const x of el.querySelectorAll('[data-diff]')) x.setAttribute('aria-checked', String(x === b));
      el.querySelector('.diff-text').textContent = DIFFICULTY[b.dataset.diff].text;
      onDifficulty(b.dataset.diff);
    });
  }
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
    rows.push(['Near the Moon', s.moonPeak.times, s.moonPeak.iso]);
    for (const c of s.comparisons || []) rows.push([c.label, c.times, c.iso]);
  }
  const mars = (s.comparisons || []).find((c) => c.site === 'marsSurface');
  const iss = (s.comparisons || []).find((c) => c.site === 'iss');
  const moonTimes = s.moonPeak?.times ?? 1;
  // Only say what the numbers show. Mars was hit in Sep 2017 and Oct 2021 too (its thin air and
  // its distance made it weaker), so "outside the storm's path" would be wrong there.
  const moonHit = moonTimes >= 20;
  const marsNote = !mars ? '' : !moonHit && mars.times > moonTimes * 1.5
    ? 'This time Mars got more of the storm than the Moon.'
    : mars.times >= 1.5
      ? 'Mars has a thin atmosphere that helps a little.'
      : 'Mars hardly felt this storm.';
  const issNote = !iss ? '' : moonHit && iss.times < 3
    ? 'The space station is inside Earth’s magnetic field, which bends the particles away.'
    : 'The space station stayed close to its normal level.';
  const moonNote = moonHit
    ? 'The Moon has no thick air and no magnetic field, so it gets the full storm.'
    : 'The Moon stayed calm this time.';
  // A date only where there was a clear peak: the highest day of a calm month is just noise.
  const CLEAR_PEAK = 2;
  const maxLog = Math.log10(Math.max(10, ...rows.map((r) => r[1])));
  const peakDate = s.moonPeak ? new Date(`${s.moonPeak.iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : '';
  const fmtDay = (iso) => iso ? new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }) : '';
  el.innerHTML = `<div class="screen-tools">${soundButton(sound)}</div><div class="screen-inner">
    <h1>${s.stars === 3 && s.setbacks > 0 ? HEADLINES[2] : HEADLINES[s.stars]}</h1>
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
      <h2>The same storm, everywhere NASA measured</h2>
      ${rows.map(([label, v, iso]) => `<div class="cmp"><span>${label}<small class="cmp-date">${iso && v >= CLEAR_PEAK ? fmtDay(iso) : ''}</small></span><span class="track"><i style="width:${Math.max(3, (Math.log10(Math.max(1, v)) / maxLog) * 100)}%"></i></span><b>${fmtTimes(v)}</b></div>`).join('')}
      <p class="cmp-note">Each bar is the highest day at that place in the same 30 days, measured by NASA spacecraft. The peaks can fall on different days${s.moonPeak && moonHit ? ` (the Moon’s was ${esc(peakDate)})` : ''}.
        ${marsNote}
        ${issNote}
        ${moonNote}</p>
    </section>` : ''}
    ${s.difficulty !== 'normal' ? `<p class="diff-done">Played on ${esc(DIFFICULTY[s.difficulty].label)}.</p>` : ''}
    ${s.calls > 0 ? `<p class="diff-done">Mission Control helped you ${s.calls} ${s.calls === 1 ? 'time' : 'times'}.${s.stars === 3 ? ' Next challenge: 3 stars without a call!' : ''}</p>` : ''}
    ${s.lessons?.length ? `<section class="lessons"><h2>What went wrong, and why</h2>
      <ul>${s.lessons.map((l) => `<li><b>Day ${l.day}: ${esc(l.title)}</b><span>${esc(l.why)}</span><span class="next">${icon('star')}Next time: ${esc(l.next)}</span></li>`).join('')}</ul>
      <p class="lessons-note">Mistakes are how real mission teams learn. Try again and see what changes!</p></section>`
    : `<div class="tip">${icon('star')}<span>${esc(s.tip)}</span></div>`}
    ${badgeList ? `<section class="shelf"><h2>Badges this mission</h2><ul class="badges">${badgeList}</ul></section>` : ''}
    ${s.words.length ? `<section><h2 style="margin:0 0 8px;font-size:20px">Words you learned</h2>
      <ul class="words">${s.words.map((w) => `<li><b>${icon('check')} ${esc(w.word)}</b><span>${esc(w.text)}</span></li>`).join('')}</ul></section>` : ''}
    <div class="row">
      ${nextId ? `<button type="button" class="btn primary next">${icon('rocket')}Next: ${esc(nextTitle)}</button>` : ''}
      <button type="button" class="btn ${nextId ? 'quiet' : 'primary'} again">${icon('restart')}Play this storm again</button>
      <button type="button" class="btn quiet menu">${icon('home')}Main menu</button>
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
