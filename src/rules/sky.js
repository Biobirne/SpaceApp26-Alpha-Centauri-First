// Lunar day/night and Earth phase for real dates, from the mean synodic month.
// Accurate to within about half a day, which is fine for a 30-day mission.
// Ignores libration and assumes a low-latitude near-side site.

const REF_NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14); // 6 Jan 2000 18:14 UTC
const SYNODIC_DAYS = 29.530588853;
const DAY_MS = 86400000;

/** Moon age in days since the last new moon (0..29.53). */
export function moonAge(dateMs) {
  const days = (dateMs - REF_NEW_MOON_MS) / DAY_MS;
  return ((days % SYNODIC_DAYS) + SYNODIC_DAYS) % SYNODIC_DAYS;
}

const wrap180 = (deg) => ((((deg + 180) % 360) + 360) % 360) - 180;

/** Selenographic longitude of the point where the Sun is overhead. */
export function subsolarLon(dateMs) {
  return wrap180(180 - (360 * moonAge(dateMs)) / SYNODIC_DAYS);
}

/** Sun elevation proxy at a site (degrees above the horizon along the equator). */
export function sunElevation(dateMs, siteLonDeg) {
  return 90 - Math.abs(wrap180(siteLonDeg - subsolarLon(dateMs)));
}

export function isDaylight(dateMs, siteLonDeg) {
  return sunElevation(dateMs, siteLonDeg) > 0;
}

/** Fraction of Earth's disc that is lit, as seen from the Moon (opposite of the Moon's phase). */
export function earthLitFraction(dateMs) {
  const phaseAngle = (2 * Math.PI * moonAge(dateMs)) / SYNODIC_DAYS;
  return (1 + Math.cos(phaseAngle)) / 2; // full Earth at new Moon
}

/** Next sunrise/sunset time after dateMs (searched in 1-hour steps, max 31 days). */
export function nextTerminatorCrossing(dateMs, siteLonDeg) {
  const startDay = isDaylight(dateMs, siteLonDeg);
  for (let h = 1; h <= 31 * 24; h++) {
    const t = dateMs + h * 3600000;
    if (isDaylight(t, siteLonDeg) !== startDay) return { atMs: t, becomesDay: !startDay };
  }
  return null;
}
