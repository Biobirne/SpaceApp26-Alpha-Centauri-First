# Data sources

This game uses real NASA data in two ways:

1. **Archived measurements (what the game plays today).** Real radiation that NASA spacecraft measured during six past solar storms, plus the DONKI flares and particle events of those weeks, bundled in `storms/`. These measurements are historical by nature. NASA's radiation archive ends in November 2025.
2. **Live space weather (planned, not built yet).** A live mission could fetch the last 30 days of solar activity straight from NASA DONKI, falling back to the saved copy in `donki/` when offline. The game does not load `donki/` yet.

## Words we use (in the game and in all docs)

| Data | Say | Never say |
|------|-----|-----------|
| DONKI fetched at game start | "Live from NASA: the Sun this month" | – |
| DONKI fallback copy (`donki/`) | "Saved NASA data from <month year>" | "live", "now", "today" |
| Storm library (`storms/`) | "Archived NASA measurements, <month year>" or "Measured by <spacecraft> on <date>" | "live", "now", "today", "real-time" |
| A storm's effect in the game | "During the real <month year> storm, the Moon got 280× its normal radiation" | invented numbers presented as measured |

Each storm file carries `"dataKind": "archived"` and a ready-made `displayLabel` such as `"Archived NASA measurements, May 2024"`. Show it whenever storm data is on screen.

## What we use and why

| Dataset | What it gives the game | Usable directly from the browser? | In this repo |
|---------|-----------------------|-----------------------------------|--------------|
| **DONKI** (Space Weather Database Of Notifications, Knowledge, Information), NASA CCMC | Real solar flares, CMEs, solar particle events and geomagnetic storms. These are the space-weather events the player reacts to. | **Yes**: CORS `*`, no API key. `https://ccmc.gsfc.nasa.gov/DONKI-API/get/<TYPE>?startDate=…&endDate=…` (max 30 days) | `donki/` (fallback copy), plus trimmed events inside each `storms/*.json` |
| **RadLab** (OSDR Radiation Dosimetry Database), NASA OSDR | Real radiation dose rates measured near Earth, in deep space, at the Moon and on Mars. These show what a storm really does at each place, so the shielding trade-off rests on measured numbers. | **No**: no CORS headers, and the archive ends Nov 2025. Bundled as archived data. | `storms/` |
| **Mars Trek**, NASA/JPL | Real Mars surface imagery (Viking MDIM 2.1 colour mosaic) as map tiles. Optional backdrop. | Yes: tiles are served with CORS `*` | Not bundled yet |
| **OSDR** (Open Science Data Repository), NASA | Published astronaut health and space biology studies. Source for a few hand-written fact cards that cite the study ID (OSD-…). | No: CORS is restricted to `osdr.nasa.gov`. | Not bundled yet |

Not used:
- `api.nasa.gov/DONKI/...`: returns 404, because DONKI moved to the CCMC endpoint above.
- APOD with `DEMO_KEY`: currently returns a placeholder whose image is the NASA logo, and we don't use NASA logos.
- A proxy to make RadLab "live" (for example a Cloudflare Worker): it would be a backend, it would see children's IP addresses, and there is no live radiation data to proxy anyway.

## The storm library (`storms/`)

Six real storms. Each was picked because it teaches something different.

| File | Storm | Moon orbit | Mars surface | Deep space | Near Earth (ISS) | What it shows |
|------|-------|-----------|--------------|------------|------------------|---------------|
| `sep2017.json` | Sep 2017, X9.3 flare | **1778×** | 2.4× | – | – | Same day, same storm: the Moon has no air and no magnetic field; Mars' thin atmosphere blocks most of it |
| `oct2021.json` | Oct 2021, X1.0 flare | 42× | 2.1× | – | – | A medium storm, good for an easier level |
| `feb2022.json` | Feb 2022, far side of the Sun | 1.7× | **2.9×** | – | 1.3× | An eruption we could not see from Earth hit Mars, and the Moon stayed calm |
| `mar2024.json` | Mar 2024 | **935×** | 1.2× | 186× | 1.4× | A sharp blast at the Moon; Mars hardly felt it |
| `may2024.json` | May 2024, X8.7 flare, Kp 9 | 278× | **15×** | 59× | 1.3× | The strongest storm on Earth in 20 years; every site felt it except the ISS |
| `nov2025.json` | Nov 2025, X5.1 flare | – | – | **304×** | – | The newest storm in NASA's radiation archive (deep space only, so the game does not use it) |

