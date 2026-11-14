// SI disclosure: written with the SI tool Claude Code and reviewed by the team. See SI_USAGE.md and si-manifest.json.
// The life support loop (mentor feedback M2/M3): air and water go round in a circle, and the kid sees
// which step works right now. Plants and algae are helpers next to the loop, because machines make
// most of the oxygen (RESEARCH.md, section 3). Plain DOM, reads state through lifeLoop().

import { icon } from './icons.js';
import { esc } from './overlays.js';
import { LIFE_LOOP } from '../rules/content.js';
import { lifeLoop } from '../rules/mission.js';

// What each status looks like: a word for the kid, and good or bad (colour is never the only signal).
const STATUS = {
  ok: ['Working', 'good'],
  breathing: ['Breathing', 'good'],
  clogged: ['Clogged!', 'bad'],
  off: ['No power!', 'bad'],
  on: ['Lamps on', 'good'],
  dark: ['Lamps off', 'idle'],
  lost: ['Sealed', 'bad'],
  leak: ['Leaking!', 'bad'],
  none: ['Not built', 'idle'],
};

function node(key, ic, status, arrow) {
  const [word, tone] = STATUS[status];
  return `<button type="button" class="ls-node ${tone}" data-key="${key}">
    ${icon(ic)}<b>${esc(LIFE_LOOP[key].name)}</b><span class="ls-st">${word}</span>
    ${arrow ? `<span class="ls-arrow ${arrow.dir}" aria-hidden="true">${esc(arrow.label)}</span>` : ''}
  </button>`;
}

/** HTML for the loop. Call wireLoop() on the sheet after it opens. */
export function loopHTML(state) {
  const l = lifeLoop(state);
  return `<div class="ls">
    <p class="ls-intro">${esc(LIFE_LOOP.intro)}</p>
    <div class="ls-ring" role="group" aria-label="Life support loop">
      ${node('crew', 'air', l.crew, { dir: 'right', label: 'used air' })}
      ${node('filter', 'filter', l.filter, { dir: 'down', label: 'water' })}
      ${node('oxygen', 'bolt', l.oxygen, { dir: 'up', label: 'O₂' })}
      ${node('water', 'drop', l.water, { dir: 'left', label: 'clean water' })}
    </div>
    <div class="ls-helpers">
      ${node('plants', 'plant', l.plants)}
      ${node('algae', 'science', l.algae)}
    </div>
    ${l.leak ? `<button type="button" class="ls-leak" data-key="leak">${icon('drop')}<span><b>Leak in the ${esc(l.leak.toLowerCase())}!</b> ${esc(LIFE_LOOP.leak)}</span></button>` : ''}
    <p class="ls-detail" aria-live="polite">Tap a step to learn what it does.</p>
  </div>`;
}

/**
 * Tap a step: its sentence appears below the loop. If that step is broken (`fixFor(key)` returns a job),
 * a repair button appears with it, so the kid can fix it right there (`onFix(roomId)`).
 */
export function wireLoop(root, fixFor = () => null, onFix = () => {}) {
  const detail = root.querySelector('.ls-detail');
  root.querySelectorAll('.ls-node, .ls-leak').forEach((b) => b.addEventListener('click', () => {
    root.querySelectorAll('.ls-node.sel').forEach((x) => x.classList.remove('sel'));
    b.classList.add('sel');
    const key = b.dataset.key;
    const e = key === 'leak' ? { name: 'Leak', text: LIFE_LOOP.leak } : LIFE_LOOP[key];
    const fix = fixFor(key);
    detail.innerHTML = `<b>${esc(e.name)}:</b> ${esc(e.text)}${fix
      ? `<button type="button" class="btn go fix ls-fix" data-room="${fix.roomId}">${icon('wrench')}${esc(fix.label)}</button>` : ''}`;
    detail.querySelector('.ls-fix')?.addEventListener('click', () => onFix(fix.roomId));
  }));
}

/**
 * The plant lamp switch at the top of the greenhouse sheet: the one thing the kid can change here,
 * so it comes first, and it looks like the switches in the pause menu. It flips in place.
 */
export function lampHTML(state) {
  if (state.rooms.greenhouse.status !== 'ok') return '';
  const on = state.growLights && !state.powerEmergency;
  const cost = state.cfg.power.growLightsPerDay;
  const help = state.cfg.air.greenhouseBonusPerDay;
  const text = state.powerEmergency
    ? 'Off: the battery is empty.'
    : on ? `Plants help the air: +${help}% a day. The lamps use ${cost} ⚡ a day.`
      : `Saves ${cost} ⚡ a day, but the plants don’t help the air.`;
  return `<button type="button" class="pz-toggle lamp-toggle" role="switch" aria-checked="${on}" ${state.powerEmergency ? 'disabled' : ''}>
    ${icon('sun')}
    <span class="pz-text"><b>Plant lamps</b><small>${esc(text)}</small></span>
    <span class="pz-switch" aria-hidden="true"><span class="pz-knob"></span><span class="pz-state">${on ? 'On' : 'Off'}</span></span>
  </button>`;
}
