# Alpha Centauri First – Moon Base Commander

NASA Space Apps Challenge 2026, Vienna. Challenge: "Build a Junior Astronaut Mission Trainer".

A browser game for kids aged 7–12. You run a small base on the Moon for 30 days while a real solar storm from the past hits it. Every choice costs something: power against protection, safety against science. The storms, flares and radiation levels are archived NASA measurements (DONKI and OSDR RadLab), replayed day by day.

"Moon Base Commander" is a working title, and so is the crewmate's name, Sam.

**Play:** not online yet. GitHub Pages is not switched on (the repo is private). Run it locally, see below.

## What's in the game
- **Six real storms (2017–2025)** as levels, unlocked one after the other. Easy, Normal or Hard, each explained on the start screen.
- **Three bars:** power, air and the crew's radiation dose. Science points are the score.
- **Choices with a cost:** the shield (a magnet shield, labelled as test tech), the storm shelter, repairs, spacewalks (no shield outside, and Moon dust comes back in), upgrades, fast-forward.
- **Call Earth:** Mission Control gives one tip with the reason behind it, after a real 2.6 s radio round trip.
- **Sam, the crewmate:** guided first steps, the story, lessons after mistakes, and read-aloud with the device's voice.
- **Life support loop:** air and water are recycled. The oxygen machine needs power, plants need lamps, and an algae bioreactor can help.
- **Learn more on tap:** every building, every bar, Sam (spacesuit facts from Apollo), a "How it works" sheet, and a panel with the real NASA numbers.
- **Rewards:** stars, ranks and badges. Sound effects are synthesized in the browser.

Design, decisions and build status: [GAME_DESIGN.md](GAME_DESIGN.md). Feedback and what we did with it: [FEEDBACK.md](FEEDBACK.md).

## Run locally
No build step and no dependencies. ES modules need an HTTP server, not `file://`:

```sh
python tools/serve.py 8000
# open http://localhost:8000
```

`tools/serve.py` works like `python -m http.server`, but it turns off caching, so a reload always loads the latest code. It listens on all network interfaces, so a phone in the same Wi-Fi can open `http://<your-laptop-ip>:8000`.

Useful URL options:

| Option | What it does |
|--------|--------------|
| `?all=1` | Unlocks every storm (for judges) |
| `?storm=may2024` | Starts a storm directly |
| `?seed=5` | Makes the random problems repeatable |
| `?debug=1` | Adds `window.__moonbase.skip(days)` to jump ahead in playtests |

## Tests
The game rules are plain JavaScript with no Phaser and no DOM, so Node can test them (Node 18 or newer):

```sh
npm test
```

## Project files
| File | What it is |
|------|------------|
| [AGENTS.md](AGENTS.md) | Rules for everyone who works on the code, people and coding agents |
| [GAME_DESIGN.md](GAME_DESIGN.md) | The game design, what is real and what is made up, and the build status |
| [RESEARCH.md](RESEARCH.md) | How the game should teach kids aged 7–12: learning goals, the teaching test, a realism check |
| [FEEDBACK.md](FEEDBACK.md) | Feedback from mentors, playtests and SI review, with our decisions |
| [data/README.md](data/README.md) | The NASA data, how the storm library was built, and the wording rules (archived, not live) |
| [assets/art/README.md](assets/art/README.md) | How the team's art replaces the placeholder drawings |
| [CREDITS.md](CREDITS.md) | Every data source, font and asset, with its license |
| [SI_USAGE.md](SI_USAGE.md), [SI_DISCLOSURE.md](SI_DISCLOSURE.md), [si-manifest.json](si-manifest.json) | Where SI tools (Super Intelligence, the Space Apps term) were used, and how it is labelled |

## License
MIT, see [LICENSE](LICENSE). The NASA data stays NASA's; see [CREDITS.md](CREDITS.md).
