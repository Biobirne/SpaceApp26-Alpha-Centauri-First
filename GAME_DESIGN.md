# Game design

Status: agreed direction, Saturday 14 Nov 2026. Details marked **(open)** are decided during the build, depending on time.

## One sentence
**You run a Moon base for one month during a real solar storm, and you split your power between keeping the crew safe and doing science.**

## Who and how long
- Players are kids aged 7–12 on a phone. See the `kids-ux` skill for the rules.
- **One mission takes 5–10 minutes.** In that time a child must have felt the main lesson. Longer play is a bonus that comes from unlocks, never a requirement.
- It must be intuitive and never boring. If a calm stretch feels slow, speed it up. If a moment matters, slow it down.

## How it should feel (the north star)
1. **A kid can do it, and feels smart doing it**, whatever their actual skill. It should never feel like "rocket science is too hard". It should feel like "I'm doing rocket science!"
   - Praise good choices and say why. For example: "Smart move! Your shield blocked 9 out of 10 radiation particles."
   - After a bad outcome, explain without blame and show the fix. For example: "The storm was stronger than expected. Next time, try raising the shield when a flare warning comes."
   - New science words are earned like trophies. "New word: solar flare ✓" appears in the mission log.
   - Titles grow with play: Cadet → Flight Engineer → Base Commander.
2. **Never boring, even for kids used to TikTok.**
   - Something visible happens every 10–20 seconds: a flare flash, a crew line, a bar moving, a particle burst.
   - Every tap gets instant feedback (under 100 ms), with motion and sound.
   - Text is short: at most two short lines per speech bubble.
3. **Not too shallow for the jury.** The depth is there, one tap away.
   - The kid sees "278× normal radiation".
   - A **"Show real data"** button opens the real numbers: µGy/h, instrument, spacecraft, date, the flare class, and a mini chart of the 30 days.
   - The end screen links every number to its NASA source (see `data/README.md`).

## Your crewmate (the guide)
An astronaut character **pops in from the side** with a speech bubble. They are the voice of the game:
- They announce events: "Whoa, a big flare just went off on the Sun!"
- They react to the player's choices: "Good call, Commander!"
- They deliver the answers from Mission Control.
- They are friendly, a little funny, and never scary. They are always okay, even when the base struggles.
- They are drawn by the team or taken from a CC0 asset pack (no SI art). Their name is **(open)**.

## Setting: the Moon (decided)
Why the Moon:
- The radiation trade-off is strongest there. Our real data shows the Moon getting up to about 1800× its normal radiation during storms, because it has no air and no magnetic field.
- The lunar night gives a second simple, real trade-off for power.
- Kids can see the Moon in the sky, and Artemis is in the news.

Mars appears as the **end goal** (see "Rocket to Mars") and in the end-screen comparison.

**Honesty notes:**
- Our Moon radiation numbers come from the LRO spacecraft in **lunar orbit**. On the surface the dose is roughly half, because the Moon itself blocks half the sky. In-game text says "near the Moon" or "measured in orbit around the Moon".
- The site is a mid-latitude Moon base, so the lunar night applies. At the poles, where Artemis plans to land, some ridges get almost constant sunlight. Mention this on the end screen if there's time.

## Core resources (3, no more)
| Icon | Resource | Real thing it stands for |
|------|----------|--------------------------|
| ⚡ | **Power** | Solar panels charge batteries in daylight. During the lunar night (about 14 Earth days outside the polar regions), only the batteries remain. |
| 💨 | **Air** | Life support. It needs power every day. |
| 🛡️ | **Shield** | Radiation protection. A stronger shield costs power. The crew can also go to a shelter, which stops science. |

As built, the shield is a **control** (Off / Low / Mid / Max, each with its power cost shown on the button), and the third bar is the **crew dose** it protects: radiation the crew has taken in, out of a safety limit of 100. The dose bar is what makes the shield choice visible.

**Science** is the score. The crew earns it on days with no emergency. It is not a resource to manage.

Food is mentioned in the challenge. It can appear as an event or end-screen fact. It does not get a fourth bar. (The challenge itself advises 2–3 core resources.)

## Time
Time flows continuously; the game is not turn-based. Phaser drives a game clock.
- **One mission = 30 Earth days.** That is exactly one storm file in `data/storms/` and about one full lunar day-and-night cycle (29.5 days).
- **Normal speed:** 1 day ≈ 15 s, so a full mission takes about 7.5 min.
- **Fast-forward** (⏩ button) on calm days: 1 day ≈ 5 s.
- **When something happens, time slows down to a crawl or stops.** The crewmate pops in and a decision card appears. The clock **pauses until the player chooses**, so a child never loses for reading slowly.
- **Real-time moments.** A few things play at their true speed on purpose, such as the 2.6 s call to Earth. These are the "wow, that's real" moments.
- The HUD shows the speed openly, for example "⏩ 1 day = 15 s". We never pretend the game runs in real time.

## Events come from real data
Each mission plays one storm from `data/storms/` (archived NASA measurements) or, once unlocked, the live month from DONKI.

