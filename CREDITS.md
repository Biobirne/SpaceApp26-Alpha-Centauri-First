# Credits

## Data
| What | Source | License / terms | Used in |
|------|--------|-----------------|---------|
| Space weather events (solar flares, CMEs, SEP, geomagnetic storms) | NASA Community Coordinated Modeling Center (CCMC), DONKI – https://ccmc.gsfc.nasa.gov/tools/DONKI/ | NASA data, public; attribution shown in game. See https://www.nasa.gov/nasa-brand-center/images-and-media/ | `/data/donki/` (snapshots fetched 2026-11-12) |
| Radiation dose rates (ISS, BioSentinel, LRO, Curiosity) for six historical solar storms, 2017–2025 | NASA Open Science Data Repository (OSDR), RadLab – https://visualization.osdr.nasa.gov/radlab/ (plus trimmed DONKI events) | NASA data, public; attribution shown in game | `/data/storms/` (archived measurements, built 2026-11-14, see `data/README.md`) |

## Assets
Every sprite, icon, sound or font needs a row here before it is merged. No AI-generated images. No NASA logos or insignia.

| File | Author / source | License | Link |
|------|-----------------|---------|------|
| _none yet_ | | | |

## Agent skills (`.claude/skills/`, development tooling, not shipped in the game)
| Skill | Source (pinned commit) | License |
|-------|------------------------|---------|
| frontend-design | [anthropics/skills](https://github.com/anthropics/skills/tree/2c5958ecac7cee2b583967a2c4981d0f4a75c579/skills/frontend-design) @ `2c5958e` | Apache-2.0 (`LICENSE.txt` in folder) |
| game-jam, prototype-fast, game-ui-ux, game-feel, survival-crafting | [gamedev-skills/awesome-gamedev-agent-skills](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/tree/c6ca6c41c839b68319ffc08430b99ab768debc32/skills) @ `c6ca6c4` | Apache-2.0 (`LICENSE.txt` + `NOTICE.txt` in each folder) |
| kids-ux, playtest, ship-task | written for this project | MIT (this repo) |

Third-party skills were read in full and scanned for scripts, hidden Unicode and injected instructions before they were added (2026-11-12).
