"""Build the storm library: real historical solar storms, each as one compact JSON file.

For every storm in STORMS this script fetches:
  - DONKI space weather events (flares, CMEs, SEP particle events, geomagnetic storms)
    from NASA CCMC, trimmed to the fields the game needs;
  - RadLab daily radiation dose rates from NASA OSDR for every site that has data
    in that window (ISS, deep space, Moon orbit, Mars surface).

Output: data/storms/<id>.json plus data/storms/index.json.

All of this is ARCHIVED data, measured in the past. The game must label it as
"archived NASA measurements" and never as live. Only DONKI can be fetched live
from the browser (CORS allowed); RadLab cannot (no CORS headers, and its
newest data ends in Nov 2025).

Run from the repo root:  python tools/build_storm_library.py
Standard library only.
"""

import json
import statistics
import urllib.request
from collections import defaultdict
from datetime import date, timedelta
from pathlib import Path

DONKI = "https://ccmc.gsfc.nasa.gov/DONKI-API/get/"
RADLAB = "https://visualization.osdr.nasa.gov/radlab/api/"
OUT = Path("data/storms")
MIN_DAYS = 20  # include a RadLab site only if it has data on at least this many days

# Windows are at most 30 days (DONKI limit). Pick them so the storm sits inside
# a stretch of quiet days, which the "normal" (quiet) level is measured from.
STORMS = [
    {"id": "sep2017", "start": "2017-08-25", "end": "2017-09-23",
     "title": "September 2017 storm",
     "summary": "The biggest solar flares in over ten years. The Moon got a huge dose; Mars, behind its thin air, much less."},
    {"id": "oct2021", "start": "2021-10-15", "end": "2021-11-13",
     "title": "October 2021 storm",
     "summary": "A medium storm that reached both the Moon and Mars."},
    {"id": "feb2022", "start": "2022-02-01", "end": "2022-03-02",
     "title": "February 2022 far-side storm",
     "summary": "An eruption on the far side of the Sun. It hit Mars, while the Moon stayed calm."},
    {"id": "mar2024", "start": "2024-03-10", "end": "2024-04-08",
     "title": "March 2024 storm",
     "summary": "A sharp particle storm that hit the Moon and deep space hard."},
    {"id": "may2024", "start": "2024-05-01", "end": "2024-05-30",
     "title": "May 2024 storm",
     "summary": "The strongest geomagnetic storm in 20 years on Earth. The Moon, deep space and Mars all felt it."},
    {"id": "nov2025", "start": "2025-10-20", "end": "2025-11-18",
     "title": "November 2025 storm",
     "summary": "The most recent big storm in NASA's radiation archive, measured in deep space."},
]

SITES = {  # game key -> (RadLab instrument_id, label, where)
    "iss": ("DosTel1", "Space station near Earth", "Low Earth orbit, ISS (DosTel)"),
    "deepSpace": ("BPD", "Deep space", "Orbit around the Sun, BioSentinel (BPD)"),
    "moonOrbit": ("CRaTER-D1D2", "Moon", "Lunar orbit, LRO (CRaTER)"),
    "marsSurface": ("MSL-RAD-Surface", "Mars", "Mars surface, Curiosity rover (RAD)"),
}


def get_json(url: str):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; storm-library-builder)"})
    with urllib.request.urlopen(req, timeout=300) as resp:
        body = resp.read()
    return json.loads(body) if body.strip() else []


def donki(kind: str, start: str, end: str) -> list:
    return get_json(f"{DONKI}{kind}?startDate={start}&endDate={end}") or []


def trim_donki(start: str, end: str) -> dict:
    flares = [
        {"peak": f["peakTime"], "class": f["classType"], "source": f.get("sourceLocation") or None}
        for f in donki("FLR", start, end) if f.get("classType")
    ]
    cmes = []
    for c in donki("CME", start, end):
        speeds = [a["speed"] for a in (c.get("cmeAnalyses") or []) if a.get("isMostAccurate") and a.get("speed")]
        if speeds:  # keep only CMEs with a measured speed (km/s)
            cmes.append({"start": c["startTime"], "speedKmS": round(max(speeds))})
    seps = sorted({s["eventTime"] for s in donki("SEP", start, end)})
    storms = [
        {"start": g["startTime"], "maxKp": max(k["kpIndex"] for k in g["allKpIndex"])}
        for g in donki("GST", start, end) if g.get("allKpIndex")
    ]
    return {
        "flares": sorted(flares, key=lambda x: x["peak"]),
        "cmes": sorted(cmes, key=lambda x: x["start"]),
        "particleEvents": seps,
        "geomagneticStorms": storms,
    }


