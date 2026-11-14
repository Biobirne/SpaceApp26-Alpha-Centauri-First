---
name: playtest
description: Start the game locally and check it in a real browser at phone and desktop size (screenshots, console errors, touch flow). Use after any change to index.html, src/, assets/ or data/, before saying a task works, or when asked to run/test/screenshot the game.
---

# Playtest the game

The game is a static site with no build step. Checking it means serving it over HTTP and looking at it in a browser.

## 1. Serve
Start a server in the background from the repo root (ES modules do not load from `file://`):

```sh
python tools/serve.py 8000
```

It works like `python -m http.server` but turns off caching, so a reload always loads the latest modules. If port 8000 is busy, use 8001. Reuse a server that is already running.

Useful URLs: `?storm=may2024` starts a storm directly, `?all=1` unlocks every storm, `?seed=5` makes random events repeatable, and `?debug=1` exposes `window.__moonbase.skip(days, pick)` to jump ahead (cards are answered with `pick(card)`, by default the first option). Progress lives in `localStorage` (`moonbase.progress.v1`): a fresh browser profile shows the guided first steps again.

More test entry points: `?intro=1` runs the intro (training), and `?intro=dust`, `leak`, `filter`, `storm` or `night` jumps to one lesson. `minigame.html?game=dust` or `?game=fort` opens one mini-game on its own.

## 2. Look at it (Playwright MCP)
Use the `mcp__plugin_playwright_playwright__*` tools. If Playwright is unavailable, fall back to Claude in Chrome.

1. Phone first: `browser_resize` to **390x844**, then `browser_navigate` to `http://localhost:8000/`.
2. Take a screenshot and save it under `playtest-screenshots/` (gitignored).
3. Run `browser_console_messages` and report every error or warning. 404s count as failures.
4. Click through the flow you changed: start, make one choice, see what it costs, reach the next turn. Use clicks or taps only. No hover-only UI and no keyboard-only controls.
5. Repeat at desktop size **1280x800**.
   For layout or CSS changes, also check a small phone (**360x740**), a phone held sideways (**844x390**) and a tablet (**1024x768**).
6. Close the browser when done.

## 3. Check against the hard rules
- No horizontal scrolling at 390px. Tap targets are at least 44px.
- Text is English and readable for a 7-year-old: short sentences, no jargon without explanation.
- The NASA data attribution is visible on screen. Archived data is labelled "archived" (see `data/README.md`), never "live".
- Nothing fails offline. Once loaded, the game plays from `/data/storms/` alone and makes no data requests.
- Total download stays small. Check the sizes of new files in `assets/`.

## 4. Report
Report in short bullets: what you clicked, what you saw (with screenshot paths), any console errors, and any rule violations. Do not claim it works without a screenshot and a clean console.
