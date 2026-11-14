# Alpha Centauri First – Junior Astronaut Mission Trainer

NASA Space Apps Challenge 2026, Vienna. A browser game for kids aged 7–12: run a lunar/Martian outpost and make trade-offs between power, life support, radiation shielding, food and communication delay, driven by real NASA space weather data (DONKI).

Play: _GitHub Pages URL goes here_

## Run locally
No build step. ES modules need an HTTP server (not `file://`):

```sh
python -m http.server 8000
# open http://localhost:8000
```

Test on a phone in the same Wi-Fi: `python -m http.server 8000 --bind 0.0.0.0`, then open `http://<your-laptop-ip>:8000`.

## Data
`/data/donki/` holds snapshot JSON from NASA CCMC DONKI (see `manifest.json`). The game works offline from these snapshots.

## Rules for contributors
See [AGENTS.md](AGENTS.md). Game design: [GAME_DESIGN.md](GAME_DESIGN.md). Data: [data/README.md](data/README.md). Log AI tool usage in [AI_USAGE.md](AI_USAGE.md), asset licenses in [CREDITS.md](CREDITS.md).

## License
MIT, see [LICENSE](LICENSE).
