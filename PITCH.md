# Pitch: Moon Base Commander

The final pitch in one place: what we have, why it is good, what mattered to us, and a 90-second script.
Draft by Claude Code (SI) from our own docs (`GAME_DESIGN.md`, `RESEARCH.md`, `FEEDBACK.md`) and the storm data. The ideas are the team's. **Everything marked ✏️ needs our own words before the pitch.**

Time budget: **90 seconds planned, 2 minutes hard limit.** QR code on the last slide.

**Final version (15 Nov, after the mentor round):** the deck is `pitch/index.html`, the one slide for the judges is `pitch/team19-moon-base-commander.pptx` (we are team 19), and the script and jury questions are in "Final deck and script" and "Jury questions in depth" below. They replace the older slide plan and script in this file.

## The pitch in one sentence
Kids aged 7–12 run a Moon base for 30 days through a **real solar storm measured by NASA**, and every choice costs something: power against protection, safety against science.

**Tagline:** "Simple enough for a 7-year-old. One tap deep for everyone else."

## Our 3 main selling points (focus on these)

### 1. A real storm, not invented numbers
- **What:** five real solar storms from 2017 to 2024 are the Moon levels. Every flare, particle storm and radiation value comes from NASA, replayed day by day. A sixth storm (Nov 2025) is in our archive but not in the game: it was measured in deep space only.
- **Proof in the game:** the radiation chip shows "278× normal" on 14 May 2024. That is what NASA's LRO spacecraft measured near the Moon (1528 µGy/h against 5.5 on a calm day). Tap "Data" to see the real chart.
- **Why it matters:** the challenge asks for "real NASA open data, rather than invented statistics" and names DONKI and OSDR. We use both: DONKI for flares and particle storms, OSDR RadLab for the radiation.

### 2. Every choice costs something, and the game says why
- **What:** each decision shows its cost before the tap and its cause after.
  - **Shield:** a stronger shield costs power, and at night the battery can run dry.
  - **Shelter:** keeps the crew safe, but no science gets done.
  - **Spacewalk:** the panels get clean, but there is no shield outside.
- **Proof in the game:** shield buttons show "−3.5 ⚡/day". After a mistake, Sam the crewmate says what happened and what to try next time. There is no game over, only setbacks with a lesson.
- **Why it matters:** the challenge's core sentence is "no choice is free, and every decision teaches something true". That is our main mechanic, not a quiz on top.

### 3. Honest science, one tap deep
- **What:** kids see simple numbers and bars. Tap any of them and you get a short explanation, the real unit and the real-life fact.
- **Proof in the game:**
  - Tap "Shield": a table of every level with today's radiation. The sheet says no base has a magnet shield yet, and names the CERN and NASA research behind the idea.
  - Tap the dose bar: gray vs. sievert, and NASA's 600 mSv career limit.
- **Why it matters:** it is simple enough for a 7-year-old and deep enough for a jury. We always say what is real and what is a game rule.

## More strengths (for questions, or if there is time)
- **Communication delay you can feel:** "Call Earth" waits the real 2.6 seconds for a radio signal to reach the Moon and come back. Mission Control's answer gives a tip and the reason behind it.
- **The hands do the lesson (mini-games):**
  - Rub Moon dust off the solar panels.
  - Stack heavy supplies on the shelter wall: water and Moon soil stop particles, a pillow does not.
- **Life support loop (mentor feedback):** air and water are recycled like on the space station (98 % of the water). The oxygen machine splits water with power. Plants and an algae bioreactor help, but their lamps cost power.
- **Learned from an Apollo-era mentor:** Moon dust clogs the air filter, spacesuit facts, and the radiation limit of about one year on the Moon.
- **Built for kids:**
  - Read-aloud with the device's voice, for kids who are still learning to read.
  - Easy, Normal and Hard. An intro where kids place each building themselves.
  - Badges and stars, with no streaks and no pressure.
- **Works for everyone, right away:** runs in any phone browser. No install, no login, no personal data, a small download. The game plays without internet data from NASA, so venue Wi-Fi can't break it.
- **The same storm on the Moon, on Mars and on the space station:** in the May 2024 storm, the Moon peaked at 278× (14 May), Mars at 15× (20 May), and the space station stayed near 1×. Each is measured by NASA instruments; peaks can fall on different days.
- **A safe floor and a real ceiling:** Easy is built for a 7-year-old; Hard, 3 stars, badges and the data layer are for older kids and adults. Same game, two depths.

