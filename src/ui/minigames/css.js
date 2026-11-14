// SI disclosure: written with the SI tool Claude Code and reviewed by the team. See SI_USAGE.md and si-manifest.json.
// Mini-games bring their own styles, so the shared stylesheet stays untouched.

/** Load a stylesheet that sits next to a mini-game module (once). */
export function loadCss(file, base) {
  if (typeof document === 'undefined') return;
  const href = new URL(file, base).href;
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}
