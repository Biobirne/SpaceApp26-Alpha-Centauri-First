# Feedback log

Every piece of feedback we got, what we decided and where it stands. Newest round on top.
**Top priority for every change: the game must teach.** If a child plays one mission and cannot say why we clean the panels, why the crew goes to the shelter, or where the oxygen comes from, we have failed the challenge, however good it looks. Research and proposals: `RESEARCH.md`.


## Mentor who worked on Apollo (14 Nov 2026)

Facts about the Moon to make the game more real, or to use as fun facts. He stressed the spacesuits and Moon dust most.

| # | Feedback | What we do | Status |
|---|----------|-----------|--------|
| A1 | Radiation limits a stay on the Moon to about one year | Fun fact from Sam, and on the dose bar's info sheet. Checked: China's Chang'e 4 lander measured about 1.4 mSv a day on the surface, so a year is about 500 mSv; NASA's career limit is 600 mSv | Done |
| A2 | Radiation is central for a lunar base | It already drives the game (real storms, shield, shelter, dose). New: spacewalks happen outside the shield, so in a storm they cost dose | Done |
| A3 | Moon dust is a main danger: it gets everywhere and harms the lungs | Cleaning the solar panels is now a spacewalk. Dust carried back inside can clog the air filter a day later, and Sam says why. New upgrade "Suitports" keeps the dust outside. Facts: "lunar hay fever" (Apollo 17), dust wore through boot layers | Done |
| A4 | Apollo suits: oxygen tanks, water for drinking and cooling, about 30 minutes of emergency oxygen | Tap Sam for spacesuit facts; the spacewalk panel names what the suit carries; Sam's chatter tells the Apollo versions | Done |

## Mentors (14 Nov 2026)

| # | Feedback | What we do | Status |
|---|----------|-----------|--------|
| M1 | Explain the materials needed to build an outpost like this | Sam explains materials and real plans in calm moments; every building's info sheet has a "Built from" part | Done (round 1) |
| M2 | Focus on sustainability: resources in a recycling loop | The air sheet shows the life support loop with live status: crew → CO₂ filter → water recycler (98 %, like the space station) → oxygen machine (splits water with power) → crew. Tap a step to learn it. Plants need LED lamps that cost power: switch them off to save power at night, and they stop helping the air. Made honest after `RESEARCH.md` section 3: machines make most of the oxygen, plants help | Done (round 2) |
| M3 | Bio-based life support technologies | Plants (lamps on or off) and a new upgrade, the algae bioreactor: more oxygen, a clogged filter hurts half as much, uses a little power. Real: ESA MELiSSA, spirulina on the space station in 2017 | Done (round 2) |
| M4 | Rewarding system | Badges and stars exist; add a badge for hard mode | Done (round 1) |
| M5 | Increasing difficulty, maybe 3 levels, explain each | Easy, Normal, Hard on the start screen, each with one sentence; adaptive difficulty stays on top | Done (round 1) |
| M6 | Improve storytelling | Mission briefing at the start; history and "how it could look for real" lines from Sam (Project Horizon 1959, the August 1972 storm between Apollo 16 and 17, Artemis) | Done (round 1) |
| M7 | The player places each building to learn its purpose | A short build phase before the first mission: tap a free spot, the module appears with one sentence about its job; tunnels connect them automatically | Round 3 |
| M8 | Make players aware why they made a mistake | When something runs out, Sam says why it happened and what to do next time; the end screen lists these lessons | Done (round 1) |
| M9 | Let curious players learn more | Tap any building for an info sheet (what it does, real life, built from, fact); tap the power, air and dose bars for a live breakdown | Done (round 1) |
| M10 | Mini-games should make sense: show what is broken and what each tap does | Rework repairs: find and patch the hole, wipe the panels and watch power come back, swap the CO₂ filter step by step, connect a cable or a water pipe | Dust done (brush the panels, power meter climbs, sticky dust lands again, real 2025 dust shield fact); leak, filter and storm fort next |

## Team

Team members playing themselves: name, device, build, what you noticed. Priority: **P1** = fix before the demo, **P2** = should fix, **P3** = nice to have.