## If the jury asks: "Isn't the game too easy?" (backup slide 6)

**Short answer:** On Easy, yes, on purpose. And we measured it.

| Difficulty | Oct 2021 | May 2024 | Mar 2024 | Sep 2017 | Feb 2022 |
|------------|----------|----------|----------|----------|----------|
| Easy | 3 stars | 3 stars | 3 stars | 2 stars | 3 stars |
| Normal | 3 | 3 | 2 | 2 | 3 |
| Hard | 3 | 2 | 2 | 2 | 3 |

*Autopilot simulation (`node tools/autopilot_sim.mjs`): a player who never thinks. It calls Earth whenever it can, does what Mission Control says and fixes every repair at once. 5 seeds per cell, same stars each time. On Easy: no empty battery, no lost room.*

- **Why Easy is easy on purpose:** a 7-year-old should not learn "I failed". They should learn the steps, the words and the cause and effect: the shield costs power, the shelter stops science, a spacewalk costs dose. No mission ends below 1 star, and every mission ends with a debrief and a tip, never "you lost".
- **Help is not enough for the top score:** even with perfect help, the big storms (Mar 2024, Sep 2017, and May 2024 on Hard) stop at 2 stars. The third star needs your own timing: when to leave the shelter, when to save the battery.
- **The challenge is optional and visible:** 3 stars on Hard, all badges, or the "Solo commander" badge (3 stars without calling Earth). The end screen says how often Mission Control helped.
- **The contrast is the product:** a relaxed round is a few minutes, no stress. Reading and understanding every sheet (real units, instruments, sources, facts) takes much longer. Same game, two depths.
- **Real words, real instruments:** it teaches the words (solar flare, particle storm, radiation, micrometeoroid, CO₂ scrubber, spacewalk, magnetic field, atmosphere, magnet shield) and names real instruments and research (LRO CRaTER, Curiosity RAD, CERN SR2S, NASA NIAC).
- **One-liner:** "Easy is easy so a 7-year-old can learn without failing. The third star is hard so an older kid does not get bored. The same game holds both."

## What mattered to us ✏️
From our own rules (`AGENTS.md`, `RESEARCH.md`). Put this in our own words, and add one personal sentence each.
- **Teaching comes first.** If a child plays one mission and can't say why the crew goes to the shelter, we failed, however good the game looks.
- **Honest with kids.** Real data is labelled as archived, never as live. Made-up game numbers are called game numbers.
- **Safe for kids.** No accounts, no tracking, no dark patterns, no scary game over.
- **Feedback rounds:** two mentor rounds, an Apollo-era mentor and our own playtests. `FEEDBACK.md` lists every point and what we did about it.
- ✏️ *Why we picked this challenge, in one sentence (personal).*

## The 90-second script
About 210 spoken words. Read slowly; pauses are marked with "/".

| Time | Slide | Say |
|------|-------|-----|
| 0:00–0:12 | **1. Hook:** the May 2024 radiation chart, the Moon bar towering | "On the 14th of May 2024, a real solar storm hit the Moon. / NASA measured 278 times the normal radiation. / Imagine you are in charge of a Moon base that day. What do you do?" |
| 0:12–0:22 | **2. The problem** (one line of text) | "Space content for kids is often posters and facts, or far too complex. Kids never feel the trade-offs that real missions face." |
| 0:22–0:47 | **3. The game:** a short silent screen recording or 2 screenshots | "So we built Moon Base Commander. Kids aged 7 to 12 run a Moon base for 30 days, through a real storm from NASA's archive. / Raise the shield? It costs power, and at night the battery runs dry. Hide in the shelter? Safe, but no science gets done. Need help? Call Earth, and wait the real 2.6 seconds for the answer." |
| 0:47–1:17 | **4. Three points**, one line each | "Three things make it special. / One: real data. Five real Moon storms, from NASA DONKI and OSDR. No invented numbers. / Two: every choice costs something, and Sam, the crewmate, explains why. No game over, just lessons. / Three: honest science, one tap deep. Kids see simple numbers. Tap one, and you find the real unit and the source." |
| 1:17–1:30 | **5. QR code** + the game's link | "One rule came first for us: if kids don't learn, nothing else counts. / It runs on any phone. No install, no login. Scan the code and survive the storm yourself. Thank you!" |

