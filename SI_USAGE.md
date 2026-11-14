# SI Usage Log

NASA Space Apps calls these tools **Super Intelligence (SI)**: machine learning, chatbots, image generation and large language models. The submission guide asks us to show clearly where and how SI tools were used. This log is the descriptive text for code and data; `si-manifest.json` is the machine-readable metadata. See `SI_DISCLOSURE.md` for the rules and how we label things.

One line per task: date, SI tool, what it did. The team reviewed and merged every change.

| Date | SI tool | What it did |
|------|------|-------------|
| 2026-11-12 | Claude Code (Claude Opus 5.5) | Set up repo scaffold (LICENSE, CREDITS, README, .gitignore, placeholder index.html), fetched DONKI snapshots into /data/donki, added project skills for playtesting and shipping tasks. |
| 2026-11-12 | Claude Code (Claude Opus 5.5) | Researched and vetted agent skills; added frontend-design (Anthropic) and five gamedev-skills skills at pinned commits; wrote kids-ux skill. |
| 2026-11-14 | Claude Code (Claude Opus 5.5) | Tested challenge resources (DONKI, RadLab, OSDR, Mars Trek, APOD, CSA) for availability and CORS; built RadLab May 2024 radiation snapshot plus reproducible script; wrote data/README.md. |
| 2026-11-14 | Claude Code (Claude Opus 5.5) | Scanned the full RadLab archive for radiation spikes; built a storm library of six real historical storms (DONKI events + RadLab dose rates) with a reproducible script; fixed naming rules (live vs. archived) in data/README.md. |
| 2026-11-14 | Claude Code (Claude Opus 5.5) | Wrote GAME_DESIGN.md from team discussion (Moon setting, 3 resources, time model, Call Earth help with cooldown, real-data events, unlocks, rocket to Mars end goal). |
| 2026-11-14 | Claude Code (Claude Opus 5.5) | Updated GAME_DESIGN.md (feel principles, crewmate guide, Call Earth explains why, continuous time, jury data depth) and AGENTS.md tech stack (Phaser 3.90.0 via CDN); vetted and added phaser-core skill. |
| 2026-11-14 | Claude Code (Claude Opus 5.5) | Built the game foundation: rules engine with tests (real lunar day/night, storm timeline, cards, repairs, dose, Call Earth advice), HTML/CSS HUD for phone/tablet/desktop, Phaser placeholder Moon base scene, start/end screens, art hook; playtested at 390×844, 820×1180, 844×390 and 1440×900. |
| 2026-11-14 | Claude Code (Claude Opus 5.5) | Added guided first steps from the team's kids game design guide: one-at-a-time hints with glowing controls, a safe scripted first leak that holds the clock, hints that fade and can be switched back on in the pause menu; playtested on phone size. |
| 2026-11-14 | Claude Code (Claude Opus 5.5) | Switched all docs from "AI" to the Space Apps term "SI"; wrote SI_DISCLOSURE.md (official labeling rules, voice and sound plan) and si-manifest.json; added SI header comments to code, an SI credit line, and an in-game watermark on the SI-generated placeholder art. |
| 2026-11-14 | Claude Code (Claude Opus 5.5) | Added features from the team's kids game design guide: invisible difficulty adjustment for random problems (with tests), badges and effort praise, fun-fact easter eggs on Earth and the Sun, synthesized sound effects with a sound button, read-aloud with the device voice; playtested on phone, phone landscape and desktop. |
| 2026-11-14 | Claude Code (Claude Opus 5.5) | Made the game explain itself: "How it works" sheet (start screen, pause menu) with real vs. made-up and a note for judges; framed the shield as test tech (magnet shield, new word); Call Earth now names the exact change and explains the result; playtested on phone size. |