### Florian (14 Nov, ~13:00)
- Device / build: laptop, Brave, `main` @ `d1d04ee` (after PR #9).

**The biggest problem: the game is hard to follow.**
- The intro at the start is great, but after it the game stops explaining. I did not know what I was doing wrong.
- The end screen told me I should have sent the crew to the shelter. I did not even know that was possible.
- When my oxygen dropped, I did not know why.
- **Status (feat/feedback-clarity):** the first steps now teach the shelter: Sam asks the kid to send the crew in and back out once, and the clock waits. After each storm, Sam gives a storm report (see the SI review below).
- I did not find it intuitive where science points come from, or what they do.
- The cards that kept popping up said an event was coming that needs power. I did not understand what they changed or what had happened afterwards.
- I am not sure how realistic the shield is. It may be fine, but we should check.

**Explanations and tips have to be much clearer.**
- Sam's speech bubble is small and sits at the bottom. You first have to notice that it tells you what to do. It must be much more dominant, especially at the start, when the game explains what exists.
- We need better tips, and it must be easier to learn how the game works.
- Think like a 7-year-old: why do we have solar panels? Why plants? The game should say it in one breath. For example: "Solar panels make our power. Dust covers them, and covered panels make no power, so we keep them clean." Then the cleaning task makes sense.

**The mini-games are all the same, and they don't teach.**
- They all play the same way, and the game does not say what we are doing or why.
- They could look much nicer, for example cleaning a solar panel or repairing damage.
- Each one should explain the real concept behind it. The game is meant to teach.

**Ideas (not decided):**
- Introduce the buttons one at a time, maybe in a short intro mission.
- The player only moves on once they have understood a concept.
- At the start, the player places the Moon base modules themselves, so they learn what each one is for.
- Resources on the Moon are limited. Science could be open-ended, but repairs could use up limited materials.

**Look:** the UI colours feel generic, like the cheap SI style. This shows most in the bars and on the end/results screen. We should stand out from that.

### Florian (14 Nov, ~15:30)
- Device / build: laptop, Brave, `main` after the mentor rounds 1 and 2 (#13–#17), plus the first dust mini-game (#19).

**P1: The game stresses me out instead of teaching me.**
- I nearly lost the base before I even got to the solar panel task.
- It feels like a website with more tabs and a cleaner look. I can't see where the learning happens.
- There is too much to read, and I don't read it all. I doubt any kid will.
- Idea: when Sam gives a tip, pause the game until the player has done it.

**P1: Testing must be quick.** Open a mini-game directly, without playing a whole mission first. Done: `minigame.html?game=dust`.

## Automatic SI review

Claude Code (SI) playing the game and reviewing it.

### SI playtest 1 (Claude Code, 14 Nov, ~12:00)
- Build: `main` @ `8ddf880` (after PRs #6–#8).
- Played: October 2021 storm, fresh player (hints on), phone size 390×844. Mostly fast-forward. Card choices were deliberately mixed, including "Keep working (Risky)".
- Result: "Perfect mission", 3 stars, 132 science (goal 120), crew dose 9/100, 68% radiation blocked. No console errors.

#### What works well
- **The first minute.** You land straight in the base. Sam talks, and the first leak holds the clock ("Clock waits for you") until it is fixed. This matches the "first 60 seconds" finding in `GAME_DESIGN.md` ("Designing for kids aged 7–12").
- **Costs before the tap.** Shield Off/Low/Mid/Max shows "−1.5 ⚡/day" and so on. This is the core requirement of the challenge.
- **Real data feels real.** There are badges ("Real solar flare", "Real particle storm"), a radiation chip ("9.1× normal") and a data button. The end screen compares the same day: "Near the Moon 42×, On Mars 2.1×". Strong for the jury.
- **"Words you learned"** turns 8 science words into trophies. The idea is great.
- **Crisp on phone and laptop.** The canvas renders at device pixel ratio, and the HUD is HTML/CSS.
- **SI labelling** is already handled.

#### Problems

**P1: Too easy, so the trade-off is not felt.**
- A semi-random strategy got a perfect score, including choosing "Keep working (Risky)" during a particle storm.
- The risky choice had no visible consequence. If nothing can go wrong, no choice really costs anything, and that is the heart of the challenge.
- Idea: storm 1 can stay gentle, but the risky option should cause one clear, explained setback at least once.
- **Status: done.** After each storm Sam gives a storm report: the dose the crew got, next to what the shelter would have let through ("+20 dose. In the shelter it would have been about +2. Working costs safety."). The setback itself stays gentle.

**P1: All mini-games are the same game.**
- All four repair types (`src/ui/overlays.js`, `showRepair`) are "tap N buttons":
  - leak: tap scattered wrenches
  - dust: tap or swipe tiles
  - filter: tap 3 labelled buttons in order
  - rebuild: tap placeholders
- None of them needs skill or can be failed, and none teaches anything.
- They also come often: 8 repairs in one mission, 2 of them before the first real event, so they start to feel like chores.
- Ideas:
  - Make each one teach one true thing in ≤ 20 s. For example:
    - Lunar dust is sticky and sharp, so wiping takes strokes in one direction.
    - A leak is found by watching the pressure gauge drop.
    - A filter swap is about the CO₂ level.
  - Make each repair cost something, such as power or a crew member's time, so it is also a trade-off.
  - Fewer repairs, more variety.

**P1: Long empty start.**
- The first decision card came on day 14, about 2–3 minutes in. Days 1–13 had only leaks and fun-fact bubbles.
- A judge or a kid may stop before the storm arrives.
- Idea: start the mission a few days before the first big event, or compress calm days automatically.
- **Status: done.** Calm days pass 3× faster once the first steps are over (nothing broken, low radiation, no storm on the way); the speed note says "Calm days". First event: October 2021 storm after about 80 s instead of 205 s.

**P2: Repetitive event cards.**
- The same "Particle storm!" card with identical text came on days 14, 18 and 20.
- Its options ("Shield to Max", "Crew to shelter") repeat the HUD controls, so the card adds little.
- Idea: use the real numbers of that day ("Second wave! 42× normal today"), give each wave its own line, and offer different verbs than the HUD.
- **Status: partly done.** Each wave has its own title ("Second wave of particles!") and the real radiation of that day. Different verbs than the HUD: still open.

**P2: Speech bubble backlog.**
- Sam's queue grew to "6 more ›". The same line was shown again on the next day.
- Some tips arrived days late, for example "Not sure what to do? Call Earth" on days 15–16, after the decision.
- Too much text for a 7-year-old, especially in fast-forward.
- Idea: drop stale lines, and keep at most 1 queued line.
- **Status: done.** At most 2 lines wait; small news goes first, hints and lessons stay. A line that is already waiting is not added again. Urgent hints (like the shelter step) jump to the front.

**P2: Fast-forward resets after every event.**
- I had to re-tap ⏩ about 9 times in one mission.
- If this is on purpose (slow down for events), consider resuming fast-forward automatically after the event.

**P2: No warning before radiation rises.**
- On day 14 the radiation chip already showed 9.1× when the flare card appeared.
- Real physics gives a head start: flare light arrives in about 8 minutes, a CME takes 1–3 days, and particle storms take minutes to hours. That warning time is a planning moment the game does not use yet.
- **Status: done.** A day and a half before the first storm, Sam passes on a forecast from Earth ("the Sun has a big, busy sunspot ... Charge the battery!"), and calm days stop speeding up.

**P3: End screen text.**
- `src/ui/screens.js:88`: "The Moon has neither" is shown even when only the Mars line is visible, so "neither" refers to one thing.
- "6 leaks fixed" also counts filter swaps.
- The tip "keep an eye on the battery and the air" appears on a perfect run with nothing low.
- **Status: "neither" fixed** ("no thick air and no magnetic field"). The leak count and the tip are still open.

**P3: Laptop layout.** At 1440×900 the lower half of the screen is empty ground and the base sits small in the middle.

**P3: Look.** The placeholder art is clean, but the palette drifts to the common navy/purple look. The art direction is still open; see the research notes from 14 Nov:
- Real NASA images (SDO Sun, LRO Moon, Earth) for the sky and ground.
- Phosphor icons (MIT).
- Modules either placed by a human or labelled as SI.
