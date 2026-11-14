# AGENTS.md – Alpha Centauri First · NASA Space Apps 2026

Instructions for every coding agent in this repo (Claude Code, OpenCode, Jules, …).
Read this file fully before every task. If a request conflicts with this file, stop and ask.

## Project
- Event: NASA Space Apps Challenge 2026, Vienna (14–15 Nov 2026).
- Challenge: "Build a Junior Astronaut Mission Trainer".
- Product: a browser game for kids aged 7–12 who run a lunar/Martian outpost and make trade-off decisions (power, life support, radiation shielding, food, communication delay). Every choice must cost something. Not a quiz, not a slideshow.
- Time budget: ~15 hours of building in total. Scope small, ship often.

## Hard requirements (do not break)
1. **English** for all UI text, code, comments, commit messages and docs.
2. **Runs in the browser**: no install, no login, no accounts, no personal data. Players are children.
3. **Static site** deployable on **GitHub Pages** from `main`. No backend, no server code, no secrets in the repo.
4. **Mobile-friendly**: must work on a phone (judges scan a QR code). Touch input, responsive layout.
5. **NASA data with visible attribution** in the game. If data is a snapshot, label it as such; never present a snapshot as live.
6. **No AI-generated images** in the game (Space Apps rules require a visible watermark on AI images). Use self-made art or assets with a clear free license, and record the license in `CREDITS.md`.
7. **No NASA logos or insignia** anywhere.
8. **License: MIT** (`LICENSE` file in repo root).
9. **Keep assets small** (total download a few MB) so it loads fast on venue Wi-Fi.

## NASA data: DONKI (space weather)
- New endpoint since 30 Sep 2026, **no API key needed**:
  `https://ccmc.gsfc.nasa.gov/DONKI-API/get/<TYPE>?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
- Max **30 days** per request. Useful types: `FLR` (solar flares), `CME`, `SEP`, `GST`.
- The old URLs (`api.nasa.gov/DONKI/...`, `kauai.ccmc.gsfc.nasa.gov/...`) are dead. Do not use them.
- Browser `fetch` works (CORS OK, tested).
- Always ship a **snapshot JSON in `/data`** as fallback. Live fetch is optional; the game must work offline from the snapshot.

## Repo structure
```
/index.html        entry point
/src/              game code (modules, see ownership)
/assets/           sprites, icons, sounds
/data/             DONKI snapshot + event/content JSON + texts
AGENTS.md          this file
CLAUDE.md          imports this file
AI_USAGE.md        log of AI tool usage (required for submission)
CREDITS.md         asset + data sources and licenses
LICENSE            MIT
```

## Module ownership
Only change files in your own module unless the task explicitly says otherwise.
- **Core** (game state, resources, turn loop, rules): _TBD Saturday_
- **Presentation** (screens, UI, sprites, animations): _TBD Saturday_
- **Data + content** (DONKI loader, snapshot, events JSON, learning texts, end screen facts): _TBD Saturday_

## Interfaces
_To be defined Saturday morning before any code is written:_
- Game state shape
- Event JSON format
- Functions modules use to talk to each other
- Sprite list (file names + sizes)

## Workflow
- `main` must always be playable. GitHub Pages deploys from `main`.
- One branch per task, small pull requests, merge every 30–60 minutes.
- Pull/rebase from `main` before starting a new task.
- Small, focused commits with clear messages. Never force-push.
- Do not add new dependencies or frameworks without asking the team.
- After each task: append one line to `AI_USAGE.md` (tool, what it did).

## Tech stack
Decided Saturday 14 Nov: **Phaser 3.90.0 via CDN**, plus our own code as plain ES modules. There is no build step.
- Load it with one pinned script tag: `<script src="https://cdnjs.cloudflare.com/ajax/libs/phaser/3.90.0/phaser.min.js" integrity="sha512-/tJYyDCrI7hnHWp45P189aOwPa6lTREosRhlxEIqx8skB4A3a3rD3iz4o335SJd4sORqjVHw5y1S2hq4hciwLw==" crossorigin="anonymous"></script>` (SRI hash verified against the file 2026-11-14). That exposes the global `Phaser`. Do not use npm or a bundler, and do not upgrade to Phaser 4 without asking the team.
- Game rules (state, resources, clock, events, scoring) live in plain modules with **no Phaser import**. Scenes only draw state and send actions back.
- The `phaser-core` skill targets Phaser 4 with npm. Use its scene lifecycle and architecture advice, and ignore its npm/`import Phaser` setup and Phaser 4-only APIs.
- Design reference: `GAME_DESIGN.md`. Data reference: `data/README.md`.
