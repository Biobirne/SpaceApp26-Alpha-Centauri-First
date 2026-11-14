// Self-made line icons (24×24, stroke = currentColor). No third-party icon set, nothing to credit.

const sector = (r1, r2, a0, a1) => {
  const p = (r, a) => `${(12 + r * Math.cos((a * Math.PI) / 180)).toFixed(2)} ${(12 + r * Math.sin((a * Math.PI) / 180)).toFixed(2)}`;
  return `M${p(r1, a0)}L${p(r2, a0)}A${r2} ${r2} 0 0 1 ${p(r2, a1)}L${p(r1, a1)}A${r1} ${r1} 0 0 0 ${p(r1, a0)}Z`;
};
const trefoil = [-150, -30, 90].map((c) => sector(3.4, 10, c - 30, c + 30)).join('');

const PATHS = {
  bolt: '<path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12z"/>',
  air: '<path d="M3 8.5h10a3 3 0 1 0-3-3M3 12.5h14.5a3 3 0 1 1-3 3M3 16.5h6"/>',
  radiation: `<path d="${trefoil}" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none"/>`,
  science: '<path d="M9 3h6M10 3v6.2L4.8 18a2 2 0 0 0 1.7 3h11a2 2 0 0 0 1.7-3L14 9.2V3"/><path d="M7.4 15h9.2"/>',
  shield: '<path d="M12 3 4.5 6v5.8c0 4.6 3.2 7.9 7.5 9.2 4.3-1.3 7.5-4.6 7.5-9.2V6z"/>',
  shelter: '<path d="M3 20h18M5 20v-6.5a7 7 0 0 1 14 0V20"/><path d="M10 20v-4h4v4"/>',
  dish: '<path d="M4.5 9.5a8 8 0 0 0 10 10z"/><path d="M9.5 14.5 13 11M15 3a6 6 0 0 1 6 6M15 6.6a2.4 2.4 0 0 1 2.4 2.4"/>',
  wrench: '<path d="M14.5 3.5a5 5 0 0 0-4.3 7.2L3.4 17.5a1.8 1.8 0 0 0 2.6 2.6l6.8-6.8A5 5 0 0 0 20 8.5l-3 1.2-2.7-2.7L15.5 4z"/>',
  chart: '<path d="M4 4v16h16M8 16v-3M12 16V8M16 16v-6"/>',
  pause: '<path d="M8.5 5v14M15.5 5v14"/>',
  play: '<path d="M7 4.5v15l12.5-7.5z" fill="currentColor"/>',
  fast: '<path d="M2.5 5.5v13l9-6.5zM12.5 5.5v13l9-6.5z" fill="currentColor"/>',
  sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.2M12 19.8V22M2 12h2.2M19.8 12H22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6"/>',
  moon: '<path d="M19.5 14.6A8 8 0 1 1 9.4 4.5a6.4 6.4 0 0 0 10.1 10.1z"/>',
  star: '<path d="m12 2.8 2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3-4.6-4.4 6.3-.9z"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3"/>',
  check: '<path d="m4.5 12.5 5 5 10-11"/>',
  drop: '<path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11z"/>',
  book: '<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5zM5 19.5A1.5 1.5 0 0 0 6.5 21H19"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  restart: '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4v4.5H9"/>',
  rocket: '<path d="M12 2.5c3 2.3 4.5 5.6 4.5 9.5l-1.8 4.5H9.3L7.5 12c0-3.9 1.5-7.2 4.5-9.5z"/><circle cx="12" cy="9.5" r="1.7"/><path d="M7.6 13.5 5 16v3l4.3-2.5M16.4 13.5 19 16v3l-4.3-2.5M10.5 19.5 12 22l1.5-2.5"/>',
  filter: '<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 5v14M12 5v14M16 5v14"/>',
  plant: '<path d="M12 21v-9M12 12c0-4 3-7 7-7 0 4-3 7-7 7zM12 15c0-3-2.5-5.5-6-5.5 0 3.5 2.5 5.5 6 5.5z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
};

export function icon(name, cls = '') {
  return `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${PATHS[name] || ''}</svg>`;
}

/** The crewmate: a round helmet with a visor. Self-made placeholder until the team's art lands. */
export function crewAvatar(mood = 'calm') {
  return `<svg class="avatar" data-mood="${mood}" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
    <circle cx="32" cy="34" r="25" class="av-helmet"/>
    <rect x="14" y="22" width="36" height="24" rx="12" class="av-visor"/>
    <path d="M20 28c3-3 8-4 12-3.5" class="av-glint"/>
    <circle cx="25.5" cy="35" r="2.6" class="av-eye"/><circle cx="38.5" cy="35" r="2.6" class="av-eye"/>
    <path class="av-mouth" d="${mood === 'alert' ? 'M28 41.5h8' : 'M27.5 40.5q4.5 3.5 9 0'}"/>
    <path d="M32 9V3.5" class="av-antenna"/><circle cx="32" cy="3.5" r="2.5" class="av-light"/>
  </svg>`;
}