| Real data | What happens in the game |
|-----------|--------------------------|
| DONKI flare (class M or X) | A warning card. The bigger the class, the stronger the warning. Choices cost power or science. |
| DONKI particle event (SEP) | Radiation is coming. Raise the shield or send the crew to the shelter. |
| RadLab `timesNormal` for `moonOrbit` on that day | **How strong the radiation really was** ("278× normal"). Combined with the player's shield level, it gives the crew's dose. |
| DONKI CME speed | Flavour text: "A cloud of solar material is racing out at 1500 km per second." |

Every decision offers 2–3 options. Each option shows its cost before the tap and its result after (see `kids-ux`). No option is free, and none is always best.

## Calling Mission Control (help with a cooldown)
Mission Control on Earth is the player's **help button**, not a punishment.

- Tap **"Call Earth"**. A light dot flies to Earth and back in a real **2.6 s**, the true radio round trip between Earth and the Moon. That's the moment to say: "Even light needs time to travel!"
- The answer is a **concrete tip and the reason for it**, using the real numbers. The child learns the *why*, not just the *what*. For example:
  - "Raise your shield to 3, because particles from yesterday's X8 flare are arriving. Radiation near the Moon is 278× normal right now."
  - "Pause the science for 2 days, because night is coming and your batteries are only half full. Solar panels can't charge in the dark."
- **(open)** A **"Do it for me"** button under the tip, which applies the setting automatically. It helps younger players. Alternatively the tip only highlights the right control. Decide after the first playtest with a kid.
- **Cooldown:** after a call, the button recharges over a few in-game days. The game shows this as a filling ring. The text "Mission Control is working out the next plan" makes clear that this is a game rule, not a physics limit.
- If the player is in trouble (a resource in the warning zone, or several bad choices in a row), the button gently pulses. No forced pop-ups.

## Failure is safe
- Each resource warns at about 25 %, using colour, icon and text.
- At 0 the player gets a setback, not a game over. Examples: "The crew moved to the shelter. You lost 2 days of science." "Life support switched to emergency mode."
- The astronauts are always okay. The base and the science suffer.
- The end screen celebrates any result and gives one tip for next time.

## End screen (the lesson)
- What happened, with the real numbers. For example: "On 14 May 2024 the radiation near the Moon was 278× normal. Your shield blocked most of it."
- **The real comparison, same day, from the same storm file:**
  - "On Mars it was only 15×. Mars has a thin atmosphere."
  - "On the space station it was about 1×. Earth's magnetic field protects it."
- A science score and 1–3 stars.
- Data attribution, with the label "Archived NASA measurements, <month year>".

## Progression and unlocks
1. **The storm library as levels.** The suggested order is: Oct 2021 (gentle) → May 2024 → Mar 2024 → Sep 2017 (extreme). Each finished mission unlocks the next. Feb 2022 and Nov 2025 are for the Mars and rocket content.
2. **Live mission.** Unlocked after the first mission: "The real Sun this month", using DONKI fetched live. The radiation factor is then estimated from similar past storms, and the game labels it as an estimate.
3. **Rocket to Mars, the end goal.** Unlocked after a few missions. Grounded in real facts:
   - Earth and Mars line up for a launch about **every 26 months**. The trip takes **about 7 months**.
   - In deep space there is no air and no magnetic field. Our BioSentinel data shows what storms do out there (up to about 300× normal).
   - Once at Mars, a radio message to Earth takes **between about 3 and 22 minutes one way**.

   **(open)** What happens after launch depends on remaining time. In order of effort:
   1. The game ends with a launch celebration and a "you made it" screen with real facts.
   2. The player can launch more rockets (collection or score).
   3. A cruise phase: one deep-space storm, played from `nov2025.json` or `mar2024.json` deep-space data.
   4. A Mars base with the **warning race**. The warning from Earth takes minutes, and the fastest particles might arrive before it. Do you act now or wait for advice? The animation is shortened and labelled "sped up", and the real minutes are shown.
4. Progress is saved in `localStorage`. No account and no personal data.

## Real vs. game rules (keep this line clear)
| Real (from NASA data or physics) | Game rule (say so if asked) |
|----------------------------------|-----------------------------|
| Storm dates, flare classes, particle events, CME speeds | Time compression, shown as "1 day = 15 s" |
| Radiation factors per site and day | Exact power and air costs per action |
| Earth–Moon radio round trip of 2.6 s | The cooldown on calling Mission Control |
| Lunar night of about 14 days, launch windows every 26 months, a 7-month trip to Mars | Science points and stars |

## Build order (cut from the bottom)
1. **One playable Moon mission with one storm** (May 2024), using grey boxes and no art: start → 30 days → end → restart. Test it with a real kid or teammate. (See `prototype-fast`.)
2. Event cards with costs, the 3 bars, shield and dose.
3. The end screen with the real comparison and attribution.
4. Call Earth (2.6 s round trip, tips, cooldown).
5. Speed controls (normal, fast-forward, pause on event).
6. Art and sound pass. Juice only after the loop is fun (see `game-feel`).
7. The storm library as levels, and unlocks.
8. The live DONKI mission.
9. The rocket to Mars (option 1 first).

