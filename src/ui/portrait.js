// SI disclosure: written with the SI tool Claude Code and reviewed by the team. See SI_USAGE.md and si-manifest.json.
// A phone held sideways gets a note: this game is made for an upright phone.
// Nothing is rotated or locked (a web page cannot do that). The note goes away when the phone is
// upright again, and "Play anyway" hides it for good, in case a device reports its shape wrongly.
// Tablets and computers never see it: it needs a touch screen that is wide and very low.

const CSS_URL = new URL('./portrait.css', import.meta.url).href;
if (typeof document !== 'undefined' && !document.querySelector(`link[href="${CSS_URL}"]`)) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = CSS_URL;
  document.head.appendChild(link);
}

/** A touch screen in landscape that is at most 500 px high: a phone on its side, not a tablet. */
const SIDEWAYS_PHONE = '(orientation: landscape) and (max-height: 500px) and (pointer: coarse)';
const KEY = 'moonbase.playSideways';

/**
 * Show the note whenever a phone lies on its side. `onShow` runs each time it appears,
 * so the game can pause. Returns nothing; the note manages itself.
 */
export function watchPortrait({ onShow } = {}) {
  if (typeof matchMedia !== 'function') return;
  const mq = matchMedia(SIDEWAYS_PHONE);
  let note = null;
  const dismissed = () => { try { return sessionStorage.getItem(KEY) === '1'; } catch { return false; } };

  const hide = () => { note?.remove(); note = null; };
  const show = () => {
    if (note || dismissed()) return;
    note = document.createElement('div');
    note.className = 'portrait-note';
    note.setAttribute('role', 'dialog');
    note.setAttribute('aria-label', 'Please hold your phone upright');
    note.innerHTML = `
      <div class="pn-phone" aria-hidden="true"></div>
      <h2>Please hold your phone upright</h2>
      <p>This game is made for an upright phone.</p>
      <button type="button" class="pn-anyway">Play sideways anyway</button>`;
    note.querySelector('.pn-anyway').addEventListener('click', () => {
      try { sessionStorage.setItem(KEY, '1'); } catch { /* private mode: it just asks again next time */ }
      hide();
    });
    document.body.appendChild(note);
    onShow?.();
  };

  const sync = () => (mq.matches ? show() : hide());
  mq.addEventListener('change', sync);
  sync();
}