The numbers are the peak daily mean compared with that site's normal level in the same month. "–" means no spacecraft data for that site in that window.

The lessons the data teaches, every one of them measured:
- **Earth's magnetic field protects the ISS.** It barely notices storms that hit the Moon hundreds of times harder.
- **The Moon has no air and no magnetic field.** It takes the full blast, so a Moon base needs strong shielding.
- **Mars' thin atmosphere helps a lot**, but not completely (15× in May 2024).
- **A storm does not hit every place.** Feb 2022 reached Mars and left the Moon calm; Mar 2024 did the opposite. The data shows that it happened, not why, so the game does not claim a reason.

### File format

```jsonc
{
  "id": "may2024",
  "title": "May 2024 storm",
  "summary": "…",                       // one plain-English sentence
  "dataKind": "archived",
  "displayLabel": "Archived NASA measurements, May 2024",
  "period": { "start": "2024-05-01", "end": "2024-05-30" },
  "spaceWeather": {                     // trimmed DONKI events
    "flares": [{ "peak": "…Z", "class": "X8.7", "source": "S18W70" }],
    "cmes": [{ "start": "…Z", "speedKmS": 1200 }],
    "particleEvents": ["…Z"],
    "geomagneticStorms": [{ "start": "…Z", "maxKp": 9 }]
  },
  "radiation": {                        // only sites with data in this window
    "moonOrbit": {
      "label": "Moon", "where": "Lunar orbit, LRO (CRaTER)",
      "normal": 5.49, "peakDay": "2024-05-14", "peak": 1528.23, "peakTimesNormal": 278.4,
      "daily": [["2024-05-01", 4.98, 0.9]]   // date, µGy/h daily mean, times normal
    }
  }
}
```

`storms/index.json` lists all storms with their sites and peaks, so the game can list them as levels without loading every file.

### Method and caveats
- **Daily means.** Short orbital spikes are smoothed out, for example the ISS crossing the South Atlantic Anomaly several times a day.
- **"Normal".** This is the quiet level: the 25th percentile of the daily means in the 30-day window. The calm days before a storm therefore read as about 1×.
- **Comparing sites.** Instruments measure dose in different materials (silicon or tissue-equivalent), so absolute µGy/h values aren't directly comparable between sites. The "times normal" factor within one site is the robust measure, and it is the one the game shows.
- **Reproducibility.** Every site's exact API query is stored as `queryUrl` in the file.

## Reproduce

```sh
python tools/build_storm_library.py   # rebuilds storms/*.json (standard library only)
```

## Attribution

- Space weather: NASA Community Coordinated Modeling Center (CCMC), DONKI, <https://ccmc.gsfc.nasa.gov/tools/DONKI/>
- Radiation: NASA Open Science Data Repository, RadLab, <https://visualization.osdr.nasa.gov/radlab/>. Instruments: DosTel (DLR) on the ISS, BioSentinel BPD (NASA Ames), LRO CRaTER (NASA/Boston University), Curiosity MSL-RAD (NASA/JPL, SwRI).
- Mars imagery (if used): NASA Mars Trek, <https://trek.nasa.gov/mars/>, Viking MDIM 2.1 mosaic (NASA/USGS).

CCMC asks for this acknowledgement, and this is the one we mean:

> We acknowledge the Community Coordinated Modeling Center (CCMC) at Goddard Space Flight Center for the use of the DONKI, <https://ccmc.gsfc.nasa.gov/tools/DONKI/>.

Terms that come with the data:

- **DONKI has no open license.** CCMC's disclaimer applies ("prototyping quality and in research context"; use does not imply NASA endorsement or grant a license). It travels with the data; the full quotes are in [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md#space-weather--donki-nasa-ccmc).
- **OSDR data carry a per-study license** (the studies behind the storm library show `CC0-1.0` or no license field) and OSDR asks for a bibliographic citation. The exact `queryUrl` in each storm file is what to cite from.
- NASA has not reviewed, approved or endorsed this project, and no NASA logo or insignia is used. The complete list of notices is in [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md).

## SI note

The numbers in `/data` are NASA's (DONKI and OSDR RadLab). SI tools (Claude Code) downloaded the snapshots, wrote the build script and helped write the kid-facing storm texts. JSON files cannot hold comments, so this is recorded in `si-manifest.json` and `SI_USAGE.md`. See `SI_DISCLOSURE.md`.
