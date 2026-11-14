# Data sources

This game uses real NASA data. Everything in this folder is a **snapshot** of archived measurements bundled with the game, so the game works offline and loads fast. The game labels snapshot data as snapshots and never presents it as live.

## What we use and why

| Dataset | What it gives the game | Access from the browser | In this repo |
|---------|-----------------------|-------------------------|--------------|
| **DONKI** (Space Weather Database Of Notifications, Knowledge, Information), NASA CCMC | Real solar flares, CMEs, solar energetic particle (SEP) events and geomagnetic storms. These trigger the space-weather events the player must react to. | Yes: CORS `*`, no API key. `https://ccmc.gsfc.nasa.gov/DONKI-API/get/<TYPE>?startDate=…&endDate=…` (max 30 days per request) | `donki/` (see `donki/manifest.json`) |
| **RadLab** (OSDR Radiation Dosimetry Database), NASA OSDR | Real absorbed radiation dose rates measured near Earth, in deep space, at the Moon and on Mars. These ground the radiation-shielding trade-off in actual numbers. | No: the API sends no CORS headers, so we ship a snapshot. | `radlab/may2024-daily.json`, built by `tools/build_radlab_snapshot.py` |
| **Mars Trek**, NASA/JPL | Real Mars surface imagery (Viking MDIM 2.1 colour mosaic) as map tiles. Optional, for a Mars backdrop. | Yes: tiles are served with CORS `*` and can be used directly as images. | Not bundled yet |
| **OSDR** (Open Science Data Repository), NASA | Published space biology and astronaut health studies (bone, muscle, sleep, radiation). Can back short "real science" fact cards. | No: CORS is restricted to `osdr.nasa.gov`. Curate facts by hand and cite the study ID (OSD-…). | Not bundled yet |

Not used:
- `api.nasa.gov/DONKI/...`: returns 404. DONKI moved to the CCMC endpoint above.
- APOD (`api.nasa.gov/planetary/apod`): with `DEMO_KEY` it currently returns a generic placeholder whose image is the NASA logo. Our rules forbid NASA logos.

## The May 2024 solar storm, measured in four places

The same storm, seen in two independent NASA datasets.

**DONKI** records:
- an X8.7 flare on 14 May 2024 (the largest of 20 X-class flares that month);
- a Kp 9 geomagnetic storm starting 10 May;
- SEP events from 9 to 13 May.

**RadLab** shows what the radiation did in each place, as daily mean absorbed dose rate:

| Where | Spacecraft | Normal (1–7 May) | Peak day | Peak vs. normal |
|-------|-----------|------------------|----------|-----------------|
| Near Earth, low Earth orbit | ISS (DosTel1) | 22.7 µGy/h | none visible | about 1× |
| Deep space, orbiting the Sun | BioSentinel (BPD) | 6.4 µGy/h | 14 May: 381 µGy/h | about 60× |
| Moon orbit | LRO (CRaTER) | 5.1 µGy/h | 14 May: 1528 µGy/h | about 300× |
| Mars surface | Curiosity (MSL-RAD) | 4.8 µGy/h | 20 May: 69 µGy/h (hourly peak 276) | about 14× (hourly about 58×) |

What this teaches:
- **Earth's magnetic field protects the ISS.** The storm barely shows up there. The higher normal level on the ISS comes from crossing the South Atlantic Anomaly, a region of trapped radiation.
- **The Moon has no magnetic field and no air.** It gets the full blast.
- **Mars has a thin atmosphere** that blocks part of it. Mars was hit on 20 May by a separate eruption from the far side of the Sun, which Earth-based flare lists could not see directly.

Caveats for anyone checking our numbers:
- Different instruments measure dose in different materials (silicon, tissue-equivalent), so absolute values aren't directly comparable between sites.
- The "times normal" factor within each site is the robust comparison, and it is the one the game uses.

## Reproduce

```sh
python tools/build_radlab_snapshot.py    # rebuilds radlab/may2024-daily.json
```

The exact API query for each site is stored in the snapshot as `queryUrl`.

## Attribution

- Space weather: NASA Community Coordinated Modeling Center (CCMC), DONKI, <https://ccmc.gsfc.nasa.gov/tools/DONKI/>
- Radiation: NASA Open Science Data Repository, RadLab, <https://visualization.osdr.nasa.gov/radlab/>. Instruments: DosTel (DLR) on the ISS, BioSentinel BPD (NASA Ames), LRO CRaTER (NASA/Boston University), MSL-RAD (NASA/JPL, SwRI).
- Mars imagery (if used): NASA Mars Trek, <https://trek.nasa.gov/mars/>, Viking MDIM 2.1 mosaic (NASA/USGS).
