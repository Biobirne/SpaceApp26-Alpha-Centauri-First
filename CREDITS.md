# Credits

## Data
| What | Source | License / terms | Used in |
|------|--------|-----------------|---------|
| Space weather events (solar flares, CMEs, SEP, geomagnetic storms) | NASA Community Coordinated Modeling Center (CCMC), DONKI – https://ccmc.gsfc.nasa.gov/tools/DONKI/ | NASA data; CCMC terms apply (no open license, acknowledgement requested, "prototyping quality and in research context"). Attribution shown in game. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md#space-weather--donki-nasa-ccmc) | Trimmed events inside `/data/storms/`; full saved copies in `/data/donki/` (fetched 2026-11-12, for the planned live mission) |
| Radiation dose rates (ISS, BioSentinel, LRO, Curiosity) for six historical solar storms, 2017–2025 | NASA Open Science Data Repository (OSDR), RadLab – https://visualization.osdr.nasa.gov/radlab/ (plus trimmed DONKI events) | NASA data; OSDR terms, per-study license (the studies used carry `CC0-1.0` or no license field), citation requested. Attribution shown in game. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md#radiation--radlab-nasa-osdr) | `/data/storms/` (archived measurements, built 2026-11-14, see `data/README.md`) |

## Assets
Every sprite, icon, sound or font needs a row here before it is merged. No SI-generated images (SI = Super Intelligence, the Space Apps term for AI tools). No NASA logos or insignia.

| File | Author / source | License | Link |
|------|-----------------|---------|------|
| `assets/fonts/lexend-latin-wght-normal.woff2` | Lexend by Bonnie Shaver-Troup, Thomas Jockin et al. (Latin subset of the variable font, from the `@fontsource-variable/lexend@5.2.8` package). Copyright 2018 The Lexend Project Authors, Reserved Font Name "RevReading Lexend" | SIL Open Font License 1.1 (`assets/fonts/OFL.txt`, which carries the copyright line) | https://github.com/googlefonts/lexend |
| Icons and crewmate avatar (inline SVG in `src/ui/icons.js`) | **SI-assisted code** (written by Claude Code). Drawn in code, no image files and no watermark | MIT (this repo) | |
| Moon base, Earth, Sun and sky (drawn in code, `src/scene/MoonScene.js`) | **SI-assisted code** (written by Claude Code). Drawn in code, no image files and no watermark. Team art can replace it via `assets/art/manifest.json` | MIT (this repo) | |
| Sound effects (synthesized live in `src/audio/sfx.js`, no audio files) | Made for this project with SI-assisted code (Claude Code). Not SI-generated audio | MIT (this repo) | |
| Read-aloud voice | The player's own device (browser `speechSynthesis`), nothing shipped | – | |
| Phaser 3.90.0 (loaded from cdnjs, not in the repo) | Phaser Studio | MIT (text in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md#phaser-3900--mit), copyright (c) 2024 Richard Davey, Phaser Studio Inc.) | https://phaser.io |

## Agent skills (`.claude/skills/`, development tooling, not shipped in the game)
| Skill | Source (pinned commit) | License |
|-------|------------------------|---------|
| frontend-design | [anthropics/skills](https://github.com/anthropics/skills/tree/2c5958ecac7cee2b583967a2c4981d0f4a75c579/skills/frontend-design) @ `2c5958e` | Apache-2.0 (`LICENSE.txt` in folder) |
| game-jam, prototype-fast, game-ui-ux, game-feel, survival-crafting, phaser-core | [gamedev-skills/awesome-gamedev-agent-skills](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/tree/c6ca6c41c839b68319ffc08430b99ab768debc32/skills) @ `c6ca6c4` | Apache-2.0 (`LICENSE.txt` + `NOTICE.txt` in each folder) |
| kids-ux, playtest, ship-task | written for this project | MIT (this repo) |

Third-party skills were read in full and scanned for scripts, hidden Unicode and injected instructions before they were added (2026-11-12).

Full license texts and the notices those licenses require are in
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). That file also carries the NASA
data terms (CCMC, OSDR) and the NASA brand rules. In short: NASA has not
reviewed, approved or endorsed this project, and no NASA logo or insignia is
used anywhere.