def radlab_site(instrument_id: str, start: str, end_exclusive: str):
    url = (f"{RADLAB}?instrument_id={instrument_id}"
           f"&timestamp%3E={start}&timestamp%3C{end_exclusive}&absorbed_dose_rate&format=json")
    data = get_json(url)
    if not data or not data.get("data"):
        return None, url
    cols = data["columns"]
    t_i, d_i = cols.index("timestamp"), cols.index("absorbed_dose_rate")
    daily = defaultdict(list)
    for row in data["data"]:
        if row[d_i] is not None:
            daily[row[t_i][:10]].append(row[d_i])
    if len(daily) < MIN_DAYS:
        return None, url
    series = [[d, round(statistics.fmean(v), 2)] for d, v in sorted(daily.items())]
    # "Normal" = the quiet level: 25th percentile of the daily means in the window.
    # A plain median would be pulled up by the storm days, so the calm days before
    # a storm would show as "0.5x normal", which confuses players.
    normal = statistics.quantiles([m for _, m in series], n=4)[0]
    peak_day, peak = max(series, key=lambda p: p[1])
    return {
        "normal": round(normal, 2),
        "peakDay": peak_day,
        "peak": peak,
        "peakTimesNormal": round(peak / normal, 1),
        # timesNormal per day is what the game should show kids ("40x normal")
        "daily": [[d, m, round(m / normal, 1)] for d, m in series],
    }, url


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    index = []
    for storm in STORMS:
        start, end = storm["start"], storm["end"]
        end_excl = (date.fromisoformat(end) + timedelta(days=1)).isoformat()
        sites = {}
        for key, (inst, label, where) in SITES.items():
            site, url = radlab_site(inst, start, end_excl)
            if site:
                sites[key] = {"label": label, "where": where, "instrumentId": inst, "queryUrl": url, **site}
        doc = {
            "id": storm["id"],
            "title": storm["title"],
            "summary": storm["summary"],
            "dataKind": "archived",
            "displayLabel": f"Archived NASA measurements, {date.fromisoformat(start).strftime('%B %Y')}",
            "period": {"start": start, "end": end},
            "builtAt": date.today().isoformat(),
            "sources": {
                "spaceWeather": "NASA CCMC DONKI, https://ccmc.gsfc.nasa.gov/tools/DONKI/",
                "radiation": "NASA OSDR RadLab, https://visualization.osdr.nasa.gov/radlab/",
            },
            "radiationUnit": "microgray per hour (daily mean absorbed dose rate)",
            "dailyColumns": ["date", "meanDoseRate", "timesNormal"],
            "spaceWeather": trim_donki(start, end),
            "radiation": sites,
        }
        path = OUT / f"{storm['id']}.json"
        path.write_text(json.dumps(doc, separators=(",", ":"), ensure_ascii=False), encoding="utf-8")
        sw = doc["spaceWeather"]
        top = max((f["class"] for f in sw["flares"]), key=lambda c: "ABCMX".index(c[0]) * 100 + float(c[1:]), default="-")
        peaks = {k: f"x{v['peakTimesNormal']}" for k, v in sites.items()}
        print(f"{storm['id']}: {path.stat().st_size // 1024} KB  flares {len(sw['flares'])} (top {top}), "
              f"SEP {len(sw['particleEvents'])}, storms {len(sw['geomagneticStorms'])}, radiation {peaks}")
        index.append({"id": storm["id"], "title": storm["title"], "file": path.name,
                      "sites": list(sites), "peakTimesNormal": {k: v["peakTimesNormal"] for k, v in sites.items()}})
    (OUT / "index.json").write_text(json.dumps({"dataKind": "archived", "storms": index}, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main()