✏️ If we pitch in German, translate the script but keep the numbers.
Backup slide 6 ("Isn't it too easy?") is for the difficulty question only. Do not spend the 90 seconds on it.

## Slides (5 + 1 backup, little text)
1. **Hook:** the real radiation chart of May 2024 (the in-game "Data" sheet or a clean chart from `data/storms/may2024.json`), with "278× normal radiation near the Moon, 14 May 2024" and "Data: NASA OSDR RadLab, LRO CRaTER".
2. **Problem:** one sentence, e.g. "Kids learn space facts. They never feel space trade-offs."
3. **The game:** a phone frame with gameplay. A storm day with the shield buttons and their costs, plus the storm wall mini-game.
4. **Three points:** Real storm · Every choice costs · One tap deep. One icon or screenshot each. For "one tap deep", two screenshots side by side work best: the simple bars on the left ("how a 7-year-old plays"), the Data or Shield sheet on the right ("one tap later: the real version"). Caption: "Every number is a door."
5. **QR code:** "Play now, on your phone", the URL https://biobirne.github.io/SpaceApp26-Alpha-Centauri-First/ and the team name. Leave it up during questions.
6. **Backup, "Isn't it too easy?":** the autopilot table (help alone gets 3 stars on most Easy storms, but only 2 on the big ones), the 1-star floor and the two depths. Show only if asked.

No NASA logos on any slide (Space Apps rule). If a slide uses SI-made images, they need a visible watermark. Screenshots of our own game are fine.

## Demo or slides?
**Recommendation: slides with a 15–20 s screen recording on slide 3, no live demo.**
- In 90 seconds, a live demo eats the time: loading, Wi-Fi, a wrong tap.
- A recording has a fixed length and always shows the best moment: the storm arrives, the kid raises the shield, the battery drops, and they go to the shelter.
- The QR code is the live demo: judges can play on their own phone during or after the questions.
- Bring a phone with the game already open as a backup for questions.

