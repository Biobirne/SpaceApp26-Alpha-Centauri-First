"""Build the RadLab radiation snapshot used by the game.

Fetches real absorbed dose rates (μGy/hour) for May 2024 from NASA's
OSDR RadLab API and writes daily mean and max to data/radlab/may2024-daily.json.

The RadLab API sends no CORS headers, so the browser game cannot call it
directly. That is why we ship this snapshot instead.

Run from the repo root:  python tools/build_radlab_snapshot.py
Standard library only.
"""

import json
import statistics
import urllib.request
from collections import defaultdict
from datetime import date

API = "https://visualization.osdr.nasa.gov/radlab/api/"
START, END = "2024-05-01", "2024-06-01"  # END is exclusive
BASELINE_END = "2024-05-08"  # quiet days before the storm, used as "normal"

# id in game -> (RadLab instrument_id, where it measures, kid-friendly label)
SITES = {
    "iss": ("DosTel1", "Low Earth orbit (ISS)", "Space station near Earth"),
    "deepSpace": ("BPD", "Heliocentric orbit at 1 AU (BioSentinel)", "Deep space"),
    "moonOrbit": ("CRaTER-D1D2", "Lunar orbit (LRO)", "Moon"),
    "marsSurface": ("MSL-RAD-Surface", "Mars surface (Curiosity rover)", "Mars"),
}


def query_url(instrument_id: str) -> str:
    return (
        f"{API}?instrument_id={instrument_id}"
        f"&timestamp%3E={START}&timestamp%3C{END}"
        "&absorbed_dose_rate&spacecraft&trajectory&format=json"
    )


def fetch(url: str) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; radlab-snapshot)"})
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.load(resp)


def main() -> None:
    out = {
        "source": "NASA OSDR RadLab (Radiation Dosimetry Database)",
        "sourceUrl": "https://visualization.osdr.nasa.gov/radlab/",
        "fetchedAt": date.today().isoformat(),
        "unit": "microgray per hour (absorbed dose rate)",
        "note": "Snapshot of archived measurements, daily mean and max. Not live data.",
        "period": {"start": START, "endExclusive": END},
        "baselinePeriod": {"start": START, "endExclusive": BASELINE_END},
        "sites": {},
    }
    for key, (instrument_id, where, label) in SITES.items():
        url = query_url(instrument_id)
        data = fetch(url)
        cols = data["columns"]
        t_i, d_i = cols.index("timestamp"), cols.index("absorbed_dose_rate")
        spacecraft = data["data"][0][cols.index("spacecraft")] if data["data"] else None

        daily = defaultdict(list)
        for row in data["data"]:
            if row[d_i] is not None:
                daily[row[t_i][:10]].append(row[d_i])  # "YYYY-MM-DD"
        # [day, mean, max] per day. Daily means smooth out short orbital spikes
        # (e.g. the ISS crossing the South Atlantic Anomaly every few orbits).
        series = [[d, round(statistics.fmean(v), 2), round(max(v), 2)] for d, v in sorted(daily.items())]

        baseline = statistics.fmean(m for d, m, _ in series if d < BASELINE_END)
        peak_day, peak_mean, _ = max(series, key=lambda p: p[1])
        out["sites"][key] = {
            "label": label,
            "where": where,
            "spacecraft": spacecraft,
            "instrumentId": instrument_id,
            "queryUrl": url,
            "baselineDailyMean": round(baseline, 2),
            "peakDailyMean": peak_mean,
            "peakDay": peak_day,
            "peakTimesBaseline": round(peak_mean / baseline, 1),
            "daily": series,
        }
        print(f"{key:12s} {len(series):3d} days  baseline {baseline:7.2f}  peak day {peak_day} mean {peak_mean:8.2f}  x{peak_mean / baseline:.1f}")

    out["dailyColumns"] = ["date", "mean", "max"]
    with open("data/radlab/may2024-daily.json", "w", encoding="utf-8") as f:
        json.dump(out, f, separators=(",", ":"), ensure_ascii=False)


if __name__ == "__main__":
    main()
