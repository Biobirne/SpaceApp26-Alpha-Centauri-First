// SI disclosure: written with the SI tool Claude Code and reviewed by the team. See SI_USAGE.md and si-manifest.json.
// Which storms the player has finished. Stored only in this browser (localStorage), nothing else.
// The storage can be missing (private mode, blocked site data), so every access is guarded.

const KEY = 'moonbase.progress.v1';

/**
 * Suggested order from GAME_DESIGN.md: gentle → extreme. Feb 2022 comes last because its storm
 * misses the Moon (the aim lesson).
 *
 * Nov 2025 stays in `data/storms/` but is NOT a Moon level: there is no `moonOrbit` radiation
 * measurement for that window, only deep space. It is kept for the planned deep-space / Mars
 * mission (GAME_DESIGN.md, "Rocket to Mars").
 */
export const LEVEL_ORDER = ['oct2021', 'may2024', 'mar2024', 'sep2017', 'feb2022'];

// Without storage we still keep progress for this page visit.
let memory = null;

const DEFAULTS = () => ({ stars: {}, hints: true, seen: {}, sound: true, readAloud: false, badges: {} });

export function loadProgress() {
  try {
    const raw = localStorage.getItem(KEY);
    const data = raw ? JSON.parse(raw) : null;
    if (data && typeof data.stars === 'object') return { ...DEFAULTS(), ...data };
  } catch { /* storage unavailable: play without saving */ }
  return memory ? structuredClone(memory) : DEFAULTS();
}

function save(p) {
  memory = structuredClone(p);
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* ignore */ }
  return p;
}

export function saveResult(id, stars) {
  const p = loadProgress();
  p.stars[id] = Math.max(p.stars[id] || 0, stars);
  return save(p);
}

/** Guided first steps: each hint shows once. Turning hints back on shows them all again. */
export function markHintSeen(id) {
  const p = loadProgress();
  p.seen[id] = true;
  save(p);
}

export function setHints(on) {
  const p = loadProgress();
  p.hints = on;
  if (on) p.seen = {};
  return save(p);
}

/** Simple on/off settings: sound, readAloud. */
export function setPref(key, value) {
  const p = loadProgress();
  p[key] = value;
  return save(p);
}

/** Add badges to the collection; returns the ones that are new. */
export function saveBadges(ids) {
  const p = loadProgress();
  const fresh = ids.filter((id) => !p.badges[id]);
  for (const id of ids) p.badges[id] = true;
  save(p);
  return fresh;
}

export function isUnlocked(id, progress, unlockAll = false) {
  const i = LEVEL_ORDER.indexOf(id);
  // An id that is not a Moon level (for example the deep-space Nov 2025 storm) is never startable.
  if (i < 0) return false;
  if (unlockAll) return true;
  if (i === 0) return true;
  return Boolean(progress.stars[LEVEL_ORDER[i - 1]]);
}

/** The first unlocked storm without stars, or the last one. */
export function nextLevel(progress, unlockAll = false) {
  return LEVEL_ORDER.find((id) => isUnlocked(id, progress, unlockAll) && !progress.stars[id]) || LEVEL_ORDER[0];
}

/** Titles grow with play: Cadet → Flight Engineer → Base Commander. */
export function rankFor(progress) {
  const total = Object.values(progress.stars).reduce((a, b) => a + b, 0);
  if (total >= 8) return 'Base Commander';
  if (total >= 3) return 'Flight Engineer';
  return 'Cadet';
}
