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
| M7 | The player places each building to learn its purpose | A short build phase before the first mission: tap a free spot, the module appears with one sentence about its job; tunnels connect them automatically | Done (intro: `?intro=1`, also the first visit and the Training button). The kid places the five buildings one by one, each with its job and its power cost, then meets dust, leak, filter and a storm drill once, with problem and fix before each. |
| M8 | Make players aware why they made a mistake | When something runs out, Sam says why it happened and what to do next time; the end screen lists these lessons | Done (round 1) |
| M9 | Let curious players learn more | Tap any building for an info sheet (what it does, real life, built from, fact); tap the power, air and dose bars for a live breakdown | Done (round 1) |
| M10 | Mini-games should make sense: show what is broken and what each tap does | Rework repairs: find and patch the hole, wipe the panels and watch power come back, swap the CO₂ filter step by step, connect a cable or a water pipe | Done: dust (rub the dust off), storm wall (test what stops particles, then stack it), leak (fog shows the hole, tape the patch), filter (pull out, build the Apollo 13 adapter, push in). Each has numbered steps or a test first, and a real story at the end. Test page `minigame.html?game=dust`, `fort`, `leak` or `filter`. Greenhouse and lab still have no event of their own. |

## Team

Team members playing themselves: name, device, build, what you noticed. Priority: **P1** = fix before the demo, **P2** = should fix, **P3** = nice to have.

