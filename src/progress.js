// Which storms the player has finished. Stored only in this browser (localStorage), nothing else.
// The storage can be missing (private mode, blocked site data), so every access is guarded.

const KEY = 'moonbase.progress.v1';

/** Suggested order from GAME_DESIGN.md: gentle → extreme. Feb 2022 and Nov 2025 come last. */
export const LEVEL_ORDER = ['oct2021', 'may2024', 'mar2024', 'sep2017', 'feb2022', 'nov2025'];

export function loadProgress() {
  try {
    const raw = localStorage.getItem(KEY);
    const data = raw ? JSON.parse(raw) : null;
    if (data && typeof data.stars === 'object') return data;
  } catch { /* storage unavailable: play without saving */ }
  return { stars: {} };
}

export function saveResult(id, stars) {
  const p = loadProgress();
  p.stars[id] = Math.max(p.stars[id] || 0, stars);
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* ignore */ }
  return p;
}

export function isUnlocked(id, progress, unlockAll = false) {
  if (unlockAll) return true;
  const i = LEVEL_ORDER.indexOf(id);
  if (i <= 0) return true;
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