## Tech (decided)
**Phaser 3.90.0** (the final Phaser 3 release) via cdnjs, as a plain `<script>` tag. It exposes the global `Phaser`. There is no npm and no build step, so it stays a static site for GitHub Pages. The download is about 320 KB gzipped.

Why Phaser rather than plain HTML:
- a real-time game clock with slow-motion and pause;
- tweens and particles for flares, the shield glow and solar wind;
- an easy pop-in crewmate.

Architecture rule (from the `phaser-core` skill):
- **Game rules live in plain JS modules with no Phaser import.** These modules hold resources, the clock, events and scoring.
- Phaser scenes only draw the state and send player actions back.
- This keeps the rules testable without a browser and makes a restart just a fresh state.

## What the foundation build has (14 Nov)
Everything below runs on placeholder art. The real art replaces it via `assets/art/manifest.json` (see `assets/art/README.md`).
- **Real sky.** Lunar day and night are computed for the real storm dates at a base in the Sea of Tranquility, near the Apollo 11 site (mean synodic month, so about ±1 day). Earth's phase is computed too.
- **Decision cards** (game pauses until the player picks):
  - The first X-class flare, then only new record flares. Smaller big flares are a flash plus a crew line.
  - Every particle storm onset (merged within 1 day).
  - Options show their cost and how much they block before the tap. The crew says what happened after.
- **Among Us-style repairs.** These are random but realistic:
  - A micrometeoroid leak (tap 4 cracks).
  - Dust on the panels (wipe 5 panels).
  - A clogged CO₂ filter (3 steps in order).
  - A leaking lab or greenhouse is sealed after 2.5 days and can be rebuilt for 30 science.
  - A to-do list shows open repairs; rooms can also be tapped in the scene.
- **Safe failure.**
  - Battery at 0: the shield and lab switch off until it recharges.
  - Air at 0: emergency oxygen tanks, minus 10 science.
  - Dose at 100 during a storm: everyone goes to the shelter until it calms.
  - Warnings come first.
- **Call Earth.**
  - The real 1.3 s each way is animated.
  - The tip always comes with a "Why?" and real numbers.
  - "Do it for me" or "Fix it now" applies the tip.
  - 3-day cooldown.
- **Time.**
  - 1 day = 15 s, or 5 s when fast.
  - The scale is shown under the speed buttons.
  - Fast-forward drops back to normal when something happens.
  - The game pauses on cards, repairs, calls, menus and when the tab is hidden.
- **Guided first steps** (scaffolding and fading, from `Guide_Gamedesign_Attention.md` 3.2 and 3.3):
  - A new player meets one thing at a time: the bars, then a safe first leak (the clock waits until it is fixed), then the shield, then fast-forward.
  - Later, when it fits: Call Earth after the first hard moment, and the real-data chip when radiation is high.
  - The control to try glows together with the crewmate's sentence about it.
  - Each hint shows once, and a hint is skipped if the kid already did the thing.
  - Hints can be switched off and on again in the pause menu (help on demand).
  - Code: `src/ui/guide.js`. The scripted first leak is a `script` option of `createMission`.
- **New science words** appear in the crewmate's bubble next to the sentence that uses them, and are collected on the end screen.
- **Stars:**
  - 1 for finishing.
  - 2 for a safe crew with at least half the science goal.
  - 3 for the full goal (120) with no room lost.
  - Hiding in the shelter all month is safe but earns one star.
- **Progress** is saved in `localStorage` only. Levels unlock in order. `?all=1` unlocks everything for judges. `?storm=<id>` starts a storm directly. `?debug=1` exposes a skip helper for playtests.
- **From the team's kids game design guide (second round):**
  - **Invisible difficulty adjustment.** Only the random problems (leaks, dust, filters) adapt; the NASA storm data never changes. Each setback or sealed room raises a level (max 2): problems come later, and only one at a time. Four calm days lower it again, down to −1 (problems come about 15 % sooner). Tuning: `dda` in `src/rules/config.js`.
  - **Badges** for ways of playing (fix 3 problems, no sealed room, no emergency, block most radiation, ask Mission Control, build an upgrade, reach the science goal). The collection is on the start screen. The end screen praises the effort or strategy the kid actually used.
  - **Easter eggs:** tap Earth or the Sun for true fun facts (`FUN_FACTS` in `src/rules/content.js`).
  - **Sound:** effects synthesized live with Web Audio (`src/audio/sfx.js`, no files). Starts with the first tap; a sound button sits in the top bar and on the start and end screens.
  - **Read aloud:** a speech button next to the crewmate's bubble reads the line with the device's own voice; the pause menu can turn on reading every line (`src/audio/voice.js`).

## Still to decide today (team)
- Interfaces: a first version is in `AGENTS.md` (from the foundation build). Change it there if the team wants something else.
- Game title: "Moon Base Commander" is a placeholder (`GAME_TITLE` in `src/ui/screens.js`). The crewmate's name "Sam" is a placeholder too (`CREWMATE_NAME`).
- Art style and who draws (no SI images; `CREDITS.md` for everything).
- Exact numbers: costs, cooldown length, shield levels. Tune them by playtesting, not on paper.