### Florian (14 Nov, ~23:00)
- With an air problem the Air bar lights up and says "Clogged" in red. Tapping it (what you'd do by instinct) only opens the explanation. Tapping the broken part there only explains it too. There is no way to repair it from there.

**Status: done** (branch `fix/repair-from-sheets`): the bar sheets now put the fix first. Air shows "Swap the air filter", "Patch the leak in the …" or "Rebuild the greenhouse" as a big green button at the top; Power shows "Clean the solar panels"; Crew dose shows "Build the storm fort" before a storm. In the life support loop, tapping a broken step (the clogged filter, a leak) shows its sentence and a repair button right under it. Each button closes the sheet and opens the repair. No button when nothing is broken.

### Florian (14 Nov, ~22:30)
- The light in the greenhouse info sheet looks a bit random. Remove it or place it better.

**Status: done** (branch `fix/greenhouse-lamp`): kept, because the plant lamps are a real trade-off (power against air, mentor round 2), but placed better. The lamp is now a switch right under "Working fine.", the first thing in the sheet, and it looks like the switches in the pause menu (sun icon, On/Off). It flips in place, so the sheet stays open and the line under it shows the new cost ("Saves 1 ⚡ a day, but the plants don't help the air"). No extra pop-up covers the sheet. With an empty battery the switch shows "Off: the battery is empty."

### Florian (14 Nov, ~22:00)
- When radiation comes, the card offers options as if the shield were off. With the shield already high, "Shield to Mid" or the shelter's "Low" really turn it *down*. The wording should fit.
- Call Earth doesn't help with everything. With a building completely lost, Earth said everything is fine. It must really support confused kids who lost control, and maybe lost a building.

**Status: done** (branch `fix/storm-options-advice`):
- **Storm cards** are built when they appear, from the shield the kid has then: "Shield up to Max", "Keep shield on Max", "Shield down to Mid", "Crew to shelter, shield down to Low", "Stay in the shelter", "Back to work". Two choices that would end the same way become one.
- **Call Earth** now covers: a sealed building (rebuild it, or how many science points are missing and what the base lacks until then), an empty battery (wait for sunrise, clean the panels, or let it charge, with the %), the forced stay in the shelter ("wait, you are doing it right", and when it ends), the storm fort before a storm, and a low battery in daylight. During a storm with an empty battery it sends the crew to the shelter, because the shield can't run. The repair button names the job ("Start now: Rebuild the science lab").
- Tests in `tests/text.test.mjs`.

### Florian (14 Nov, ~21:00)
- Next to Sam's bubble there is a small button at the bottom right that seems to do nothing.
- When more lines wait, "1 more" / "2 more" at the bottom right of the bubble overlaps the text.

**Status: done** (branch `fix/sam-bubble`):
- **The button** is read-aloud: it reads Sam's line with the device's voice (for kids who are still learning to read). It worked, but its icon looked like a chat icon and nothing showed that it was reading. Now it is a speaker with the word "Listen", it lights up while it reads (also when "Read aloud" in the pause menu reads by itself), and a second tap stops it.
- **"1 more"** no longer sits on top of the text. It goes into the last line when there is room, otherwise onto its own line. Checked at 360, 390, 844×390 and 1280 wide, with and without a "New word" box.

### Florian (14 Nov, ~20:00)
- We mix microgray and microsievert. Using one or the other can make sense, but it should be explained somewhere.

**Status: done** (branch `fix/gray-sievert`): the Data sheet (µGy/h) and the Crew dose sheet (mSv) both have a "Gy or Sv?" line. Gray counts the energy the radiation leaves behind, sievert counts the harm to a body, and some kinds of radiation do more harm with the same energy. Each sheet says why it uses its unit: NASA's detector measures gray, NASA's limits for astronauts are in sieverts. Sources opened: Wikipedia "Sievert" (SI definition, dose equivalent = absorbed dose × factor), US NRC glossary "sievert (Sv)".

### Florian (14 Nov, ~19:00)
- Pause menu: tapping "Hints off" opens a big menu nobody wants. A big button with an "i" at the bottom does nothing. And it is not clear how to get back to the main menu.

**Status: done** (branch `fix/pause-menu`):
- **Cause:** the hints button and the "How it works" button shared a CSS class. The code wired the wrong one, so the hint switch opened the help sheet, and the real hint button stayed empty (only its "i" icon).
- **Now:** two clear switches, "Tips from Sam" and "Read aloud", each with On/Off. They only switch, nothing else opens. "How it works" is its own full-width button.
- **Leaving:** "Play this storm again" and "Main menu" (house icon) sit side by side, with the note "Both end this mission." The end screen's "All missions" button is also called "Main menu" now.

### Florian (14 Nov, ~18:00)
- The layout must work on every format (tablet, laptop, phone) and not look odd. Nothing should glitch or sit in the wrong place.

**Status: done** (branch `fix/layout-all-sizes`). Checked at 11 sizes, from 360×740 phones to 1920×1080, including phones held sideways and tablets both ways. Fixed:
- **Base hidden:** Sam's bubble and the repair buttons covered the base on phones and landscape tablets. The base now gets its own space between them, and Earth and the Sun stay above the roofs.
- **Repair buttons:** on phones they sit in one row above the bars. On landscape tablets, laptops and sideways phones they use the empty column on the right, so they never cover Earth.
- **Small phones (360 px):** the four bars stay in one row, and the building names shrink instead of overlapping.
- **Sideways phones:** smaller title and end-screen headings, so the buttons are in view.
- **Info sheets:** the first line no longer runs under the close button.

### Florian (14 Nov, ~17:00)
- The shield needs a lot of explaining. Tapping the shield icon should open an explanation, with sources and everything.

**Status: done** (branch `feat/numbers-explained`): "Shield" in the dock is now a button with an "i".
- The sheet shows every level side by side with today's real radiation: how much it blocks, the power it costs, and the dose it lets through each day.
- It explains how a magnet shield works (charged particles get pushed off course, like by Earth's magnetic field), why it needs power, and that no base has one yet.
- Real research: CERN test magnets for the SR2S project (2013–2015), and a NASA NIAC study of 8 m magnet rings.
- What protects astronauts today: walls and a storm shelter. The block and power numbers are named as game numbers, and the sources are listed.

### Florian (14 Nov, ~16:00)
- What does "10× radiation" mean? Which real number is behind it? The same for power, air and everything else. Numbers and percentages should be visible all the time, but never forced on you, and a tap should always give a short, friendly explanation.
- Small logic errors in the texts. The buildings have other names on the base than in their sheet, e.g. "Plants" vs "Greenhouse".

**Status: done** (branch `feat/numbers-explained`):
- Every bar and the radiation chip open a "What the numbers mean" box: what the number counts, what the rate means for the next days ("empty in about 4 days"), and how it is measured for real.
- Radiation: "278×" = today's NASA reading (1528 µGy/h) divided by a calm day (5.5 µGy/h), with µGy/h explained. Power and air bars now show their rate in %/day. Dose points are called a game number (1 point = about 4 calm days with the shield off), next to NASA's real career limit of 600 mSv.
- One name per building, the same on the base, in the sheets and in Sam's lines: Solar panels, Greenhouse, Home, Science lab, Shelter.
- An SI text audit (see below) found 24 more small errors. Fixed: battery in % also with a bigger battery, "Perfect mission" only without setbacks, block words that match the numbers, "1 days", the Shelter button during a forced stay, and more.

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

### Florian (14 Nov, ~16:15)
- The full-screen flash on every flare is just annoying. Removed.
- The radiation particles looked like rain, then like a "mini gun" from the Sun by day and from a corner at night. Now one steady stream, the same by day and night, with a label.
- It is not clear where the power goes: sometimes −6 a day, sometimes −12, then +15 in sunlight. Now the panels show what they make right now, and the intro adds up each building's power use.
- The game must pause during every repair. It already did; the HUD now says "Clock waits for you" while any sheet is open.
- Waiting five minutes for an event to test it is too slow. Now `?intro=dust` (or `leak`, `filter`, `storm`, `night`) jumps straight to that lesson.

### Florian (14 Nov, ~16:50)
- In the intro, the kid must place each building on the Moon. A button on the card that builds it is too easy to click through. Done: the card has no build button any more.
- Is the shield real? It is test tech (magnet shields are research only), so the intro now says so, and the new storm fort teaches what really protects astronauts: mass.
- Only three kinds of events exist (dust, leak, filter), and the shelter has none. Done for the shelter: the storm fort. Greenhouse and lab still only get leaks.

### Florian (14 Nov, ~17:15, on the phone)
- In the intro, repairs could still be started from a button on Sam's card. Now only the red button or the broken building works, like building.
- On a phone the base was tiny while the text was up. Now the card explains first ("OK, let me do it") and then shrinks to one line that says what to tap.
- The storm fort explained nothing: "no idea what I did or learned". Now it starts with a test (pillow, then water bag, in the particle stream), states the rule (light lets radiation through, heavy stops it), and shows before and after for the crew.
- Sam's text in the mini-games was cut off at the bottom of a small phone. Now it sits under the title in both mini-games, and both fit a 375×640 screen.
- "Cool, we have the lab, and now?" The intro now gives 40 training points and lets the kid build one upgrade.

### Florian (14 Nov, ~18:00)
- The "SI-generated placeholder art" line is removed. Team decision: the graphics are drawn by code and count as code, so they are labelled as code (`SI_DISCLOSURE.md`). The game holds no image files.
- On a phone, the top bar of the intro only held the sound button and cost a whole row. The button now sits on Sam's card.
- Earth looked like a beach ball. Redrawn at the same size with oceans, continents, clouds and a night side.
- "I still don't get the storm fort." It is now called storm wall, and says why it works: every particle bumps into the stuff in its way, so more stuff stops more particles.
- The first version of the filter mini-game could not be finished: the pulled-out filter sat invisibly on top of a button. Fixed, and both new mini-games now lead step by step (numbered steps, a "Tap" pointer on the next thing, the instruction in bold before the reason).

### Florian (14 Nov, ~18:25, on the phone)
- Mini-games started with something already pressed: the old filter fell out by itself, a wall panel was already tested in the leak game, the water bag was already chosen in the storm wall test.
- Cause (very likely, not seen on a real phone here): a touch on a building opens the mini-game, and the browser then sends a late click for the same spot, which pressed whatever lay there. Home is on the left and the shelter on the right, which matches what was pressed.
- Fix: every sheet ignores clicks for 0.45 s after it opens.

### Florian (14 Nov, ~18:40)
- On a phone held sideways the game looks bad: in the intro, Sam's card becomes a tall narrow column and its button is off the screen; the mini-games need scrolling.
- Decision: no landscape layout for phones. A phone on its side gets a note to hold it upright, with "Play sideways anyway" in case a device reports its shape wrongly. Tablets and computers keep the wide layout.

## Automatic SI review

Claude Code (SI) playing the game and reviewing it.

### SI text audit (Claude Code, 14 Nov, ~16:00)
Claude Code (SI) read every player-facing text and checked it against the rules and `config.js`. 24 findings. Fixed in `feat/numbers-explained`:
- **Wrong numbers:** "battery 130%" on Easy, "only on Max", "1 days", "blocks all" for 95 %, "half" for 60 %.
- **Wrong state:** a leaking greenhouse shown as "Sealed", "Recharging" at night, "Tap: back to work" while the crew must stay inside, "Safe" next to "High", the lab "Working fine" while the crew is in the shelter.
- **Wrong advice:** "Keep the crew in the shelter" when they are not in it, "get back to work" when they already work, "turn the shield down" when it is already off, "Another flare" for the first one.
- **Honest wording:** the shelter option says it turns the shield down to Low to save power, the storm report only praises the shelter when it was used, the bigger battery arrives charged.

Left open: three lines inside `overlays.js` next to the mini-game code (shield words on the cards, "Start this storm again" vs "Play this storm again"), to avoid merge conflicts with the dust mini-game.

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
- **Status: done** with the layout round (Florian, ~18:00): the base stands lower, Sam has his own strip at the bottom, and the repairs use the right column.

**P3: Look.** The placeholder art is clean, but the palette drifts to the common navy/purple look. The art direction is still open; see the research notes from 14 Nov:
- Real NASA images (SDO Sun, LRO Moon, Earth) for the sky and ground.
- Phosphor icons (MIT).
- Modules either placed by a human or labelled as SI.