## Questions the jury might ask (short answers)
| Question | Answer |
|----------|--------|
| Isn't it too easy? | On Easy, yes — on purpose. A 7-year-old should learn the steps and the words, not "I failed". The challenge is optional: 3 stars on Hard, all badges, or 3 stars without calling Earth. A simulated player who only follows Mission Control gets 3 stars on most Easy storms, but only 2 on the big ones. See "If the jury asks..." and backup slide 6. |
| Is the data live? | No. These are archived NASA measurements from five real storms, and the game says so. NASA's radiation archive ends in November 2025. A live month from DONKI is possible (the API works from the browser), but we did not build it. |
| Do magnet shields exist? | Not on any base yet. Scientists are testing the idea (CERN's SR2S project, NASA NIAC studies). The game calls it test tech, and the shield sheet says so with sources. Real protection today is mass: water, Moon soil and a shelter. That is what the storm wall mini-game teaches. |
| Where are food and Mars? | Plants and algae are part of the life support loop. Food has no extra bar, because the challenge itself advises 2–3 core resources. Mars is in the data: the end screen compares the same storm on the Moon, on Mars and on the space station. The game itself stays on the Moon, so it can do one place well. |
| How do you know kids learn? | Five learning goals (`RESEARCH.md`, section 0). Kids learn by doing, and the game explains each step, without a quiz. ✏️ Add what our playtests showed. |
| Did you use SI? | Yes, for code and research, and it is all disclosed (`SI_USAGE.md`, `si-manifest.json`). The ideas and decisions are ours. No SI-generated images in the game. |
| Why the Moon? | It has no air and no magnetic field. In September 2017, radiation there reached about 1800× normal. And kids can see the Moon from home. |

## Final deck and script
**Our pitch in one line: "One game for every kid: low floor, high ceiling, wide walls."** The idea comes from Seymour Papert and Mitchel Resnick (MIT Media Lab, Scratch) and is already in `GAME_DESIGN.md`. Said out loud: "A 7-year-old can't lose, and a 12-year-old can't run out of things to learn."

**Running the deck:** `python3 tools/serve.py 8000`, then open http://localhost:8000/pitch/ on the laptop.
- One click per slide: left click, →, Space or PageDown. Back: right click or ←. F: full screen. R: replay the slide's demo.
- The demos start by themselves. The Apollo 13 slide runs the real mini-game.

**The 7 slides and what we say** (about 90 seconds; Florian 1–3, Cornelius 4–7):

| # | Slide | Say |
|---|-------|-----|
| 1 | Title, "One game for every kid: low floor, high ceiling, wide walls" | "We're Alpha Centauri First, and this is Moon Base Commander, a mission trainer for kids aged 7 to 12." |
| 2 | Problem: 7 vs. 12 | "But 7 and 12 are worlds apart. A 7-year-old is still learning to read. A 12-year-old wants the real data. Most learning games pick one, and lose the other. We built one game for both." |
| 3 | Real storm, 278× | "It starts with something real. On 14 May 2024, radiation near the Moon hit 278 times normal, measured by NASA. Every level is a real storm like this, replayed day by day." |
| 4 | Low floor: Call Earth demo | "Low floor: anyone can start, nobody loses. No game over. Sam reads aloud and explains every mistake. Stuck? Call Earth, and wait 2.6 seconds, the real speed of light." |
| 5 | Wide walls: Apollo 13 mini-game | "Wide walls: there's so much to explore. Kids build their own base and fix it with their hands. Like Apollo 13: the square filter that didn't fit the round hole. Kids build the same fix." |
| 6 | High ceiling: one tap to the real data | "High ceiling: every number is a door. One tap, and you see the real NASA measurement. And three stars are hard: just following Mission Control isn't enough." |
| 7 | One game for every kid | "Low floor, high ceiling, wide walls. A 7-year-old can't lose, and a 12-year-old can't run out of things to learn. Free, on any phone. Thank you." |

If we run over 90 seconds, cut slide 5 first. ✏️ The kid feedback goes on slide 7 as a quote once we have it (a hidden line is ready in `pitch/index.html`).

## Jury questions in depth
Short spoken answers. Every fact is checked against the code or `data/README.md`.

### NASA data
| Question | Answer |
|----------|--------|
| How exactly do you use NASA data? | Two NASA sources. **OSDR RadLab** gives the real radiation, measured every day by spacecraft: LRO's CRaTER at the Moon, Curiosity's RAD on Mars, DosTel on the space station. **DONKI** from NASA's CCMC gives the space weather: every solar flare and particle storm with its exact time. A script (`tools/build_storm_library.py`) downloads both, and the game replays them day by day. |
| What does the data change in the game? | The radiation each day *is* the danger level: the crew's dose depends on that day's measured value and on the shield and shelter. DONKI's flares and particle storms become the events: the first X-class flare and every new record flare bring a decision card, and particle storms bring a warning. Day and night on the Moon are calculated for the real dates too. |
| What does 278× mean? | On 14 May 2024, CRaTER measured 1,528 microgray per hour near the Moon. A calm day there is about 5.5. That is 278 times normal. Kids see "278×", and one tap shows the real unit and the instrument. |
| How do you define "normal"? | The quiet level of that month: the 25th percentile of the daily means in the 30-day window. We only compare a site with itself, because the instruments measure in different materials, so absolute values are not directly comparable between places. |
| Is it live? | No, and the game says so: "Archived NASA measurements". RadLab can't be called from a browser, and its archive ends in November 2025. DONKI can be fetched live from the browser, so a live month is a clear next step, but we did not build it. |
| Why these five storms? | Each teaches something different. September 2017 hit the Moon with about 1800× while Mars barely noticed. February 2022 hit Mars and missed the Moon. May 2024 was the strongest storm on Earth in 20 years. |
| Moon orbit or Moon surface? | CRaTER flies in orbit. On the surface it is about half, because the Moon blocks half the sky. The data sheet in the game says so. |
| Are Mars and the ISS just decoration? | No, they are a lesson: the same storm in three places. 278× at the Moon, 15× on Mars, about 1× on the space station. Earth's magnetic field protects the ISS, Mars has a thin atmosphere, the Moon has neither. |

### Learning and kids
| Question | Answer |
|----------|--------|
| How do you know kids learn? | Five learning goals, such as "Thick walls protect you, so the crew hides in the shelter" (`RESEARCH.md`, section 0). The game checks through actions, not a quiz: does the kid go to the shelter on the second storm without being told? ✏️ Add the kid feedback once we have it. Don't claim kid tests we haven't done. |
| Isn't it too easy if you can't lose? | Easy is easy on purpose, so a 7-year-old learns instead of failing. But three stars are hard: a simulated player who only follows Mission Control gets just two stars on the big storms (`tools/autopilot_sim.mjs`). |
| Why "low floor, high ceiling, wide walls"? | It is a learning-design principle from Seymour Papert and Mitchel Resnick at the MIT Media Lab, the idea behind Scratch. Kids aged 7 and 12 are very different, so one game has to work for both. |
| What about kids who can't read yet? | Sam's lines are read aloud with the device's own voice, there are pictures, and every new word gets a kid definition the first time. |

### Science and realism
| Question | Answer |
|----------|--------|
| Is the 2.6 seconds real? | Yes. The Moon is about 384,000 km away, so radio needs about 1.3 seconds each way. |
| Moon dust? | Sharp and sticky, bad for machines and lungs. In the game it covers the solar panels; cleaning them means a spacewalk without the shield, and dust carried inside can clog the air filter. |
| Why the Moon and not Mars? | The Moon has no air and no magnetic field, so it takes the full blast. NASA is going back with Artemis, and kids can see the Moon from their window. Mars stays in the game through the comparison. |
| Backup story for the Apollo veteran | Apollo 11: on 5 July 1969, a simulation supervisor set off a 1201 computer alarm in a practice landing, and Mission Control aborted, which was the wrong call. On the real landing the alarms came again, and they knew: "We're go on that alarm." Learning by failing safely. Sources: Smithsonian Air & Space, "Troubleshooting 101 (1201 actually, and 1202 too)"; Monash University, "Koos control" (2019). |

### Technology
| Question | Answer |
|----------|--------|
| How is it built? | A static website: plain JavaScript, Phaser 3 for the Moon scene, no backend. It runs on GitHub Pages, on any phone or laptop. |
| Privacy? | No login, no accounts, no tracking. Progress is saved only in the browser on the device. |
| How do you know the rules are right? | The rules are separate from the graphics and covered by automatic tests (`npm test`). An autopilot simulation plays every storm to check the difficulty. |

### Why, and what next
| Question | Answer |
|----------|--------|
| Why did you build this? | Space is the strongest motivation kids have for science, and most space-learning tools are quizzes or videos. We wanted kids to make decisions with real stakes and learn from what happens. |
| What's next? | ✏️ Only say what we really plan. Ideas: a live month from DONKI, a teacher guide for classrooms, more languages starting with German. |
| Impact? | Free, no install, no login, any phone: any classroom can use it tomorrow. |

## Fact check (numbers in this pitch)
| Number | Where it comes from |
|--------|---------------------|
| 278× normal near the Moon on 14 May 2024 (1528 µGy/h, calm 5.49) | `data/storms/may2024.json`, NASA OSDR RadLab, LRO CRaTER |
| about 1800× normal (1778×) on 11 Sep 2017 | `data/storms/sep2017.json`, same source |
| Mars 15× (20 May 2024), space station about 1× | `data/storms/may2024.json`, Curiosity RAD and ISS DosTel |
| 2.6 s radio round trip Earth–Moon | `GAME_DESIGN.md`, "Real vs. game rules" |
| 98 % water recycling on the space station | `GAME_DESIGN.md`, NASA 2023 |
| NASA career limit 600 mSv | `src/ui/numbers.js` (NASA-STD-3001) |
| Five storms in the game, 2017–2024 (a sixth, Nov 2025, is in `data/storms/` but not played) | `data/storms/`, `src/progress.js` |
| Autopilot table on backup slide 6 | `node tools/autopilot_sim.mjs` |

## Still to do before the pitch ✏️
- [ ] Fill in the ✏️ parts in our own words.
- [ ] Decide on the language (English or German).
- [ ] Record the 15–20 s clip and take screenshots once the design is final.
- [ ] Make the QR code from the game URL and test it with two phones.
- [ ] Rehearse with a timer. Aim for 1:30; cut a "More strengths" point rather than speaking faster.
