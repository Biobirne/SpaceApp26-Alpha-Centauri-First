// SI disclosure: written with the SI tool Claude Code and reviewed by the team. See SI_USAGE.md and si-manifest.json.
// Guidance shared by the mini-games: numbered steps, Sam's line with the instruction first,
// and a "Tap" pointer on exactly the thing that is next. A kid who reads nothing can still follow the pointer.

/** The numbered steps under Sam's line. `names` are short, e.g. ['Pull out', 'Build adapter', 'Push in']. */
export const stepsHtml = (names) => `<ol class="mg-steps" aria-label="Steps">${names.map((n, i) => `<li data-n="${i}"><b>${i + 1}</b><span>${n}</span></li>`).join('')}</ol>`;

/**
 * Wire up the guidance inside a mounted mini-game.
 * Returns { step(n), say(doThis, why), point(el) }.
 */
export function createGuide(game) {
  const steps = [...game.querySelectorAll('.mg-steps li')];
  const sam = game.querySelector('.mg-sam span');
  const tag = document.createElement('span');
  tag.className = 'mg-point';
  tag.textContent = 'Tap';
  tag.hidden = true;
  game.appendChild(tag);
  let target = null;

  const place = () => {
    if (!target || !target.isConnected || !game.isConnected) { tag.hidden = true; return; }
    const g = game.getBoundingClientRect();
    const r = target.getBoundingClientRect();
    tag.hidden = false;
    tag.style.left = `${r.left - g.left + r.width / 2 + game.scrollLeft}px`;
    tag.style.top = `${r.top - g.top + game.scrollTop}px`;
  };
  const onResize = () => place();
  addEventListener('resize', onResize);
  // The layout can still settle after a step change (fonts, transitions), so follow the target for a moment.
  const follow = () => { let n = 0; const id = setInterval(() => { place(); if (++n > 12 || !game.isConnected) { clearInterval(id); if (!game.isConnected) removeEventListener('resize', onResize); } }, 120); };

  return {
    /** Mark step n (from 0) as the current one; earlier steps are done. */
    step(n) {
      steps.forEach((li, i) => { li.dataset.state = i < n ? 'done' : i === n ? 'now' : 'todo'; });
    },
    /** Sam says what to do (bold, first) and why (after it). */
    say(doThis, why = '') {
      sam.innerHTML = `<strong>${doThis}</strong>${why ? ` ${why}` : ''}`;
    },
    /** Put the pointer and the glow on one element (or pass null to hide them). */
    point(el) {
      target?.classList.remove('mg-target');
      target = el || null;
      target?.classList.add('mg-target');
      place();
      follow();
    },
  };
}
