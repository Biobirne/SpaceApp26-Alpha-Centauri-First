# Third-party notices

This repository is released under the MIT License (see [LICENSE](LICENSE)). It
also contains third-party software, a font and NASA data. This file lists them
with their licenses, and reproduces the notices those licenses require. Read it
before you redistribute the game or any part of it.

Last verified: 2026-11-18. Add a row here and in [CREDITS.md](CREDITS.md) before
merging a new asset, library or dataset. Where the license text already ships in
the repository, this file gives the path instead of a second copy.

## Summary

| Component | Version | License | Where | Notice |
|-----------|---------|---------|-------|--------|
| Phaser | 3.90.0 | MIT | loaded at runtime from cdnjs, not in this repository | [Phaser](#phaser-3900--mit) |
| Lexend, variable font, Latin subset | from `@fontsource-variable/lexend` 5.2.8 | SIL OFL 1.1 | `assets/fonts/lexend-latin-wght-normal.woff2` | `assets/fonts/OFL.txt` |
| `frontend-design` skill | `anthropics/skills` @ `2c5958e` | Apache-2.0 | `.claude/skills/frontend-design/` (development tooling) | `LICENSE.txt` in that folder |
| `game-jam`, `game-feel`, `game-ui-ux`, `phaser-core`, `prototype-fast`, `survival-crafting` | `awesome-gamedev-agent-skills` @ `c6ca6c4` | Apache-2.0 | `.claude/skills/<name>/` (development tooling) | `LICENSE.txt` + `NOTICE.txt` in each folder; NOTICE quoted [below](#awesome-gamedev-agent-skills) |
| `kids-ux`, `playtest`, `ship-task` | this project | MIT | `.claude/skills/` | — |
| Space weather data | DONKI, NASA CCMC | NASA data, CCMC terms (no open license) | `data/donki/`, trimmed events in `data/storms/` | [NASA data](#nasa-data) |
| Radiation data | RadLab, NASA OSDR | NASA data, OSDR terms, per-dataset license | `data/storms/` | [NASA data](#nasa-data) |
| Game code, drawn art, synthesized sound | this project | MIT | `src/`, `index.html` | [LICENSE](LICENSE) |

There are no image or audio files in this repository. The Moon base, Earth, the
Sun, the icons and the crewmate are drawn in code, and every sound is
synthesized in the browser.

## Phaser 3.90.0 — MIT

`index.html` loads `phaser.min.js` from cdnjs with a pinned version and an SRI
hash. Phaser is therefore not redistributed inside this repository, and the
minified build contains no license banner of its own, so the notice belongs
here.

Copyright (c) 2024 Richard Davey, Phaser Studio Inc.
License text: <https://github.com/phaserjs/phaser/blob/v3.90.0/LICENSE.md>

```
MIT License

Copyright (c) 2024 Richard Davey, Phaser Studio Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

The project's own code uses the same MIT terms, with its own copyright line in
[LICENSE](LICENSE).

## Lexend — SIL Open Font License 1.1

`assets/fonts/lexend-latin-wght-normal.woff2` is the Latin subset of the
variable Lexend font, copied from the `@fontsource-variable/lexend@5.2.8`
package. That package is published under OFL 1.1 as well.

```
Copyright 2018 The Lexend Project Authors (https://github.com/googlefonts/lexend),
with Reserved Font Name "RevReading Lexend".
```

The font's internal metadata states `Copyright 2019 The Lexend Project Authors`.
The statement above is the one from the upstream `OFL.txt`, which is the
license-bearing document.

OFL 1.1 requires that every copy of the font carries the copyright notice and
the license. Both ship with the file in [`assets/fonts/OFL.txt`](assets/fonts/OFL.txt).

Fontsource cut the Latin subset; OFL FAQ 2.6 treats a subset as a modified
version. This project keeps the upstream file name, claims no Reserved Font
Name, and does not rename or re-license the font. Designers: Bonnie
Shaver-Troup, Thomas Jockin, Santiago Orozco, Héctor Gómez, Superunion
(<https://www.lexend.com/>).

## Development tooling: agent skills

`.claude/skills/` holds instructions for coding agents such as Claude Code. The
folders are part of the repository and travel with a clone, but the game never
loads them in a player's browser.

### frontend-design — Apache-2.0, Anthropic

Taken from `anthropics/skills` at commit
`2c5958ecac7cee2b583967a2c4981d0f4a75c579`. The upstream folder contains
`LICENSE.txt` (unmodified Apache License 2.0) and `SKILL.md`. The upstream
repository publishes no NOTICE file, and its license file carries no
copyright-holder line; we attribute the work to Anthropic as the author of that
repository. The license text ships in the folder.

### awesome-gamedev-agent-skills

Apache-2.0, taken from `gamedev-skills/awesome-gamedev-agent-skills` at commit
`c6ca6c41c839b68319ffc08430b99ab768debc32`. Each folder keeps the upstream
`LICENSE.txt` and `NOTICE.txt`. Apache-2.0 §4(d) asks for the attribution
notices in a readable place, so the upstream NOTICE is reproduced here in full:

> awesome-gamedev-agent-skills
> Copyright 2026 Abhishek Barali and the awesome-gamedev-agent-skills contributors
>
> This product is licensed under the Apache License, Version 2.0 (see LICENSE).
>
> All skills in this repository are original works. They were authored from primary
> documentation (engine and framework docs, language references, and platform
> specifications). Third-party sources and other skill collections were studied for
> general patterns only; no text or code was copied from them.
>
> Game engine, framework, and platform names referenced in this repository
> (including but not limited to Godot, Unity, Unreal Engine, Phaser, PixiJS,
> three.js, Babylon.js, Bevy, GameMaker, LÖVE, and MonoGame) are trademarks of
> their respective owners and are used for identification and descriptive purposes
> only. Their use does not imply any affiliation with or endorsement by those owners.

## NASA data

The game plays archived NASA data, never live data. The wording rules for every
screen are in [data/README.md](data/README.md).

### Space weather — DONKI, NASA CCMC

Solar flares, coronal mass ejections, solar particle events and geomagnetic
storms come from the Community Coordinated Modeling Center's DONKI:
<https://ccmc.gsfc.nasa.gov/tools/DONKI/>

CCMC publishes no open license for DONKI; its terms and disclaimers apply:

> The real-time space weather information and simulations stored in DONKI should
> be considered only as prototyping quality and in research context.

> Use of data and/or information stored within the CCMC DONKI does not, in any
> manner, constitute an endorsement by NASA …

CCMC asks for this acknowledgement:

> We acknowledge the Community Coordinated Modeling Center (CCMC) at Goddard
> Space Flight Center for the use of the DONKI,
> <https://ccmc.gsfc.nasa.gov/tools/DONKI/>.

### Radiation — RadLab, NASA OSDR

Dose rates come from the RadLab visualization of the NASA Open Science Data
Repository: <https://visualization.osdr.nasa.gov/radlab/>

OSDR data are distributed under NASA's Science Mission Directorate Science
Information Policy, and each study carries its own license field. The studies
behind the storm library show `CC0-1.0` or no license field at all; check the
individual study (OSD-…) before reusing a number. OSDR asks for a bibliographic
citation to the data used. Every site's exact query is stored as `queryUrl` in
`data/storms/*.json`, so any number can be traced back and re-fetched.

Instruments: DosTel (DLR) on the ISS, BioSentinel BPD (NASA Ames), LRO CRaTER
(NASA / Boston University), Curiosity MSL-RAD (NASA/JPL, SwRI).

### NASA brand, and what this project is not

- NASA content is generally not copyrighted in the United States, and NASA asks
  to be acknowledged as the source. The in-game credits do that.
- The NASA Insignia, the NASA Logotype and the NASA Seal are protected and are
  not used here. There are no NASA logos, insignia or NASA imagery in this
  repository or in the game.
- The project was submitted to the NASA Space Apps Challenge 2026. The name is
  used descriptively only. This project is not affiliated with, endorsed by,
  sponsored by or reviewed by NASA. NASA's own wording for data use:

  > This material includes data, models, or resources provided by the National
  > Aeronautics and Space Administration (NASA). Any findings, interpretations,
  > or conclusions presented do not necessarily reflect the views of NASA.

- NASA's 2026 rules for Super Intelligence (SI) tools do not allow information
  produced by those tools to be attributed to NASA. The game's rules, tuning
  numbers and kid-facing text were written with SI assistance (see
  [SI_USAGE.md](SI_USAGE.md)); they are the team's interpretation, not NASA's.
  Data is credited to the dataset it came from (DONKI, RadLab), never as
  "according to NASA".

## Trademarks

"NASA", the NASA Insignia and "NASA Space Apps Challenge" belong to NASA and are
used descriptively only. Phaser is a trademark of Phaser Studio Inc. Engine and
framework names mentioned in the agent skills belong to their owners, as the
quoted NOTICE above states.

"Moon Base Commander" is a working title for this Space Apps entry. The project
is not connected with, sponsored by or endorsed by Rebellion Interactive Games
Ltd., the publisher of the 2002 game "MoonBase Commander", or by any other
rights holder, and it claims no trademark rights in the name. It is a free,
non-commercial jam project with no connection to that game or its publisher.

## Corrections

If something here is missing, misattributed or out of date, open an issue in the
repository. License texts win over this summary; where the two differ, the
license text applies.
