// SI disclosure: written with the SI tool Claude Code and reviewed by the team. See SI_USAGE.md and si-manifest.json.
// Turns a storm file from data/storms/ into a per-day timeline the mission can play.

const DAY_MS = 86400000;
const CLASS_ORDER = { A: 0, B: 1, C: 2, M: 3, X: 4 };

/** Comparable number for a flare class like "X8.7" (higher = stronger). */
export function flareScore(cls) {
  if (!cls) return 0;
  const letter = cls[0].toUpperCase();
  const num = parseFloat(cls.slice(1)) || 1;
  return (CLASS_ORDER[letter] ?? 0) * 100 + num;
}

export const parseUtc = (s) => Date.parse(s.endsWith('Z') ? s : `${s}Z`);

/**
 * @param {object} doc parsed storm JSON (see data/README.md)
 * @param {number} missionDays
 */
export function buildTimeline(doc, missionDays) {
  const startMs = Date.parse(`${doc.period.start}T00:00:00Z`);
  const days = [];
  for (let i = 0; i < missionDays; i++) {
    const dateMs = startMs + i * DAY_MS;
    days.push({ index: i, dateMs, iso: new Date(dateMs).toISOString().slice(0, 10), radiation: {} });
  }
  const byIso = new Map(days.map((d) => [d.iso, d]));

  // Radiation: times-normal per site per day (null where the spacecraft had no reading).
  for (const [site, info] of Object.entries(doc.radiation || {})) {
    for (const [iso, mean, times] of info.daily) {
      const day = byIso.get(iso);
      if (day) day.radiation[site] = { mean, times };
    }
  }

  const toT = (ms) => (ms - startMs) / DAY_MS; // mission time in days
  const sw = doc.spaceWeather || {};
  const flares = (sw.flares || [])
    .map((f) => ({ t: toT(parseUtc(f.peak)), cls: f.class, score: flareScore(f.class), source: f.source }))
    .filter((f) => f.t >= 0 && f.t < missionDays)
    .sort((a, b) => a.t - b.t);
  // Several instruments report the same particle event; merge onsets within 6 hours.
  const seps = [];
  for (const s of (sw.particleEvents || []).map((e) => toT(parseUtc(e))).sort((a, b) => a - b)) {
    if (s < 0 || s >= missionDays) continue;
    if (!seps.length || s - seps[seps.length - 1].t > 0.25) seps.push({ t: s });
  }
  const cmes = (sw.cmes || [])
    .map((c) => ({ t: toT(parseUtc(c.start)), speed: c.speedKmS }))
    .filter((c) => c.t >= 0 && c.t < missionDays);
  const geoStorms = (sw.geomagneticStorms || [])
    .map((g) => ({ t: toT(parseUtc(g.start)), maxKp: g.maxKp }))
    .filter((g) => g.t >= 0 && g.t < missionDays);

  return {
    id: doc.id,
    title: doc.title,
    summary: doc.summary,
    displayLabel: doc.displayLabel,
    startMs,
    days,
    flares,
    seps,
    cmes,
    geoStorms,
    sites: doc.radiation || {},
  };
}

/** Moon radiation (times normal) on a mission day; 1 when there's no reading. */
export function moonTimesNormal(timeline, dayIndex) {
  const d = timeline.days[Math.max(0, Math.min(timeline.days.length - 1, dayIndex))];
  return d?.radiation?.moonOrbit?.times ?? 1;
}

/** Peak day for a site within the timeline, or null. */
export function peakDay(timeline, site) {
  let best = null;
  for (const d of timeline.days) {
    const r = d.radiation[site];
    if (r && (!best || r.times > best.times)) best = { ...r, index: d.index, iso: d.iso, dateMs: d.dateMs };
  }
  return best;
}
