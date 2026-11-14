# AGENTS.md – Alpha Centauri First · NASA Space Apps 2026

Instructions for every coding agent in this repo (Claude Code, OpenCode, Jules, …).
Read this file fully before every task. If a request conflicts with this file, stop and ask.

## Project
- Event: NASA Space Apps Challenge 2026, Vienna (14–15 Nov 2026).
- Challenge: "Build a Junior Astronaut Mission Trainer".
- Product: a browser game for kids aged 7–12 who run a Moon base for 30 days during a real solar storm and make trade-off decisions (power, air and life support, radiation shielding, science, communication delay). Every choice must cost something. Not a quiz, not a slideshow. Working title: "Moon Base Commander". Design: `GAME_DESIGN.md`.
- Time budget: ~15 hours of building in total. Scope small, ship often.

## Hard requirements (do not break)
1. **English** for all UI text, code, comments, commit messages and docs.
2. **Runs in the browser**: no install, no login, no accounts, no personal data. Players are children.
3. **Static site** deployable on **GitHub Pages** from `main`. No backend, no server code, no secrets in the repo.
4. **Mobile-friendly**: must work on a phone (judges scan a QR code). Touch input, responsive layout.
5. **NASA data with visible attribution** in the game. Archived or saved data is labelled as such (wording rules in `data/README.md`); never present it as live.
6. **No SI-generated images** in the final game. Space Apps calls these tools Super Intelligence (SI) and requires a visible watermark on SI-generated images and videos. Use self-made art or assets with a clear free license, and record the license in `CREDITS.md`. Always write "SI", never "AI", in docs and in the game. How to label SI use: `SI_DISCLOSURE.md`.
7. **No NASA logos or insignia** anywhere.
8. **License: MIT** (`LICENSE` file in repo root).
9. **Keep assets small** (total download a few MB) so it loads fast on venue Wi-Fi.

## NASA data: DONKI (space weather)
- New endpoint since 30 Sep 2026, **no API key needed**:
  `https://ccmc.gsfc.nasa.gov/DONKI-API/get/<TYPE>?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
- Max **30 days** per request. Useful types: `FLR` (solar flares), `CME`, `SEP`, `GST`.
- The old URLs (`api.nasa.gov/DONKI/...`, `kauai.ccmc.gsfc.nasa.gov/...`) are dead. Do not use them.
- Browser `fetch` works (CORS OK, tested).
- The game plays from the data shipped in `/data` (the storm library in `data/storms/`). A live DONKI fetch is optional and not built yet; the game must always work without it.

## Repo structure
```
/index.html        entry point
/src/              game code: rules/, ui/, scene/, audio/, main.js, progress.js
/assets/           art hook (art/manifest.json) and the Lexend font
/data/             storm library (storms/) and saved DONKI copies (donki/)
/tests/            rule tests (npm test)
/tools/            dev server (serve.py) and storm library builder
AGENTS.md          this file
CLAUDE.md          imports this file
README.md          what the project is and how to run it
GAME_DESIGN.md     design, real vs. game rules, build status
RESEARCH.md        how the game teaches: learning goals, teaching test, realism check
FEEDBACK.md        all feedback (mentors, SI review, team) and what we did with it
SI_USAGE.md        log of SI tool usage (required for submission)
SI_DISCLOSURE.md   how SI use is labelled (watermarks, text, metadata)
si-manifest.json   machine-readable SI metadata for files
CREDITS.md         asset + data sources and licenses
LICENSE            MIT
```

## Module ownership
Only change files in your own module unless the task explicitly says otherwise.
- **Core** (game state, resources, turn loop, rules): _TBD Saturday_
- **Presentation** (screens, UI, sprites, animations): _TBD Saturday_
- **Data + content** (DONKI loader, snapshot, events JSON, learning texts, end screen facts): _TBD Saturday_

## Interfaces
Current state (14 Nov, evening). Change it here when the team decides otherwise.
- **Rules** (`src/rules/`, plain JS, no Phaser, no DOM, tested with `npm test`):
  - `createMission(stormDoc, { seed, config, script })` returns the whole game state. `config` comes from `configFor('easy' | 'normal' | 'hard')`; `script` holds the guided first leak.
  - `tick(state, dtDays)` advances it.
  - Player actions: `setShield`, `setShelter`, `setGrowLights`, `chooseOption`, `repairFor` / `completeRepair`, `buyUpgrade`, `callEarth` / `applyAdvice`.
  - Read-only helpers for the UI: `powerBreakdown`, `airBreakdown`, `doseNow`, `evaCost` (what a spacewalk costs now), `lifeLoop` (status of each life support step), `describeAdvice`, `explainSetup`, `summarize` (end screen: stars, badges, lessons).
  - The rules never touch the screen. They push events into `state.outbox` (`crew`, `word`, `card`, `flare`, `particles`, `radiation`, `room`, `daylight`, `setback`, `warn`, `upgrade`, `end`).
- **Controller** (`src/main.js`):
  - Runs the clock, calls `tick`, drains the outbox, and pauses on cards and sheets.
  - Hands the scene a plain `view` object every frame.
- **Presentation:**
  - `src/ui/` is the HTML/CSS HUD, sheets and screens. It reads state and calls controller actions.
  - `src/scene/MoonScene.js` is the Phaser canvas. It only draws `scene.view` and emits `room-tap` and `sky-tap` (Earth or Sun, for fun facts).
  - `src/ui/intro.js` is the intro (training): build the base piece by piece, then each event once. It has the same interface as the guide (`src/ui/guide.js`) and holds the clock. Test one lesson with `?intro=dust`, `leak`, `filter`, `storm` or `night`; test one mini-game with `minigame.html?game=dust`, `fort`, `leak` or `filter`. New mini-games go into `src/ui/minigames/` (shared frame `mg.css`, step guidance `guide.js`) and are registered in `TASKS` in `src/ui/overlays.js`.
  - `src/audio/` has the synthesized sound effects (`sfx.js`) and read-aloud with the device voice (`voice.js`). The controller plays them.
- **Data:** storms in `data/storms/*.json` (format in `data/README.md`). Tuning numbers live in `src/rules/config.js`, and kid-facing text in `src/rules/content.js`.
- **Sprites:** listed in `assets/art/manifest.json`, with sizes and anchors in `assets/art/README.md`.

## Teaching comes first
The game must teach. This is the team's top priority, above looks and features. Before building anything, check it against `RESEARCH.md` section 0: the learning goals, how we teach, and the teaching test. Every new mechanic needs its "why" in one sentence for a 7-year-old, and every number change needs a visible cause. Science facts shown to kids must come from a source someone opened, not from memory.

## Workflow
- `main` must always be playable. GitHub Pages deploys from `main`.
- One branch per task, small pull requests, merge every 30–60 minutes.
- Pull/rebase from `main` before starting a new task.
- Small, focused commits with clear messages. Never force-push.
- Do not add new dependencies or frameworks without asking the team.
- After each task: append one line to `SI_USAGE.md` (SI tool, what it did) and update `si-manifest.json` for new files.
- **Avoid merge conflicts** (two laptops, one GitHub account):
  - Before creating a file, run `git fetch` and check that the name doesn't exist on `main` (`git ls-tree --name-only origin/main`). One topic, one file: add a section to `FEEDBACK.md`, `RESEARCH.md` or `GAME_DESIGN.md` instead of starting a second file with a similar name.
  - Right before pushing, and again before merging a PR, merge `origin/main` into your branch and run `npm test`. In `SI_USAGE.md` and `si-manifest.json`, keep both sides' lines.
  - Both laptops commit as the same GitHub account, so say in each PR description who did the work.

## Tech stack
Decided Saturday 14 Nov: **Phaser 3.90.0 via CDN**, plus our own code as plain ES modules. There is no build step.
- Load it with one pinned script tag: `<script src="https://cdnjs.cloudflare.com/ajax/libs/phaser/3.90.0/phaser.min.js" integrity="sha512-/tJYyDCrI7hnHWp45P189aOwPa6lTREosRhlxEIqx8skB4A3a3rD3iz4o335SJd4sORqjVHw5y1S2hq4hciwLw==" crossorigin="anonymous"></script>` (SRI hash verified against the file 2026-11-14). That exposes the global `Phaser`. Do not use npm or a bundler, and do not upgrade to Phaser 4 without asking the team.
- Game rules (state, resources, clock, events, scoring) live in plain modules with **no Phaser import**. Scenes only draw state and send actions back.
- The `phaser-core` skill targets Phaser 4 with npm. Use its scene lifecycle and architecture advice, and ignore its npm/`import Phaser` setup and Phaser 4-only APIs.
- Design reference: `GAME_DESIGN.md`. Data reference: `data/README.md`.
